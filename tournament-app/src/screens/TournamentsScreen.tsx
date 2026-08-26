import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
} from 'react-native';
import { supabase } from '../config/supabase';
import { Tournament } from '../types';

export default function TournamentsScreen({ navigation }: any) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'past'>('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, [filter]);

  async function fetchTournaments() {
    let query = supabase.from('tournaments').select('*');

    if (filter === 'active') {
      query = query.eq('status', 'in_progress');
    } else if (filter === 'upcoming') {
      query = query.eq('status', 'registration_open');
    } else if (filter === 'past') {
      query = query.eq('status', 'completed');
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data } = await query.order('created_at', { ascending: false });
    if (data) setTournaments(data);
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchTournaments();
    setRefreshing(false);
  }

  function renderTournament({ item }: { item: Tournament }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('TournamentDetail', { tournamentId: item.id })}
      >
        {item.banner_url && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Banner Image</Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardGame}>{item.game_type}</Text>
          <Text style={styles.cardFormat}>{item.format.replace('_', ' ')}</Text>
          <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
            <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function getStatusStyle(status: string) {
    switch (status) {
      case 'in_progress':
        return styles.statusActive;
      case 'registration_open':
        return styles.statusUpcoming;
      case 'completed':
        return styles.statusPast;
      default:
        return styles.statusDraft;
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tournaments</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tournaments..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchTournaments}
        />
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'active', 'upcoming', 'past'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={tournaments}
        renderItem={renderTournament}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  filterActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    color: '#374151',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  banner: {
    height: 120,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerText: {
    color: '#6B7280',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  cardGame: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  cardFormat: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusUpcoming: {
    backgroundColor: '#DBEAFE',
  },
  statusPast: {
    backgroundColor: '#E5E7EB',
  },
  statusDraft: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    color: '#374151',
    textTransform: 'capitalize',
  },
});

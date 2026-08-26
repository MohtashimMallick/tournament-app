import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { Post, Tournament } from '../types';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    // Fetch recent posts
    const { data: postsData } = await supabase
      .from('posts')
      .select('*, author:users(*), tournament:tournaments(*)')
      .order('created_at', { ascending: false })
      .limit(20);

    if (postsData) setPosts(postsData);

    // Fetch user's tournaments
    const { data: tournamentData } = await supabase
      .from('tournament_participants')
      .select('tournament:tournaments(*)')
      .eq('user_id', user?.id)
      .limit(5);

    if (tournamentData) {
      setTournaments(tournamentData.map((t) => t.tournament).filter(Boolean));
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }

  function renderPost({ item }: { item: Post }) {
    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.author?.name?.charAt(0) || '?'}
            </Text>
          </View>
          <View style={styles.postMeta}>
            <Text style={styles.postAuthor}>{item.author?.name}</Text>
            <Text style={styles.postTime}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <Text style={styles.postText}>{item.text}</Text>
        {item.tournament && (
          <View style={styles.tournamentTag}>
            <Text style={styles.tournamentTagText}>
              {item.tournament.name}
            </Text>
          </View>
        )}
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>Like ({item.likes_count})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>Comment ({item.comments_count})</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderTournament({ item }: { item: Tournament }) {
    return (
      <TouchableOpacity
        style={styles.tournamentCard}
        onPress={() => navigation.navigate('TournamentDetail', { tournamentId: item.id })}
      >
        <Text style={styles.tournamentName}>{item.name}</Text>
        <Text style={styles.tournamentGame}>{item.game_type}</Text>
        <View style={[styles.statusBadge, item.status === 'in_progress' && styles.statusActive]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          tournaments.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Tournaments</Text>
              <FlatList
                data={tournaments}
                renderItem={renderTournament}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          ) : null
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
  listContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  tournamentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  tournamentGame: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 12,
    color: '#374151',
    textTransform: 'capitalize',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  postMeta: {
    marginLeft: 12,
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  postTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  postText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  tournamentTag: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  tournamentTagText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  postActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    marginRight: 24,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

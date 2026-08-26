import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { supabase } from '../config/supabase';
import { Standing, Tournament } from '../types';
import { calculateStandings } from '../utils/tournament';

export default function StandingsScreen({ route, navigation }: any) {
  const { tournamentId } = route.params;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);

  useEffect(() => {
    fetchStandings();
  }, [tournamentId]);

  async function fetchStandings() {
    const { data: tournamentData } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentData) setTournament(tournamentData);

    const { data: matchesData } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('stage', 'round_robin')
      .eq('status', 'completed');

    const { data: participantsData } = await supabase
      .from('tournament_participants')
      .select('*')
      .eq('tournament_id', tournamentId);

    if (matchesData && participantsData && tournamentData) {
      const calculatedStandings = calculateStandings(
        matchesData,
        participantsData,
        tournamentData.rules_json
      );
      setStandings(calculatedStandings);
    }
  }

  function renderStanding({ item, index }: { item: Standing; index: number }) {
    const isQualified = tournament?.rules_json.qualifiersCount
      ? item.rank <= tournament.rules_json.qualifiersCount
      : false;

    return (
      <View style={[styles.row, isQualified && styles.qualifiedRow]}>
        <Text style={[styles.rank, isQualified && styles.qualifiedRank]}>{item.rank}</Text>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>Player {item.user_id.slice(0, 8)}</Text>
          <Text style={[styles.qualificationStatus, isQualified && styles.qualifiedStatus]}>
            {isQualified ? 'Qualified' : 'Eliminated'}
          </Text>
        </View>
        <Text style={styles.stat}>{item.played}</Text>
        <Text style={styles.stat}>{item.won}</Text>
        <Text style={styles.stat}>{item.lost}</Text>
        <Text style={styles.stat}>{item.games_won}</Text>
        <Text style={styles.stat}>{item.games_lost}</Text>
        <Text style={[styles.stat, styles.gameDiff, item.game_diff > 0 && styles.positiveDiff, item.game_diff < 0 && styles.negativeDiff]}>
          {item.game_diff > 0 ? '+' : ''}{item.game_diff}
        </Text>
        <Text style={[styles.stat, styles.points]}>{item.points}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Standings</Text>
        <Text style={styles.tournamentName}>{tournament?.name}</Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.rankHeader]}>#</Text>
        <Text style={[styles.headerCell, styles.playerHeader]}>Player</Text>
        <Text style={styles.headerCell}>P</Text>
        <Text style={styles.headerCell}>W</Text>
        <Text style={styles.headerCell}>L</Text>
        <Text style={styles.headerCell}>GW</Text>
        <Text style={styles.headerCell}>GL</Text>
        <Text style={styles.headerCell}>GD</Text>
        <Text style={[styles.headerCell, styles.pointsHeader]}>Pts</Text>
      </View>

      <FlatList
        data={standings}
        renderItem={renderStanding}
        keyExtractor={(item) => item.user_id}
        scrollEnabled={false}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.qualifiedDot]} />
          <Text style={styles.legendText}>Qualified</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.eliminatedDot]} />
          <Text style={styles.legendText}>Eliminated</Text>
        </View>
      </View>
    </ScrollView>
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
  backButton: {
    fontSize: 16,
    color: '#3B82F6',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  tournamentName: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  headerCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  rankHeader: {
    flex: 0.5,
  },
  playerHeader: {
    flex: 2,
    textAlign: 'left',
  },
  pointsHeader: {
    flex: 0.8,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 2,
    alignItems: 'center',
  },
  qualifiedRow: {
    backgroundColor: '#F0FDF4',
  },
  rank: {
    flex: 0.5,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  qualifiedRank: {
    color: '#10B981',
  },
  playerInfo: {
    flex: 2,
  },
  playerName: {
    fontSize: 14,
    color: '#1F2937',
  },
  qualificationStatus: {
    fontSize: 10,
    color: '#EF4444',
    marginTop: 2,
  },
  qualifiedStatus: {
    color: '#10B981',
  },
  stat: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  gameDiff: {
    fontWeight: '500',
  },
  positiveDiff: {
    color: '#10B981',
  },
  negativeDiff: {
    color: '#EF4444',
  },
  points: {
    flex: 0.8,
    fontWeight: '600',
    color: '#3B82F6',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    padding: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  qualifiedDot: {
    backgroundColor: '#10B981',
  },
  eliminatedDot: {
    backgroundColor: '#EF4444',
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

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
import { useAuth } from '../context/AuthContext';
import { Tournament, Match, Standing, TournamentParticipant } from '../types';
import { calculateStandings } from '../utils/tournament';

export default function TournamentDetailScreen({ route, navigation }: any) {
  const { tournamentId } = route.params;
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'standings' | 'bracket' | 'players'>('matches');

  useEffect(() => {
    fetchTournamentData();
  }, [tournamentId]);

  async function fetchTournamentData() {
    // Fetch tournament
    const { data: tournamentData } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentData) setTournament(tournamentData);

    // Fetch matches
    const { data: matchesData } = await supabase
      .from('matches')
      .select('*, player_a:users!player_a_id(*), player_b:users!player_b_id(*)')
      .eq('tournament_id', tournamentId)
      .order('round')
      .order('match_number');

    if (matchesData) {
      setMatches(matchesData);
      // Calculate standings
      if (tournamentData) {
        const calculatedStandings = calculateStandings(
          matchesData,
          participants,
          tournamentData.rules_json
        );
        setStandings(calculatedStandings);
      }
    }

    // Fetch participants
    const { data: participantsData } = await supabase
      .from('tournament_participants')
      .select('*, user:users(*)')
      .eq('tournament_id', tournamentId);

    if (participantsData) setParticipants(participantsData);
  }

  function renderMatch({ item }: { item: Match }) {
    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => navigation.navigate('MatchDetail', { matchId: item.id, tournamentId })}
      >
        <View style={styles.matchHeader}>
          <Text style={styles.roundText}>Round {item.round}</Text>
          <Text style={styles.matchNumber}>Match {item.match_number}</Text>
        </View>
        <View style={styles.matchPlayers}>
          <View style={styles.player}>
            <Text style={styles.playerName}>{item.player_a?.name || 'TBD'}</Text>
            {item.winner_id === item.player_a_id && <Text style={styles.winnerBadge}>W</Text>}
          </View>
          <Text style={styles.vsText}>vs</Text>
          <View style={styles.player}>
            <Text style={styles.playerName}>{item.player_b?.name || 'TBD'}</Text>
            {item.winner_id === item.player_b_id && <Text style={styles.winnerBadge}>W</Text>}
          </View>
        </View>
        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  function renderStanding({ item }: { item: Standing }) {
    return (
      <View style={styles.standingRow}>
        <Text style={styles.rank}>{item.rank}</Text>
        <Text style={styles.standingName}>Player {item.user_id.slice(0, 8)}</Text>
        <Text style={styles.standingStat}>{item.played}</Text>
        <Text style={styles.standingStat}>{item.won}</Text>
        <Text style={styles.standingStat}>{item.lost}</Text>
        <Text style={styles.standingStat}>{item.games_won}</Text>
        <Text style={styles.standingStat}>{item.games_lost}</Text>
        <Text style={styles.standingStat}>{item.game_diff}</Text>
        <Text style={[styles.standingStat, styles.points]}>{item.points}</Text>
      </View>
    );
  }

  function getStatusStyle(status: string) {
    switch (status) {
      case 'completed':
        return styles.statusCompleted;
      case 'in_progress':
        return styles.statusInProgress;
      default:
        return styles.statusScheduled;
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tournament?.name}</Text>
        <Text style={styles.gameType}>{tournament?.game_type}</Text>
      </View>

      <View style={styles.tabContainer}>
        {(['matches', 'standings', 'bracket', 'players'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'matches' && (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {activeTab === 'standings' && (
        <View style={styles.standingsContainer}>
          <View style={styles.standingsHeader}>
            <Text style={styles.standingHeaderText}>#</Text>
            <Text style={[styles.standingHeaderText, styles.standingNameHeader]}>Player</Text>
            <Text style={styles.standingHeaderText}>P</Text>
            <Text style={styles.standingHeaderText}>W</Text>
            <Text style={styles.standingHeaderText}>L</Text>
            <Text style={styles.standingHeaderText}>GW</Text>
            <Text style={styles.standingHeaderText}>GL</Text>
            <Text style={styles.standingHeaderText}>GD</Text>
            <Text style={[styles.standingHeaderText, styles.points]}>Pts</Text>
          </View>
          <FlatList
            data={standings}
            renderItem={renderStanding}
            keyExtractor={(item) => item.user_id}
            scrollEnabled={false}
          />
        </View>
      )}

      {activeTab === 'bracket' && (
        <TouchableOpacity
          style={styles.bracketButton}
          onPress={() => navigation.navigate('BracketView', { tournamentId })}
        >
          <Text style={styles.bracketButtonText}>View Bracket</Text>
        </TouchableOpacity>
      )}

      {activeTab === 'players' && (
        <View style={styles.playersContainer}>
          {participants.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.playerCard}
              onPress={() => navigation.navigate('PlayerProfile', { userId: p.user_id })}
            >
              <View style={styles.playerAvatar}>
                <Text style={styles.playerAvatarText}>
                  {p.user?.name?.charAt(0) || '?'}
                </Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerCardName}>{p.user?.name}</Text>
                <Text style={styles.playerCardUsername}>@{p.user?.username}</Text>
              </View>
              <View style={[styles.statusBadge, p.status === 'qualified' && styles.statusQualified]}>
                <Text style={styles.statusText}>{p.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
  gameType: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  matchCard: {
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
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  roundText: {
    fontSize: 12,
    color: '#6B7280',
  },
  matchNumber: {
    fontSize: 12,
    color: '#6B7280',
  },
  matchPlayers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  player: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  winnerBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10B981',
    marginLeft: 8,
  },
  vsText: {
    fontSize: 14,
    color: '#6B7280',
    marginHorizontal: 12,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusInProgress: {
    backgroundColor: '#FEF3C7',
  },
  statusScheduled: {
    backgroundColor: '#E5E7EB',
  },
  statusText: {
    fontSize: 12,
    color: '#374151',
    textTransform: 'capitalize',
  },
  standingsContainer: {
    padding: 16,
  },
  standingsHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  standingHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  standingNameHeader: {
    flex: 2,
    textAlign: 'left',
  },
  standingRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  rank: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  standingName: {
    flex: 2,
    fontSize: 14,
    color: '#1F2937',
  },
  standingStat: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  points: {
    fontWeight: '600',
    color: '#3B82F6',
  },
  bracketButton: {
    backgroundColor: '#3B82F6',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  bracketButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  playersContainer: {
    padding: 16,
  },
  playerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  playerCardUsername: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusQualified: {
    backgroundColor: '#D1FAE5',
  },
});

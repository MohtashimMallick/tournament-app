import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { supabase } from '../config/supabase';
import { User, Tournament, Match } from '../types';

export default function PlayerProfileScreen({ route, navigation }: any) {
  const { userId } = route.params;
  const [player, setPlayer] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    fetchPlayerData();
  }, [userId]);

  async function fetchPlayerData() {
    // Fetch player info
    const { data: playerData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (playerData) setPlayer(playerData);

    // Fetch player's matches
    const { data: matchesData } = await supabase
      .from('matches')
      .select('*, player_a:users!player_a_id(*), player_b:users!player_b_id(*)')
      .or(`player_a_id.eq.${userId},player_b_id.eq.${userId}`)
      .eq('status', 'completed');

    if (matchesData) setMatches(matchesData);

    // Fetch player's tournaments
    const { data: tournamentData } = await supabase
      .from('tournament_participants')
      .select('tournament:tournaments(*)')
      .eq('user_id', userId);

    if (tournamentData) {
      setTournaments(tournamentData.map((t) => t.tournament).filter(Boolean));
    }
  }

  function getWinLossRecord() {
    let wins = 0;
    let losses = 0;

    for (const match of matches) {
      if (match.winner_id === userId) {
        wins++;
      } else {
        losses++;
      }
    }

    return { wins, losses };
  }

  const record = getWinLossRecord();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {player?.name?.charAt(0) || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{player?.name}</Text>
        <Text style={styles.username}>@{player?.username}</Text>
        {player?.bio && <Text style={styles.bio}>{player.bio}</Text>}
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{record.wins}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{record.losses}</Text>
          <Text style={styles.statLabel}>Losses</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{tournaments.length}</Text>
          <Text style={styles.statLabel}>Tournaments</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Matches</Text>
        {matches.slice(0, 5).map((match) => (
          <View key={match.id} style={styles.matchCard}>
            <View style={styles.matchInfo}>
              <Text style={styles.matchOpponent}>
                vs {match.player_a_id === userId
                  ? match.player_b?.name
                  : match.player_a?.name}
              </Text>
              <Text style={styles.matchResult}>
                {match.winner_id === userId ? 'W' : 'L'}
              </Text>
            </View>
            <View style={styles.matchScores}>
              {match.games_json.map((game, index) => (
                <Text key={index} style={styles.gameScore}>
                  {match.player_a_id === userId
                    ? `${game.a_score}-${game.b_score}`
                    : `${game.b_score}-${game.a_score}`}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tournaments</Text>
        {tournaments.map((tournament) => (
          <TouchableOpacity
            key={tournament.id}
            style={styles.tournamentCard}
            onPress={() => navigation.navigate('TournamentDetail', { tournamentId: tournament.id })}
          >
            <Text style={styles.tournamentName}>{tournament.name}</Text>
            <Text style={styles.tournamentGame}>{tournament.game_type}</Text>
          </TouchableOpacity>
        ))}
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
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '600',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  username: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  bio: {
    fontSize: 14,
    color: '#374151',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  statCard: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
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
  matchInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchOpponent: {
    fontSize: 16,
    color: '#1F2937',
  },
  matchResult: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  matchScores: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  gameScore: {
    fontSize: 14,
    color: '#6B7280',
  },
  tournamentCard: {
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
});

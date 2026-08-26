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
import { Match, GameScore } from '../types';

export default function MatchDetailScreen({ route, navigation }: any) {
  const { matchId, tournamentId } = route.params;
  const [match, setMatch] = useState<Match | null>(null);

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  async function fetchMatch() {
    const { data } = await supabase
      .from('matches')
      .select('*, player_a:users!player_a_id(*), player_b:users!player_b_id(*)')
      .eq('id', matchId)
      .single();

    if (data) setMatch(data);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Match Details</Text>
        <Text style={styles.matchNumber}>Match {match?.match_number}</Text>
      </View>

      {match && (
        <View style={styles.content}>
          <View style={styles.playersContainer}>
            <View style={styles.playerCard}>
              <View style={styles.playerAvatar}>
                <Text style={styles.playerAvatarText}>
                  {match.player_a?.name?.charAt(0) || '?'}
                </Text>
              </View>
              <Text style={styles.playerName}>{match.player_a?.name || 'TBD'}</Text>
              {match.winner_id === match.player_a_id && (
                <View style={styles.winnerBadge}>
                  <Text style={styles.winnerText}>WINNER</Text>
                </View>
              )}
            </View>

            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{match.status}</Text>
              </View>
            </View>

            <View style={styles.playerCard}>
              <View style={styles.playerAvatar}>
                <Text style={styles.playerAvatarText}>
                  {match.player_b?.name?.charAt(0) || '?'}
                </Text>
              </View>
              <Text style={styles.playerName}>{match.player_b?.name || 'TBD'}</Text>
              {match.winner_id === match.player_b_id && (
                <View style={styles.winnerBadge}>
                  <Text style={styles.winnerText}>WINNER</Text>
                </View>
              )}
            </View>
          </View>

          {match.games_json.length > 0 && (
            <View style={styles.gamesSection}>
              <Text style={styles.sectionTitle}>Game Scores</Text>
              {match.games_json.map((game, index) => (
                <View key={index} style={styles.gameRow}>
                  <Text style={styles.gameNumber}>Game {game.game}</Text>
                  <View style={styles.scoreContainer}>
                    <Text style={[styles.score, game.a_score > game.b_score && styles.winningScore]}>
                      {game.a_score}
                    </Text>
                    <Text style={styles.scoreSeparator}>-</Text>
                    <Text style={[styles.score, game.b_score > game.a_score && styles.winningScore]}>
                      {game.b_score}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {match.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{match.notes}</Text>
            </View>
          )}

          {match.status === 'scheduled' && (
            <TouchableOpacity
              style={styles.enterScoreButton}
              onPress={() => navigation.navigate('ScoreEntry', { matchId, tournamentId })}
            >
              <Text style={styles.enterScoreButtonText}>Enter Score</Text>
            </TouchableOpacity>
          )}
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
  matchNumber: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  playerCard: {
    alignItems: 'center',
    flex: 1,
  },
  playerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerAvatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '600',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    textAlign: 'center',
  },
  winnerBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  winnerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  vsContainer: {
    alignItems: 'center',
  },
  vsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  statusBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#374151',
    textTransform: 'capitalize',
  },
  gamesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  gameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  gameNumber: {
    fontSize: 14,
    color: '#6B7280',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  score: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  winningScore: {
    color: '#10B981',
  },
  scoreSeparator: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  notesSection: {
    marginBottom: 24,
  },
  notesText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  enterScoreButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  enterScoreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

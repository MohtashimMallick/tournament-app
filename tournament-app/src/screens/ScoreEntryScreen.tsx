import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { supabase } from '../config/supabase';
import { Match, GameScore, Tournament } from '../types';
import { determineMatchWinner } from '../utils/tournament';

export default function ScoreEntryScreen({ route, navigation }: any) {
  const { matchId, tournamentId } = route.params;
  const [match, setMatch] = useState<Match | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [games, setGames] = useState<GameScore[]>([
    { game: 1, a_score: 0, b_score: 0 },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [matchId]);

  async function fetchData() {
    const { data: matchData } = await supabase
      .from('matches')
      .select('*, player_a:users!player_a_id(*), player_b:users!player_b_id(*)')
      .eq('id', matchId)
      .single();

    if (matchData) {
      setMatch(matchData);
      if (matchData.games_json.length > 0) {
        setGames(matchData.games_json);
      }
    }

    const { data: tournamentData } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentData) setTournament(tournamentData);
  }

  function updateScore(gameIndex: number, player: 'a' | 'b', value: string) {
    const newGames = [...games];
    const score = parseInt(value) || 0;

    if (player === 'a') {
      newGames[gameIndex].a_score = score;
    } else {
      newGames[gameIndex].b_score = score;
    }

    setGames(newGames);
  }

  function addGame() {
    setGames([...games, { game: games.length + 1, a_score: 0, b_score: 0 }]);
  }

  function removeGame(index: number) {
    if (games.length > 1) {
      const newGames = games.filter((_, i) => i !== index);
      // Renumber games
      newGames.forEach((g, i) => (g.game = i + 1));
      setGames(newGames);
    }
  }

  async function handleSubmit() {
    if (!match || !tournament) return;

    // Validate scores
    const hasEmptyScores = games.some((g) => g.a_score === 0 && g.b_score === 0);
    if (hasEmptyScores) {
      Alert.alert('Error', 'Please enter scores for all games');
      return;
    }

    setLoading(true);

    try {
      const result = determineMatchWinner(games, tournament.rules_json.matchFormat);

      let winnerId = null;
      if (result.winner === 'a') winnerId = match.player_a_id;
      else if (result.winner === 'b') winnerId = match.player_b_id;

      const { error } = await supabase
        .from('matches')
        .update({
          games_json: games,
          winner_id: winnerId,
          status: 'completed',
        })
        .eq('id', matchId);

      if (error) throw error;

      // Create system post for match result
      if (winnerId) {
        const winnerName = winnerId === match.player_a_id
          ? match.player_a?.name
          : match.player_b?.name;
        const loserName = winnerId === match.player_a_id
          ? match.player_b?.name
          : match.player_a?.name;

        await supabase.from('posts').insert({
          author_id: winnerId,
          tournament_id: tournamentId,
          text: `🏆 ${winnerName} defeated ${loserName} in Match ${match.match_number}!`,
          type: 'system_result',
          media_urls: [],
        });
      }

      Alert.alert('Success', 'Score submitted!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enter Score</Text>
      </View>

      {match && (
        <View style={styles.content}>
          <View style={styles.playersContainer}>
            <View style={styles.playerInfo}>
              <Text style={styles.playerLabel}>Player A</Text>
              <Text style={styles.playerName}>{match.player_a?.name || 'TBD'}</Text>
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerLabel}>Player B</Text>
              <Text style={styles.playerName}>{match.player_b?.name || 'TBD'}</Text>
            </View>
          </View>

          <View style={styles.gamesSection}>
            <Text style={styles.sectionTitle}>Games</Text>
            {games.map((game, index) => (
              <View key={index} style={styles.gameRow}>
                <Text style={styles.gameLabel}>Game {game.game}</Text>
                <View style={styles.scoreInputs}>
                  <TextInput
                    style={styles.scoreInput}
                    value={String(game.a_score)}
                    onChangeText={(v) => updateScore(index, 'a', v)}
                    keyboardType="numeric"
                  />
                  <Text style={styles.scoreSeparator}>-</Text>
                  <TextInput
                    style={styles.scoreInput}
                    value={String(game.b_score)}
                    onChangeText={(v) => updateScore(index, 'b', v)}
                    keyboardType="numeric"
                  />
                </View>
                {games.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeGame(index)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addGameButton} onPress={addGame}>
              <Text style={styles.addGameButtonText}>+ Add Game</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Submitting...' : 'Submit Score'}
            </Text>
          </TouchableOpacity>
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
  content: {
    padding: 20,
  },
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  playerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  playerLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
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
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  gameLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 80,
  },
  scoreInputs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scoreInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    width: 60,
    textAlign: 'center',
  },
  scoreSeparator: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  removeButtonText: {
    fontSize: 20,
    color: '#EF4444',
    fontWeight: '600',
  },
  addGameButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  addGameButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

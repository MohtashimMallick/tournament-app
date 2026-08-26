import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { supabase } from '../config/supabase';
import { Match, Tournament } from '../types';

const { width } = Dimensions.get('window');

export default function BracketViewScreen({ route, navigation }: any) {
  const { tournamentId } = route.params;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    fetchBracketData();
  }, [tournamentId]);

  async function fetchBracketData() {
    const { data: tournamentData } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentData) setTournament(tournamentData);

    const { data: matchesData } = await supabase
      .from('matches')
      .select('*, player_a:users!player_a_id(*), player_b:users!player_b_id(*)')
      .eq('tournament_id', tournamentId)
      .neq('stage', 'round_robin')
      .order('round')
      .order('match_number');

    if (matchesData) setMatches(matchesData);
  }

  function getMatchesByStage(stage: string) {
    return matches.filter((m) => m.stage === stage);
  }

  function renderMatch(match: Match) {
    return (
      <TouchableOpacity
        key={match.id}
        style={styles.matchCard}
        onPress={() => navigation.navigate('MatchDetail', { matchId: match.id, tournamentId })}
      >
        <View style={styles.playerRow}>
          <Text style={[styles.playerName, match.winner_id === match.player_a_id && styles.winner]}>
            {match.player_a?.name || 'TBD'}
          </Text>
          {match.winner_id === match.player_a_id && <Text style={styles.winnerIndicator}>✓</Text>}
        </View>
        <View style={styles.divider} />
        <View style={styles.playerRow}>
          <Text style={[styles.playerName, match.winner_id === match.player_b_id && styles.winner]}>
            {match.player_b?.name || 'TBD'}
          </Text>
          {match.winner_id === match.player_b_id && <Text style={styles.winnerIndicator}>✓</Text>}
        </View>
        {match.status === 'completed' && match.games_json.length > 0 && (
          <View style={styles.scoreRow}>
            {match.games_json.map((game, index) => (
              <Text key={index} style={styles.gameScore}>
                {game.a_score}-{game.b_score}
              </Text>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  const stages = ['quarter_final', 'semi_final', 'final'];
  const stageLabels: Record<string, string> = {
    quarter_final: 'Quarter Finals',
    semi_final: 'Semi Finals',
    final: 'Final',
    third_place: 'Third Place',
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bracket</Text>
        <Text style={styles.tournamentName}>{tournament?.name}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.bracketContainer}>
          {stages.map((stage) => {
            const stageMatches = getMatchesByStage(stage);
            if (stageMatches.length === 0) return null;

            return (
              <View key={stage} style={styles.stageColumn}>
                <Text style={styles.stageLabel}>{stageLabels[stage]}</Text>
                <View style={styles.matchesColumn}>
                  {stageMatches.map((match) => renderMatch(match))}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
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
  bracketContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 40,
  },
  stageColumn: {
    alignItems: 'center',
  },
  stageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  matchesColumn: {
    gap: 40,
    justifyContent: 'center',
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  playerName: {
    fontSize: 14,
    color: '#1F2937',
  },
  winner: {
    fontWeight: '600',
    color: '#10B981',
  },
  winnerIndicator: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  gameScore: {
    fontSize: 12,
    color: '#6B7280',
  },
});

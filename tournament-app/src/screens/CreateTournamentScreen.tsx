import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { TournamentFormat, TournamentRules } from '../types';
import { v4 as uuidv4 } from 'uuid';

export default function CreateTournamentScreen({ navigation }: any) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [gameType, setGameType] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('round_robin');
  const [rules, setRules] = useState<TournamentRules>({
    matchFormat: 3,
    pointsPerGame: 21,
    pointsPerWin: { win: 3, draw: 1, loss: 0 },
    tieBreakOrder: ['games_won', 'head_to_head', 'coin_toss'],
    qualifiersCount: 8,
    thirdPlacePlayoff: false,
  });
  const [loading, setLoading] = useState(false);

  const formats: { value: TournamentFormat; label: string; description: string }[] = [
    { value: 'round_robin', label: 'Round Robin', description: 'Everyone plays everyone' },
    { value: 'round_robin_knockout', label: 'Round Robin + Knockout', description: 'Group stage then knockouts' },
    { value: 'single_elimination', label: 'Single Elimination', description: 'Lose and you\'re out' },
    { value: 'double_elimination', label: 'Double Elimination', description: 'Two losses and you\'re out' },
    { value: 'league', label: 'League', description: 'Season-long competition' },
  ];

  const gameTypes = [
    'Table Tennis', 'Badminton', 'Chess', 'FIFA', 'Carrom',
    'Cricket', 'Football', 'Basketball', 'Tennis', 'Other',
  ];

  async function handleCreate() {
    if (!name || !gameType) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const tournamentId = uuidv4();

      const { error: tournamentError } = await supabase.from('tournaments').insert({
        id: tournamentId,
        name,
        game_type: gameType,
        format,
        rules_json: rules,
        status: 'draft',
        organizer_id: user?.id,
      });

      if (tournamentError) throw tournamentError;

      // Add organizer as participant
      const { error: participantError } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id: tournamentId,
          user_id: user?.id,
          status: 'active',
        });

      if (participantError) throw participantError;

      Alert.alert('Success', 'Tournament created!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  function renderStep1() {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Basic Info</Text>

        <Text style={styles.label}>Tournament Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Summer Championship 2024"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Game/Sport *</Text>
        <View style={styles.gameTypeGrid}>
          {gameTypes.map((game) => (
            <TouchableOpacity
              key={game}
              style={[styles.gameTypeButton, gameType === game && styles.gameTypeActive]}
              onPress={() => setGameType(game)}
            >
              <Text style={[styles.gameTypeText, gameType === game && styles.gameTypeTextActive]}>
                {game}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={() => setStep(2)}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderStep2() {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Format</Text>

        {formats.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.formatCard, format === f.value && styles.formatActive]}
            onPress={() => setFormat(f.value)}
          >
            <Text style={styles.formatLabel}>{f.label}</Text>
            <Text style={styles.formatDescription}>{f.description}</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={() => setStep(3)}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderStep3() {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Rules</Text>

        <Text style={styles.label}>Match Format (Best of)</Text>
        <View style={styles.numberSelector}>
          {[1, 3, 5, 7].map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.numberButton, rules.matchFormat === n && styles.numberActive]}
              onPress={() => setRules({ ...rules, matchFormat: n })}
            >
              <Text style={[styles.numberText, rules.matchFormat === n && styles.numberTextActive]}>
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Points Per Win</Text>
        <View style={styles.pointsRow}>
          <View style={styles.pointsItem}>
            <Text style={styles.pointsLabel}>Win</Text>
            <TextInput
              style={styles.pointsInput}
              value={String(rules.pointsPerWin.win)}
              onChangeText={(v) =>
                setRules({
                  ...rules,
                  pointsPerWin: { ...rules.pointsPerWin, win: parseInt(v) || 0 },
                })
              }
              keyboardType="numeric"
            />
          </View>
          <View style={styles.pointsItem}>
            <Text style={styles.pointsLabel}>Draw</Text>
            <TextInput
              style={styles.pointsInput}
              value={String(rules.pointsPerWin.draw)}
              onChangeText={(v) =>
                setRules({
                  ...rules,
                  pointsPerWin: { ...rules.pointsPerWin, draw: parseInt(v) || 0 },
                })
              }
              keyboardType="numeric"
            />
          </View>
          <View style={styles.pointsItem}>
            <Text style={styles.pointsLabel}>Loss</Text>
            <TextInput
              style={styles.pointsInput}
              value={String(rules.pointsPerWin.loss)}
              onChangeText={(v) =>
                setRules({
                  ...rules,
                  pointsPerWin: { ...rules.pointsPerWin, loss: parseInt(v) || 0 },
                })
              }
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.label}>Qualifiers (Top N advance)</Text>
        <TextInput
          style={styles.input}
          value={String(rules.qualifiersCount)}
          onChangeText={(v) => setRules({ ...rules, qualifiersCount: parseInt(v) || 0 })}
          keyboardType="numeric"
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Third Place Playoff</Text>
          <Switch
            value={rules.thirdPlacePlayoff}
            onValueChange={(v) => setRules({ ...rules, thirdPlacePlayoff: v })}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextButton, loading && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={styles.nextButtonText}>
              {loading ? 'Creating...' : 'Create Tournament'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Tournament</Text>
      </View>

      <View style={styles.progressContainer}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[styles.progressDot, step >= s && styles.progressActive]}
          />
        ))}
      </View>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
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
  backLink: {
    fontSize: 16,
    color: '#3B82F6',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  progressActive: {
    backgroundColor: '#3B82F6',
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  gameTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  gameTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  gameTypeActive: {
    backgroundColor: '#3B82F6',
  },
  gameTypeText: {
    fontSize: 14,
    color: '#374151',
  },
  gameTypeTextActive: {
    color: '#FFFFFF',
  },
  formatCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  formatActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  formatLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  formatDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  numberSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  numberButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberActive: {
    backgroundColor: '#3B82F6',
  },
  numberText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  numberTextActive: {
    color: '#FFFFFF',
  },
  pointsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  pointsItem: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  pointsInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#374151',
  },
});

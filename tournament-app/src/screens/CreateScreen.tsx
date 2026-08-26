import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CreateScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => navigation.navigate('CreateTournament')}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🏆</Text>
          </View>
          <Text style={styles.optionTitle}>New Tournament</Text>
          <Text style={styles.optionDescription}>
            Create a tournament for any game or sport
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📝</Text>
          </View>
          <Text style={styles.optionTitle}>New Post</Text>
          <Text style={styles.optionDescription}>
            Share updates, results, or trash talk
          </Text>
        </TouchableOpacity>
      </View>
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
  content: {
    padding: 20,
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

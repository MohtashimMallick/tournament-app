import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0) || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.username}>@{user?.username}</Text>
        {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Tournaments</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Games</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Edit Profile</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>My Tournaments</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Settings</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
          <Text style={[styles.menuText, styles.dangerText]}>Sign Out</Text>
          <Text style={[styles.menuArrow, styles.dangerText]}>›</Text>
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '600',
  },
  name: {
    fontSize: 24,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuText: {
    fontSize: 16,
    color: '#1F2937',
  },
  menuArrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  dangerText: {
    color: '#EF4444',
  },
});

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
import { Notification } from '../types';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setNotifications(data);
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }

  async function markAsRead(id: string) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function renderNotification({ item }: { item: Notification }) {
    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.read && styles.unread]}
        onPress={() => markAsRead(item.id)}
      >
        <View style={styles.notificationIcon}>
          <Text style={styles.icon}>🔔</Text>
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationBody}>{item.body}</Text>
          <Text style={styles.notificationTime}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
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
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unread: {
    backgroundColor: '#EFF6FF',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  notificationContent: {
    marginLeft: 12,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  notificationBody: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

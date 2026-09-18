import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from '../../hooks/useNotifications';
import { Notification } from '../../types/notification';
import colors from '../../theme/colors';
import { AppIcon } from '../../components/AppIcon';

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  // Fetch real notifications list from backend (limit 50)
  const {
    data: notificationsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useNotifications({ limit: 50 });

  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const handleMarkAllRead = () => {
    const unreadNotifications = notificationsData?.notifications?.some(n => !n.isRead);
    if (!unreadNotifications) {
      Alert.alert('Info', 'All notifications are already marked as read.');
      return;
    }

    markAllAsReadMutation.mutate(undefined, {
      onError: (err: any) => {
        Alert.alert('Error', err.message || 'Could not update read statuses.');
      },
    });
  };

  const handleNotificationPress = (item: Notification) => {
    // Only trigger mutation if notification is unread
    if (!item.isRead) {
      markAsReadMutation.mutate(item.id, {
        onError: (err: any) => {
          console.error('Failed to mark notification as read:', err);
        },
      });
    }

    // Deep-link according to notification category / entity
    const data = (item as any).data || {};
    if (data.quoteId) {
      navigation.navigate('QuoteDetailsScreen', { quoteId: data.quoteId });
    } else if (item.type.includes('QUOTE')) {
      navigation.navigate('QuotesListScreen');
    } else if (data.bookingId) {
      navigation.navigate('BookingDetailsScreen', { bookingId: data.bookingId });
    } else if (item.type.includes('BOOKING')) {
      navigation.navigate('MyBookingsScreen');
    } else if (data.inquiryId || item.type.includes('INQUIRY')) {
      navigation.navigate('CustomerInquiriesScreen');
    }
  };

  const getIndicatorColor = (type: string) => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
        return '#22c55e'; // Green
      case 'BOOKING_REQUEST':
        return '#8b5cf6'; // Violet
      case 'BOOKING_REJECTED':
      case 'BOOKING_CANCELLED':
        return '#ef4444'; // Red
      case 'SYSTEM':
        return '#3b82f6'; // Blue
      default:
        return '#64748b'; // Slate
    }
  };

  // Helper function to format timestamp beautifully
  const formatTimestamp = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.cardUnread]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <View style={[styles.indicator, { backgroundColor: getIndicatorColor(item.type) }]} />
          <Text
            style={[styles.cardTitle, !item.isRead && styles.cardTitleUnread]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
        </View>
        <Text style={styles.timeText}>{formatTimestamp(item.createdAt)}</Text>
      </View>
      <Text style={[styles.messageText, !item.isRead && styles.messageTextUnread]}>
        {item.message}
      </Text>
    </TouchableOpacity>
  );

  const notifications = notificationsData?.notifications || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Notifications</Text>
          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.markReadText}>Mark all read</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.subtitle}>Stay updated on booking requests and cancellations</Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Load Failed</Text>
          <Text style={styles.errorSub}>
            {error?.message || 'Could not retrieve notifications.'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry Fetch</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AppIcon name="notifications-off-outline" size={48} color="#D97706" />
              <Text style={styles.emptyText}>You're all caught up!</Text>
              <Text style={styles.emptySub}>No notifications found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  markReadText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  cardUnread: {
    borderColor: colors.primaryLight,
    backgroundColor: 'rgba(37, 99, 235, 0.04)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
    flex: 1,
  },
  cardTitleUnread: {
    color: colors.text,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
    paddingLeft: 18,
  },
  messageTextUnread: {
    color: colors.text,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '700',
  },
  errorSub: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: colors.card,
    borderColor: colors.borderLight,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default NotificationsScreen;

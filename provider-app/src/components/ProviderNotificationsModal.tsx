import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import colors from '../theme/colors';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'LEAD' | 'SERVICE' | 'SYSTEM' | 'SUCCESS';
  isRead: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: '🎉 Birthday Service Live',
    message: 'Your "Birthday Theme & Balloon Decoration" service is now live and discoverable by customers in Panipat.',
    time: '15 mins ago',
    type: 'SERVICE',
    isRead: false,
  },
  {
    id: '2',
    title: '📍 New Customer Lead',
    message: 'A celebration host near Panipat viewed your decoration profile and initiated direct WhatsApp inquiry.',
    time: '1 hour ago',
    type: 'LEAD',
    isRead: false,
  },
  {
    id: '3',
    title: '✅ Partner Status Approved',
    message: 'Your vendor onboarding has been verified and approved by the Shubh Ausar admin team.',
    time: 'Yesterday',
    type: 'SUCCESS',
    isRead: true,
  },
  {
    id: '4',
    title: '🛡️ 24-Hour Security Window',
    message: 'System authentication & marketplace endpoints are secured with a 24-hour brute-force protection window.',
    time: '2 days ago',
    type: 'SYSTEM',
    isRead: true,
  },
];

interface ProviderNotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ProviderNotificationsModal: React.FC<ProviderNotificationsModalProps> = ({
  visible,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>🔔 Partner Alerts</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadPill}>
                  <Text style={styles.unreadPillText}>{unreadCount} New</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Subheader action */}
          {unreadCount > 0 && (
            <View style={styles.subHeader}>
              <Text style={styles.subHeaderText}>Stay updated on customer inquiries & service status</Text>
              <TouchableOpacity onPress={handleMarkAllAsRead}>
                <Text style={styles.markReadText}>Mark all as read</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Notifications List */}
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {notifications.map((item) => (
              <View
                key={item.id}
                style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardTime}>{item.time}</Text>
                </View>

                <Text style={styles.cardMsg}>{item.message}</Text>

                {!item.isRead && (
                  <View style={styles.unreadDot} />
                )}
              </View>
            ))}
          </ScrollView>

          {/* Footer Close Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.dismissBtn} onPress={onClose}>
              <Text style={styles.dismissBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  unreadPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadPillText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FAF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E0D8',
  },
  subHeaderText: {
    fontSize: 11,
    color: '#78716C',
    flex: 1,
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 8,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  unreadCard: {
    backgroundColor: '#FFFDF9',
    borderColor: '#FED7AA',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
  },
  cardTime: {
    fontSize: 11,
    color: '#A8A29E',
    fontWeight: '500',
  },
  cardMsg: {
    fontSize: 12,
    color: '#57534E',
    lineHeight: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dismissBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  dismissBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
});

export default ProviderNotificationsModal;

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import AppIcon from './AppIcon';
import colors from '../theme/colors';

interface YourEventsCardProps {
  eventsCount?: number;
  onPressManage: () => void;
  onCreateEvent?: () => void;
}

export const YourEventsCard: React.FC<YourEventsCardProps> = ({
  eventsCount = 0,
  onPressManage,
  onCreateEvent,
}) => {
  const hasEvents = eventsCount > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={hasEvents ? onPressManage : (onCreateEvent || onPressManage)}
    >
      {/* Left: Icon & Description */}
      <View style={styles.leftRow}>
        <View style={styles.iconCircle}>
          <AppIcon type="ionicons" name="calendar-outline" size={22} color="#D97706" />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.titleText}>Your Events</Text>
          <Text style={styles.subtitleText}>
            {hasEvents
              ? 'Manage your upcoming events'
              : 'Start planning your next celebration'}
          </Text>
        </View>
      </View>

      {/* Right: Count Pill / Action Indicator */}
      <View style={styles.rightAction}>
        <Text style={styles.actionText}>
          {hasEvents ? `${eventsCount} Event${eventsCount > 1 ? 's' : ''}` : 'Create Event'}
        </Text>
        <AppIcon type="ionicons" name="chevron-forward" size={14} color="#92400E" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  titleText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 11,
    color: '#78716C',
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  actionText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#92400E',
  },
});

export default YourEventsCard;

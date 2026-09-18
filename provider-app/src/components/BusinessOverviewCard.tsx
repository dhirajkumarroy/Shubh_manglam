import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import AppIcon from './AppIcon';

export type TimePeriod = 'THIS_MONTH' | 'LAST_30_DAYS' | 'ALL_TIME';

interface BusinessOverviewCardProps {
  profileViews?: number | string;
  leadsCount?: number;
  bookingsCount?: number;
  ratingAverage?: number;
  onSelectPeriod?: (period: TimePeriod) => void;
}

export const BusinessOverviewCard: React.FC<BusinessOverviewCardProps> = ({
  profileViews = 245,
  leadsCount = 0,
  bookingsCount = 0,
  ratingAverage = 4.8,
  onSelectPeriod,
}) => {
  const [period, setPeriod] = useState<TimePeriod>('THIS_MONTH');

  const getPeriodLabel = (p: TimePeriod) => {
    switch (p) {
      case 'THIS_MONTH':
        return 'This Month ▼';
      case 'LAST_30_DAYS':
        return 'Last 30d ▼';
      case 'ALL_TIME':
        return 'All Time ▼';
    }
  };

  const cyclePeriod = () => {
    let nextPeriod: TimePeriod = 'THIS_MONTH';
    if (period === 'THIS_MONTH') nextPeriod = 'LAST_30_DAYS';
    else if (period === 'LAST_30_DAYS') nextPeriod = 'ALL_TIME';
    else nextPeriod = 'THIS_MONTH';

    setPeriod(nextPeriod);
    if (onSelectPeriod) onSelectPeriod(nextPeriod);
  };

  const formattedRating = ratingAverage > 0 ? Number(ratingAverage).toFixed(1) : '5.0';

  return (
    <View style={styles.card}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.titleText}>Your Business at a Glance</Text>
        <TouchableOpacity
          style={styles.periodPill}
          activeOpacity={0.7}
          onPress={cyclePeriod}
        >
          <Text style={styles.periodText}>{getPeriodLabel(period)}</Text>
        </TouchableOpacity>
      </View>

      {/* 4 Metrics Columns */}
      <View style={styles.metricsRow}>
        {/* Metric 1: Profile Views */}
        <View style={styles.metricCol}>
          <View style={styles.iconWrap}>
            <AppIcon type="ionicons" name="eye-outline" size={18} color="#FBBF24" />
          </View>
          <Text style={styles.metricValue}>{profileViews}</Text>
          <Text style={styles.metricLabel} numberOfLines={1}>Profile Views</Text>
          <View style={styles.trendRow}>
            <AppIcon type="ionicons" name="arrow-up" size={10} color="#34D399" />
            <Text style={styles.trendText}>12%</Text>
          </View>
        </View>

        <View style={styles.colDivider} />

        {/* Metric 2: New Leads */}
        <View style={styles.metricCol}>
          <View style={styles.iconWrap}>
            <AppIcon type="ionicons" name="people-outline" size={18} color="#FBBF24" />
          </View>
          <Text style={styles.metricValue}>{leadsCount}</Text>
          <Text style={styles.metricLabel} numberOfLines={1}>New Leads</Text>
          <View style={styles.trendRow}>
            <AppIcon type="ionicons" name="arrow-up" size={10} color="#34D399" />
            <Text style={styles.trendText}>28%</Text>
          </View>
        </View>

        <View style={styles.colDivider} />

        {/* Metric 3: Bookings */}
        <View style={styles.metricCol}>
          <View style={styles.iconWrap}>
            <AppIcon type="ionicons" name="calendar-outline" size={18} color="#FBBF24" />
          </View>
          <Text style={styles.metricValue}>{bookingsCount}</Text>
          <Text style={styles.metricLabel} numberOfLines={1}>Bookings</Text>
          <View style={styles.trendRow}>
            <AppIcon type="ionicons" name="arrow-up" size={10} color="#34D399" />
            <Text style={styles.trendText}>40%</Text>
          </View>
        </View>

        <View style={styles.colDivider} />

        {/* Metric 4: Avg. Rating */}
        <View style={styles.metricCol}>
          <View style={styles.iconWrap}>
            <AppIcon type="ionicons" name="star" size={18} color="#FBBF24" />
          </View>
          <Text style={styles.metricValue}>{formattedRating}</Text>
          <Text style={styles.metricLabel} numberOfLines={1}>Avg. Rating</Text>
          <View style={styles.trendRow}>
            <Text style={styles.trendNeutral}>—</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#580A25', // Deep Royal Burgundy / Maroon
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#4C0519',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  periodPill: {
    backgroundColor: '#701A33',
    borderWidth: 1,
    borderColor: '#9F1239',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
  },
  periodText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFE4E6',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  colDivider: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  iconWrap: {
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#FECDD3', // Soft rose pink
    textAlign: 'center',
    marginBottom: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#34D399', // Crisp mint green
  },
  trendNeutral: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FDA4AF',
  },
});

export default BusinessOverviewCard;

import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import AppIcon from './AppIcon';
import colors from '../theme/colors';

interface PartnerGreetingCardProps {
  ownerName?: string;
  businessName?: string;
  city?: string;
  state?: string;
}

export const PartnerGreetingCard: React.FC<PartnerGreetingCardProps> = ({
  ownerName,
  businessName,
  city,
  state,
}) => {
  // Determine dynamic greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning,';
    if (hour >= 12 && hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  const displayName = ownerName || businessName || 'Partner';
  const displayBusiness = businessName || 'Event Services';
  const displayLocation = [city, state].filter(Boolean).join(', ') || 'India';

  return (
    <View style={styles.card}>
      {/* Left Column: Greeting & Identity */}
      <View style={styles.leftCol}>
        <Text style={styles.greetingText}>{getGreeting()}</Text>
        <Text style={styles.ownerName} numberOfLines={1}>
          {displayName}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <AppIcon type="ionicons" name="storefront-outline" size={12} color="#881337" />
            <Text style={styles.metaText} numberOfLines={1}>
              {displayBusiness}
            </Text>
          </View>
          <Text style={styles.metaDivider}>|</Text>
          <View style={styles.metaItem}>
            <AppIcon type="ionicons" name="location-sharp" size={12} color="#E65100" />
            <Text style={styles.metaText} numberOfLines={1}>
              {displayLocation}
            </Text>
          </View>
        </View>
      </View>

      {/* Right Column: Festive Inspiration Quote Box */}
      <View style={styles.quoteBox}>
        <View style={styles.quoteRow}>
          <Text style={styles.quoteMarks}>“</Text>
          <Text style={styles.quoteText}>
            Be a part of{'\n'}someone's special story
          </Text>
          <Text style={styles.quoteMarks}>”</Text>
        </View>
        <View style={styles.lotusRow}>
          <Text style={styles.lotusIcon}>🪷</Text>
          <Text style={styles.taglineText}>Create • Celebrate • Grow</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFE6DA',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#881337',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1.5,
      },
      default: {},
    }),
  },
  leftCol: {
    flex: 1,
    paddingRight: 10,
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 14,
    color: '#78350F', // Warm amber-brown
    fontWeight: '500',
    letterSpacing: 0.2,
    marginBottom: 2,
    fontStyle: 'italic',
  },
  ownerName: {
    fontSize: 21,
    fontWeight: '900',
    color: '#4C0519', // Deep royal maroon
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    maxWidth: '48%',
  },
  metaText: {
    fontSize: 11,
    color: '#57534E',
    fontWeight: '600',
  },
  metaDivider: {
    fontSize: 11,
    color: '#D6CECE',
    marginHorizontal: 1,
  },
  quoteBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 125,
    maxWidth: 140,
  },
  quoteRow: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  quoteMarks: {
    fontSize: 14,
    fontWeight: '900',
    color: '#B45309',
    lineHeight: 14,
  },
  quoteText: {
    fontSize: 10,
    color: '#78350F',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
  },
  lotusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  lotusIcon: {
    fontSize: 11,
  },
  taglineText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

export default PartnerGreetingCard;

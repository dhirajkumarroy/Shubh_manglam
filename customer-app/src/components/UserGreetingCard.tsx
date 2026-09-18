import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';

interface UserGreetingCardProps {
  userName?: string;
}

export const UserGreetingCard: React.FC<UserGreetingCardProps> = ({
  userName = 'Priya Sharma',
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning,';
    if (hour >= 12 && hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  return (
    <View style={styles.card}>
      {/* Left Column: Greeting & Host Identity */}
      <View style={styles.leftCol}>
        <Text style={styles.greetingText}>{getGreeting()}</Text>
        <Text style={styles.userNameText} numberOfLines={1}>
          {userName}
        </Text>
        <View style={styles.taglineRow}>
          <Text style={styles.lotusIcon}>🪷</Text>
          <Text style={styles.taglineText} numberOfLines={1}>
            Let's plan your next beautiful moment!
          </Text>
        </View>
      </View>

      {/* Right Column: Festive Inspiration Quote Box */}
      <View style={styles.quoteBox}>
        <View style={styles.quoteRow}>
          <Text style={styles.quoteMarks}>“</Text>
          <Text style={styles.quoteText}>
            Every celebration{'\n'}starts with a plan,{'\n'}and we're here for you.
          </Text>
          <Text style={styles.quoteMarks}>”</Text>
        </View>
        <Text style={styles.boxLotus}>🪷</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFDF9',
    borderRadius: 18,
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
  userNameText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#4C0519', // Deep Royal Burgundy
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lotusIcon: {
    fontSize: 12,
  },
  taglineText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  quoteBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 125,
    maxWidth: 142,
  },
  quoteRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  quoteMarks: {
    fontSize: 13,
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
  boxLotus: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default UserGreetingCard;

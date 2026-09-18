import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import colors from '../theme/colors';

interface HeroPromoBannerProps {
  onPressExplore: () => void;
}

export const HeroPromoBanner: React.FC<HeroPromoBannerProps> = ({ onPressExplore }) => {
  return (
    <View style={styles.card}>
      {/* Left Column: Heading, Subtitle & Orange CTA */}
      <View style={styles.leftCol}>
        <Text style={styles.heading}>
          Make Every Occasion{'\n'}Truly Special
        </Text>
        <Text style={styles.subheading}>
          Explore trusted vendors for your big moments.
        </Text>
        <TouchableOpacity
          style={styles.ctaBtn}
          activeOpacity={0.8}
          onPress={onPressExplore}
        >
          <Text style={styles.ctaBtnText}>Explore Vendors →</Text>
        </TouchableOpacity>
      </View>

      {/* Right Column: Mandap Image & Script Motif */}
      <View style={styles.rightCol}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80',
          }}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        {/* Overlay Dark Tint */}
        <View style={styles.imageOverlay} />

        <View style={styles.scriptWrap}>
          <Text style={styles.scriptLine}>Plan</Text>
          <Text style={styles.scriptLine}>Celebrate</Text>
          <Text style={styles.scriptLine}>Cherish</Text>
        </View>

        {/* Carousel Pagination Dots */}
        <View style={styles.paginationDots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#580A25', // Deep Royal Burgundy / Maroon
    borderRadius: 20,
    height: 180,
    marginBottom: 18,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#4C0519',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  leftCol: {
    flex: 1.15,
    paddingLeft: 18,
    paddingVertical: 18,
    paddingRight: 6,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  heading: {
    fontSize: 18.5,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 23,
    letterSpacing: -0.3,
  },
  subheading: {
    fontSize: 11.5,
    color: '#FFE4E6',
    lineHeight: 15,
    marginTop: 4,
  },
  ctaBtn: {
    backgroundColor: '#E65100', // Saffron Orange
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  rightCol: {
    flex: 1,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(76, 5, 25, 0.35)',
  },
  scriptWrap: {
    position: 'absolute',
    top: 18,
    right: 14,
    alignItems: 'flex-end',
  },
  scriptLine: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FDE68A', // Warm golden cream
    fontStyle: 'italic',
    lineHeight: 17,
  },
  paginationDots: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default HeroPromoBanner;

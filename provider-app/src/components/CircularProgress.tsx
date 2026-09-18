import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 56,
  strokeWidth = 5,
  color = '#E65100', // Saffron orange
  backgroundColor = '#FFEDD5', // Soft peach/amber track
}) => {
  const clamped = Math.min(100, Math.max(0, percentage));
  const isComplete = clamped >= 100;
  const activeColor = isComplete ? '#10B981' : color;
  const innerSize = size - strokeWidth * 2;

  // We construct the two halves of the ring
  // Angle for right half (0 - 180 deg) and left half (180 - 360 deg)
  const rightRotation = clamped <= 50 ? (clamped / 50) * 180 : 180;
  const leftRotation = clamped > 50 ? ((clamped - 50) / 50) * 180 : 0;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background Track Circle */}
      <View
        style={[
          styles.trackCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: isComplete ? '#D1FAE5' : backgroundColor,
          },
        ]}
      />

      {/* Right Half Container */}
      <View style={[styles.halfWrap, { width: size / 2, height: size, left: size / 2 }]}>
        <View
          style={[
            styles.halfCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: activeColor,
              left: -size / 2,
              transform: [{ rotate: `${rightRotation - 180}deg` }],
            },
          ]}
        />
      </View>

      {/* Left Half Container (only active when > 50%) */}
      {clamped > 50 && (
        <View style={[styles.halfWrap, { width: size / 2, height: size, left: 0 }]}>
          <View
            style={[
              styles.halfCircle,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: activeColor,
                left: 0,
                transform: [{ rotate: `${leftRotation - 180}deg` }],
              },
            ]}
          />
        </View>
      )}

      {/* Center Label Area */}
      <View
        style={[
          styles.innerCircle,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}
      >
        <Text style={[styles.percentText, isComplete && styles.percentTextComplete]}>
          {clamped}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  trackCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  halfWrap: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
  },
  halfCircle: {
    position: 'absolute',
    top: 0,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  innerCircle: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  percentText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.2,
  },
  percentTextComplete: {
    color: '#065F46',
  },
});

export default CircularProgress;

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import AppIcon from './AppIcon';
import colors from '../theme/colors';

interface HomeSearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
  onPressInput?: () => void;
  selectedLocationText?: string;
  onPressLocation?: () => void;
  editable?: boolean;
}

export const HomeSearchBar: React.FC<HomeSearchBarProps> = ({
  value,
  onChangeText,
  onSubmit,
  onPressInput,
  selectedLocationText = 'Kharar, Punjab',
  onPressLocation,
  editable = true,
}) => {
  return (
    <View style={styles.container}>
      {/* 1. Search Icon */}
      <AppIcon type="ionicons" name="search" size={19} color="#78716C" />

      {/* 2. Text Input / Touchable Area */}
      {editable ? (
        <TextInput
          style={styles.input}
          placeholder="Search for vendors, services, or categories..."
          placeholderTextColor="#A8A29E"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
        />
      ) : (
        <TouchableOpacity
          style={styles.touchableArea}
          activeOpacity={0.8}
          onPress={onPressInput}
        >
          <Text style={styles.placeholderText} numberOfLines={1}>
            {value || 'Search for vendors, services, or categories...'}
          </Text>
        </TouchableOpacity>
      )}

      {/* 3. Location Selector Pill */}
      {onPressLocation && (
        <TouchableOpacity
          style={styles.locationPill}
          activeOpacity={0.7}
          onPress={onPressLocation}
        >
          <AppIcon type="ionicons" name="location-sharp" size={14} color="#E65100" />
          <Text style={styles.locationText} numberOfLines={1}>
            {selectedLocationText}
          </Text>
          <AppIcon type="ionicons" name="chevron-down" size={11} color="#78716C" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E7E0D8',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  input: {
    flex: 1,
    fontSize: 12,
    color: '#1C1917',
    paddingHorizontal: 8,
    height: '100%',
  },
  touchableArea: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
    height: '100%',
  },
  placeholderText: {
    fontSize: 12,
    color: '#A8A29E',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingLeft: 6,
    borderLeftWidth: 1,
    borderLeftColor: '#F0EAE1',
    maxWidth: 130,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1C1917',
  },
});

export default HomeSearchBar;

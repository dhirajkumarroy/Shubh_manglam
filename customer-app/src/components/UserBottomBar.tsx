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

export type UserTabType =
  | 'HomeTab'
  | 'ExploreTab'
  | 'EventsTab'
  | 'MessagesTab'
  | 'FavoritesTab'
  | 'ProfileTab';

interface UserBottomBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  messagesCount?: number;
}

export const UserBottomBar: React.FC<UserBottomBarProps> = ({
  state,
  navigation,
  messagesCount = 2,
}) => {
  const tabs = [
    {
      routeName: 'HomeTab',
      label: 'Home',
      iconActive: 'home',
      iconInactive: 'home-outline',
      badge: undefined,
    },
    {
      routeName: 'ExploreTab',
      label: 'Explore',
      iconActive: 'search',
      iconInactive: 'search-outline',
      badge: undefined,
    },
    {
      routeName: 'EventsTab',
      label: 'My Events',
      iconActive: 'calendar',
      iconInactive: 'calendar-outline',
      badge: undefined,
    },
    {
      routeName: 'MessagesTab',
      label: 'Messages',
      iconActive: 'chatbubble-ellipses',
      iconInactive: 'chatbubble-ellipses-outline',
      badge: messagesCount > 0 ? messagesCount : undefined,
    },
    {
      routeName: 'FavoritesTab',
      label: 'Favorites',
      iconActive: 'heart',
      iconInactive: 'heart-outline',
      badge: undefined,
    },
    {
      routeName: 'ProfileTab',
      label: 'Profile',
      iconActive: 'person',
      iconInactive: 'person-outline',
      badge: undefined,
    },
  ];

  const currentRouteName = state.routes[state.index]?.name;

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isFocused = currentRouteName === tab.routeName;
        const iconName = isFocused ? tab.iconActive : tab.iconInactive;
        const iconColor = isFocused ? '#881337' : '#78716C';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: tab.routeName,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(tab.routeName);
          }
        };

        return (
          <TouchableOpacity
            key={tab.routeName}
            style={styles.tabBtn}
            activeOpacity={0.7}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
          >
            {/* Icon Wrap with optional badge */}
            <View style={styles.iconWrap}>
              <AppIcon
                type="ionicons"
                name={iconName}
                size={22}
                color={iconColor}
              />
              {tab.badge !== undefined && (
                <View style={styles.badgeWrap}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              )}
            </View>

            {/* Label */}
            <Text
              style={[styles.tabLabel, isFocused && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>

            {/* Active Saffron Indicator Pill */}
            {isFocused ? (
              <View style={styles.activePillIndicator} />
            ) : (
              <View style={styles.inactivePlaceholder} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBE5DC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 10,
      },
      default: {},
    }),
  },
  tabBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 4,
  },
  iconWrap: {
    position: 'relative',
    marginBottom: 2,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrap: {
    position: 'absolute',
    top: -3,
    right: -8,
    backgroundColor: '#DC2626',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#78716C',
    marginTop: 1,
  },
  tabLabelActive: {
    color: '#881337', // Brand royal maroon
    fontWeight: '800',
  },
  activePillIndicator: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#E65100', // Saffron orange indicator
    marginTop: 3,
  },
  inactivePlaceholder: {
    width: 16,
    height: 3,
    marginTop: 3,
  },
});

export default UserBottomBar;

import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Feather name={name as any} size={focused ? 21 : 19} color={color} />
    </View>
  );
}

function MapTabIcon({ focused, color }: { focused: boolean; color: string }) {
  return (
    <View style={tabStyles.mapBtnOuter}>
      <View style={[tabStyles.mapBtn, focused && tabStyles.mapBtnActive]}>
        <Feather name="map-pin" size={22} color={Colors.white} />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const isAndroid = Platform.OS === 'android';
  const insets = useSafeAreaInsets();

  const tabBarHeight = isWeb ? 88 : isAndroid ? 64 + insets.bottom : 72;
  const tabBarPaddingBottom = isWeb ? 18 : isAndroid ? insets.bottom + 6 : 12;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.teal,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : Colors.white,
          borderTopWidth: 0.5,
          borderTopColor: Colors.border,
          elevation: isAndroid ? 12 : 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 8,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={98} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.white }]} />
          ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarIconStyle: { marginBottom: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="listings"
        options={{
          title: 'العقارات',
          tabBarIcon: ({ color, focused }) => <TabIcon name="grid" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'الخريطة',
          tabBarIcon: ({ color, focused }) => <MapTabIcon focused={focused} color={color} />,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'المفضلة',
          tabBarIcon: ({ color, focused }) => <TabIcon name="heart" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ color, focused }) => <TabIcon name="user" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen name="discover" options={{ href: null }} />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(15,123,160,0.12)',
  },
  mapBtnOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mapBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
    marginTop: -24,
  },
  mapBtnActive: {
    backgroundColor: Colors.navyDark,
  },
});

import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Feather name={name as any} size={focused ? 21 : 19} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

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
          elevation: 0,
          height: isWeb ? 88 : 68,
          paddingBottom: isWeb ? 18 : 10,
          paddingTop: 6,
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
        name="discover"
        options={{
          title: 'اكتشف',
          tabBarIcon: ({ color, focused }) => <TabIcon name="compass" focused={focused} color={color} />,
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
      <Tabs.Screen name="map" options={{ href: null }} />
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
});

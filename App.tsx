import React, { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  useFonts,
  Syne_600SemiBold,
  Syne_700Bold,
} from '@expo-google-fonts/syne';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';

import { HomeScreen } from './src/screens/HomeScreen';
import { PrayerTrackerScreen } from './src/screens/PrayerTrackerScreen';
import { LearnScreen } from './src/screens/LearnScreen';
import { QiblaScreen } from './src/screens/QiblaScreen';
import { MoodScreen } from './src/screens/MoodScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { theme } from './src/constants/theme';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();

function AppTabs({ onLayout }: { onLayout: () => void }) {
  const { t } = useLanguage();

  return (
    <View style={styles.root} onLayout={onLayout}>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              borderTopWidth: 1,
              height: Platform.OS === 'ios' ? 88 : 68,
              paddingTop: theme.spacing.sm,
              paddingBottom: Platform.OS === 'ios' ? 28 : theme.spacing.md,
            },
            tabBarActiveTintColor: theme.colors.accent,
            tabBarInactiveTintColor: theme.colors.textMuted,
            tabBarLabelStyle: {
              fontSize: 11,
              fontFamily: 'PlusJakartaSans_500Medium',
            },
            tabBarItemStyle: {
              paddingVertical: 4,
            },
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarLabel: t.homeTab,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon emoji="🏠" color={color} focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Prayers"
            component={PrayerTrackerScreen}
            options={{
              tabBarLabel: t.prayersTab,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon emoji="🕌" color={color} focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Learn"
            component={LearnScreen}
            options={{
              tabBarLabel: t.learnTab,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon emoji="📖" color={color} focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Qibla"
            component={QiblaScreen}
            options={{
              tabBarLabel: t.qiblaTab,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon emoji="🕋" color={color} focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Mood"
            component={MoodScreen}
            options={{
              tabBarLabel: t.moodTab,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon emoji="💬" color={color} focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Stats"
            component={StatsScreen}
            options={{
              tabBarLabel: t.statsTab,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon emoji="📊" color={color} focused={focused} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Syne_600SemiBold,
    Syne_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AppTabs onLayout={onLayoutRootView} />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

function TabIcon({
  emoji,
  color,
  focused,
}: {
  emoji: string;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.7 }]}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabIconFocused: {
    transform: [{ scale: 1.05 }],
  },
  tabEmoji: {
    fontSize: 24,
  },
});

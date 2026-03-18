import React, { useCallback, useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { UmrahGuideScreen } from './src/screens/UmrahGuideScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { theme } from './src/constants/theme';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { SimpleModeProvider } from './src/contexts/SimpleModeContext';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();

// Force light theme so device dark mode never overrides our tab bar
const NAV_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    border: theme.colors.border,
    primary: theme.colors.accent,
    text: theme.colors.text,
    notification: theme.colors.accent,
  },
};

// Simple text icons — render identically on every Android and iOS version
const TAB_ICONS: Record<string, string> = {
  Home:    '⌂',
  Prayers: '✦',
  Learn:   '✎',
  Umrah:   '✪',
  Qibla:   '◎',
  Mood:    '☺',
  Stats:   '▦',
};

function AppTabs({ onLayout }: { onLayout: () => void }) {
  const { t } = useLanguage();

  return (
    <View style={styles.root} onLayout={onLayout}>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />
      <NavigationContainer theme={NAV_THEME}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              borderTopWidth: 1,
              height: Platform.OS === 'ios' ? 88 : 64,
              paddingTop: 6,
              paddingBottom: Platform.OS === 'ios' ? 28 : 10,
            },
            tabBarActiveTintColor: theme.colors.accent,
            tabBarInactiveTintColor: theme.colors.textMuted,
            tabBarLabelStyle: {
              fontSize: 10,
              fontFamily: 'PlusJakartaSans_500Medium',
              marginTop: 2,
            },
            tabBarIcon: ({ focused }) => (
              <TabIcon name={route.name} focused={focused} />
            ),
          })}
        >
          <Tab.Screen name="Home"    component={HomeScreen}          options={{ tabBarLabel: t.homeTab }} />
          <Tab.Screen name="Prayers" component={PrayerTrackerScreen} options={{ tabBarLabel: t.prayersTab }} />
          <Tab.Screen name="Learn"   component={LearnScreen}         options={{ tabBarLabel: t.learnTab }} />
          <Tab.Screen name="Umrah"   component={UmrahGuideScreen}    options={{ tabBarLabel: t.umrahTab }} />
          <Tab.Screen name="Qibla"   component={QiblaScreen}         options={{ tabBarLabel: t.qiblaTab }} />
          <Tab.Screen name="Mood"    component={MoodScreen}          options={{ tabBarLabel: t.moodTab }} />
          <Tab.Screen name="Stats"   component={StatsScreen}         options={{ tabBarLabel: t.statsTab }} />
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
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_complete').then((val) => {
      setOnboardingDone(val === 'true');
    });
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && onboardingDone !== null) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, onboardingDone]);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    setOnboardingDone(true);
  };

  if (!fontsLoaded || onboardingDone === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <SimpleModeProvider>
        {!onboardingDone ? (
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <StatusBar style="dark" backgroundColor={theme.colors.background} />
            <OnboardingScreen onComplete={completeOnboarding} />
          </View>
        ) : (
          <AppTabs onLayout={onLayoutRootView} />
        )}
        </SimpleModeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icon = TAB_ICONS[name] ?? '•';
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
      <Text style={[styles.iconText, focused && styles.iconTextFocused]}>
        {icon}
      </Text>
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
  iconWrap: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapFocused: {
    backgroundColor: theme.colors.accentMuted,
  },
  iconText: {
    fontSize: 20,
    color: theme.colors.textMuted,
    lineHeight: 24,
  },
  iconTextFocused: {
    color: theme.colors.accent,
    fontSize: 22,
  },
});

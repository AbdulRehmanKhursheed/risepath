import React, { useCallback, useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, useNavigationContainerRef, CommonActions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import { QuranScreen } from './src/screens/QuranScreen';
import { Sidebar } from './src/components/Sidebar';
import { QuranNavProvider, useQuranNav } from './src/contexts/QuranNavContext';
import { SidebarProvider } from './src/contexts/SidebarContext';
import { theme } from './src/constants/theme';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { SimpleModeProvider } from './src/contexts/SimpleModeContext';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Force light theme — prevents device dark mode overriding tab bar
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

const TAB_ICONS: Record<string, string> = {
  Home:    '⌂',
  Prayers: '✦',
  Quran:   '☽',
};

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

// Quran tab — remounts QuranScreen on deep-link from PrayerRow
function QuranTab() {
  const { pendingSurah, clearPending } = useQuranNav();

  const [activeSurah, setActiveSurah] = useState<number | undefined>(() =>
    pendingSurah !== null ? pendingSurah : undefined
  );
  const [mountKey, setMountKey] = useState(0);

  useEffect(() => {
    if (pendingSurah !== null) {
      setActiveSurah(pendingSurah);
      setMountKey((k) => k + 1);
      clearPending();
    }
  }, [pendingSurah]);

  return <QuranScreen key={mountKey} initialSurah={activeSurah} />;
}

// The three primary tabs
function MainTabs() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const tabBarPaddingBottom = insets.bottom + 6;
  const tabBarHeight = 28 + 14 + 4 + tabBarPaddingBottom;

  return (
    // The Sidebar sits INSIDE MainTabs so it overlays the tab bar correctly
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            height: tabBarHeight,
            paddingTop: 4,
            paddingBottom: tabBarPaddingBottom,
          },
          tabBarActiveTintColor: theme.colors.accent,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: 'PlusJakartaSans_500Medium',
            marginTop: 1,
          },
          tabBarIcon: ({ focused }) => (
            <TabIcon name={route.name} focused={focused} />
          ),
        })}
      >
        <Tab.Screen name="Home"    component={HomeScreen}          options={{ tabBarLabel: t.homeTab }} />
        <Tab.Screen name="Prayers" component={PrayerTrackerScreen} options={{ tabBarLabel: t.prayersTab }} />
        <Tab.Screen name="Quran"   component={QuranTab}            options={{ tabBarLabel: t.quranTab ?? 'Quran' }} />
      </Tab.Navigator>
      {/* Sidebar overlay rendered on top of everything inside MainTabs */}
      <Sidebar />
    </View>
  );
}

// Root stack — MainTabs + secondary screens pushed on top
function AppStack({ onLayout }: { onLayout: () => void }) {
  const { pendingSurah } = useQuranNav();
  const navRef = useNavigationContainerRef();

  // Deep-link from PrayerRow: navigate to MainTabs → Quran tab
  useEffect(() => {
    if (pendingSurah !== null && navRef.isReady()) {
      navRef.dispatch(
        CommonActions.navigate({
          name: 'MainTabs',
          params: { screen: 'Quran' },
        })
      );
    }
  }, [pendingSurah]);

  return (
    <View style={styles.root} onLayout={onLayout}>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />
      <NavigationContainer ref={navRef} theme={NAV_THEME}>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          {/* Primary — contains bottom tabs + sidebar overlay */}
          <Stack.Screen name="MainTabs" component={MainTabs} />
          {/* Secondary screens — slide in from right, have back button */}
          <Stack.Screen
            name="Learn"
            component={LearnScreen}
            options={{ headerShown: true, title: 'Learn', headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.accent, headerTitleStyle: { fontFamily: theme.typography.fontBodyBold, color: theme.colors.text } }}
          />
          <Stack.Screen
            name="Umrah"
            component={UmrahGuideScreen}
            options={{ headerShown: true, title: 'Umrah Guide', headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.accent, headerTitleStyle: { fontFamily: theme.typography.fontBodyBold, color: theme.colors.text } }}
          />
          <Stack.Screen
            name="Qibla"
            component={QiblaScreen}
            options={{ headerShown: true, title: 'Qibla', headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.accent, headerTitleStyle: { fontFamily: theme.typography.fontBodyBold, color: theme.colors.text } }}
          />
          <Stack.Screen
            name="Mood"
            component={MoodScreen}
            options={{ headerShown: true, title: 'Mood Coach', headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.accent, headerTitleStyle: { fontFamily: theme.typography.fontBodyBold, color: theme.colors.text } }}
          />
          <Stack.Screen
            name="Stats"
            component={StatsScreen}
            options={{ headerShown: true, title: 'My Stats', headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.accent, headerTitleStyle: { fontFamily: theme.typography.fontBodyBold, color: theme.colors.text } }}
          />
        </Stack.Navigator>
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
          <SidebarProvider>
            <QuranNavProvider>
              {!onboardingDone ? (
                <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
                  <StatusBar style="dark" backgroundColor={theme.colors.background} />
                  <OnboardingScreen onComplete={completeOnboarding} />
                </View>
              ) : (
                <AppStack onLayout={onLayoutRootView} />
              )}
            </QuranNavProvider>
          </SidebarProvider>
        </SimpleModeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
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
    width: 40,
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

import React, { useCallback, useState, useEffect, Component, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets, initialWindowMetrics } from 'react-native-safe-area-context';
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

import { initAds } from './src/services/ads';
import { prefetchAllSurahs } from './src/services/quran';
import { captureError, wrap } from './src/services/sentry';
import { requestAdsConsent } from './src/services/consent';
import { trackAppOpen, maybePromptReview } from './src/services/review';
import { HomeScreen } from './src/screens/HomeScreen';
import { PrayerTrackerScreen } from './src/screens/PrayerTrackerScreen';
import { LearnScreen } from './src/screens/LearnScreen';
import { QiblaScreen } from './src/screens/QiblaScreen';
import { MoodScreen } from './src/screens/MoodScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { UmrahGuideScreen } from './src/screens/UmrahGuideScreen';
import { HajjGuideScreen } from './src/screens/HajjGuideScreen';
import { JanazaScreen } from './src/screens/JanazaScreen';
import { EidScreen } from './src/screens/EidScreen';
import { TasbihScreen } from './src/screens/TasbihScreen';
import { SacredJourneyScreen } from './src/screens/SacredJourneyScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { QuranScreen } from './src/screens/QuranScreen';
import { Sidebar } from './src/components/Sidebar';
import { QuranNavProvider, useQuranNav } from './src/contexts/QuranNavContext';
import { SidebarProvider } from './src/contexts/SidebarContext';
import { theme } from './src/constants/theme';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { SimpleModeProvider } from './src/contexts/SimpleModeContext';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableLogs: true,
  tracesSampleRate: 0.2,
  sendDefaultPii: false,
});

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: { componentStack?: string }) {
    captureError(error, { componentStack: info.componentStack });
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF4E8', padding: 32 }}>
          <Text style={{ fontSize: 32, marginBottom: 16 }}>🤲</Text>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1C0F06', textAlign: 'center', marginBottom: 8 }}>Something went wrong</Text>
          <Text style={{ fontSize: 14, color: '#7A5A40', textAlign: 'center' }}>Please close and reopen the app. Your data is safe.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

SplashScreen.preventAutoHideAsync();

(async () => {
  await requestAdsConsent();
  await initAds();
})().catch(() => {});

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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

function MainTabs() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const tabBarPaddingBottom = insets.bottom + 6;
  const tabBarHeight = 28 + 14 + 4 + tabBarPaddingBottom;

  return (
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
      <Sidebar />
    </View>
  );
}

function AppStack({ onLayout }: { onLayout: () => void }) {
  const { pendingSurah } = useQuranNav();
  const navRef = useNavigationContainerRef();

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
          <Stack.Screen name="MainTabs" component={MainTabs} />
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
            name="Hajj"
            component={HajjGuideScreen}
            options={{ headerShown: true, title: 'Hajj Guide', headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.accent, headerTitleStyle: { fontFamily: theme.typography.fontBodyBold, color: theme.colors.text } }}
          />
          <Stack.Screen
            name="Janaza"
            component={JanazaScreen}
            options={{ headerShown: true, title: 'Janaza Guide', headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.accent, headerTitleStyle: { fontFamily: theme.typography.fontBodyBold, color: theme.colors.text } }}
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
          <Stack.Screen
            name="Eid"
            component={EidScreen}
            options={{ headerShown: true, title: 'Eid Guide', headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.accent, headerTitleStyle: { fontFamily: theme.typography.fontBodyBold, color: theme.colors.text } }}
          />
          <Stack.Screen
            name="Tasbih"
            component={TasbihScreen}
            options={{ headerShown: true, title: 'Tasbih Counter', headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.accent, headerTitleStyle: { fontFamily: theme.typography.fontBodyBold, color: theme.colors.text } }}
          />
          <Stack.Screen
            name="SacredJourney"
            component={SacredJourneyScreen}
            options={{ headerShown: true, title: 'Sacred Journey', headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.accent, headerTitleStyle: { fontFamily: theme.typography.fontBodyBold, color: theme.colors.text } }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

function AppInner() {
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

  useEffect(() => {
    if (!fontsLoaded || onboardingDone !== true) return;
    // Delay trickle-prefetch so first-paint network stays clear. Runs once
    // per app-install and is a no-op when surahs are already cached.
    const t = setTimeout(() => { prefetchAllSurahs().catch(() => {}); }, 4000);
    trackAppOpen().then(() => {
      setTimeout(() => { maybePromptReview().catch(() => {}); }, 20000);
    });
    return () => clearTimeout(t);
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
    <ErrorBoundary>
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
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
    </ErrorBoundary>
  );
}

export default Sentry.wrap(wrap(AppInner));

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

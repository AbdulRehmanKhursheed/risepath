import React, { useCallback, useState, useEffect, useRef, Component, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets, initialWindowMetrics } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, useNavigationContainerRef, CommonActions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
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
import { prefetchAllSurahs, purgeQuranCacheOnce } from './src/services/quran';
import { captureError } from './src/services/sentry';
import { requestAdsConsent } from './src/services/consent';
import { trackAppOpen, maybePromptReview } from './src/services/review';
import {
  requestNotificationPermissions,
  setupNotificationChannel,
  scheduleStreakReminder,
  scheduleJumuahReminder,
  rebuildPrayerScheduleFromStorage,
} from './src/services/notifications';
import * as Location from 'expo-location';
import { requestLocationPermissionOnce } from './src/hooks/useLocation';
import { storage } from './src/services/storage';
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
import { DuaScreen } from './src/screens/DuaScreen';
import { AsmaulHusnaScreen } from './src/screens/AsmaulHusnaScreen';
import { HifzScreen } from './src/screens/HifzScreen';
import { QurbaniScreen } from './src/screens/QurbaniScreen';
import { TakbirScreen } from './src/screens/TakbirScreen';
import { Sidebar } from './src/components/Sidebar';
import { QuranNavProvider, useQuranNav } from './src/contexts/QuranNavContext';
import { SidebarProvider } from './src/contexts/SidebarContext';
import { theme } from './src/constants/theme';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { I18nProvider } from './src/contexts/I18nProvider';
import { SimpleModeProvider } from './src/contexts/SimpleModeContext';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  // The listing claims "no tracking, data stays on device". Sentry crash
  // payloads are an acceptable narrow exception (anonymous error reports),
  // but routing console.log output to Sentry would broaden that and break
  // the claim. Keep logs local.
  enableLogs: false,
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

// Ads consent + init at module load is fire-and-forget so it can't block
// render, but each step is wrapped in a 4s timeout so a slow Google
// SDK init or a stalled consent form can't keep the JS thread busy on
// cold start. Functionality degrades gracefully (non-personalized
// ads or no ads) rather than the app feeling slow on first launch.
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}
(async () => {
  await withTimeout(requestAdsConsent(), 4000);
  await withTimeout(initAds(), 4000);
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
  const { pendingSurah } = useQuranNav();

  const [activeSurah, setActiveSurah] = useState<number | undefined>(() =>
    pendingSurah !== null ? pendingSurah : undefined
  );
  const [mountKey, setMountKey] = useState(0);

  useEffect(() => {
    if (pendingSurah !== null) {
      setActiveSurah(pendingSurah);
      setMountKey((k) => k + 1);
    }
  }, [pendingSurah]);

  return <QuranScreen key={mountKey} initialSurah={activeSurah} />;
}

function MainTabs() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const tabBarPaddingBottom = insets.bottom + 25;
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

function routeForNotificationId(id: string): { name: string; params?: object } | null {
  if (!id) return null;
  if (id.startsWith('pr:') || id.startsWith('streak:') || id.startsWith('jumu:')) {
    return { name: 'MainTabs', params: { screen: 'Prayers' } };
  }
  if (id.startsWith('sc:')) {
    return { name: 'SacredJourney' };
  }
  return null;
}

function AppStack({ onLayout }: { onLayout: () => void }) {
  const { pendingSurah, clearPending } = useQuranNav();
  const navRef = useNavigationContainerRef();
  const [navReady, setNavReady] = useState(false);
  const lastNotifResponse = Notifications.useLastNotificationResponse();
  const handledNotifIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (pendingSurah === null || !navReady || !navRef.isReady()) return;
    navRef.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: { screen: 'Quran' },
      })
    );
    clearPending();
  }, [pendingSurah, navReady, navRef, clearPending]);

  // Cold-launch tap: useLastNotificationResponse fires once with the response
  // that opened the app. Deduped by identifier so we don't re-navigate on
  // every render of AppStack.
  useEffect(() => {
    if (!navReady || !navRef.isReady() || !lastNotifResponse) return;
    const id = lastNotifResponse.notification.request.identifier ?? '';
    if (handledNotifIdRef.current === id) return;
    const route = routeForNotificationId(id);
    if (!route) return;
    handledNotifIdRef.current = id;
    navRef.dispatch(CommonActions.navigate(route));
  }, [lastNotifResponse, navReady, navRef]);

  // Foreground / background tap: live response listener routes to the same
  // place. iOS sometimes only fires this; Android sometimes only fires
  // useLastNotificationResponse — wire both to be safe.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (!navRef.isReady()) return;
      const id = response.notification.request.identifier ?? '';
      const route = routeForNotificationId(id);
      if (!route) return;
      handledNotifIdRef.current = id;
      navRef.dispatch(CommonActions.navigate(route));
    });
    return () => sub.remove();
  }, [navRef]);

  return (
    <View style={styles.root} onLayout={onLayout}>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />
      <NavigationContainer ref={navRef} theme={NAV_THEME} onReady={() => setNavReady(true)}>
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
          <Stack.Screen
            name="Duas"
            component={DuaScreen}
            options={{ headerShown: true, title: 'Dua Library', headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.accent, headerTitleStyle: { fontFamily: theme.typography.fontBodyBold, color: theme.colors.text } }}
          />
          <Stack.Screen
            name="Names"
            component={AsmaulHusnaScreen}
            options={{ headerShown: true, title: '99 Names of Allah', headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.accent, headerTitleStyle: { fontFamily: theme.typography.fontBodyBold, color: theme.colors.text } }}
          />
          <Stack.Screen
            name="Hifz"
            component={HifzScreen}
            options={{ headerShown: true, title: 'Hifz Tracker', headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.accent, headerTitleStyle: { fontFamily: theme.typography.fontBodyBold, color: theme.colors.text } }}
          />
          <Stack.Screen
            name="Qurbani"
            component={QurbaniScreen}
            options={{ headerShown: true, title: 'Qurbani Calculator', headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.accent, headerTitleStyle: { fontFamily: theme.typography.fontBodyBold, color: theme.colors.text } }}
          />
          <Stack.Screen
            name="Takbir"
            component={TakbirScreen}
            options={{ headerShown: true, title: 'Takbir of Tashreeq', headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.accent, headerTitleStyle: { fontFamily: theme.typography.fontBodyBold, color: theme.colors.text } }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

function AppInner() {
  const [fontsLoaded, fontError] = useFonts({
    Syne_600SemiBold,
    Syne_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    // Quran fonts. AmiriQuran = Madinah/Uthmani Mushaf style.
    // NoorehudaQuran = Indo-Pak script (familiar to South-Asian readers).
    AmiriQuran: require('./assets/fonts/AmiriQuran-Regular.ttf'),
    NoorehudaQuran: require('./assets/fonts/NoorehudaRegular.ttf'),
  });
  // Safety net: if useFonts somehow never resolves (asset loader hung,
  // device storage issue, hot-reload edge), render anyway after 6s with
  // system-font fallbacks. Better an imperfect-looking app than a dead
  // splash screen — the funeral incident proved that.
  const [fontGiveUp, setFontGiveUp] = useState(false);
  useEffect(() => {
    if (fontsLoaded) return;
    const t = setTimeout(() => setFontGiveUp(true), 6000);
    return () => clearTimeout(t);
  }, [fontsLoaded]);
  const fontsReady = fontsLoaded || fontError !== null || fontGiveUp;
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    let settled = false;
    AsyncStorage.getItem('onboarding_complete')
      .then((val) => {
        if (!mounted) return;
        settled = true;
        setOnboardingDone(val === 'true');
      })
      .catch(() => {
        if (!mounted) return;
        settled = true;
        setOnboardingDone(false);
      });
    // Safety net: if AsyncStorage hangs (corrupted SQLite, locked DB,
    // extreme system load), don't trap users on an infinite loading
    // spinner. Fall back to "show onboarding" after 3s — fresh-install
    // users were going to see it anyway, and returning users will be
    // re-onboarded once (annoying but recoverable).
    const t = setTimeout(() => {
      if (!mounted || settled) return;
      setOnboardingDone(false);
    }, 3000);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsReady && onboardingDone !== null) {
      await SplashScreen.hideAsync();
    }
  }, [fontsReady, onboardingDone]);

  useEffect(() => {
    if (!fontsReady || onboardingDone !== true) return;
    // One-time purge of the bulk Quran cache for users upgrading from an
    // earlier build whose trickle-prefetch filled AsyncStorage to the 6MB
    // SQLite cap (which then blocked streak/goal/prayer writes with
    // SQLITE_FULL). Idempotent; the flag inside makes this a no-op after
    // the first successful run.
    purgeQuranCacheOnce().catch(() => {});
    // prefetchAllSurahs is now a no-op (kept for signature compat); the
    // call stays so a future re-enable point is visible in this file.
    const t = setTimeout(() => { prefetchAllSurahs().catch(() => {}); }, 4000);
    let reviewTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    trackAppOpen().then(() => {
      if (cancelled) return;
      reviewTimer = setTimeout(() => { maybePromptReview().catch(() => {}); }, 20000);
    });

    // Bundle first-launch permission prompts (notifications + location),
    // schedule streak + 7-day prayer reminders, and start an AppState listener
    // that re-runs the prayer schedule on every resume — that listener is the
    // safety net for users who don't open the Prayers tab daily and for devices
    // that wipe scheduled alarms after reboot.
    (async () => {
      try {
        const notifGranted = await requestNotificationPermissions();
        if (notifGranted) {
          await setupNotificationChannel();
          const savedLang = (await AsyncStorage.getItem('app_language')) as 'en' | 'ur' | 'ar' | null;
          await scheduleStreakReminder(savedLang ?? 'en');
          await scheduleJumuahReminder(savedLang ?? 'en');
          await rebuildPrayerScheduleFromStorage().catch(() => {});
        }
      } catch {}

      try {
        const { status } = await requestLocationPermissionOnce();
        if (status === 'granted') {
          const result = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          await storage.setLocation({
            latitude: result.coords.latitude,
            longitude: result.coords.longitude,
          });
          // Reschedule once we know the real location so day-1 prayers are
          // computed with the user's coords instead of the Karachi default.
          await rebuildPrayerScheduleFromStorage().catch(() => {});
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
      clearTimeout(t);
      if (reviewTimer) clearTimeout(reviewTimer);
    };
  }, [fontsReady, onboardingDone]);

  // Re-run the prayer schedule on every resume. Idempotent and lightweight,
  // but throttled to once per 30 s to avoid hammering on rapid state churn.
  const lastResumeRebuildAt = useRef<number>(0);
  useEffect(() => {
    if (!fontsReady || onboardingDone !== true) return;
    const onChange = (state: AppStateStatus) => {
      if (state !== 'active') return;
      const now = Date.now();
      if (now - lastResumeRebuildAt.current < 30_000) return;
      lastResumeRebuildAt.current = now;
      rebuildPrayerScheduleFromStorage().catch(() => {});
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [fontsReady, onboardingDone]);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_complete', 'true');
    } catch {
      // Storage write can fail (full disk, corrupted SQLite); we still
      // want to advance the user out of the onboarding screen rather
      // than trapping them there. Next launch will re-show onboarding,
      // which is the correct degradation.
    }
    setOnboardingDone(true);
  };

  if (!fontsReady || onboardingDone === null) {
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
        <I18nProvider>
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
        </I18nProvider>
      </LanguageProvider>
    </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(AppInner);

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

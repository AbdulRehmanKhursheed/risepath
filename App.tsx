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
  // the claim. Keep logs local. Same reasoning for performance tracing:
  // transactions are not crash reports, so sampling stays at 0 to keep the
  // "anonymous crash reports only" disclosure truthful.
  enableLogs: false,
  tracesSampleRate: 0,
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
// render. The network step inside requestAdsConsent (requestInfoUpdate) is
// capped at 4s internally so a dead network can't stall this chain on cold
// start — but the consent *form* itself is user-paced and never timed out,
// because cutting it off would record no choice. initAds() is gated on UMP
// canRequestAds (Google policy: no SDK init / ad requests until consent
// gathering is complete); when consent isn't granted, ads simply stay off
// rather than the app feeling slow on first launch.
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
  // QuranTab owns the pendingSurah lifecycle: it consumes the value and only
  // then clears it. AppStack deliberately does NOT clearPending — clearing
  // there used to batch with the navigation dispatch (React 19 automatic
  // batching), so on the first lazy mount of this tab the useState
  // initializer saw null and the "Read Surah" deep link dropped the surah.
  const { pendingSurah, clearPending } = useQuranNav();

  const [activeSurah, setActiveSurah] = useState<number | undefined>(() =>
    pendingSurah !== null ? pendingSurah : undefined
  );
  const [mountKey, setMountKey] = useState(0);
  // Surah captured by the useState initializer at first mount (if any). The
  // first effect run must not bump mountKey for it — QuranScreen is already
  // mounted with that surah, and bumping would unmount/remount it (double
  // mount + duplicate openSurah bookkeeping).
  const initialPendingRef = useRef(pendingSurah);

  useEffect(() => {
    if (pendingSurah === null) return;
    const consumedAtMount = initialPendingRef.current;
    initialPendingRef.current = null;
    if (consumedAtMount === pendingSurah) {
      // Already showing this surah via the initializer; just release the
      // pending value now that it has been consumed.
      clearPending();
      return;
    }
    setActiveSurah(pendingSurah);
    setMountKey((k) => k + 1);
    clearPending();
  }, [pendingSurah, clearPending]);

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
  const { pendingSurah } = useQuranNav();
  const navRef = useNavigationContainerRef();
  const [navReady, setNavReady] = useState(false);
  const lastNotifResponse = Notifications.useLastNotificationResponse();
  const handledNotifIdRef = useRef<string | null>(null);

  // Only dispatch the navigation here. Do NOT clearPending in this effect:
  // with a lazily-mounted Quran tab, the clear would batch into the same
  // commit as the navigation state update, so QuranTab's useState
  // initializer would read pendingSurah as null and the deep link would
  // land on the surah list instead of the requested surah. QuranTab clears
  // the value itself once it has actually consumed it.
  useEffect(() => {
    if (pendingSurah === null || !navReady || !navRef.isReady()) return;
    navRef.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: { screen: 'Quran' },
      })
    );
  }, [pendingSurah, navReady, navRef]);

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
        if (!mounted || settled) return;
        settled = true;
        setOnboardingDone(val === 'true');
      })
      .catch(() => {
        if (!mounted || settled) return;
        settled = true;
        setOnboardingDone(false);
      });
    // Safety net: if AsyncStorage hangs (corrupted SQLite, locked DB,
    // extreme system load), don't trap users on an infinite loading
    // spinner. Fall back to "show onboarding" after 5s — fresh-install
    // users were going to see it anyway, and returning users will be
    // re-onboarded once (annoying but recoverable; OnboardingScreen now
    // hydrates from + preserves previously saved prayer settings, so a
    // re-onboard no longer clobbers their choices). 5s rather than 3s so
    // merely-slow storage (not hung) resolves before the fallback fires;
    // the normal path settles in milliseconds.
    const t = setTimeout(() => {
      if (!mounted || settled) return;
      // Mark settled before the state set so a late-resolving promise
      // doesn't double-write and cause an onboarding flicker.
      settled = true;
      setOnboardingDone(false);
    }, 5000);
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
    trackAppOpen()
      .then(() => {
        if (cancelled) return;
        reviewTimer = setTimeout(() => {
          maybePromptReview().catch((e) => captureError(e, { scope: 'review-prompt' }));
        }, 20000);
      })
      .catch((e) => captureError(e, { scope: 'review-track-open' }));

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
          await rebuildPrayerScheduleFromStorage().catch((e) =>
            captureError(e, { scope: 'startup-prayer-schedule' })
          );
        }
      } catch (e) {
        // Notification setup failing silently is exactly the class of
        // intermittent "reminders never fired" issue we can't reproduce
        // locally — report it instead of flying blind.
        captureError(e, { scope: 'startup-notifications' });
      }

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
          await rebuildPrayerScheduleFromStorage().catch((e) =>
            captureError(e, { scope: 'startup-prayer-schedule' })
          );
        }
      } catch {
        // Intentionally silent: getCurrentPositionAsync rejects routinely
        // (location services off, airplane mode) and the Karachi fallback
        // handles it — reporting would be pure noise.
      }
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
      rebuildPrayerScheduleFromStorage().catch((e) =>
        captureError(e, { scope: 'resume-prayer-schedule' })
      );
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [fontsReady, onboardingDone]);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_complete', 'true');
    } catch (e) {
      // Storage write can fail (full disk, corrupted SQLite); we still
      // want to advance the user out of the onboarding screen rather
      // than trapping them there. Next launch will re-show onboarding,
      // which is the correct degradation — but report it so repeated
      // re-onboarding in the wild is visible.
      captureError(e, { scope: 'onboarding-flag-write' });
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

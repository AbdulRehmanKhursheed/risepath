import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage, AdhanSettings, AdhanPrayerName } from './storage';
import { computePrayerTimesForDate, PRAYER_NAMES } from './notifications';
import type { CalculationMethodId, MadhabId } from '../constants/prayerMethods';
import type { Language } from '../constants/translations';
import { captureError } from './sentry';

// Full adhan audio ALARMS at exact prayer times — distinct from the 5-min-
// before reminders in notifications.ts (expo-notifications). These use
// react-native-notify-kit (the maintained Notifee successor) because
// expo-notifications cannot deliver them: notification-stream sounds are
// truncated by OEMs (~5s on Samsung/Xiaomi), and there is no full-screen
// intent or AlarmManager SET_ALARM_CLOCK scheduling. SET_ALARM_CLOCK is the
// same primitive as the stock Clock app — the most OEM-kill-resistant trigger
// there is, and the library self-heals triggers across reboots via a
// BOOT_COUNT check even when OEMs suppress BOOT_COMPLETED.
//
// Everything is lazily loaded and guarded: in Expo Go or an older dev client
// the native module is missing, and every entry point must degrade to a
// silent no-op rather than crash (same contract as ads.ts).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _notifee: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _kit: any = null;

function loadNotifyKit(): boolean {
  if (_notifee) return true;
  if (Platform.OS !== 'android') return false; // Android-only feature for now
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const m = require('react-native-notify-kit');
    if (!m?.default) return false;
    _notifee = m.default;
    _kit = m;
    return true;
  } catch {
    return false;
  }
}

// Probe that the NATIVE side is actually present (the JS require succeeds
// even in builds without the module; the first real call would throw).
let nativeProbed: boolean | null = null;
async function nativeAvailable(): Promise<boolean> {
  if (!loadNotifyKit()) return false;
  if (nativeProbed !== null) return nativeProbed;
  try {
    await _notifee.getNotificationSettings();
    nativeProbed = true;
  } catch {
    nativeProbed = false;
  }
  return nativeProbed;
}

export async function isAdhanAvailable(): Promise<boolean> {
  return nativeAvailable();
}

const ADHAN_ID_PREFIX = 'adhan:';
// Channels are immutable once created — version the IDs so a future sound or
// behavior change can ship as -v2 without fighting stale user channels.
const CHANNELS = {
  short: { id: 'adhan-short-v1', sound: 'adhan_short_v1', name: 'Azan Alarm' },
  full: { id: 'adhan-full-v1', sound: 'adhan_v1', name: 'Azan Alarm (full)' },
  fajr: { id: 'adhan-fajr-v1', sound: 'adhan_fajr_v1', name: 'Azan Alarm — Fajr' },
} as const;

// Days of adhan alarms kept armed ahead. SET_ALARM_CLOCK alarms are heavier
// than plain notifications (status-bar alarm icon, OS bookkeeping), so keep
// the window short — it re-arms on every app open/resume anyway, and the
// library re-arms persisted triggers after reboot on its own.
const ADHAN_DAYS_AHEAD = 2;

const ADHAN_BODY: Record<Language, (name: string) => string> = {
  en: (name) => `It's time for ${name}. Hayya 'alas-salah — come to prayer.`,
  ur: (name) => `${name} کا وقت ہو گیا۔ حی علی الصلاۃ — نماز کی طرف آئیں۔`,
  ar: (name) => `حان وقت ${name}. حيّ على الصلاة.`,
};

async function createAdhanChannels(): Promise<void> {
  for (const ch of Object.values(CHANNELS)) {
    await _notifee.createChannel({
      id: ch.id,
      name: ch.name,
      importance: _kit.AndroidImportance.HIGH,
      sound: ch.sound,
      bypassDnd: true,
      vibration: true,
      visibility: _kit.AndroidVisibility.PUBLIC,
    });
  }
}

function channelFor(prayer: AdhanPrayerName, settings: AdhanSettings): string {
  if (prayer === 'Fajr' && settings.fajrGentle) return CHANNELS.fajr.id;
  return settings.soundLength === 'full' ? CHANNELS.full.id : CHANNELS.short.id;
}

async function cancelAdhanAlarms(): Promise<void> {
  const ids: string[] = await _notifee.getTriggerNotificationIds();
  await Promise.all(
    ids
      .filter((id) => id.startsWith(ADHAN_ID_PREFIX))
      .map((id) => _notifee.cancelTriggerNotification(id).catch(() => {}))
  );
}

function buildNotification(
  id: string,
  prayer: AdhanPrayerName,
  channelId: string,
  language: Language
) {
  const name = PRAYER_NAMES[language]?.[prayer] ?? prayer;
  const body = (ADHAN_BODY[language] ?? ADHAN_BODY.en)(name);
  return {
    id,
    title: `🕌 ${name}`,
    body,
    android: {
      channelId,
      category: _kit.AndroidCategory.ALARM,
      visibility: _kit.AndroidVisibility.PUBLIC,
      // Wakes the screen over the lock screen at prayer time. Requires the
      // USE_FULL_SCREEN_INTENT permission + Play Console declaration; when the
      // OS denies FSI the notification still shows heads-up on the HIGH
      // channel, so this degrades gracefully.
      fullScreenAction: { id: 'default' },
      pressAction: { id: 'default' },
      autoCancel: true,
      showTimestamp: true,
    },
  };
}

// Cancels and re-arms all adhan alarms from stored settings. Safe to call on
// boot, resume, and after any settings change; no-ops when the native module
// is absent or every prayer is disabled.
export async function rebuildAdhanAlarmsFromStorage(): Promise<number> {
  try {
    if (!(await nativeAvailable())) return 0;

    const [settings, loc, prayerSettings, storedLang] = await Promise.all([
      storage.getAdhanSettings(),
      storage.getLocation(),
      storage.getPrayerSettings(),
      AsyncStorage.getItem('app_language').catch(() => null),
    ]);

    await cancelAdhanAlarms();

    const anyEnabled = Object.values(settings.enabled).some(Boolean);
    if (!anyEnabled) return 0;

    await createAdhanChannels();

    const lat = loc?.latitude ?? 24.8607;
    const lng = loc?.longitude ?? 67.0011;
    const method = (prayerSettings?.calculationMethod as CalculationMethodId) ?? 'Karachi';
    const madhab = (prayerSettings?.madhab as MadhabId) ?? 'Shafi';
    const language: Language =
      storedLang === 'ur' || storedLang === 'ar' ? storedLang : 'en';

    const now = Date.now();
    let scheduled = 0;

    for (let dayOffset = 0; dayOffset < ADHAN_DAYS_AHEAD; dayOffset += 1) {
      const target = new Date();
      target.setDate(target.getDate() + dayOffset);
      target.setHours(12, 0, 0, 0); // noon anchor, same as the reminder scheduler
      const prayers = computePrayerTimesForDate(lat, lng, target, method, madhab);

      for (const prayer of prayers) {
        const name = prayer.name as AdhanPrayerName;
        if (!settings.enabled[name]) continue;
        const ts = prayer.time.getTime();
        if (ts <= now) continue;

        await _notifee.createTriggerNotification(
          buildNotification(`${ADHAN_ID_PREFIX}${name}:${ts}`, name, channelFor(name, settings), language),
          {
            type: _kit.TriggerType.TIMESTAMP,
            timestamp: ts,
            alarmManager: { type: _kit.AlarmType.SET_ALARM_CLOCK },
          }
        );
        scheduled += 1;
      }
    }
    return scheduled;
  } catch (e) {
    captureError(e, { scope: 'adhan-rebuild' });
    return 0;
  }
}

// Fires a real adhan alarm ~10 seconds out so the user can lock the phone and
// verify the whole path: exact alarm, full-screen wake, channel sound,
// DND bypass, OEM battery whitelist.
export async function sendTestAdhan(): Promise<boolean> {
  try {
    if (!(await nativeAvailable())) return false;
    await _notifee.requestPermission();
    await createAdhanChannels();
    const settings = await storage.getAdhanSettings();
    const storedLang = await AsyncStorage.getItem('app_language').catch(() => null);
    const language: Language =
      storedLang === 'ur' || storedLang === 'ar' ? storedLang : 'en';
    await _notifee.createTriggerNotification(
      buildNotification(`${ADHAN_ID_PREFIX}test:${Date.now()}`, 'Dhuhr', channelFor('Dhuhr', settings), language),
      {
        type: _kit.TriggerType.TIMESTAMP,
        timestamp: Date.now() + 10_000,
        alarmManager: { type: _kit.AlarmType.SET_ALARM_CLOCK },
      }
    );
    return true;
  } catch (e) {
    captureError(e, { scope: 'adhan-test' });
    return false;
  }
}

// ─── Reliability diagnostics for the setup checklist ────────────────────────

export type AdhanDiagnostics = {
  available: boolean;
  notificationsGranted: boolean;
  exactAlarmGranted: boolean;
  batteryOptimized: boolean; // true = still optimized = BAD, user should exempt
  hasOemPowerManager: boolean; // vendor autostart/protected-apps screen exists
};

export async function getAdhanDiagnostics(): Promise<AdhanDiagnostics> {
  const unavailable: AdhanDiagnostics = {
    available: false,
    notificationsGranted: false,
    exactAlarmGranted: false,
    batteryOptimized: false,
    hasOemPowerManager: false,
  };
  try {
    if (!(await nativeAvailable())) return unavailable;
    const [ns, batteryOptimized, pm] = await Promise.all([
      _notifee.getNotificationSettings(),
      _notifee.isBatteryOptimizationEnabled().catch(() => false),
      _notifee.getPowerManagerInfo().catch(() => null),
    ]);
    return {
      available: true,
      notificationsGranted:
        ns?.authorizationStatus === _kit.AuthorizationStatus.AUTHORIZED,
      // AndroidNotificationSetting.ENABLED — SCHEDULE_EXACT_ALARM is denied by
      // default on Android 14+ until the user grants "Alarms & reminders".
      exactAlarmGranted: ns?.android?.alarm === _kit.AndroidNotificationSetting.ENABLED,
      batteryOptimized: batteryOptimized === true,
      hasOemPowerManager: !!pm?.activity,
    };
  } catch {
    return unavailable;
  }
}

export async function requestAdhanNotificationPermission(): Promise<void> {
  if (!(await nativeAvailable())) return;
  await _notifee.requestPermission().catch(() => {});
}

export async function openExactAlarmSettings(): Promise<void> {
  if (!(await nativeAvailable())) return;
  await _notifee.openAlarmPermissionSettings().catch(() => {});
}

export async function openBatteryOptimizationSettings(): Promise<void> {
  if (!(await nativeAvailable())) return;
  await _notifee.openBatteryOptimizationSettings().catch(() => {});
}

export async function openOemPowerManagerSettings(): Promise<void> {
  if (!(await nativeAvailable())) return;
  await _notifee.openPowerManagerSettings().catch(() => {});
}

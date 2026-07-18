# "Never Miss Fajr" — Adhan Alarm Implementation Plan

Research-backed plan (2026-07-18) for the full adhan audio alarm + OEM
reliability suite. This is Noor's #1 differentiator: *the adhan doesn't go
off* is the top 1-star complaint across Muslim Pro, Athan, and Umma —
worst on Xiaomi/Oppo/Vivo, which dominate Pakistan and Indonesia.

## Audio — licensing (DO NOT skip this)

**Never ship**: Alafasy, Makkah/Madinah recordings, archive.org community
uploads, IslamCan, Assabile, AlAdhan/PrayTimes downloads. The adhan *text*
is public domain; famous *performances* are copyrighted, and Noor is
ad-supported (commercial). Distributor terms for Alafasy explicitly say
non-commercial personal use only.

**Verified safe candidates**:
1. **Primary**: Freesound #583206 — Marrakech adhan, CC0, recordist-owned
   field recording (Zoom H6), 3:06 WAV 96kHz. Needs denoise/EQ; master a
   60–90s edit + keep full length. https://freesound.org/people/Redalemage/sounds/583206/
2. **Alternate voice**: Freesound #255231 — Hamtramck MI, CC BY 3.0 (add a
   credits line in Settings/About). https://freesound.org/s/255231/
3. Wikimedia Commons Category:Adhan has CC0/CC-BY files — verify each file
   page's license before use (some pending license review).

**Fajr adhan** (with *as-salatu khayrun min an-nawm*): no permissively
licensed recording found. Short-term: trimmed gentle edit of #1 + soft
chime option. Proper fix: **commission a muadhin recording (~$50–200,
written commercial buyout, full + short + Fajr versions)** — the industry
standard. Also ship Al-Azan-style "import your own adhan" so users can
load Alafasy privately (their personal use, not our distribution).

## Tech — one new dependency

- **expo-notifications cannot do this**: notification-stream sounds get
  truncated (~5s on Samsung/Xiaomi), no full-screen intent, no loop/stop
  UI, dies with OEM app-kills.
- **Notifee is archived (April 2026). Do not adopt.** Use its
  Invertase-endorsed successor **react-native-notify-kit** (Apache-2.0,
  Notifee-API-compatible, New Architecture, Expo config plugin):
  https://github.com/marcocrupi/react-native-notify-kit
- Architecture (mirrors the proven open-source RN prayer app Al-Azan):
  1. Channels `adhan_v1` + `adhan_fajr_v1`: importance high, custom raw
     sound, alarm-stream audio usage, `bypassDnd: true`. Channels are
     immutable — version the IDs.
  2. Trigger notifications with `alarmManager: { type: SET_ALARM_CLOCK }`
     (most OEM-kill-resistant primitive; earns Doze exemption + status-bar
     alarm icon), `fullScreenAction`, category ALARM, Stop/Snooze actions.
  3. Reschedule 24–48h of prayers on app open + boot (verify notify-kit's
     RECEIVE_BOOT_COMPLETED re-registration on a real device).
  4. Permissions: keep `SCHEDULE_EXACT_ALARM` (already declared) — on
     Android 14+ it's denied by default; add an in-app grant flow via
     `ACTION_REQUEST_SCHEDULE_EXACT_ALARM`. Add `USE_FULL_SCREEN_INTENT`
     + complete the **Play Console FSI declaration** (user-configured
     prayer alarm = core alarm functionality); runtime-check
     `canUseFullScreenIntent()` and degrade to heads-up notification.
     Avoid `USE_EXACT_ALARM` (Play rejection risk for non-clock apps).

## OEM "Reliable adhan" wizard (works for existing reminders too)

One-time setup flow + Settings entry, steps in order:
1. POST_NOTIFICATIONS grant
2. Exact-alarm grant (Android 14+) if `canScheduleExactAlarms()` is false
3. OEM autostart screen (try/catch + `queryIntentActivities`, fallback to
   app-details settings):
   - Xiaomi: `com.miui.securitycenter` / `com.miui.permcenter.autostart.AutoStartManagementActivity`
   - Oppo: `com.coloros.safecenter/.permission.startup.StartupAppListActivity`
     (fallback `com.oppo.safe/.permission.startup.StartupAppListActivity`)
   - Vivo: `com.vivo.permissionmanager/.activity.BgStartUpManagerActivity`
     (fallback `com.iqoo.secure/.ui.phoneoptimize.AddWhiteListActivity`)
   - Samsung: `com.samsung.android.lool/com.samsung.android.sm.battery.ui.BatteryActivity`
   - Full table: https://github.com/judemanutd/AutoStarter (AutoStartPermissionHelper.kt)
4. Battery-optimization exemption (`ACTION_IGNORE_BATTERY_OPTIMIZATIONS`)
5. **"Test my adhan"** — fires a 10s-delayed alarm to verify end-to-end
   (also check alarm-stream volume > 0 and warn on "Total silence" DND)

## QA gate before release

Pixel emulator + Maestro won't catch OEM kills. Test on a real or cloud
Xiaomi (HyperOS) device: app swiped from recents, idle 30+ min, DND on,
silent mode, post-reboot. Fajr-time test mandatory.

## ASO tie-in

Once shipped, the short description can honestly say **"Azan alarm"**
(top-tier keyword in all 5 target markets) instead of "Azan reminders",
and the listing gains the line the research wrote: *"The adhan that
actually goes off — even on Xiaomi, even offline, and we never know where
you are."*

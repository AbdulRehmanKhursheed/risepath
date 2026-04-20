# Noor — Play Store Launch Checklist

Everything outside the codebase you need before you upload the first AAB.

---

## 1. Sentry (crash reporting) — free, 5k errors/mo

**One-time setup (10 min):**

1. Sign up at https://sentry.io (free, no credit card).
2. Create a new project → platform: **React Native**.
3. Copy the DSN (looks like `https://abc@o12345.ingest.sentry.io/67890`).
4. Paste into `.env`:
   ```
   EXPO_PUBLIC_SENTRY_DSN=https://...your-dsn...
   ```
5. For **source maps** (so stack traces are readable), run once:
   ```
   npx @sentry/wizard@latest -s -i reactNative
   ```
   Follow the prompts, accept defaults.
6. Next EAS build will auto-upload source maps. Crashes will appear in the Sentry dashboard.

Sentry is already wired in `src/services/sentry.ts` and `App.tsx`. If the DSN is empty, it silently no-ops in dev.

---

## 2. AdMob GDPR / UMP Consent — free, wired already

Already implemented in `src/services/consent.ts`, called before `initAds()` in `App.tsx`.

**What to verify in AdMob console:**

1. Go to https://apps.admob.com → Privacy & messaging → GDPR.
2. Create a **GDPR message** for EU traffic (Google's default template is fine).
3. Publish it. The app will show it automatically to EU users via `AdsConsent.showFormIfRequired()`.
4. Also publish the **CCPA** message (Google provides template; covers California users).

No code changes needed after this — the form is hosted by Google.

---

## 3. Data Safety form (Play Console) — required

In Play Console → App content → Data safety, declare:

| Data type | Collected? | Shared? | Purpose | Optional? |
|---|---|---|---|---|
| **Approximate location** | Yes | No | App functionality (prayer times) | Yes |
| **Precise location** | Yes | No | App functionality (prayer times & qibla) | Yes |
| **Device or other IDs (AdMob)** | Yes | Yes (to Google AdMob) | Advertising, analytics | No |
| **App activity (crashes via Sentry)** | Yes | Yes (to Sentry) | Crash diagnostics | No |
| **Personal info** | No | — | — | — |
| **Financial info** | No | — | — | — |
| **Messages / photos / audio** | No | — | — | — |
| **Contacts / calendar / files** | No | — | — | — |

**Encryption in transit:** Yes (all requests HTTPS).
**Data deletion:** Users can delete all data by uninstalling (AsyncStorage is local). Declare this.
**Privacy policy URL:** Host `PRIVACY_POLICY.md` as HTML somewhere (GitHub Pages, Netlify free tier). Paste the URL into the form.

---

## 4. App signing key — CRITICAL, back this up

When you run `eas build --platform android --profile production` the first time, EAS generates a keystore and stores it in EAS servers.

**Back it up locally:**
```
eas credentials
```
→ Android → production → Download keystore.

Save the `.jks` file AND the key password in:
- Your password manager (1Password / Bitwarden)
- A second encrypted location (external drive, iCloud secure note)

**If you ever lose this keystore, you can never update the app on Play Store.** Google will force you to ship as a new app.

---

## 5. Target SDK — already handled

Expo SDK 54 targets Android SDK 35 / minimum API 24. Play Store requires API 34+ for new apps — you're compliant.

Verify after build:
```
eas build --platform android --profile production
```
Then inspect the AAB's `AndroidManifest.xml` — should show `targetSdkVersion="35"`.

---

## 6. Play Console listing assets — required before submission

| Asset | Spec | Notes |
|---|---|---|
| App icon | 512×512 PNG | You have `assets/icon.png` — resize if needed |
| Feature graphic | 1024×500 JPG/PNG | Needs design — key "hero" image |
| Screenshots (phone) | min 2, up to 8 | 1080×1920 or 1080×2340. Capture from device |
| Short description | max 80 chars | Example below |
| Full description | max 4000 chars | Example below |
| App category | "Lifestyle" or "Books & Reference" | Recommend Lifestyle |
| Content rating | Everyone | Fill out the IARC questionnaire truthfully (no violence/sex/drugs) |
| Target audience | 13+ | GDPR-Kids compliant |

**Short description (suggestion):**
> Prayer times, Qibla, Quran audio, Hadith, Tasbih, Hajj & Eid guides — all in one.

**Screenshots to capture (priority order):**
1. Home (Sacred Countdown + prayer row)
2. Quran reader (mid-ayah with player bar)
3. Qibla compass
4. Prayer tracker
5. Hajj / Janaza / Eid guide
6. Settings (language switcher showing UR / AR / EN)

---

## 7. Release build commands

```
# Internal test first (free, instant)
eas build --platform android --profile preview

# Then the real production AAB
eas build --platform android --profile production

# Submit
eas submit --platform android
```

Use **internal test track** in Play Console first → invite yourself + 2–3 users → test for 2–3 days → then promote to production.

---

## 8. Pre-launch testing — real devices

Test on at least three real Android devices with different OEMs:
- **Samsung** (OneUI) — aggressive battery saver, may kill notifications
- **Xiaomi / Redmi** (MIUI) — notorious for killing background notifications
- **Stock Android** (Pixel / Motorola) — baseline

Specifically verify:
- [ ] Prayer time notification fires at correct time with app closed
- [ ] Qibla compass auto-calibrates within 5 seconds
- [ ] Quran audio survives 10 min of screen-lock
- [ ] App launches offline after first install (prefetch cache works)
- [ ] AdMob GDPR consent form appears on first launch (use VPN to Germany to test)

---

## 9. Day-of-launch smoke test

Before pressing "release":
- [ ] Sentry DSN is set in `.env` and in EAS secrets (`eas secret:create`)
- [ ] AdMob banner IDs in `.env` are real (verified — they are)
- [ ] `versionCode` in `app.json` incremented from 1 (Play Store requires monotonic)
- [ ] Privacy policy URL is live and matches what you declared in Data Safety
- [ ] At least one test crash → confirmed received in Sentry dashboard

---

## What's NOT on this list (deferred)

- **Analytics** (PostHog / Firebase) — not critical for v1.0. Add at v1.1 when you have users and want retention data.
- **iOS App Store** — separate flow, $99/year Apple developer fee.
- **Localized store listings** — ship English-only first, add Urdu/Arabic when you have traction.
- **In-app review prompt** — already wired in `src/services/review.ts`, fires after 8 app opens + 20s dwell time.
- **Dark mode** — nice-to-have. Users can skip.

---

## Your v1.0 cost summary

| Item | Cost |
|---|---|
| Google Play developer account | **$25 one-time** |
| Sentry crash reporting | **$0** (5k errors/mo free) |
| AdMob | **$0** (you earn from it) |
| EAS Build | **$0** (30 builds/month free) |
| Privacy policy hosting | **$0** (GitHub Pages) |
| Domain (optional) | **$0** |
| **Total** | **$25** |

You're good to go.

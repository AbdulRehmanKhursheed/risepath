# Maestro E2E flows for Noor

Eight flows covering critical paths. Each is independent — clean app state, run, assert.

## Prerequisites

- Maestro CLI: `curl -fsSL "https://get.maestro.mobile.dev" | bash` (already installed)
- An Android emulator OR a USB-connected Android device with a **dev/preview build of Noor installed** (Expo Go won't work — native modules required)
- `adb devices` should list at least one device

## Run

```bash
# Single flow
maestro test .maestro/04-qurbani-calculator.yaml

# Whole suite
maestro test .maestro/

# Continuous mode (re-runs on file changes — fast feedback while developing)
maestro studio
```

Screenshots land in `.maestro/artifacts/` for any flow that calls `takeScreenshot`.

## Flow inventory

| File | What it tests |
|---|---|
| 01-launch.yaml | App launches without crashing |
| 02-onboarding.yaml | Language → school → method → Home |
| 03-prayer-tracker.yaml | Mark Dhuhr → relaunch → mark persists |
| 04-qurbani-calculator.yaml | Pick cow → stepper → 7-share visualizer |
| 05-takbir-tracker.yaml | Tap Fajr/Dhuhr → progress increments → persists |
| 06-sidebar-nav.yaml | Every sidebar entry is present and labeled |
| 07-language-switch.yaml | Switch to Urdu → labels update |
| 08-eid-hub.yaml | Eid Hub CTAs (only fires when in-window) |

## Tips

- `maestro test --device <udid>` to pick a specific device when multiple are connected
- `maestro hierarchy` opens an inspector you can use to find selectors
- Flows that depend on real time (Eid window, Hijri date) auto-skip when not in window via `runFlow.when.visible`
- The shared "skip onboarding if it appears" prologue means flows are safe to run in any order against either fresh or used app state

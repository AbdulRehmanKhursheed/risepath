Drop your 8 device screenshots in this folder with these exact names:

  01-home.png       — Home screen (greeting, streak ring, Eid hub card, today's prayers)
  02-prayer.png     — Prayer Tracker (5 prayers, location, streak)
  03-quran.png      — Quran with Tajweed coloring (any surah, both translations on)
  04-qurbani.png    — Qurbani Calculator (animal selected, calculator visible)
  05-takbir.png     — Takbir of Tashreeq (a few prayers ticked, Arabic visible)
  06-eid.png        — Eid Guide (Adha tab open, Qurbani section expanded)
  07-qibla.png      — Qibla (compass pointing, "QIBLA" label)
  08-stats.png      — My Stats OR Hifz Tracker (whichever looks fuller of data)

How to take screenshots:

  Option A — Physical Android device (best, real device frame):
    Power + Volume Down briefly. Pull off device via USB cable, AirDrop, or
    just email yourself the file.

  Option B — Android emulator (Android Studio):
    With your dev build running, Tools → Layout Inspector → Take Screenshot
    OR press the camera icon in the emulator side panel.

  Option C — `adb` (terminal, fastest):
    adb shell screencap -p /sdcard/01.png && adb pull /sdcard/01.png 01-home.png

Resolution doesn't have to be exactly 1080×2400 — anything close (or larger)
will be cropped/scaled by the HTML template. Aim for portrait orientation.

Tip: pre-populate the screen with realistic-looking data before shooting:
  • A few completed prayers (not all 5 — half-done looks more honest)
  • A decent streak number (5–9 days reads better than 1)
  • Today's date showing live prayer times
  • For Qurbani: pick "Cow" with 7 people so the calculator looks alive
  • For Takbir: tick 8–10 prayers across two days so the tracker has progress

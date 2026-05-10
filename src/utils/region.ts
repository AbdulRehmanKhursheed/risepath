// Lightweight region inference from the device timezone. No permissions, no
// network, no extra deps — works on Hermes via the built-in Intl API. Used
// to pick a sensible default Quran script (Indo-Pak vs Madinah/Uthmani)
// before the user has made an explicit choice. The persisted preference
// always wins on subsequent launches; this is first-run-only.

const INDO_PAK_TIMEZONES = new Set([
  'Asia/Karachi',     // Pakistan
  'Asia/Kolkata',     // India (canonical)
  'Asia/Calcutta',    // India (legacy alias)
  'Asia/Dhaka',       // Bangladesh
  'Asia/Colombo',     // Sri Lanka
  'Asia/Kathmandu',   // Nepal
  'Asia/Kabul',       // Afghanistan
  'Asia/Thimphu',     // Bhutan
]);

export function isIndoPakRegion(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return INDO_PAK_TIMEZONES.has(tz);
  } catch {
    return false;
  }
}

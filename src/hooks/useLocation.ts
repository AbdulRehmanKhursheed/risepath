import { useCallback, useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { storage } from '../services/storage';

const KARACHI_FALLBACK = { latitude: 24.8607, longitude: 67.0011 };
export { KARACHI_FALLBACK };

// expo-location's getCurrentPositionAsync can stall indefinitely indoors or
// with degraded location services on Android — without a deadline the hook
// would never settle. After the deadline we fall back to the OS's last-known
// fix (instant, no fresh GPS).
const GPS_FIX_TIMEOUT_MS = 10 * 1000;

// Minimum gap between automatic re-fetches on app resume. Tab screens are
// keep-alive, so without this a traveler keeps the old city's coords for the
// whole session; with it we don't burn GPS on every foreground.
const REFRESH_THROTTLE_MS = 15 * 60 * 1000;

// Module-level dedup so App.tsx's first-launch permission flow and the
// PrayerTracker's useLocation don't both call the OS prompt — on Android,
// the second concurrent call returns "denied" even after the user just
// granted, which silently kicked users to the Karachi fallback.
let inFlightRequest: Promise<Location.LocationPermissionResponse> | null = null;
export function requestLocationPermissionOnce() {
  if (!inFlightRequest) {
    inFlightRequest = Location.requestForegroundPermissionsAsync().finally(() => {
      inFlightRequest = null;
    });
  }
  return inFlightRequest;
}

export function useLocation() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const lastFetchStartRef = useRef(0);

  const retry = useCallback(() => setRefreshTick((t) => t + 1), []);

  // Throttled refresh for focus/resume paths — unlike `retry` (explicit user
  // tap), this no-ops when a fetch ran recently.
  const refreshIfStale = useCallback(() => {
    if (Date.now() - lastFetchStartRef.current < REFRESH_THROTTLE_MS) return;
    setRefreshTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let mounted = true;
    lastFetchStartRef.current = Date.now();

    async function fetchLocation() {
      try {
        const cached = await storage.getLocation();
        if (cached) {
          if (mounted) {
            setLocation(cached);
            setUsingFallback(false);
            // Cached coords are good enough to render with — the GPS fix
            // below is a background refresh, not a blocking load.
            setLoading(false);
          }
        }

        const { status } = await requestLocationPermissionOnce();
        if (status !== 'granted') {
          if (mounted) {
            setLocation(cached || KARACHI_FALLBACK);
            setError('Location permission denied');
            setPermissionDenied(true);
            // Fallback when we have no real cached coords to fall back to.
            setUsingFallback(!cached);
          }
          return;
        }

        const result = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), GPS_FIX_TIMEOUT_MS)
          ),
        ]);

        // GPS fix timed out — try the OS's last-known position before giving
        // up on a fresh coordinate.
        const fix =
          result ?? (await Location.getLastKnownPositionAsync().catch(() => null));
        if (!fix) {
          if (mounted && !cached) {
            setLocation(KARACHI_FALLBACK);
            setUsingFallback(true);
          }
          return;
        }

        const coords = {
          latitude: fix.coords.latitude,
          longitude: fix.coords.longitude,
        };

        if (mounted) {
          setLocation(coords);
          setError(null);
          setPermissionDenied(false);
          setUsingFallback(false);
          await storage.setLocation(coords);
        }
      } catch (err) {
        if (mounted) {
          const cached = await storage.getLocation();
          setLocation(cached || KARACHI_FALLBACK);
          setError(err instanceof Error ? err.message : 'Location error');
          setUsingFallback(!cached);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchLocation();
    return () => {
      mounted = false;
    };
  }, [refreshTick]);

  // Keep-alive screens mount this hook once per session — refresh coords on
  // app resume (throttled) so travelers don't keep the old city's times.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshIfStale();
    });
    return () => sub.remove();
  }, [refreshIfStale]);

  return { location, loading, error, usingFallback, permissionDenied, retry, refreshIfStale };
}

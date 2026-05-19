import { useCallback, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { storage } from '../services/storage';

const KARACHI_FALLBACK = { latitude: 24.8607, longitude: 67.0011 };
export { KARACHI_FALLBACK };

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

  const retry = useCallback(() => setRefreshTick((t) => t + 1), []);

  useEffect(() => {
    let mounted = true;

    async function fetchLocation() {
      setLoading(true);
      try {
        const cached = await storage.getLocation();
        if (cached) {
          if (mounted) {
            setLocation(cached);
            setUsingFallback(false);
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

        const result = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const coords = {
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
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

  return { location, loading, error, usingFallback, permissionDenied, retry };
}

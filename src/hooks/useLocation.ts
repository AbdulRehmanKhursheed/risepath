import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { storage } from '../services/storage';

const KARACHI_FALLBACK = { latitude: 24.8607, longitude: 67.0011 };

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

  useEffect(() => {
    let mounted = true;

    async function fetchLocation() {
      try {
        const cached = await storage.getLocation();
        if (cached) {
          if (mounted) setLocation(cached);
        }

        const { status } = await requestLocationPermissionOnce();
        if (status !== 'granted') {
          if (mounted) {
            setLocation(cached || KARACHI_FALLBACK);
            setError('Location permission denied');
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
          await storage.setLocation(coords);
        }
      } catch (err) {
        if (mounted) {
          const cached = await storage.getLocation();
          setLocation(cached || KARACHI_FALLBACK);
          setError(err instanceof Error ? err.message : 'Location error');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchLocation();
    return () => {
      mounted = false;
    };
  }, []);

  return { location, loading, error };
}

import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  if (!DSN || DSN.length === 0) return;
  try {
    Sentry.init({
      dsn: DSN,
      enableAutoSessionTracking: true,
      tracesSampleRate: 0.2,
      debug: false,
    });
    initialized = true;
  } catch {
    // non-fatal — missing DSN or bad config should never crash the app
  }
}

export function captureError(err: unknown, context?: Record<string, unknown>): void {
  if (!initialized) return;
  try {
    Sentry.captureException(err, context ? { extra: context } : undefined);
  } catch {
    // ignore
  }
}

export const wrap = Sentry.wrap;

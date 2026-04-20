import * as Sentry from '@sentry/react-native';

export function captureError(err: unknown, context?: Record<string, unknown>): void {
  try {
    Sentry.captureException(err, context ? { extra: context } : undefined);
  } catch {
    // ignore
  }
}

export const wrap = Sentry.wrap;

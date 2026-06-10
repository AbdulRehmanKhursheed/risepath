// Sentry's metro wrapper injects debug IDs into bundles so production stack
// traces can be symbolicated against the source maps uploaded at build time.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);

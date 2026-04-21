const { withAndroidManifest } = require('@expo/config-plugins');

const PERMISSION = 'android.permission.ACTIVITY_RECOGNITION';
const TOOLS_NS = 'http://schemas.android.com/tools';

module.exports = function withStripActivityRecognition(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = TOOLS_NS;
    }

    if (!Array.isArray(manifest['uses-permission'])) {
      manifest['uses-permission'] = [];
    }

    const existing = manifest['uses-permission'].find(
      (p) => p && p.$ && p.$['android:name'] === PERMISSION
    );

    if (existing) {
      existing.$['tools:node'] = 'remove';
    } else {
      manifest['uses-permission'].push({
        $: {
          'android:name': PERMISSION,
          'tools:node': 'remove',
        },
      });
    }

    return cfg;
  });
};

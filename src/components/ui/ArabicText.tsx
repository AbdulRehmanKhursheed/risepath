import React, { useEffect, useState } from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../constants/theme';
import { isIndoPakRegion } from '../../utils/region';

export type QuranScript = 'uthmani' | 'indopak';

const SCRIPT_KEY = 'quran_script_v1';

// Module-level cache + subscriber set so toggling the script preference in
// the Quran reader settings cascades to every ArabicText instance app-wide
// without a context provider plumb-through.
let cachedScript: QuranScript | null = null;
const subscribers = new Set<(s: QuranScript) => void>();

function defaultScript(): QuranScript {
  return isIndoPakRegion() ? 'indopak' : 'uthmani';
}

export async function loadScriptPreference(): Promise<QuranScript> {
  if (cachedScript !== null) return cachedScript;
  try {
    const raw = await AsyncStorage.getItem(SCRIPT_KEY);
    cachedScript = raw === 'uthmani' || raw === 'indopak' ? raw : defaultScript();
  } catch {
    cachedScript = defaultScript();
  }
  return cachedScript;
}

export async function setScriptPreference(script: QuranScript): Promise<void> {
  cachedScript = script;
  subscribers.forEach((cb) => cb(script));
  try {
    await AsyncStorage.setItem(SCRIPT_KEY, script);
  } catch {}
}

export function useArabicScript(): QuranScript {
  const [script, setScript] = useState<QuranScript>(() => cachedScript ?? defaultScript());
  useEffect(() => {
    let active = true;
    if (cachedScript === null) {
      loadScriptPreference().then((s) => {
        if (active) setScript(s);
      });
    } else if (cachedScript !== script) {
      setScript(cachedScript);
    }
    subscribers.add(setScript);
    return () => {
      active = false;
      subscribers.delete(setScript);
    };
  }, []);
  return script;
}

export type ArabicTextProps = TextProps & {
  // 'quran' applies generous arabic-style line height for long passages.
  // 'inline' is the default for duas, kalimas, takbir, niyyahs.
  variant?: 'quran' | 'inline';
  // Explicit override for callers that already know the script (e.g. the
  // Mushaf reader, which is the source of truth for the toggle itself).
  scriptOverride?: QuranScript;
};

export function ArabicText({
  children,
  variant = 'inline',
  scriptOverride,
  style,
  ...rest
}: ArabicTextProps) {
  const auto = useArabicScript();
  const script = scriptOverride ?? auto;
  const fontFamily =
    script === 'indopak'
      ? theme.typography.fontQuranIndopak
      : theme.typography.fontQuranUthmani;
  return (
    <Text
      {...rest}
      style={[variant === 'quran' ? defaults.quran : defaults.inline, { fontFamily }, style]}
    >
      {children}
    </Text>
  );
}

const defaults = StyleSheet.create({
  inline: {
    color: theme.colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  } as TextStyle,
  quran: {
    color: theme.colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 36,
  } as TextStyle,
});

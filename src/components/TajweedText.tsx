import React, { useMemo } from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';

// Madinah-Mushaf-aligned palette. Sourced from the Quran.com colour reference
// at https://qul.tarteel.ai/resources/recitation-styles and the King Fahd
// Mushaf legend. Silent / barely-pronounced letters are rendered in muted
// grey so the eye reads past them; emphasis rules (qalqala, ghunna) are warm;
// madd rules are blue.
// Primary keys are the exact class names Quran.com's `uthmani_tajweed`
// edition emits (verified by dumping every distinct class across 11 sample
// chapters); the alternate spellings below them are kept as aliases for any
// cached text fetched under other editions.
const TAJWEED_COLORS: Record<string, string> = {
  ham_wasl: '#9B9B9B',          // silent hamzat al-wasl
  silent: '#9B9B9B',
  lah_khafi: '#9B9B9B',
  laam_shamsiyah: '#9B9B9B',    // silent laam in al- before sun letters — common, must not be missing
  slnt: '#9B9B9B',
  ghunnah: '#FF8000',
  ghunna: '#FF8000',
  ikhafa: '#9B4900',
  ikhfa: '#9B4900',
  ikhafa_shafawi: '#9B4900',
  ikhfa_shafawi: '#9B4900',
  iqlab: '#026F96',
  idgham_ghunnah: '#169200',
  idgham_ghunna: '#169200',
  idgham_wo_ghunnah: '#9BC124',
  idgham_no_ghunna: '#9BC124',
  idgham_mutajanisayn: '#26BFFD',
  idgham_mutaqaribayn: '#91C40A',
  idgham_mutaqaribain: '#91C40A',
  idgham_shafawi: '#58B800',
  qalaqah: '#DD0008',
  qalqala: '#DD0008',
  madda_necessary: '#000EBC',
  madda_normal: '#537FFF',
  madda_permissible: '#4050FF',
  madda_obligatory: '#000EBC',
  madda_mutasil: '#000EBC',
  madda_munfasil: '#0060AC',
};

type Segment = { text: string; color?: string };

// Matches four things, in order:
//   1. <tajweed class=NAME> ... </tajweed>   — accepts quoted or unquoted attribute
//      (Quran.com's `uthmani_tajweed` returns unquoted; older HTML sources use quotes)
//   2. <span class=end>N</span> — the API's verse-number digit, eaten INCLUDING
//      its content (the reader draws its own ayah badge; rendering this digit
//      duplicated the verse number)
//   3. any other tag — eaten without rendering
//   4. plain text run between tags — rendered uncoloured
function parse(raw: string): Segment[] {
  const result: Segment[] = [];
  const re =
    /<tajweed\s+class=(?:"([^"]+)"|'([^']+)'|([^\s>]+))>([^<]*)<\/tajweed>|<span\s+class=(?:"end"|'end'|end)\s*>[^<]*<\/span>|<[^>]*>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const className = m[1] ?? m[2] ?? m[3];
    if (className !== undefined) {
      const color = className
        .split(',')
        .map((c) => TAJWEED_COLORS[c.trim()])
        .find(Boolean);
      result.push({ text: m[4] ?? '', color });
    } else if (m[5] !== undefined) {
      result.push({ text: m[5] });
    }
  }
  return result.length > 0 ? result : [{ text: raw }];
}

export function TajweedText({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  // Tajweed parsing runs a stateful regex over the ayah HTML — without memo
  // it re-parses on every render of every TajweedText instance, and a long
  // surah has hundreds of these on screen at once.
  const segs = useMemo(() => parse(text), [text]);
  return (
    <Text>
      {segs.map((s, i) =>
        s.color ? (
          <Text key={i} style={[style, { color: s.color }]}>{s.text}</Text>
        ) : (
          <Text key={i} style={style}>{s.text}</Text>
        )
      )}
    </Text>
  );
}

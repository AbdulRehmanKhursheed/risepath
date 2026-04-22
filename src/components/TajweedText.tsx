import React from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';

const TAJWEED_COLORS: Record<string, string> = {
  ham_wasl: '#9B9B9B',
  silent: '#9B9B9B',
  lah_khafi: '#9B9B9B',
  ghunna: '#FF8000',
  ikhfa: '#9B4900',
  ikhfa_shafawi: '#9B4900',
  iqlab: '#026F96',
  idgham_ghunna: '#169200',
  idgham_no_ghunna: '#9BC124',
  idgham_mutajanisayn: '#26BFFD',
  idgham_mutaqaribain: '#91C40A',
  qalqala: '#DD0008',
  madda_necessary: '#000EBC',
  madda_normal: '#537FFF',
  madda_permissible: '#4050FF',
  madda_obligatory: '#000EBC',
  madda_mutasil: '#000EBC',
  madda_munfasil: '#0060AC',
};

type Segment = { text: string; color?: string };

function parse(raw: string): Segment[] {
  const result: Segment[] = [];
  const re = /<tajweed class="([^"]+)">([^<]*)<\/tajweed>|<[^>]*>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m[1] !== undefined) {
      const color = m[1].split(',').map(c => TAJWEED_COLORS[c.trim()]).find(Boolean);
      result.push({ text: m[2], color });
    } else if (m[3] !== undefined) {
      result.push({ text: m[3] });
    }
  }
  return result.length > 0 ? result : [{ text: raw }];
}

export function TajweedText({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  const segs = parse(text);
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

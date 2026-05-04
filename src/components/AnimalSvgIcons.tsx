import React from 'react';
import Svg, { Path, G, Line, Circle } from 'react-native-svg';
import { AnimalKey } from '../constants/qurbani';

type Props = {
  size?: number;
  color: string;
};

// Stylised silhouettes — single-colour, viewBox 64×64. Drawn by hand to be
// recognisable at small sizes (picker tiles) without needing raster art.

export function GoatIcon({ size = 48, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* horns */}
      <Path
        d="M22 14 C20 9, 22 6, 24 5 M27 14 C28 9, 26 6, 24 5"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      {/* head + body silhouette */}
      <Path
        fill={color}
        d="M30 14
           C 26 14, 22 16, 21 20
           L 22 26
           C 18 27, 14 29, 13 33
           L 13 44
           C 13 46, 14 47, 16 47
           L 18 47 L 18 52 C 18 53, 19 54, 20 54
           C 21 54, 22 53, 22 52 L 22 47
           L 36 47 L 36 52 C 36 53, 37 54, 38 54
           C 39 54, 40 53, 40 52 L 40 47
           L 46 47
           C 50 47, 52 45, 52 41
           L 52 35
           C 52 30, 48 27, 43 26
           L 41 22
           C 40 18, 35 14, 30 14 Z"
      />
      {/* beard */}
      <Path d="M22 27 L 22 32" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* eye */}
      <Circle cx="26" cy="20" r="1" fill="#fff" />
    </Svg>
  );
}

export function SheepIcon({ size = 48, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* fluffy body — overlapping circles */}
      <G fill={color}>
        <Circle cx="20" cy="32" r="9" />
        <Circle cx="28" cy="28" r="9" />
        <Circle cx="36" cy="28" r="9" />
        <Circle cx="44" cy="32" r="9" />
        <Circle cx="32" cy="36" r="11" />
      </G>
      {/* head */}
      <Path
        fill={color}
        d="M48 26
           C 48 21, 52 19, 54 21
           C 56 22, 56 26, 54 28
           C 52 30, 48 30, 48 26 Z"
      />
      {/* ear */}
      <Path
        fill={color}
        d="M50 22 C 52 20, 54 21, 53 23 Z"
      />
      {/* legs */}
      <G stroke={color} strokeWidth={3} strokeLinecap="round">
        <Line x1="24" y1="44" x2="24" y2="52" />
        <Line x1="32" y1="46" x2="32" y2="54" />
        <Line x1="40" y1="46" x2="40" y2="54" />
        <Line x1="44" y1="44" x2="44" y2="52" />
      </G>
      {/* eye */}
      <Circle cx="51" cy="25" r="0.8" fill="#fff" />
    </Svg>
  );
}

export function CowIcon({ size = 48, color, showShares }: Props & { showShares?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* horns */}
      <Path
        d="M44 16 C 46 12, 50 12, 51 14 M50 18 C 52 14, 56 14, 57 16"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      {/* body silhouette */}
      <Path
        fill={color}
        d="M48 18
           C 44 18, 41 19, 39 22
           L 22 22
           C 16 22, 12 26, 12 32
           L 12 42
           C 12 44, 13 46, 15 46
           L 18 46 L 18 52 C 18 53, 19 54, 20 54
           C 21 54, 22 53, 22 52 L 22 46
           L 38 46 L 38 52 C 38 53, 39 54, 40 54
           C 41 54, 42 53, 42 52 L 42 46
           L 48 46
           C 50 46, 52 44, 52 42
           L 52 28
           L 56 28
           C 58 28, 58 24, 56 24
           L 52 24
           L 52 22
           C 52 19, 50 18, 48 18 Z"
      />
      {/* eye */}
      <Circle cx="48" cy="24" r="1" fill="#fff" />
      {/* udder */}
      <Path d="M30 46 C 30 50, 34 50, 34 46" stroke={color} strokeWidth={1.5} fill="none" />

      {/* Share-line overlay — dotted vertical cuts dividing body into 7 portions.
          Activated when showShares is true (matches the competitor "cow share"
          visual but cleaner). */}
      {showShares && (
        <G stroke="#fff" strokeWidth={1} strokeDasharray="2,2" opacity={0.85}>
          <Line x1="18" y1="22" x2="18" y2="46" />
          <Line x1="23" y1="22" x2="23" y2="46" />
          <Line x1="28" y1="22" x2="28" y2="46" />
          <Line x1="33" y1="22" x2="33" y2="46" />
          <Line x1="38" y1="22" x2="38" y2="46" />
          <Line x1="43" y1="22" x2="43" y2="46" />
        </G>
      )}
    </Svg>
  );
}

export function BuffaloIcon({ size = 48, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* curved horns — buffalo signature */}
      <Path
        d="M40 20 C 36 14, 30 14, 28 18 C 30 16, 34 18, 36 20"
        stroke={color}
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M48 20 C 52 14, 58 14, 60 18 C 58 16, 54 18, 52 20"
        stroke={color}
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
      {/* body */}
      <Path
        fill={color}
        d="M46 20
           C 42 20, 39 22, 38 24
           L 22 24
           C 16 24, 12 28, 12 34
           L 12 44
           C 12 46, 13 47, 15 47
           L 18 47 L 18 53 C 18 54, 19 55, 20 55
           C 21 55, 22 54, 22 53 L 22 47
           L 38 47 L 38 53 C 38 54, 39 55, 40 55
           C 41 55, 42 54, 42 53 L 42 47
           L 48 47
           C 50 47, 52 45, 52 43
           L 52 26
           C 52 22, 50 20, 46 20 Z"
      />
      {/* nose ring (buffalo signature) */}
      <Circle cx="50" cy="32" r="2" stroke="#fff" strokeWidth={1} fill="none" />
      <Circle cx="48" cy="26" r="1" fill="#fff" />
    </Svg>
  );
}

export function CamelIcon({ size = 48, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* body with hump */}
      <Path
        fill={color}
        d="M14 42
           L 14 36
           C 14 32, 16 30, 19 30
           L 22 30
           C 22 26, 25 22, 30 22
           C 35 22, 38 26, 38 30
           L 42 30
           C 44 30, 46 28, 46 26
           L 46 18
           C 46 16, 47 15, 49 15
           L 52 15
           C 54 15, 55 16, 55 18
           L 55 38
           C 55 42, 53 44, 49 44
           L 18 44
           C 16 44, 14 43, 14 42 Z"
      />
      {/* head extends up the neck */}
      <Path
        fill={color}
        d="M48 14
           C 47 11, 50 9, 52 10
           C 54 11, 55 13, 54 15"
      />
      {/* legs */}
      <G stroke={color} strokeWidth={3.5} strokeLinecap="round">
        <Line x1="22" y1="44" x2="22" y2="55" />
        <Line x1="30" y1="44" x2="30" y2="55" />
        <Line x1="42" y1="44" x2="42" y2="55" />
        <Line x1="50" y1="44" x2="50" y2="55" />
      </G>
      {/* eye */}
      <Circle cx="51" cy="13" r="0.8" fill="#fff" />
    </Svg>
  );
}

export function getAnimalIcon(
  key: AnimalKey,
  props: Props & { showShares?: boolean }
) {
  switch (key) {
    case 'goat':    return <GoatIcon {...props} />;
    case 'sheep':   return <SheepIcon {...props} />;
    case 'cow':     return <CowIcon {...props} />;
    case 'buffalo': return <BuffaloIcon {...props} />;
    case 'camel':   return <CamelIcon {...props} />;
  }
}

// Small person glyph for the share visualizer — fills with brand color when
// the share is "claimed", outline when empty.
export function PersonIcon({
  size = 28,
  filled,
  fillColor,
  outlineColor,
}: {
  size?: number;
  filled: boolean;
  fillColor: string;
  outlineColor: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {/* head */}
      <Circle
        cx="16"
        cy="9"
        r="4.5"
        fill={filled ? fillColor : 'transparent'}
        stroke={filled ? fillColor : outlineColor}
        strokeWidth={1.6}
      />
      {/* body */}
      <Path
        d="M6 28 C 6 21, 10 17, 16 17 C 22 17, 26 21, 26 28 Z"
        fill={filled ? fillColor : 'transparent'}
        stroke={filled ? fillColor : outlineColor}
        strokeWidth={1.6}
      />
    </Svg>
  );
}

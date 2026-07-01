import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { theme } from '../constants/theme';

// A dependency-free wheel time picker (12-hour + AM/PM). Built on plain
// ScrollViews with snap so it needs no native module — the project has no
// @react-native-community/datetimepicker, and adding one would force a rebuild
// and risk breaking existing builds. Reports/accepts a 24-hour value so the
// notification scheduler can consume it directly.

const ITEM_HEIGHT = 44;
const VISIBLE = 3; // odd, so one row sits centered
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE;
const PAD = ITEM_HEIGHT * Math.floor(VISIBLE / 2);

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0..59
const PERIODS = ['AM', 'PM'] as const;

function to12h(hour24: number): { hour12: number; period: 0 | 1 } {
  const period: 0 | 1 = hour24 >= 12 ? 1 : 0;
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, period };
}

function to24h(hour12: number, period: 0 | 1): number {
  if (period === 0) return hour12 === 12 ? 0 : hour12; // AM
  return hour12 === 12 ? 12 : hour12 + 12; // PM
}

function WheelColumn({
  data,
  selectedIndex,
  onSelect,
  format,
  width,
}: {
  data: readonly (number | string)[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  format: (v: number | string) => string;
  width: number;
}) {
  const ref = useRef<ScrollView>(null);
  const lastIndex = useRef(selectedIndex);

  // Android's `contentOffset` prop is unreliable on first paint; scroll
  // explicitly once mounted so every column opens centered on its value.
  useEffect(() => {
    const id = setTimeout(() => {
      ref.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    }, 0);
    return () => clearTimeout(id);
    // Mount-only: the wheel is remounted per edit with the right index, and we
    // don't want to yank the wheel while the user is scrolling it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const idx = Math.max(0, Math.min(data.length - 1, Math.round(y / ITEM_HEIGHT)));
      if (idx !== lastIndex.current) {
        lastIndex.current = idx;
        onSelect(idx);
      }
    },
    [data.length, onSelect]
  );

  return (
    <View style={[styles.column, { width }]}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: selectedIndex * ITEM_HEIGHT }}
        contentContainerStyle={{ paddingVertical: PAD }}
        onMomentumScrollEnd={handleEnd}
        onScrollEndDrag={handleEnd}
      >
        {data.map((v, i) => (
          <View key={`${v}`} style={styles.item}>
            <Text
              style={[styles.itemText, i === selectedIndex && styles.itemTextActive]}
              allowFontScaling={false}
            >
              {format(v)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function TimePicker({
  hour,
  minute,
  onChange,
}: {
  hour: number; // 0-23
  minute: number; // 0-59
  onChange: (hour: number, minute: number) => void;
}) {
  const { hour12, period } = to12h(hour);
  const hourIdx = HOURS.indexOf(hour12);
  const minIdx = Math.max(0, Math.min(59, minute));

  return (
    <View style={styles.root}>
      {/* Center selection band */}
      <View style={styles.selectionBand} pointerEvents="none" />
      <WheelColumn
        data={HOURS}
        selectedIndex={hourIdx < 0 ? 0 : hourIdx}
        onSelect={(i) => onChange(to24h(HOURS[i], period), minute)}
        format={(v) => `${v}`}
        width={72}
      />
      <Text style={styles.colon} allowFontScaling={false}>
        :
      </Text>
      <WheelColumn
        data={MINUTES}
        selectedIndex={minIdx}
        onSelect={(i) => onChange(hour, MINUTES[i])}
        format={(v) => String(v).padStart(2, '0')}
        width={72}
      />
      <WheelColumn
        data={PERIODS as unknown as string[]}
        selectedIndex={period}
        onSelect={(i) => onChange(to24h(hour12, i as 0 | 1), minute)}
        format={(v) => `${v}`}
        width={72}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: PICKER_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionBand: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: ITEM_HEIGHT,
    top: PAD,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.accentMuted,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  column: {
    height: PICKER_HEIGHT,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 22,
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textMuted,
  },
  itemTextActive: {
    color: theme.colors.accent,
    fontFamily: theme.typography.fontHeadingBold,
    fontWeight: '700',
  },
  colon: {
    fontSize: 22,
    color: theme.colors.textMuted,
    marginHorizontal: -4,
    fontFamily: theme.typography.fontHeadingBold,
  },
});

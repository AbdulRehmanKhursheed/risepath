import React from 'react';
import { Text, StyleProp, TextStyle, TextProps } from 'react-native';
import { theme } from '../../constants/theme';
import { useSimpleMode } from '../../contexts/SimpleModeContext';

type Level = 1 | 2 | 3;

type HeadingProps = Omit<TextProps, 'style'> & {
  level?: Level;
  /** Use Syne (display) instead of body bold. Default true for level 1, false otherwise. */
  display?: boolean;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
};

const SIZE_BY_LEVEL = {
  1: theme.typography.sizes.h1,
  2: theme.typography.sizes.h2,
  3: theme.typography.sizes.h3,
} as const;

const LETTER_SPACING_BY_LEVEL = {
  1: theme.typography.letterSpacing.tight,
  2: theme.typography.letterSpacing.tight,
  3: theme.typography.letterSpacing.normal,
} as const;

/**
 * Semantic heading. Level 1 is the screen title; 2 is a section title;
 * 3 is a sub-section. By default level 1 uses Syne display font, levels
 * 2 and 3 use Plus Jakarta bold. Respects useSimpleMode().fs for global
 * accessibility font-scaling — consumers never need to call fs themselves.
 */
export function Heading({
  level = 2,
  display,
  style,
  children,
  ...rest
}: HeadingProps) {
  const { fs } = useSimpleMode();
  const useDisplay = display ?? level === 1;
  const fontFamily = useDisplay
    ? theme.typography.fontHeadingBold
    : theme.typography.fontBodyBold;
  const size = fs(SIZE_BY_LEVEL[level]);

  return (
    <Text
      accessibilityRole="header"
      {...rest}
      style={[
        {
          fontSize:       size,
          color:          theme.colors.text,
          fontFamily,
          letterSpacing:  LETTER_SPACING_BY_LEVEL[level],
          // React Native expects an absolute lineHeight in dp, not a multiplier.
          lineHeight:     size * theme.typography.lineHeights.tight,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

import React from 'react';
import { Text as RNText, StyleProp, TextStyle, TextProps } from 'react-native';
import { theme } from '../../constants/theme';
import { useSimpleMode } from '../../contexts/SimpleModeContext';

type Tone = 'default' | 'secondary' | 'muted' | 'accent' | 'success' | 'error' | 'inverse' | 'inverseMuted';
type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

type BaseProps = Omit<TextProps, 'style'> & {
  tone?: Tone;
  weight?: Weight;
  italic?: boolean;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
};

const COLOR_BY_TONE: Record<Tone, string> = {
  default:      theme.colors.text,
  secondary:    theme.colors.textSecondary,
  muted:        theme.colors.textMuted,
  accent:       theme.colors.accent,
  success:      theme.colors.success,
  error:        theme.colors.error,
  inverse:      theme.colors.inverseText,
  inverseMuted: theme.colors.inverseMuted,
};

const FONT_BY_WEIGHT: Record<Weight, string> = {
  regular:  theme.typography.fontBody,
  medium:   theme.typography.fontBodyMedium,
  semibold: theme.typography.fontBodyBold,
  bold:     theme.typography.fontBodyBold,
};

/**
 * Internal factory that builds a typography variant locked to a base size.
 * Reads useSimpleMode().fs so global font-scaling Just Works without each
 * consumer having to call fs(...) on their own.
 */
function makeText(baseSize: number, defaultWeight: Weight) {
  return function TextVariant({
    tone = 'default',
    weight = defaultWeight,
    italic = false,
    style,
    children,
    ...rest
  }: BaseProps) {
    const { fs } = useSimpleMode();
    const size = fs(baseSize);
    return (
      <RNText
        {...rest}
        style={[
          {
            fontSize:    size,
            color:       COLOR_BY_TONE[tone],
            fontFamily:  FONT_BY_WEIGHT[weight],
            lineHeight:  size * theme.typography.lineHeights.normal,
            fontStyle:   italic ? 'italic' : 'normal',
          },
          style,
        ]}
      >
        {children}
      </RNText>
    );
  };
}

/** 15pt body text. Default tone: default. */
export const Body    = makeText(theme.typography.sizes.body,    'regular');
/** 12pt caption. Use for secondary metadata, source attributions. */
export const Caption = makeText(theme.typography.sizes.caption, 'regular');
/** 10pt micro-label. Use for uppercase eyebrows above headings. */
export const Label   = makeText(theme.typography.sizes.micro,   'semibold');

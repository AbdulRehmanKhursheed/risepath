import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type Props = {
  visible: boolean;
  title: string;
  body: string;
  cta: string;
  onClose: () => void;
};

export function StreakCelebrationModal({ visible, title, body, cta, onClose }: Props) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      scale.setValue(0.85);
      opacity.setValue(0);
      sparkle.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sparkle, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    sparkleLoop.start();
    return () => {
      sparkleLoop.stop();
    };
  }, [visible, scale, opacity, sparkle]);

  const sparkleScale = sparkle.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] });

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        {/* Confetti rendered above the card with pointerEvents off so it
            doesn't block the CTA tap. Two cannons firing from opposite top
            corners create a wide arc that covers the whole screen. */}
        {visible && (
          <>
            <View style={styles.confettiLayer} pointerEvents="none">
              <ConfettiCannon
                count={120}
                origin={{ x: -10, y: 0 }}
                fadeOut
                fallSpeed={2800}
                explosionSpeed={420}
                colors={[
                  theme.colors.accent,
                  theme.colors.accentLight,
                  '#F2C57C',
                  '#5CB85C',
                  '#FFFFFF',
                ]}
              />
            </View>
            <View style={styles.confettiLayer} pointerEvents="none">
              <ConfettiCannon
                count={120}
                origin={{ x: SCREEN_W + 10, y: 0 }}
                fadeOut
                fallSpeed={2800}
                explosionSpeed={420}
                colors={[
                  theme.colors.accent,
                  theme.colors.accentLight,
                  '#F2C57C',
                  '#5CB85C',
                  '#FFFFFF',
                ]}
              />
            </View>
          </>
        )}
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <LinearGradient
            colors={[theme.colors.accentMuted, theme.colors.surface]}
            style={styles.gradient}
          >
            <Animated.Text style={[styles.bigEmoji, { transform: [{ scale: sparkleScale }] }]}>
              🌙
            </Animated.Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
            <TouchableOpacity style={styles.cta} onPress={onClose} activeOpacity={0.86}>
              <Text style={styles.ctaText}>{cta}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(28,15,6,0.55)',
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%', maxWidth: 380,
    borderRadius: 24, overflow: 'hidden',
    borderWidth: 1.5, borderColor: theme.colors.accent,
  },
  gradient: { padding: 28, alignItems: 'center' },
  bigEmoji: { fontSize: 56, marginBottom: 8 },
  title: {
    fontFamily: theme.typography.fontHeadingBold,
    fontSize: 22, color: theme.colors.text,
    textAlign: 'center', marginBottom: 10,
  },
  body: {
    fontFamily: theme.typography.fontBody,
    fontSize: 15, color: theme.colors.textSecondary,
    textAlign: 'center', lineHeight: 22, marginBottom: 22,
  },
  cta: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: theme.borderRadius.full,
  },
  ctaText: {
    fontFamily: theme.typography.fontBodyBold,
    fontSize: 15, color: '#fff',
  },
});

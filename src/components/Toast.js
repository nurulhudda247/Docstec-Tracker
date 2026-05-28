// Reusable Swipeable Toast Component
import React, { useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../theme';
import useStore from '../store/useStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Toast = () => {
  const { toast, hideToast } = useStore();
  const { message, type, visible } = toast;

  // Animated values
  const slideAnim = useRef(new Animated.Value(-120)).current; // Vertical entrance slide
  const opacityAnim = useRef(new Animated.Value(0)).current;   // Fade in
  const pan = useRef(new Animated.ValueXY()).current;          // Swipe tracking

  const timerRef = useRef(null);

  useEffect(() => {
    if (visible) {
      // Reset pan values
      pan.setValue({ x: 0, y: 0 });

      // Animate in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: Platform.OS === 'ios' ? 60 : 40,
          tension: 40,
          friction: 8,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();

      // Auto-hide after 3 seconds
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        dismissToast();
      }, 3000);
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -120,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start(() => {
      hideToast();
    });
  };

  // Configure PanResponder for swiping left/right to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        // Only allow horizontal dragging
        pan.setValue({ x: gestureState.dx, y: 0 });
      },
      onPanResponderRelease: (e, gestureState) => {
        // If swiped left or right past threshold (25% of screen width), dismiss
        if (Math.abs(gestureState.dx) > SCREEN_WIDTH * 0.25) {
          Animated.timing(pan, {
            toValue: { x: gestureState.dx > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH, y: 0 },
            duration: 150,
            useNativeDriver: false,
          }).start(() => {
            hideToast();
          });
        } else {
          // Bounce back to center
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            tension: 50,
            friction: 7,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  if (!visible && slideAnim._value === -120) return null;

  // Resolve styles depending on variant type
  const isSuccess = type === 'success';
  const accentColor = isSuccess ? COLORS.success : COLORS.danger;
  const iconName = isSuccess ? 'checkmark-circle' : 'alert-circle';

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.toastWrapper,
        {
          top: slideAnim,
          opacity: opacityAnim,
          transform: [{ translateX: pan.x }],
          backgroundColor: COLORS.white, // Surface slate-800 in dark mode, pure white in light mode
          borderLeftColor: accentColor,
          borderColor: COLORS.border,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={iconName} size={22} color={accentColor} style={styles.icon} />
        <Text style={[styles.message, { color: COLORS.textPrimary }]} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity onPress={dismissToast} style={styles.closeBtn}>
          <Ionicons name="close" size={16} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 99999,
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm, // Matching our cleaner, smaller border radius (4px)
    borderLeftWidth: 4,
    borderWidth: 1,
    ...SHADOWS.lg,
    ...Platform.select({
      web: {
        cursor: 'grab',
        userSelect: 'none',
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    marginRight: SPACING.sm,
  },
  message: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: 18,
  },
  closeBtn: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
});

export default Toast;

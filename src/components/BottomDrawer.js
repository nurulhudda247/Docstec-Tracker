// Premium Reusable Bottom Drawer component with smooth "Swipe Down to Close" Gestures
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS, FONT_SIZE, FONT_WEIGHT } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Safe web animation driver selection (never uses native driver on web to avoid freeze bugs)
const HAS_NATIVE_DRIVER = Platform.OS !== 'web';

const BottomDrawer = ({
  visible,
  onClose,
  title,
  children,
  height = SCREEN_HEIGHT * 0.6, // Default to 60% of screen height
}) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up and fade in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: HAS_NATIVE_DRIVER,
          tension: 45,
          friction: 9,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.5,
          duration: 250,
          useNativeDriver: HAS_NATIVE_DRIVER,
        }),
      ]).start();
    } else {
      // Slide down and fade out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 220,
          useNativeDriver: HAS_NATIVE_DRIVER,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: HAS_NATIVE_DRIVER,
        }),
      ]).start();
    }
  }, [visible]);

  // Handle closing animation before triggering onClose callback
  const animateClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: HAS_NATIVE_DRIVER,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: HAS_NATIVE_DRIVER,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Configure PanResponder for swiping down to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only trigger drag if moving downwards
        return gestureState.dy > 5;
      },
      onPanResponderGrant: () => {
        translateY.setOffset(0);
      },
      onPanResponderMove: (e, gestureState) => {
        // Only allow dragging downwards (positive dy)
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        // If dragged down more than 100px, dismiss
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          animateClose();
        } else {
          // Snap back to top
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: HAS_NATIVE_DRIVER,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={animateClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Semi-transparent Backdrop */}
        <TouchableWithoutFeedback onPress={animateClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        {/* Reusable Bottom Sheet Container */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <Animated.View
            style={[
              styles.drawer,
              {
                height: height,
                transform: [{ translateY: translateY }],
                backgroundColor: COLORS.white, // Surface background
                borderColor: COLORS.border,
              },
            ]}
          >
            {/* Gesture Drag Handle Strip */}
            <View {...panResponder.panHandlers} style={styles.handleArea}>
              <View style={styles.dragHandle} />
            </View>

            {/* Header */}
            {title && (
              <View style={styles.header}>
                <Text style={[styles.title, { color: COLORS.textPrimary }]}>{title}</Text>
                <TouchableWithoutFeedback onPress={animateClose}>
                  <View style={styles.closeBtn}>
                    <Ionicons name="close" size={20} color={COLORS.textSecondary} />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            )}

            {/* Main Content View */}
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  keyboardContainer: {
    justifyContent: 'flex-end',
  },
  drawer: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    borderTopWidth: 1.5,
    ...SHADOWS.lg,
    ...Platform.select({
      web: {
        maxWidth: 550,
        width: '100%',
        alignSelf: 'center',
      },
    }),
  },
  handleArea: {
    width: '100%',
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'ns-resize',
      },
    }),
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E4E6EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB' + '40',
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
  },
});

export default BottomDrawer;

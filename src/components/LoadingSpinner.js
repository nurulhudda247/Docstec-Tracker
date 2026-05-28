import React, { useEffect, useRef } from 'react';
import { View, Animated, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../theme';

const LoadingSpinner = ({ message = 'Loading...', fullScreen = true }) => {
  const { colors } = useTheme();
  
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false, // Required for borderRadius interpolation
      })
    ).start();
  }, [anim]);

  // Complex Interpolations for Mesmerizing Effect
  const rotate1 = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  const rotate2 = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg']
  });

  const borderRadius1 = anim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [8, 28, 8, 28, 8] // Assuming 56x56 box, 28 is circle
  });
  
  const borderRadius2 = anim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [20, 4, 20, 4, 20] // Assuming 40x40 box, 20 is circle
  });

  const scale1 = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.3, 1]
  });

  const scale2 = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1.3, 0.8, 1.3]
  });
  
  const opacityAnim = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1, 0.6]
  });

  if (!fullScreen) {
    return (
      <View style={styles.inline}>
        <ActivityIndicator size="small" color={colors.primary} />
        {message && <Text style={[styles.inlineText, { color: colors.textSecondary }]}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.animationWrapper}>
        {/* Outer Morphing Shape */}
        <Animated.View 
          style={[
            styles.morphShapeOuter, 
            { 
              backgroundColor: colors.primary, 
              borderRadius: borderRadius1,
              transform: [{ rotate: rotate1 }, { scale: scale1 }] 
            }
          ]} 
        />
        
        {/* Inner Morphing Shape */}
        <Animated.View 
          style={[
            styles.morphShapeInner, 
            { 
              backgroundColor: colors.accent, 
              borderRadius: borderRadius2,
              transform: [{ rotate: rotate2 }, { scale: scale2 }] 
            }
          ]} 
        />
      </View>
      
      {message && (
        <Animated.Text style={[styles.text, { color: colors.textSecondary, opacity: opacityAnim }]}>
          {message}
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  morphShapeOuter: {
    position: 'absolute',
    width: 56,
    height: 56,
    opacity: 0.8,
  },
  morphShapeInner: {
    position: 'absolute',
    width: 40,
    height: 40,
    opacity: 0.9,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  inlineText: {
    fontSize: FONT_SIZE.md,
    marginLeft: SPACING.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  text: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    letterSpacing: 0.5,
  },
});

export default LoadingSpinner;

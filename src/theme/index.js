// Docstec Tracker Theme Configuration
// Supports both Dark and Light modes using a runtime Proxy wrapper
import useStore from '../store/useStore';

export const LIGHT_COLORS = {
  primary: '#1877F2',      // Facebook Blue
  secondary: '#4E709D',    // Cool Slate Blue
  accent: '#1877F2',       // Facebook Blue Accent
  text: '#050505',         // Facebook Main Text Black
  textSecondary: '#65676B',// Facebook Muted Grey Text
  bg: '#F0F2F5',           // Facebook Light Grey BG
  bgAlt: '#FFFFFF',        // Pure White Cards
  border: '#E4E6EB',       // Divider lines
  success: '#10B981',      // Success Green
  danger: '#EF4444',       // Danger Red
  warning: '#1877F2',      // Warning mapped to Facebook Blue (removes yellow/orange)
};

export const DARK_COLORS = {
  primary: '#2D88FF',      // Facebook Dark Active Blue
  secondary: '#82A3D1',    // Complementary Muted Blue Slate
  accent: '#2D88FF',       // Facebook Dark Active Blue Accent
  text: '#E4E6EB',         // Facebook Dark Text
  textSecondary: '#B0B3B8',// Facebook Dark Muted Text
  bg: '#18191A',           // Facebook Dark BG
  bgAlt: '#242526',        // Facebook Dark Card BG
  border: '#3E4042',       // Facebook Dark Border
  success: '#34D399',      // Success Neon Green
  danger: '#F87171',       // Danger Neon Red
  warning: '#2D88FF',      // Warning mapped to Facebook Blue (removes yellow/orange)
};

// Dynamic COLORS Proxy to automatically hot-swap based on current theme mode
export const COLORS = new Proxy({}, {
  get(target, prop) {
    try {
      const themeMode = useStore.getState().themeMode || 'dark';
      const palette = themeMode === 'dark' ? DARK_COLORS : LIGHT_COLORS;
      
      // Smart backwards-compatibility mapping to simplify components
      switch (prop) {
        case 'primaryLight':
        case 'primaryDark':
          return palette.primary;
        case 'accentLight':
          return palette.accent;
        case 'successLight':
          return palette.success + '15'; // low opacity green
        case 'dangerLight':
          return palette.danger + '15'; // low opacity red
        case 'warningLight':
          return palette.warning + '15';
        case 'info':
          return palette.accent;
        case 'infoLight':
          return palette.accent + '15';
        case 'white':
          return themeMode === 'dark' ? '#242526' : '#FFFFFF';
        case 'background':
          return palette.bg;
        case 'surface':
          return palette.bgAlt;
        case 'borderLight':
          return palette.bg;
        case 'disabled':
          return palette.secondary;
        case 'textPrimary':
          return palette.text;
        case 'textSecondary':
          return palette.textSecondary;
        case 'textTertiary':
          return palette.secondary;
        case 'textInverse':
          return themeMode === 'dark' ? '#18191A' : '#FFFFFF';
        case 'textAccent':
          return palette.primary;
        case 'shadowColor':
          return themeMode === 'dark' ? '#000000' : '#050505';
        default:
          return palette[prop];
      }
    } catch (e) {
      // Safe fallback before store initialization
      return DARK_COLORS[prop] || LIGHT_COLORS[prop] || prop;
    }
  }
});

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  huge: 34,
};

export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
};

export const BORDER_RADIUS = {
  sm: 8,   // Beautifully rounded borders & smaller inputs (8px)
  md: 12,  // Soft modern corners for cards & forms (12px)
  lg: 16,  // Smooth headers and sub-containers (16px)
  xl: 22,  // Large outer containers (22px)
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
};

// React Hook to dynamically subscribe to active theme colors in components
export const useTheme = () => {
  const themeMode = useStore((state) => state.themeMode);
  const isDark = themeMode === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  
  // Extend standard colors with backwards-compatible extended keys for style hook consumers
  const extendedColors = {
    ...colors,
    primaryLight: colors.primary,
    primaryDark: colors.primary,
    accentLight: colors.accent,
    successLight: colors.success + '15',
    dangerLight: colors.danger + '15',
    warningLight: colors.warning + '15',
    info: colors.accent,
    infoLight: colors.accent + '15',
    white: isDark ? '#242526' : '#FFFFFF',
    background: colors.bg,
    surface: colors.bgAlt,
    borderLight: colors.bg,
    disabled: colors.secondary,
    textPrimary: colors.text,
    textSecondary: colors.textSecondary,
    textTertiary: colors.secondary,
    textInverse: isDark ? '#18191A' : '#FFFFFF',
    textAccent: colors.primary,
    shadowColor: isDark ? '#000000' : '#050505',
  };

  return { themeMode, isDark, colors: extendedColors };
};

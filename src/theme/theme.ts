// ─────────────────────────────────────────────────────────────────────────────
// RentalMeet — Global Theme
// Single source of truth for all colors, typography, spacing, and shadows.
// Import { Colors, Typography, Spacing, Shadows, Radii } from './theme'
// ─────────────────────────────────────────────────────────────────────────────

// ── Colors ───────────────────────────────────────────────────────────────────
export const Colors = {
  // Primary brand — golden amber from logo icon
  primary:        '#F5A623',
  primaryDark:    '#D98E0E',
  primaryLight:   '#FEF3DC',
  primaryBorder:  '#F5D48A',
  primaryGlow:    'rgba(245,166,35,0.30)',
  primaryDim:     'rgba(245,166,35,0.14)',

  // Secondary — charcoal from "Meet" wordmark
  charcoal:       '#2C2C2C',
  charcoalMid:    '#555555',
  charcoalLight:  '#8A8A8A',
  charcoalWarm:   '#6B6550',   // warm muted gold-grey for inactive states

  // Surfaces & backgrounds
  surface:        '#FFFFFF',
  background:     '#F7F6F2',   // warm off-white canvas
  border:         '#EEECE6',
  divider:        '#F0EEE6',

  // Tab bar (dark warm base)
  tabBar:         '#1E1B14',
  tabBarBorder:   'rgba(245,166,35,0.10)',

  // Semantic status colors (keep their universal meaning)
  success:        '#16A34A',
  successLight:   '#DCFCE7',
  warning:        '#D98E0E',   // reuse primaryDark for "pending"
  warningLight:   '#FEF3DC',   // reuse primaryLight
  danger:         '#DC2626',
  dangerLight:    '#FEE2E2',
  info:           '#2563EB',
  infoLight:      '#DBEAFE',

  // Misc
  white:          '#FFFFFF',
  black:          '#000000',
  transparent:    'transparent',
} as const;

// ── Typography ────────────────────────────────────────────────────────────────
export const Typography = {
  // Weights
  regular:    '400' as const,
  medium:     '500' as const,
  semiBold:   '600' as const,
  bold:       '700' as const,
  extraBold:  '800' as const,

  // Sizes
  xs:   9.5,
  sm:   11,
  base: 13,
  md:   14,
  lg:   17,
  xl:   20,
  xxl:  28,

  // Letter spacings
  tight:  -0.5,
  normal:  0.2,
  wide:    0.7,
  wider:   2.5,
} as const;

// ── Spacing ───────────────────────────────────────────────────────────────────
export const Spacing = {
  xxs:  3,
  xs:   6,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
} as const;

// ── Border radii ──────────────────────────────────────────────────────────────
export const Radii = {
  sm:     10,
  md:     14,
  lg:     18,
  xl:     20,
  xxl:    28,
  full:   999,
} as const;

// ── Shadows ───────────────────────────────────────────────────────────────────
export const Shadows = {
  // Soft card shadow
  card: {
    shadowColor:  Colors.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  // Header / sheet shadow
  header: {
    shadowColor:  Colors.charcoal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 6,
  },
  // Primary-colored button / FAB shadow
  primary: {
    shadowColor:  Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 8,
    elevation: 4,
  },
  // Floating / tab bar shadow
  floating: {
    shadowColor:  Colors.charcoal,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 28,
  },
} as const;

// ── Status config (used in BookingsScreen & beyond) ───────────────────────────
export const StatusConfig: Record<
  string,
  { color: string; bg: string; icon: string; label: string }
> = {
  confirmed: { color: Colors.success,  bg: Colors.successLight, icon: 'checkmark-circle',      label: 'Confirmed' },
  pending:   { color: Colors.warning,  bg: Colors.warningLight, icon: 'time',                  label: 'Pending'   },
  cancelled: { color: Colors.danger,   bg: Colors.dangerLight,  icon: 'close-circle',           label: 'Cancelled' },
  completed: { color: Colors.info,     bg: Colors.infoLight,    icon: 'checkmark-done-circle',  label: 'Completed' },
};

// ── Tab bar constants ─────────────────────────────────────────────────────────
export const TAB_BAR_HEIGHT  = 68;
export const TAB_CENTER_SIZE = 60;
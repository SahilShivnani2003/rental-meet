import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Shadows, Typography, Radii } from '../../theme/theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface EmptyStateProps {
    /** Ionicons icon name — defaults to 'folder-open-outline' */
    icon?: IoniconsName;
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    style?: ViewStyle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const EmptyState: React.FC<EmptyStateProps> = ({
    icon = 'folder-open-outline',
    title = 'Nothing here yet',
    description = "When data appears, you'll find it right here.",
    actionLabel,
    onAction,
    style,
}) => {
    const floatAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.88)).current;

    useEffect(() => {
        // Entrance — fade + spring scale
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 480,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 60,
                friction: 10,
                useNativeDriver: true,
            }),
        ]).start();

        // Perpetual float on the icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -10,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.container,
                style,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
        >
            {/* ── Concentric ring illustration ── */}
            <View style={styles.ringOuter}>
                <View style={styles.ringMiddle}>
                    <View style={styles.ringInner}>
                        <Animated.View
                            style={[
                                styles.illustrationWrap,
                                { transform: [{ translateY: floatAnim }] },
                            ]}
                        >
                            <Ionicons name={icon} size={32} color={Colors.primary} />
                            {/* Decorative accent dots */}
                            <View style={[styles.dot, styles.dotTL]} />
                            <View style={[styles.dot, styles.dotTR]} />
                            <View style={[styles.dot, styles.dotBR]} />
                        </Animated.View>
                    </View>
                </View>
            </View>

            {/* ── Text block ── */}
            <View style={styles.textBlock}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
            </View>

            {/* ── Optional CTA ── */}
            {actionLabel && onAction && (
                <TouchableOpacity activeOpacity={0.82} onPress={onAction} style={styles.actionBtn}>
                    <Text style={styles.actionLabel}>{actionLabel}</Text>
                </TouchableOpacity>
            )}

            {/* ── Decorative bottom rule ── */}
            <View style={styles.rule} />
        </Animated.View>
    );
};

export default EmptyState;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const RING_1 = 160;
const RING_2 = 118;
const RING_3 = 82;

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xxl * 1.5,
        paddingHorizontal: Spacing.xl,
    },

    // Rings
    ringOuter: {
        width: RING_1,
        height: RING_1,
        borderRadius: RING_1 / 2,
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xxl,
    },
    ringMiddle: {
        width: RING_2,
        height: RING_2,
        borderRadius: RING_2 / 2,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.card,
    },
    ringInner: {
        width: RING_3,
        height: RING_3,
        borderRadius: RING_3 / 2,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.primary,
    },

    // Icon wrapper
    illustrationWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Accent dots
    dot: {
        position: 'absolute',
        width: 5,
        height: 5,
        borderRadius: 999,
        backgroundColor: Colors.primary,
    },
    dotTL: { top: -4, left: -8, opacity: 0.7 },
    dotTR: { top: -6, right: -6, opacity: 0.45 },
    dotBR: { bottom: -4, right: -8, opacity: 0.6 },

    // Text
    textBlock: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        gap: Spacing.xs,
    },
    title: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
        textAlign: 'center',
    },
    description: {
        fontSize: Typography.base,
        fontWeight: Typography.regular,
        color: Colors.charcoalLight,
        letterSpacing: Typography.normal,
        textAlign: 'center',
        lineHeight: 20,
        maxWidth: 240,
    },

    // CTA button
    actionBtn: {
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.xl,
        ...Shadows.primary,
    },
    actionLabel: {
        fontSize: Typography.md,
        fontWeight: Typography.semiBold,
        color: Colors.white,
        letterSpacing: Typography.wide,
    },

    // Bottom rule
    rule: {
        marginTop: Spacing.xxl,
        width: 40,
        height: 3,
        borderRadius: 999,
        backgroundColor: Colors.primaryBorder,
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Usage
// ─────────────────────────────────────────────────────────────────────────────
//
// import EmptyState from '@/components/common/EmptyState';
//
// // Default
// <EmptyState />
//
// // Custom per-screen
// <EmptyState
//   icon="search-outline"
//   title="No results found"
//   description="Try adjusting your search or filters."
//   actionLabel="Clear Filters"
//   onAction={clearFilters}
// />
//
// Per-screen icon guide (Ionicons):
//   Bookings    → 'calendar-outline'
//   Search      → 'search-outline'
//   Messages    → 'chatbubble-ellipses-outline'
//   Favourites  → 'heart-outline'
//   Reviews     → 'star-outline'
//   Wallet      → 'wallet-outline'
//   Experts     → 'people-outline'
//   Notifications → 'notifications-outline'

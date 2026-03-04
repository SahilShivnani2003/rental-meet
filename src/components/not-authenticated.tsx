import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigations/RootNavigation';
import { Colors, Spacing, Radii, Shadows, Typography } from '../theme/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NotAuthenticatedProps {
    navigation: NativeStackNavigationProp<RootStackParamList>;
    /** What the user was trying to do — shown in the subtitle */
    featureLabel?: string;
}

// ── Floating perk chip ────────────────────────────────────────────────────────
function PerkChip({
    icon,
    label,
    color,
    bg,
    delay,
    offsetX,
    offsetY,
}: {
    icon: string;
    label: string;
    color: string;
    bg: string;
    delay: number;
    offsetX: number;
    offsetY: number;
}) {
    const fade  = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(12)).current;
    const float = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance
        Animated.parallel([
            Animated.timing(fade,  { toValue: 1, delay, duration: 400, useNativeDriver: true }),
            Animated.spring(slide, { toValue: 0, delay, useNativeDriver: true, speed: 14, bounciness: 8 }),
        ]).start();

        // Gentle float loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(float, { toValue: -5, duration: 2200 + delay * 0.3, useNativeDriver: true }),
                Animated.timing(float, { toValue: 0,  duration: 2200 + delay * 0.3, useNativeDriver: true }),
            ]),
        ).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.chip,
                { backgroundColor: bg, left: offsetX, top: offsetY },
                { opacity: fade, transform: [{ translateY: Animated.add(slide, float) }] },
            ]}
        >
            <View style={[styles.chipIconWrap, { backgroundColor: color + '22' }]}>
                <Ionicons name={icon as any} size={13} color={color} />
            </View>
            <Text style={[styles.chipLabel, { color }]}>{label}</Text>
        </Animated.View>
    );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function NotAuthenticatedScreen({
    navigation,
    featureLabel,
}: NotAuthenticatedProps) {
    const logoFade   = useRef(new Animated.Value(0)).current;
    const lockSlide  = useRef(new Animated.Value(30)).current;
    const lockScale  = useRef(new Animated.Value(0.7)).current;
    const cardSlide  = useRef(new Animated.Value(40)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const ringScale  = useRef(new Animated.Value(1)).current;
    const ringOp     = useRef(new Animated.Value(0.5)).current;
    const btnScale   = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Staggered entrance
        Animated.sequence([
            Animated.timing(logoFade, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.parallel([
                Animated.spring(lockSlide, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 10 }),
                Animated.spring(lockScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }),
            ]),
            Animated.parallel([
                Animated.spring(cardSlide,  { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 7 }),
                Animated.timing(cardOpacity,{ toValue: 1, duration: 380, useNativeDriver: true }),
            ]),
        ]).start();

        // Pulse ring
        Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(ringScale, { toValue: 1.45, duration: 1400, useNativeDriver: true }),
                    Animated.timing(ringOp,    { toValue: 0,    duration: 1400, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(ringScale, { toValue: 1, duration: 0, useNativeDriver: true }),
                    Animated.timing(ringOp,    { toValue: 0.5, duration: 0, useNativeDriver: true }),
                ]),
            ]),
        ).start();
    }, []);

    const handleSignIn = () => {
        Animated.sequence([
            Animated.timing(btnScale, { toValue: 0.94, duration: 80, useNativeDriver: true }),
            Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 22 }),
        ]).start(() => navigation.navigate('login'));
    };

    const handleRegister = () => navigation.navigate('registerType');
    const handleBack     = () => {
        if (navigation.canGoBack()) navigation.goBack();
    };

    return (
        <View style={styles.container}>
            {/* ── Decorative arcs ── */}
            <View style={styles.arcTop} />
            <View style={styles.arcBottom} />

            {/* ── Back button ── */}
            {navigation.canGoBack() && (
                <Animated.View style={[styles.backBtn, { opacity: logoFade }]}>
                    <TouchableOpacity onPress={handleBack} style={styles.backTouchable} activeOpacity={0.75}>
                        <Ionicons name="chevron-back" size={20} color={Colors.charcoal} />
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* ── Floating perk chips ── */}
            <View style={styles.chipsLayer} pointerEvents="none">
                <PerkChip icon="heart"         label="Save Venues"    color="#E11D48"      bg="#FFF1F2" delay={600}  offsetX={16}                    offsetY={SCREEN_HEIGHT * 0.18} />
                <PerkChip icon="calendar"      label="Bookings"       color={Colors.primary} bg={Colors.primaryLight} delay={750} offsetX={SCREEN_WIDTH - 130} offsetY={SCREEN_HEIGHT * 0.22} />
                <PerkChip icon="star"          label="Rewards"        color="#F59E0B"      bg="#FFFBEB" delay={900}  offsetX={24}                    offsetY={SCREEN_HEIGHT * 0.60} />
                <PerkChip icon="notifications" label="Alerts"         color={Colors.warning} bg={Colors.warningLight} delay={1050} offsetX={SCREEN_WIDTH - 112} offsetY={SCREEN_HEIGHT * 0.56} />
            </View>

            {/* ── Lock hero ── */}
            <Animated.View
                style={[
                    styles.heroArea,
                    {
                        opacity: logoFade,
                        transform: [{ translateY: lockSlide }, { scale: lockScale }],
                    },
                ]}
            >
                {/* Pulse ring */}
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.pulseRing,
                        { transform: [{ scale: ringScale }], opacity: ringOp },
                    ]}
                />
                {/* Outer ring */}
                <View style={styles.lockRingOuter}>
                    <View style={styles.lockRingInner}>
                        <Ionicons name="lock-closed" size={40} color={Colors.primary} />
                    </View>
                </View>
            </Animated.View>

            {/* ── Content card ── */}
            <Animated.View
                style={[
                    styles.card,
                    {
                        opacity: cardOpacity,
                        transform: [{ translateY: cardSlide }],
                    },
                ]}
            >
                {/* Accent bar */}
                <View style={styles.cardAccent} />

                <View style={styles.cardBody}>
                    <Text style={styles.cardEyebrow}>SIGN IN REQUIRED</Text>
                    <Text style={styles.cardTitle}>
                        {featureLabel
                            ? `Sign in to access\n${featureLabel}`
                            : 'You need to\nsign in first'}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                        Create a free account or sign in to unlock bookings,
                        saved venues and personalised picks.
                    </Text>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Sign In button */}
                    <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                        <TouchableOpacity
                            style={styles.signInBtn}
                            onPress={handleSignIn}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.signInBtnText}>Sign In</Text>
                            <View style={styles.signInBtnArrow}>
                                <Ionicons name="arrow-forward" size={17} color={Colors.primary} />
                            </View>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Register row */}
                    <TouchableOpacity
                        style={styles.registerBtn}
                        onPress={handleRegister}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="person-add-outline" size={16} color={Colors.charcoalLight} />
                        <Text style={styles.registerBtnText}>Create a free account</Text>
                    </TouchableOpacity>

                    {/* Guest continue */}
                    {navigation.canGoBack() && (
                        <TouchableOpacity onPress={handleBack} style={styles.guestRow} activeOpacity={0.7}>
                            <Text style={styles.guestText}>Continue browsing as guest</Text>
                            <Ionicons name="chevron-forward" size={13} color={Colors.charcoalLight} />
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>

            <Text style={styles.version}>RentalMeet v1.0.0</Text>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },

    // Arcs
    arcTop: {
        position: 'absolute',
        top: -SCREEN_WIDTH * 0.55,
        left: -SCREEN_WIDTH * 0.4,
        width: SCREEN_WIDTH * 0.9,
        height: SCREEN_WIDTH * 0.9,
        borderRadius: SCREEN_WIDTH * 0.45,
        backgroundColor: Colors.primaryLight,
        opacity: 0.55,
    },
    arcBottom: {
        position: 'absolute',
        bottom: -SCREEN_WIDTH * 0.35,
        right: -SCREEN_WIDTH * 0.35,
        width: SCREEN_WIDTH * 0.7,
        height: SCREEN_WIDTH * 0.7,
        borderRadius: SCREEN_WIDTH * 0.35,
        backgroundColor: Colors.primaryLight,
        opacity: 0.35,
    },

    // Back
    backBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 54 : 20,
        left: Spacing.lg,
    },
    backTouchable: {
        width: 40, height: 40,
        borderRadius: Radii.md,
        backgroundColor: Colors.surface,
        alignItems: 'center', justifyContent: 'center',
        ...Shadows.card,
    },

    // Chips layer
    chipsLayer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    chip: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: Radii.full,
        ...Shadows.card,
    },
    chipIconWrap: {
        width: 22, height: 22, borderRadius: 6,
        alignItems: 'center', justifyContent: 'center',
    },
    chipLabel: {
        fontSize: 11,
        fontWeight: Typography.bold,
        letterSpacing: 0.2,
    },

    // Lock hero
    heroArea: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xxl,
        zIndex: 1,
    },
    pulseRing: {
        position: 'absolute',
        width: 116,
        height: 116,
        borderRadius: 58,
        borderWidth: 1.5,
        borderColor: Colors.primaryGlow,
        backgroundColor: 'rgba(245,166,35,0.06)',
    },
    lockRingOuter: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: Colors.surface,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        ...Shadows.header,
    },
    lockRingInner: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center', justifyContent: 'center',
    },

    // Card
    card: {
        width: SCREEN_WIDTH - 32,
        backgroundColor: Colors.surface,
        borderRadius: Radii.xxl,
        overflow: 'hidden',
        zIndex: 1,
        ...Shadows.header,
    },
    cardAccent: {
        height: 4,
        backgroundColor: Colors.primary,
    },
    cardBody: {
        padding: Spacing.xl,
    },
    cardEyebrow: {
        fontSize: 10,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
        letterSpacing: 2,
        marginBottom: Spacing.xs,
    },
    cardTitle: {
        fontSize: 26,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.5,
        lineHeight: 32,
        marginBottom: Spacing.sm,
    },
    cardSubtitle: {
        fontSize: 14,
        color: Colors.charcoalLight,
        fontWeight: Typography.regular,
        lineHeight: 21,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.background,
        marginVertical: Spacing.xl,
    },

    // Sign in button
    signInBtn: {
        backgroundColor: Colors.charcoal,
        borderRadius: Radii.md,
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: Spacing.sm,
        ...Shadows.floating,
    },
    signInBtnText: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.3,
    },
    signInBtnArrow: {
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: Colors.surface,
        alignItems: 'center', justifyContent: 'center',
    },

    // Register
    registerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 50,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        marginBottom: Spacing.sm,
    },
    registerBtnText: {
        fontSize: 14,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
    },

    // Guest row
    guestRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: Spacing.xs,
    },
    guestText: {
        fontSize: 13,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },

    version: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 36 : 20,
        fontSize: 11,
        color: Colors.border,
        fontWeight: Typography.regular,
    },
});
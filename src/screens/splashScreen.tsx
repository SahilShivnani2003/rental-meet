import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
    Easing,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigations/RootNavigation';
import { useAuthStore } from '../store/auth-store';

const { width: W, height: H } = Dimensions.get('window');

// ─── Brand Tokens ────────────────────────────────────────────────────────────
const ORANGE = '#F29200';
const ORANGE_DARK = '#D97F00';
const ORANGE_DEEP = '#B86C00';
const WHITE = '#FFFFFF';
const CHARCOAL = '#1A1A1A';
const CHARCOAL_MID = '#2E2E2E';

type SplashProps = NativeStackScreenProps<RootStackParamList, 'splash'>;

export default function SplashScreen({ navigation }: SplashProps) {
    const loadUser = useAuthStore(state => state.loadUser);

    // ── Animation refs ────────────────────────────────────────────────────────
    const bgScale       = useRef(new Animated.Value(1.15)).current;
    const ring1Opacity  = useRef(new Animated.Value(0)).current;
    const ring1Scale    = useRef(new Animated.Value(0.4)).current;
    const ring2Opacity  = useRef(new Animated.Value(0)).current;
    const ring2Scale    = useRef(new Animated.Value(0.4)).current;
    const ring3Opacity  = useRef(new Animated.Value(0)).current;
    const ring3Scale    = useRef(new Animated.Value(0.4)).current;
    const logoOpacity   = useRef(new Animated.Value(0)).current;
    const logoScale     = useRef(new Animated.Value(0.6)).current;
    const logoY         = useRef(new Animated.Value(20)).current;
    const shimmer       = useRef(new Animated.Value(0)).current;
    const titleOpacity  = useRef(new Animated.Value(0)).current;
    const titleY        = useRef(new Animated.Value(24)).current;
    const sloganOpacity = useRef(new Animated.Value(0)).current;
    const sloganY       = useRef(new Animated.Value(16)).current;
    const badgeOpacity  = useRef(new Animated.Value(0)).current;
    const badgeScale    = useRef(new Animated.Value(0.8)).current;
    const dot1          = useRef(new Animated.Value(0)).current;
    const dot2          = useRef(new Animated.Value(0)).current;
    const dot3          = useRef(new Animated.Value(0)).current;
    const dot1Pulse     = useRef(new Animated.Value(1)).current;
    const dot2Pulse     = useRef(new Animated.Value(1)).current;
    const dot3Pulse     = useRef(new Animated.Value(1)).current;
    const screenOpacity = useRef(new Animated.Value(1)).current;
    const glowOpacity   = useRef(new Animated.Value(0)).current;

    const handleNavigation = async () => {
        await loadUser();
        const { isAuthenticated, user } = useAuthStore.getState();
        if (isAuthenticated) {
            navigation.replace(user?.role === 'owner' ? 'owner' : 'client');
        } else {
            navigation.replace('login');
        }
    };

    useEffect(() => {
        StatusBar.setHidden(true);

        // Continuous shimmer loop
        const shimmerLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                Animated.timing(shimmer, { toValue: 0, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            ])
        );

        // Dot pulse loop
        const pulseDots = Animated.loop(
            Animated.stagger(200, [
                Animated.sequence([
                    Animated.timing(dot1Pulse, { toValue: 1.5, duration: 400, useNativeDriver: true }),
                    Animated.timing(dot1Pulse, { toValue: 1, duration: 400, useNativeDriver: true }),
                ]),
                Animated.sequence([
                    Animated.timing(dot2Pulse, { toValue: 1.5, duration: 400, useNativeDriver: true }),
                    Animated.timing(dot2Pulse, { toValue: 1, duration: 400, useNativeDriver: true }),
                ]),
                Animated.sequence([
                    Animated.timing(dot3Pulse, { toValue: 1.5, duration: 400, useNativeDriver: true }),
                    Animated.timing(dot3Pulse, { toValue: 1, duration: 400, useNativeDriver: true }),
                ]),
            ])
        );

        Animated.sequence([
            // 1 — BG zoom-in settle
            Animated.timing(bgScale, {
                toValue: 1,
                duration: 700,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),

            // 2 — Ripple rings burst out
            Animated.stagger(120, [
                Animated.parallel([
                    Animated.timing(ring1Opacity, { toValue: 0.25, duration: 400, useNativeDriver: true }),
                    Animated.timing(ring1Scale, { toValue: 1, duration: 500, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(ring2Opacity, { toValue: 0.18, duration: 400, useNativeDriver: true }),
                    Animated.timing(ring2Scale, { toValue: 1, duration: 500, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(ring3Opacity, { toValue: 0.1, duration: 400, useNativeDriver: true }),
                    Animated.timing(ring3Scale, { toValue: 1, duration: 500, easing: Easing.out(Easing.back(1.0)), useNativeDriver: true }),
                ]),
            ]),

            // 3 — Logo drops in with glow
            Animated.parallel([
                Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 16 }),
                Animated.timing(logoOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
                Animated.spring(logoY, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 10 }),
                Animated.timing(glowOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]),

            // 4 — Title slides up
            Animated.parallel([
                Animated.timing(titleOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
                Animated.spring(titleY, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 8 }),
            ]),

            // 5 — Slogan
            Animated.parallel([
                Animated.timing(sloganOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
                Animated.spring(sloganY, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 6 }),
            ]),

            // 6 — Badge pop
            Animated.parallel([
                Animated.spring(badgeScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 18 }),
                Animated.timing(badgeOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            ]),

            // 7 — Loading dots appear
            Animated.stagger(100, [
                Animated.spring(dot1, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 12 }),
                Animated.spring(dot2, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 12 }),
                Animated.spring(dot3, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 12 }),
            ]),

            // 8 — Hold
            Animated.delay(900),

            // 9 — Fade out
            Animated.timing(screenOpacity, { toValue: 0, duration: 450, useNativeDriver: true }),
        ]).start(handleNavigation);

        shimmerLoop.start();
        // Start dot pulse after dots appear
        setTimeout(() => pulseDots.start(), 2200);

        return () => {
            shimmerLoop.stop();
            pulseDots.stop();
        };
    }, []);

    // Shimmer interpolation for logo glow
    const shimmerTranslate = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [-W * 0.6, W * 0.6],
    });

    return (
        <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
            <StatusBar hidden />

            {/* ── Full orange background with subtle zoom ── */}
            <Animated.View style={[styles.background, { transform: [{ scale: bgScale }] }]}>
                {/* Diagonal dark overlay stripe */}
                <View style={styles.diagonalStripe} />
                {/* Bottom-left corner glow */}
                <View style={styles.cornerGlowBL} />
                {/* Top-right corner glow */}
                <View style={styles.cornerGlowTR} />
            </Animated.View>

            {/* ── Ripple rings behind logo ── */}
            <Animated.View style={[styles.ring, styles.ring3, {
                opacity: ring3Opacity,
                transform: [{ scale: ring3Scale }],
            }]} />
            <Animated.View style={[styles.ring, styles.ring2, {
                opacity: ring2Opacity,
                transform: [{ scale: ring2Scale }],
            }]} />
            <Animated.View style={[styles.ring, styles.ring1, {
                opacity: ring1Opacity,
                transform: [{ scale: ring1Scale }],
            }]} />

            {/* ── Center content ── */}
            <View style={styles.center}>

                {/* Logo container with glow */}
                <Animated.View style={[styles.logoContainer, {
                    opacity: logoOpacity,
                    transform: [{ scale: logoScale }, { translateY: logoY }],
                }]}>
                    {/* Glow halo */}
                    <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />
                    {/* Logo card */}
                    <View style={styles.logoCard}>
                        <Image
                            source={require('../assets/icon.webp')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        {/* Shimmer sweep */}
                        <Animated.View
                            style={[styles.shimmer, { transform: [{ translateX: shimmerTranslate }, { rotate: '20deg' }] }]}
                        />
                    </View>
                </Animated.View>

                {/* Brand Name */}
                <Animated.View style={[styles.titleRow, {
                    opacity: titleOpacity,
                    transform: [{ translateY: titleY }],
                }]}>
                    <Text style={styles.brandRental}>Rental</Text>
                    <Text style={styles.brandMeet}>Meet</Text>
                </Animated.View>

                {/* Divider line with dot */}
                <Animated.View style={[styles.dividerRow, { opacity: sloganOpacity }]}>
                    <View style={styles.dividerLine} />
                    <View style={styles.dividerDot} />
                    <View style={styles.dividerLine} />
                </Animated.View>

                {/* Slogan */}
                <Animated.Text style={[styles.slogan, {
                    opacity: sloganOpacity,
                    transform: [{ translateY: sloganY }],
                }]}>
                    India's 1st Meeting Venue{'\n'}Booking Platform
                </Animated.Text>

                {/* "First in India" badge */}
                <Animated.View style={[styles.badge, {
                    opacity: badgeOpacity,
                    transform: [{ scale: badgeScale }],
                }]}>
                    <Text style={styles.badgeText}>#1 IN INDIA</Text>
                </Animated.View>
            </View>

            {/* ── Animated loading dots ── */}
            <View style={styles.dotsRow}>
                {[
                    { anim: dot1, pulse: dot1Pulse },
                    { anim: dot2, pulse: dot2Pulse },
                    { anim: dot3, pulse: dot3Pulse },
                ].map(({ anim, pulse }, i) => (
                    <Animated.View
                        key={i}
                        style={[
                            styles.dot,
                            i === 1 && styles.dotLarge,
                            {
                                opacity: anim,
                                transform: [{ scale: Animated.multiply(anim, pulse) }],
                            },
                        ]}
                    />
                ))}
            </View>

            {/* ── Bottom tagline ── */}
            <Animated.Text style={[styles.footerTag, { opacity: sloganOpacity }]}>
                Book. Meet. Succeed.
            </Animated.Text>

            {/* ── Version ── */}
            <Text style={styles.version}>v1.0.0</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },

    // ── Background ──
    background: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: ORANGE,
    },
    diagonalStripe: {
        position: 'absolute',
        bottom: -H * 0.15,
        left: -W * 0.2,
        width: W * 1.5,
        height: H * 0.38,
        backgroundColor: ORANGE_DARK,
        opacity: 0.45,
        transform: [{ rotate: '-8deg' }],
    },
    cornerGlowBL: {
        position: 'absolute',
        bottom: -W * 0.3,
        left: -W * 0.3,
        width: W * 0.65,
        height: W * 0.65,
        borderRadius: W * 0.325,
        backgroundColor: ORANGE_DEEP,
        opacity: 0.4,
    },
    cornerGlowTR: {
        position: 'absolute',
        top: -W * 0.25,
        right: -W * 0.25,
        width: W * 0.55,
        height: W * 0.55,
        borderRadius: W * 0.275,
        backgroundColor: '#FFA500',
        opacity: 0.3,
    },

    // ── Ripple rings ──
    ring: {
        position: 'absolute',
        borderRadius: 9999,
        borderWidth: 2,
        borderColor: WHITE,
    },
    ring1: {
        width: W * 0.58,
        height: W * 0.58,
    },
    ring2: {
        width: W * 0.78,
        height: W * 0.78,
    },
    ring3: {
        width: W * 0.98,
        height: W * 0.98,
    },

    // ── Center ──
    center: {
        alignItems: 'center',
        gap: 12,
    },

    // Logo
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    logoGlow: {
        position: 'absolute',
        width: 184,
        height: 184,
        borderRadius: 92,
        backgroundColor: 'rgba(255,255,255,0.22)',
        shadowColor: WHITE,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 48,
        elevation: 0,
    },
    logoCard: {
        width: 148,
        height: 148,
        borderRadius: 74,          // ← perfect circle
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.3,
        shadowRadius: 28,
        elevation: 20,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 60,
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.28)',
    },

    // Title
    titleRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 4,
    },
    brandRental: {
        fontSize: 42,
        fontWeight: '300',
        color: WHITE,
        letterSpacing: -1,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    brandMeet: {
        fontSize: 42,
        fontWeight: '900',
        color: CHARCOAL,
        letterSpacing: -1,
        textShadowColor: 'rgba(0,0,0,0.15)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },

    // Divider
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginVertical: 4,
    },
    dividerLine: {
        width: 48,
        height: 1.5,
        backgroundColor: 'rgba(255,255,255,0.55)',
        borderRadius: 2,
    },
    dividerDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: WHITE,
    },

    // Slogan
    slogan: {
        fontSize: 15,
        fontWeight: '700',
        color: WHITE,
        textAlign: 'center',
        letterSpacing: 0.4,
        lineHeight: 22,
        textShadowColor: 'rgba(0,0,0,0.18)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },

    // Badge
    badge: {
        marginTop: 6,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: CHARCOAL,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: ORANGE,
        letterSpacing: 2.5,
    },

    // Loading dots
    dotsRow: {
        position: 'absolute',
        bottom: H * 0.13,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    dotLarge: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: WHITE,
    },

    // Footer
    footerTag: {
        position: 'absolute',
        bottom: H * 0.075,
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.75)',
        letterSpacing: 3,
        textTransform: 'uppercase',
    },
    version: {
        position: 'absolute',
        bottom: 24,
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '500',
        letterSpacing: 0.8,
    },
});
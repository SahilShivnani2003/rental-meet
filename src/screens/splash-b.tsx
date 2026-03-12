import React, { useEffect, useRef } from 'react';
import {
    View, Text, Image, StyleSheet, Animated,
    Dimensions, StatusBar, Easing,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigations/RootNavigation';
import { useAuthStore } from '../store/auth-store';

const { width: W, height: H } = Dimensions.get('window');

// ─── Tokens ──────────────────────────────────────────────────────────────────
const ORANGE_TOP    = '#FF9500';
const ORANGE_MID    = '#F07800';
const ORANGE_DEEP   = '#C85A00';
const NEAR_BLACK    = '#1A0800';
const WHITE         = '#FFFFFF';
const WHITE_20      = 'rgba(255,255,255,0.20)';
const WHITE_40      = 'rgba(255,255,255,0.40)';
const WHITE_60      = 'rgba(255,255,255,0.60)';

type SplashProps = NativeStackScreenProps<RootStackParamList, 'splash'>;

export default function SplashScreen({ navigation }: SplashProps) {
    const loadUser = useAuthStore(s => s.loadUser);

    // ── Animation refs ────────────────────────────────────────────────────────
    const blob1Scale     = useRef(new Animated.Value(0.6)).current;
    const blob1Opacity   = useRef(new Animated.Value(0)).current;
    const blob2Scale     = useRef(new Animated.Value(0.6)).current;
    const blob2Opacity   = useRef(new Animated.Value(0)).current;
    const particleOpacity = useRef(new Animated.Value(0)).current;
    const orbitRotate    = useRef(new Animated.Value(0)).current;
    const logoOpacity    = useRef(new Animated.Value(0)).current;
    const logoScale      = useRef(new Animated.Value(0.4)).current;
    const logoGlow       = useRef(new Animated.Value(0)).current;
    const rentalOpacity  = useRef(new Animated.Value(0)).current;
    const rentalY        = useRef(new Animated.Value(20)).current;
    const meetOpacity    = useRef(new Animated.Value(0)).current;
    const meetY          = useRef(new Animated.Value(20)).current;
    const pillOpacity    = useRef(new Animated.Value(0)).current;
    const pillScale      = useRef(new Animated.Value(0.8)).current;
    const blinkOpacity   = useRef(new Animated.Value(1)).current;
    const sloganOpacity  = useRef(new Animated.Value(0)).current;
    const sloganY        = useRef(new Animated.Value(16)).current;
    const bottomOpacity  = useRef(new Animated.Value(0)).current;
    const screenOpacity  = useRef(new Animated.Value(1)).current;

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

        // ── Continuous animations ─────────────────────────────────────────────
        // Orbit spin
        Animated.loop(
            Animated.timing(orbitRotate, {
                toValue: 1, duration: 10000,
                easing: Easing.linear, useNativeDriver: true,
            })
        ).start();

        // Logo glow breathe
        Animated.loop(
            Animated.sequence([
                Animated.timing(logoGlow, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(logoGlow, { toValue: 0.3, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        // Badge dot blink
        Animated.loop(
            Animated.sequence([
                Animated.timing(blinkOpacity, { toValue: 0.2, duration: 700, useNativeDriver: true }),
                Animated.timing(blinkOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
            ])
        ).start();

        // Blob breathe
        Animated.loop(
            Animated.sequence([
                Animated.timing(blob1Scale, { toValue: 1.08, duration: 3500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(blob1Scale, { toValue: 0.95, duration: 3500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(blob2Scale, { toValue: 1.1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(blob2Scale, { toValue: 0.9, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        // ── Main entrance sequence ─────────────────────────────────────────────
        Animated.sequence([
            // 1 — Blobs bloom in
            Animated.parallel([
                Animated.timing(blob1Opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(blob2Opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(particleOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
            ]),

            // 2 — Logo bursts in with spring
            Animated.parallel([
                Animated.spring(logoScale, { toValue: 1, speed: 10, bounciness: 20, useNativeDriver: true }),
                Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]),

            // 3 — "Rental" slides up
            Animated.parallel([
                Animated.timing(rentalOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(rentalY, { toValue: 0, speed: 18, bounciness: 8, useNativeDriver: true }),
            ]),

            // 4 — "Meet" slides up
            Animated.parallel([
                Animated.timing(meetOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(meetY, { toValue: 0, speed: 18, bounciness: 8, useNativeDriver: true }),
            ]),

            // 5 — Pill badge pops in
            Animated.parallel([
                Animated.spring(pillScale, { toValue: 1, speed: 18, bounciness: 22, useNativeDriver: true }),
                Animated.timing(pillOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
            ]),

            // 6 — Slogan rises
            Animated.parallel([
                Animated.timing(sloganOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(sloganY, { toValue: 0, speed: 16, bounciness: 6, useNativeDriver: true }),
            ]),

            // 7 — Bottom bar fades in
            Animated.timing(bottomOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),

            // 8 — Hold
            Animated.delay(1000),

            // 9 — Fade out
            Animated.timing(screenOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start(handleNavigation);
    }, []);

    const orbitSpin = orbitRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const glowScale = logoGlow.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.15],
    });

    return (
        <Animated.View style={[s.container, { opacity: screenOpacity }]}>
            <StatusBar hidden />

            {/* ── Gradient background layers ── */}
            <View style={s.bgBase} />
            <View style={s.bgMid} />
            <View style={s.bgBottom} />

            {/* ── Glowing blobs ── */}
            <Animated.View style={[s.blob, s.blob1, {
                opacity: blob1Opacity,
                transform: [{ scale: blob1Scale }],
            }]} />
            <Animated.View style={[s.blob, s.blob2, {
                opacity: blob2Opacity,
                transform: [{ scale: blob2Scale }],
            }]} />

            {/* ── Dot-pattern overlay ── */}
            <Animated.View style={[s.dotPattern, { opacity: particleOpacity }]}>
                {Array.from({ length: 12 }).map((_, row) =>
                    Array.from({ length: 8 }).map((__, col) => (
                        <View
                            key={`${row}-${col}`}
                            style={[s.particle, {
                                top: row * (H / 12),
                                left: col * (W / 8),
                                opacity: Math.random() * 0.25 + 0.05,
                            }]}
                        />
                    ))
                )}
            </Animated.View>

            {/* ── Center content ── */}
            <View style={s.center}>

                {/* Logo with orbit */}
                <Animated.View style={[s.logoWrap, {
                    opacity: logoOpacity,
                    transform: [{ scale: logoScale }],
                }]}>
                    {/* Glow halo */}
                    <Animated.View style={[s.glowHalo, {
                        opacity: logoGlow,
                        transform: [{ scale: glowScale }],
                    }]} />
                    {/* Orbit ring */}
                    <Animated.View style={[s.orbit, { transform: [{ rotate: orbitSpin }] }]}>
                        <View style={s.orbitDot} />
                    </Animated.View>
                    {/* Glass circle */}
                    <View style={s.glassCircle}>
                        {/* Inner logo circle */}
                        <View style={s.logoCircle}>
                            <Image
                                source={require('../assets/logo.jpeg')}
                                style={s.logoImg}
                                resizeMode="cover"
                            />
                        </View>
                    </View>
                </Animated.View>

                {/* Brand name stacked */}
                <View style={s.brandBlock}>
                    <Animated.Text style={[s.rental, {
                        opacity: rentalOpacity,
                        transform: [{ translateY: rentalY }],
                    }]}>
                        Rental
                    </Animated.Text>
                    <Animated.Text style={[s.meet, {
                        opacity: meetOpacity,
                        transform: [{ translateY: meetY }],
                    }]}>
                        Meet
                    </Animated.Text>
                </View>

                {/* Pill badge */}
                <Animated.View style={[s.pill, {
                    opacity: pillOpacity,
                    transform: [{ scale: pillScale }],
                }]}>
                    <Animated.View style={[s.pillDot, { opacity: blinkOpacity }]} />
                    <Text style={s.pillText}>#1 IN INDIA</Text>
                </Animated.View>

                {/* Slogan */}
                <Animated.Text style={[s.slogan, {
                    opacity: sloganOpacity,
                    transform: [{ translateY: sloganY }],
                }]}>
                    India's 1st Meeting Venue{'\n'}Booking Platform
                </Animated.Text>
            </View>

            {/* ── Bottom bar ── */}
            <Animated.View style={[s.bottomBar, { opacity: bottomOpacity }]}>
                <View style={s.bottomFade} />
                <Text style={s.tagline}>BOOK  ·  MEET  ·  SUCCEED</Text>
                <Text style={s.version}>v1.0.0</Text>
            </Animated.View>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },

    // ── Background gradient layers ──
    bgBase: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: ORANGE_TOP,
    },
    bgMid: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: ORANGE_DEEP,
        top: H * 0.3,
        borderRadius: 0,
        // Simulated gradient via layered views
    },
    bgBottom: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: NEAR_BLACK,
        top: H * 0.62,
    },

    // ── Blobs ──
    blob: {
        position: 'absolute',
        borderRadius: 9999,
    },
    blob1: {
        width: W * 0.85,
        height: W * 0.85,
        top: -W * 0.25,
        left: -W * 0.22,
        backgroundColor: 'rgba(255,200,80,0.28)',
    },
    blob2: {
        width: W * 0.7,
        height: W * 0.7,
        bottom: H * 0.04,
        right: -W * 0.2,
        backgroundColor: 'rgba(200,90,0,0.25)',
    },

    // ── Dot pattern ──
    dotPattern: {
        ...StyleSheet.absoluteFillObject,
    },
    particle: {
        position: 'absolute',
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: WHITE,
    },

    // ── Center ──
    center: {
        alignItems: 'center',
        gap: 8,
    },

    // Logo
    logoWrap: {
        width: 140,
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    glowHalo: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(255,255,255,0.12)',
        shadowColor: WHITE,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 40,
        elevation: 0,
    },
    orbit: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    orbitDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: WHITE,
        marginTop: -5,
        shadowColor: WHITE,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 10,
    },
    glassCircle: {
        width: 118,
        height: 118,
        borderRadius: 59,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 12,
    },
    logoCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        overflow: 'hidden',
        backgroundColor: ORANGE_TOP,
    },
    logoImg: {
        width: '100%',
        height: '100%',
    },

    // Brand
    brandBlock: {
        alignItems: 'center',
        gap: -8,
    },
    rental: {
        fontSize: 36,
        fontWeight: '300',
        color: 'rgba(255,255,255,0.85)',
        letterSpacing: 2,
    },
    meet: {
        fontSize: 52,
        fontWeight: '900',
        color: WHITE,
        letterSpacing: -1,
        textShadowColor: 'rgba(0,0,0,0.25)',
        textShadowOffset: { width: 0, height: 3 },
        textShadowRadius: 10,
    },

    // Pill badge
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
        marginTop: 4,
    },
    pillDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: WHITE,
        shadowColor: WHITE,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 4,
        elevation: 4,
    },
    pillText: {
        fontSize: 11,
        fontWeight: '700',
        color: WHITE,
        letterSpacing: 2,
    },

    // Slogan
    slogan: {
        fontSize: 13,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.65)',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 32,
        marginTop: 6,
    },

    // Bottom
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 130,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 28,
        gap: 8,
    },
    bottomFade: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    tagline: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.45)',
        letterSpacing: 3.5,
        textTransform: 'uppercase',
    },
    version: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.25)',
        letterSpacing: 1,
        fontWeight: '400',
    },
});
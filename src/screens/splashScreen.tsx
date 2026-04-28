import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, StatusBar, Easing } from 'react-native';

import { Colors, Typography, Spacing } from '../theme/theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import { RootStackParamList } from '@/types/RootStackParamList';

const { width, height } = Dimensions.get('window');

// ─── Sunburst config ──────────────────────────────────────────────────────────
const RAY_COUNT = 24; // more rays = denser, more premium look
const RAY_LENGTH = width * 0.38;
const RAY_WIDTH = 1.4;

// ─── Particle dots config ─────────────────────────────────────────────────────
const PARTICLE_COUNT = 14;
const particles = Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
    id: i,
    angle: (360 / PARTICLE_COUNT) * i + Math.random() * 15,
    radius: width * 0.19 + Math.random() * width * 0.09,
    size: 2.5 + Math.random() * 3.5,
    delay: Math.random() * 600,
}));

type splashProps = NativeStackScreenProps<RootStackParamList, 'splash'>;

const SplashScreen = ({ navigation }: splashProps) => {
    const { loadUser } = useAuthStore();

    // ─── Background gradient reveal ───────────────────────────────────────────
    const bgOpacity = useRef(new Animated.Value(0)).current;

    // ─── Zoom-out: map + icon scale together ──────────────────────────────────
    const zoomScale = useRef(new Animated.Value(2.8)).current;
    const zoomOpacity = useRef(new Animated.Value(0)).current;

    // ─── Map shimmer ──────────────────────────────────────────────────────────
    const mapOpacity = useRef(new Animated.Value(0)).current;

    // ─── Premium glow halo ────────────────────────────────────────────────────
    const glowOpacity = useRef(new Animated.Value(0)).current;
    const glowPulse = useRef(new Animated.Value(1)).current;
    const glowInner = useRef(new Animated.Value(0)).current;

    // ─── Rotating sunburst ────────────────────────────────────────────────────
    const raysOpacity = useRef(new Animated.Value(0)).current;
    const raysScale = useRef(new Animated.Value(0.3)).current;
    const raysRotate = useRef(new Animated.Value(0)).current;

    // ─── Icon shine sweep ─────────────────────────────────────────────────────
    const shineX = useRef(new Animated.Value(-1)).current;
    const iconScale = useRef(new Animated.Value(0.7)).current;
    const iconOpacity = useRef(new Animated.Value(0)).current;

    // ─── Particle floats ──────────────────────────────────────────────────────
    const particleOpacities = useRef(particles.map(() => new Animated.Value(0))).current;
    const particleScales = useRef(particles.map(() => new Animated.Value(0))).current;

    // ─── Ripple rings (more rings, richer look) ───────────────────────────────
    const rings = useRef(
        Array.from({ length: 4 }).map(() => ({
            sc: new Animated.Value(0.1),
            al: new Animated.Value(0),
        })),
    ).current;

    // ─── Tagline ──────────────────────────────────────────────────────────────
    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const taglineY = useRef(new Animated.Value(-30)).current;
    const taglineScale = useRef(new Animated.Value(0.92)).current;

    // ─── Divider line ─────────────────────────────────────────────────────────
    const dividerWidth = useRef(new Animated.Value(0)).current;
    const dividerOpacity = useRef(new Animated.Value(0)).current;

    // ─── Brand wordmark ───────────────────────────────────────────────────────
    const brandOpacity = useRef(new Animated.Value(0)).current;
    const brandY = useRef(new Animated.Value(28)).current;
    const brandScale = useRef(new Animated.Value(0.88)).current;

    // ─── Powered by ───────────────────────────────────────────────────────────
    const poweredOpacity = useRef(new Animated.Value(0)).current;
    const poweredY = useRef(new Animated.Value(10)).current;

    // ─── Bottom badge ─────────────────────────────────────────────────────────
    const badgeOpacity = useRef(new Animated.Value(0)).current;
    const badgeScale = useRef(new Animated.Value(0.85)).current;

    const rippleLoop = useRef<Animated.CompositeAnimation | null>(null);
    const glowLoop = useRef<Animated.CompositeAnimation | null>(null);
    const rayRotateLoop = useRef<Animated.CompositeAnimation | null>(null);

    const handleNavigation = async () => {
        await loadUser();
        const { user, isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) {
            if (user?.role === 'owner') navigation.replace('owner');
            else if (user?.role === 'vendor') navigation.replace('vendor');
            else if (user?.role === 'customer') navigation.replace('client');
            else navigation.replace('onBoarding');
        } else {
            navigation.replace('onBoarding');
        }
    };

    // ─── Ripple helper ────────────────────────────────────────────────────────
    const makeRipple = (sc: Animated.Value, al: Animated.Value, delay: number) =>
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(sc, {
                        toValue: 3.6,
                        duration: 1800,
                        easing: Easing.out(Easing.cubic),
                        useNativeDriver: true,
                    }),
                    Animated.sequence([
                        Animated.timing(al, { toValue: 0.6, duration: 180, useNativeDriver: true }),
                        Animated.timing(al, { toValue: 0, duration: 1620, useNativeDriver: true }),
                    ]),
                ]),
                Animated.parallel([
                    Animated.timing(sc, { toValue: 0.1, duration: 0, useNativeDriver: true }),
                    Animated.timing(al, { toValue: 0, duration: 0, useNativeDriver: true }),
                ]),
            ]),
        );

    // ─── Main animation sequence ──────────────────────────────────────────────
    useEffect(() => {
        StatusBar.setHidden(true);

        // Instant fade-in
        Animated.timing(zoomOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();

        // Background warm wash
        Animated.timing(bgOpacity, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        }).start();

        // PHASE 1 — zoom out with spring feel (0–900ms)
        Animated.timing(zoomScale, {
            toValue: 1,
            duration: 950,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();

        // Map fades in gracefully
        setTimeout(() => {
            Animated.timing(mapOpacity, {
                toValue: 1,
                duration: 700,
                useNativeDriver: true,
            }).start();
        }, 100);

        // PHASE 1b — glow blooms in
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(glowOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(glowInner, { toValue: 1, duration: 700, useNativeDriver: true }),
            ]).start(() => {
                glowLoop.current = Animated.loop(
                    Animated.sequence([
                        Animated.timing(glowPulse, {
                            toValue: 1.22,
                            duration: 1200,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                        Animated.timing(glowPulse, {
                            toValue: 1,
                            duration: 1200,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                    ]),
                );
                glowLoop.current.start();
            });
        }, 280);

        // PHASE 1c — icon springs in
        setTimeout(() => {
            Animated.parallel([
                Animated.spring(iconScale, {
                    toValue: 1,
                    tension: 70,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(iconOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start(() => {
                // Shine sweep after icon appears
                Animated.timing(shineX, {
                    toValue: 2,
                    duration: 700,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }).start();
            });
        }, 500);

        // PHASE 2 — sunburst rays flash in + begin slow rotation (750ms)
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(raysOpacity, {
                    toValue: 0.55,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(raysScale, {
                    toValue: 1,
                    tension: 22,
                    friction: 5,
                    useNativeDriver: true,
                }),
            ]).start();

            rayRotateLoop.current = Animated.loop(
                Animated.timing(raysRotate, {
                    toValue: 1,
                    duration: 18000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            );
            rayRotateLoop.current.start();
        }, 750);

        // PHASE 3 — particles bloom (900ms)
        setTimeout(() => {
            particles.forEach((p, i) => {
                setTimeout(() => {
                    Animated.parallel([
                        Animated.spring(particleScales[i], {
                            toValue: 1,
                            tension: 60,
                            friction: 6,
                            useNativeDriver: true,
                        }),
                        Animated.timing(particleOpacities[i], {
                            toValue: 1,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                    ]).start();
                }, p.delay);
            });
        }, 900);

        // PHASE 4 — ripples start (950ms)
        setTimeout(() => {
            rippleLoop.current = Animated.parallel(
                rings.map((r, i) => makeRipple(r.sc, r.al, i * 420)),
            );
            rippleLoop.current.start();
        }, 950);

        // PHASE 5 — tagline slides in (1100ms)
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(taglineOpacity, {
                    toValue: 1,
                    duration: 480,
                    useNativeDriver: true,
                }),
                Animated.timing(taglineY, {
                    toValue: 0,
                    duration: 480,
                    easing: Easing.out(Easing.back(1.3)),
                    useNativeDriver: true,
                }),
                Animated.timing(taglineScale, { toValue: 1, duration: 480, useNativeDriver: true }),
            ]).start();
        }, 1100);

        // PHASE 5b — decorative divider (1450ms)
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(dividerOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(dividerWidth, {
                    toValue: width * 0.3,
                    duration: 450,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
            ]).start();
        }, 1450);

        // PHASE 6 — brand wordmark rises (1600ms)
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(brandOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(brandY, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.out(Easing.back(1.2)),
                    useNativeDriver: true,
                }),
                Animated.timing(brandScale, { toValue: 1, duration: 500, useNativeDriver: true }),
            ]).start();
        }, 1600);

        // PHASE 7 — powered by fades (2000ms)
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(poweredOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(poweredY, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]).start();
        }, 2000);

        // PHASE 8 — "1st" badge pops in (2200ms)
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(badgeOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
                Animated.spring(badgeScale, {
                    toValue: 1,
                    tension: 80,
                    friction: 6,
                    useNativeDriver: true,
                }),
            ]).start();
        }, 2200);

        // FINISH
        const fin = setTimeout(() => {
            rippleLoop.current?.stop();
            glowLoop.current?.stop();
            rayRotateLoop.current?.stop();
            StatusBar.setHidden(false);
            handleNavigation();
        }, 3800);

        return () => {
            clearTimeout(fin);
            rippleLoop.current?.stop();
            glowLoop.current?.stop();
            rayRotateLoop.current?.stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Derived layout sizes ─────────────────────────────────────────────────
    const MAP_W = width * 0.96;
    const MAP_H = height * 0.5;
    const ICON_SIZE = width * 0.26;
    const GLOW_SIZE = width * 0.56;
    const GLOW_INNER_SIZE = width * 0.34;
    const RIPPLE_BASE = width * 0.28;

    const MAP_TOP = height * 0.225;
    const ICON_TOP = MAP_TOP + MAP_H * 0.46;
    const ICON_CX = width / 2;
    const ICON_CY = ICON_TOP + ICON_SIZE / 2;

    const rayRotateDeg = raysRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View style={[styles.container, { opacity: zoomOpacity }]}>
            {/* Warm background wash */}
            <Animated.View style={[styles.warmBackground, { opacity: bgOpacity }]} />
            <Animated.View style={[styles.warmVignette, { opacity: bgOpacity }]} />

            {/* ══════════════════════════════════════════════════════════════
                ZOOM GROUP
            ══════════════════════════════════════════════════════════════ */}
            <Animated.View style={[styles.zoomGroup, { transform: [{ scale: zoomScale }] }]}>
                {/* India map */}
                <Animated.Image
                    source={require('../assets/Map.png')}
                    style={[
                        styles.mapImage,
                        {
                            width: MAP_W,
                            height: MAP_H,
                            top: MAP_TOP,
                            left: (width - MAP_W) / 2,
                            opacity: mapOpacity,
                        },
                    ]}
                    resizeMode="contain"
                />

                {/* Outer ambient glow */}
                <Animated.View
                    style={[
                        styles.glowHalo,
                        {
                            width: GLOW_SIZE,
                            height: GLOW_SIZE,
                            borderRadius: GLOW_SIZE / 2,
                            top: ICON_CY - GLOW_SIZE / 2,
                            left: ICON_CX - GLOW_SIZE / 2,
                            opacity: glowOpacity,
                            transform: [{ scale: glowPulse }],
                        },
                    ]}
                />

                {/* Inner warm core glow */}
                <Animated.View
                    style={[
                        styles.glowInner,
                        {
                            width: GLOW_INNER_SIZE,
                            height: GLOW_INNER_SIZE,
                            borderRadius: GLOW_INNER_SIZE / 2,
                            top: ICON_CY - GLOW_INNER_SIZE / 2,
                            left: ICON_CX - GLOW_INNER_SIZE / 2,
                            opacity: glowInner,
                            transform: [{ scale: glowPulse }],
                        },
                    ]}
                />

                {/* Rotating sunburst rays */}
                <Animated.View
                    style={[
                        styles.raysContainer,
                        {
                            top: ICON_CY - RAY_LENGTH,
                            left: ICON_CX - RAY_LENGTH,
                            width: RAY_LENGTH * 2,
                            height: RAY_LENGTH * 2,
                            opacity: raysOpacity,
                            transform: [{ scale: raysScale }, { rotate: rayRotateDeg }],
                        },
                    ]}
                >
                    {Array.from({ length: RAY_COUNT }).map((_, i) => {
                        const angle = (360 / RAY_COUNT) * i;
                        const isLong = i % 3 === 0;
                        return (
                            <View
                                key={i}
                                style={[
                                    styles.ray,
                                    {
                                        transform: [
                                            { rotate: `${angle}deg` },
                                            { translateY: -(RAY_LENGTH * (isLong ? 0.56 : 0.48)) },
                                        ],
                                        height: RAY_LENGTH * (isLong ? 0.5 : 0.38),
                                        width: isLong ? RAY_WIDTH * 1.4 : RAY_WIDTH,
                                        opacity: isLong ? 1 : 0.65,
                                    },
                                ]}
                            />
                        );
                    })}
                </Animated.View>

                {/* Ripple rings */}
                {rings.map((r, i) => (
                    <Animated.View
                        key={i}
                        style={[
                            styles.rippleRing,
                            {
                                width: RIPPLE_BASE,
                                height: RIPPLE_BASE,
                                borderRadius: RIPPLE_BASE / 2,
                                top: ICON_CY - RIPPLE_BASE / 2,
                                left: ICON_CX - RIPPLE_BASE / 2,
                                opacity: r.al,
                                transform: [{ scale: r.sc }],
                                borderWidth: i % 2 === 0 ? 1.5 : 1,
                            },
                        ]}
                    />
                ))}

                {/* Floating particles */}
                {particles.map((p, i) => {
                    const rad = (p.angle * Math.PI) / 180;
                    const px = ICON_CX + Math.cos(rad) * p.radius - p.size / 2;
                    const py = ICON_CY + Math.sin(rad) * p.radius - p.size / 2;
                    return (
                        <Animated.View
                            key={p.id}
                            style={[
                                styles.particle,
                                {
                                    width: p.size,
                                    height: p.size,
                                    borderRadius: p.size / 2,
                                    top: py,
                                    left: px,
                                    opacity: particleOpacities[i],
                                    transform: [{ scale: particleScales[i] }],
                                },
                            ]}
                        />
                    );
                })}

                {/* Logo pin icon */}
                <Animated.Image
                    source={require('../assets/logo1.png')}
                    style={[
                        styles.logoIcon,
                        {
                            width: ICON_SIZE,
                            height: ICON_SIZE,
                            top: ICON_TOP,
                            left: ICON_CX - ICON_SIZE / 2,
                            opacity: iconOpacity,
                            transform: [{ scale: iconScale }],
                        },
                    ]}
                    resizeMode="contain"
                />
            </Animated.View>
            {/* ══ end zoomGroup ══ */}

            {/* ── Tagline — slides down with bounce ── */}
            <Animated.View
                style={[
                    styles.taglineContainer,
                    {
                        opacity: taglineOpacity,
                        transform: [{ translateY: taglineY }, { scale: taglineScale }],
                    },
                ]}
            >
                {/* Decorative top accent line */}
                <View style={styles.taglineAccent} />
                <Text style={styles.taglineLabel}>INDIA'S FIRST</Text>
                <Text style={styles.taglineMain}>Meeting Venue</Text>
                <Text style={styles.taglineSub}>Booking Platform</Text>
            </Animated.View>

            {/* ── Decorative horizontal divider ── */}
            <Animated.View
                style={[
                    styles.divider,
                    {
                        opacity: dividerOpacity,
                        width: dividerWidth,
                    },
                ]}
            >
                <View style={styles.dividerDot} />
                <View style={styles.dividerLine} />
                <View style={styles.dividerDiamond} />
                <View style={styles.dividerLine} />
                <View style={styles.dividerDot} />
            </Animated.View>

            {/* ── RentalMeet wordmark ── */}
            <Animated.Image
                source={require('../assets/Name.png')}
                style={[
                    styles.brandLogo,
                    {
                        opacity: brandOpacity,
                        transform: [{ translateY: brandY }, { scale: brandScale }],
                    },
                ]}
                resizeMode="contain"
            />

            {/* ── Powered by ── */}
            <Animated.View
                style={[
                    styles.poweredByRow,
                    {
                        opacity: poweredOpacity,
                        transform: [{ translateY: poweredY }],
                    },
                ]}
            >
                <View style={styles.poweredByPill}>
                    <Text style={styles.poweredByText}>Powered by </Text>
                    <Text style={styles.poweredByBold}>Yuwaka Edutech Pvt. Ltd.</Text>
                </View>
            </Animated.View>
        </Animated.View>
    );
};

export default SplashScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFBF4',
        alignItems: 'center',
    },

    // Warm amber wash — very subtle radial feel
    warmBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFFBF4',
    },
    warmVignette: {
        position: 'absolute',
        top: height * 0.15,
        left: width * 0.1,
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: 'rgba(245,166,35,0.07)',
    },

    zoomGroup: {
        position: 'absolute',
        width,
        height,
    },

    mapImage: {
        position: 'absolute',
        tintColor: Colors.primary,
        opacity: 0.18, // more delicate — premium editorial feel
    },

    raysContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },

    ray: {
        position: 'absolute',
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },

    // Outer soft ambient glow
    glowHalo: {
        position: 'absolute',
        backgroundColor: 'rgba(245,166,35,0.12)',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 40,
        elevation: 0,
    },

    // Inner warm bright core
    glowInner: {
        position: 'absolute',
        backgroundColor: 'rgba(255,210,100,0.22)',
        shadowColor: '#FFD264',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
        elevation: 0,
    },

    rippleRing: {
        position: 'absolute',
        borderColor: Colors.primary,
        backgroundColor: Colors.transparent,
    },

    particle: {
        position: 'absolute',
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 2,
    },

    logoIcon: {
        position: 'absolute',
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },

    // ── Tagline ──
    taglineContainer: {
        position: 'absolute',
        top: height * 0.055,
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    taglineAccent: {
        width: 28,
        height: 2.5,
        backgroundColor: Colors.primary,
        borderRadius: 2,
        marginBottom: 8,
        shadowColor: Colors.primary,
        shadowOpacity: 0.5,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 0 },
    },
    taglineLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: 5.5,
        marginBottom: 5,
        textShadowColor: 'rgba(245,166,35,0.35)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    taglineMain: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.charcoal,
        letterSpacing: -0.3,
        lineHeight: 28,
    },
    taglineSub: {
        fontSize: 17,
        fontWeight: '500',
        color: Colors.charcoalMid,
        letterSpacing: 0.4,
        lineHeight: 24,
    },

    // ── Decorative divider ──
    divider: {
        position: 'absolute',
        bottom: height * 0.235,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    dividerDot: {
        width: 3.5,
        height: 3.5,
        borderRadius: 2,
        backgroundColor: Colors.primaryBorder,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.primaryBorder,
        marginHorizontal: 5,
    },
    dividerDiamond: {
        width: 6,
        height: 6,
        borderRadius: 1.5,
        backgroundColor: Colors.primary,
        transform: [{ rotate: '45deg' }],
    },

    // ── Brand wordmark ──
    brandLogo: {
        position: 'absolute',
        bottom: height * 0.118,
        width: width * 0.68,
        height: 68,
        alignSelf: 'center',
    },

    // ── Powered by ──
    poweredByRow: {
        position: 'absolute',
        bottom: height * 0.038,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    poweredByPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 5,
        backgroundColor: 'rgba(245,166,35,0.08)',
        borderRadius: 999,
        borderWidth: 0.8,
        borderColor: 'rgba(245,166,35,0.2)',
    },
    poweredByText: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        letterSpacing: 0.2,
    },
    poweredByBold: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
        letterSpacing: 0.2,
    },
});

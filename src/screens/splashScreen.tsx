import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, StatusBar } from 'react-native';

import { Colors, Typography, Spacing } from '../theme/theme'; // adjust path
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigations/RootNavigation';
import { useAuthStore } from '../store/auth-store';

const { width, height } = Dimensions.get('window');


// ─── How many sunburst rays to draw ──────────────────────────────────────────
const RAY_COUNT = 16;
const RAY_LENGTH = width * 0.3; // how far each ray extends from icon centre
const RAY_WIDTH = 1.8;

type splashProps = NativeStackScreenProps<RootStackParamList, 'splash'>
const SplashScreen = ({navigation}:splashProps) => {
    const {loadUser} = useAuthStore();
    // ─── Zoom-out: map + icon scale together ─────────────────────────────────
    const zoomScale = useRef(new Animated.Value(2.6)).current;
    const zoomOpacity = useRef(new Animated.Value(0)).current;

    // ─── Glow halo ────────────────────────────────────────────────────────────
    const glowOpacity = useRef(new Animated.Value(0)).current;
    const glowPulse = useRef(new Animated.Value(1)).current;

    // ─── Sunburst rays ────────────────────────────────────────────────────────
    const raysOpacity = useRef(new Animated.Value(0)).current;
    const raysScale = useRef(new Animated.Value(0.4)).current;

    // ─── Ripple rings ─────────────────────────────────────────────────────────
    const r1Scale = useRef(new Animated.Value(0.15)).current;
    const r1Alpha = useRef(new Animated.Value(0)).current;
    const r2Scale = useRef(new Animated.Value(0.15)).current;
    const r2Alpha = useRef(new Animated.Value(0)).current;
    const r3Scale = useRef(new Animated.Value(0.15)).current;
    const r3Alpha = useRef(new Animated.Value(0)).current;

    // ─── Tagline ──────────────────────────────────────────────────────────────
    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const taglineY = useRef(new Animated.Value(-26)).current;

    // ─── Brand wordmark ───────────────────────────────────────────────────────
    const brandOpacity = useRef(new Animated.Value(0)).current;
    const brandY = useRef(new Animated.Value(30)).current;

    // ─── Powered by ───────────────────────────────────────────────────────────
    const poweredOpacity = useRef(new Animated.Value(0)).current;

    const rippleLoop = useRef<Animated.CompositeAnimation | null>(null);
    const glowLoop = useRef<Animated.CompositeAnimation | null>(null);

    const handleNavigation = async () => {
        await loadUser();

        const { user, isAuthenticated, token } = useAuthStore.getState();

        console.log(`User:${user} \n Authenticated: ${isAuthenticated} \n token: ${token}`);
        if (isAuthenticated) {
            navigation.replace(user?.role === 'owner' ? 'owner' : 'client');
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
                    Animated.timing(sc, { toValue: 3.2, duration: 1500, useNativeDriver: true }),
                    Animated.sequence([
                        Animated.timing(al, { toValue: 0.8, duration: 200, useNativeDriver: true }),
                        Animated.timing(al, { toValue: 0, duration: 1300, useNativeDriver: true }),
                    ]),
                ]),
                Animated.parallel([
                    Animated.timing(sc, { toValue: 0.15, duration: 0, useNativeDriver: true }),
                    Animated.timing(al, { toValue: 0, duration: 0, useNativeDriver: true }),
                ]),
            ]),
        );

    // ─── Main sequence ────────────────────────────────────────────────────────
    useEffect(() => {
        StatusBar.setHidden(true);

        // Instant screen fade-in
        Animated.timing(zoomOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();

        // PHASE 1 — zoom out (0 → 900ms)
        Animated.timing(zoomScale, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
        }).start();

        // PHASE 1b — glow blooms in during zoom
        setTimeout(() => {
            Animated.timing(glowOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }).start(() => {
                glowLoop.current = Animated.loop(
                    Animated.sequence([
                        Animated.timing(glowPulse, {
                            toValue: 1.18,
                            duration: 1000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(glowPulse, {
                            toValue: 1,
                            duration: 1000,
                            useNativeDriver: true,
                        }),
                    ]),
                );
                glowLoop.current.start();
            });
        }, 250);

        // PHASE 2 — sunburst rays flash in (700ms)
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(raysOpacity, {
                    toValue: 0.5,
                    duration: 350,
                    useNativeDriver: true,
                }),
                Animated.spring(raysScale, {
                    toValue: 1,
                    tension: 26,
                    friction: 6,
                    useNativeDriver: true,
                }),
            ]).start();
        }, 700);

        // PHASE 3 — ripples start (900ms)
        setTimeout(() => {
            rippleLoop.current = Animated.parallel([
                makeRipple(r1Scale, r1Alpha, 0),
                makeRipple(r2Scale, r2Alpha, 480),
                makeRipple(r3Scale, r3Alpha, 960),
            ]);
            rippleLoop.current.start();
        }, 900);

        // PHASE 4 — tagline slides in (1100ms)
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(taglineOpacity, {
                    toValue: 1,
                    duration: 450,
                    useNativeDriver: true,
                }),
                Animated.timing(taglineY, { toValue: 0, duration: 450, useNativeDriver: true }),
            ]).start();
        }, 1100);

        // PHASE 5 — brand wordmark rises (1500ms)
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(brandOpacity, { toValue: 1, duration: 480, useNativeDriver: true }),
                Animated.timing(brandY, { toValue: 0, duration: 480, useNativeDriver: true }),
            ]).start();
        }, 1500);

        // PHASE 6 — powered by fades in (1900ms)
        setTimeout(() => {
            Animated.timing(poweredOpacity, {
                toValue: 1,
                duration: 380,
                useNativeDriver: true,
            }).start();
        }, 1900);

        // FINISH
        const fin = setTimeout(() => {
            rippleLoop.current?.stop();
            glowLoop.current?.stop();
            StatusBar.setHidden(false);
            handleNavigation();
        }, 3600);

        return () => {
            clearTimeout(fin);
            rippleLoop.current?.stop();
            glowLoop.current?.stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Derived layout sizes ─────────────────────────────────────────────────
    const MAP_W = width * 0.82;
    const MAP_H = height * 0.42;
    const ICON_SIZE = width * 0.28;
    const GLOW_SIZE = width * 0.5;
    const RIPPLE_BASE = width * 0.3;

    const MAP_TOP = height * 0.235;
    // Icon sits at India's geographic centroid — ~55% down the map height
    const ICON_TOP = MAP_TOP + MAP_H * 0.46;
    const ICON_CX = width / 2; // horizontal centre of screen
    const ICON_CY = ICON_TOP + ICON_SIZE / 2; // vertical centre of icon

    return (
        <Animated.View style={[styles.container, { opacity: zoomOpacity }]}>
            {/* ══════════════════════════════════════════════════════════════
          ZOOM GROUP — map + glow + rays + rings + icon all scale
          from the same centre point simultaneously (Video 3 effect).
          ══════════════════════════════════════════════════════════════ */}
            <Animated.View style={[styles.zoomGroup, { transform: [{ scale: zoomScale }] }]}>
                {/* India map outline */}
                <Animated.Image
                    source={require('../assets/Map.png')}
                    style={[
                        styles.mapImage,
                        {
                            width: MAP_W,
                            height: MAP_H,
                            top: MAP_TOP,
                            left: (width - MAP_W) / 2,
                        },
                    ]}
                    resizeMode="contain"
                />

                {/* ── Sunburst rays — 16 thin lines rotated around icon centre ── */}
                <Animated.View
                    style={[
                        styles.raysContainer,
                        {
                            top: ICON_CY - RAY_LENGTH,
                            left: ICON_CX - RAY_LENGTH,
                            width: RAY_LENGTH * 2,
                            height: RAY_LENGTH * 2,
                            opacity: raysOpacity,
                            transform: [{ scale: raysScale }],
                        },
                    ]}
                >
                    {Array.from({ length: RAY_COUNT }).map((_, i) => {
                        const angle = (360 / RAY_COUNT) * i;
                        return (
                            <View
                                key={i}
                                style={[
                                    styles.ray,
                                    {
                                        // Each ray is a thin rectangle starting from the centre.
                                        // We rotate it around the container's centre point.
                                        transform: [
                                            { rotate: `${angle}deg` },
                                            // Shift up so the ray starts just outside the icon radius
                                            { translateY: -(RAY_LENGTH * 0.52) },
                                        ],
                                        height: RAY_LENGTH * 0.46, // length of visible ray segment
                                        width: RAY_WIDTH,
                                    },
                                ]}
                            />
                        );
                    })}
                </Animated.View>

                {/* Warm amber glow halo behind icon */}
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

                {/* Ripple rings */}
                {(
                    [
                        { sc: r1Scale, al: r1Alpha },
                        { sc: r2Scale, al: r2Alpha },
                        { sc: r3Scale, al: r3Alpha },
                    ] as const
                ).map((r, i) => (
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
                            },
                        ]}
                    />
                ))}

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
                        },
                    ]}
                    resizeMode="contain"
                />
            </Animated.View>
            {/* ══ end zoomGroup ══ */}

            {/* ── Tagline — slides down from top ── */}
            <Animated.View
                style={[
                    styles.taglineContainer,
                    {
                        opacity: taglineOpacity,
                        transform: [{ translateY: taglineY }],
                    },
                ]}
            >
                <Text style={styles.taglineText}>
                    {"India's 1st Meeting Venue\nBooking Platform"}
                </Text>
            </Animated.View>

            {/* ── RentalMeet wordmark — rises from bottom ── */}
            <Animated.Image
                source={require('../assets/Name.png')}
                style={[
                    styles.brandLogo,
                    {
                        opacity: brandOpacity,
                        transform: [{ translateY: brandY }],
                    },
                ]}
                resizeMode="contain"
            />

            {/* ── Powered by ── */}
            <Animated.View style={[styles.poweredByRow, { opacity: poweredOpacity }]}>
                <Text style={styles.poweredByText}>{'Powered by: '}</Text>
                <Text style={styles.poweredByBold}>Yuwaka Edutech Pvt. Ltd.</Text>
            </Animated.View>
        </Animated.View>
    );
};

export default SplashScreen;

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface, // pure white — matches reference videos
        alignItems: 'center',
    },

    zoomGroup: {
        position: 'absolute',
        width,
        height,
    },

    mapImage: {
        position: 'absolute',
        tintColor: Colors.primary, // '#F5A623' — orange map outline
    },

    // Container for all 16 rays; positioned/centred on icon centre
    raysContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Individual ray — thin vertical rectangle, rotated per-instance
    ray: {
        position: 'absolute',
        backgroundColor: Colors.primary, // '#F5A623'
        borderRadius: 2,
        // Transform origin is the centre of the container (default RN behaviour),
        // so rotation + translateY places each ray correctly around the icon.
    },

    glowHalo: {
        position: 'absolute',
        backgroundColor: Colors.primaryGlow, // 'rgba(245,166,35,0.30)'
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 0,
    },

    rippleRing: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: Colors.primary,
        backgroundColor: Colors.transparent,
    },

    logoIcon: {
        position: 'absolute',
    },

    // ── Tagline ──
    taglineContainer: {
        position: 'absolute',
        top: height * 0.065,
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    taglineText: {
        fontSize: Typography.lg + 2, // ~19px — matches reference
        fontWeight: Typography.semiBold,
        color: Colors.charcoal, // '#2C2C2C'
        textAlign: 'center',
        lineHeight: 28,
        letterSpacing: Typography.normal,
    },

    // ── Brand wordmark ──
    brandLogo: {
        position: 'absolute',
        bottom: height * 0.13,
        width: width * 0.72,
        height: 72,
        alignSelf: 'center',
    },

    // ── Powered by ──
    poweredByRow: {
        position: 'absolute',
        bottom: height * 0.048,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    poweredByText: {
        fontSize: Typography.sm + 1,
        color: Colors.charcoalLight, // '#8A8A8A'
        letterSpacing: Typography.normal,
    },
    poweredByBold: {
        fontSize: Typography.sm + 1,
        fontWeight: Typography.bold,
        color: Colors.charcoal, // '#2C2C2C'
        letterSpacing: Typography.normal,
    },
});

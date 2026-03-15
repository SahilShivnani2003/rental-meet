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

// ─── Brand Tokens ─────────────────────────────────────────────────────────────
const WHITE = '#FFFFFF';
const ORANGE = '#F29200';
const ORANGE_MED = 'rgba(242,146,0,0.22)';
const ORANGE_LIGHT = 'rgba(242,146,0,0.10)';
const CHARCOAL = '#2E2E2E';
const GREY = '#888888';
const GREY_MED = 'rgba(120,120,120,0.18)';
const GREY_BORDER = 'rgba(120,120,120,0.25)';

type SplashProps = NativeStackScreenProps<RootStackParamList, 'splash'>;

export default function SplashScreen({ navigation }: SplashProps) {
    const loadUser = useAuthStore(s => s.loadUser);

    // ── Animated values ───────────────────────────────────────────────────────
    const shape1Opacity = useRef(new Animated.Value(0)).current;
    const shape1Scale = useRef(new Animated.Value(0.6)).current;
    const shape2Opacity = useRef(new Animated.Value(0)).current;
    const shape2Scale = useRef(new Animated.Value(0.6)).current;
    const shape3Opacity = useRef(new Animated.Value(0)).current;
    const shape4Opacity = useRef(new Animated.Value(0)).current;
    const shape4Scale = useRef(new Animated.Value(0.5)).current;
    const gridOpacity = useRef(new Animated.Value(0)).current;

    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.55)).current;
    const logoY = useRef(new Animated.Value(0)).current;
    const ringScale1 = useRef(new Animated.Value(0.4)).current;
    const ringOpacity1 = useRef(new Animated.Value(0)).current;
    const ringScale2 = useRef(new Animated.Value(0.4)).current;
    const ringOpacity2 = useRef(new Animated.Value(0)).current;

    const rentalOpacity = useRef(new Animated.Value(0)).current;
    const rentalX = useRef(new Animated.Value(-24)).current;
    const meetOpacity = useRef(new Animated.Value(0)).current;
    const meetX = useRef(new Animated.Value(24)).current;

    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const taglineY = useRef(new Animated.Value(10)).current;
    const dividerScale = useRef(new Animated.Value(0)).current;
    const badgeOpacity = useRef(new Animated.Value(0)).current;
    const badgeScale = useRef(new Animated.Value(0.7)).current;
    const sloganOpacity = useRef(new Animated.Value(0)).current;
    const sloganY = useRef(new Animated.Value(12)).current;

    const dotsOpacity = useRef(new Animated.Value(0)).current;
    const dotPulse = useRef(new Animated.Value(1)).current;
    const footerOpacity = useRef(new Animated.Value(0)).current;
    const progressWidth = useRef(new Animated.Value(0)).current;

    const screenOpacity = useRef(new Animated.Value(1)).current;

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
        StatusBar.setBarStyle('dark-content');
        StatusBar.setHidden(false);

        // ── Continuous loops ──────────────────────────────────────────────────
        Animated.loop(
            Animated.sequence([
                Animated.timing(logoY, {
                    toValue: -7,
                    duration: 2400,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(logoY, {
                    toValue: 0,
                    duration: 2400,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(dotPulse, { toValue: 1.6, duration: 550, useNativeDriver: true }),
                Animated.timing(dotPulse, { toValue: 1.0, duration: 550, useNativeDriver: true }),
            ]),
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(progressWidth, {
                    toValue: W * 0.55,
                    duration: 1800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(progressWidth, { toValue: 0, duration: 0, useNativeDriver: false }),
            ]),
        ).start();

        // ── Main entrance sequence ─────────────────────────────────────────────
        Animated.sequence([
            // 1 — Background shapes bloom in
            Animated.parallel([
                Animated.timing(gridOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
                Animated.timing(shape1Opacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.spring(shape1Scale, {
                    toValue: 1,
                    speed: 6,
                    bounciness: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(shape2Opacity, {
                    toValue: 1,
                    duration: 550,
                    useNativeDriver: true,
                }),
                Animated.spring(shape2Scale, {
                    toValue: 1,
                    speed: 5,
                    bounciness: 6,
                    useNativeDriver: true,
                }),
                Animated.timing(shape3Opacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(shape4Opacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.spring(shape4Scale, {
                    toValue: 1,
                    speed: 6,
                    bounciness: 8,
                    useNativeDriver: true,
                }),
            ]),

            // 2 — Rings ripple out
            Animated.stagger(100, [
                Animated.parallel([
                    Animated.timing(ringOpacity1, {
                        toValue: 1,
                        duration: 350,
                        useNativeDriver: true,
                    }),
                    Animated.spring(ringScale1, {
                        toValue: 1,
                        speed: 7,
                        bounciness: 10,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(ringOpacity2, {
                        toValue: 1,
                        duration: 350,
                        useNativeDriver: true,
                    }),
                    Animated.spring(ringScale2, {
                        toValue: 1,
                        speed: 6,
                        bounciness: 8,
                        useNativeDriver: true,
                    }),
                ]),
            ]),

            // 3 — Logo bursts in
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    speed: 11,
                    bounciness: 20,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
            ]),

            // 4 — Brand name splits in from sides
            Animated.parallel([
                Animated.timing(rentalOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(rentalX, {
                    toValue: 0,
                    speed: 18,
                    bounciness: 10,
                    useNativeDriver: true,
                }),
                Animated.timing(meetOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(meetX, {
                    toValue: 0,
                    speed: 18,
                    bounciness: 10,
                    useNativeDriver: true,
                }),
            ]),

            // 5 — Original tagline
            Animated.parallel([
                Animated.timing(taglineOpacity, {
                    toValue: 1,
                    duration: 280,
                    useNativeDriver: true,
                }),
                Animated.spring(taglineY, {
                    toValue: 0,
                    speed: 16,
                    bounciness: 6,
                    useNativeDriver: true,
                }),
            ]),

            // 6 — Divider + slogan
            Animated.parallel([
                Animated.spring(dividerScale, {
                    toValue: 1,
                    speed: 20,
                    bounciness: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(sloganOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(sloganY, {
                    toValue: 0,
                    speed: 16,
                    bounciness: 6,
                    useNativeDriver: true,
                }),
            ]),

            // 7 — Badge pops
            Animated.parallel([
                Animated.spring(badgeScale, {
                    toValue: 1,
                    speed: 20,
                    bounciness: 22,
                    useNativeDriver: true,
                }),
                Animated.timing(badgeOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            ]),

            // 8 — Dots + footer
            Animated.parallel([
                Animated.timing(dotsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(footerOpacity, {
                    toValue: 1,
                    duration: 350,
                    useNativeDriver: true,
                }),
            ]),

            // 9 — Hold
            Animated.delay(1000),

            // 10 — Fade out
            Animated.timing(screenOpacity, { toValue: 0, duration: 480, useNativeDriver: true }),
        ]).start(handleNavigation);
    }, []);

    return (
        <Animated.View style={[s.container, { opacity: screenOpacity }]}>
            <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

            {/* ── Subtle dot grid ── */}
            <Animated.View style={[s.dotGrid, { opacity: gridOpacity }]}>
                {Array.from({ length: 10 }).map((_, r) =>
                    Array.from({ length: 7 }).map((__, c) => (
                        <View
                            key={`${r}-${c}`}
                            style={[s.gridDot, { top: r * (H / 10), left: c * (W / 7) }]}
                        />
                    )),
                )}
            </Animated.View>

            {/* ── Abstract shapes ── */}

            {/* Top-left large orange arc */}
            <Animated.View
                style={[
                    s.arcOrangeTL,
                    { opacity: shape1Opacity, transform: [{ scale: shape1Scale }] },
                ]}
            />

            {/* Top-left inner grey ring */}
            <Animated.View
                style={[
                    s.arcGreyTL,
                    { opacity: shape2Opacity, transform: [{ scale: shape2Scale }] },
                ]}
            />

            {/* Bottom-right large grey blob */}
            <Animated.View style={[s.blobGreyBR, { opacity: shape3Opacity }]} />

            {/* Bottom-right orange accent blob */}
            <Animated.View
                style={[
                    s.blobOrangeBR,
                    { opacity: shape4Opacity, transform: [{ scale: shape4Scale }] },
                ]}
            />

            {/* Top-right dot cluster */}
            <Animated.View style={[s.dotClusterTR, { opacity: shape3Opacity }]}>
                {[0, 1, 2, 3, 4, 5].map(i => (
                    <View
                        key={i}
                        style={[
                            s.clusterDot,
                            i % 2 === 0 ? s.clusterOrange : s.clusterGrey,
                            { top: (i % 3) * 16, left: Math.floor(i / 3) * 16 },
                        ]}
                    />
                ))}
            </Animated.View>

            {/* Bottom-left diagonal lines */}
            <Animated.View style={[s.diagonalBL, { opacity: shape2Opacity }]}>
                {[0, 1, 2, 3].map(i => (
                    <View key={i} style={s.diagLine} />
                ))}
            </Animated.View>

            {/* ── CENTER ── */}
            <View style={s.center}>
                {/* Logo with ripple rings */}
                <View style={s.logoArea}>
                    <Animated.View
                        style={[
                            s.ring,
                            s.ring2,
                            {
                                opacity: ringOpacity2,
                                transform: [{ scale: ringScale2 }],
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            s.ring,
                            s.ring1,
                            {
                                opacity: ringOpacity1,
                                transform: [{ scale: ringScale1 }],
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            s.logoWrap,
                            {
                                opacity: logoOpacity,
                                transform: [{ scale: logoScale }, { translateY: logoY }],
                            },
                        ]}
                    >
                        <Image
                            source={require('../assets/logo1.png')}
                            style={s.logoImg}
                            resizeMode="contain"
                        />
                    </Animated.View>
                </View>

                {/* Full logo wordmark image — RentalMeet + tagline */}
                <Animated.View
                    style={[
                        s.wordmarkWrap,
                        {
                            opacity: rentalOpacity,
                            transform: [{ translateY: taglineY }],
                        },
                    ]}
                >
                    <Image
                        source={require('../assets/NameLogo.png')}
                        style={s.wordmarkImg}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* Divider */}
                <Animated.View style={[s.dividerRow, { transform: [{ scaleX: dividerScale }] }]}>
                    <View style={s.divLine} />
                    <View style={s.divDot} />
                    <View style={s.divLine} />
                </Animated.View>

                {/* India slogan */}
                <Animated.Text
                    style={[
                        s.slogan,
                        {
                            opacity: sloganOpacity,
                            transform: [{ translateY: sloganY }],
                        },
                    ]}
                >
                    India's 1st Meeting Venue Booking Platform
                </Animated.Text>

                {/* Badge */}
                <Animated.View
                    style={[
                        s.badge,
                        {
                            opacity: badgeOpacity,
                            transform: [{ scale: badgeScale }],
                        },
                    ]}
                >
                    <View style={s.badgeDot} />
                    <Text style={s.badgeText}>#1 IN INDIA</Text>
                </Animated.View>
            </View>

            {/* ── Loading dots ── */}
            <Animated.View style={[s.dotsRow, { opacity: dotsOpacity }]}>
                <View style={s.dot} />
                <Animated.View style={[s.dot, s.dotCenter, { transform: [{ scale: dotPulse }] }]} />
                <View style={s.dot} />
            </Animated.View>

            {/* ── Footer ── */}
            <Animated.View style={[s.footerWrap, { opacity: footerOpacity }]}>
                <View style={s.progressTrack}>
                    <Animated.View style={[s.progressFill, { width: progressWidth }]} />
                </View>
                <Text style={s.footerTag}>BOOK · MEET · SUCCEED</Text>
                <Text style={s.version}>v1.0.0</Text>
            </Animated.View>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },

    // ── Grid ──
    dotGrid: { ...StyleSheet.absoluteFillObject },
    gridDot: {
        position: 'absolute',
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: 'rgba(180,180,180,0.18)',
    },

    // ── Abstract shapes ──
    arcOrangeTL: {
        position: 'absolute',
        top: -W * 0.32,
        left: -W * 0.32,
        width: W * 0.72,
        height: W * 0.72,
        borderRadius: W * 0.36,
        backgroundColor: ORANGE_MED,
    },
    arcGreyTL: {
        position: 'absolute',
        top: -W * 0.2,
        left: -W * 0.2,
        width: W * 0.52,
        height: W * 0.52,
        borderRadius: W * 0.26,
        borderWidth: 1.5,
        borderColor: GREY_BORDER,
        backgroundColor: 'transparent',
    },
    blobGreyBR: {
        position: 'absolute',
        bottom: -W * 0.28,
        right: -W * 0.28,
        width: W * 0.7,
        height: W * 0.7,
        borderRadius: W * 0.35,
        backgroundColor: GREY_MED,
    },
    blobOrangeBR: {
        position: 'absolute',
        bottom: -W * 0.12,
        right: -W * 0.12,
        width: W * 0.38,
        height: W * 0.38,
        borderRadius: W * 0.19,
        backgroundColor: ORANGE_LIGHT,
    },
    dotClusterTR: {
        position: 'absolute',
        top: H * 0.1,
        right: 28,
        width: 48,
        height: 48,
    },
    clusterDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },
    clusterOrange: { backgroundColor: 'rgba(242,146,0,0.45)' },
    clusterGrey: { backgroundColor: 'rgba(120,120,120,0.25)' },
    diagonalBL: {
        position: 'absolute',
        bottom: H * 0.14,
        left: 20,
        gap: 8,
        transform: [{ rotate: '-30deg' }],
    },
    diagLine: {
        width: 32,
        height: 1.5,
        backgroundColor: 'rgba(120,120,120,0.2)',
        borderRadius: 1,
        marginBottom: 8,
    },

    // ── Center ──
    center: { alignItems: 'center', gap: 8 },

    logoArea: {
        width: 160,
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    ring: {
        position: 'absolute',
        borderRadius: 9999,
        borderWidth: 1,
    },
    ring1: { width: 140, height: 140, borderColor: 'rgba(242,146,0,0.22)' },
    ring2: { width: 172, height: 172, borderColor: 'rgba(242,146,0,0.10)' },

    logoWrap: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
    logoImg: { width: 110, height: 110 },

    // ── Wordmark image (full logo: icon + RentalMeet + tagline) ──
    wordmarkWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    wordmarkImg: {
        width: W * 0.72,
        height: 80,
    },

    // ── Divider ──
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 },
    divLine: { width: 40, height: 1.5, backgroundColor: 'rgba(120,120,120,0.3)', borderRadius: 1 },
    divDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ORANGE },

    // ── Slogan ──
    slogan: {
        fontSize: 12,
        fontFamily: 'Exo2-Medium',
        color: GREY,
        textAlign: 'center',
        letterSpacing: 0.4,
        paddingHorizontal: 28,
        lineHeight: 18,
    },

    // ── Badge ──
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        marginTop: 6,
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 100,
        backgroundColor: CHARCOAL,
    },
    badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ORANGE },
    badgeText: { fontSize: 10.5, fontFamily: 'Exo2-Bold', color: ORANGE, letterSpacing: 2.8 },

    // ── Dots ──
    dotsRow: {
        position: 'absolute',
        bottom: H * 0.13,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(120,120,120,0.3)' },
    dotCenter: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: ORANGE,
        shadowColor: ORANGE,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 4,
    },

    // ── Footer ──
    footerWrap: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingBottom: 28,
        gap: 6,
    },
    progressTrack: {
        width: W * 0.55,
        height: 2,
        backgroundColor: 'rgba(180,180,180,0.3)',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        backgroundColor: ORANGE,
        borderRadius: 2,
    },
    footerTag: {
        fontSize: 9.5,
        fontFamily: 'Exo2-SemiBold',
        color: 'rgba(120,120,120,0.5)',
        letterSpacing: 3.5,
        textTransform: 'uppercase',
    },
    version: {
        fontSize: 10,
        fontFamily: 'Exo2-Regular',
        color: 'rgba(180,180,180,0.6)',
        letterSpacing: 0.8,
    },
});

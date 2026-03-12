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

// ─── Tokens ──────────────────────────────────────────────────────────────────
const BG = '#0F0F0F';
const ORANGE = '#F29200';
const ORANGE_DIM = 'rgba(242,146,0,0.18)';
const ORANGE_MID = 'rgba(242,146,0,0.35)';
const WHITE = '#FFFFFF';
const WHITE_DIM = 'rgba(255,255,255,0.08)';

type SplashProps = NativeStackScreenProps<RootStackParamList, 'splash'>;

export default function SplashScreen({ navigation }: SplashProps) {
    const loadUser = useAuthStore(s => s.loadUser);

    // ── Animated values ───────────────────────────────────────────────────────
    const arc1Scale = useRef(new Animated.Value(0.3)).current;
    const arc1Opacity = useRef(new Animated.Value(0)).current;
    const arc2Scale = useRef(new Animated.Value(0.3)).current;
    const arc2Opacity = useRef(new Animated.Value(0)).current;
    const arc3Scale = useRef(new Animated.Value(0.3)).current;
    const arc3Opacity = useRef(new Animated.Value(0)).current;
    const orbitRotate = useRef(new Animated.Value(0)).current;
    const orbit2Rotate = useRef(new Animated.Value(0)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.5)).current;
    const logoFloat = useRef(new Animated.Value(0)).current;
    const rentalOpacity = useRef(new Animated.Value(0)).current;
    const rentalX = useRef(new Animated.Value(-20)).current;
    const meetOpacity = useRef(new Animated.Value(0)).current;
    const meetX = useRef(new Animated.Value(20)).current;
    const lineScale = useRef(new Animated.Value(0)).current;
    const sloganOpacity = useRef(new Animated.Value(0)).current;
    const sloganY = useRef(new Animated.Value(12)).current;
    const badgeOpacity = useRef(new Animated.Value(0)).current;
    const badgeScale = useRef(new Animated.Value(0.7)).current;
    const dotsOpacity = useRef(new Animated.Value(0)).current;
    const activeDotWidth = useRef(new Animated.Value(6)).current;
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
        // StatusBar.setHidden(true);

        // ── Continuous loops ─────────────────────────────────────────────────
        Animated.loop(
            Animated.timing(orbitRotate, {
                toValue: 1,
                duration: 6000,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        ).start();

        Animated.loop(
            Animated.timing(orbit2Rotate, {
                toValue: 1,
                duration: 9000,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(logoFloat, {
                    toValue: -8,
                    duration: 2200,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(logoFloat, {
                    toValue: 0,
                    duration: 2200,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(activeDotWidth, {
                    toValue: 20,
                    duration: 600,
                    useNativeDriver: false,
                }),
                Animated.timing(activeDotWidth, {
                    toValue: 6,
                    duration: 600,
                    useNativeDriver: false,
                }),
            ]),
        ).start();

        // ── Main sequence ────────────────────────────────────────────────────
        Animated.sequence([
            // 2 — Arcs ripple out
            Animated.stagger(120, [
                Animated.parallel([
                    Animated.timing(arc1Opacity, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.spring(arc1Scale, {
                        toValue: 1,
                        speed: 8,
                        bounciness: 10,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(arc2Opacity, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.spring(arc2Scale, {
                        toValue: 1,
                        speed: 8,
                        bounciness: 8,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(arc3Opacity, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.spring(arc3Scale, {
                        toValue: 1,
                        speed: 8,
                        bounciness: 6,
                        useNativeDriver: true,
                    }),
                ]),
            ]),

            // 3 — Logo pops in
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    speed: 10,
                    bounciness: 18,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
            ]),

            // 4 — "Rental" slides from left, "MEET" from right
            Animated.parallel([
                Animated.timing(rentalOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(rentalX, {
                    toValue: 0,
                    speed: 16,
                    bounciness: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(meetOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(meetX, {
                    toValue: 0,
                    speed: 16,
                    bounciness: 8,
                    useNativeDriver: true,
                }),
            ]),

            // 5 — Divider line grows
            Animated.spring(lineScale, {
                toValue: 1,
                speed: 18,
                bounciness: 6,
                useNativeDriver: true,
            }),

            // 6 — Slogan rises
            Animated.parallel([
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
                    speed: 18,
                    bounciness: 20,
                    useNativeDriver: true,
                }),
                Animated.timing(badgeOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            ]),

            // 8 — Dots appear
            Animated.timing(dotsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),

            // 9 — Hold
            Animated.delay(1200),

            // 10 — Fade out
            Animated.timing(screenOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start(handleNavigation);
    }, []);

    const orbitSpin = orbitRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });
    const orbit2Spin = orbit2Rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['360deg', '0deg'],
    });

    return (
        <Animated.View style={[s.container, { opacity: screenOpacity }]}>
            {/* <StatusBar hidden /> */}

            {/* ── Decorative arcs ── */}
            <Animated.View
                style={[s.arc, s.arc1, { opacity: arc1Opacity, transform: [{ scale: arc1Scale }] }]}
            />
            <Animated.View
                style={[s.arc, s.arc2, { opacity: arc2Opacity, transform: [{ scale: arc2Scale }] }]}
            />
            <Animated.View
                style={[s.arc, s.arc3, { opacity: arc3Opacity, transform: [{ scale: arc3Scale }] }]}
            />

            {/* ── Vertical side tag ── */}
            <Animated.Text style={[s.sideTag, { opacity: sloganOpacity }]}>
                RENTAL MEET · v1.0.0
            </Animated.Text>

            {/* ── Center ── */}
            <View style={s.center}>
                {/* Logo with orbits */}
                <Animated.View
                    style={[
                        s.logoWrap,
                        {
                            opacity: logoOpacity,
                            transform: [{ scale: logoScale }, { translateY: logoFloat }],
                        },
                    ]}
                >
                    {/* Outer orbit ring */}
                    <Animated.View
                        style={[s.orbit, s.orbit1, { transform: [{ rotate: orbitSpin }] }]}
                    >
                        <View style={s.orbitDot} />
                    </Animated.View>
                    {/* Inner orbit ring (reverse) */}
                    <Animated.View
                        style={[s.orbit, s.orbit2, { transform: [{ rotate: orbit2Spin }] }]}
                    >
                        <View style={[s.orbitDot, s.orbitDotSmall]} />
                    </Animated.View>
                    {/* Logo box */}
                    <View style={s.logoBox}>
                        <Image
                            source={require('../assets/icon.webp')}
                            style={s.logoImg}
                            resizeMode="cover"
                        />
                    </View>
                </Animated.View>

                {/* Brand name */}
                <View style={s.brandRow}>
                    <Animated.Text
                        style={[
                            s.rental,
                            {
                                opacity: rentalOpacity,
                                transform: [{ translateX: rentalX }],
                            },
                        ]}
                    >
                        Rental
                    </Animated.Text>
                    <Animated.Text
                        style={[
                            s.meet,
                            {
                                opacity: meetOpacity,
                                transform: [{ translateX: meetX }],
                            },
                        ]}
                    >
                        MEET
                    </Animated.Text>
                </View>

                {/* Divider */}
                <Animated.View style={[s.dividerRow, { transform: [{ scaleX: lineScale }] }]}>
                    <View style={s.divLine} />
                    <View style={s.divDot} />
                    <View style={s.divLine} />
                </Animated.View>

                {/* Slogan */}
                <Animated.Text
                    style={[
                        s.slogan,
                        {
                            opacity: sloganOpacity,
                            transform: [{ translateY: sloganY }],
                        },
                    ]}
                >
                    India's 1st Meeting Venue{'\n'}Booking Platform
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
                    <Text style={s.badgeText}>#1 IN INDIA</Text>
                </Animated.View>
            </View>

            {/* ── Loading dots ── */}
            <Animated.View style={[s.dotsRow, { opacity: dotsOpacity }]}>
                <View style={s.dot} />
                <Animated.View style={[s.dot, s.dotActive, { width: activeDotWidth }]} />
                <View style={s.dot} />
            </Animated.View>

            {/* ── Bottom tagline ── */}
            <Animated.Text style={[s.tagline, { opacity: dotsOpacity }]}>
                BOOK · MEET · SUCCEED
            </Animated.Text>
        </Animated.View>
    );
}

const ARC_BASE = W * 0.55;

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },

    // Grid (removed — arc rings handle the background decoration)

    // Arcs
    arc: {
        position: 'absolute',
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: ORANGE_MID,
    },
    arc1: {
        width: ARC_BASE,
        height: ARC_BASE,
        borderColor: 'rgba(242,146,0,0.25)',
    },
    arc2: {
        width: ARC_BASE * 1.42,
        height: ARC_BASE * 1.42,
        borderColor: 'rgba(242,146,0,0.15)',
    },
    arc3: {
        width: ARC_BASE * 1.85,
        height: ARC_BASE * 1.85,
        borderColor: 'rgba(242,146,0,0.08)',
    },

    // Side tag
    sideTag: {
        position: 'absolute',
        right: 18,
        top: H * 0.18,
        fontSize: 8,
        color: 'rgba(242,146,0,0.4)',
        letterSpacing: 2,
        fontWeight: '600',
        transform: [{ rotate: '90deg' }],
    },

    // Center
    center: {
        alignItems: 'center',
        gap: 10,
    },

    // Logo
    logoWrap: {
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    orbit: {
        position: 'absolute',
        borderRadius: 9999,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    orbit1: {
        width: 150,
        height: 150,
        borderColor: 'rgba(242,146,0,0.35)',
        borderStyle: 'dashed',
    },
    orbit2: {
        width: 120,
        height: 120,
        borderColor: 'rgba(242,146,0,0.2)',
    },
    orbitDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: ORANGE,
        marginTop: -4.5,
        shadowColor: ORANGE,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 8,
    },
    orbitDotSmall: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(242,146,0,0.5)',
        marginTop: -3,
    },
    logoBox: {
        width: 96,
        height: 96,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: ORANGE_MID,
        shadowColor: ORANGE,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 16,
    },
    logoImg: {
        width: '100%',
        height: '100%',
    },

    // Brand
    brandRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 0,
    },
    rental: {
        fontSize: 34,
        fontWeight: '300',
        color: 'rgba(242,146,0,0.75)',
        letterSpacing: 2,
    },
    meet: {
        fontSize: 48,
        fontWeight: '900',
        color: WHITE,
        letterSpacing: 4,
        textShadowColor: ORANGE_MID,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },

    // Divider
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginVertical: 2,
    },
    divLine: {
        width: 44,
        height: 1,
        backgroundColor: ORANGE_MID,
        borderRadius: 1,
    },
    divDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: ORANGE,
    },

    // Slogan
    slogan: {
        fontSize: 12,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        lineHeight: 20,
    },

    // Badge
    badge: {
        marginTop: 6,
        paddingHorizontal: 18,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: 'rgba(242,146,0,0.4)',
        borderRadius: 4,
        backgroundColor: 'rgba(242,146,0,0.08)',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: ORANGE,
        letterSpacing: 3,
    },

    // Dots
    dotsRow: {
        position: 'absolute',
        bottom: H * 0.12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(242,146,0,0.25)',
    },
    dotActive: {
        backgroundColor: ORANGE,
        borderRadius: 3,
        shadowColor: ORANGE,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 6,
    },

    // Tagline
    tagline: {
        position: 'absolute',
        bottom: H * 0.065,
        fontSize: 9,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.2)',
        letterSpacing: 4,
    },
});

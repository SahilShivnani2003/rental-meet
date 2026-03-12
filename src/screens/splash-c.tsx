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
const BG          = '#FAFAFA';
const ORANGE      = '#F29200';
const ORANGE_SOFT = 'rgba(242,146,0,0.12)';
const ORANGE_GLOW = 'rgba(242,146,0,0.28)';
const BLACK       = '#111111';
const GREY        = '#666666';
const GREY_LIGHT  = '#CCCCCC';

type SplashProps = NativeStackScreenProps<RootStackParamList, 'splash'>;

export default function SplashScreen({ navigation }: SplashProps) {
    const loadUser = useAuthStore(s => s.loadUser);

    // ── Animation refs ────────────────────────────────────────────────────────
    const topBarWidth      = useRef(new Animated.Value(0)).current;
    const cornerScale      = useRef(new Animated.Value(0)).current;
    const cornerOpacity    = useRef(new Animated.Value(0)).current;
    const bgNumOpacity     = useRef(new Animated.Value(0)).current;
    const bgNumScale       = useRef(new Animated.Value(1.4)).current;
    const logoOpacity      = useRef(new Animated.Value(0)).current;
    const logoScale        = useRef(new Animated.Value(0.5)).current;
    const logoGlow         = useRef(new Animated.Value(0)).current;
    const dividerTop       = useRef(new Animated.Value(0)).current;
    const dividerWidth     = useRef(new Animated.Value(0)).current;
    const rentalOpacity    = useRef(new Animated.Value(0)).current;
    const rentalY          = useRef(new Animated.Value(18)).current;
    const meetOpacity      = useRef(new Animated.Value(0)).current;
    const meetY            = useRef(new Animated.Value(18)).current;
    const accentLineWidth  = useRef(new Animated.Value(0)).current;
    const badgeOpacity     = useRef(new Animated.Value(0)).current;
    const badgeX           = useRef(new Animated.Value(-16)).current;
    const sloganOpacity    = useRef(new Animated.Value(0)).current;
    const sloganY          = useRef(new Animated.Value(14)).current;
    const progressWidth    = useRef(new Animated.Value(0)).current;
    const taglineOpacity   = useRef(new Animated.Value(0)).current;
    const screenOpacity    = useRef(new Animated.Value(1)).current;

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

        // ── Continuous: logo glow breathe ─────────────────────────────────────
        Animated.loop(
            Animated.sequence([
                Animated.timing(logoGlow, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(logoGlow, { toValue: 0.3, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        // ── Continuous: progress bar fill ─────────────────────────────────────
        Animated.loop(
            Animated.sequence([
                Animated.timing(progressWidth, {
                    toValue: W * 0.6,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(progressWidth, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: false,
                }),
            ])
        ).start();

        // ── Main entrance sequence ────────────────────────────────────────────
        Animated.sequence([

            // 1 — Top bar sweeps across
            Animated.timing(topBarWidth, {
                toValue: W,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }),

            // 2 — Corner blocks snap in
            Animated.parallel([
                Animated.spring(cornerScale, { toValue: 1, speed: 20, bounciness: 14, useNativeDriver: true }),
                Animated.timing(cornerOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]),

            // 3 — Big "01" watermark fades in
            Animated.parallel([
                Animated.timing(bgNumOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.spring(bgNumScale, { toValue: 1, speed: 8, bounciness: 6, useNativeDriver: true }),
            ]),

            // 4 — Logo pops in with spring
            Animated.parallel([
                Animated.spring(logoScale, { toValue: 1, speed: 11, bounciness: 18, useNativeDriver: true }),
                Animated.timing(logoOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
            ]),

            // 5 — Divider bar grows from left
            Animated.parallel([
                Animated.timing(dividerWidth, {
                    toValue: 32,
                    duration: 220,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(dividerTop, { toValue: 1, duration: 220, useNativeDriver: true }),
            ]),

            // 6 — "Rental" slides up
            Animated.parallel([
                Animated.timing(rentalOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
                Animated.spring(rentalY, { toValue: 0, speed: 18, bounciness: 8, useNativeDriver: true }),
            ]),

            // 7 — "Meet" slides up
            Animated.parallel([
                Animated.timing(meetOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
                Animated.spring(meetY, { toValue: 0, speed: 18, bounciness: 8, useNativeDriver: true }),
            ]),

            // 8 — Accent line grows + badge slides in
            Animated.parallel([
                Animated.timing(accentLineWidth, {
                    toValue: 28,
                    duration: 250,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(badgeOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
                Animated.spring(badgeX, { toValue: 0, speed: 18, bounciness: 10, useNativeDriver: true }),
            ]),

            // 9 — Slogan rises
            Animated.parallel([
                Animated.timing(sloganOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(sloganY, { toValue: 0, speed: 16, bounciness: 6, useNativeDriver: true }),
            ]),

            // 10 — Bottom tagline
            Animated.timing(taglineOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),

            // 11 — Hold
            Animated.delay(1000),

            // 12 — Fade out
            Animated.timing(screenOpacity, { toValue: 0, duration: 480, useNativeDriver: true }),

        ]).start(handleNavigation);
    }, []);

    const glowScale = logoGlow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] });

    return (
        <Animated.View style={[s.container, { opacity: screenOpacity }]}>
            <StatusBar barStyle="dark-content" backgroundColor={BG} />

            {/* ── Animated top bar ── */}
            <Animated.View style={[s.topBar, { width: topBarWidth }]} />

            {/* ── Corner accent blocks ── */}
            <Animated.View style={[s.cornerTR, {
                opacity: cornerOpacity,
                transform: [{ scale: cornerScale }],
            }]} />
            <Animated.View style={[s.cornerBL, {
                opacity: cornerOpacity,
                transform: [{ scale: cornerScale }],
            }]} />

            {/* ── Watermark number ── */}
            <Animated.Text style={[s.watermark, {
                opacity: bgNumOpacity,
                transform: [{ scale: bgNumScale }],
            }]}>
                01
            </Animated.Text>

            {/* ── Center content ── */}
            <View style={s.center}>

                {/* Logo with glow */}
                <Animated.View style={[s.logoWrap, {
                    opacity: logoOpacity,
                    transform: [{ scale: logoScale }],
                }]}>
                    <Animated.View style={[s.logoGlow, {
                        opacity: logoGlow,
                        transform: [{ scale: glowScale }],
                    }]} />
                    <View style={s.logoBox}>
                        <Image
                            source={require('../assets/icon.webp')}
                            style={s.logoImg}
                            resizeMode="cover"
                        />
                    </View>
                </Animated.View>

                {/* Divider bar */}
                <Animated.View style={[s.dividerBar, {
                    width: dividerWidth,
                    opacity: dividerTop,
                }]} />

                {/* Brand name */}
                <View style={s.textBlock}>
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

                {/* Accent line + badge row */}
                <View style={s.accentRow}>
                    <Animated.View style={[s.accentBar, { width: accentLineWidth }]} />
                    <Animated.View style={[s.indiaBadge, {
                        opacity: badgeOpacity,
                        transform: [{ translateX: badgeX }],
                    }]}>
                        <Text style={s.indiaBadgeText}>#1 IN INDIA</Text>
                    </Animated.View>
                </View>

                {/* Slogan */}
                <Animated.Text style={[s.slogan, {
                    opacity: sloganOpacity,
                    transform: [{ translateY: sloganY }],
                }]}>
                    India's{' '}
                    <Text style={s.sloganBold}>1st</Text>
                    {' '}meeting venue{'\n'}booking platform
                </Animated.Text>
            </View>

            {/* ── Progress bar ── */}
            <View style={s.progressTrack}>
                <Animated.View style={[s.progressFill, { width: progressWidth }]} />
            </View>

            {/* ── Bottom tagline ── */}
            <Animated.Text style={[s.tagline, { opacity: taglineOpacity }]}>
                BOOK  ·  MEET  ·  SUCCEED
            </Animated.Text>

            {/* ── Version ── */}
            <Animated.Text style={[s.version, { opacity: taglineOpacity }]}>
                v1.0.0
            </Animated.Text>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },

    // ── Top bar ──
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: 5,
        backgroundColor: ORANGE,
        shadowColor: ORANGE,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 6,
    },

    // ── Corner blocks ──
    cornerTR: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 72,
        height: 72,
        backgroundColor: ORANGE,
        // Triangle via borderRadius trick
        borderBottomLeftRadius: 72,
    },
    cornerBL: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 56,
        height: 56,
        backgroundColor: BLACK,
        borderTopRightRadius: 56,
    },

    // ── Watermark ──
    watermark: {
        position: 'absolute',
        top: H * 0.06,
        left: 20,
        fontSize: 110,
        fontWeight: '900',
        color: ORANGE_SOFT,
        letterSpacing: -4,
        lineHeight: 110,
    },

    // ── Center ──
    center: {
        width: '100%',
        alignItems: 'flex-start',
        paddingHorizontal: 36,
        gap: 10,
    },

    // Logo
    logoWrap: {
        alignSelf: 'center',
        width: 104,
        height: 104,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    logoGlow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: ORANGE_GLOW,
        shadowColor: ORANGE,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 0,
    },
    logoBox: {
        width: 100,
        height: 100,
        borderRadius: 28,
        overflow: 'hidden',
        backgroundColor: ORANGE,
        shadowColor: ORANGE,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 22,
        elevation: 14,
    },
    logoImg: {
        width: '100%',
        height: '100%',
    },

    // Divider
    dividerBar: {
        height: 4,
        backgroundColor: BLACK,
        borderRadius: 2,
        marginBottom: 2,
    },

    // Text block — left aligned, editorial
    textBlock: {
        gap: -6,
    },
    rental: {
        fontSize: 38,
        fontWeight: '300',
        color: BLACK,
        letterSpacing: -1,
        lineHeight: 42,
    },
    meet: {
        fontSize: 56,
        fontWeight: '900',
        color: ORANGE,
        letterSpacing: -2.5,
        lineHeight: 58,
    },

    // Accent row
    accentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
    },
    accentBar: {
        height: 4,
        backgroundColor: ORANGE,
        borderRadius: 2,
    },
    indiaBadge: {
        paddingHorizontal: 14,
        paddingVertical: 5,
        backgroundColor: BLACK,
        borderRadius: 5,
    },
    indiaBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: ORANGE,
        letterSpacing: 2.5,
    },

    // Slogan
    slogan: {
        fontSize: 14,
        fontWeight: '400',
        color: GREY,
        lineHeight: 22,
        marginTop: 2,
    },
    sloganBold: {
        fontWeight: '800',
        color: BLACK,
    },

    // Progress
    progressTrack: {
        position: 'absolute',
        bottom: H * 0.1,
        width: W * 0.6,
        height: 2.5,
        backgroundColor: GREY_LIGHT,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: ORANGE,
        borderRadius: 2,
        shadowColor: ORANGE,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
        elevation: 4,
    },

    // Tagline
    tagline: {
        position: 'absolute',
        bottom: H * 0.063,
        fontSize: 9.5,
        fontWeight: '700',
        color: GREY_LIGHT,
        letterSpacing: 3.5,
        textTransform: 'uppercase',
    },

    // Version
    version: {
        position: 'absolute',
        bottom: 26,
        fontSize: 10,
        color: GREY_LIGHT,
        letterSpacing: 1,
        fontWeight: '400',
    },
});
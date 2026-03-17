import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Platform, StyleSheet, Text, View } from 'react-native';
import Video from 'react-native-video';
import { Colors, Typography, Spacing, Radii } from '../theme/theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigations/RootNavigation';
import { useAuthStore } from '../store/auth-store';

const { width: W, height: H } = Dimensions.get('window');

type splashProps = NativeStackScreenProps<RootStackParamList, 'splash'>;

const MAIN_LOGO = require('../assets/MainLogo.png');
Image.prefetch(Image.resolveAssetSource(MAIN_LOGO).uri).catch(() => null);

export default function SplashScreen({ navigation }: splashProps) {
    const { loadUser } = useAuthStore();
    const [videoFailed, setVideoFailed] = useState(false);
    const [videoEnded, setVideoEnded] = useState(false);

    // ── Animated values ──────────────────────────────────────────────────────
    // Dark overlay fades in as video ends
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    // Decorative rings expand outward
    const ring1Scale = useRef(new Animated.Value(0.4)).current;
    const ring1Opacity = useRef(new Animated.Value(0)).current;
    const ring2Scale = useRef(new Animated.Value(0.4)).current;
    const ring2Opacity = useRef(new Animated.Value(0)).current;
    const ring3Scale = useRef(new Animated.Value(0.4)).current;
    const ring3Opacity = useRef(new Animated.Value(0)).current;

    // Logo
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.78)).current;
    const logoY = useRef(new Animated.Value(24)).current;

    // Brand sub-label
    const brandOpacity = useRef(new Animated.Value(0)).current;
    const brandY = useRef(new Animated.Value(10)).current;

    // Header badge
    const headerOpacity = useRef(new Animated.Value(0)).current;
    const headerY = useRef(new Animated.Value(-18)).current;

    // Footer
    const footerOpacity = useRef(new Animated.Value(0)).current;
    const footerY = useRef(new Animated.Value(22)).current;

    // Amber horizontal rule widths (animate from 0 to full)
    const rulerWidth = useRef(new Animated.Value(0)).current;

    const handleNavigation = async () => {
        await loadUser();

        const { user, isAuthenticated } = useAuthStore.getState();

        console.log(`User:${user} \n Authenticated: ${isAuthenticated}`);
        if (isAuthenticated) {
            navigation.replace(user?.role === 'owner' ? 'owner' : 'client');
        } else {
            navigation.replace('onBoarding');
        }
    };
    // ── Animation sequence ───────────────────────────────────────────────────
    useEffect(() => {
        if (!videoEnded) return;

        Animated.sequence([
            // 0. Dark overlay fades over video
            Animated.timing(overlayOpacity, {
                toValue: 1,
                duration: 420,
                useNativeDriver: true,
            }),

            // 1. Rings bloom out from centre
            Animated.stagger(100, [
                Animated.parallel([
                    Animated.timing(ring1Scale, {
                        toValue: 1,
                        duration: 550,
                        useNativeDriver: true,
                    }),
                    Animated.timing(ring1Opacity, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(ring2Scale, {
                        toValue: 1,
                        duration: 580,
                        useNativeDriver: true,
                    }),
                    Animated.timing(ring2Opacity, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(ring3Scale, {
                        toValue: 1,
                        duration: 610,
                        useNativeDriver: true,
                    }),
                    Animated.timing(ring3Opacity, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ]),
            ]),

            // 2. Logo rises in
            Animated.parallel([
                Animated.timing(logoOpacity, { toValue: 1, duration: 560, useNativeDriver: true }),
                Animated.timing(logoScale, { toValue: 1, duration: 560, useNativeDriver: true }),
                Animated.timing(logoY, { toValue: 0, duration: 560, useNativeDriver: true }),
            ]),

            // 3. Brand sub-label fades up
            Animated.parallel([
                Animated.timing(brandOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
                Animated.timing(brandY, { toValue: 0, duration: 380, useNativeDriver: true }),
            ]),

            // 4. Header drops down
            Animated.parallel([
                Animated.timing(headerOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(headerY, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]),

            // 5. Footer rises up
            Animated.parallel([
                Animated.timing(footerOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(footerY, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]),
        ]).start(() => {
            setTimeout(() => handleNavigation(), 900);
        });
    }, [videoEnded]);

    // Ruler animates separately via JS driver (width not supported by native)
    useEffect(() => {
        if (!videoEnded) return;
        setTimeout(() => {
            Animated.timing(rulerWidth, {
                toValue: 1,
                duration: 700,
                useNativeDriver: false,
            }).start();
        }, 1600); // kicks in after logo appears
    }, [videoEnded]);

    const handleVideoEnd = () => setVideoEnded(true);
    const handleVideoError = (e: any) => {
        console.warn('Video error:', e);
        setVideoFailed(true);
        setVideoEnded(true);
    };

    // Interpolated ruler width
    const leftRulerW = rulerWidth.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });
    const rightRulerW = rulerWidth.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });

    return (
        <View style={s.root}>
            {/* ── Video plays full-screen ── */}
            {!videoFailed && (
                <Video
                    source={require('../assets/MapBackground_enhanced.mp4')}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                    muted
                    paused={false}
                    repeat={false}
                    onEnd={handleVideoEnd}
                    onError={handleVideoError}
                />
            )}

            {/* ── Dark overlay fades in as video finishes ── */}
            <Animated.View
                style={[StyleSheet.absoluteFill, s.darkOverlay, { opacity: overlayOpacity }]}
            />

            {/* ── Decorative concentric rings — centre bloom ── */}
            <Animated.View
                style={[
                    s.ring,
                    s.ring3,
                    { opacity: ring3Opacity, transform: [{ scale: ring3Scale }] },
                ]}
            />
            <Animated.View
                style={[
                    s.ring,
                    s.ring2,
                    { opacity: ring2Opacity, transform: [{ scale: ring2Scale }] },
                ]}
            />
            <Animated.View
                style={[
                    s.ring,
                    s.ring1,
                    { opacity: ring1Opacity, transform: [{ scale: ring1Scale }] },
                ]}
            />

            {/* Amber corner glow — top right */}
            {videoEnded && <View style={s.cornerGlowTR} />}
            {/* Amber corner glow — bottom left */}
            {videoEnded && <View style={s.cornerGlowBL} />}

            {/* ── HEADER ── */}
            <Animated.View
                style={[s.header, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}
            >
                <View style={s.badgeOuter}>
                    <View style={s.badgeDot} />
                    <Text style={s.badgeText}>INDIA'S NO. 1</Text>
                    <View style={s.badgeDot} />
                </View>
                <Text style={s.tagline}>Meeting Venues Booking Platform</Text>
            </Animated.View>

            {/* ── CENTER ── */}
            <View style={s.center}>
                {/* Amber ruler lines flanking logo */}
                <View style={s.rulerRow}>
                    <Animated.View style={[s.ruler, { width: leftRulerW }]} />
                    <View style={s.rulerGap} />
                    <Animated.View style={[s.ruler, { width: rightRulerW }]} />
                </View>

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
                        source={MAIN_LOGO}
                        defaultSource={MAIN_LOGO}
                        style={s.mainLogo}
                        resizeMode="contain"
                    />
                </Animated.View>

                <Animated.View
                    style={[
                        s.brandRow,
                        { opacity: brandOpacity, transform: [{ translateY: brandY }] },
                    ]}
                >
                    <View style={s.brandLine} />
                    <Text style={s.brandBy}>BY YUWAKA EDUTECH</Text>
                    <View style={s.brandLine} />
                </Animated.View>
            </View>

            {/* ── FOOTER ── */}
            <Animated.View
                style={[s.footer, { opacity: footerOpacity, transform: [{ translateY: footerY }] }]}
            >
                {/* Amber divider pip */}
                <View style={s.footerPip} />
                <Text style={s.footerPowered}>Powered by Yuwaka EduTech Pvt. Ltd.</Text>
                <Text style={s.footerCin}>CIN No. : U86801MP2028PTC088010</Text>
                <View style={s.footerMeta}>
                    <View style={s.footerMetaDot} />
                    <Text style={s.footerVersion}>Version 1.0.0</Text>
                </View>
            </Animated.View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: {
        flex: 1,
        width: W,
        height: H,
        backgroundColor: Colors.charcoal, // dark base
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 68 : 52,
        paddingBottom: Platform.OS === 'ios' ? 48 : 36,
        paddingHorizontal: Spacing.xxl,
    },

    // Dark warm overlay — covers video, reveals dark UI
    darkOverlay: {
        backgroundColor: 'rgba(28,25,20,0.91)', // very dark warm black
    },

    // ── Decorative rings ──
    ring: {
        position: 'absolute',
        alignSelf: 'center',
        top: '50%' as any,
        left: '50%' as any,
        borderRadius: 999,
        borderWidth: 1,
    },
    ring1: {
        width: 160,
        height: 160,
        marginTop: -80,
        marginLeft: -80,
        borderColor: Colors.primary + '55',
        backgroundColor: Colors.primaryGlow,
    },
    ring2: {
        width: 260,
        height: 260,
        marginTop: -130,
        marginLeft: -130,
        borderColor: Colors.primary + '30',
        backgroundColor: Colors.primaryGlow.replace('0.30', '0.06'),
    },
    ring3: {
        width: 370,
        height: 370,
        marginTop: -185,
        marginLeft: -185,
        borderColor: Colors.primary + '18',
        backgroundColor: 'transparent',
    },

    // Corner glows
    cornerGlowTR: {
        position: 'absolute',
        top: -30,
        right: -30,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: Colors.primaryGlow,
    },
    cornerGlowBL: {
        position: 'absolute',
        bottom: 60,
        left: -40,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.primaryDim,
    },

    // ── Header ──
    header: {
        alignItems: 'center',
        zIndex: 10,
    },
    badgeOuter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: 'rgba(245,166,35,0.12)',
        borderWidth: 1,
        borderColor: Colors.primaryBorder + '99',
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xxs + 1,
        marginBottom: Spacing.sm,
    },
    badgeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
    },
    badgeText: {
        fontSize: Typography.xs,
        letterSpacing: Typography.wider,
        color: Colors.primary,
        fontWeight: Typography.bold,
    },
    tagline: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        letterSpacing: Typography.normal,
        fontWeight: Typography.regular,
    },

    // ── Center ──
    center: {
        alignItems: 'center',
        zIndex: 10,
        gap: 0,
    },
    rulerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        width: W * 0.68,
        justifyContent: 'center',
    },
    ruler: {
        height: 1,
        backgroundColor: Colors.primary,
        opacity: 0.6,
    },
    rulerGap: {
        width: 12,
    },
    logoWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        // Subtle amber glow halo behind logo
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 28,
        elevation: 12,
    },
    mainLogo: {
        width: W * 0.68,
        height: W * 0.52,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    brandLine: {
        width: 22,
        height: 1,
        backgroundColor: Colors.primary,
        opacity: 0.55,
    },
    brandBy: {
        fontSize: Typography.xs,
        color: Colors.primary,
        fontWeight: Typography.bold,
        letterSpacing: Typography.wider,
    },

    // ── Footer ──
    footer: {
        alignItems: 'center',
        zIndex: 10,
        gap: Spacing.xxs,
    },
    footerPip: {
        width: 28,
        height: 2,
        borderRadius: 1,
        backgroundColor: Colors.primary,
        opacity: 0.7,
        marginBottom: Spacing.sm,
    },
    footerPowered: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        textAlign: 'center',
    },
    footerCin: {
        fontSize: Typography.xs,
        color: Colors.charcoalWarm,
        textAlign: 'center',
        marginTop: Spacing.xxs,
    },
    footerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.xs,
    },
    footerMetaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: Colors.primary,
        opacity: 0.6,
    },
    footerVersion: {
        fontSize: Typography.xs,
        color: Colors.charcoalWarm,
        fontWeight: Typography.medium,
        letterSpacing: Typography.normal,
    },
});

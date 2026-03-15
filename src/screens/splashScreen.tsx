import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing, StatusBar } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { RootStackParamList } from '../navigations/RootNavigation';

// ── Theme tokens (from your theme file) ──────────────────────────────────────
const Colors = {
    primary: '#F5A623',
    primaryDark: '#D98E0E',
    primaryLight: '#FEF3DC',
    primaryBorder: '#F5D48A',
    primaryGlow: 'rgba(245,166,35,0.30)',
    primaryDim: 'rgba(245,166,35,0.14)',
    charcoal: '#2C2C2C',
    charcoalMid: '#555555',
    charcoalLight: '#8A8A8A',
    background: '#F7F6F2',
    tabBar: '#1E1B14',
    white: '#FFFFFF',
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Simplified India SVG path (scaled to ~280×320 viewport) ──────────────────
// viewBox="0 0 280 320"
const INDIA_PATH =
    'M138,8 L145,10 L155,8 L165,14 L172,12 L178,20 L185,22 ' +
    'L188,30 L195,35 L198,45 L205,48 L208,58 L212,62 L215,72 ' +
    'L220,78 L222,88 L218,96 L222,104 L225,114 L222,124 L218,132 ' +
    'L215,140 L210,148 L205,155 L200,162 L192,168 L188,176 ' +
    'L182,182 L178,190 L175,198 L170,205 L166,212 L162,218 ' +
    'L158,225 L155,232 L152,240 L148,248 L145,256 L142,262 ' +
    'L140,268 L138,274 L136,268 L134,262 L131,255 L128,248 ' +
    'L124,240 L120,232 L116,225 L112,218 L108,212 L104,206 ' +
    'L100,200 L96,194 L92,188 L88,182 L84,176 L80,170 ' +
    'L76,164 L72,158 L68,152 L65,144 L62,136 L60,126 ' +
    'L62,116 L60,106 L62,96 L66,88 L70,80 L75,72 ' +
    'L80,65 L86,58 L90,50 L95,44 L100,38 L106,32 ' +
    'L112,26 L118,20 L124,15 L130,10 Z';

// ── AnimatedPath wrapper ──────────────────────────────────────────────────────
const AnimatedPath = Animated.createAnimatedComponent(Path);

// ── Particle dot positions scattered around India silhouette ─────────────────
const PARTICLES = [
    { x: 140, y: 80 }, // Delhi area
    { x: 165, y: 110 }, // Kolkata area
    { x: 105, y: 130 }, // Rajasthan area
    { x: 178, y: 150 }, // Assam area
    { x: 92, y: 175 }, // Gujarat area
    { x: 148, y: 200 }, // Hyderabad area
    { x: 118, y: 220 }, // Goa area
    { x: 145, y: 250 }, // Kerala/TN area
];

type splashProps = NativeStackScreenProps<RootStackParamList, 'splash'>

// ── SplashScreen Component ────────────────────────────────────────────────────
const SplashScreen= ({navigation}:splashProps) => {
    // Map draw animation (stroke-dashoffset trick via opacity cascade)
    const mapProgress = useRef(new Animated.Value(0)).current;
    const glowPulse = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const nameTranslate = useRef(new Animated.Value(20)).current;
    const nameOpacity = useRef(new Animated.Value(0)).current;
    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const screenFade = useRef(new Animated.Value(1)).current;

    // Individual particle anims
    const particleAnims = PARTICLES.map(() => ({
        scale: useRef(new Animated.Value(0)).current,
        opacity: useRef(new Animated.Value(0)).current,
    }));

    useEffect(() => {
        // 1. Draw the map (0→1 over 2s)
        Animated.timing(mapProgress, {
            toValue: 1,
            duration: 2200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start(() => {
            // 2. Glow pulse after draw
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowPulse, {
                        toValue: 1,
                        duration: 900,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowPulse, {
                        toValue: 0,
                        duration: 900,
                        useNativeDriver: true,
                    }),
                ]),
                { iterations: 3 },
            ).start();

            // 3. Scatter particles
            particleAnims.forEach((p, i) => {
                Animated.sequence([
                    Animated.delay(i * 80),
                    Animated.parallel([
                        Animated.spring(p.scale, {
                            toValue: 1,
                            friction: 5,
                            useNativeDriver: true,
                        }),
                        Animated.timing(p.opacity, {
                            toValue: 1,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                    ]),
                ]).start();
            });

            // 4. After 600ms show logo
            setTimeout(() => {
                Animated.parallel([
                    Animated.spring(logoScale, {
                        toValue: 1,
                        friction: 6,
                        tension: 80,
                        useNativeDriver: true,
                    }),
                    Animated.timing(logoOpacity, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    // 5. App name slides up
                    Animated.parallel([
                        Animated.timing(nameTranslate, {
                            toValue: 0,
                            duration: 500,
                            easing: Easing.out(Easing.cubic),
                            useNativeDriver: true,
                        }),
                        Animated.timing(nameOpacity, {
                            toValue: 1,
                            duration: 500,
                            useNativeDriver: true,
                        }),
                    ]).start(() => {
                        // 6. Tagline fades in
                        Animated.timing(taglineOpacity, {
                            toValue: 1,
                            duration: 400,
                            useNativeDriver: true,
                        }).start(() => {
                            // 7. Hold then fade out whole screen
                            setTimeout(() => {
                                Animated.timing(screenFade, {
                                    toValue: 0,
                                    duration: 600,
                                    useNativeDriver: true,
                                }).start(() => navigation.replace('login'));
                            }, 1200);
                        });
                    });
                });
            }, 600);
        });
    }, []);

    // Map opacity: segments fade in as progress advances
    // We simulate "draw" by fading in path opacity with a slight scale from center
    const mapOpacity = mapProgress.interpolate({
        inputRange: [0, 0.15, 1],
        outputRange: [0, 1, 1],
    });
    const mapScale = mapProgress.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] });
    const borderOpacity = mapProgress.interpolate({
        inputRange: [0, 0.4, 1],
        outputRange: [0, 0, 1],
    });

    const glowOpacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.75] });
    const glowScale = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.08] });

    return (
        <Animated.View style={[styles.container, { opacity: screenFade }]}>
            <StatusBar backgroundColor={Colors.tabBar} barStyle="light-content" />

            {/* Background radial glow */}
            <Animated.View
                style={[styles.bgGlow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}
            />

            {/* Grid dots background texture */}
            <View style={styles.gridContainer} pointerEvents="none">
                {Array.from({ length: 12 }).map((_, row) =>
                    Array.from({ length: 8 }).map((_, col) => (
                        <View
                            key={`${row}-${col}`}
                            style={[
                                styles.gridDot,
                                {
                                    top: row * 52 + 20,
                                    left: col * 46 + 20,
                                },
                            ]}
                        />
                    )),
                )}
            </View>

            {/* India Map SVG */}
            <Animated.View
                style={[
                    styles.mapWrapper,
                    {
                        opacity: mapOpacity,
                        transform: [{ scale: mapScale }],
                    },
                ]}
            >
                <Svg width={280} height={320} viewBox="0 0 280 320">
                    <Defs>
                        <LinearGradient id="mapFill" x1="0" y1="0" x2="1" y2="1">
                            <Stop offset="0" stopColor={Colors.primaryLight} stopOpacity="0.9" />
                            <Stop offset="1" stopColor="#FEE6A0" stopOpacity="0.7" />
                        </LinearGradient>
                        <LinearGradient id="strokeGrad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={Colors.primary} stopOpacity="1" />
                            <Stop offset="1" stopColor={Colors.primaryDark} stopOpacity="1" />
                        </LinearGradient>
                    </Defs>

                    {/* Glow shadow layer */}
                    <Path
                        d={INDIA_PATH}
                        fill="rgba(245,166,35,0.12)"
                        scale={1.04}
                        translateX={-5}
                        translateY={-5}
                    />

                    {/* Fill layer */}
                    <Path d={INDIA_PATH} fill="url(#mapFill)" />

                    {/* Animated border stroke — drawn via strokeDasharray trick */}
                    <AnimatedPath
                        d={INDIA_PATH}
                        fill="none"
                        stroke="url(#strokeGrad)"
                        strokeWidth={2.2}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        opacity={borderOpacity}
                    />

                    {/* State division subtle lines */}
                    <Path
                        d="M138,80 L138,270 M100,140 L178,140 M90,180 L180,180 M105,220 L165,220"
                        stroke={Colors.primaryBorder}
                        strokeWidth={0.5}
                        opacity={0.4}
                        fill="none"
                    />

                    {/* City dots */}
                    {PARTICLES.map((p, i) => (
                        <AnimatedPath
                            key={i}
                            d={`M${p.x - 3},${p.y} a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0`}
                            fill={Colors.primary}
                            opacity={particleAnims[i].opacity}
                        />
                    ))}
                </Svg>
            </Animated.View>

            {/* Logo + Name centered overlay */}
            <View style={styles.brandOverlay} pointerEvents="none">
                {/* Logo Icon */}
                <Animated.View
                    style={[
                        styles.logoCircle,
                        {
                            opacity: logoOpacity,
                            transform: [{ scale: logoScale }],
                        },
                    ]}
                >
                    {/* Custom "M" logo mark */}
                    <Svg width={52} height={52} viewBox="0 0 52 52">
                        <Defs>
                            <LinearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0" stopColor={Colors.primary} />
                                <Stop offset="1" stopColor={Colors.primaryDark} />
                            </LinearGradient>
                        </Defs>
                        {/* Outer ring */}
                        <Circle
                            cx="26"
                            cy="26"
                            r="25"
                            fill="none"
                            stroke="url(#logoGrad)"
                            strokeWidth="1.5"
                        />
                        {/* M letterform */}
                        <Path
                            d="M10,36 L10,16 L20,28 L26,20 L32,28 L42,16 L42,36"
                            fill="none"
                            stroke="url(#logoGrad)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </Svg>
                </Animated.View>

                {/* App name */}
                <Animated.Text
                    style={[
                        styles.appName,
                        {
                            opacity: nameOpacity,
                            transform: [{ translateY: nameTranslate }],
                        },
                    ]}
                >
                    Meet
                </Animated.Text>

                {/* Tagline */}
                <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
                    Connecting India
                </Animated.Text>
            </View>

            {/* Bottom amber bar */}
            <Animated.View style={[styles.bottomBar, { opacity: nameOpacity }]}>
                <View style={styles.bottomBarInner} />
            </Animated.View>
        </Animated.View>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.tabBar,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    bgGlow: {
        position: 'absolute',
        width: SCREEN_W * 1.2,
        height: SCREEN_H * 0.75,
        borderRadius: SCREEN_W,
        backgroundColor: 'transparent',
        top: SCREEN_H * 0.05,
        // radial glow via shadow
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 120,
        elevation: 0,
    },
    gridContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gridDot: {
        position: 'absolute',
        width: 2,
        height: 2,
        borderRadius: 1,
        backgroundColor: 'rgba(245,166,35,0.12)',
    },
    mapWrapper: {
        position: 'absolute',
        top: SCREEN_H * 0.08,
        alignSelf: 'center',
    },
    brandOverlay: {
        position: 'absolute',
        top: SCREEN_H * 0.08,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: Colors.tabBar,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Colors.primary,
        // glow
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 18,
        elevation: 12,
        marginBottom: 14,
    },
    appName: {
        fontFamily: 'Georgia', // distinctive serif — swap for custom font if available
        fontSize: 42,
        fontWeight: '700',
        color: Colors.white,
        letterSpacing: 3,
        textShadowColor: Colors.primary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 16,
    },
    tagline: {
        marginTop: 6,
        fontSize: 12,
        fontWeight: '500',
        color: Colors.primary,
        letterSpacing: 4,
        textTransform: 'uppercase',
        opacity: 0.9,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 48,
        alignItems: 'center',
    },
    bottomBarInner: {
        width: 48,
        height: 3,
        borderRadius: 2,
        backgroundColor: Colors.primary,
        opacity: 0.7,
    },
});

export default SplashScreen;

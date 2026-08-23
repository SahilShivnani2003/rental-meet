import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Animated,
    StyleSheet,
    Dimensions,
    StatusBar,
    Easing,
    Image,
    Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing } from '../theme/theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import { RootStackParamList } from '@/types/RootStackParamList';

const { width, height } = Dimensions.get('window');
type splashProps = NativeStackScreenProps<RootStackParamList, 'splash'>;

// ─── Pin positions on the India map (% of map container W × H) ───────────────
// Approximate lat/lon → pixel mapping for the map asset
const CITY_PINS = [
    { x: 0.38, y: 0.15 }, // Delhi
    { x: 0.35, y: 0.28 }, // Jaipur
    { x: 0.27, y: 0.35 }, // Ahmedabad
    { x: 0.87, y: 0.38 }, 
    { x: 0.44, y: 0.38 }, // Bhopal
    { x: 0.24, y: 0.5 }, // Mumbai
    { x: 0.35, y: 0.45 }, // Pune
    { x: 0.52, y: 0.52 }, // Nagpur
    { x: 0.62, y: 0.5 }, // Bhubaneswar
    { x: 0.42, y: 0.6 }, // Hyderabad
    { x: 0.36, y: 0.55 }, // Bangalore
    { x: 0.33, y: 0.66 },
    { x: 0.45, y: 0.68 }, // Chennai
    { x: 0.34, y: 0.76 }, // Kochi
    { x: 0.44, y: 0.8 }, // Trivandrum
];

const SplashScreen = ({ navigation }: splashProps) => {
    const { loadUser } = useAuthStore();

    // ─── Animated values ──────────────────────────────────────────────────────
    const headerOpacity = useRef(new Animated.Value(0)).current;
    const headerY = useRef(new Animated.Value(-24)).current;
    const mapOpacity = useRef(new Animated.Value(0)).current;
    const mapScale = useRef(new Animated.Value(0.88)).current;
    const cardY = useRef(new Animated.Value(60)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const poweredOpacity = useRef(new Animated.Value(0)).current;
    const pinOpacities = useRef(CITY_PINS.map(() => new Animated.Value(0))).current;
    const pinScales = useRef(CITY_PINS.map(() => new Animated.Value(0))).current;

    // ─── Navigation ───────────────────────────────────────────────────────────
    const handleNavigation = async () => {
        await loadUser();
        const { user, isAuthenticated } = useAuthStore.getState();
        console.log('founded user role : ', user?.role);
        debugger
        if (isAuthenticated) {
            if (user?.role === 'owner') navigation.replace('owner');
            else if (user?.role === 'vendor') navigation.replace('vendor');
            else if (user?.role === 'customer') navigation.replace('client');
            else if (user?.role === 'ambassador') navigation.replace('ambassador');
            else navigation.replace('onBoarding');
        } else {
            navigation.replace('onBoarding');
        }
    };

    useEffect(() => {
        StatusBar.setHidden(true);

        // PHASE 1 — Header slides down (0ms)
        Animated.parallel([
            Animated.timing(headerOpacity, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(headerY, {
                toValue: 0,
                duration: 520,
                easing: Easing.out(Easing.back(1.4)),
                useNativeDriver: true,
            }),
        ]).start();

        // PHASE 2 — Map blooms in (400ms)
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(mapOpacity, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.spring(mapScale, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ]).start();
        }, 400);

        // PHASE 3 — City pins pop in one by one (700ms)
        setTimeout(() => {
            CITY_PINS.forEach((_, i) => {
                setTimeout(() => {
                    Animated.parallel([
                        Animated.spring(pinScales[i], {
                            toValue: 1,
                            tension: 80,
                            friction: 6,
                            useNativeDriver: true,
                        }),
                        Animated.timing(pinOpacities[i], {
                            toValue: 1,
                            duration: 250,
                            useNativeDriver: true,
                        }),
                    ]).start();
                }, i * 80);
            });
        }, 700);

        // PHASE 4 — Bottom card slides up (1300ms)
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(cardOpacity, {
                    toValue: 1,
                    duration: 400,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(cardY, {
                    toValue: 0,
                    duration: 450,
                    easing: Easing.out(Easing.back(1.2)),
                    useNativeDriver: true,
                }),
            ]).start();
        }, 1300);

        // PHASE 5 — Powered by (1800ms)
        setTimeout(() => {
            Animated.timing(poweredOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }, 1800);

        // FINISH (3400ms)
        const fin = setTimeout(() => {
            StatusBar.setHidden(false);
            handleNavigation();
        }, 3400);

        return () => {
            clearTimeout(fin);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Map container dimensions ─────────────────────────────────────────────
    const MAP_W = width * 0.98;
    const MAP_H = height * 0.56;

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            {/* ── HEADER — "India's 1st  Meeting Venue Booking Platform" ── */}
            <Animated.View
                style={[
                    styles.header,
                    { opacity: headerOpacity, transform: [{ translateY: headerY }] },
                ]}
            >
                {/* Left: India's + giant numeral */}
                <View style={styles.headerLeft}>
                    <Text style={styles.indiasText}>India's</Text>
                    <View style={styles.numeralRow}>
                        <Text style={styles.numeral}>1</Text>
                        <Text style={styles.superscript}>st</Text>
                    </View>
                </View>

                {/* Right: stacked descriptor */}
                <View style={styles.headerRight}>
                    {['Meeting', 'Venue', 'Booking', 'Platform'].map(word => (
                        <Text key={word} style={styles.descriptorWord}>
                            {word}
                        </Text>
                    ))}
                </View>
            </Animated.View>

            {/* ── MAP ZONE ── */}
            <Animated.View
                style={[
                    styles.mapZone,
                    {
                        width: MAP_W,
                        height: MAP_H,
                        opacity: mapOpacity,
                        transform: [{ scale: mapScale }],
                    },
                ]}
            >
                {/* India map — tinted white on amber */}
                <Image
                    source={require('@assets/m22.png')}
                    style={[styles.mapImage, { width: MAP_W, height: MAP_H }]}
                    resizeMode="contain"
                />

                {/* City pins */}
                {CITY_PINS.map((pin, i) => (
                    <Animated.View
                        key={i}
                        style={[
                            styles.pin,
                            {
                                left: pin.x * MAP_W - 30,
                                top: pin.y * MAP_H - 15,
                                opacity: pinOpacities[i],
                                transform: [{ scale: pinScales[i] }],
                            },
                        ]}
                    >
                        <Image
                            source={require('@assets/Logo.png')}
                            style={styles.pinIcon}
                            resizeMode="contain"
                        />
                    </Animated.View>
                ))}
            </Animated.View>

            {/* ── BOTTOM BRAND CARD ── */}
            <Animated.View
                style={[
                    styles.brandCard,
                    {
                        opacity: cardOpacity,
                        transform: [{ translateY: cardY }],
                    },
                ]}
            >
                <Image
                    source={require('@assets/NameLogo.png')}
                    style={styles.brandIcon}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* ── POWERED BY ── */}
            <Animated.View style={[styles.poweredRow, { opacity: poweredOpacity }]}>
                <Text style={styles.poweredText}>Powered by </Text>
                <Text style={styles.poweredBold}>Yuwaka Edutech Pvt. Ltd.</Text>
            </Animated.View>
        </View>
    );
};

export default SplashScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary, // full amber
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 56 : 40,
        paddingBottom: 0,
    },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing.xl,
        marginBottom: 0,
    },
    headerLeft: {
        width: '50%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    indiasText: {
        fontSize: Typography.xxxl,
        fontWeight: '800',
        color: Colors.white,
        fontStyle: 'italic',
        letterSpacing: 0.5,
        lineHeight: 32,
        textShadowColor: 'rgba(0,0,0,0.12)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    numeralRow: {
        marginLeft: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    numeral: {
        fontSize: 140,
        fontWeight: '500',
        color: Colors.charcoal,
        lineHeight: 130,
        includeFontPadding: false,
        textShadowColor: 'rgba(0,0,0,0.10)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 8,
    },
    superscript: {
        fontSize: 34,
        fontWeight: '600',
        color: Colors.charcoal,
        marginTop: 14,
        marginLeft: 0,
        includeFontPadding: false,
    },

    headerRight: {
        marginLeft: Spacing.xxl,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        paddingTop: 28, // clears "India's" line (lineHeight 32) so text sits beside the "1"
    },
    descriptorWord: {
        fontSize: Typography.xl,
        fontWeight: '600',
        color: Colors.white,
        lineHeight: 30,
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0,0,0,0.10)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },

    // ── Map ───────────────────────────────────────────────────────────────────
    mapZone: {
        position: 'relative',
        flex: 1,
        alignSelf: 'center',
    },
    mapImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        tintColor: Colors.white, // white silhouette on amber
        opacity: 0.95,
    },
    pin: {
        position: 'absolute',
        width: 20,
        height: 20,
    },
    pinIcon: {
        width: 35,
        height: 35,
    },

    // ── Brand card ────────────────────────────────────────────────────────────
    brandCard: {
        width: width * 0.88,
        backgroundColor: Colors.white,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginBottom: Spacing.xl,
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 10,
        gap: 14,
    },
    brandIcon: {
        width: '100%',
        height: 48,
    },
    brandTextWrap: {
        flex: 1,
    },
    brandNameRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    brandNameRental: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    brandNameMeet: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: -0.3,
    },
    brandTagline: {
        fontSize: 11,
        fontWeight: '500',
        color: Colors.charcoalLight,
        letterSpacing: 0.2,
        marginTop: 1,
    },

    // ── Powered by ────────────────────────────────────────────────────────────
    poweredRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: Platform.OS === 'ios' ? 28 : 16,
        paddingTop: 4,
    },
    poweredText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.75)',
        letterSpacing: 0.2,
    },
    poweredBold: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.white,
        letterSpacing: 0.2,
    },
});

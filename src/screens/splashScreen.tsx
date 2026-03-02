import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';
import { Colors, Typography, Spacing } from '../theme/theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigations/RootNavigation';
import { useAuthStore } from '../store/auth-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type SplashProps = NativeStackScreenProps<RootStackParamList, 'splash'>;

export default function SplashScreen({ navigation }: SplashProps) {
    const { isAuthenticated, user } = useAuthStore();
    // ── Animation values ────────────────────────────────────────────────────────
    const logoScale = useRef(new Animated.Value(0.7)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const textY = useRef(new Animated.Value(16)).current;
    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const dotScale1 = useRef(new Animated.Value(0)).current;
    const dotScale2 = useRef(new Animated.Value(0)).current;
    const dotScale3 = useRef(new Animated.Value(0)).current;
    const screenOpacity = useRef(new Animated.Value(1)).current;

    const handleNavigation = () => {
        console.log('SPLASH SCREEN AUTHENTICATION : ', isAuthenticated);
        if (isAuthenticated) {
            if (user?.role === 'owner') {
                navigation.replace('owner');
            } else {
                navigation.replace('client');
            }
        } else {
            navigation.replace('login')
        }
    };

    useEffect(() => {
        StatusBar.setBarStyle('dark-content');

        Animated.sequence([
            // 1 — Logo pops in
            Animated.parallel([
                Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 14 }),
                Animated.timing(logoOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
            ]),

            // 2 — Brand name slides up
            Animated.parallel([
                Animated.timing(textOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(textY, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 6 }),
            ]),

            // 3 — Tagline fades in
            Animated.timing(taglineOpacity, { toValue: 1, duration: 280, delay: 80, useNativeDriver: true }),

            // 4 — Loading dots stagger in
            Animated.stagger(140, [
                Animated.spring(dotScale1, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
                Animated.spring(dotScale2, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
                Animated.spring(dotScale3, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
            ]),

            // 5 — Hold for a moment
            Animated.delay(700),

            // 6 — Fade entire screen out
            Animated.timing(screenOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start(handleNavigation);
    }, []);

    return (
        <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

            {/* ── Decorative amber arcs ── */}
            <View style={styles.arcTopLeft} />
            <View style={styles.arcBottomRight} />

            {/* ── Center content ── */}
            <View style={styles.centerContent}>
                {/* Logo */}
                <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
                    <Image
                        source={require('../assets/logo.jpeg')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* Brand name — "Rental" normal weight, "Meet" bold charcoal */}
                <Animated.View style={[styles.brandRow, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
                    <Text style={styles.brandRental}>Rental</Text>
                    <Text style={styles.brandMeet}>Meet</Text>
                </Animated.View>

                {/* Tagline */}
                <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
                    BOOK YOUR PREMIUM MEETING VENUES
                </Animated.Text>
            </View>

            {/* ── Loading dots ── */}
            <View style={styles.dotsRow}>
                {[dotScale1, dotScale2, dotScale3].map((dot, i) => (
                    <Animated.View
                        key={i}
                        style={[
                            styles.dot,
                            i === 1 && styles.dotCenter,
                            { transform: [{ scale: dot }] },
                        ]}
                    />
                ))}
            </View>

            {/* ── Footer version ── */}
            <Text style={styles.version}>v1.0.0</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Decorative arcs — large amber circles clipped at edges ──
    arcTopLeft: {
        position: 'absolute',
        top: -SCREEN_WIDTH * 0.45,
        left: -SCREEN_WIDTH * 0.45,
        width: SCREEN_WIDTH * 0.9,
        height: SCREEN_WIDTH * 0.9,
        borderRadius: SCREEN_WIDTH * 0.45,
        backgroundColor: Colors.primaryLight,
        opacity: 0.7,
    },
    arcBottomRight: {
        position: 'absolute',
        bottom: -SCREEN_WIDTH * 0.38,
        right: -SCREEN_WIDTH * 0.38,
        width: SCREEN_WIDTH * 0.75,
        height: SCREEN_WIDTH * 0.75,
        borderRadius: SCREEN_WIDTH * 0.375,
        backgroundColor: Colors.primaryLight,
        opacity: 0.5,
    },

    // ── Center ──
    centerContent: {
        alignItems: 'center',
        gap: Spacing.sm,
    },

    logoWrap: {
        width: 130,
        height: 130,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    logo: {
        width: '100%',
        height: '100%',
    },

    // Brand name — mirrors logo wordmark style
    brandRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 0,
    },
    brandRental: {
        fontSize: 36,
        fontWeight: Typography.bold,
        color: Colors.primary,        // amber — matches logo icon color
        letterSpacing: -0.5,
    },
    brandMeet: {
        fontSize: 36,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,       // dark — matches "Meet" in logo wordmark
        letterSpacing: -0.5,
    },

    tagline: {
        fontSize: 10,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 2.2,
        textTransform: 'uppercase',
        marginTop: Spacing.xxs,
    },

    // ── Loading dots ──
    dotsRow: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: Colors.primaryBorder,
    },
    dotCenter: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,  // larger amber center dot
    },

    // ── Footer ──
    version: {
        position: 'absolute',
        bottom: Spacing.xxl,
        fontSize: 11,
        color: Colors.border,
        fontWeight: Typography.medium,
        letterSpacing: 0.5,
    },
});
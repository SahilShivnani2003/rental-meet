import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Shadows } from '../../theme/theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface LoaderProps {
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    overlay?: boolean; // fullscreen semi-transparent overlay
    style?: ViewStyle;
}

const LOADER_SIZES = { sm: 36, md: 56, lg: 72 };

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const Loader: React.FC<LoaderProps> = ({ size = 'md', label, overlay = false, style }) => {
    const spinAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const dotAnims = [
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
    ];

    useEffect(() => {
        // Fade in
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Outer arc spin
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 1100,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        ).start();

        // Core pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.18,
                    duration: 550,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 550,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ).start();

        // Staggered bouncing dots
        dotAnims.forEach((anim, i) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 160),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 400,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 400,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.delay((2 - i) * 160),
                ]),
            ).start();
        });
    }, []);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const dim = LOADER_SIZES[size];

    const loaderContent = (
        <Animated.View style={[styles.loaderWrap, { opacity: fadeAnim }, style]}>
            {/* Spinning arc ring */}
            <View
                style={[styles.loaderRingBase, { width: dim, height: dim, borderRadius: dim / 2 }]}
            >
                <Animated.View
                    style={[
                        styles.loaderArc,
                        {
                            width: dim,
                            height: dim,
                            borderRadius: dim / 2,
                            transform: [{ rotate: spin }],
                        },
                    ]}
                />
                {/* Pulsing core */}
                <Animated.View
                    style={[
                        styles.loaderCore,
                        {
                            width: dim * 0.44,
                            height: dim * 0.44,
                            borderRadius: (dim * 0.44) / 2,
                            transform: [{ scale: pulseAnim }],
                        },
                    ]}
                />
            </View>

            {/* Bouncing dots + optional label */}
            {size !== 'sm' && (
                <View style={styles.loaderFooter}>
                    {dotAnims.map((anim, i) => (
                        <Animated.View
                            key={i}
                            style={[
                                styles.bounceDot,
                                {
                                    opacity: anim,
                                    transform: [
                                        {
                                            translateY: anim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, -5],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        />
                    ))}
                    {label && <Text style={styles.loaderLabel}>{label}</Text>}
                </View>
            )}
        </Animated.View>
    );

    // Fullscreen overlay mode
    if (overlay) {
        return (
            <View style={styles.overlay} pointerEvents="auto">
                {loaderContent}
            </View>
        );
    }

    return loaderContent;
};

export default Loader;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(247,246,242,0.88)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
    },
    loaderWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
    },
    loaderRingBase: {
        borderWidth: 2.5,
        borderColor: Colors.primaryDim,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loaderArc: {
        position: 'absolute',
        borderWidth: 2.5,
        borderColor: Colors.transparent,
        borderTopColor: Colors.primary,
        borderRightColor: Colors.primaryDark,
    },
    loaderCore: {
        backgroundColor: Colors.primaryLight,
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        ...Shadows.primary,
    },
    loaderFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    bounceDot: {
        width: 5,
        height: 5,
        borderRadius: 999,
        backgroundColor: Colors.primary,
    },
    loaderLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.medium,
        color: Colors.charcoalLight,
        letterSpacing: Typography.wide,
        marginLeft: Spacing.xs,
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Usage
// ─────────────────────────────────────────────────────────────────────────────
//
// import Loader from '@/components/common/Loader';
//
// <Loader />                                 // default md, no label
// <Loader size="sm" />                       // small inline spinner
// <Loader size="lg" label="Fetching data" /> // large with label
// <Loader overlay label="Please wait…" />    // fullscreen frosted overlay

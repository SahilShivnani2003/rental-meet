import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, TAB_CENTER_SIZE } from '../../theme/theme';
import { TabConfig } from '../../types/TabConfig';

interface CenterTabProps {
    tab: TabConfig;
    isFocused: boolean;
    onPress: () => void;
    tabWidth: number;
    centerIcon?: string;
}

export default function CenterTab({
    tab,
    isFocused,
    onPress,
    tabWidth,
    centerIcon,
}: CenterTabProps) {
    const scale = useRef(new Animated.Value(1)).current;
    const ringScale = useRef(new Animated.Value(1)).current;
    const ringOp = useRef(new Animated.Value(0.6)).current;

    // Perpetual pulse ring
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(ringScale, {
                        toValue: 1.3,
                        duration: 1100,
                        useNativeDriver: true,
                    }),
                    Animated.timing(ringOp, { toValue: 0, duration: 1100, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(ringScale, { toValue: 1, duration: 0, useNativeDriver: true }),
                    Animated.timing(ringOp, { toValue: 0.6, duration: 0, useNativeDriver: true }),
                ]),
            ]),
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    // Focus spring
    useEffect(() => {
        Animated.spring(scale, {
            toValue: isFocused ? 1.12 : 1,
            useNativeDriver: true,
            speed: 24,
            bounciness: 12,
        }).start();
    }, [isFocused]);

    const handlePress = () => {
        Animated.sequence([
            Animated.timing(scale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
            Animated.spring(scale, {
                toValue: isFocused ? 1.12 : 1,
                useNativeDriver: true,
                speed: 20,
                bounciness: 14,
            }),
        ]).start();
        onPress();
    };

    const iconName = centerIcon ?? (isFocused ? tab.icon : tab.iconOff);

    return (
        <View style={[styles.tabItem, { width: tabWidth }]}>
            <View style={styles.centerOuter}>
                {/* Pulse ring */}
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.pingRing,
                        { transform: [{ scale: ringScale }], opacity: ringOp },
                    ]}
                />
                <TouchableOpacity onPress={handlePress} activeOpacity={1}>
                    <Animated.View
                        style={[
                            styles.centerButton,
                            isFocused && styles.centerButtonActive,
                            { transform: [{ scale }] },
                        ]}
                    >
                        <Ionicons name={iconName} size={26} color={Colors.white} />
                    </Animated.View>
                </TouchableOpacity>

                {/* Label beneath FAB */}
                {!isFocused ? <Text style={styles.centerLabel}>{tab.label}</Text> : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    tabItem: {
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        overflow: 'visible',
    },
    centerOuter: {
        alignItems: 'center',
        justifyContent: 'center',
        width: TAB_CENTER_SIZE + 20,
        height: TAB_CENTER_SIZE + 20,
        marginTop: -(TAB_CENTER_SIZE / 2 + 8),
        overflow: 'visible',
    },
    pingRing: {
        position: 'absolute',
        width: TAB_CENTER_SIZE + 16,
        height: TAB_CENTER_SIZE + 16,
        borderRadius: (TAB_CENTER_SIZE + 16) / 2,
        borderWidth: 1.5,
        borderColor: Colors.primaryGlow,
        backgroundColor: 'rgba(245,166,35,0.05)',
    },
    centerButton: {
        width: TAB_CENTER_SIZE,
        height: TAB_CENTER_SIZE,
        borderRadius: TAB_CENTER_SIZE / 2,
        backgroundColor: '#2E2A1E',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(245,166,35,0.18)',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.55,
        shadowRadius: 18,
        elevation: 18,
    },
    centerButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: 'rgba(255,255,255,0.28)',
        shadowColor: Colors.primary,
        shadowOpacity: 0.65,
        shadowRadius: 22,
    },
    centerLabel: {
        fontSize: Typography.xs,
        fontWeight: Typography.extraBold as any,
        color: Colors.white,
        letterSpacing: Typography.wide,
        textTransform: 'uppercase',
        marginTop: 4,
        opacity: 0.7,
    },
});

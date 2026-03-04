import React, { useRef, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Colors, Typography } from "../../theme/theme";
import { TabConfig } from "../../types/tabConfig";

interface RegularTabProps {
    tab: TabConfig;
    isFocused: boolean;
    onPress: () => void;
    tabWidth: number;
    badgeCount?: number;
}

export default function RegularTab({ tab, isFocused, onPress, tabWidth, badgeCount }: RegularTabProps) {
    const scale   = useRef(new Animated.Value(1)).current;
    const iconY   = useRef(new Animated.Value(0)).current;
    const labelOp = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
    const labelY  = useRef(new Animated.Value(isFocused ? 0 : 6)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scale,   { toValue: isFocused ? 1.18 : 1, useNativeDriver: true, speed: 28, bounciness: 10 }),
            Animated.spring(iconY,   { toValue: isFocused ? -4 : 0,   useNativeDriver: true, speed: 28 }),
            Animated.timing(labelOp, { toValue: isFocused ? 1 : 0,    duration: 200, useNativeDriver: true }),
            Animated.timing(labelY,  { toValue: isFocused ? 0 : 6,    duration: 200, useNativeDriver: true }),
        ]).start();
    }, [isFocused]);

    const showBadge = tab.badge && badgeCount !== undefined && badgeCount > 0;

    return (
        <View style={[styles.tabItem, { width: tabWidth }]}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.tabTouchable}>
                <Animated.View
                    style={{ transform: [{ scale }, { translateY: iconY }], alignItems: "center" }}
                >
                    <Ionicons
                        name={isFocused ? tab.icon : tab.iconOff}
                        size={22}
                        color={isFocused ? Colors.primary : Colors.charcoalWarm}
                    />
                    {showBadge && (
                        <View style={styles.badge}>
                            <Animated.Text style={styles.badgeText}>
                                {badgeCount! > 9 ? "9+" : String(badgeCount)}
                            </Animated.Text>
                        </View>
                    )}
                </Animated.View>

                <Animated.Text
                    style={[styles.tabLabel, { opacity: labelOp, transform: [{ translateY: labelY }] }]}
                >
                    {tab.label}
                </Animated.Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    tabItem: {
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
        overflow: "visible",
    },
    tabTouchable: {
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        paddingTop: 4,
        minWidth: 48,
        minHeight: 48,
    },
    tabLabel: {
        fontSize: Typography.xs,
        fontWeight: Typography.extraBold as any,
        color: Colors.primary,
        letterSpacing: Typography.wide,
        textTransform: "uppercase",
    },
    badge: {
        position: "absolute",
        top: -4,
        right: -6,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 3,
        borderWidth: 1.5,
        borderColor: Colors.tabBar,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: "800",
        color: Colors.white,
        lineHeight: 12,
    },
});
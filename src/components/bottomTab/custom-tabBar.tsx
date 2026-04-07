import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform, LayoutChangeEvent } from 'react-native';
import { Colors, TAB_BAR_HEIGHT } from '../../theme/theme';
import CenterTab from './center-tab';
import RegularTab from './regular-tab';
import ParticleBurst from './particle-burst';
import { TabConfig } from '../../types/TabConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Props ────────────────────────────────────────────────────────────────────
interface CustomTabBarProps {
    state: any;
    navigation: any;
    /** Tab descriptors in display order — must match the navigator's screen order */
    tabs: TabConfig[];
    /** Live badge counts keyed by route name, e.g. { messages: 3 } */
    badgeCounts?: Record<string, number>;
    /** Override icon shown inside the center FAB (defaults to tab's own icon) */
    centerIcon?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CustomTabBar({
    state,
    navigation,
    tabs,
    badgeCounts = {},
    centerIcon,
}: CustomTabBarProps) {
    const [barWidth, setBarWidth] = useState(SCREEN_WIDTH - 32);
    const [burstTrigger, setBurstTrigger] = useState(0);
    const [burstPos, setBurstPos] = useState({ x: 0, y: 0 });

    const tabWidth = barWidth / tabs.length;
    const orbX = useRef(new Animated.Value(0)).current;
    const orbScaleX = useRef(new Animated.Value(1)).current;

    // Index of the center FAB tab (auto-detected from config)
    const centerIndex = tabs.findIndex(t => t.center);

    // Animate the background glow orb when active tab changes
    useEffect(() => {
        const targetX = state.index * tabWidth + tabWidth / 2 - 26;
        Animated.parallel([
            Animated.spring(orbX, {
                toValue: targetX,
                useNativeDriver: true,
                speed: 16,
                bounciness: 7,
            }),
            Animated.sequence([
                Animated.timing(orbScaleX, { toValue: 1.6, duration: 100, useNativeDriver: true }),
                Animated.spring(orbScaleX, { toValue: 1, useNativeDriver: true, speed: 22 }),
            ]),
        ]).start();
    }, [state.index, tabWidth]);

    const fireParticles = (tabIndex: number) => {
        const cx = tabIndex * tabWidth + tabWidth / 2;
        const cy = TAB_BAR_HEIGHT / 2;
        setBurstPos({ x: cx, y: cy });
        setBurstTrigger(t => t + 1);
    };

    return (
        <View style={styles.outerWrapper}>
            <View
                style={styles.tabBar}
                onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)}
            >
                {/* ── Animated glow orb (hidden on center FAB) ── */}
                {state.index !== centerIndex && (
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            styles.glowOrb,
                            { transform: [{ translateX: orbX }, { scaleX: orbScaleX }] },
                        ]}
                    />
                )}

                {/* ── Top highlight line ── */}
                <View style={styles.innerLine} pointerEvents="none" />

                {/* ── Tabs ── */}
                {state.routes.map((route: any, index: number) => {
                    const tab = tabs.find(t => t.name === route.name);
                    if (!tab) return null;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });
                        if (!isFocused && !event.defaultPrevented) {
                            fireParticles(index);
                            navigation.navigate(route.name);
                        }
                    };

                    return tab.center ? (
                        <CenterTab
                            key={route.key}
                            tab={tab}
                            isFocused={isFocused}
                            onPress={onPress}
                            tabWidth={tabWidth}
                            centerIcon={centerIcon}
                        />
                    ) : (
                        <RegularTab
                            key={route.key}
                            tab={tab}
                            isFocused={isFocused}
                            onPress={onPress}
                            tabWidth={tabWidth}
                            badgeCount={badgeCounts[route.name]}
                        />
                    );
                })}

                {/* ── Particle burst layer (sits above everything, no pointer events) ── */}
                <ParticleBurst trigger={burstTrigger} x={burstPos.x} y={burstPos.y} />
            </View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    outerWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        overflow: 'visible',
    },
    tabBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.tabBar,
        width: SCREEN_WIDTH - 32,
        height: TAB_BAR_HEIGHT,
        borderRadius: 38,
        marginBottom: Platform.OS === 'ios' ? 30 : 18,
        overflow: 'visible',
        borderWidth: 1,
        borderColor: Colors.tabBarBorder,
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.6,
        shadowRadius: 40,
        elevation: 28,
    },
    glowOrb: {
        position: 'absolute',
        top: TAB_BAR_HEIGHT / 2 - 26,
        left: 0,
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: Colors.primaryDim,
        borderWidth: 1,
        borderColor: Colors.primaryGlow,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 18,
        elevation: 16,
        zIndex: 0,
    },
    innerLine: {
        position: 'absolute',
        top: 0,
        left: 32,
        right: 32,
        height: 1,
        backgroundColor: 'rgba(245,166,35,0.08)',
        borderRadius: 1,
    },
});

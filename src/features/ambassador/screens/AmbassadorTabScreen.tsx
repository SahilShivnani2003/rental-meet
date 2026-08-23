import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Easing } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Typography, Radii, Shadows } from '@/theme/theme';
import AmbassadorLeaderboardScreen from '../components/AmbassadorLeaderboardScreen';
import ChallengesPowerStreaksScreen from '../components/ChallengesPowerStreakScreen';
import EarningsWalletScreen from '../components/EarningWalletScreen';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { AmbassadorTabParamList } from '@/navigations/tabNavigations/AmbassadorTabNavigation';

// ── Types ─────────────────────────────────────────────────────────────────────
export type AmbassadorTopTabParamList = {
    Wallet: undefined;
    Challenges: undefined;
    Leaderboard: undefined;
};

type TabRouteName = keyof AmbassadorTopTabParamList;

// Ordered list drives both the tab bar and swipe navigation, replacing what
// Tab.Navigator + Tab.Screen used to declare.
const TAB_ROUTES: { name: TabRouteName; component: React.ComponentType<any> }[] = [
    { name: 'Wallet', component: EarningsWalletScreen },
    { name: 'Challenges', component: ChallengesPowerStreaksScreen },
    { name: 'Leaderboard', component: AmbassadorLeaderboardScreen },
];

// Per-route icon + accent so each pill has its own identity when active,
// rather than every tab just turning the same shade of primary.
const TAB_META: Record<
    string,
    { activeIcon: string; inactiveIcon: string; label: string; accentBg: string }
> = {
    Wallet: {
        activeIcon: 'wallet',
        inactiveIcon: 'wallet-outline',
        label: 'Wallet',
        accentBg: Colors.primary,
    },
    Challenges: {
        activeIcon: 'flash',
        inactiveIcon: 'flash-outline',
        label: 'Challenges',
        accentBg: Colors.warning,
    },
    Leaderboard: {
        activeIcon: 'trophy',
        inactiveIcon: 'trophy-outline',
        label: 'Leaderboard',
        accentBg: '#7C3AED',
    },
};

function Pressy({
    onPress,
    style,
    children,
}: {
    onPress?: () => void;
    style?: any;
    children: React.ReactNode;
}) {
    const scale = useRef(new Animated.Value(1)).current;
    return (
        <Animated.View style={[{ transform: [{ scale }] }, styles.pillFlex]}>
            <TouchableOpacity
                style={style}
                onPress={onPress}
                activeOpacity={1}
                onPressIn={() =>
                    Animated.spring(scale, {
                        toValue: 0.95,
                        useNativeDriver: true,
                        speed: 30,
                    }).start()
                }
                onPressOut={() =>
                    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22 }).start()
                }
            >
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
}

function AmbassadorTabBar({
    activeIndex,
    onChangeIndex,
}: {
    activeIndex: number;
    onChangeIndex: (index: number) => void;
}) {
    return (
        <View style={styles.tabBarRow}>
            {TAB_ROUTES.map((route, index) => {
                const meta = TAB_META[route.name] ?? TAB_META.Wallet;
                const isFocused = activeIndex === index;

                return (
                    <Pressy
                        key={route.name}
                        onPress={() => onChangeIndex(index)}
                        style={[
                            styles.tabPill,
                            isFocused && {
                                backgroundColor: meta.accentBg,
                                borderColor: meta.accentBg,
                                ...Shadows.primary,
                            },
                        ]}
                    >
                        <Ionicons
                            name={isFocused ? meta.activeIcon : meta.inactiveIcon}
                            size={16}
                            color={isFocused ? Colors.white : Colors.charcoalLight}
                        />
                        <Text
                            style={[
                                styles.tabPillLabel,
                                { color: isFocused ? Colors.white : Colors.charcoalMid },
                            ]}
                        >
                            {meta.label}
                        </Text>
                    </Pressy>
                );
            })}
        </View>
    );
}

// ── Screen ────────────────────────────────────────────────────────────────────
type AmbassadorTopTabScreenProps = NativeBottomTabScreenProps<AmbassadorTabParamList, 'statics'>;
export default function AmbassadorTabsScreen({ navigation }: AmbassadorTopTabScreenProps) {
    
    const headerFade = useRef(new Animated.Value(0)).current;
    const heroSlide = useRef(new Animated.Value(-16)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(heroSlide, {
                toValue: 0,
                useNativeDriver: true,
                speed: 16,
                bounciness: 6,
            }),
        ]).start();
    }, []);

   
    const [activeIndex, setActiveIndex] = useState(0);
    const contentOpacity = useRef(new Animated.Value(1)).current;
    const contentTranslate = useRef(new Animated.Value(0)).current;
    const contentScale = useRef(new Animated.Value(1)).current;

    const goToIndex = (nextIndex: number, direction: 1 | -1 = 1) => {
        if (nextIndex < 0 || nextIndex >= TAB_ROUTES.length || nextIndex === activeIndex) return;

        // Ease out to a near-invisible, slightly settled state — slow enough
        // to read as intentional rather than a flicker.
        Animated.timing(contentOpacity, {
            toValue: 0,
            duration: 160,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        }).start(() => {
            setActiveIndex(nextIndex);
            contentTranslate.setValue(8 * direction);
            contentScale.setValue(0.985);

            // Ease back in as one smooth, decelerating motion — no spring
            // overshoot, so it settles rather than bounces.
            Animated.parallel([
                Animated.timing(contentOpacity, {
                    toValue: 1,
                    duration: 320,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(contentTranslate, {
                    toValue: 0,
                    duration: 320,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(contentScale, {
                    toValue: 1,
                    duration: 320,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();
        });
    };

    const ActiveScreen = TAB_ROUTES[activeIndex].component;

    return (
        <View style={styles.container}>
            {/* ── Header ────────────────────────────────────────────────────── */}
            <Animated.View
                style={[
                    styles.header,
                    { opacity: headerFade, transform: [{ translateY: heroSlide }] },
                ]}
            >
                <View style={styles.headerAccentBar} />
                <View style={styles.headerContent}>
                    <Text style={styles.headerEyebrow}>AMBASSADOR PORTAL</Text>
                    <Text style={styles.headerTitle}>Wallet & Rewards</Text>
                    <Text style={styles.headerSubtitle}>
                        Track earnings, streaks, and where you rank
                    </Text>
                </View>
            </Animated.View>

            {/* ── Custom top tabs ──────────────────────────────────────────────
                The tab bar floats freely on the background (no enclosing
                card/border) directly below the header, and the content pane
                below it crossfades in place without any navigator dependency. */}
            <View style={styles.tabsContainer}>
                <AmbassadorTabBar
                    activeIndex={activeIndex}
                    onChangeIndex={i => goToIndex(i, i > activeIndex ? 1 : -1)}
                />

                <Animated.View
                    style={[
                        styles.contentPane,
                        {
                            opacity: contentOpacity,
                            transform: [{ translateX: contentTranslate }, { scale: contentScale }],
                        },
                    ]}
                >
                    <ActiveScreen />
                </Animated.View>
            </View>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        marginBottom: Spacing.xxl *3,
    },
    tabsContainer: {
        flex: 1,
    },
    contentPane: {
        flex: 1,
    },

    // ── Header ── (matches the accent-bar + eyebrow + title pattern used
    // across GuestProfile / Ambassador Bookings / My Listed Venues / Profile)
    header: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        ...Shadows.header,
        zIndex: 10,
    },
    headerAccentBar: { height: 4, backgroundColor: Colors.primary },
    headerContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.lg,
    },
    headerEyebrow: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: Typography.wider,
        marginBottom: Spacing.xxs,
    },
    headerTitle: {
        fontSize: Typography.xxl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
    },
    headerSubtitle: {
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
        marginTop: 2,
    },

    // ── Segmented tab bar ── (no enclosing box — pills sit directly on
    // the screen background)
    tabBarRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    pillFlex: { flex: 1 },
    tabPill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 42,
        borderRadius: Radii.full,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tabPillLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
    },
});

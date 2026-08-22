import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Typography, Radii } from '@/theme/theme';
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

const Tab = createMaterialTopTabNavigator<AmbassadorTopTabParamList>();

// ── Tab icon + label ──────────────────────────────────────────────────────────

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => (
    <Ionicons
        name={name}
        size={16}
        color={focused ? Colors.primary : Colors.charcoalLight}
        style={{ marginRight: Spacing.xxs }}
    />
);

// ── Screen ────────────────────────────────────────────────────────────────────
type AmbassadorTopTabScreenProps = NativeBottomTabScreenProps<AmbassadorTabParamList, 'statics'>
export default function AmbassadorTabsScreen({navigation}: AmbassadorTopTabScreenProps) {
    return (
        <View style={styles.container}>
            <Tab.Navigator
                initialRouteName="Wallet"
                screenOptions={{
                    tabBarActiveTintColor: Colors.primary,
                    tabBarInactiveTintColor: Colors.charcoalLight,
                    tabBarPressColor: Colors.primaryDim,
                    tabBarIndicatorStyle: styles.indicator,
                    tabBarIndicatorContainerStyle: styles.indicatorContainer,
                    tabBarStyle: styles.tabBar,
                    tabBarItemStyle: styles.tabItem,
                    tabBarLabelStyle: styles.tabLabel,
                    tabBarShowIcon: true,
                    tabBarScrollEnabled: false,
                }}
            >
                <Tab.Screen
                    name="Wallet"
                    component={EarningsWalletScreen}
                    options={{
                        tabBarLabel: 'Wallet',
                        tabBarIcon: ({ focused }) => (
                            <TabIcon name="wallet-outline" focused={focused} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Challenges"
                    component={ChallengesPowerStreaksScreen}
                    options={{
                        tabBarLabel: 'Challenges',
                        tabBarIcon: ({ focused }) => (
                            <TabIcon name="flash-outline" focused={focused} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Leaderboard"
                    component={AmbassadorLeaderboardScreen}
                    options={{
                        tabBarLabel: 'Leaderboard',
                        tabBarIcon: ({ focused }) => (
                            <TabIcon name="trophy-outline" focused={focused} />
                        ),
                    }}
                />
            </Tab.Navigator>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    tabBar: {
        backgroundColor: Colors.surface,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tabItem: {
        flexDirection: 'row',
        width: 'auto',
        paddingHorizontal: Spacing.md,
    },
    tabLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        textTransform: 'none',
        letterSpacing: Typography.normal,
    },
    indicator: {
        backgroundColor: Colors.primary,
        height: 3,
        borderRadius: Radii.full,
    },
    indicatorContainer: {
        marginHorizontal: Platform.OS === 'ios' ? Spacing.sm : 0,
    },
});

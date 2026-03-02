import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme/theme';
import { RootStackParamList } from '../../navigations/RootNavigation';

const MOCK_USER = {
    name: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    userType: 'owner',
};

const USER_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> =
    {
        client: { label: 'Client', icon: 'person', color: Colors.info, bg: Colors.infoLight },
        owner: {
            label: 'Space Owner',
            icon: 'business',
            color: Colors.primary,
            bg: Colors.primaryLight,
        },
        vendor: {
            label: 'Service Vendor',
            icon: 'construct',
            color: Colors.success,
            bg: Colors.successLight,
        },
    };

// ─── Menu item ────────────────────────────────────────────────────────────────
function MenuItem({ item }: { item: any }) {
    const scale = useRef(new Animated.Value(1)).current;
    const onPressIn = () =>
        Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
    const onPressOut = () =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22 }).start();

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                style={styles.menuItem}
                onPress={item.onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={1}
            >
                <View style={styles.menuItemLeft}>
                    <View
                        style={[
                            styles.menuIconWrap,
                            { backgroundColor: item.iconBg ?? Colors.primaryLight },
                        ]}
                    >
                        <Ionicons
                            name={item.icon}
                            size={20}
                            color={item.iconColor ?? Colors.primary}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.menuItemTitle}>{item.title}</Text>
                        {item.subtitle ? (
                            <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                        ) : null}
                    </View>
                </View>
                <View style={styles.menuChevronWrap}>
                    <Ionicons name="chevron-forward" size={16} color={Colors.border} />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Menu section ─────────────────────────────────────────────────────────────
function MenuSection({ title, items }: { title: string; items: any[] }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionLabel}>{title}</Text>
            <View style={styles.sectionCard}>
                {items.map((item, i) => (
                    <View key={item.id}>
                        <MenuItem item={item} />
                        {i < items.length - 1 && <View style={styles.menuDivider} />}
                    </View>
                ))}
            </View>
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }: any) {
    const user = MOCK_USER;
    const typeCfg = USER_TYPE_CONFIG[user.userType] ?? USER_TYPE_CONFIG.client;
    const initials = user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase();

    const handleLogout = () => {
        Alert.alert(
            'Log out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log out',
                    style: 'destructive',
                    onPress: () => navigation.replace('login'),
                },
            ],
            { cancelable: true },
        );
    };

    const accountItems = [
        user.userType === 'owner' && {
            id: 'my-venues',
            icon: 'business-outline',
            iconColor: Colors.primary,
            iconBg: Colors.primaryLight,
            title: 'My Venues',
            subtitle: 'Manage your listed spaces',
            onPress: () => console.log('Navigate to /my-venues'),
        },
        user.userType === 'vendor' && {
            id: 'my-services',
            icon: 'construct-outline',
            iconColor: Colors.success,
            iconBg: Colors.successLight,
            title: 'My Services',
            subtitle: 'Manage your offered services',
            onPress: () => console.log('Navigate to /my-services'),
        },
        {
            id: 'edit-profile',
            icon: 'person-circle-outline',
            iconColor: Colors.primary,
            iconBg: Colors.primaryLight,
            title: 'Edit Profile',
            subtitle: 'Update your personal info',
            onPress: () => Alert.alert('Coming Soon', 'Edit profile is coming soon.'),
        },
        {
            id: 'payment',
            icon: 'card-outline',
            iconColor: Colors.info,
            iconBg: Colors.infoLight,
            title: 'Payment Methods',
            subtitle: 'Cards & billing info',
            onPress: () => Alert.alert('Coming Soon', 'Payment methods coming soon.'),
        },
    ].filter(Boolean) as any[];

    const preferenceItems = [
        {
            id: 'notifications',
            icon: 'notifications-outline',
            iconColor: Colors.warning,
            iconBg: Colors.warningLight,
            title: 'Notifications',
            subtitle: 'Alerts & reminders',
            onPress: () => Alert.alert('Coming Soon', 'Notifications coming soon.'),
        },
        {
            id: 'help',
            icon: 'help-circle-outline',
            iconColor: Colors.charcoalLight,
            iconBg: Colors.border,
            title: 'Help & Support',
            subtitle: 'support@rentalmeet.com',
            onPress: () => Alert.alert('Help', 'Contact us at support@rentalmeet.com'),
        },
        {
            id: 'about',
            icon: 'information-circle-outline',
            iconColor: Colors.charcoalLight,
            iconBg: Colors.border,
            title: 'About RentalMeet',
            subtitle: 'Version 1.0.0',
            onPress: () =>
                Alert.alert('RentalMeet', 'Version 1.0.0\n\nBook your perfect space with ease.'),
        },
    ];

    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <View style={styles.headerAccentBar} />
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerEyebrow}>ACCOUNT</Text>
                        <Text style={styles.headerTitle}>Profile</Text>
                    </View>
                    <TouchableOpacity style={styles.settingsBtn}>
                        <Ionicons name="settings-outline" size={20} color={Colors.charcoal} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentPadding}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Profile card ── */}
                <View style={styles.profileCard}>
                    {/* Amber banner */}
                    <View style={styles.profileBanner} />

                    <View style={styles.profileContent}>
                        {/* Avatar */}
                        <View style={styles.avatarWrapper}>
                            <View style={styles.avatarRing}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarInitials}>{initials}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.cameraBtn}>
                                <Ionicons name="camera" size={14} color={Colors.white} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>

                        <View style={[styles.typeBadge, { backgroundColor: typeCfg.bg }]}>
                            <Ionicons name={typeCfg.icon as any} size={13} color={typeCfg.color} />
                            <Text style={[styles.typeBadgeText, { color: typeCfg.color }]}>
                                {typeCfg.label}
                            </Text>
                        </View>

                        {/* Stats */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNum}>12</Text>
                                <Text style={styles.statLabel}>Bookings</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statNum}>5</Text>
                                <Text style={styles.statLabel}>Favorites</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statNum}>4.9</Text>
                                <Text style={styles.statLabel}>Rating</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <MenuSection title="ACCOUNT" items={accountItems} />
                <MenuSection title="PREFERENCES" items={preferenceItems} />

                {/* Logout */}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <View style={styles.logoutIconWrap}>
                        <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
                    </View>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>RentalMeet v1.0.0</Text>
            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    // Header
    header: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        paddingBottom: Spacing.xl,
        ...Shadows.header,
    },
    headerAccentBar: { height: 4, backgroundColor: Colors.primary },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
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
    settingsBtn: {
        width: 46,
        height: 46,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Content
    content: { flex: 1 },
    contentPadding: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: 120 },

    // Profile card — no overflow:hidden so avatar ring isn't clipped
    profileCard: {
        backgroundColor: Colors.surface,
        borderRadius: 24,
        marginBottom: Spacing.xl,
        ...Shadows.card,
    },

    // Amber banner — matches brand primary
    profileBanner: {
        height: 72,
        backgroundColor: Colors.primaryLight,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomLeftRadius: 48,
        borderBottomRightRadius: 48,
    },

    profileContent: {
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: 24,
        marginTop: -44,
    },

    // Avatar
    avatarWrapper: { position: 'relative', marginBottom: 14 },
    avatarRing: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 3,
        borderColor: Colors.primary,
        padding: 3,
        backgroundColor: Colors.surface,
    },
    avatar: {
        flex: 1,
        borderRadius: 44,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitials: {
        fontSize: 28,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 1,
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.charcoal,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.surface,
    },

    // User info
    userName: {
        fontSize: 22,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        fontWeight: Typography.regular,
        marginBottom: 12,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: Radii.full,
        marginBottom: Spacing.xl,
    },
    typeBadgeText: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        letterSpacing: Typography.normal,
    },

    // Stats strip — warm background from theme
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: Radii.lg,
        paddingVertical: 14,
        paddingHorizontal: Spacing.sm,
        width: '100%',
    },
    statItem: { flex: 1, alignItems: 'center', gap: 3 },
    statNum: {
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    statLabel: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    statDivider: { width: 1, height: 32, backgroundColor: Colors.border },

    // Menu sections
    section: { marginBottom: Spacing.lg },
    sectionLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 2,
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.xxs,
    },
    sectionCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: 14,
    },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
    menuIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuItemTitle: {
        fontSize: 15,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginBottom: 2,
    },
    menuItemSubtitle: { fontSize: 12, color: Colors.charcoalLight, fontWeight: Typography.regular },
    menuChevronWrap: {
        width: 28,
        height: 28,
        borderRadius: Spacing.sm,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuDivider: { height: 1, backgroundColor: Colors.background, marginLeft: 72 },

    // Logout
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        paddingVertical: Spacing.lg,
        marginBottom: Spacing.lg,
        borderWidth: 1.5,
        borderColor: Colors.dangerLight,
        shadowColor: Colors.danger,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    logoutIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: Colors.dangerLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutText: {
        fontSize: 15,
        fontWeight: Typography.bold,
        color: Colors.danger,
        letterSpacing: Typography.normal,
    },

    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: Colors.border,
        fontWeight: Typography.regular,
    },
});

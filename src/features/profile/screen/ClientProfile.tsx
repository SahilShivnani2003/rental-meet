import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Animated,
    Dimensions,
    RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAlert } from '@/context/AlertContext';
import { Booking } from '@/features/booking/types/Booking';
import { ClientTabParamList } from '@/navigations/tabNavigations/ClientTabNavigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors, Spacing, Radii, Shadows, Typography } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import useEntrance from '@/hooks/useEntrance';
import { useGetMyProfile } from '../hooks/useGetMyProfile';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { useChangePassword } from '../hooks/useChangePassword';
import { useUploadKycDoc } from '../hooks/useUploadkycDoc';
import { useGetAllBookings } from '@/features/booking/hooks/useGetAllbookings';
import { User } from '../types/User';
import ChangePasswordModal from '../models/ChangePasswordModal';
import EditProfileModal from '../models/EditProfileModal';
import KycUploadModal from '../models/KycUploadModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Role → display config ─────────────────────────────────────────────────────
// Keys match User.role union values exactly
const USER_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> =
    {
        customer: { label: 'Customer', icon: 'person', color: Colors.info, bg: Colors.infoLight },
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
        admin: { label: 'Admin', icon: 'shield', color: Colors.warning, bg: Colors.warningLight },
        subadmin: {
            label: 'Sub Admin',
            icon: 'shield-half',
            color: Colors.warning,
            bg: Colors.warningLight,
        },
        employee: {
            label: 'Employee',
            icon: 'briefcase',
            color: Colors.charcoalLight,
            bg: Colors.border,
        },
    };
const DEFAULT_TYPE_CFG = USER_TYPE_CONFIG.customer;

// ── Types ─────────────────────────────────────────────────────────────────────
type StatItem = {
    id: string;
    label: string;
    value: number;
    icon: string;
    color: string;
    bg: string;
};

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ stat, index }: { stat: StatItem; index: number }) {
    const { fade, slide } = useEntrance(320 + index * 60);
    return (
        <Animated.View
            style={[styles.statCard, { opacity: fade, transform: [{ translateY: slide }] }]}
        >
            <View style={[styles.statIconWrap, { backgroundColor: stat.bg }]}>
                <Ionicons name={stat.icon as any} size={17} color={stat.color} />
            </View>
            <Text style={[styles.statNum, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
        </Animated.View>
    );
}

// ── Menu item ─────────────────────────────────────────────────────────────────
function MenuItem({ item }: { item: any }) {
    const scale = useRef(new Animated.Value(1)).current;
    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                style={styles.menuItem}
                onPress={item.onPress}
                onPressIn={() =>
                    Animated.spring(scale, {
                        toValue: 0.97,
                        useNativeDriver: true,
                        speed: 30,
                    }).start()
                }
                onPressOut={() =>
                    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22 }).start()
                }
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

// ── Menu section ──────────────────────────────────────────────────────────────
function MenuSection({ title, items }: { title: string; items: any[] }) {
    return (
        <View style={styles.menuSection}>
            <Text style={styles.menuSectionLabel}>{title}</Text>
            <View style={styles.menuSectionCard}>
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

// ── Screen ────────────────────────────────────────────────────────────────────
type clientProfileProps = NativeBottomTabScreenProps<ClientTabParamList, 'profile'>;

export default function ClientProfile({ navigation }: clientProfileProps) {
    // ── Profile data ──────────────────────────────────────────────────────────
    const {
        data: userData,
        isLoading: profileLoading,
        refetch: refetchProfile,
    } = useGetMyProfile();
    const user: Partial<User> = userData?.user ?? {};
    const typeCfg = USER_TYPE_CONFIG[user.role ?? ''] ?? DEFAULT_TYPE_CFG;
    const initials = user.name?.trim().slice(0, 2).toUpperCase() ?? '??';
    const { isAuthenticated } = useAuthStore();
    // ── Bookings data ─────────────────────────────────────────────────────────
    const {
        data: bookingData,
        isLoading: bookingsLoading,
        isRefetching: bookingsRefetching,
        refetch: refetchBookings,
    } = useGetAllBookings({
        enabled: isAuthenticated,
    });
    const bookings: Booking[] = bookingData?.bookings ?? [];

    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([refetchProfile(), refetchBookings()]);
        setIsRefreshing(false);
    };
    // ── Mutation hooks — passed down to modals ────────────────────────────────
    const { mutate: updateUser } = useUpdateProfile();
    const { mutate: changePassword } = useChangePassword();
    const { mutate: uploadKycDoc } = useUploadKycDoc();

    const alert = useAlert();
    const { logOut } = useAuthStore();

    // ── Modal visibility ──────────────────────────────────────────────────────
    const [editProfileVisible, setEditProfileVisible] = useState(false);
    const [changePasswordVisible, setChangePasswordVisible] = useState(false);
    const [kycVisible, setKycVisible] = useState(false);

    // ── Animations ────────────────────────────────────────────────────────────
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

    // ── Stats derived from API bookings ───────────────────────────────────────
    const stats: StatItem[] = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = bookings.filter(b => {
            const d = new Date(b.bookingDate);
            d.setHours(0, 0, 0, 0);
            return (b.status === 'confirmed' || b.status === 'pending') && d >= today;
        }).length;
        const completed = bookings.filter(b => b.status === 'completed').length;
        const cancelled = bookings.filter(b => b.status === 'cancelled').length;

        return [
            {
                id: 'total',
                label: 'Total',
                value: bookings.length,
                icon: 'calendar',
                color: Colors.info,
                bg: Colors.infoLight,
            },
            {
                id: 'upcoming',
                label: 'Upcoming',
                value: upcoming,
                icon: 'time',
                color: Colors.primary,
                bg: Colors.primaryLight,
            },
            {
                id: 'done',
                label: 'Completed',
                value: completed,
                icon: 'checkmark-circle',
                color: Colors.success,
                bg: Colors.successLight,
            },
            {
                id: 'cancel',
                label: 'Cancelled',
                value: cancelled,
                icon: 'close-circle',
                color: Colors.danger,
                bg: Colors.dangerLight,
            },
        ];
    }, [bookings]);

    // ── Logout ────────────────────────────────────────────────────────────────
    const handleLogout = () => {
        alert.show({
            type: 'confirm',
            title: 'Log Out',
            message: 'Are you sure you want to log out?',
            buttons: [
                { label: 'Cancel', onPress: alert.dismiss, style: 'ghost' },
                {
                    label: 'Log Out',
                    onPress: async () => {
                        navigation
                            .getParent<NativeStackNavigationProp<RootStackParamList>>()
                            .reset({ index: 0, routes: [{ name: 'login' }] });
                        await logOut();
                        alert.dismiss();
                    },
                },
            ],
        });
    };

    // ── Menu items ────────────────────────────────────────────────────────────
    const quickActions = [
        {
            id: 'bookings',
            icon: 'calendar',
            iconColor: Colors.primary,
            iconBg: Colors.primaryLight,
            title: 'My Bookings',
            subtitle: 'View & manage',
            onPress: () => navigation.navigate('bookings'),
        },
        {
            id: 'browse-venues',
            icon: 'search',
            iconColor: Colors.primary,
            iconBg: Colors.primaryLight,
            title: 'Browse Venues',
            subtitle: 'Find your perfect space',
            onPress: () => navigation.navigate('venues'),
        },
    ];

    const accountItems = [
        {
            id: 'edit-profile',
            icon: 'person-circle-outline',
            iconColor: Colors.primary,
            iconBg: Colors.primaryLight,
            title: 'Edit Profile',
            subtitle: 'Update your personal info',
            onPress: () => setEditProfileVisible(true),
        },
        {
            id: 'change-password',
            icon: 'lock-closed-outline',
            iconColor: Colors.warning,
            iconBg: Colors.warningLight,
            title: 'Change Password',
            subtitle: 'Update your password',
            onPress: () => setChangePasswordVisible(true),
        },
        {
            id: 'kyc',
            icon: 'document-text-outline',
            iconColor: Colors.info,
            iconBg: Colors.infoLight,
            title: 'KYC Documents',
            subtitle: user.kyc?.verifiedAt ? 'Verified ✓' : 'Upload to verify',
            onPress: () => setKycVisible(true),
        },
    ];

    const preferenceItems = [
        {
            id: 'notifications',
            icon: 'notifications-outline',
            iconColor: Colors.warning,
            iconBg: Colors.warningLight,
            title: 'Notifications',
            subtitle: 'Alerts & reminders',
            onPress: () => alert.info('Comming soon', 'Notification feature comming soon.'),
        },
        {
            id: 'help',
            icon: 'help-circle-outline',
            iconColor: Colors.charcoalLight,
            iconBg: Colors.border,
            title: 'Help & Support',
            subtitle: 'support@rentalmeet.com',
            onPress: () => alert.info('Help', 'Contact us at support@rentalmeet.com'),
        },
        {
            id: 'about',
            icon: 'information-circle-outline',
            iconColor: Colors.charcoalLight,
            iconBg: Colors.border,
            title: 'About RentalMeet',
            subtitle: 'Version 1.0.0',
            onPress: () =>
                alert.info('RentalMeet', 'Version 1.0.0\n\nBook your perfect space with ease.'),
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            {/* Header */}
            <Animated.View
                style={[
                    styles.header,
                    { opacity: headerFade, transform: [{ translateY: heroSlide }] },
                ]}
            >
                <View style={styles.headerAccentBar} />
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerEyebrow}>ACCOUNT</Text>
                        <Text style={styles.headerTitle}>Profile</Text>
                    </View>
                </View>
            </Animated.View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentPadding}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={[Colors.primary]} // Android
                        tintColor={Colors.primary} // iOS
                    />
                }
            >
                {/* Profile card */}
                <Animated.View style={[styles.profileCard, { opacity: headerFade }]}>
                    <View style={styles.profileBanner} />
                    <View style={styles.profileContent}>
                        <View style={styles.avatarWrapper}>
                            <View style={styles.avatarRing}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarInitials}>{initials}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.cameraBtn}
                                onPress={() => setEditProfileVisible(true)}
                            >
                                <Ionicons name="camera" size={14} color={Colors.white} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.userName}>{user.name ?? '—'}</Text>
                        <Text style={styles.userEmail}>{user.email ?? '—'}</Text>

                        <View style={styles.memberBadge}>
                            <View style={styles.memberDot} />
                            <Text style={styles.memberText}>
                                {(user.role ?? 'member').toUpperCase()}
                            </Text>
                        </View>

                        <View style={[styles.typeBadge, { backgroundColor: typeCfg.bg }]}>
                            <Ionicons name={typeCfg.icon as any} size={13} color={typeCfg.color} />
                            <Text style={[styles.typeBadgeText, { color: typeCfg.color }]}>
                                {typeCfg.label}
                            </Text>
                        </View>

                        {user.kyc?.verifiedAt && (
                            <View style={styles.kycBadge}>
                                <Ionicons
                                    name="shield-checkmark"
                                    size={12}
                                    color={Colors.success}
                                />
                                <Text style={styles.kycBadgeText}>KYC Verified</Text>
                            </View>
                        )}
                    </View>
                </Animated.View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    {stats.map((stat, i) => (
                        <StatCard key={stat.id} stat={stat} index={i} />
                    ))}
                </View>

                <MenuSection title="QUICK ACTIONS" items={quickActions} />
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

            {/* ── Modals ── */}
            <EditProfileModal
                visible={editProfileVisible}
                onClose={() => setEditProfileVisible(false)}
                user={user}
                mutate={updateUser}
            />
            <ChangePasswordModal
                visible={changePasswordVisible}
                onClose={() => setChangePasswordVisible(false)}
                mutate={changePassword}
            />
            <KycUploadModal
                visible={kycVisible}
                onClose={() => setKycVisible(false)}
                mutate={uploadKycDoc}
                existingKyc={user.kyc}
            />
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const STAT_W = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 3) / 4;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        paddingBottom: Spacing.xl,
        ...Shadows.header,
        zIndex: 10,
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
    content: { flex: 1 },
    contentPadding: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: 120 },
    profileCard: {
        backgroundColor: Colors.surface,
        borderRadius: 24,
        marginBottom: Spacing.xl,
        ...Shadows.card,
    },
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
        marginBottom: 10,
    },
    memberBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'center',
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        marginBottom: 10,
    },
    memberDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
    memberText: {
        fontSize: 9,
        fontWeight: Typography.extraBold,
        color: Colors.primaryDark,
        letterSpacing: 1.2,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: Radii.full,
        marginBottom: 8,
    },
    typeBadgeText: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        letterSpacing: Typography.normal,
    },
    kycBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.successLight,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radii.full,
    },
    kycBadgeText: { fontSize: 11, fontWeight: Typography.bold, color: Colors.success },
    statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    statCard: {
        width: STAT_W,
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: 10,
        alignItems: 'center',
        gap: 4,
        ...Shadows.card,
    },
    statIconWrap: {
        width: 34,
        height: 34,
        borderRadius: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    statNum: { fontSize: 20, fontWeight: Typography.extraBold, letterSpacing: -1 },
    statLabel: {
        fontSize: 9.5,
        color: Colors.charcoalLight,
        fontWeight: Typography.semiBold,
        textAlign: 'center',
    },
    menuSection: { marginBottom: Spacing.lg },
    menuSectionLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 2,
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.xxs,
    },
    menuSectionCard: {
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

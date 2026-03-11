import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Animated,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme/theme';
import { useAlert } from '../../context/AlertContext';
import { useAuthStore } from '../../store/auth-store';
import {
    NativeBottomTabBarProps,
    NativeBottomTabScreenProps,
} from '@react-navigation/bottom-tabs/unstable';
import { ClientTabParamList } from '../../navigations/tabNavigations/ClientTabNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigations/RootNavigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_USER = {
    name: 'Alex Johnson',
    firstName: 'Alex',
    email: 'alex.johnson@email.com',
    userType: 'owner',
    role: 'PREMIUM MEMBER',
    initials: 'AJ',
};

const USER_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> =
    {
        client: {
            label: 'Client',
            icon: 'person',
            color: Colors.info,
            bg: Colors.infoLight,
        },
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

const STATS = [
    {
        id: 'total',
        label: 'Total',
        value: 12,
        icon: 'calendar',
        color: Colors.info,
        bg: Colors.infoLight,
    },
    {
        id: 'upcoming',
        label: 'Upcoming',
        value: 3,
        icon: 'time',
        color: Colors.primary,
        bg: Colors.primaryLight,
    },
    {
        id: 'done',
        label: 'Completed',
        value: 8,
        icon: 'checkmark-circle',
        color: Colors.success,
        bg: Colors.successLight,
    },
    {
        id: 'cancel',
        label: 'Cancelled',
        value: 1,
        icon: 'close-circle',
        color: Colors.danger,
        bg: Colors.dangerLight,
    },
];

const RECENT_BOOKINGS = [
    {
        id: '1',
        venue: 'The Grand Hall',
        date: 'Mar 20, 2026',
        time: '10:00 AM – 2:00 PM',
        amount: 450,
        status: 'confirmed',
    },
    {
        id: '2',
        venue: 'Studio Loft',
        date: 'Mar 25, 2026',
        time: '2:00 PM – 6:00 PM',
        amount: 175,
        status: 'pending',
    },
    {
        id: '3',
        venue: 'Rooftop Lounge',
        date: 'Feb 10, 2026',
        time: '6:00 PM – 10:00 PM',
        amount: 300,
        status: 'completed',
    },
];

const STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
    confirmed: {
        color: Colors.success,
        bg: Colors.successLight,
        label: 'Confirmed',
    },
    pending: {
        color: Colors.warning,
        bg: Colors.warningLight,
        label: 'Pending',
    },
    completed: {
        color: Colors.info,
        bg: Colors.infoLight,
        label: 'Completed',
    },
    cancelled: {
        color: Colors.danger,
        bg: Colors.dangerLight,
        label: 'Cancelled',
    },
};

// ── Entrance animation hook ───────────────────────────────────────────────────
function useEntrance(delay: number) {
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(20)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, {
                toValue: 1,
                delay,
                duration: 320,
                useNativeDriver: true,
            }),
            Animated.spring(slide, {
                toValue: 0,
                delay,
                useNativeDriver: true,
                speed: 18,
                bounciness: 7,
            }),
        ]).start();
    }, []);
    return { fade, slide };
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ stat, index }: { stat: (typeof STATS)[0]; index: number }) {
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

// ── Booking row ───────────────────────────────────────────────────────────────
function BookingRow({ item, index }: { item: (typeof RECENT_BOOKINGS)[0]; index: number }) {
    const { fade, slide } = useEntrance(600 + index * 80);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const st = STATUS_MAP[item.status] ?? STATUS_MAP.pending;

    return (
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
            <TouchableOpacity
                style={styles.bookingRow}
                onPressIn={() =>
                    Animated.spring(scaleAnim, {
                        toValue: 0.97,
                        useNativeDriver: true,
                        speed: 30,
                    }).start()
                }
                onPressOut={() =>
                    Animated.spring(scaleAnim, {
                        toValue: 1,
                        useNativeDriver: true,
                        speed: 22,
                    }).start()
                }
                activeOpacity={1}
            >
                <View style={[styles.bookingAccent, { backgroundColor: st.color }]} />
                <View style={styles.bookingBody}>
                    <View style={styles.bookingTop}>
                        <Text style={styles.bookingVenue} numberOfLines={1}>
                            {item.venue}
                        </Text>
                        <View style={[styles.statusChip, { backgroundColor: st.bg }]}>
                            <Text style={[styles.statusChipText, { color: st.color }]}>
                                {st.label}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.bookingMeta}>
                        <View style={styles.bookingMetaItem}>
                            <Ionicons
                                name="calendar-outline"
                                size={11}
                                color={Colors.charcoalLight}
                            />
                            <Text style={styles.bookingMetaText}>{item.date}</Text>
                        </View>
                        <View style={styles.bookingMetaItem}>
                            <Ionicons name="time-outline" size={11} color={Colors.charcoalLight} />
                            <Text style={styles.bookingMetaText}>{item.time}</Text>
                        </View>
                    </View>
                    <Text style={styles.bookingAmount}>${item.amount}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.border} />
            </TouchableOpacity>
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
                    Animated.spring(scale, {
                        toValue: 1,
                        useNativeDriver: true,
                        speed: 22,
                    }).start()
                }
                activeOpacity={1}
            >
                <View style={styles.menuItemLeft}>
                    <View
                        style={[
                            styles.menuIconWrap,
                            {
                                backgroundColor: item.iconBg ?? Colors.primaryLight,
                            },
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
    const { user } = useAuthStore();
    const typeCfg = USER_TYPE_CONFIG[user.userType] ?? USER_TYPE_CONFIG.client;
    const alert = useAlert();
    const { logOut } = useAuthStore();

    const headerFade = useRef(new Animated.Value(0)).current;
    const heroSlide = useRef(new Animated.Value(-16)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerFade, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(heroSlide, {
                toValue: 0,
                useNativeDriver: true,
                speed: 16,
                bounciness: 6,
            }),
        ]).start();
    }, []);

    const handleLogout = () => {
        alert.show({
            type: 'confirm',
            title: 'Log Out',
            message: 'Are you sure want to log out',
            buttons: [
                { label: 'Cancel', onPress: alert.dismiss, style: 'ghost' },
                {
                    label: 'Log Out',
                    onPress: async () => {
                        navigation
                            .getParent<NativeStackNavigationProp<RootStackParamList>>()
                            .reset({
                                index: 0,
                                routes: [{ name: 'login' }],
                            });
                        await logOut();
                        alert.dismiss;
                    },
                },
            ],
        });
    };

    const accountItems = [
        user.userType === 'owner' && {
            id: 'my-venues',
            icon: 'business-outline',
            iconColor: Colors.primary,
            iconBg: Colors.primaryLight,
            title: 'My Venues',
            subtitle: 'Manage your listed spaces',
            onPress: () => console.log('navigating to venue'),
        },
        user.userType === 'vendor' && {
            id: 'my-services',
            icon: 'construct-outline',
            iconColor: Colors.success,
            iconBg: Colors.successLight,
            title: 'My Services',
            subtitle: 'Manage your offered services',
            onPress: () => console.log('navigating to service'),
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
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <Animated.View
                style={[
                    styles.header,
                    {
                        opacity: headerFade,
                        transform: [{ translateY: heroSlide }],
                    },
                ]}
            >
                <View style={styles.headerAccentBar} />
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerEyebrow}>ACCOUNT</Text>
                        <Text style={styles.headerTitle}>Profile</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={() => console.log('navigating to message')}
                        >
                            <Ionicons
                                name="chatbubble-outline"
                                size={19}
                                color={Colors.charcoalMid}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Ionicons
                                name="notifications-outline"
                                size={19}
                                color={Colors.charcoalMid}
                            />
                            <View style={styles.notifDot} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingsBtn}>
                            <Ionicons name="settings-outline" size={19} color={Colors.charcoal} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentPadding}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Profile card ──────────────────────────────────────────────── */}
                <Animated.View style={[styles.profileCard, { opacity: headerFade }]}>
                    {/* Amber banner */}
                    <View style={styles.profileBanner} />

                    <View style={styles.profileContent}>
                        {/* Avatar */}
                        <View style={styles.avatarWrapper}>
                            <View style={styles.avatarRing}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarInitials}>{user.initials}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.cameraBtn}>
                                <Ionicons name="camera" size={14} color={Colors.white} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>

                        {/* Member badge */}
                        <View style={styles.memberBadge}>
                            <View style={styles.memberDot} />
                            <Text style={styles.memberText}>{user.role}</Text>
                        </View>

                        {/* User type badge */}
                        <View style={[styles.typeBadge, { backgroundColor: typeCfg.bg }]}>
                            <Ionicons name={typeCfg.icon as any} size={13} color={typeCfg.color} />
                            <Text style={[styles.typeBadgeText, { color: typeCfg.color }]}>
                                {typeCfg.label}
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* ── Booking stats row ─────────────────────────────────────────── */}
                <View style={styles.statsRow}>
                    {STATS.map((s, i) => (
                        <StatCard key={s.id} stat={s} index={i} />
                    ))}
                </View>

                {/* ── Quick actions ─────────────────────────────────────────────── */}
                <Animated.View style={[{ opacity: headerFade }, styles.quickSection]}>
                    <Text style={styles.sectionHeading}>Quick Actions</Text>
                    <View style={styles.quickRow}>
                        <TouchableOpacity
                            style={[styles.quickTile, { backgroundColor: Colors.charcoal }]}
                            onPress={() => navigation.navigate('bookings')}
                            activeOpacity={0.85}
                        >
                            <View
                                style={[
                                    styles.quickTileIcon,
                                    {
                                        backgroundColor: 'rgba(255,255,255,0.12)',
                                    },
                                ]}
                            >
                                <Ionicons name="calendar" size={20} color={Colors.white} />
                            </View>
                            <Text style={styles.quickTileLabel}>My Bookings</Text>
                            <Text style={styles.quickTileSub}>View & manage</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickTile, { backgroundColor: Colors.primary }]}
                            onPress={() => navigation.navigate('home')}
                            activeOpacity={0.85}
                        >
                            <View
                                style={[
                                    styles.quickTileIcon,
                                    {
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                    },
                                ]}
                            >
                                <Ionicons name="search" size={20} color={Colors.white} />
                            </View>
                            <Text style={styles.quickTileLabel}>Browse Venues</Text>
                            <Text style={styles.quickTileSub}>Find a space</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickTile, { backgroundColor: '#E11D48' }]}
                            onPress={() => console.log('navigating to favourite')}
                            activeOpacity={0.85}
                        >
                            <View
                                style={[
                                    styles.quickTileIcon,
                                    {
                                        backgroundColor: 'rgba(255,255,255,0.18)',
                                    },
                                ]}
                            >
                                <Ionicons name="heart" size={20} color={Colors.white} />
                            </View>
                            <Text style={styles.quickTileLabel}>Saved</Text>
                            <Text style={styles.quickTileSub}>Your favourites</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* ── Recent Bookings ───────────────────────────────────────────── */}
                <Animated.View style={[styles.bookingsCard, { opacity: headerFade }]}>
                    <View style={styles.bookingsCardHeader}>
                        <View style={styles.sectionTitleRow}>
                            <View style={styles.sectionAccent} />
                            <Text style={styles.sectionHeading}>Recent Bookings</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.viewAllBtn}
                            onPress={() => navigation.navigate('bookings')}
                        >
                            <Text style={styles.viewAllText}>View All</Text>
                            <Ionicons name="arrow-forward" size={13} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {RECENT_BOOKINGS.map((b, i) => (
                        <View key={b.id}>
                            <BookingRow item={b} index={i} />
                            {i < RECENT_BOOKINGS.length - 1 && (
                                <View style={styles.bookingDivider} />
                            )}
                        </View>
                    ))}
                </Animated.View>

                {/* ── Account menu ──────────────────────────────────────────────── */}
                <MenuSection title="ACCOUNT" items={accountItems} />
                <MenuSection title="PREFERENCES" items={preferenceItems} />

                {/* ── Logout ────────────────────────────────────────────────────── */}
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

// ── Styles ────────────────────────────────────────────────────────────────────
const STAT_W = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 3) / 4;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    // ── Header ──
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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notifDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: Colors.primary,
        borderWidth: 1.5,
        borderColor: Colors.surface,
    },
    settingsBtn: {
        width: 46,
        height: 46,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Content ──
    content: { flex: 1 },
    contentPadding: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: 120,
    },

    // ── Profile card ──
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
    memberDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
    },
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
    },
    typeBadgeText: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        letterSpacing: Typography.normal,
    },

    // ── Stats ──
    statsRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
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
    statNum: {
        fontSize: 20,
        fontWeight: Typography.extraBold,
        letterSpacing: -1,
    },
    statLabel: {
        fontSize: 9.5,
        color: Colors.charcoalLight,
        fontWeight: Typography.semiBold,
        textAlign: 'center',
    },

    // ── CTA banner ──
    ctaBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.charcoal,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        gap: Spacing.md,
        marginBottom: Spacing.lg,
        ...Shadows.floating,
    },
    ctaBannerTitle: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: -0.3,
        marginBottom: 3,
    },
    ctaBannerSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.55)',
        lineHeight: 17,
    },
    ctaBannerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.lg,
        paddingVertical: 11,
        borderRadius: Radii.full,
        ...Shadows.primary,
    },
    ctaBannerBtnText: {
        fontSize: 13,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.3,
    },

    // ── Quick actions ──
    quickSection: { marginBottom: Spacing.lg },
    quickRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
    quickTile: {
        flex: 1,
        borderRadius: Radii.xl,
        padding: Spacing.md,
        minHeight: 115,
        justifyContent: 'flex-end',
        ...Shadows.card,
    },
    quickTileIcon: {
        width: 40,
        height: 40,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 'auto' as any,
    },
    quickTileLabel: {
        fontSize: 12,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: -0.2,
        marginTop: Spacing.md,
        marginBottom: 2,
    },
    quickTileSub: {
        fontSize: 9.5,
        color: 'rgba(255,255,255,0.68)',
        fontWeight: Typography.medium,
    },

    // ── Section header helpers ──
    sectionHeading: {
        fontSize: 17,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    sectionAccent: {
        width: 4,
        height: 20,
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },

    // ── Bookings card ──
    bookingsCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadows.card,
    },
    bookingsCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    viewAllText: {
        fontSize: 13,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },

    bookingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
    },
    bookingAccent: { width: 3, height: 56, borderRadius: 2 },
    bookingBody: { flex: 1 },
    bookingTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    bookingVenue: {
        fontSize: 14,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        flex: 1,
        marginRight: Spacing.sm,
    },
    statusChip: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radii.full,
    },
    statusChipText: {
        fontSize: 10,
        fontWeight: Typography.bold,
        letterSpacing: 0.3,
    },
    bookingMeta: { flexDirection: 'row', gap: Spacing.md, marginBottom: 4 },
    bookingMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    bookingMetaText: {
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    bookingAmount: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
    },
    bookingDivider: {
        height: 1,
        backgroundColor: Colors.background,
        marginLeft: 15,
    },

    // ── Menu sections ──
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
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
    },
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
    menuItemSubtitle: {
        fontSize: 12,
        color: Colors.charcoalLight,
        fontWeight: Typography.regular,
    },
    menuChevronWrap: {
        width: 28,
        height: 28,
        borderRadius: Spacing.sm,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuDivider: {
        height: 1,
        backgroundColor: Colors.background,
        marginLeft: 72,
    },

    // ── Logout ──
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

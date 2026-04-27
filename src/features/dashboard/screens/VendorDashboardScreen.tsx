import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
    RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAlert } from '@/context/AlertContext';
import { useAuthStore } from '@/store/useAuthStore';
import { Spacing, Colors, Radii, Shadows, Typography } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import { VendorTabParamList } from '@/navigations/tabNavigations/VendorTabNavigation';

const { width: W } = Dimensions.get('window');
const STAT_W = (W - Spacing.lg * 2 - Spacing.md) / 2;

// ─── Types ────────────────────────────────────────────────────────────────────
type DashboardStats = {
    totalServices: number;
    approvedServices: number;
    pendingServices: number;
    totalBookings: number;
    confirmedBookings: number;
    enquiries: number;
    totalQuotations: number;
    totalEarnings: number;
};

type RecentBooking = {
    _id: string;
    bookingNumber?: string;
    eventDate: string;
    status: 'enquiry' | 'confirmed' | 'cancelled';
    amount?: number;
    customerInfo?: { name?: string; eventName?: string };
    serviceSnapshot?: { title?: string; category?: string };
};

// ─── Static fallback data ─────────────────────────────────────────────────────
const STATIC_STATS: DashboardStats = {
    totalServices: 3,
    approvedServices: 2,
    pendingServices: 1,
    totalBookings: 12,
    confirmedBookings: 5,
    enquiries: 28,
    totalQuotations: 7,
    totalEarnings: 161000,
};

const STATIC_BOOKINGS: RecentBooking[] = [
    {
        _id: '1',
        bookingNumber: 'SVC-2026-0012',
        eventDate: '2026-04-30T00:00:00.000Z',
        status: 'enquiry',
        amount: 35000,
        customerInfo: { name: 'Rahul Sharma', eventName: 'Wedding' },
        serviceSnapshot: { title: 'Wedding Photography', category: 'Photography' },
    },
    {
        _id: '2',
        bookingNumber: 'SVC-2026-0011',
        eventDate: '2026-05-03T00:00:00.000Z',
        status: 'confirmed',
        amount: 18000,
        customerInfo: { name: 'TechCorp Pvt Ltd', eventName: 'Corporate Event' },
        serviceSnapshot: { title: 'Corporate Event Video', category: 'Videography' },
    },
    {
        _id: '3',
        bookingNumber: 'SVC-2026-0010',
        eventDate: '2026-05-08T00:00:00.000Z',
        status: 'confirmed',
        amount: 8000,
        customerInfo: { name: 'Priya Singh', eventName: 'Portrait' },
        serviceSnapshot: { title: 'Portrait Session', category: 'Photography' },
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
    enquiry: { color: Colors.warning, bg: Colors.warningLight, label: 'Enquiry' },
    confirmed: { color: Colors.success, bg: Colors.successLight, label: 'Confirmed' },
    cancelled: { color: Colors.danger, bg: Colors.dangerLight, label: 'Cancelled' },
};

const fmtCurrency = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Stat card ────────────────────────────────────────────────────────────────
type StatCardProps = {
    icon: string;
    label: string;
    value: string;
    color: string;
    bg: string;
    index: number;
};

function StatCard({ icon, label, value, color, bg, index }: StatCardProps) {
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(16)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, {
                toValue: 1,
                delay: 100 + index * 80,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(slide, {
                toValue: 0,
                delay: 100 + index * 80,
                speed: 18,
                bounciness: 6,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[s.statCard, { opacity: fade, transform: [{ translateY: slide }] }]}>
            <View style={[s.statTopBar, { backgroundColor: color }]} />
            <View style={s.statBody}>
                <View style={[s.statIconBox, { backgroundColor: bg }]}>
                    <Ionicons name={icon as any} size={20} color={color} />
                </View>
                <Text style={s.statValue}>{value}</Text>
                <Text style={s.statLabel}>{label}</Text>
            </View>
        </Animated.View>
    );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, total, color }: { value: number; total: number; color: string }) {
    const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
    return (
        <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
        </View>
    );
}

// ─── Card header ─────────────────────────────────────────────────────────────
function CardHeader({
    title,
    count,
    onViewAll,
}: {
    title: string;
    count?: number;
    onViewAll?: () => void;
}) {
    return (
        <View style={s.cardHeader}>
            <View style={s.cardHeaderLeft}>
                <View style={s.cardAccent} />
                <Text style={s.cardTitle}>{title}</Text>
                {count !== undefined && (
                    <View style={s.countBadge}>
                        <Text style={s.countBadgeText}>{count}</Text>
                    </View>
                )}
            </View>
            {onViewAll && (
                <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
                    <Text style={s.seeAllText}>See all →</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// ─── Booking row ─────────────────────────────────────────────────────────────
function BookingRow({
    booking,
    last,
    onPress,
}: {
    booking: RecentBooking;
    last: boolean;
    onPress: () => void;
}) {
    const st = STATUS_MAP[booking.status] ?? STATUS_MAP.enquiry;

    return (
        <>
            <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={onPress}>
                <View style={[s.rowIconWrap, { backgroundColor: Colors.primaryLight }]}>
                    <Ionicons name="camera-outline" size={18} color={Colors.primary} />
                </View>
                <View style={s.rowContent}>
                    <Text style={s.rowTitle} numberOfLines={1}>
                        {booking.serviceSnapshot?.title ?? '—'}
                    </Text>
                    <Text style={s.rowMetaText}>
                        {booking.customerInfo?.name ?? '—'} · {fmtDate(booking.eventDate)}
                    </Text>
                </View>
                <View style={s.rowRight}>
                    {booking.amount ? (
                        <Text style={s.rowAmount}>{fmtCurrency(booking.amount)}</Text>
                    ) : null}
                    <View style={[s.statusTag, { backgroundColor: st.bg }]}>
                        <Text style={[s.statusTagText, { color: st.color }]}>{st.label}</Text>
                    </View>
                </View>
            </TouchableOpacity>
            {!last && <View style={s.separator} />}
        </>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
type Props = NativeBottomTabScreenProps<VendorTabParamList, 'dashboard'>;

export default function VendorDashboardScreen({ navigation }: Props) {
    const { user } = useAuthStore();
    const alert = useAlert();

    // TODO: replace static data with real hook
    // const { data, isLoading, isRefetching, refetch } = useGetVendorDashboard();
    const isRefetching = false;
    const stats: DashboardStats = STATIC_STATS;
    const recentBookings: RecentBooking[] = STATIC_BOOKINGS;

    const handleRefresh = useCallback(() => {
        // refetch();
    }, []);

    // ── Animations ────────────────────────────────────────────────────────────
    const headerFade = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-14)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerFade, { toValue: 1, duration: 380, useNativeDriver: true }),
            Animated.spring(headerSlide, {
                toValue: 0,
                speed: 16,
                bounciness: 4,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // ── Stat cards ────────────────────────────────────────────────────────────
    const statCards = useMemo(
        () => [
            {
                id: 'services',
                label: 'Services',
                value: String(stats.totalServices),
                icon: 'construct-outline',
                color: Colors.primary,
                bg: Colors.primaryLight,
            },
            {
                id: 'bookings',
                label: 'Bookings',
                value: String(stats.totalBookings),
                icon: 'calendar-outline',
                color: Colors.info,
                bg: Colors.infoLight,
            },
            {
                id: 'earnings',
                label: 'Earnings',
                value: fmtCurrency(stats.totalEarnings),
                icon: 'cash-outline',
                color: Colors.success,
                bg: Colors.successLight,
            },
            {
                id: 'enquiries',
                label: 'Enquiries',
                value: String(stats.enquiries),
                icon: 'chatbubble-outline',
                color: Colors.warning,
                bg: Colors.warningLight,
            },
        ],
        [stats],
    );

    const goToBookingDetail = useCallback(
        (booking: RecentBooking) => {
            console.log('navigating to booking ')
        },
        [navigation],
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <View style={s.root}>
            {/* Header */}
            <Animated.View
                style={[s.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}
            >
                <View style={s.headerAccent} />
                <View style={s.headerContent}>
                    <View>
                        <Text style={s.headerEyebrow}>VENDOR DASHBOARD</Text>
                        <Text style={s.headerTitle}>
                            Welcome, {user?.name?.split(' ')[0] ?? 'Vendor'} 👋
                        </Text>
                    </View>
                    <View style={s.headerRight}>
                        <TouchableOpacity
                            style={s.notifBtn}
                            onPress={() => alert.info('Coming Soon', 'Notifications coming soon')}
                        >
                            <Ionicons name="notifications-outline" size={20} color={Colors.charcoalMid} />
                            <View style={s.notifDot} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={s.avatarCircle}
                            onPress={() => navigation.navigate('profile')}
                            activeOpacity={0.85}
                        >
                            <Text style={s.avatarText}>
                                {user?.name?.slice(0, 2).toUpperCase() ?? 'VN'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={s.rolePillWrap}>
                    <View style={s.rolePill}>
                        <View style={s.roleDot} />
                        <Text style={s.rolePillText}>VENDOR</Text>
                    </View>
                </View>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scroll}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={handleRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
            >
                {/* Stats grid */}
                <View style={s.statsGrid}>
                    {statCards.map((sc, i) => (
                        <StatCard key={sc.id} {...sc} index={i} />
                    ))}
                </View>

                {/* Service overview */}
                <View style={s.card}>
                    <CardHeader title="Service Overview" />
                    <View style={s.breakdownRow}>
                        <View style={s.breakdownItem}>
                            <Text style={[s.breakdownValue, { color: Colors.success }]}>
                                {stats.approvedServices}
                            </Text>
                            <Text style={s.breakdownLabel}>Approved</Text>
                            <ProgressBar
                                value={stats.approvedServices}
                                total={stats.totalServices}
                                color={Colors.success}
                            />
                        </View>
                        <View style={s.breakdownDivider} />
                        <View style={s.breakdownItem}>
                            <Text style={[s.breakdownValue, { color: Colors.warning }]}>
                                {stats.pendingServices}
                            </Text>
                            <Text style={s.breakdownLabel}>Pending</Text>
                            <ProgressBar
                                value={stats.pendingServices}
                                total={stats.totalServices}
                                color={Colors.warning}
                            />
                        </View>
                        <View style={s.breakdownDivider} />
                        <View style={s.breakdownItem}>
                            <Text style={[s.breakdownValue, { color: Colors.info }]}>
                                {stats.confirmedBookings}
                            </Text>
                            <Text style={s.breakdownLabel}>Confirmed</Text>
                            <ProgressBar
                                value={stats.confirmedBookings}
                                total={stats.totalBookings}
                                color={Colors.info}
                            />
                        </View>
                        <View style={s.breakdownDivider} />
                        <View style={s.breakdownItem}>
                            <Text style={[s.breakdownValue, { color: Colors.primary }]}>
                                {stats.totalQuotations}
                            </Text>
                            <Text style={s.breakdownLabel}>Quotes</Text>
                            <ProgressBar
                                value={stats.totalQuotations}
                                total={stats.totalBookings}
                                color={Colors.primary}
                            />
                        </View>
                    </View>
                </View>

                {/* Recent bookings */}
                <View style={s.card}>
                    <CardHeader
                        title="Recent Bookings"
                        count={recentBookings.length > 0 ? recentBookings.length : undefined}
                        onViewAll={() =>console.log('Naigating to booking')}
                    />
                    {recentBookings.length === 0 ? (
                        <View style={s.emptyWrap}>
                            <View style={s.emptyIconWrap}>
                                <Ionicons name="calendar-outline" size={28} color={Colors.primaryBorder} />
                            </View>
                            <Text style={s.emptyTitle}>No bookings yet</Text>
                            <Text style={s.emptySub}>
                                Bookings from clients will appear here once your services go live.
                            </Text>
                        </View>
                    ) : (
                        recentBookings.map((b, i) => (
                            <BookingRow
                                key={b._id}
                                booking={b}
                                last={i === recentBookings.length - 1}
                                onPress={() => goToBookingDetail(b)}
                            />
                        ))
                    )}
                </View>

                {/* Quick actions */}
                <View style={s.card}>
                    <CardHeader title="Quick Actions" />
                    <View style={s.quickActionsGrid}>
                        {[
                            { icon: 'add-circle-outline', label: 'Add Service', color: Colors.primary, bg: Colors.primaryLight },
                            { icon: 'person-outline', label: 'Edit Profile', color: Colors.info, bg: Colors.infoLight },
                            { icon: 'document-text-outline', label: 'Quotations', color: Colors.success, bg: Colors.successLight },
                            { icon: 'settings-outline', label: 'Settings', color: Colors.charcoalLight, bg: Colors.border },
                        ].map(action => (
                            <TouchableOpacity
                                key={action.label}
                                style={s.quickActionBtn}
                                activeOpacity={0.8}
                                onPress={() => alert.info('Coming Soon', `${action.label} coming soon`)}
                            >
                                <View style={[s.quickActionIcon, { backgroundColor: action.bg }]}>
                                    <Ionicons name={action.icon as any} size={22} color={action.color} />
                                </View>
                                <Text style={s.quickActionLabel}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={{ height: 24 }} />
            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },

    header: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        paddingBottom: Spacing.lg,
        ...Shadows.header,
    },
    headerAccent: { height: 4, backgroundColor: Colors.primary },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing.xl,
        paddingTop: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg,
    },
    headerEyebrow: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: Typography.wider,
        marginBottom: 3,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.4,
    },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
    notifBtn: {
        width: 42,
        height: 42,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    notifDot: {
        position: 'absolute',
        top: 9,
        right: 9,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
        borderWidth: 1.5,
        borderColor: Colors.surface,
    },
    avatarCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontSize: 13, fontWeight: Typography.extraBold, color: Colors.charcoal },
    rolePillWrap: { paddingHorizontal: Spacing.xl, marginTop: Spacing.sm },
    rolePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        backgroundColor: Colors.primaryLight,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radii.full,
    },
    roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
    rolePillText: {
        fontSize: 9,
        fontWeight: Typography.extraBold,
        color: Colors.primaryDark,
        letterSpacing: 1.5,
    },

    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: 100 },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    statCard: {
        width: STAT_W,
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        overflow: 'hidden',
        ...Shadows.card,
    },
    statTopBar: { height: 4 },
    statBody: { padding: Spacing.lg },
    statIconBox: {
        width: 46,
        height: 46,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    statValue: {
        fontSize: 26,
        fontWeight: Typography.extraBold,
        letterSpacing: -1,
        marginBottom: 2,
        color: Colors.charcoal,
    },
    statLabel: { fontSize: 11, color: Colors.charcoalLight, fontWeight: Typography.semiBold },

    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadows.card,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    cardAccent: { width: 4, height: 20, backgroundColor: Colors.primary, borderRadius: 2 },
    cardTitle: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    countBadge: {
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.full,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    countBadgeText: { fontSize: 10, fontWeight: Typography.extraBold, color: Colors.primaryDark },
    seeAllText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primary },

    breakdownRow: { flexDirection: 'row', alignItems: 'flex-start' },
    breakdownItem: { flex: 1, alignItems: 'center', gap: 3, paddingHorizontal: 4 },
    breakdownValue: { fontSize: 20, fontWeight: Typography.extraBold, letterSpacing: -0.5 },
    breakdownLabel: {
        fontSize: 9.5,
        color: Colors.charcoalLight,
        fontWeight: Typography.semiBold,
        textAlign: 'center',
    },
    breakdownDivider: { width: 1, height: 48, backgroundColor: Colors.divider, marginTop: 4 },
    progressTrack: {
        width: '100%',
        height: 3,
        backgroundColor: Colors.border,
        borderRadius: 2,
        marginTop: 4,
        overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 2 },

    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.sm },
    rowIconWrap: {
        width: 42,
        height: 42,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    rowContent: { flex: 1 },
    rowTitle: {
        fontSize: 13.5,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
        marginBottom: 3,
    },
    rowMetaText: { fontSize: 11, color: Colors.charcoalLight, fontWeight: Typography.medium },
    rowRight: { alignItems: 'flex-end', gap: 4 },
    rowAmount: { fontSize: 13, fontWeight: Typography.extraBold, color: Colors.primary },
    separator: { height: 1, backgroundColor: Colors.divider },

    statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, flexShrink: 0 },
    statusTagText: { fontSize: 10, fontWeight: Typography.bold, letterSpacing: 0.2 },

    emptyWrap: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
    emptyIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        marginBottom: Spacing.xs,
    },
    emptyTitle: { fontSize: 15, fontWeight: Typography.bold, color: Colors.charcoal, letterSpacing: -0.2 },
    emptySub: {
        fontSize: 12.5,
        color: Colors.charcoalLight,
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: Spacing.xl,
    },

    quickActionsGrid: { flexDirection: 'row', gap: Spacing.sm },
    quickActionBtn: { flex: 1, alignItems: 'center', gap: Spacing.xs },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionLabel: {
        fontSize: 10.5,
        color: Colors.charcoalMid,
        fontWeight: Typography.semiBold,
        textAlign: 'center',
    },
});
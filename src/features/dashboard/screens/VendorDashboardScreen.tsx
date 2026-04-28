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
import { useAlert } from '@/context/AlertContext';
import { useAuthStore } from '@/store/useAuthStore';
import { Spacing, Colors, Radii, Shadows, Typography } from '@/theme/theme';
import { VendorTabParamList } from '@/navigations/tabNavigations/VendorTabNavigation';
import { ServiceBooking } from '@/features/booking/types/ServiceBooking';
import { useVendorStats } from '../hooks/useVendorDashboard';
import { useGetVendorServiceBooking } from '@/features/booking/hooks/useVendorBooking';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';

const { width: W } = Dimensions.get('window');
const STAT_W = (W - Spacing.lg * 2 - Spacing.md) / 2;

// ─── Types ────────────────────────────────────────────────────────────────────
// Matches API: { success: true, stats: { total, approved, pending, draft } }
type DashboardStats = {
    total: number;
    approved: number;
    pending: number;
    draft: number;
};

// Matches vendorBookings shape: { bookings: ServiceBooking[], stats: { total, enquiry, confirmed } }
type BookingStats = {
    total: number;
    enquiry: number;
    confirmed: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
    enquiry: { color: Colors.warning, bg: Colors.warningLight, label: 'Enquiry' },
    confirmed: { color: Colors.success, bg: Colors.successLight, label: 'Confirmed' },
    cancelled: { color: Colors.danger, bg: Colors.dangerLight, label: 'Cancelled' },
};

const fmtCurrency = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const fmtDate = (s: Date) =>
    new Date(s).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
    booking: ServiceBooking;
    last: boolean;
    onPress: () => void;
}) {
    const st = STATUS_MAP[booking?.status ?? ''] ?? STATUS_MAP.enquiry;

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
                        {booking.customerInfo?.name ?? '—'} · {fmtDate(booking?.eventDate)}
                    </Text>
                </View>
                <View style={s.rowRight}>
                    {booking.amount != null && (
                        <Text style={s.rowAmount}>{fmtCurrency(booking.amount)}</Text>
                    )}
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
    const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

    const {
        data: statsData,
        isLoading: statsLoading,
        isRefetching: statsRefetching,
        refetch: statsRefetch,
    } = useVendorStats();

    const {
        data: vendorBookings,
        isLoading: bookingLoading,
        isRefetching: bookingRefetching,
        refetch: bookingRefetch,
    } = useGetVendorServiceBooking();

    // ── Derived data ──────────────────────────────────────────────────────────
    // API shape: { success: true, stats: { total, approved, pending, draft } }
    const stats: DashboardStats = statsData?.stats ?? {
        total: 0,
        approved: 0,
        pending: 0,
        draft: 0,
    };

    const recentBookings: ServiceBooking[] = vendorBookings?.bookings ?? [];

    const bookingStats: BookingStats = vendorBookings?.stats ?? {
        total: 0,
        enquiry: 0,
        confirmed: 0,
    };

    const isRefetching = statsRefetching || bookingRefetching;

    const handleRefresh = useCallback(() => {
        statsRefetch();
        bookingRefetch();
    }, [statsRefetch, bookingRefetch]);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Stat cards — mapped to actual API fields ───────────────────────────────
    const statCards = useMemo(
        () => [
            {
                id: 'services',
                label: 'Services',
                value: String(stats.total), // was: stats.totalServices
                icon: 'construct-outline',
                color: Colors.primary,
                bg: Colors.primaryLight,
            },
            {
                id: 'bookings',
                label: 'Bookings',
                value: String(bookingStats.total), // was: stats.totalBookings
                icon: 'calendar-outline',
                color: Colors.info,
                bg: Colors.infoLight,
            },
            {
                id: 'pending',
                label: 'Pending',
                value: String(stats.pending), // derived; no API field yet
                icon: 'time',
                color: Colors.info,
                bg: Colors.infoLight,
            },
            {
                id: 'enquiries',
                label: 'Enquiries',
                value: String(bookingStats.enquiry), // was: stats.enquiries
                icon: 'chatbubble-outline',
                color: Colors.warning,
                bg: Colors.warningLight,
            },
        ],
        [stats, bookingStats],
    );

    const goToBookingDetail = useCallback(
        (booking: ServiceBooking) => {
            navigation
                .getParent<NativeStackNavigationProp<RootStackParamList>>()
                .navigate('serviceBookingDetail', {
                    bookingData: booking,
                });
        },
        [], // navigation removed from deps until route is wired
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <View style={s.root}>
            {/* Header */}
            <Animated.View
                style={[
                    s.header,
                    { opacity: headerFade, transform: [{ translateY: headerSlide }] },
                ]}
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
                            <Ionicons
                                name="notifications-outline"
                                size={20}
                                color={Colors.charcoalMid}
                            />
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

                {/* Service overview — mapped to actual API fields */}
                <View style={s.card}>
                    <CardHeader title="Service Overview" />
                    <View style={s.breakdownRow}>
                        <View style={s.breakdownItem}>
                            <Text style={[s.breakdownValue, { color: Colors.success }]}>
                                {stats.approved} {/* was: stats.approvedServices */}
                            </Text>
                            <Text style={s.breakdownLabel}>Approved</Text>
                            <ProgressBar
                                value={stats.approved}
                                total={stats.total}
                                color={Colors.success}
                            />
                        </View>
                        <View style={s.breakdownDivider} />
                        <View style={s.breakdownItem}>
                            <Text style={[s.breakdownValue, { color: Colors.warning }]}>
                                {stats.pending} {/* was: stats.pendingServices */}
                            </Text>
                            <Text style={s.breakdownLabel}>Pending</Text>
                            <ProgressBar
                                value={stats.pending}
                                total={stats.total}
                                color={Colors.warning}
                            />
                        </View>
                        <View style={s.breakdownDivider} />
                        <View style={s.breakdownItem}>
                            <Text style={[s.breakdownValue, { color: Colors.info }]}>
                                {bookingStats.confirmed} {/* was: stats.confirmedBookings */}
                            </Text>
                            <Text style={s.breakdownLabel}>Confirmed</Text>
                            <ProgressBar
                                value={bookingStats.confirmed}
                                total={bookingStats.total}
                                color={Colors.info}
                            />
                        </View>
                        <View style={s.breakdownDivider} />
                        <View style={s.breakdownItem}>
                            <Text style={[s.breakdownValue, { color: Colors.primary }]}>
                                {stats.draft} {/* was: stats.totalQuotations */}
                            </Text>
                            <Text style={s.breakdownLabel}>Draft</Text>
                            <ProgressBar
                                value={stats.draft}
                                total={stats.total}
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
                        onViewAll={() => console.log('Navigating to bookings')}
                    />
                    {recentBookings.length === 0 ? (
                        <View style={s.emptyWrap}>
                            <View style={s.emptyIconWrap}>
                                <Ionicons
                                    name="calendar-outline"
                                    size={28}
                                    color={Colors.primaryBorder}
                                />
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
                            {
                                icon: 'add-circle-outline',
                                label: 'Add Service',
                                color: Colors.primary,
                                bg: Colors.primaryLight,
                                fn: () => rootNav.navigate('addVendorService'),
                            },
                            {
                                icon: 'person-outline',
                                label: 'Edit Profile',
                                color: Colors.info,
                                bg: Colors.infoLight,
                                fn: () => navigation.navigate('profile'),
                            },
                            {
                                icon: 'document-text-outline',
                                label: 'Quotations',
                                color: Colors.success,
                                bg: Colors.successLight,
                                fn: () => navigation.navigate('quotationDownload'),
                            },
                        ].map(action => (
                            <TouchableOpacity
                                key={action.label}
                                style={s.quickActionBtn}
                                activeOpacity={0.8}
                                onPress={()=>action.fn()}
                            >
                                <View style={[s.quickActionIcon, { backgroundColor: action.bg }]}>
                                    <Ionicons
                                        name={action.icon as any}
                                        size={22}
                                        color={action.color}
                                    />
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

// ─── Styles (unchanged) ───────────────────────────────────────────────────────
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
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
    },
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
    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radii.full,
        flexShrink: 0,
    },
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
    emptyTitle: {
        fontSize: 15,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
    },
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

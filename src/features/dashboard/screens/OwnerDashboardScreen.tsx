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
import { OwnerTabParamList } from '@/navigations/tabNavigations/OwnerTabNavigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Spacing, Colors, Radii, Shadows, Typography } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import { useGetOwnerDashboard } from '../hooks/useGetOwnerDashboard';

const { width: W } = Dimensions.get('window');
const STAT_W = (W - Spacing.lg * 2 - Spacing.md) / 2;

// ─── Types ────────────────────────────────────────────────────────────────────
type DashboardStats = {
    totalVenues: number;
    approvedVenues: number;
    pendingVenues: number;
    rejectedVenues: number;
    totalEarnings: number;
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
};

type RecentVenue = {
    _id: string;
    businessName: string;
    status: string;
    venueType?: string[];
    location?: { city?: string; area?: string };
    rating?: number;
    totalBookings?: number;
};

type RecentBooking = {
    _id: string;
    bookingNumber?: string;
    bookingDate: string;
    status: string;
    amount: number;
    bookingType?: string;
    customerDetails?: { name?: string; eventType?: string };
    venue?: { businessName?: string };
};

// ─── Status map ───────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
    approved: { color: Colors.success, bg: Colors.successLight, label: 'Approved' },
    pending: { color: Colors.warning, bg: Colors.warningLight, label: 'Pending' },
    confirmed: { color: Colors.success, bg: Colors.successLight, label: 'Confirmed' },
    completed: { color: Colors.info, bg: Colors.infoLight, label: 'Completed' },
    cancelled: { color: Colors.danger, bg: Colors.dangerLight, label: 'Cancelled' },
    rejected: { color: Colors.danger, bg: Colors.dangerLight, label: 'Rejected' },
};

const fmtCurrency = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

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

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({
    icon,
    title,
    sub,
    ctaLabel,
    onCta,
}: {
    icon: string;
    title: string;
    sub: string;
    ctaLabel?: string;
    onCta?: () => void;
}) {
    return (
        <View style={s.emptyWrap}>
            <View style={s.emptyIconWrap}>
                <Ionicons name={icon as any} size={28} color={Colors.primaryBorder} />
            </View>
            <Text style={s.emptyTitle}>{title}</Text>
            <Text style={s.emptySub}>{sub}</Text>
            {ctaLabel && (
                <TouchableOpacity style={s.emptyCta} onPress={onCta} activeOpacity={0.85}>
                    <Ionicons name="add" size={14} color={Colors.charcoal} />
                    <Text style={s.emptyCtaText}>{ctaLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// ─── Booking row ─────────────────────────────────────────────────────────────
// Moved outside screen component — not recreated on every render
function BookingRow({
    booking,
    last,
    onPress,
}: {
    booking: RecentBooking;
    last: boolean;
    onPress: () => void;
}) {
    const st = STATUS_MAP[booking.status] ?? STATUS_MAP.pending;
    const name = booking.venue?.businessName ?? booking.customerDetails?.name ?? '—';

    return (
        <>
            <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={onPress}>
                <View style={[s.rowIconWrap, { backgroundColor: Colors.infoLight }]}>
                    <Ionicons name="calendar-outline" size={18} color={Colors.info} />
                </View>
                <View style={s.rowContent}>
                    <Text style={s.rowTitle} numberOfLines={1}>
                        {name}
                    </Text>
                    <Text style={s.rowMetaText}>{fmtDate(booking.bookingDate)}</Text>
                </View>
                <View style={s.rowRight}>
                    <Text style={s.rowAmount}>{fmtCurrency(booking.amount)}</Text>
                    <View style={[s.statusTag, { backgroundColor: st.bg }]}>
                        <Text style={[s.statusTagText, { color: st.color }]}>{st.label}</Text>
                    </View>
                </View>
            </TouchableOpacity>
            {!last && <View style={s.separator} />}
        </>
    );
}

// ─── Venue row ────────────────────────────────────────────────────────────────
// Moved outside screen component — not recreated on every render
function VenueRow({
    venue,
    last,
    onPress,
}: {
    venue: RecentVenue;
    last: boolean;
    onPress: () => void;
}) {
    const st = STATUS_MAP[venue.status] ?? STATUS_MAP.pending;

    return (
        <>
            <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={onPress}>
                <View style={[s.rowIconWrap, { backgroundColor: Colors.primaryLight }]}>
                    <Text style={s.rowEmoji}>🏢</Text>
                </View>
                <View style={s.rowContent}>
                    <Text style={s.rowTitle} numberOfLines={1}>
                        {venue.businessName}
                    </Text>
                    <View style={s.rowMeta}>
                        {venue.location?.city ? (
                            <Text style={s.rowMetaText}>
                                <Ionicons
                                    name="location-outline"
                                    size={10}
                                    color={Colors.charcoalLight}
                                />{' '}
                                {venue.location.city}
                            </Text>
                        ) : null}
                        {venue.venueType?.[0] ? <Text style={s.rowMetaSep}>·</Text> : null}
                        {venue.venueType?.[0] ? (
                            <Text style={s.rowMetaText}>{venue.venueType[0]}</Text>
                        ) : null}
                    </View>
                </View>
                <View style={[s.statusTag, { backgroundColor: st.bg }]}>
                    <Text style={[s.statusTagText, { color: st.color }]}>{st.label}</Text>
                </View>
            </TouchableOpacity>
            {!last && <View style={s.separator} />}
        </>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
type Props = NativeBottomTabScreenProps<OwnerTabParamList, 'dashboard'>;

export default function OwnerDashboardScreen({ navigation }: Props) {
    const { user } = useAuthStore();
    const alert = useAlert();
    const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    const { data: dashboardData, isLoading, isRefetching, refetch } = useGetOwnerDashboard();

    // Derive data safely — no local mirror state that can go stale
    const stats: DashboardStats | null = dashboardData?.stats ?? null;
    const recentBookings: RecentBooking[] = dashboardData?.recentBookings ?? [];
    const recentVenues: RecentVenue[] = dashboardData?.recentVenues ?? [];

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

    // ── Pull-to-refresh ───────────────────────────────────────────────────────
    // isRefetching from the hook drives the spinner — no manual state needed
    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    // ── Stat cards ────────────────────────────────────────────────────────────
    const statCards = useMemo(
        () => [
            {
                id: 'venues',
                label: 'Total Venues',
                value: String(stats?.totalVenues ?? 0),
                icon: 'business-outline',
                color: Colors.primary,
                bg: Colors.primaryLight,
            },
            {
                id: 'bookings',
                label: 'Total Bookings',
                value: String(stats?.totalBookings ?? 0),
                icon: 'calendar-outline',
                color: Colors.info,
                bg: Colors.infoLight,
            },
            {
                id: 'earnings',
                label: 'Earnings',
                value: fmtCurrency(stats?.totalEarnings ?? 0),
                icon: 'cash-outline',
                color: Colors.success,
                bg: Colors.successLight,
            },
            {
                id: 'pending',
                label: 'Pending',
                value: String(stats?.pendingBookings ?? 0),
                icon: 'time-outline',
                color: Colors.warning,
                bg: Colors.warningLight,
            },
        ],
        [stats],
    );

    const totalVenues = stats?.totalVenues ?? 0;

    // ── Navigation helpers ────────────────────────────────────────────────────
    const goToBookingDetail = useCallback(
        (booking: RecentBooking) => {
            rootNav.navigate('venueBookingDetail', { bookingId: booking._id });
        },
        [navigation],
    );

    const goToVenueDetail = useCallback(
        (venue: RecentVenue) => {
            rootNav.navigate('venueDetail', { venue });
        },
        [navigation],
    );

    const goToAddVenue = useCallback(() => {
        rootNav.navigate('addVenue');
    }, [navigation]);

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
                        <Text style={s.headerEyebrow}>OWNER DASHBOARD</Text>
                        <Text style={s.headerTitle}>
                            Welcome, {user?.name?.split(' ')[0] ?? 'Owner'} 👋
                        </Text>
                    </View>
                    <View style={s.headerRight}>
                        <TouchableOpacity
                            style={s.notifBtn}
                            onPress={() =>
                                rootNav.navigate('notification')
                            }
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
                                {user?.name?.slice(0, 2).toUpperCase() ?? 'OW'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={s.rolePillWrap}>
                    <View style={s.rolePill}>
                        <View style={s.roleDot} />
                        <Text style={s.rolePillText}>{(user?.role ?? 'Owner').toUpperCase()}</Text>
                    </View>
                </View>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scroll}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching} // driven by hook — no manual state
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

                {/* Listing overview */}
                <View style={s.card}>
                    <CardHeader title="Listing Overview" />
                    <View style={s.breakdownRow}>
                        <View style={s.breakdownItem}>
                            <Text style={[s.breakdownValue, { color: Colors.success }]}>
                                {stats?.approvedVenues ?? 0}
                            </Text>
                            <Text style={s.breakdownLabel}>Approved</Text>
                            <ProgressBar
                                value={stats?.approvedVenues ?? 0}
                                total={totalVenues}
                                color={Colors.success}
                            />
                        </View>
                        <View style={s.breakdownDivider} />
                        <View style={s.breakdownItem}>
                            <Text style={[s.breakdownValue, { color: Colors.warning }]}>
                                {stats?.pendingVenues ?? 0}
                            </Text>
                            <Text style={s.breakdownLabel}>In Review</Text>
                            <ProgressBar
                                value={stats?.pendingVenues ?? 0}
                                total={totalVenues}
                                color={Colors.warning}
                            />
                        </View>
                        <View style={s.breakdownDivider} />
                        <View style={s.breakdownItem}>
                            <Text style={[s.breakdownValue, { color: Colors.info }]}>
                                {stats?.confirmedBookings ?? 0}
                            </Text>
                            <Text style={s.breakdownLabel}>Confirmed</Text>
                            <ProgressBar
                                value={stats?.confirmedBookings ?? 0}
                                total={stats?.totalBookings ?? 0}
                                color={Colors.info}
                            />
                        </View>
                        <View style={s.breakdownDivider} />
                        <View style={s.breakdownItem}>
                            <Text style={[s.breakdownValue, { color: Colors.danger }]}>
                                {stats?.rejectedVenues ?? 0}
                            </Text>
                            <Text style={s.breakdownLabel}>Rejected</Text>
                            <ProgressBar
                                value={stats?.rejectedVenues ?? 0}
                                total={totalVenues}
                                color={Colors.danger}
                            />
                        </View>
                    </View>
                </View>

                {/* My Venues */}
                <View style={s.card}>
                    <CardHeader
                        title="My Venues"
                        count={recentVenues.length > 0 ? recentVenues.length : undefined}
                        onViewAll={() => navigation.navigate('venues')}
                    />
                    {recentVenues.length === 0 ? (
                        <EmptyState
                            icon="business-outline"
                            title="No venues listed yet"
                            sub="Add your first venue to start receiving bookings from clients."
                            ctaLabel="Add Venue"
                            onCta={goToAddVenue}
                        />
                    ) : (
                        recentVenues.map((v, i) => (
                            <VenueRow
                                key={v._id}
                                venue={v}
                                last={i === recentVenues.length - 1}
                                onPress={() => goToVenueDetail(v)}
                            />
                        ))
                    )}
                </View>

                {/* Recent Bookings */}
                <View style={s.card}>
                    <CardHeader
                        title="Recent Bookings"
                        count={recentBookings.length > 0 ? recentBookings.length : undefined}
                        onViewAll={() => navigation.navigate('bookings')}
                    />
                    {recentBookings.length === 0 ? (
                        <EmptyState
                            icon="calendar-outline"
                            title="No bookings yet"
                            sub="Bookings from clients will appear here once your venues go live."
                        />
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
    rowEmoji: { fontSize: 20 },
    rowContent: { flex: 1 },
    rowTitle: {
        fontSize: 13.5,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
        marginBottom: 3,
    },
    rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    rowMetaText: { fontSize: 11, color: Colors.charcoalLight, fontWeight: Typography.medium },
    rowMetaSep: { fontSize: 11, color: Colors.border },
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
    emptyCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.lg,
        paddingVertical: 10,
        borderRadius: Radii.full,
        marginTop: Spacing.xs,
        ...Shadows.primary,
    },
    emptyCtaText: {
        fontSize: 13,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: 0.2,
    },
});
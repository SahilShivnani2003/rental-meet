import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme/theme';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { OwnerTabParamList } from '../../navigations/tabNavigations/OwnerTabNavigation';
import { useAuthStore } from '../../store/auth-store';
import { ownerAPI } from '../../service/apis/owner';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── API response types ───────────────────────────────────────────────────────
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

// ─── Stat card config ─────────────────────────────────────────────────────────
type StatConfig = {
    id: string;
    label: string;
    value: number;
    prefix: string;
    icon: string;
    color: string;
    bg: string;
};

// ─── Status colour map ────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
    approved: { color: Colors.success, bg: Colors.successLight, label: 'Approved' },
    pending: { color: Colors.warning, bg: Colors.warningLight, label: 'Pending' },
    confirmed: { color: Colors.success, bg: Colors.successLight, label: 'Confirmed' },
    completed: { color: Colors.info, bg: Colors.infoLight, label: 'Completed' },
    cancelled: { color: Colors.danger, bg: Colors.dangerLight, label: 'Cancelled' },
    rejected: { color: Colors.danger, bg: Colors.dangerLight, label: 'Rejected' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const fmtDate = (str: string) =>
    new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ stat, index }: { stat: StatConfig; index: number }) {
    const slideAnim = useRef(new Animated.Value(30)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                delay: 200 + index * 90,
                duration: 320,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                delay: 200 + index * 90,
                useNativeDriver: true,
                speed: 16,
                bounciness: 8,
            }),
        ]).start();
    }, []);

    const onPressIn = () =>
        Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 30 }).start();
    const onPressOut = () =>
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 22 }).start();

    return (
        <Animated.View
            style={[
                styles.statCard,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
            ]}
        >
            <TouchableOpacity
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={1}
                style={styles.statCardInner}
            >
                <View style={[styles.statArc, { backgroundColor: stat.bg }]} />
                <View style={[styles.statIconWrap, { backgroundColor: stat.bg }]}>
                    <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                </View>
                <Text style={[styles.statValueNum, { color: stat.color }]}>
                    {stat.prefix}
                    {stat.value.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <View style={[styles.statAccentLine, { backgroundColor: stat.color }]} />
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, onViewAll }: { title: string; onViewAll: () => void }) {
    return (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
                <View style={styles.sectionAccentBar} />
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            <TouchableOpacity style={styles.viewAllBtn} onPress={onViewAll}>
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="arrow-forward" size={13} color={Colors.primary} />
            </TouchableOpacity>
        </View>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({
    icon,
    title,
    subtitle,
    ctaLabel,
    onCta,
}: {
    icon: string;
    title: string;
    subtitle: string;
    ctaLabel?: string;
    onCta?: () => void;
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pulse = () => {
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1.08,
                useNativeDriver: true,
                speed: 20,
                bounciness: 10,
            }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
        ]).start();
    };

    return (
        <View style={styles.emptyWrap}>
            <View style={styles.emptyIconCircle}>
                <Ionicons name={icon as any} size={40} color={Colors.primaryBorder} />
            </View>
            <Text style={styles.emptyTitle}>{title}</Text>
            <Text style={styles.emptySubtitle}>{subtitle}</Text>
            {ctaLabel && (
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <TouchableOpacity
                        style={styles.ctaBtn}
                        onPress={() => {
                            pulse();
                            onCta?.();
                        }}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="add" size={16} color={Colors.white} />
                        <Text style={styles.ctaBtnText}>{ctaLabel}</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
}

// ─── Insight row ─────────────────────────────────────────────────────────────
function InsightRow({
    icon,
    label,
    value,
    color,
}: {
    icon: string;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <View style={styles.insightRow}>
            <View style={[styles.insightIcon, { backgroundColor: color + '22' }]}>
                <Ionicons name={icon as any} size={15} color={color} />
            </View>
            <Text style={styles.insightLabel}>{label}</Text>
            <Text style={[styles.insightValue, { color }]}>{value}</Text>
        </View>
    );
}

// ─── Recent venue row ─────────────────────────────────────────────────────────
function VenueRow({ venue }: { venue: RecentVenue }) {
    const st = STATUS_MAP[venue.status] ?? STATUS_MAP.pending;
    return (
        <View style={styles.listRow}>
            <View style={[styles.listAccent, { backgroundColor: st.color }]} />
            <View style={styles.listBody}>
                <View style={styles.listTopRow}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                        {venue.businessName}
                    </Text>
                    <View style={[styles.statusChip, { backgroundColor: st.bg }]}>
                        <Text style={[styles.statusChipText, { color: st.color }]}>{st.label}</Text>
                    </View>
                </View>
                <View style={styles.listMeta}>
                    {venue.location?.city ? (
                        <View style={styles.metaItem}>
                            <Ionicons
                                name="location-outline"
                                size={11}
                                color={Colors.charcoalLight}
                            />
                            <Text style={styles.metaText}>{venue.location.city}</Text>
                        </View>
                    ) : null}
                    {venue.venueType?.length ? (
                        <View style={styles.metaItem}>
                            <Ionicons
                                name="business-outline"
                                size={11}
                                color={Colors.charcoalLight}
                            />
                            <Text style={styles.metaText}>{venue.venueType[0]}</Text>
                        </View>
                    ) : null}
                    {venue.totalBookings !== undefined ? (
                        <View style={styles.metaItem}>
                            <Ionicons
                                name="bookmark-outline"
                                size={11}
                                color={Colors.charcoalLight}
                            />
                            <Text style={styles.metaText}>{venue.totalBookings} bookings</Text>
                        </View>
                    ) : null}
                </View>
            </View>
            <Ionicons name="chevron-forward" size={15} color={Colors.border} />
        </View>
    );
}

// ─── Recent booking row ───────────────────────────────────────────────────────
function BookingRow({ booking }: { booking: RecentBooking }) {
    const st = STATUS_MAP[booking.status] ?? STATUS_MAP.pending;
    return (
        <View style={styles.listRow}>
            <View style={[styles.listAccent, { backgroundColor: st.color }]} />
            <View style={styles.listBody}>
                <View style={styles.listTopRow}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                        {booking.venue?.businessName ?? booking.customerDetails?.name ?? '—'}
                    </Text>
                    <View style={[styles.statusChip, { backgroundColor: st.bg }]}>
                        <Text style={[styles.statusChipText, { color: st.color }]}>{st.label}</Text>
                    </View>
                </View>
                <View style={styles.listMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={11} color={Colors.charcoalLight} />
                        <Text style={styles.metaText}>{fmtDate(booking.bookingDate)}</Text>
                    </View>
                    {booking.customerDetails?.eventType ? (
                        <View style={styles.metaItem}>
                            <Ionicons name="flag-outline" size={11} color={Colors.charcoalLight} />
                            <Text style={styles.metaText}>{booking.customerDetails.eventType}</Text>
                        </View>
                    ) : null}
                </View>
                <Text style={styles.bookingAmount}>{fmtCurrency(booking.amount)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={Colors.border} />
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
type dashboardProps = NativeBottomTabScreenProps<OwnerTabParamList, 'dashboard'>;

export default function OwnerDashboardScreen({ navigation }: dashboardProps) {
    const { user } = useAuthStore();
    const headerSlide = useRef(new Animated.Value(-20)).current;
    const headerFade = useRef(new Animated.Value(0)).current;

    // FIX: properly typed state
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
    const [recentVenues, setRecentVenues] = useState<RecentVenue[]>([]);

    // FIX: call fetchStats on mount
    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerFade, { toValue: 1, duration: 420, useNativeDriver: true }),
            Animated.spring(headerSlide, {
                toValue: 0,
                useNativeDriver: true,
                speed: 16,
                bounciness: 5,
            }),
        ]).start();

        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await ownerAPI.getDashboard();
            if (response?.success) {
                setStats(response.stats);
                setRecentBookings(response.recentBookings ?? []);
                setRecentVenues(response.recentVenues ?? []);
            }
        } catch (error) {
            console.error('FETCH OWNER DASHBOARD STATS ERROR : ', error);
        }
    };

    // FIX: build STATS array from API response instead of undefined constant
    const statCards: StatConfig[] = useMemo(
        () => [
            {
                id: 'venues',
                label: 'Total Venues',
                value: stats?.totalVenues ?? 0,
                prefix: '',
                icon: 'business-outline',
                color: Colors.primary,
                bg: Colors.primaryLight,
            },
            {
                id: 'bookings',
                label: 'Total Bookings',
                value: stats?.totalBookings ?? 0,
                prefix: '',
                icon: 'calendar-outline',
                color: Colors.info,
                bg: Colors.infoLight,
            },
            {
                id: 'earnings',
                label: 'Earnings',
                value: stats?.totalEarnings ?? 0,
                prefix: '₹',
                icon: 'cash-outline',
                color: Colors.success,
                bg: Colors.successLight,
            },
            {
                id: 'pending',
                label: 'Pending',
                value: stats?.pendingBookings ?? 0,
                prefix: '',
                icon: 'time-outline',
                color: Colors.warning,
                bg: Colors.warningLight,
            },
        ],
        [stats],
    );

    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            <Animated.View
                style={[
                    styles.header,
                    { opacity: headerFade, transform: [{ translateY: headerSlide }] },
                ]}
            >
                <View style={styles.headerAccentBar} />
                <View style={styles.headerContent}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerEyebrow}>WELCOME BACK!</Text>
                        <Text style={styles.headerTitle}>Dashboard</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            style={styles.headerIconBtn}
                            onPress={() => Alert.alert('Notifications')}
                        >
                            <Ionicons
                                name="notifications-outline"
                                size={20}
                                color={Colors.charcoal}
                            />
                            <View style={styles.notifDot} />
                        </TouchableOpacity>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{user?.name.slice(0,2).toUpperCase()}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.ownerChip}>
                    <View style={styles.ownerChipDot} />
                    <Text style={styles.ownerChipText}>{user?.role}</Text>
                </View>
            </Animated.View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentPadding}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Stats grid from API ── */}
                <View style={styles.statsGrid}>
                    {statCards.map((stat, i) => (
                        <StatCard key={stat.id} stat={stat} index={i} />
                    ))}
                </View>

                {/* ── Performance insights ── */}
                <View style={styles.insightsCard}>
                    <View style={styles.insightsHeader}>
                        <Ionicons name="trending-up-outline" size={18} color={Colors.primary} />
                        <Text style={styles.insightsTitle}>Venue Status</Text>
                    </View>
                    <InsightRow
                        icon="checkmark-circle-outline"
                        label="Approved Venues"
                        value={String(stats?.approvedVenues ?? 0)}
                        color={Colors.success}
                    />
                    <View style={styles.insightDivider} />
                    <InsightRow
                        icon="time-outline"
                        label="Pending Approval"
                        value={String(stats?.pendingVenues ?? 0)}
                        color={Colors.warning}
                    />
                    <View style={styles.insightDivider} />
                    <InsightRow
                        icon="checkmark-done-outline"
                        label="Confirmed Bookings"
                        value={String(stats?.confirmedBookings ?? 0)}
                        color={Colors.info}
                    />
                    <View style={styles.insightDivider} />
                    <InsightRow
                        icon="close-circle-outline"
                        label="Rejected Venues"
                        value={String(stats?.rejectedVenues ?? 0)}
                        color={Colors.danger}
                    />
                </View>

                {/* ── My Venues — from API ── */}
                <View style={styles.section}>
                    <SectionHeader title="My Venues" onViewAll={() => Alert.alert('My Venues')} />
                    {recentVenues.length === 0 ? (
                        <EmptyState
                            icon="business-outline"
                            title="No venues yet"
                            subtitle="Start by adding your first venue and reach thousands of clients."
                            ctaLabel="Add Your First Venue"
                            onCta={() => Alert.alert('Add Venue')}
                        />
                    ) : (
                        <View style={styles.listContainer}>
                            {recentVenues.map((v, i) => (
                                <View key={v._id}>
                                    <VenueRow venue={v} />
                                    {i < recentVenues.length - 1 && (
                                        <View style={styles.rowDivider} />
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* ── Recent Bookings — from API ── */}
                <View style={[styles.section, { marginBottom: 110 }]}>
                    <SectionHeader
                        title="Recent Bookings"
                        onViewAll={() => Alert.alert('Bookings')}
                    />
                    {recentBookings.length === 0 ? (
                        <EmptyState
                            icon="calendar-outline"
                            title="No bookings yet"
                            subtitle="Bookings will appear here once customers book your venues."
                        />
                    ) : (
                        <View style={styles.listContainer}>
                            {recentBookings.map((b, i) => (
                                <View key={b._id}>
                                    <BookingRow booking={b} />
                                    {i < recentBookings.length - 1 && (
                                        <View style={styles.rowDivider} />
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const STAT_W = (SCREEN_WIDTH - 32 - Spacing.lg * 3) / 2;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    // Header
    header: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        paddingBottom: Spacing.lg,
        ...Shadows.header,
    },
    headerAccentBar: {
        height: 4,
        backgroundColor: Colors.primary,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
    },
    headerContent: {
        flexDirection: 'row',
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
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    headerIconBtn: {
        width: 44,
        height: 44,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
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
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 14,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.5,
    },
    ownerChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginHorizontal: Spacing.xl,
        marginTop: Spacing.sm,
        alignSelf: 'flex-start',
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    ownerChipDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.primary },
    ownerChipText: {
        fontSize: 10,
        fontWeight: Typography.extraBold,
        color: Colors.primaryDark,
        letterSpacing: 1.5,
    },

    // Content
    content: { flex: 1 },
    contentPadding: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },

    // Stats
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
    statCardInner: { padding: Spacing.lg, position: 'relative' },
    statArc: {
        position: 'absolute',
        top: -28,
        right: -28,
        width: 80,
        height: 80,
        borderRadius: 40,
        opacity: 0.4,
    },
    statIconWrap: {
        width: 44,
        height: 44,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    statValueNum: {
        fontSize: 28,
        fontWeight: Typography.extraBold,
        letterSpacing: -1.5,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.semiBold,
        letterSpacing: 0.2,
    },
    statAccentLine: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        borderBottomLeftRadius: Radii.xl,
        borderBottomRightRadius: Radii.xl,
    },

    // Insights
    insightsCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadows.card,
    },
    insightsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    insightsTitle: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
    },
    insightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: 10,
    },
    insightIcon: {
        width: 32,
        height: 32,
        borderRadius: Spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    insightLabel: {
        flex: 1,
        fontSize: 13,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    insightValue: { fontSize: 14, fontWeight: Typography.extraBold },
    insightDivider: { height: 1, backgroundColor: Colors.divider },

    // Section
    section: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadows.card,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    sectionAccentBar: { width: 4, height: 20, backgroundColor: Colors.primary, borderRadius: 2 },
    sectionTitle: {
        fontSize: 17,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    viewAllText: { fontSize: 13, fontWeight: Typography.bold, color: Colors.primary },

    // List rows (venues & bookings)
    listContainer: { gap: 0 },
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
    },
    listAccent: { width: 3, height: 52, borderRadius: 2 },
    listBody: { flex: 1 },
    listTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    listTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginRight: Spacing.sm,
    },
    listMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metaText: { fontSize: 11, color: Colors.charcoalLight, fontWeight: Typography.medium },
    statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full },
    statusChipText: { fontSize: 10, fontWeight: Typography.bold, letterSpacing: 0.3 },
    bookingAmount: {
        fontSize: 14,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
        marginTop: 3,
    },
    rowDivider: { height: 1, backgroundColor: Colors.background, marginLeft: 15 },

    // Empty state
    emptyWrap: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xs,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
    },
    emptySubtitle: {
        fontSize: 13,
        color: Colors.charcoalLight,
        textAlign: 'center',
        paddingHorizontal: 24,
        lineHeight: 20,
    },
    ctaBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: 13,
        borderRadius: Radii.full,
        marginTop: Spacing.sm,
        ...Shadows.primary,
    },
    ctaBtnText: {
        fontSize: 14,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.2,
    },
});

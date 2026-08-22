import { Colors, Shadows, StatusConfig, Spacing, Typography, Radii } from '@/theme/theme';
import React, { useMemo, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Modal,
    Pressable,
    SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGetAmbassadorBookings } from '../hooks/useAmbassador';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { AmbassadorTabParamList } from '@/navigations/tabNavigations/AmbassadorTabNavigation';

// ── Types ──────────────────────────────────────────────────────────────────
type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';

interface AmbassadorBooking {
    id: string;
    bookingNumber: string;
    venueName: string;
    guestName: string;
    date: string; // ISO date
    amount: number;
    shareAmount: number;
    status: BookingStatus;
}

const FILTERS: { key: 'all' | BookingStatus; label: string }[] = [
    { key: 'all', label: 'All Bookings' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
];

const currency = (n: number) =>
    `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// ── Screen ─────────────────────────────────────────────────────────────────
type AmbassadorVenueBookingScreenProps = NativeBottomTabScreenProps<AmbassadorTabParamList, 'bookings'>

export default function AmbasssadorVenueBookingScreen({ navigation }: AmbassadorVenueBookingScreenProps) {
    const { data, isLoading, isRefetching, refetch } = useGetAmbassadorBookings();

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | BookingStatus>('all');
    const [filterOpen, setFilterOpen] = useState(false);

    const bookings: AmbassadorBooking[] = data?.bookings ?? [];
    const totalBookings = data?.count ?? bookings.length;
    const totalPaidVolume = bookings.reduce((sum, b) => sum + (b.amount ?? 0), 0);
    const totalShareEarnings = data?.totalShareEarnings ?? 0;

    const filtered = useMemo(() => {
        return bookings.filter((b) => {
            const matchesFilter = filter === 'all' || b.status === filter;
            const q = search.trim().toLowerCase();
            const matchesSearch =
                !q ||
                b.bookingNumber?.toLowerCase().includes(q) ||
                b.venueName?.toLowerCase().includes(q);
            return matchesFilter && matchesSearch;
        });
    }, [bookings, filter, search]);

    const onRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    return (
        <SafeAreaView style={styles.container}>
            {/* ── Header ─────────────────────────────────────────── */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Venue Bookings (25%)</Text>
                    <Text style={styles.headerSubtitle}>
                        RentalMeet™ Venue Acquisition & Ambassador Portal
                    </Text>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.listVenueBtn} activeOpacity={0.85}>
                        <Icon name="add-circle" size={16} color={Colors.white} />
                        <Text style={styles.listVenueBtnText}>List Venue</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
                        <Icon
                            name="notifications-outline"
                            size={20}
                            color={Colors.charcoal}
                        />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>S</Text>
                    </View>
                    <View>
                        <Text style={styles.userName}>Sahil Shivnani</Text>
                        <Text style={styles.userRole}>Ambassador Partner</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
            >
                {/* ── Profit share banner ───────────────────────── */}
                <LinearGradient
                    colors={['#6C2BD9', Colors.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.4 }}
                    style={styles.banner}
                >
                    <View style={styles.bannerBadge}>
                        <Icon name="trending-up" size={12} color={Colors.white} />
                        <Text style={styles.bannerBadgeText}>
                            12-MONTH 25% RECURRING PROFIT SHARE
                        </Text>
                    </View>

                    <Text style={styles.bannerTitle}>Venue Bookings & Revenue Share</Text>
                    <Text style={styles.bannerDesc}>
                        You automatically receive 25% of RentalMeet platform profit on all
                        bookings completed at your listed venues for a full 12 months from
                        their approval date.
                    </Text>

                    <TouchableOpacity
                        style={styles.bannerRefreshBtn}
                        onPress={onRefresh}
                        activeOpacity={0.8}
                    >
                        <Icon name="refresh" size={18} color={Colors.white} />
                    </TouchableOpacity>
                </LinearGradient>

                {/* ── Stat cards ─────────────────────────────────── */}
                <View style={styles.statsRow}>
                    <StatCard
                        label="Total Bookings"
                        value={String(totalBookings)}
                        caption="Across all your listed venues"
                        iconName="calendar-outline"
                        iconBg={Colors.infoLight}
                        iconColor={Colors.info}
                    />
                    <StatCard
                        label="Total Paid Booking Volume"
                        value={currency(totalPaidVolume)}
                        caption="Gross booking transaction value"
                        iconName="cash-outline"
                        iconBg={Colors.primaryLight}
                        iconColor={Colors.primaryDark}
                    />
                    <StatCard
                        label="Your 25% Profit Share"
                        value={currency(totalShareEarnings)}
                        caption="Credited to your wallet on settlement"
                        iconName="trending-up-outline"
                        iconBg={Colors.successLight}
                        iconColor={Colors.success}
                    />
                </View>

                {/* ── Search + filter ────────────────────────────── */}
                <View style={styles.searchRow}>
                    <View style={styles.searchBox}>
                        <Icon name="search" size={16} color={Colors.charcoalLight} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search booking #, venue name..."
                            placeholderTextColor={Colors.charcoalLight}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.filterBtn}
                        activeOpacity={0.8}
                        onPress={() => setFilterOpen(true)}
                    >
                        <Text style={styles.filterBtnText}>
                            {FILTERS.find((f) => f.key === filter)?.label}
                        </Text>
                        <Icon name="chevron-down" size={16} color={Colors.charcoalMid} />
                    </TouchableOpacity>
                </View>

                {/* ── List / empty / loading ─────────────────────── */}
                <View style={styles.listCard}>
                    {isLoading ? (
                        <View style={styles.centerState}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={styles.centerStateText}>Loading bookings...</Text>
                        </View>
                    ) : filtered.length === 0 ? (
                        <View style={styles.centerState}>
                            <View style={styles.emptyIconWrap}>
                                <Icon
                                    name="calendar-clear-outline"
                                    size={26}
                                    color={Colors.primaryDark}
                                />
                            </View>
                            <Text style={styles.emptyTitle}>No bookings yet</Text>
                            <Text style={styles.centerStateText}>
                                Bookings made at your listed venues will show up here.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filtered}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                            ItemSeparatorComponent={() => (
                                <View style={styles.rowSeparator} />
                            )}
                            renderItem={({ item }) => <BookingRow booking={item} />}
                        />
                    )}
                </View>
            </ScrollView>

            {/* ── Filter modal ───────────────────────────────────── */}
            <Modal
                transparent
                visible={filterOpen}
                animationType="fade"
                onRequestClose={() => setFilterOpen(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setFilterOpen(false)}
                >
                    <View style={styles.filterSheet}>
                        {FILTERS.map((f) => (
                            <TouchableOpacity
                                key={f.key}
                                style={styles.filterOption}
                                onPress={() => {
                                    setFilter(f.key);
                                    setFilterOpen(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.filterOptionText,
                                        filter === f.key && styles.filterOptionTextActive,
                                    ]}
                                >
                                    {f.label}
                                </Text>
                                {filter === f.key && (
                                    <Icon name="checkmark" size={18} color={Colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({
    label,
    value,
    caption,
    iconName,
    iconBg,
    iconColor,
}: {
    label: string;
    value: string;
    caption: string;
    iconName: string;
    iconBg: string;
    iconColor: string;
}) {
    return (
        <View style={[styles.statCard, Shadows.card]}>
            <View style={styles.statCardTop}>
                <Text style={styles.statLabel}>{label}</Text>
                <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
                    <Icon name={iconName} size={14} color={iconColor} />
                </View>
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statCaption}>{caption}</Text>
        </View>
    );
}

// ── Booking row ───────────────────────────────────────────────────────────
function BookingRow({ booking }: { booking: AmbassadorBooking }) {
    const status = StatusConfig[booking.status];

    return (
        <TouchableOpacity style={styles.bookingRow} activeOpacity={0.7}>
            <View style={styles.bookingRowLeft}>
                <Text style={styles.bookingNumber}>{booking.bookingNumber}</Text>
                <Text style={styles.bookingVenue} numberOfLines={1}>
                    {booking.venueName}
                </Text>
                <Text style={styles.bookingMeta}>
                    {booking.guestName} · {new Date(booking.date).toLocaleDateString(
                        'en-IN',
                        { day: '2-digit', month: 'short', year: 'numeric' }
                    )}
                </Text>
            </View>

            <View style={styles.bookingRowRight}>
                <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                    <Icon name={status.icon} size={12} color={status.color} />
                    <Text style={[styles.statusPillText, { color: status.color }]}>
                        {status.label}
                    </Text>
                </View>
                <Text style={styles.bookingAmount}>{currency(booking.amount)}</Text>
                <Text style={styles.bookingShare}>
                    +{currency(booking.shareAmount)} share
                </Text>
            </View>
        </TouchableOpacity>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xxl * 2,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
    },
    headerSubtitle: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        marginTop: 2,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listVenueBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radii.full,
        marginRight: Spacing.sm,
        ...Shadows.primary,
    },
    listVenueBtnText: {
        color: Colors.white,
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        marginLeft: 4,
    },
    iconBtn: {
        width: 34,
        height: 34,
        borderRadius: Radii.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        marginRight: Spacing.sm,
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: Colors.divider,
        marginRight: Spacing.sm,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: Radii.full,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
    },
    avatarText: {
        color: Colors.primaryDark,
        fontWeight: Typography.bold,
        fontSize: Typography.sm,
    },
    userName: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    userRole: {
        fontSize: Typography.xs,
        color: Colors.primaryDark,
        fontWeight: Typography.medium,
    },

    // Banner
    banner: {
        marginTop: Spacing.lg,
        borderRadius: Radii.xl,
        padding: Spacing.xl,
        overflow: 'hidden',
    },
    bannerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.18)',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radii.full,
        marginBottom: Spacing.sm,
    },
    bannerBadgeText: {
        color: Colors.white,
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        letterSpacing: Typography.normal,
        marginLeft: 6,
    },
    bannerTitle: {
        color: Colors.white,
        fontSize: Typography.xxl,
        fontWeight: Typography.extraBold,
        marginBottom: Spacing.xs,
    },
    bannerDesc: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: Typography.base,
        lineHeight: 19,
        paddingRight: Spacing.xxl,
    },
    bannerRefreshBtn: {
        position: 'absolute',
        top: Spacing.lg,
        right: Spacing.lg,
        width: 34,
        height: 34,
        borderRadius: Radii.full,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Stat cards
    statsRow: {
        flexDirection: 'row',
        marginTop: Spacing.lg,
        marginHorizontal: -Spacing.xs / 2,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        marginHorizontal: Spacing.xs / 2,
    },
    statCardTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    statLabel: {
        flex: 1,
        fontSize: Typography.xs,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
        marginRight: Spacing.xs,
    },
    statIconWrap: {
        width: 26,
        height: 26,
        borderRadius: Radii.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        marginTop: Spacing.sm,
    },
    statCaption: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        marginTop: 2,
    },

    // Search + filter
    searchRow: {
        flexDirection: 'row',
        marginTop: Spacing.lg,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.md,
        paddingHorizontal: Spacing.md,
        height: 42,
        marginRight: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.charcoal,
        marginLeft: Spacing.xs,
        padding: 0,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.md,
        paddingHorizontal: Spacing.md,
        height: 42,
    },
    filterBtnText: {
        fontSize: Typography.base,
        color: Colors.charcoal,
        fontWeight: Typography.medium,
        marginRight: 6,
    },

    // List card
    listCard: {
        marginTop: Spacing.lg,
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        minHeight: 220,
        overflow: 'hidden',
    },
    centerState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xxl * 2,
        paddingHorizontal: Spacing.xl,
    },
    centerStateText: {
        marginTop: Spacing.sm,
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        textAlign: 'center',
    },
    emptyIconWrap: {
        width: 52,
        height: 52,
        borderRadius: Radii.full,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    emptyTitle: {
        fontSize: Typography.md,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
        marginBottom: 2,
    },

    // Booking row
    bookingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    rowSeparator: {
        height: 1,
        backgroundColor: Colors.divider,
    },
    bookingRowLeft: {
        flex: 1,
        marginRight: Spacing.md,
    },
    bookingNumber: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    bookingVenue: {
        fontSize: Typography.md,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
        marginTop: 2,
    },
    bookingMeta: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        marginTop: 2,
    },
    bookingRowRight: {
        alignItems: 'flex-end',
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radii.full,
        marginBottom: Spacing.xs,
    },
    statusPillText: {
        fontSize: Typography.xs,
        fontWeight: Typography.semiBold,
        marginLeft: 4,
    },
    bookingAmount: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    bookingShare: {
        fontSize: Typography.xs,
        color: Colors.success,
        fontWeight: Typography.medium,
        marginTop: 1,
    },

    // Filter modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(30,27,20,0.4)',
        justifyContent: 'flex-end',
    },
    filterSheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xl,
        borderTopRightRadius: Radii.xl,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    filterOptionText: {
        fontSize: Typography.md,
        color: Colors.charcoalMid,
    },
    filterOptionTextActive: {
        color: Colors.primaryDark,
        fontWeight: Typography.semiBold,
    },
});
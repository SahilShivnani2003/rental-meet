import { Colors, Shadows, StatusConfig, Spacing, Typography, Radii } from '@/theme/theme';
import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useGetAmbassadorVenues } from '../hooks/useAmbassador';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { AmbassadorTabParamList } from '@/navigations/tabNavigations/AmbassadorTabNavigation';

// react-native-vector-icons doesn't expose a glyph-map type, so icon names are
// typed as plain strings here.
type IconName = string;

type VenueStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed' | string;

interface Venue {
    id: string;
    name: string;
    city?: string;
    address?: string;
    status: VenueStatus;
    submittedAt?: string;
    bookingsCount?: number;
    ownerName?: string;
}

type FilterKey = 'all' | 'approved' | 'pending' | 'rejected';

// ── Small building blocks ─────────────────────────────────────────────────────

const StatCard: React.FC<{
    icon: IconName;
    label: string;
    value: string;
    accent?: string;
    accentBg?: string;
}> = ({ icon, label, value, accent = Colors.primary, accentBg }) => (
    <View style={[styles.statCard, Shadows.card]}>
        <View style={[styles.statIconWrap, { backgroundColor: accentBg ?? `${accent}1F` }]}>
            <Ionicons name={icon} size={16} color={accent} />
        </View>
        <View>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>
        </View>
    </View>
);

const FilterPill: React.FC<{
    label: string;
    count: number;
    active: boolean;
    onPress: () => void;
}> = ({ label, count, active, onPress }) => (
    <TouchableOpacity
        style={[styles.filterPill, active && styles.filterPillActive]}
        onPress={onPress}
        activeOpacity={0.85}
    >
        <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
            {label} ({count})
        </Text>
    </TouchableOpacity>
);

const StatusBadge: React.FC<{ status: VenueStatus }> = ({ status }) => {
    const config = StatusConfig[status] ?? {
        color: Colors.charcoalMid,
        bg: Colors.border,
        icon: 'help-circle',
        label: status,
    };
    return (
        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={11} color={config.color} />
            <Text style={[styles.statusBadgeText, { color: config.color }]}>{config.label}</Text>
        </View>
    );
};

const VenueCard: React.FC<{ venue: Venue }> = ({ venue }) => (
    <View style={[styles.venueCard, Shadows.card]}>
        <View style={styles.venueIconWrap}>
            <Ionicons name="business" size={18} color={Colors.primary} />
        </View>
        <View style={styles.venueInfo}>
            <Text style={styles.venueName} numberOfLines={1}>
                {venue.name}
            </Text>
            <Text style={styles.venueMeta} numberOfLines={1}>
                {[venue.address, venue.city].filter(Boolean).join(', ') || 'Address not available'}
            </Text>
            <View style={styles.venueFooterRow}>
                {!!venue.submittedAt && (
                    <Text style={styles.venueSubmitted}>Submitted {venue.submittedAt}</Text>
                )}
                {typeof venue.bookingsCount === 'number' && (
                    <Text style={styles.venueSubmitted}>· {venue.bookingsCount} bookings</Text>
                )}
            </View>
        </View>
        <StatusBadge status={venue.status} />
    </View>
);

const EmptyState: React.FC<{ hasQuery: boolean }> = ({ hasQuery }) => (
    <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
            <Ionicons name="document-text-outline" size={26} color={Colors.charcoalLight} />
        </View>
        <Text style={styles.emptyTitle}>No venues found</Text>
        <Text style={styles.emptySubtitle}>
            {hasQuery
                ? 'Try adjusting your search or add a new venue listing.'
                : 'Start listing nearby hotels, banquets, or meeting rooms.'}
        </Text>
    </View>
);

// ── Main screen ────────────────────────────────────────────────────────────────
type MyListedVenueScreenProps = NativeBottomTabScreenProps<AmbassadorTabParamList, 'venues'>

const MyListedVenuesScreen = ({navigation}: MyListedVenueScreenProps) => {
    const { data, isLoading, isError, refetch } = useGetAmbassadorVenues();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterKey>('all');

    const venues: Venue[] = data?.venues ?? [];
    const profitShareStatus = data?.profitShareStatus;

    const counts = useMemo(() => {
        const approved = venues.filter(
            v => v.status === 'confirmed' || v.status === 'completed',
        ).length;
        const pending = venues.filter(v => v.status === 'pending').length;
        const rejected = venues.filter(v => v.status === 'cancelled').length;
        return { all: venues.length, approved, pending, rejected };
    }, [venues]);

    const filteredVenues = useMemo(() => {
        let list = venues;
        if (filter === 'approved')
            list = list.filter(v => v.status === 'confirmed' || v.status === 'completed');
        if (filter === 'pending') list = list.filter(v => v.status === 'pending');
        if (filter === 'rejected') list = list.filter(v => v.status === 'cancelled');
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(
                v =>
                    v.name?.toLowerCase().includes(q) ||
                    v.city?.toLowerCase().includes(q) ||
                    v.ownerName?.toLowerCase().includes(q),
            );
        }
        return list;
    }, [venues, filter, search]);

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={Colors.primary} size="large" />
            </View>
        );
    }

    if (isError) {
        return (
            <View style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={28} color={Colors.charcoalLight} />
                <Text style={styles.emptySubtitle}>Couldn't load your venues.</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            {/* ── Header ────────────────────────────────────────────────────── */}
            <View style={styles.headerCard}>
                <View style={styles.headerRow}>
                    <View style={styles.headerTextWrap}>
                        <Text style={styles.headerTitle}>
                            My Listed <Text style={styles.headerTitleAccent}>Venues</Text>
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            Manage all spaces you have acquired and submitted to RentalMeet.
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.listNewBtn} activeOpacity={0.9}>
                        <Ionicons name="add-circle" size={16} color={Colors.white} />
                        <Text style={styles.listNewBtnText}>List New Venue</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Earning sharing rule banner ───────────────────────────── */}
                {!!profitShareStatus && (
                    <View style={styles.ruleBanner}>
                        <Ionicons
                            name="flash"
                            size={16}
                            color={Colors.warning}
                            style={styles.ruleIcon}
                        />
                        <Text style={styles.ruleText}>
                            <Text style={styles.ruleTextBold}>Earning Sharing Rule: </Text>
                            7-Day Power Streak (Roz {profitShareStatus.dailyTarget} Venues x{' '}
                            {profitShareStatus.streakTarget} Din = Total{' '}
                            {profitShareStatus.totalVenuesTarget} Venues) complete hone par{' '}
                            <Text style={styles.ruleTextBold}>1 Year (365 Days)</Text> ke liye 25%
                            Booking Profit Share unlock ho jayega! (Streak Progress:{' '}
                            {profitShareStatus.streakDaysCompleted}/{profitShareStatus.streakTarget}{' '}
                            Days • Total: {profitShareStatus.totalStreakVenues}/
                            {profitShareStatus.totalVenuesTarget} Venues)
                        </Text>
                        <View style={styles.ruleDaysPill}>
                            <Text style={styles.ruleDaysPillText}>
                                {profitShareStatus.streakDaysRemaining} Days Left (
                                {profitShareStatus.totalStreakVenues}/
                                {profitShareStatus.totalVenuesTarget} Venues)
                            </Text>
                            <Ionicons name="lock-closed" size={11} color={Colors.warning} />
                        </View>
                    </View>
                )}

                {/* ── Stat cards ─────────────────────────────────────────────── */}
                <View style={styles.statsGrid}>
                    <StatCard
                        icon="albums-outline"
                        label="Submitted Venues"
                        value={`${counts.all}`}
                        accent={Colors.info}
                    />
                    <StatCard
                        icon="checkmark-circle-outline"
                        label="Approved Live"
                        value={`${counts.approved}`}
                        accent={Colors.success}
                    />
                    <StatCard
                        icon="calendar-outline"
                        label="Total Bookings"
                        value={`${venues.reduce((sum, v) => sum + (v.bookingsCount ?? 0), 0)}`}
                        accent={Colors.charcoalMid}
                    />
                    <StatCard
                        icon="gift-outline"
                        label="25% Profit Share"
                        value={`₹0`}
                        accent="#7C3AED"
                        accentBg="rgba(124,58,237,0.12)"
                    />
                </View>

                {/* ── Search + filters ───────────────────────────────────────── */}
                <View style={styles.searchRow}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search" size={15} color={Colors.charcoalLight} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search venue, city, owner..."
                            placeholderTextColor={Colors.charcoalLight}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterRow}
                    >
                        <FilterPill
                            label="All"
                            count={counts.all}
                            active={filter === 'all'}
                            onPress={() => setFilter('all')}
                        />
                        <FilterPill
                            label="Approved"
                            count={counts.approved}
                            active={filter === 'approved'}
                            onPress={() => setFilter('approved')}
                        />
                        <FilterPill
                            label="Pending"
                            count={counts.pending}
                            active={filter === 'pending'}
                            onPress={() => setFilter('pending')}
                        />
                        <FilterPill
                            label="Rejected"
                            count={counts.rejected}
                            active={filter === 'rejected'}
                            onPress={() => setFilter('rejected')}
                        />
                    </ScrollView>
                </View>
            </View>

            {/* ── Venue list / empty state ─────────────────────────────────── */}
            <FlatList
                data={filteredVenues}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <VenueCard venue={item} />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<EmptyState hasQuery={!!search.trim() || filter !== 'all'} />}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

export default MyListedVenuesScreen;

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.background,
    },

    headerCard: {
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
        gap: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },

    // Header row
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    headerTextWrap: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    headerTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
    },
    headerTitleAccent: {
        color: Colors.primary,
    },
    headerSubtitle: {
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
        marginTop: 2,
    },
    listNewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.full,
    },
    listNewBtnText: {
        color: Colors.white,
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
    },

    // Rule banner
    ruleBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.warningLight,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        borderRadius: Radii.md,
        padding: Spacing.sm,
        gap: Spacing.sm,
    },
    ruleIcon: {
        marginTop: 1,
    },
    ruleText: {
        flex: 1,
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
        lineHeight: 17,
    },
    ruleTextBold: {
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    ruleDaysPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        paddingVertical: 5,
        paddingHorizontal: Spacing.sm,
        borderRadius: Radii.full,
    },
    ruleDaysPillText: {
        fontSize: Typography.xs,
        fontWeight: Typography.semiBold,
        color: Colors.warning,
    },

    // Stats grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        justifyContent: 'space-between',
    },
    statCard: {
        width: '48.5%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.lg,
        padding: Spacing.md,
    },
    statIconWrap: {
        width: 34,
        height: 34,
        borderRadius: Radii.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statLabel: {
        fontSize: Typography.xs,
        color: Colors.charcoalMid,
        marginBottom: 2,
    },
    statValue: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },

    // Search + filters
    searchRow: {
        gap: Spacing.sm,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: 9,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.sm,
        color: Colors.charcoal,
        padding: 0,
    },
    filterRow: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    filterPill: {
        paddingVertical: 7,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.full,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterPillActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterPillText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    filterPillTextActive: {
        color: Colors.white,
    },

    // Venue list
    listContent: {
        padding: Spacing.lg,
        paddingTop: Spacing.md,
        flexGrow: 1,
    },
    venueCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    venueIconWrap: {
        width: 40,
        height: 40,
        borderRadius: Radii.sm,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    venueInfo: {
        flex: 1,
    },
    venueName: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    venueMeta: {
        fontSize: Typography.xs,
        color: Colors.charcoalMid,
        marginTop: 2,
    },
    venueFooterRow: {
        flexDirection: 'row',
        gap: 4,
        marginTop: 4,
    },
    venueSubmitted: {
        fontSize: 10,
        color: Colors.charcoalLight,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 5,
        paddingHorizontal: Spacing.sm,
        borderRadius: Radii.full,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: Typography.semiBold,
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xxl * 2,
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
    },
    emptyIconWrap: {
        width: 56,
        height: 56,
        borderRadius: Radii.full,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    emptyTitle: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginBottom: 3,
    },
    emptySubtitle: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        textAlign: 'center',
        paddingHorizontal: Spacing.xl,
    },

    // Retry
    retryBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.full,
        marginTop: Spacing.sm,
    },
    retryBtnText: {
        color: Colors.white,
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
    },
});

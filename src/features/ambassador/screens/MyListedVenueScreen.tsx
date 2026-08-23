import { Colors, Shadows, StatusConfig, Spacing, Typography, Radii } from '@/theme/theme';
import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    FlatList,
    Animated,
    RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useGetAmbassadorVenues } from '../hooks/useAmbassador';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { AmbassadorTabParamList } from '@/navigations/tabNavigations/AmbassadorTabNavigation';
import useEntrance from '@/hooks/useEntrance';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';

// react-native-vector-icons doesn't expose a glyph-map type, so icon names are
// typed as plain strings here.
type IconName = string;

type VenueStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed' | string;

interface VenueLocation {
    address?: string;
    city?: string;
}

interface VenueOwnerInfo {
    fullName?: string;
}

interface Venue {
    _id: string;
    businessName: string;
    location?: VenueLocation;
    status: VenueStatus;
    createdAt?: string;
    totalBookings?: number;
    ownerInfo?: VenueOwnerInfo;
    ambassadorProfitShare?: number;
}

type FilterKey = 'all' | 'approved' | 'pending' | 'rejected';

const formatDate = (iso?: string) => {
    if (!iso) return undefined;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return undefined;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ── Pressable scale wrapper ──────────────────────────────────────────────────
// Same press-in micro-interaction used across GuestProfile and the Ambassador
// Bookings screen, so every tappable element in the app feels consistent.
function Pressy({
    onPress,
    style,
    children,
    disabled,
}: {
    onPress?: () => void;
    style?: any;
    children: React.ReactNode;
    disabled?: boolean;
}) {
    const scale = useRef(new Animated.Value(1)).current;
    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                style={style}
                onPress={onPress}
                disabled={disabled}
                activeOpacity={1}
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
            >
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
}

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
        <View style={{ flex: 1 }}>
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
    <Pressy style={[styles.filterPill, active && styles.filterPillActive]} onPress={onPress}>
        <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
            {label} ({count})
        </Text>
    </Pressy>
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

// Reworked to match the Ambassador Bookings row anatomy: colored icon wrap,
// title/meta in the middle, status chip, and a circular chevron affordance —
// with the same press-in scale used everywhere else.
const VenueCard: React.FC<{ venue: Venue; onPress?: () => void }> = ({ venue, onPress }) => {
    const scale = useRef(new Animated.Value(1)).current;
    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                style={[styles.venueCard, Shadows.card]}
                activeOpacity={1}
                onPress={onPress}
                onPressIn={() =>
                    Animated.spring(scale, {
                        toValue: 0.98,
                        useNativeDriver: true,
                        speed: 30,
                    }).start()
                }
                onPressOut={() =>
                    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22 }).start()
                }
            >
                <View style={styles.venueIconWrap}>
                    <Ionicons name="business" size={18} color={Colors.primary} />
                </View>
                <View style={styles.venueInfo}>
                    <Text style={styles.venueName} numberOfLines={1}>
                        {venue.businessName}
                    </Text>
                    <Text style={styles.venueMeta} numberOfLines={1}>
                        {[venue.location?.address, venue.location?.city]
                            .filter(Boolean)
                            .join(', ') || 'Address not available'}
                    </Text>
                    <View style={styles.venueFooterRow}>
                        {!!formatDate(venue.createdAt) && (
                            <Text style={styles.venueSubmitted}>
                                Submitted {formatDate(venue.createdAt)}
                            </Text>
                        )}
                        {typeof venue.totalBookings === 'number' && (
                            <Text style={styles.venueSubmitted}>
                                · {venue.totalBookings} bookings
                            </Text>
                        )}
                    </View>
                    <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                        <StatusBadge status={venue.status} />
                    </View>
                </View>
                <View style={styles.menuChevronWrap}>
                    <Ionicons name="chevron-forward" size={15} color={Colors.charcoalLight} />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const EmptyState: React.FC<{ hasQuery: boolean }> = ({ hasQuery }) => (
    <View style={styles.emptyState}>
        <View style={styles.emptyIconRing}>
            <View style={styles.emptyIconWrap}>
                <Ionicons name="document-text-outline" size={24} color={Colors.primaryDark} />
            </View>
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
type MyListedVenueScreenProps = NativeBottomTabScreenProps<AmbassadorTabParamList, 'venues'>;

const MyListedVenuesScreen = ({ navigation }: MyListedVenueScreenProps) => {
    const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    const { data, isLoading, isError, refetch, isRefetching } = useGetAmbassadorVenues();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterKey>('all');

    const venues: Venue[] = data?.venues ?? [];
    const profitShareStatus = data?.profitShareStatus;

    // ── Entrance animations ──
    // Same choreography as GuestProfile / Ambassador Bookings: header fades
    // & slides in immediately, then the rule banner, stats & search stagger
    // in behind it.
    const headerFade = useRef(new Animated.Value(0)).current;
    const heroSlide = useRef(new Animated.Value(-16)).current;
    const { fade: bannerFade, slide: bannerSlide } = useEntrance(150);
    const { fade: statsFade, slide: statsSlide } = useEntrance(280);
    const { fade: listFade, slide: listSlide } = useEntrance(420);

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
                    v.businessName?.toLowerCase().includes(q) ||
                    v.location?.city?.toLowerCase().includes(q) ||
                    v.ownerInfo?.fullName?.toLowerCase().includes(q),
            );
        }
        return list;
    }, [venues, filter, search]);

    const goToVenueDetail = (venue: Venue) => console.log('navigating to venue detail');
    const goToOnboardVenue = () => rootNav.navigate('addVenue');

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
                <View style={styles.emptyIconRing}>
                    <View style={styles.emptyIconWrap}>
                        <Ionicons
                            name="alert-circle-outline"
                            size={24}
                            color={Colors.primaryDark}
                        />
                    </View>
                </View>
                <Text style={styles.emptySubtitle}>Couldn't load your venues.</Text>
                <Pressy style={styles.retryBtn} onPress={() => refetch()}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                </Pressy>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            {/* ── Header ────────────────────────────────────────────────────── */}
            <Animated.View
                style={[
                    styles.header,
                    { opacity: headerFade, transform: [{ translateY: heroSlide }] },
                ]}
            >
                <View style={styles.headerAccentBar} />
                <View style={styles.headerContent}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerEyebrow}>AMBASSADOR PORTAL</Text>
                        <Text style={styles.headerTitle}>My Listed Venues</Text>
                        <Text style={styles.headerSubtitle}>
                            Manage every space you've acquired & submitted
                        </Text>
                    </View>
                    <Pressy style={styles.listNewBtn} onPress={goToOnboardVenue}>
                        <Ionicons name="add-circle" size={16} color={Colors.white} />
                        <Text style={styles.listNewBtnText}>List Venue</Text>
                    </Pressy>
                </View>
            </Animated.View>

            {/* ── Venue list, with everything else as its scrolling header ──── */}
            <FlatList
                data={filteredVenues}
                keyExtractor={item => item._id}
                renderItem={({ item }) => (
                    <VenueCard venue={item} onPress={() => goToVenueDetail(item)} />
                )}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        {/* ── Earning sharing rule banner ─────────────────────── */}
                        {!!profitShareStatus && (
                            <Animated.View
                                style={{
                                    opacity: bannerFade,
                                    transform: [{ translateY: bannerSlide }],
                                }}
                            >
                                <View style={styles.ruleBanner}>
                                    <View style={styles.ruleBadge}>
                                        <Ionicons name="flash" size={12} color={Colors.warning} />
                                        <Text style={styles.ruleBadgeText}>
                                            EARNING SHARING RULE
                                        </Text>
                                    </View>
                                    <Text style={styles.ruleText}>
                                        7-Day Power Streak (Roz {profitShareStatus.dailyTarget}{' '}
                                        Venues x {profitShareStatus.streakTarget} Din = Total{' '}
                                        {profitShareStatus.totalVenuesTarget} Venues) complete hone
                                        par{' '}
                                        <Text style={styles.ruleTextBold}>1 Year (365 Days)</Text>{' '}
                                        ke liye 25% Booking Profit Share unlock ho jayega!
                                    </Text>
                                    <View style={styles.ruleFooterRow}>
                                        <Text style={styles.ruleProgressText}>
                                            Streak {profitShareStatus.streakDaysCompleted}/
                                            {profitShareStatus.streakTarget}d · Total{' '}
                                            {profitShareStatus.totalStreakVenues}/
                                            {profitShareStatus.totalVenuesTarget} venues
                                        </Text>
                                        <View style={styles.ruleDaysPill}>
                                            <Ionicons
                                                name="lock-closed"
                                                size={10}
                                                color={Colors.warning}
                                            />
                                            <Text style={styles.ruleDaysPillText}>
                                                {profitShareStatus.streakDaysRemaining} days left
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </Animated.View>
                        )}

                        {/* ── Stat cards ───────────────────────────────────────── */}
                        <Animated.View
                            style={[
                                styles.statsGrid,
                                { opacity: statsFade, transform: [{ translateY: statsSlide }] },
                            ]}
                        >
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
                                value={`${venues.reduce(
                                    (sum, v) => sum + (v.totalBookings ?? 0),
                                    0,
                                )}`}
                                accent={Colors.charcoalMid}
                            />
                            <StatCard
                                icon="gift-outline"
                                label="25% Profit Share"
                                value={`₹${venues.reduce(
                                    (sum, v) => sum + (v.ambassadorProfitShare ?? 0),
                                    0,
                                )}`}
                                accent="#7C3AED"
                                accentBg="rgba(124,58,237,0.12)"
                            />
                        </Animated.View>

                        {/* ── Search + filters ─────────────────────────────────── */}
                        <Animated.View
                            style={{ opacity: listFade, transform: [{ translateY: listSlide }] }}
                        >
                            <View style={styles.searchBox}>
                                <Ionicons name="search" size={16} color={Colors.charcoalLight} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search venue, city, owner..."
                                    placeholderTextColor={Colors.charcoalLight}
                                    value={search}
                                    onChangeText={setSearch}
                                />
                                {search.length > 0 && (
                                    <TouchableOpacity
                                        onPress={() => setSearch('')}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        accessibilityRole="button"
                                        accessibilityLabel="Clear search"
                                    >
                                        <Ionicons
                                            name="close-circle"
                                            size={16}
                                            color={Colors.charcoalLight}
                                        />
                                    </TouchableOpacity>
                                )}
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

                            {/* ── Section label ─────────────────────────────────── */}
                            <View style={styles.sectionLabelRow}>
                                <Text style={styles.menuSectionLabel}>VENUES</Text>
                                <Text style={styles.resultsCount}>
                                    {filteredVenues.length} of {venues.length}
                                    {filter !== 'all' ? ` · ${filter}` : ''}
                                </Text>
                            </View>
                        </Animated.View>
                    </>
                }
                ListEmptyComponent={<EmptyState hasQuery={!!search.trim() || filter !== 'all'} />}
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

    // ── Header ── (matches GuestProfile / Ambassador Bookings: accent bar + eyebrow + title)
    header: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        paddingBottom: Spacing.lg,
        ...Shadows.header,
        zIndex: 10,
    },
    headerAccentBar: { height: 4, backgroundColor: Colors.primary },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
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
        borderRadius: Radii.md,
        marginTop: 2,
        ...Shadows.primary,
    },
    listNewBtnText: {
        color: Colors.white,
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
    },

    // ── Rule banner ──
    ruleBanner: {
        backgroundColor: Colors.warningLight,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        borderRadius: Radii.xl,
        padding: Spacing.md,
        gap: Spacing.xs,
        marginTop: Spacing.lg,
    },
    ruleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
        backgroundColor: Colors.surface,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    ruleBadgeText: {
        fontSize: 9,
        fontWeight: Typography.extraBold,
        color: Colors.warning,
        letterSpacing: 0.6,
    },
    ruleText: {
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
        lineHeight: 17,
    },
    ruleTextBold: {
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    ruleFooterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 2,
    },
    ruleProgressText: {
        flex: 1,
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        marginRight: Spacing.xs,
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

    // ── Stats grid ──
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        justifyContent: 'space-between',
        marginTop: Spacing.lg,
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

    // ── Search + filters ──
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.md,
        paddingHorizontal: Spacing.md,
        height: 42,
        marginTop: Spacing.lg,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.charcoal,
        padding: 0,
    },
    filterRow: {
        flexDirection: 'row',
        gap: Spacing.xs,
        marginTop: Spacing.sm,
    },
    filterPill: {
        paddingVertical: 7,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.full,
        backgroundColor: Colors.surface,
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

    // ── Section label ──
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.xxs,
    },
    menuSectionLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 2,
    },
    resultsCount: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
    },

    // ── Venue list ──
    listContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 120,
        flexGrow: 1,
    },
    venueCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    venueIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    venueInfo: {
        flex: 1,
    },
    venueName: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
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
    menuChevronWrap: {
        width: 28,
        height: 28,
        borderRadius: Spacing.sm,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },

    // ── Empty state ──
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xxl * 2,
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
    },
    emptyIconRing: {
        width: 68,
        height: 68,
        borderRadius: 34,
        borderWidth: 2,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        padding: 3,
        marginBottom: Spacing.sm,
    },
    emptyIconWrap: {
        flex: 1,
        borderRadius: 30,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
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

    // ── Retry ──
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

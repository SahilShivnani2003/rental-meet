import { Colors, Shadows, StatusConfig, Spacing, Typography, Radii } from '@/theme/theme';
import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
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
    Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGetAmbassadorBookings } from '../hooks/useAmbassador';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { AmbassadorTabParamList } from '@/navigations/tabNavigations/AmbassadorTabNavigation';
import useEntrance from '@/hooks/useEntrance';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';

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

// Extra accent colors, shared visual language with the Ambassador Dashboard
// screen so the two feel like the same app rather than two different apps.
// Ideally this palette gets lifted into theme.ts as a shared export.
const ACCENTS = {
    navyDark: '#0F1230',
    navyMid: '#1E1B4B',
    purpleLight: '#EDE9FE',
    purpleDark: '#4C3B96',
    teal: '#0EA5A5',
    tealLight: '#CCFBF1',
    tealDark: '#0F766E',
    amber: '#F5A623',
    amberLight: '#FDECC8',
    amberDark: '#8A5A00',
    slateLight: '#E2E8F0',
    slateDark: '#1E293B',
};

// Fallback so an unrecognized/unmapped booking status never crashes the row
// instead of silently trusting StatusConfig[booking.status] to exist.
const FALLBACK_STATUS = {
    bg: ACCENTS.slateLight,
    color: ACCENTS.slateDark,
    icon: 'help-circle-outline',
    label: 'Unknown',
};

const currency = (n: number) =>
    `₹${(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// ── Pressable scale wrapper ──────────────────────────────────────────────────
// Shared "press-in shrinks slightly" micro-interaction used across the app
// (see GuestProfile's LockedRow / OpenRow) so every tappable row here feels
// consistent with the rest of the product.
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

// ── Screen ─────────────────────────────────────────────────────────────────
type AmbassadorVenueBookingScreenProps = NativeBottomTabScreenProps<
    AmbassadorTabParamList,
    'bookings'
>;

export default function AmbasssadorVenueBookingScreen({
    navigation,
}: AmbassadorVenueBookingScreenProps) {
    const { data, isLoading, isRefetching, refetch } = useGetAmbassadorBookings();
    const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | BookingStatus>('all');
    const [filterOpen, setFilterOpen] = useState(false);

    const bookings: AmbassadorBooking[] = data?.bookings ?? [];
    const totalBookings = data?.count ?? bookings.length;
    const totalPaidVolume = bookings.reduce((sum, b) => sum + (b.amount ?? 0), 0);
    const totalShareEarnings = data?.totalShareEarnings ?? 0;

    // Ambassador identity for the header. This screen's own hook only
    // returns booking data, so fall back gracefully rather than hardcoding
    // a specific person's name — wire in the real profile source (e.g. a
    // shared useAmbassadorProfile hook / auth context) when available.
    const ambassadorName = (data as any)?.ambassador?.name ?? 'Ambassador';
    const ambassadorInitial = ambassadorName.trim().charAt(0).toUpperCase() || 'A';

    // ── Entrance animations ──
    // Same choreography as GuestProfile: header fades/slides in immediately,
    // then the banner, stats & list stagger in behind it.
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

    const filtered = useMemo(() => {
        return bookings.filter(b => {
            const matchesFilter = filter === 'all' || b.status === filter;
            const q = search.trim().toLowerCase();
            const matchesSearch =
                !q ||
                b.bookingNumber?.toLowerCase().includes(q) ||
                b.venueName?.toLowerCase().includes(q) ||
                b.guestName?.toLowerCase().includes(q);
            return matchesFilter && matchesSearch;
        });
    }, [bookings, filter, search]);

    const onRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    // Navigation helpers — adjust route names to match your actual
    // AmbassadorTabParamList / parent stack navigator.
    const goToOnboardVenue = () => rootNav.navigate('addVenue');
    const goToBookingDetail = (booking: AmbassadorBooking) =>navigation.navigate('bookings');

    const activeFilterLabel = FILTERS.find(f => f.key === filter)?.label ?? 'All Bookings';

    return (
        <View style={styles.container}>
            {/* ── Header ─────────────────────────────────────────── */}
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
                        <Text style={styles.headerTitle}>Venue Bookings</Text>
                        <View style={styles.shareChip}>
                            <Icon name="trending-up" size={10} color={Colors.primary} />
                            <Text style={styles.shareChipText}>25% PROFIT SHARE · 12 MONTHS</Text>
                        </View>
                    </View>

                    <View style={styles.headerActions}>
                        <Pressy style={styles.listVenueBtn} onPress={goToOnboardVenue}>
                            <Icon name="add-circle" size={16} color={Colors.white} />
                            <Text style={styles.listVenueBtnText}>List Venue</Text>
                        </Pressy>                        
                    </View>
                </View>
            </Animated.View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentPadding}
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
                <Animated.View
                    style={{ opacity: bannerFade, transform: [{ translateY: bannerSlide }] }}
                >
                    <LinearGradient
                        colors={[ACCENTS.navyMid, ACCENTS.navyDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0.4 }}
                        style={styles.banner}
                    >
                        <View style={styles.bannerBadge}>
                            <Icon name="trending-up" size={12} color={ACCENTS.purpleDark} />
                            <Text style={styles.bannerBadgeText}>
                                12-MONTH 25% RECURRING PROFIT SHARE
                            </Text>
                        </View>

                        <Text style={styles.bannerTitle}>Venue Bookings & Revenue Share</Text>
                        <Text style={styles.bannerDesc}>
                            You automatically receive 25% of RentalMeet platform profit on all
                            bookings completed at your listed venues for a full 12 months from their
                            approval date.
                        </Text>

                        <Pressy style={styles.bannerRefreshBtn} onPress={onRefresh}>
                            <Icon name="refresh" size={18} color={Colors.white} />
                        </Pressy>
                    </LinearGradient>
                </Animated.View>

                {/* ── Stat cards ─────────────────────────────────── */}
                <Animated.View
                    style={[
                        styles.statsRow,
                        { opacity: statsFade, transform: [{ translateY: statsSlide }] },
                    ]}
                >
                    <StatCard
                        label="Total Bookings"
                        value={String(totalBookings)}
                        caption="Across all your listed venues"
                        iconName="calendar-outline"
                        iconBg={ACCENTS.tealLight}
                        iconColor={ACCENTS.tealDark}
                    />
                    <StatCard
                        label="Total Paid Booking Volume"
                        value={currency(totalPaidVolume)}
                        caption="Gross booking transaction value"
                        iconName="cash-outline"
                        iconBg={ACCENTS.amberLight}
                        iconColor={ACCENTS.amberDark}
                    />
                    <StatCard
                        label="Your 25% Profit Share"
                        value={currency(totalShareEarnings)}
                        caption="Credited to your wallet on settlement"
                        iconName="trending-up-outline"
                        iconBg={Colors.successLight}
                        iconColor={Colors.success}
                    />
                </Animated.View>

                {/* ── Search + filter ────────────────────────────── */}
                <Animated.View
                    style={[
                        styles.searchRow,
                        { opacity: listFade, transform: [{ translateY: listSlide }] },
                    ]}
                >
                    <View style={styles.searchBox}>
                        <Icon name="search" size={16} color={Colors.charcoalLight} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search booking #, venue, guest..."
                            placeholderTextColor={Colors.charcoalLight}
                            value={search}
                            onChangeText={setSearch}
                            returnKeyType="search"
                        />
                        {search.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setSearch('')}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                accessibilityRole="button"
                                accessibilityLabel="Clear search"
                            >
                                <Icon name="close-circle" size={16} color={Colors.charcoalLight} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <Pressy
                        style={[styles.filterBtn, filter !== 'all' && styles.filterBtnActive]}
                        onPress={() => setFilterOpen(true)}
                    >
                        <Text
                            style={[
                                styles.filterBtnText,
                                filter !== 'all' && styles.filterBtnTextActive,
                            ]}
                            numberOfLines={1}
                        >
                            {activeFilterLabel}
                        </Text>
                        <Icon
                            name="chevron-down"
                            size={16}
                            color={filter !== 'all' ? ACCENTS.tealDark : Colors.charcoalMid}
                        />
                    </Pressy>
                </Animated.View>

                {/* ── Section label + results count ───────────────── */}
                <Animated.View
                    style={{ opacity: listFade, transform: [{ translateY: listSlide }] }}
                >
                    <View style={styles.sectionLabelRow}>
                        <Text style={styles.menuSectionLabel}>BOOKINGS</Text>
                        {!isLoading && bookings.length > 0 && (
                            <Text style={styles.resultsCount}>
                                {filtered.length} of {bookings.length}
                                {filter !== 'all' ? ` · ${activeFilterLabel}` : ''}
                            </Text>
                        )}
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
                                <View style={styles.emptyIconRing}>
                                    <View style={styles.emptyIconWrap}>
                                        <Icon
                                            name={
                                                bookings.length === 0
                                                    ? 'calendar-clear-outline'
                                                    : 'search-outline'
                                            }
                                            size={24}
                                            color={Colors.primaryDark}
                                        />
                                    </View>
                                </View>
                                <Text style={styles.emptyTitle}>
                                    {bookings.length === 0
                                        ? 'No bookings yet'
                                        : 'No matching bookings'}
                                </Text>
                                <Text style={styles.centerStateText}>
                                    {bookings.length === 0
                                        ? 'Bookings made at your listed venues will show up here.'
                                        : 'Try a different search term or filter.'}
                                </Text>
                                {bookings.length > 0 && (search || filter !== 'all') && (
                                    <TouchableOpacity
                                        style={styles.clearFiltersBtn}
                                        onPress={() => {
                                            setSearch('');
                                            setFilter('all');
                                        }}
                                        accessibilityRole="button"
                                        accessibilityLabel="Clear search and filters"
                                    >
                                        <Text style={styles.clearFiltersBtnText}>
                                            Clear search & filters
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <FlatList
                                data={filtered}
                                keyExtractor={item => item.id}
                                scrollEnabled={false}
                                ItemSeparatorComponent={() => <View style={styles.menuDivider} />}
                                renderItem={({ item }) => (
                                    <BookingRow
                                        booking={item}
                                        onPress={() => goToBookingDetail(item)}
                                    />
                                )}
                            />
                        )}
                    </View>
                </Animated.View>
            </ScrollView>

            {/* ── Filter modal ───────────────────────────────────── */}
            <Modal
                transparent
                visible={filterOpen}
                animationType="fade"
                onRequestClose={() => setFilterOpen(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setFilterOpen(false)}>
                    <View style={styles.filterSheet}>
                        <View style={styles.filterSheetHandle} />
                        <Text style={styles.filterSheetTitle}>FILTER BOOKINGS</Text>
                        {FILTERS.map(f => (
                            <TouchableOpacity
                                key={f.key}
                                style={styles.filterOption}
                                onPress={() => {
                                    setFilter(f.key);
                                    setFilterOpen(false);
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={f.label}
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
        </View>
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
// Reworked to mirror GuestProfile's menu-row anatomy: a colored icon wrap on
// the left, title/subtitle in the middle, and a circular chevron affordance
// on the right — with the same press-in scale micro-interaction.
function BookingRow({ booking, onPress }: { booking: AmbassadorBooking; onPress?: () => void }) {
    const scale = useRef(new Animated.Value(1)).current;

    // Guard against a status value the app doesn't recognize instead of
    // crashing on status.bg / status.color / status.icon being undefined.
    const status = StatusConfig[booking.status] ?? {
        ...FALLBACK_STATUS,
        label: booking.status ?? FALLBACK_STATUS.label,
    };

    const formattedDate = (() => {
        const d = new Date(booking.date);
        if (Number.isNaN(d.getTime())) return booking.date ?? '';
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    })();

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                style={styles.bookingRow}
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
                <View style={[styles.bookingIconWrap, { backgroundColor: status.bg }]}>
                    <Icon name="business-outline" size={18} color={status.color} />
                </View>

                <View style={styles.bookingRowLeft}>
                    <Text style={styles.bookingVenue} numberOfLines={1}>
                        {booking.venueName}
                    </Text>
                    <Text style={styles.bookingMeta} numberOfLines={1}>
                        {booking.bookingNumber} · {booking.guestName} · {formattedDate}
                    </Text>
                    <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                        <Icon name={status.icon} size={11} color={status.color} />
                        <Text style={[styles.statusPillText, { color: status.color }]}>
                            {status.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.bookingRowRight}>
                    <Text style={styles.bookingAmount}>{currency(booking.amount)}</Text>
                    <Text style={styles.bookingShare}>+{currency(booking.shareAmount)}</Text>
                </View>

                <View style={styles.menuChevronWrap}>
                    <Icon name="chevron-forward" size={15} color={Colors.charcoalLight} />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    // ── Header ── (matches GuestProfile: accent bar + eyebrow + title)
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
        marginBottom: Spacing.sm,
    },
    shareChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radii.full,
    },
    shareChipText: {
        fontSize: 9,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
        letterSpacing: 0.6,
    },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    listVenueBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.md,
        height: 38,
        borderRadius: Radii.md,
        ...Shadows.primary,
    },
    listVenueBtnText: {
        color: Colors.white,
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
    },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarBtn: {
        width: 38,
        height: 38,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: Radii.full,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: Colors.primaryDark,
        fontWeight: Typography.bold,
        fontSize: Typography.xs,
    },

    // ── Content ──
    content: { flex: 1 },
    contentPadding: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: 120,
    },

    // ── Banner ──
    banner: {
        borderRadius: 24,
        padding: Spacing.xl,
        overflow: 'hidden',
        marginBottom: Spacing.xl,
        ...Shadows.floating,
    },
    bannerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: ACCENTS.purpleLight,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radii.full,
        marginBottom: Spacing.sm,
    },
    bannerBadgeText: {
        color: ACCENTS.purpleDark,
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
        letterSpacing: -0.3,
    },
    bannerDesc: {
        color: 'rgba(255,255,255,0.75)',
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
        backgroundColor: 'rgba(255,255,255,0.16)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Stat cards ──
    statsRow: {
        flexDirection: 'row',
        marginBottom: Spacing.xl,
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

    // ── Search + filter ──
    searchRow: {
        flexDirection: 'row',
        marginBottom: Spacing.lg,
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
        gap: Spacing.xs,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.charcoal,
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
        maxWidth: 150,
        gap: 6,
    },
    filterBtnActive: {
        backgroundColor: ACCENTS.tealLight,
        borderColor: ACCENTS.teal,
    },
    filterBtnText: {
        fontSize: Typography.base,
        color: Colors.charcoal,
        fontWeight: Typography.medium,
        flexShrink: 1,
    },
    filterBtnTextActive: {
        color: ACCENTS.tealDark,
        fontWeight: Typography.semiBold,
    },

    // ── Section label ──
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
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

    // ── List card ──
    listCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden',
        minHeight: 220,
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
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
        marginBottom: 2,
    },
    clearFiltersBtn: {
        marginTop: Spacing.md,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.full,
        backgroundColor: ACCENTS.tealLight,
    },
    clearFiltersBtnText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: ACCENTS.tealDark,
    },

    // ── Booking row ──
    bookingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        gap: 12,
    },
    bookingIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookingRowLeft: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    bookingVenue: {
        fontSize: 15,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginBottom: 2,
    },
    bookingMeta: {
        fontSize: 11.5,
        color: Colors.charcoalLight,
        fontWeight: Typography.regular,
        marginBottom: 6,
    },
    bookingRowRight: {
        alignItems: 'flex-end',
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: Radii.full,
    },
    statusPillText: {
        fontSize: 10,
        fontWeight: Typography.bold,
        letterSpacing: 0.2,
    },
    bookingAmount: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    bookingShare: {
        fontSize: 11,
        color: Colors.success,
        fontWeight: Typography.semiBold,
        marginTop: 2,
    },
    menuChevronWrap: {
        width: 28,
        height: 28,
        borderRadius: Spacing.sm,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuDivider: { height: 1, backgroundColor: Colors.background, marginLeft: 72 },

    // ── Filter modal ──
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
    filterSheetHandle: {
        alignSelf: 'center',
        width: 36,
        height: 4,
        borderRadius: Radii.full,
        backgroundColor: Colors.border,
        marginBottom: Spacing.sm,
    },
    filterSheetTitle: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 1.5,
        marginBottom: Spacing.xs,
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

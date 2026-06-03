// BookingsScreen.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    ListRenderItemInfo,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '@/store/useAuthStore';
import { useGetAllBookings } from '../hooks/useGetAllbookings';
import BookingCard from '@/components/booking/booking-card';
import NotAuthenticatedScreen from '@/components/not-authenticated';
import EmptyState from '@/components/UI/empty-state';
import Loader from '@/components/UI/loader';
import { ClientTabParamList } from '@/navigations/tabNavigations/ClientTabNavigation';
import { StatusConfig, Colors, Radii, Shadows, Spacing, Typography } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import { Booking } from '../types/Booking';
import { useGetCustomerServicebookings } from '../hooks/useVendorBooking';

// ─── Constants ────────────────────────────────────────────────────────────────

type BookingsProps = NativeBottomTabScreenProps<ClientTabParamList, 'bookings'>;

const TABS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const;

const EMPTY_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
    all: 'calendar-outline',
    pending: 'time-outline',
    confirmed: 'checkmark-circle-outline',
    completed: 'checkmark-done-circle-outline',
    cancelled: 'close-circle-outline',
};

const EMPTY_DESC: Record<string, string> = {
    all: 'Your bookings will appear here',
    pending: 'No pending bookings right now.',
    confirmed: 'No confirmed bookings found.',
    completed: 'You have no completed bookings yet.',
    cancelled: 'No cancelled bookings found.',
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BookingsScreen({ navigation }: BookingsProps) {
    const { user, isAuthenticated } = useAuthStore();

    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('all');
    const [bookingType, setBookingType] = useState<'venue' | 'service'>('venue');

    // ── Pass status filter to the query so the server filters ─────────────────
    const statusParam = activeTab === 'all' ? undefined : activeTab;

    const {
        data: bookingData,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        refetch,
        isRefetching,
    } = useGetAllBookings(
        { enabled: isAuthenticated && bookingType === 'venue' },
        { status: statusParam },
    );

    const { data: serviceBookingData, refetch: serviceBookingRefetch } =
        useGetCustomerServicebookings();
    const serviceBookings = serviceBookingData?.bookings ?? [];

    // ── Flatten paginated pages into a single array ────────────────────────────
    const bookings = useMemo(
        () => bookingData?.pages.flatMap(page => page.bookings ?? []) ?? [],
        [bookingData],
    );

    const activeBookings = bookingType === 'venue' ? bookings : serviceBookings;

    // ── For service bookings, filter client-side (no pagination support yet) ───
    const filtered =
        bookingType === 'service' && activeTab !== 'all'
            ? activeBookings.filter((b: Booking) => b.status === activeTab)
            : activeBookings;

    // ── Counts: use total from last page for venue, length for service ─────────
    const totalVenueCount = bookingData?.pages[0]?.total ?? bookingData?.pages[0]?.totalCount ?? 0;

    const counts = useMemo(() => {
        return TABS.reduce<Record<string, number>>((acc, t) => {
            if (bookingType === 'venue') {
                // For venue, "all" shows server total; per-status counts are local
                // (accurate only for loaded pages — you can extend this if your API
                //  returns per-status counts in the response envelope)
                acc[t] =
                    t === 'all'
                        ? totalVenueCount
                        : bookings.filter((b: Booking) => b.status === t).length;
            } else {
                acc[t] =
                    t === 'all'
                        ? serviceBookings.length
                        : serviceBookings.filter((b: Booking) => b.status === t).length;
            }
            return acc;
        }, {});
    }, [bookingType, bookings, serviceBookings, totalVenueCount]);

    // ── Sync refreshing with react-query's isRefetching ───────────────────────
    useEffect(() => {
        if (!isRefetching) setRefreshing(false);
    }, [isRefetching]);

    // ── Actions ────────────────────────────────────────────────────────────────

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        refetch();
        serviceBookingRefetch();
    }, [refetch, serviceBookingRefetch]);

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage && bookingType === 'venue') {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, bookingType]);

    // ── FlatList render helpers ────────────────────────────────────────────────

    const keyExtractor = useCallback((item: any) => item._id, []);

    const renderItem = useCallback(
        ({ item, index }: ListRenderItemInfo<any>) => (
            <TouchableOpacity
                onPress={() =>
                    navigation
                        .getParent<NativeStackNavigationProp<RootStackParamList>>()
                        .navigate('venueBookingDetail', { bookingId: item?._id })
                }
            >
                <BookingCard
                    booking={item}
                    userType={user?.role === 'customer' ? 'client' : user?.role ?? ''}
                    onStatusUpdate={() => refetch()}
                    index={index}
                />
            </TouchableOpacity>
        ),
        [user?.role, refetch, navigation],
    );

    const ListHeaderComponent = useCallback(() => <View style={styles.listTopSpacer} />, []);

    const ListFooterComponent = useCallback(
        () =>
            isFetchingNextPage ? (
                <View style={styles.paginationLoader}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.paginationLoaderText}>Loading more…</Text>
                </View>
            ) : (
                <View style={styles.listBottomSpacer} />
            ),
        [isFetchingNextPage],
    );

    const ListEmptyComponent = useCallback(
        () =>
            isLoading ? null : (
                <EmptyState
                    icon={EMPTY_ICON[activeTab] as any}
                    title="No bookings here"
                    description={EMPTY_DESC[activeTab]}
                />
            ),
        [isLoading, activeTab],
    );

    const ItemSeparatorComponent = useCallback(() => <View style={styles.separator} />, []);

    // ── Auth guard ─────────────────────────────────────────────────────────────

    if (!isAuthenticated) {
        return (
            <NotAuthenticatedScreen navigation={navigation.getParent()} featureLabel="Booking" />
        );
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <View style={styles.headerAccentBar} />
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerEyebrow}>OVERVIEW</Text>
                        <Text style={styles.headerTitle}>My Bookings</Text>
                    </View>
                    <View style={styles.totalBadge}>
                        <Text style={styles.totalBadgeNum}>{totalVenueCount}</Text>
                        <Text style={styles.totalBadgeLabel}>Total</Text>
                    </View>
                </View>

                {/* Status summary chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.summaryStrip}
                >
                    {Object.entries(StatusConfig).map(([key, cfg]) => (
                        <View key={key} style={[styles.summaryChip, { backgroundColor: cfg.bg }]}>
                            <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                            <Text style={[styles.summaryChipText, { color: cfg.color }]}>
                                {counts[key] ?? 0} {cfg.label}
                            </Text>
                        </View>
                    ))}
                </ScrollView>

                {/* ── Booking type tabs (customer only) ── */}
                {user?.role === 'customer' && (
                    <View style={styles.typeTabsWrapper}>
                        {(['venue', 'service'] as const).map(type => {
                            const isActive = bookingType === type;
                            return (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.typeTab, isActive && styles.typeTabActive]}
                                    onPress={() => {
                                        setBookingType(type);
                                        setActiveTab('all');
                                    }}
                                    activeOpacity={0.75}
                                >
                                    <Ionicons
                                        name={
                                            type === 'venue'
                                                ? 'business-outline'
                                                : 'construct-outline'
                                        }
                                        size={14}
                                        color={isActive ? Colors.white : Colors.charcoalMid}
                                    />
                                    <Text
                                        style={[
                                            styles.typeTabText,
                                            isActive && styles.typeTabTextActive,
                                        ]}
                                    >
                                        {type === 'venue' ? 'Venue' : 'Service'}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* ── Filter tabs ── */}
            <View style={styles.tabsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContainer}
                >
                    {TABS.map(tab => {
                        const isActive = activeTab === tab;
                        const cfg = StatusConfig[tab];
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, isActive && styles.tabActive]}
                                onPress={() => setActiveTab(tab)}
                                activeOpacity={0.75}
                            >
                                {cfg && (
                                    <View
                                        style={[
                                            styles.tabDot,
                                            {
                                                backgroundColor: isActive
                                                    ? Colors.white
                                                    : cfg.color,
                                            },
                                        ]}
                                    />
                                )}
                                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                    {tab === 'all' ? 'All' : StatusConfig[tab]?.label ?? tab}
                                </Text>
                                {counts[tab] > 0 && (
                                    <View
                                        style={[styles.tabCount, isActive && styles.tabCountActive]}
                                    >
                                        <Text
                                            style={[
                                                styles.tabCountText,
                                                isActive && styles.tabCountTextActive,
                                            ]}
                                        >
                                            {counts[tab]}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ── Initial load overlay ── */}
            {isLoading && <Loader size="md" label="Loading bookings…" style={styles.loader} />}

            {/* ── Bookings FlatList ── */}
            <FlatList<any>
                data={filtered}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                ListHeaderComponent={ListHeaderComponent}
                ListFooterComponent={ListFooterComponent}
                ListEmptyComponent={ListEmptyComponent}
                ItemSeparatorComponent={ItemSeparatorComponent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.flatListContent}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.4}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={Colors.primary}
                    />
                }
                removeClippedSubviews
                initialNumToRender={8}
                maxToRenderPerBatch={8}
                windowSize={10}
            />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    // Header
    header: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        ...Shadows.header,
        paddingBottom: Spacing.lg,
    },
    headerAccentBar: { height: 4, backgroundColor: Colors.primary },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.lg,
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
    totalBadge: {
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.lg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
    },
    totalBadgeNum: {
        fontSize: 22,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
        lineHeight: 26,
    },
    totalBadgeLabel: {
        fontSize: 10,
        fontWeight: Typography.bold,
        color: Colors.primaryDark,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    summaryStrip: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
    summaryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radii.full,
    },
    summaryChipText: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        letterSpacing: Typography.normal,
    },

    // Type tabs
    typeTabsWrapper: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        gap: Spacing.sm,
    },
    typeTab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    typeTabActive: {
        backgroundColor: Colors.charcoal,
        borderColor: Colors.charcoal,
    },
    typeTabText: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    typeTabTextActive: { color: Colors.white },

    // Filter tabs
    tabsWrapper: { paddingVertical: 14 },
    tabsContainer: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.full,
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.border,
        gap: Spacing.xs,
    },
    tabActive: { backgroundColor: Colors.charcoal, borderColor: Colors.charcoal },
    tabDot: { width: 6, height: 6, borderRadius: 3 },
    tabText: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
        letterSpacing: Typography.normal,
    },
    tabTextActive: { color: Colors.white },
    tabCount: {
        backgroundColor: Colors.border,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 1,
        minWidth: 20,
        alignItems: 'center',
    },
    tabCountActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
    tabCountText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.charcoalLight },
    tabCountTextActive: { color: Colors.white },

    // FlatList
    flatListContent: { flexGrow: 1, paddingHorizontal: Spacing.lg },
    listTopSpacer: { height: Spacing.sm },
    listBottomSpacer: { height: 110 },
    separator: { height: Spacing.sm },
    paginationLoader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
        paddingBottom: 110,
    },
    paginationLoaderText: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
    },

    loader: { paddingTop: 64 },
});

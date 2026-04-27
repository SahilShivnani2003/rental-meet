import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    ListRenderItemInfo,
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

// ─── Layout constant (must be before component for getItemLayout) ─────────────
const BOOKING_CARD_HEIGHT = 148;

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

    const {
        data: bookingData,
        isLoading,
        isRefetching,
        refetch,
    } = useGetAllBookings({
        enabled: isAuthenticated,
    });
    const bookings = bookingData?.bookings ?? [];

    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('all');

    // ── Sync refreshing state with react-query's isRefetching ─────────────────
    useEffect(() => {
        if (!isRefetching) {
            setRefreshing(false);
        }
    }, [isRefetching]);

    // ── Actions ────────────────────────────────────────────────────────────────

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        refetch();
    }, [refetch]);

    // ── Derived data ───────────────────────────────────────────────────────────

    const filtered =
        activeTab === 'all' ? bookings : bookings.filter((b: Booking) => b.status === activeTab);

    const counts = TABS.reduce<Record<string, number>>((acc, t) => {
        acc[t] =
            t === 'all' ? bookings.length : bookings.filter((b: Booking) => b.status === t).length;
        return acc;
    }, {});

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

    const ListFooterComponent = useCallback(() => <View style={styles.listBottomSpacer} />, []);

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
                        <Text style={styles.totalBadgeNum}>{bookings.length}</Text>
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

            {/* ── Loader overlay (initial load only) ── */}
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
                getItemLayout={(_data, index) => ({
                    length: BOOKING_CARD_HEIGHT,
                    offset: BOOKING_CARD_HEIGHT * index,
                    index,
                })}
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

    loader: { paddingTop: 64 },
});

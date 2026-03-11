import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    Alert,
    ListRenderItemInfo,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows, StatusConfig } from '../../theme/theme';
import BookingCard from '../../components/booking/booking-card';
import { bookingAPI } from '../../service/apis/booking';
import { useAuthStore } from '../../store/auth-store';
import NotAuthenticatedScreen from '../../components/not-authenticated';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { ClientTabParamList } from '../../navigations/tabNavigations/ClientTabNavigation';
import EmptyState from '../../components/UI/empty-state';
import Loader from '../../components/UI/loader';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Booking = {
    id: string;
    venueName: string;
    status: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    notes: string | null;
};

type BookingsProps = NativeBottomTabScreenProps<ClientTabParamList, 'bookings'>;

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const;

// Tab → EmptyState icon map
const EMPTY_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
    all: 'calendar-outline',
    pending: 'time-outline',
    confirmed: 'checkmark-circle-outline',
    completed: 'checkmark-done-circle-outline',
    cancelled: 'close-circle-outline',
};

// Tab → EmptyState description map
const EMPTY_DESC: Record<string, string> = {
    all: 'Your bookings will appear here',
    pending: 'No pending bookings right now.',
    confirmed: 'No confirmed bookings found.',
    completed: 'You have no completed bookings yet.',
    cancelled: 'No cancelled bookings found.',
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BookingsScreen({ navigation }: BookingsProps) {
    const { user, token, isAuthenticated } = useAuthStore();

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('all');

    // ── Data fetching ──────────────────────────────────────────────────────────

    const fetchBookings = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            setLoading(true);
            const response = await bookingAPI.getAll();
            if (!response?.success) {
                console.error('FETCHING BOOKING ERROR:', response?.message);
                setBookings([]);
                return;
            }
            setBookings(response?.booking ?? []);
        } catch (error) {
            setBookings([]);
            console.error('FETCHING BOOKING ERROR:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchBookings();
    }, [fetchBookings]);

    // ── Actions ────────────────────────────────────────────────────────────────

    const handleStatusUpdate = useCallback((id: string, status: string) => {
        setBookings(prev => prev.map(b => (b.id === id ? { ...b, status } : b)));
        Alert.alert('Updated', `Booking marked as ${status}.`);
    }, []);

    // ── Derived data ───────────────────────────────────────────────────────────

    const filtered = bookings.filter(b => activeTab === 'all' || b.status === activeTab);

    const counts = TABS.reduce<Record<string, number>>((acc, t) => {
        acc[t] = t === 'all' ? bookings.length : bookings.filter(b => b.status === t).length;
        return acc;
    }, {});

    // ── FlatList render helpers ────────────────────────────────────────────────

    const keyExtractor = useCallback((item: Booking) => item.id, []);

    const renderItem = useCallback(
        ({ item, index }: ListRenderItemInfo<Booking>) => (
            <BookingCard
                booking={item}
                userType={user?.userType}
                onStatusUpdate={handleStatusUpdate}
                index={index}
            />
        ),
        [user?.userType, handleStatusUpdate],
    );

    const ListHeaderComponent = useCallback(() => <View style={styles.listTopSpacer} />, []);

    const ListFooterComponent = useCallback(() => <View style={styles.listBottomSpacer} />, []);

    const ListEmptyComponent = useCallback(
        () =>
            loading ? null : (
                <EmptyState
                    icon={EMPTY_ICON[activeTab] as any}
                    title="No bookings here"
                    description={EMPTY_DESC[activeTab]}
                />
            ),
        [loading, activeTab],
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
            {loading && <Loader size="md" label="Loading bookings…" style={styles.loader} />}

            {/* ── Bookings FlatList ── */}
            <FlatList<Booking>
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
                // Performance tuning
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

// ─── Layout constant (adjust to match BookingCard height) ─────────────────────
const BOOKING_CARD_HEIGHT = 148;

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

    // Inline loader (shows above the list on first load)
    loader: { paddingTop: 64 },
});

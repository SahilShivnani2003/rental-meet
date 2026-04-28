import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
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
import { Spacing, Colors, Radii, Shadows, Typography } from '@/theme/theme';
import { VendorTabParamList } from '@/navigations/tabNavigations/VendorTabNavigation';
import { ServiceBooking } from '../types/ServiceBooking';
import { useGetVendorServiceBooking } from '../hooks/useVendorBooking';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';

const { width: W } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { color: string; bg: string; label: string; icon: string }> = {
    enquiry: {
        color: Colors.warning,
        bg: Colors.warningLight,
        label: 'Enquiry',
        icon: 'help-circle',
    },
    confirmed: {
        color: Colors.success,
        bg: Colors.successLight,
        label: 'Confirmed',
        icon: 'checkmark-circle',
    },
    cancelled: {
        color: Colors.danger,
        bg: Colors.dangerLight,
        label: 'Cancelled',
        icon: 'close-circle',
    },
};

const PAYMENT_STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
    pending: { color: Colors.warning, bg: Colors.warningLight, label: 'Payment Pending' },
    paid: { color: Colors.success, bg: Colors.successLight, label: 'Paid' },
    failed: { color: Colors.danger, bg: Colors.dangerLight, label: 'Failed' },
};

const fmtCurrency = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const fmtDate = (d?: string | Date) => {
    if (!d) return '—';

    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const fmtDateTime = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

// ─── Booking Card ─────────────────────────────────────────────────────────────
type BookingCardProps = {
    booking: ServiceBooking;
    index: number;
    onPress: () => void;
};

function BookingCard({ booking, index, onPress }: BookingCardProps) {
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, {
                toValue: 1,
                delay: 100 + index * 60,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(slide, {
                toValue: 0,
                delay: 100 + index * 60,
                speed: 16,
                bounciness: 5,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const st = STATUS_MAP[booking.status || 'enquiry'] ?? STATUS_MAP.enquiry;
    const pst =
        PAYMENT_STATUS_MAP[booking.paymentStatus || 'pending'] ?? PAYMENT_STATUS_MAP.pending;

    return (
        <Animated.View
            style={[s.bookingCard, { opacity: fade, transform: [{ translateY: slide }] }]}
        >
            <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
                {/* Top bar */}
                <View style={[s.cardTopBar, { backgroundColor: st.color }]} />

                <View style={s.cardContent}>
                    {/* Header */}
                    <View style={s.cardHeader}>
                        <View style={s.cardHeaderLeft}>
                            <View style={[s.serviceIcon, { backgroundColor: Colors.primaryLight }]}>
                                <Ionicons name="camera-outline" size={18} color={Colors.primary} />
                            </View>
                            <View style={s.cardHeaderText}>
                                <Text style={s.serviceTitle} numberOfLines={1}>
                                    {booking.serviceSnapshot?.title ?? '—'}
                                </Text>
                                <Text style={s.bookingNumber}>{booking.bookingNumber}</Text>
                            </View>
                        </View>
                        <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                            <Ionicons name={st.icon as any} size={11} color={st.color} />
                            <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
                        </View>
                    </View>

                    {/* Customer info */}
                    <View style={s.infoSection}>
                        <View style={s.infoRow}>
                            <Ionicons
                                name="person-outline"
                                size={14}
                                color={Colors.charcoalLight}
                            />
                            <Text style={s.infoText}>{booking.customerInfo?.name ?? '—'}</Text>
                        </View>
                        <View style={s.infoRow}>
                            <Ionicons
                                name="calendar-outline"
                                size={14}
                                color={Colors.charcoalLight}
                            />
                            <Text style={s.infoText}>
                                {booking.eventDate ? fmtDate(booking.eventDate) : '—'}
                            </Text>
                        </View>
                        {booking.customerInfo?.eventName && (
                            <View style={s.infoRow}>
                                <Ionicons
                                    name="star-outline"
                                    size={14}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.infoText}>{booking.customerInfo.eventName}</Text>
                            </View>
                        )}
                    </View>

                    {/* Amount & payment */}
                    <View style={s.cardFooter}>
                        <View>
                            <Text style={s.amountLabel}>Total Amount</Text>
                            <Text style={s.amountValue}>
                                {fmtCurrency(booking.amount || booking?.pricing?.total || 0)}
                            </Text>
                        </View>
                        <View style={[s.paymentBadge, { backgroundColor: pst.bg }]}>
                            <Text style={[s.paymentText, { color: pst.color }]}>{pst.label}</Text>
                        </View>
                    </View>

                    {/* View details */}
                    <TouchableOpacity
                        style={s.viewDetailsBtn}
                        onPress={onPress}
                        activeOpacity={0.7}
                    >
                        <Text style={s.viewDetailsText}>View Details</Text>
                        <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Header Stats ─────────────────────────────────────────────────────────────
function HeaderStats({ bookings }: { bookings: ServiceBooking[] }) {
    const enquiries = bookings.filter(b => b.status === 'enquiry').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const totalRevenue = bookings
        .filter(b => b.status === 'confirmed' && b.paymentStatus === 'paid')
        .reduce((sum, b) => sum + (b.amount || 0), 0);

    return (
        <View style={s.headerStats}>
            <View style={s.headerStatItem}>
                <Text style={s.headerStatValue}>{bookings.length}</Text>
                <Text style={s.headerStatLabel}>Total</Text>
            </View>
            <View style={s.headerStatDivider} />
            <View style={s.headerStatItem}>
                <Text style={[s.headerStatValue, { color: Colors.warning }]}>{enquiries}</Text>
                <Text style={s.headerStatLabel}>Enquiries</Text>
            </View>
            <View style={s.headerStatDivider} />
            <View style={s.headerStatItem}>
                <Text style={[s.headerStatValue, { color: Colors.success }]}>{confirmed}</Text>
                <Text style={s.headerStatLabel}>Confirmed</Text>
            </View>
            <View style={s.headerStatDivider} />
            <View style={s.headerStatItem}>
                <Text style={[s.headerStatValue, { color: Colors.primary, fontSize: 14 }]}>
                    {fmtCurrency(totalRevenue)}
                </Text>
                <Text style={s.headerStatLabel}>Revenue</Text>
            </View>
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
type Props = NativeBottomTabScreenProps<VendorTabParamList, 'booking'>;

export default function VendorBookingsScreen({ navigation }: Props) {
    const alert = useAlert();
    const [filter, setFilter] = useState<'all' | 'enquiry' | 'confirmed' | 'cancelled'>('all');

    const { data: vendorBookingData, isLoading, refetch } = useGetVendorServiceBooking();
    // TODO: replace with real hook
    const isRefetching = false;
    const bookings: ServiceBooking[] = vendorBookingData?.bookings ?? [];

    const handleRefresh = useCallback(() => {
        refetch();
    }, []);

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

    // ── Filtered bookings ─────────────────────────────────────────────────────
    const filteredBookings = useMemo(() => {
        if (filter === 'all') return bookings;
        return bookings.filter(b => b.status === filter);
    }, [bookings, filter]);

    const handleBookingPress = useCallback((booking: ServiceBooking) => {
        navigation
            .getParent<NativeStackNavigationProp<RootStackParamList>>()
            .navigate('serviceBookingDetail', {
                bookingData: booking,
            });
    }, []);

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
                        <Text style={s.headerEyebrow}>MY BOOKINGS</Text>
                        <Text style={s.headerTitle}>Track Your Orders</Text>
                    </View>
                    <TouchableOpacity
                        style={s.filterBtn}
                        onPress={() => alert.info('Filter', 'Advanced filters coming soon')}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="filter-outline" size={18} color={Colors.charcoalMid} />
                    </TouchableOpacity>
                </View>
                <HeaderStats bookings={bookings} />

                {/* Filter tabs */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.filterRow}
                >
                    {(['all', 'enquiry', 'confirmed', 'cancelled'] as const).map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[s.filterTab, filter === f && s.filterTabActive]}
                            onPress={() => setFilter(f)}
                            activeOpacity={0.7}
                        >
                            <Text style={[s.filterTabText, filter === f && s.filterTabTextActive]}>
                                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
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
                {filteredBookings.length === 0 ? (
                    <View style={s.emptyWrap}>
                        <View style={s.emptyIconWrap}>
                            <Ionicons
                                name="calendar-outline"
                                size={36}
                                color={Colors.primaryBorder}
                            />
                        </View>
                        <Text style={s.emptyTitle}>No bookings yet</Text>
                        <Text style={s.emptySub}>
                            Your bookings from clients will appear here once they start coming in.
                        </Text>
                    </View>
                ) : (
                    filteredBookings.map((booking, i) => (
                        <BookingCard
                            key={booking._id}
                            booking={booking}
                            index={i}
                            onPress={() => handleBookingPress(booking)}
                        />
                    ))
                )}

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
        marginBottom: Spacing.lg,
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
    filterBtn: {
        width: 42,
        height: 42,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },

    headerStats: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.md,
    },
    headerStatItem: { flex: 1, alignItems: 'center' },
    headerStatValue: {
        fontSize: 22,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.5,
    },
    headerStatLabel: {
        fontSize: 10,
        color: Colors.charcoalLight,
        fontWeight: Typography.semiBold,
        marginTop: 2,
    },
    headerStatDivider: { width: 1, height: 32, backgroundColor: Colors.divider, marginTop: 4 },

    filterRow: {
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
    },
    filterTab: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterTabActive: {
        backgroundColor: Colors.primaryLight,
        borderColor: Colors.primaryBorder,
    },
    filterTabText: {
        fontSize: 12,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    filterTabTextActive: {
        color: Colors.primaryDark,
        fontWeight: Typography.bold,
    },

    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 100 },

    bookingCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        marginBottom: Spacing.lg,
        overflow: 'hidden',
        ...Shadows.card,
    },
    cardTopBar: { height: 4 },
    cardContent: { padding: Spacing.lg },

    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    cardHeaderLeft: { flexDirection: 'row', gap: Spacing.sm, flex: 1 },
    serviceIcon: {
        width: 44,
        height: 44,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardHeaderText: { flex: 1 },
    serviceTitle: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        marginBottom: 2,
    },
    bookingNumber: {
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Radii.full,
        flexShrink: 0,
    },
    statusText: {
        fontSize: 10,
        fontWeight: Typography.bold,
        letterSpacing: 0.2,
    },

    infoSection: {
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: Colors.divider,
        marginBottom: Spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 12,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
        flex: 1,
    },

    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    amountLabel: {
        fontSize: 10,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        marginBottom: 2,
    },
    amountValue: {
        fontSize: 20,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
        letterSpacing: -0.5,
    },
    paymentBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radii.full,
    },
    paymentText: {
        fontSize: 10,
        fontWeight: Typography.bold,
        letterSpacing: 0.3,
    },

    viewDetailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: Colors.primaryLight,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    viewDetailsText: {
        fontSize: 13,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },

    emptyWrap: {
        alignItems: 'center',
        paddingVertical: Spacing.xxl * 2,
        paddingHorizontal: Spacing.xl,
    },
    emptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.primaryBorder,
        marginBottom: Spacing.lg,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        marginBottom: Spacing.xs,
    },
    emptySub: {
        fontSize: 13,
        color: Colors.charcoalLight,
        textAlign: 'center',
        lineHeight: 19,
    },
});

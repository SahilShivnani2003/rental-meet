import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Animated,
    Platform,
    Modal,
    RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Spacing, Colors, Radii, Shadows, Typography, StatusConfig } from '@/theme/theme';
import { RawBooking } from '../types/UseVenuePaymentResponse';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { OwnerTabParamList } from '@/navigations/tabNavigations/OwnerTabNavigation';
import { useGetVenuePayment } from '../hook/usePayments';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

const fmtDate = (d?: Date | string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

const fmtDateTime = (d?: Date | string) => {
    if (!d) return '—';
    const date = new Date(d);
    return (
        date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ' · ' +
        date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    );
};

// ─── Status config (payment + settlement) ─────────────────────────────────────
// Booking status (confirmed / pending / cancelled / completed) reuses the
// shared StatusConfig already defined in theme.ts.
const PaymentStatusConfig: Record<
    string,
    { color: string; bg: string; icon: string; label: string }
> = {
    paid: {
        color: Colors.success,
        bg: Colors.successLight,
        icon: 'checkmark-circle',
        label: 'Paid',
    },
    pending: { color: Colors.warning, bg: Colors.warningLight, icon: 'time', label: 'Pending' },
    refunded: { color: Colors.info, bg: Colors.infoLight, icon: 'sync', label: 'Refunded' },
};

const SettlementConfig: Record<string, { color: string; bg: string; label: string }> = {
    settled: { color: Colors.success, bg: Colors.successLight, label: 'Settled' },
    unsettled: { color: Colors.warning, bg: Colors.warningLight, label: 'Unsettled' },
};

// ─── Normalised shape used by the card ────────────────────────────────────────
interface NormalisedPayment {
    _id: string;
    bookingNumber: string;
    bookingDate?: string;
    createdAt?: string;
    amount: number;
    paymentStatus: 'pending' | 'paid' | 'refunded';
    bookingStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    settlement: 'settled' | 'unsettled';
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    venueId: string;
    venueName: string;
    venueLocation?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    paidAt?: string;
    refundAmount?: number;
    refundedAt?: string;
    refundNote?: string;
    price: {
        basePrice: number;
        amenitiesTotal: number;
        subtotal: number;
        gst: number;
        platformFee: number;
        platformFeeGST: number;
        discount: number;
        couponCode?: string | null;
        total: number;
    };
}

function normalisePayment(b: RawBooking): NormalisedPayment {
    const p = b.priceBreakdown;
    const refundTxn = b.paymentLedger?.transactions?.find(t => t.type === 'refund');
    return {
        _id: b._id,
        bookingNumber: b.bookingNumber,
        bookingDate: b.bookingDate,
        createdAt: b.createdAt,
        amount: b.amount,
        paymentStatus: b.paymentStatus,
        bookingStatus: b.status,
        // NOTE: settlement isn't in the API response yet — defaulting to
        // 'unsettled' until the backend exposes a real settlement flag.
        settlement: 'unsettled',
        customerName: b.customerDetails?.name || b.customer?.name || 'Unknown Customer',
        customerPhone: b.customerDetails?.phone || b.customer?.phone,
        customerEmail: b.customerDetails?.email || b.customer?.email,
        venueId: b.venue?._id ?? '',
        venueName: b.venue?.businessName ?? 'Venue',
        venueLocation: [b.venue?.location?.city, b.venue?.location?.state]
            .filter(Boolean)
            .join(', '),
        razorpayOrderId: b.paymentDetails?.razorpay_order_id,
        razorpayPaymentId: b.paymentDetails?.razorpay_payment_id,
        paidAt: b.paymentDetails?.paidAt,
        refundAmount: refundTxn?.amount,
        refundedAt: refundTxn?.date,
        refundNote: refundTxn?.note,
        price: {
            basePrice: p?.basePrice ?? 0,
            amenitiesTotal: p?.amenitiesTotal ?? 0,
            subtotal: p?.subtotal ?? 0,
            gst: p?.gst ?? 0,
            platformFee: p?.platformFee ?? 0,
            platformFeeGST: p?.platformFeeGST ?? 0,
            discount: p?.discount ?? 0,
            couponCode: p?.couponCode,
            total: p?.total ?? b.amount ?? 0,
        },
    };
}

// ─── Stat card (top summary, mirrors the web dashboard cards) ─────────────────
type StatCardProps = {
    label: string;
    value: string;
    icon: string;
    color: string;
    bg: string;
    border: string;
};

function StatCard({ label, value, icon, color, bg, border }: StatCardProps) {
    return (
        <View style={[s.statCard, { backgroundColor: bg, borderColor: border }]}>
            <View style={s.statCardTop}>
                <Text style={s.statCardLabel}>{label}</Text>
                <Ionicons name={icon} size={15} color={color} />
            </View>
            <Text style={[s.statCardValue, { color }]} numberOfLines={1}>
                {value}
            </Text>
        </View>
    );
}

// ─── Expandable Payment Card ───────────────────────────────────────────────────
type PaymentCardProps = {
    payment: NormalisedPayment;
    index: number;
    onCall: () => void;
    onViewReceipt: () => void;
};

function PaymentCard({ payment: p, index, onCall, onViewReceipt }: PaymentCardProps) {
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(20)).current;
    const [expanded, setExpanded] = useState(false);
    const expandAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, {
                toValue: 1,
                delay: 80 + index * 60,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(slide, {
                toValue: 0,
                delay: 80 + index * 60,
                speed: 16,
                bounciness: 5,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const toggleExpand = () => {
        const toValue = expanded ? 0 : 1;
        Animated.spring(expandAnim, {
            toValue,
            speed: 18,
            bounciness: 4,
            useNativeDriver: false,
        }).start();
        setExpanded(v => !v);
    };

    const payCfg = PaymentStatusConfig[p.paymentStatus] ?? PaymentStatusConfig.pending;
    const bookCfg = StatusConfig[p.bookingStatus] ?? StatusConfig.pending;
    const settleCfg = SettlementConfig[p.settlement];

    return (
        <Animated.View style={[s.card, { opacity: fade, transform: [{ translateY: slide }] }]}>
            <View style={[s.cardAccent, { backgroundColor: payCfg.color }]} />

            <TouchableOpacity onPress={toggleExpand} activeOpacity={0.85}>
                <View style={s.cardMain}>
                    <View style={[s.actionIcon, { backgroundColor: payCfg.bg }]}>
                        <Ionicons name={payCfg.icon} size={20} color={payCfg.color} />
                    </View>

                    <View style={s.cardInfo}>
                        <View style={s.cardTopRow}>
                            <Text style={s.bookingNumber}>{p.bookingNumber}</Text>
                            <View style={[s.statusBadge, { backgroundColor: payCfg.bg }]}>
                                <Text style={[s.statusBadgeText, { color: payCfg.color }]}>
                                    {payCfg.label}
                                </Text>
                            </View>
                        </View>

                        <Text style={s.customerName} numberOfLines={1}>
                            {p.customerName}
                        </Text>

                        <View style={s.cardMetaItem}>
                            <Ionicons name="business-outline" size={11} color={Colors.primary} />
                            <Text style={s.venueName} numberOfLines={1}>
                                {p.venueName}
                            </Text>
                        </View>

                        <View style={s.cardMetaRow}>
                            <View style={s.cardMetaItem}>
                                <Ionicons
                                    name="calendar-outline"
                                    size={11}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.cardMetaText}>{fmtDate(p.bookingDate)}</Text>
                            </View>
                            <View style={s.metaDot} />
                            <View style={[s.miniBadge, { backgroundColor: bookCfg.bg }]}>
                                <Text style={[s.miniBadgeText, { color: bookCfg.color }]}>
                                    {bookCfg.label}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={s.cardRight}>
                        <Text style={s.totalAmount}>{fmtCurrency(p.amount)}</Text>
                        <Animated.View
                            style={{
                                marginTop: 6,
                                transform: [
                                    {
                                        rotate: expandAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0deg', '180deg'],
                                        }),
                                    },
                                ],
                            }}
                        >
                            <Ionicons name="chevron-down" size={16} color={Colors.charcoalLight} />
                        </Animated.View>
                    </View>
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={s.expandedWrap}>
                    <View style={s.expandedDivider} />

                    {/* Settlement + customer contact */}
                    <View style={s.expandSection}>
                        <Text style={s.expandSectionTitle}>SETTLEMENT</Text>
                        <View style={[s.settlementBadge, { backgroundColor: settleCfg.bg }]}>
                            <Ionicons name="wallet-outline" size={13} color={settleCfg.color} />
                            <Text style={[s.settlementBadgeText, { color: settleCfg.color }]}>
                                {settleCfg.label}
                            </Text>
                        </View>
                    </View>

                    <View style={s.expandSection}>
                        <Text style={s.expandSectionTitle}>CUSTOMER</Text>
                        <View style={s.expandRow}>
                            <Ionicons name="person-outline" size={13} color={Colors.primary} />
                            <Text style={s.expandRowText}>{p.customerName}</Text>
                        </View>
                        {!!p.customerPhone && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="call-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>{p.customerPhone}</Text>
                            </View>
                        )}
                        {!!p.venueLocation && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="location-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>{p.venueLocation}</Text>
                            </View>
                        )}
                    </View>

                    {/* Payment / refund trail */}
                    <View style={s.expandSection}>
                        <Text style={s.expandSectionTitle}>
                            {p.paymentStatus === 'refunded' ? 'REFUND DETAILS' : 'PAYMENT DETAILS'}
                        </Text>
                        {!!p.paidAt && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="card-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>Paid on {fmtDateTime(p.paidAt)}</Text>
                            </View>
                        )}
                        {!!p.razorpayPaymentId && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="receipt-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText} numberOfLines={1}>
                                    {p.razorpayPaymentId}
                                </Text>
                            </View>
                        )}
                        {p.paymentStatus === 'refunded' && !!p.refundedAt && (
                            <View style={s.expandRow}>
                                <Ionicons name="sync-outline" size={13} color={Colors.info} />
                                <Text style={s.expandRowText}>
                                    Refunded {fmtCurrency(p.refundAmount ?? p.amount)} on{' '}
                                    {fmtDateTime(p.refundedAt)}
                                </Text>
                            </View>
                        )}
                        {p.paymentStatus === 'refunded' && !!p.refundNote && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="chatbubble-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>{p.refundNote}</Text>
                            </View>
                        )}
                    </View>

                    {/* Price breakdown */}
                    <View style={s.priceBreakdown}>
                        <Text style={s.expandSectionTitle}>PRICE BREAKDOWN</Text>

                        <View style={s.priceRow}>
                            <Text style={s.priceLabel}>Base Price</Text>
                            <Text style={s.priceValue}>{fmtCurrency(p.price.basePrice)}</Text>
                        </View>
                        {p.price.amenitiesTotal > 0 && (
                            <View style={s.priceRow}>
                                <Text style={s.priceLabel}>Amenities</Text>
                                <Text style={s.priceValue}>
                                    {fmtCurrency(p.price.amenitiesTotal)}
                                </Text>
                            </View>
                        )}
                        {p.price.gst > 0 && (
                            <View style={s.priceRow}>
                                <Text style={s.priceLabel}>GST</Text>
                                <Text style={s.priceValue}>{fmtCurrency(p.price.gst)}</Text>
                            </View>
                        )}
                        {p.price.platformFee > 0 && (
                            <View style={s.priceRow}>
                                <Text style={s.priceLabel}>Platform Fee</Text>
                                <Text style={s.priceValue}>{fmtCurrency(p.price.platformFee)}</Text>
                            </View>
                        )}
                        {p.price.platformFeeGST > 0 && (
                            <View style={s.priceRow}>
                                <Text style={s.priceLabel}>Platform GST</Text>
                                <Text style={s.priceValue}>
                                    {fmtCurrency(p.price.platformFeeGST)}
                                </Text>
                            </View>
                        )}
                        {p.price.discount > 0 && (
                            <View style={s.priceRow}>
                                <Text style={[s.priceLabel, { color: Colors.success }]}>
                                    Discount{p.price.couponCode ? ` (${p.price.couponCode})` : ''}
                                </Text>
                                <Text style={[s.priceValue, { color: Colors.success }]}>
                                    -{fmtCurrency(p.price.discount)}
                                </Text>
                            </View>
                        )}

                        <View style={s.priceTotalRow}>
                            <Text style={s.priceTotalLabel}>
                                {p.paymentStatus === 'refunded' ? 'Refunded' : 'Total'}
                            </Text>
                            <Text style={s.priceTotalValue}>{fmtCurrency(p.price.total)}</Text>
                        </View>
                    </View>

                    {/* Actions */}
                    {/* <View style={s.cardActions}>
                        <TouchableOpacity style={s.callBtn} onPress={onCall} activeOpacity={0.7}>
                            <Ionicons name="call-outline" size={15} color={Colors.primary} />
                            <Text style={s.callBtnText}>Call Customer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={s.receiptBtn}
                            onPress={onViewReceipt}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="document-text-outline"
                                size={15}
                                color={Colors.surface}
                            />
                            <Text style={s.receiptBtnText}>View Receipt</Text>
                        </TouchableOpacity>
                    </View> */}
                </View>
            )}
        </Animated.View>
    );
}

// ─── Venue filter modal ─────────────────────────────────────────────────────────
function VenueFilterModal({
    visible,
    venues,
    selected,
    onSelect,
    onClose,
}: {
    visible: boolean;
    venues: { _id: string; businessName: string }[];
    selected: string;
    onSelect: (id: string) => void;
    onClose: () => void;
}) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={s.modalSheet}>
                    <Text style={s.modalTitle}>Filter by Venue</Text>
                    <TouchableOpacity
                        style={[s.modalOption, selected === 'all' && s.modalOptionActive]}
                        onPress={() => {
                            onSelect('all');
                            onClose();
                        }}
                    >
                        <Ionicons
                            name="layers-outline"
                            size={16}
                            color={selected === 'all' ? Colors.primaryDark : Colors.charcoalMid}
                        />
                        <Text
                            style={[
                                s.modalOptionText,
                                selected === 'all' && s.modalOptionTextActive,
                            ]}
                        >
                            All Venues
                        </Text>
                        {selected === 'all' && (
                            <Ionicons name="checkmark" size={16} color={Colors.primaryDark} />
                        )}
                    </TouchableOpacity>
                    {venues.map(v => (
                        <TouchableOpacity
                            key={v._id}
                            style={[s.modalOption, selected === v._id && s.modalOptionActive]}
                            onPress={() => {
                                onSelect(v._id);
                                onClose();
                            }}
                        >
                            <Ionicons
                                name="business-outline"
                                size={16}
                                color={selected === v._id ? Colors.primaryDark : Colors.charcoalMid}
                            />
                            <Text
                                style={[
                                    s.modalOptionText,
                                    selected === v._id && s.modalOptionTextActive,
                                ]}
                                numberOfLines={1}
                            >
                                {v.businessName}
                            </Text>
                            {selected === v._id && (
                                <Ionicons name="checkmark" size={16} color={Colors.primaryDark} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

type PaymentScreenProps = NativeBottomTabScreenProps<OwnerTabParamList, 'payment'>
// ─── Screen ────────────────────────────────────────────────────────────────────
export default function PaymentsScreen() {
    const { data, isLoading, isRefetching, refetch } = useGetVenuePayment({page: 1, limit: 100});

    const [search, setSearch] = useState('');
    const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending' | 'refunded'>(
        'all',
    );
    const [venueFilter, setVenueFilter] = useState('all');
    const [venueModalVisible, setVenueModalVisible] = useState(false);

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

    const payments: NormalisedPayment[] = useMemo(
        () => (data?.bookings ?? []).map(normalisePayment),
        [data],
    );

    const filtered = useMemo(() => {
        let list = payments;
        if (paymentFilter !== 'all') list = list.filter(p => p.paymentStatus === paymentFilter);
        if (venueFilter !== 'all') list = list.filter(p => p.venueId === venueFilter);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(
                p =>
                    p.bookingNumber.toLowerCase().includes(q) ||
                    p.customerName.toLowerCase().includes(q) ||
                    (p.customerPhone ?? '').includes(q) ||
                    p.venueName.toLowerCase().includes(q),
            );
        }
        return list;
    }, [payments, paymentFilter, venueFilter, search]);

    const handleCall = useCallback((p: NormalisedPayment) => {
        console.log('Call customer:', p.customerPhone);
    }, []);

    const handleViewReceipt = useCallback((p: NormalisedPayment) => {
        console.log('View receipt for:', p.bookingNumber);
    }, []);

    const selectedVenueName =
        venueFilter === 'all'
            ? 'All Venues'
            : data?.venues.find((v:any) => v._id === venueFilter)?.businessName ?? 'All Venues';

    const stats = data?.stats;

    return (
        <View style={s.root}>
            {/* ── Header ── */}
            <Animated.View
                style={[
                    s.header,
                    { opacity: headerFade, transform: [{ translateY: headerSlide }] },
                ]}
            >
                <View style={s.headerAccent} />
                <View style={s.headerContent}>
                    <View>
                        <Text style={s.headerEyebrow}>PAYMENTS</Text>
                        <Text style={s.headerTitle}>Payment History</Text>
                        <Text style={s.headerSubtitle}>Venue booking payment history</Text>
                    </View>
                    <TouchableOpacity
                        style={s.headerIconBtn}
                        activeOpacity={0.8}
                        onPress={() => refetch()}
                    >
                        <Ionicons name="refresh-outline" size={18} color={Colors.charcoal} />
                    </TouchableOpacity>
                </View>

                {/* Stat cards */}
                <View style={s.statsGrid}>
                    <StatCard
                        label="TOTAL REVENUE"
                        value={fmtCurrency(stats?.totalRevenue ?? 0)}
                        icon="trending-up-outline"
                        color={Colors.success}
                        bg={Colors.successLight}
                        border="rgba(22,163,74,0.25)"
                    />
                    <StatCard
                        label="PAID"
                        value={String(stats?.paid ?? 0)}
                        icon="cash-outline"
                        color={Colors.charcoal}
                        bg={Colors.surface}
                        border={Colors.border}
                    />
                    <StatCard
                        label="PENDING"
                        value={String(stats?.pending ?? 0)}
                        icon="time-outline"
                        color={Colors.warning}
                        bg={Colors.warningLight}
                        border={Colors.primaryBorder}
                    />
                    <StatCard
                        label="REFUNDED"
                        value={String(stats?.refunded ?? 0)}
                        icon="sync-outline"
                        color={Colors.info}
                        bg={Colors.infoLight}
                        border="rgba(37,99,235,0.25)"
                    />
                </View>

                {/* Search */}
                <View style={s.searchWrap}>
                    <Ionicons name="search-outline" size={16} color={Colors.charcoalLight} />
                    <TextInput
                        style={s.searchInput}
                        placeholder="Search booking, customer, venue…"
                        placeholderTextColor={Colors.charcoalLight}
                        value={search}
                        onChangeText={setSearch}
                    />
                    {!!search && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={16} color={Colors.charcoalLight} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filters */}
                <View style={s.filterRow}>
                    {(['all', 'paid', 'pending', 'refunded'] as const).map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[s.filterTab, paymentFilter === f && s.filterTabActive]}
                            onPress={() => setPaymentFilter(f)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    s.filterTabText,
                                    paymentFilter === f && s.filterTabTextActive,
                                ]}
                            >
                                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={s.venueFilterBtn}
                    activeOpacity={0.7}
                    onPress={() => setVenueModalVisible(true)}
                >
                    <Ionicons name="business-outline" size={14} color={Colors.charcoalMid} />
                    <Text style={s.venueFilterText} numberOfLines={1}>
                        {selectedVenueName}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={Colors.charcoalLight} />
                    <Text style={s.resultCount}>{filtered.length} bookings</Text>
                </TouchableOpacity>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scroll}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
            >
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <View key={i} style={[s.card, s.skeletonCard]}>
                            <View style={[s.cardAccent, { backgroundColor: Colors.border }]} />
                            <View style={s.skeletonRow}>
                                <View style={s.skeletonIcon} />
                                <View style={{ flex: 1, gap: 8 }}>
                                    <View style={[s.skeletonLine, { width: '60%' }]} />
                                    <View style={[s.skeletonLine, { width: '40%' }]} />
                                    <View style={[s.skeletonLine, { width: '50%' }]} />
                                </View>
                                <View style={s.skeletonAmount} />
                            </View>
                        </View>
                    ))
                ) : filtered.length === 0 ? (
                    <View style={s.emptyWrap}>
                        <View style={s.emptyIconWrap}>
                            <Ionicons
                                name="receipt-outline"
                                size={36}
                                color={Colors.primaryBorder}
                            />
                        </View>
                        <Text style={s.emptyTitle}>No payments found</Text>
                        <Text style={s.emptySub}>
                            {paymentFilter !== 'all' || venueFilter !== 'all' || search
                                ? 'Try adjusting your search or filters.'
                                : 'Payments will appear here once customers book your venues.'}
                        </Text>
                    </View>
                ) : (
                    filtered.map((p, i) => (
                        <PaymentCard
                            key={p._id || i}
                            payment={p}
                            index={i}
                            onCall={() => handleCall(p)}
                            onViewReceipt={() => handleViewReceipt(p)}
                        />
                    ))
                )}
                <View style={{ height: 24 }} />
            </ScrollView>

            <VenueFilterModal
                visible={venueModalVisible}
                venues={data?.venues ?? []}
                selected={venueFilter}
                onSelect={setVenueFilter}
                onClose={() => setVenueModalVisible(false)}
            />
        </View>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },

    // Header
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
    headerSubtitle: {
        fontSize: 12,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        marginTop: 2,
    },
    headerIconBtn: {
        width: 42,
        height: 42,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },

    // Stats grid (2x2, mirrors the 4 web dashboard cards)
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    statCard: {
        width: '48%',
        borderRadius: Radii.md,
        borderWidth: 1,
        padding: Spacing.md,
    },
    statCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    statCardLabel: {
        fontSize: 9.5,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: Typography.normal,
    },
    statCardValue: { fontSize: 18, fontWeight: Typography.extraBold, letterSpacing: -0.4 },

    // Search
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginHorizontal: Spacing.xl,
        paddingHorizontal: Spacing.md,
        paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 6,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.md,
    },
    searchInput: { flex: 1, fontSize: 13, color: Colors.charcoal },

    // Filters
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    filterTab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterTabActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryBorder },
    filterTabText: { fontSize: 11, fontWeight: Typography.semiBold, color: Colors.charcoalMid },
    filterTabTextActive: { color: Colors.primaryDark, fontWeight: Typography.bold },

    venueFilterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    venueFilterText: {
        fontSize: 12,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
        flexShrink: 1,
    },
    resultCount: {
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        marginLeft: 'auto',
    },

    // Scroll
    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 100 },

    // Card
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        marginBottom: Spacing.md,
        overflow: 'hidden',
        ...Shadows.card,
    },
    cardAccent: { height: 3 },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    cardInfo: { flex: 1 },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    bookingNumber: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.primaryDark,
        letterSpacing: 0.4,
    },
    statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radii.full },
    statusBadgeText: { fontSize: 9, fontWeight: Typography.bold, letterSpacing: 0.3 },
    customerName: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
        marginBottom: 2,
    },
    venueName: {
        fontSize: 12,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
        marginBottom: Spacing.xs,
        flex: 1,
    },
    cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    cardMetaText: { fontSize: 10, color: Colors.charcoalLight, fontWeight: Typography.medium },
    metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.border },
    miniBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: Radii.full },
    miniBadgeText: { fontSize: 9, fontWeight: Typography.bold },
    cardRight: { alignItems: 'flex-end' },
    totalAmount: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },

    // Expanded
    expandedWrap: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
    expandedDivider: { height: 1, backgroundColor: Colors.divider, marginBottom: Spacing.md },
    expandSection: { marginBottom: Spacing.md },
    expandSectionTitle: {
        fontSize: 9,
        fontWeight: Typography.extraBold,
        color: Colors.charcoalLight,
        letterSpacing: Typography.wider,
        marginBottom: Spacing.sm,
    },
    expandRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
    expandRowText: {
        fontSize: 12,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
        flex: 1,
    },
    settlementBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: Radii.full,
    },
    settlementBadgeText: { fontSize: 11, fontWeight: Typography.bold },

    // Price breakdown
    priceBreakdown: {
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    priceLabel: { fontSize: 12, color: Colors.charcoalMid, fontWeight: Typography.medium },
    priceValue: { fontSize: 12, color: Colors.charcoal, fontWeight: Typography.semiBold },
    priceTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Spacing.sm,
        marginTop: 4,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    priceTotalLabel: { fontSize: 13, fontWeight: Typography.extraBold, color: Colors.charcoal },
    priceTotalValue: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
        letterSpacing: -0.3,
    },

    // Card actions
    cardActions: { flexDirection: 'row', gap: Spacing.sm },
    callBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: Colors.primaryLight,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    callBtnText: { fontSize: 13, fontWeight: Typography.bold, color: Colors.primary },
    receiptBtn: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: Colors.primary,
        ...Shadows.primary,
    },
    receiptBtnText: { fontSize: 13, fontWeight: Typography.bold, color: Colors.surface },

    // Skeleton
    skeletonCard: { opacity: 0.55 },
    skeletonRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    skeletonIcon: { width: 44, height: 44, borderRadius: Radii.md, backgroundColor: Colors.border },
    skeletonLine: { height: 12, borderRadius: 6, backgroundColor: Colors.border },
    skeletonAmount: { width: 60, height: 18, borderRadius: 6, backgroundColor: Colors.border },

    // Empty state
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
    emptySub: { fontSize: 13, color: Colors.charcoalLight, textAlign: 'center', lineHeight: 19 },

    // Venue filter modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        padding: Spacing.xl,
        paddingBottom: Spacing.xxl,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        marginBottom: Spacing.md,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
        borderRadius: Radii.md,
    },
    modalOptionActive: { backgroundColor: Colors.primaryLight },
    modalOptionText: {
        flex: 1,
        fontSize: 14,
        fontWeight: Typography.medium,
        color: Colors.charcoalMid,
    },
    modalOptionTextActive: { color: Colors.primaryDark, fontWeight: Typography.bold },
});

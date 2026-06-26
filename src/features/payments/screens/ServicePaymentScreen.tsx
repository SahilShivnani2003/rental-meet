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
    RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Spacing, Colors, Radii, Shadows, Typography } from '@/theme/theme';
import { privateClient } from '@/service/apiClient';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { VendorTabParamList } from '@/navigations/tabNavigations/VendorTabNavigation';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ServiceBooking {
    _id?: string;
    service: string;
    vendor: string;
    customer?: string;
    quotationNumber?: string;
    bookingNumber?: string;
    eventDate: Date;
    customerInfo?: {
        name?: string;
        email?: string;
        phone?: string;
        company?: string;
        eventName?: string;
        notes?: string;
    };
    serviceSnapshot?: {
        title?: string;
        category?: string;
        companyName?: string;
        city?: string;
        state?: string;
    };
    items: {
        name?: string;
        price?: number;
        unit?: string;
        quantity?: number;
        amount?: number;
    }[];
    pricing?: {
        subtotal?: number;
        serviceCGST?: number;
        serviceSGST?: number;
        cgstPct?: number;
        sgstPct?: number;
        platformFee?: number;
        platformFeePct?: number;
        platformFeeGST?: number;
        total?: number;
    };
    status?: 'enquiry' | 'confirmed' | 'cancelled' | 'completed';
    paymentStatus?: 'pending' | 'paid' | 'failed';
    paymentDetails?: {
        razorpay_order_id?: string;
        razorpay_payment_id?: string;
        razorpay_signature?: string;
        paidAt?: Date;
    };
    amount?: number;
    coupon?: {
        couponId?: string;
        code?: string;
        discountAmount?: number;
    };
    downloadedAt?: Date;
    serviceId?: string;
    createdAt?: Date;
    updatedAt?: Date;
    settlementStatus?: 'settled' | 'unsettled';
    cancelledByRole?: string | null;
    cancellationType?: string;
}

export interface ServicePaymentsResponse {
    success: boolean;
    bookings: ServiceBooking[];
    total: number;
    totalPages: number;
    stats: {
        totalRevenue: number;
        paid: number;
        pending: number;
        failed: number;
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

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

// ─── Status configs ───────────────────────────────────────────────────────────
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
    pending: {
        color: Colors.warning,
        bg: Colors.warningLight,
        icon: 'time',
        label: 'Pending',
    },
    failed: {
        color: '#EF4444',
        bg: '#FEF2F2',
        icon: 'close-circle',
        label: 'Failed',
    },
};

const BookingStatusConfig: Record<
    string,
    { color: string; bg: string; label: string }
> = {
    enquiry: { color: Colors.info, bg: Colors.infoLight, label: 'Enquiry' },
    confirmed: { color: Colors.success, bg: Colors.successLight, label: 'Confirmed' },
    cancelled: { color: '#EF4444', bg: '#FEF2F2', label: 'Cancelled' },
    completed: { color: Colors.charcoal, bg: Colors.background, label: 'Completed' },
};

const SettlementConfig: Record<string, { color: string; bg: string; label: string }> = {
    settled: { color: Colors.success, bg: Colors.successLight, label: 'Settled' },
    unsettled: { color: Colors.warning, bg: Colors.warningLight, label: 'Unsettled' },
};

// ─── Stat card ────────────────────────────────────────────────────────────────
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

// ─── Booking card ─────────────────────────────────────────────────────────────
type BookingCardProps = {
    booking: ServiceBooking;
    index: number;
    onCall: () => void;
    onViewReceipt: () => void;
};

function BookingCard({ booking: b, index, onCall, onViewReceipt }: BookingCardProps) {
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

    const payStatus = b.paymentStatus ?? 'pending';
    const bookStatus = b.status ?? 'enquiry';
    const settlement = b.settlementStatus ?? 'unsettled';

    const payCfg = PaymentStatusConfig[payStatus] ?? PaymentStatusConfig.pending;
    const bookCfg = BookingStatusConfig[bookStatus] ?? BookingStatusConfig.enquiry;
    const settleCfg = SettlementConfig[settlement];

    const customerName = b.customerInfo?.name ?? 'Unknown Customer';
    const serviceName = b.serviceSnapshot?.title ?? 'Service';
    const location = [b.serviceSnapshot?.city, b.serviceSnapshot?.state]
        .filter(Boolean)
        .join(', ');
    const pricing = b.pricing;
    const totalGST = (pricing?.serviceCGST ?? 0) + (pricing?.serviceSGST ?? 0);
    const itemsTotal = b.items.reduce((sum, item) => sum + (item.amount ?? 0), 0);

    return (
        <Animated.View style={[s.card, { opacity: fade, transform: [{ translateY: slide }] }]}>
            <View style={[s.cardAccent, { backgroundColor: payCfg.color }]} />

            <TouchableOpacity onPress={toggleExpand} activeOpacity={0.85}>
                <View style={s.cardMain}>
                    <View style={[s.actionIcon, { backgroundColor: payCfg.bg }]}>
                        <Ionicons name={payCfg.icon as any} size={20} color={payCfg.color} />
                    </View>

                    <View style={s.cardInfo}>
                        <View style={s.cardTopRow}>
                            <Text style={s.bookingNumber}>
                                {b.bookingNumber ?? b.quotationNumber ?? '—'}
                            </Text>
                            <View style={[s.statusBadge, { backgroundColor: payCfg.bg }]}>
                                <Text style={[s.statusBadgeText, { color: payCfg.color }]}>
                                    {payCfg.label}
                                </Text>
                            </View>
                        </View>

                        <Text style={s.customerName} numberOfLines={1}>
                            {customerName}
                        </Text>

                        {!!b.customerInfo?.company && (
                            <Text style={s.companyName} numberOfLines={1}>
                                {b.customerInfo.company}
                            </Text>
                        )}

                        <View style={s.cardMetaItem}>
                            <Ionicons name="construct-outline" size={11} color={Colors.primary} />
                            <Text style={s.serviceName} numberOfLines={1}>
                                {serviceName}
                            </Text>
                        </View>

                        <View style={s.cardMetaRow}>
                            <View style={s.cardMetaItem}>
                                <Ionicons
                                    name="calendar-outline"
                                    size={11}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.cardMetaText}>{fmtDate(b.eventDate)}</Text>
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
                        <Text style={s.totalAmount}>
                            {fmtCurrency(b.amount ?? pricing?.total ?? 0)}
                        </Text>
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

                    {/* Settlement */}
                    <View style={s.expandSection}>
                        <Text style={s.expandSectionTitle}>SETTLEMENT</Text>
                        <View style={[s.settlementBadge, { backgroundColor: settleCfg.bg }]}>
                            <Ionicons name="wallet-outline" size={13} color={settleCfg.color} />
                            <Text style={[s.settlementBadgeText, { color: settleCfg.color }]}>
                                {settleCfg.label}
                            </Text>
                        </View>
                    </View>

                    {/* Customer */}
                    <View style={s.expandSection}>
                        <Text style={s.expandSectionTitle}>CUSTOMER</Text>
                        <View style={s.expandRow}>
                            <Ionicons name="person-outline" size={13} color={Colors.primary} />
                            <Text style={s.expandRowText}>{customerName}</Text>
                        </View>
                        {!!b.customerInfo?.company && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="business-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>{b.customerInfo.company}</Text>
                            </View>
                        )}
                        {!!b.customerInfo?.phone && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="call-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>{b.customerInfo.phone}</Text>
                            </View>
                        )}
                        {!!b.customerInfo?.eventName && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="flag-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>{b.customerInfo.eventName}</Text>
                            </View>
                        )}
                        {!!b.customerInfo?.notes && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="chatbubble-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>{b.customerInfo.notes}</Text>
                            </View>
                        )}
                        {!!location && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="location-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>{location}</Text>
                            </View>
                        )}
                    </View>

                    {/* Items ordered */}
                    {b.items.length > 0 && (
                        <View style={s.expandSection}>
                            <Text style={s.expandSectionTitle}>ITEMS ORDERED</Text>
                            <View style={s.itemsTable}>
                                <View style={s.itemsTableHeader}>
                                    <Text style={[s.itemsTableCell, { flex: 3 }]}>Item</Text>
                                    <Text style={[s.itemsTableCell, s.itemsTableRight]}>Qty</Text>
                                    <Text style={[s.itemsTableCell, s.itemsTableRight]}>Rate</Text>
                                    <Text style={[s.itemsTableCell, s.itemsTableRight]}>Amt</Text>
                                </View>
                                {b.items.map((item, idx) => (
                                    <View key={idx} style={s.itemsTableRow}>
                                        <View style={{ flex: 3 }}>
                                            <Text style={s.itemName} numberOfLines={2}>
                                                {item.name}
                                            </Text>
                                            {!!item.unit && (
                                                <Text style={s.itemUnit}>{item.unit}</Text>
                                            )}
                                        </View>
                                        <Text style={[s.itemValue, s.itemsTableRight]}>
                                            {item.quantity}
                                        </Text>
                                        <Text style={[s.itemValue, s.itemsTableRight]}>
                                            {fmtCurrency(item.price ?? 0)}
                                        </Text>
                                        <Text
                                            style={[
                                                s.itemValue,
                                                s.itemsTableRight,
                                                { fontWeight: Typography.semiBold as any },
                                            ]}
                                        >
                                            {fmtCurrency(item.amount ?? 0)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Payment details */}
                    <View style={s.expandSection}>
                        <Text style={s.expandSectionTitle}>PAYMENT DETAILS</Text>
                        {!!b.paymentDetails?.paidAt && (
                            <View style={s.expandRow}>
                                <Ionicons name="card-outline" size={13} color={Colors.charcoalLight} />
                                <Text style={s.expandRowText}>
                                    Paid on {fmtDateTime(b.paymentDetails.paidAt)}
                                </Text>
                            </View>
                        )}
                        {!!b.paymentDetails?.razorpay_payment_id && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="receipt-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText} numberOfLines={1}>
                                    {b.paymentDetails.razorpay_payment_id}
                                </Text>
                            </View>
                        )}
                        {!!b.paymentDetails?.razorpay_order_id && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="layers-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText} numberOfLines={1}>
                                    Order: {b.paymentDetails.razorpay_order_id}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Price breakdown */}
                    <View style={s.priceBreakdown}>
                        <Text style={s.expandSectionTitle}>PRICE BREAKDOWN</Text>

                        <View style={s.priceRow}>
                            <Text style={s.priceLabel}>Items Subtotal</Text>
                            <Text style={s.priceValue}>
                                {fmtCurrency(pricing?.subtotal ?? itemsTotal)}
                            </Text>
                        </View>

                        {(pricing?.serviceCGST ?? 0) > 0 && (
                            <View style={s.priceRow}>
                                <Text style={s.priceLabel}>
                                    CGST ({pricing?.cgstPct ?? 0}%)
                                </Text>
                                <Text style={s.priceValue}>
                                    {fmtCurrency(pricing?.serviceCGST ?? 0)}
                                </Text>
                            </View>
                        )}

                        {(pricing?.serviceSGST ?? 0) > 0 && (
                            <View style={s.priceRow}>
                                <Text style={s.priceLabel}>
                                    SGST ({pricing?.sgstPct ?? 0}%)
                                </Text>
                                <Text style={s.priceValue}>
                                    {fmtCurrency(pricing?.serviceSGST ?? 0)}
                                </Text>
                            </View>
                        )}

                        {(pricing?.platformFee ?? 0) > 0 && (
                            <View style={s.priceRow}>
                                <Text style={s.priceLabel}>
                                    Platform Fee ({pricing?.platformFeePct ?? 0}%)
                                </Text>
                                <Text style={s.priceValue}>
                                    {fmtCurrency(pricing?.platformFee ?? 0)}
                                </Text>
                            </View>
                        )}

                        {(pricing?.platformFeeGST ?? 0) > 0 && (
                            <View style={s.priceRow}>
                                <Text style={s.priceLabel}>Platform Fee GST</Text>
                                <Text style={s.priceValue}>
                                    {fmtCurrency(pricing?.platformFeeGST ?? 0)}
                                </Text>
                            </View>
                        )}

                        {(b.coupon?.discountAmount ?? 0) > 0 && (
                            <View style={s.priceRow}>
                                <Text style={[s.priceLabel, { color: Colors.success }]}>
                                    Discount{b.coupon?.code ? ` (${b.coupon.code})` : ''}
                                </Text>
                                <Text style={[s.priceValue, { color: Colors.success }]}>
                                    -{fmtCurrency(b.coupon?.discountAmount ?? 0)}
                                </Text>
                            </View>
                        )}

                        <View style={s.priceTotalRow}>
                            <Text style={s.priceTotalLabel}>Total</Text>
                            <Text style={s.priceTotalValue}>
                                {fmtCurrency(b.amount ?? pricing?.total ?? 0)}
                            </Text>
                        </View>
                    </View>

                    {/* Actions */}
                    {/* <View style={s.cardActions}>
                        {!!b.customerInfo?.phone && (
                            <TouchableOpacity
                                style={s.callBtn}
                                onPress={onCall}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="call-outline" size={15} color={Colors.primary} />
                                <Text style={s.callBtnText}>Call Customer</Text>
                            </TouchableOpacity>
                        )}
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

// ─── Hook placeholder (replace with real API call) ────────────────────────────
function useGetServicePayments({ page = 1, limit = 100 } = {}) {
    // Replace this with your real hook that calls vendor/service/payments API
    const [data, setData] = useState<ServicePaymentsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefetching, setIsRefetching] = useState(false);

    const load = useCallback(async (isRefetch = false) => {
        isRefetch ? setIsRefetching(true) : setIsLoading(true);
        try {
            const response = await privateClient.get('/vendor/payments', {params: {page: 1, limit: 100}})
            setData(response.data);
        } finally {
            setIsLoading(false);
            setIsRefetching(false);
        }
    }, [page, limit]);

    useEffect(() => { load(); }, [load]);

    return { data, isLoading, isRefetching, refetch: () => load(true) };
}

type ServicePaymentScreenProps = NativeBottomTabScreenProps<VendorTabParamList,'payment' >
// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ServicePaymentsScreen() {
    const { data, isLoading, isRefetching, refetch } = useGetServicePayments();

    const [search, setSearch] = useState('');
    const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'enquiry' | 'confirmed' | 'cancelled' | 'completed'>('all');

    const headerFade = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-14)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerFade, { toValue: 1, duration: 380, useNativeDriver: true }),
            Animated.spring(headerSlide, { toValue: 0, speed: 16, bounciness: 4, useNativeDriver: true }),
        ]).start();
    }, []);

    const bookings: ServiceBooking[] = useMemo(() => data?.bookings ?? [], [data]);

    const filtered = useMemo(() => {
        let list = bookings;
        if (paymentFilter !== 'all') list = list.filter(b => b.paymentStatus === paymentFilter);
        if (statusFilter !== 'all') list = list.filter(b => b.status === statusFilter);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(b =>
                (b.bookingNumber ?? '').toLowerCase().includes(q) ||
                (b.quotationNumber ?? '').toLowerCase().includes(q) ||
                (b.customerInfo?.name ?? '').toLowerCase().includes(q) ||
                (b.customerInfo?.phone ?? '').includes(q) ||
                (b.customerInfo?.company ?? '').toLowerCase().includes(q) ||
                (b.serviceSnapshot?.title ?? '').toLowerCase().includes(q),
            );
        }
        return list;
    }, [bookings, paymentFilter, statusFilter, search]);

    const stats = data?.stats;

    const handleCall = useCallback((b: ServiceBooking) => {
        console.log('Call customer:', b.customerInfo?.phone);
    }, []);

    const handleViewReceipt = useCallback((b: ServiceBooking) => {
        console.log('View receipt:', b.bookingNumber ?? b.quotationNumber);
    }, []);

    return (
        <View style={s.root}>
            {/* Header */}
            <Animated.View
                style={[s.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}
            >
                <View style={s.headerAccent} />
                <View style={s.headerContent}>
                    <View>
                        <Text style={s.headerEyebrow}>PAYMENTS</Text>
                        <Text style={s.headerTitle}>Service Payments</Text>
                        <Text style={s.headerSubtitle}>Service booking payment history</Text>
                    </View>
                    <TouchableOpacity style={s.headerIconBtn} activeOpacity={0.8} onPress={refetch}>
                        <Ionicons name="refresh-outline" size={18} color={Colors.charcoal} />
                    </TouchableOpacity>
                </View>

                {/* Stats */}
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
                        label="FAILED"
                        value={String(stats?.failed ?? 0)}
                        icon="close-circle-outline"
                        color="#EF4444"
                        bg="#FEF2F2"
                        border="rgba(239,68,68,0.25)"
                    />
                </View>

                {/* Search */}
                <View style={s.searchWrap}>
                    <Ionicons name="search-outline" size={16} color={Colors.charcoalLight} />
                    <TextInput
                        style={s.searchInput}
                        placeholder="Search booking, customer, service…"
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

                {/* Payment filter tabs */}
                <View style={s.filterRow}>
                    {(['all', 'paid', 'pending', 'failed'] as const).map(f => (
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

                {/* Booking status filter */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.statusFilterRow}
                >
                    {(['all', 'enquiry', 'confirmed', 'completed', 'cancelled'] as const).map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[s.statusChip, statusFilter === f && s.statusChipActive]}
                            onPress={() => setStatusFilter(f)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    s.statusChipText,
                                    statusFilter === f && s.statusChipTextActive,
                                ]}
                            >
                                {f === 'all' ? 'All Bookings' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Result count */}
                <View style={s.resultCountRow}>
                    <Ionicons name="list-outline" size={13} color={Colors.charcoalLight} />
                    <Text style={s.resultCountText}>{filtered.length} bookings</Text>
                </View>
            </Animated.View>

            {/* List */}
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
                            <Ionicons name="receipt-outline" size={36} color={Colors.primaryBorder} />
                        </View>
                        <Text style={s.emptyTitle}>No payments found</Text>
                        <Text style={s.emptySub}>
                            {paymentFilter !== 'all' || statusFilter !== 'all' || search
                                ? 'Try adjusting your search or filters.'
                                : 'Payments will appear here once customers book your services.'}
                        </Text>
                    </View>
                ) : (
                    filtered.map((b, i) => (
                        <BookingCard
                            key={b._id ?? i}
                            booking={b}
                            index={i}
                            onCall={() => handleCall(b)}
                            onViewReceipt={() => handleViewReceipt(b)}
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

    // Stats
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

    statusFilterRow: {
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    statusChip: {
        paddingVertical: 6,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.full,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statusChipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryBorder },
    statusChipText: { fontSize: 11, fontWeight: Typography.semiBold, color: Colors.charcoalMid },
    statusChipTextActive: { color: Colors.primaryDark, fontWeight: Typography.bold },

    resultCountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: Spacing.xl,
        marginTop: 2,
    },
    resultCountText: { fontSize: 11, color: Colors.charcoalLight, fontWeight: Typography.medium },

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
        marginBottom: 1,
    },
    companyName: {
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        marginBottom: 3,
    },
    serviceName: {
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

    // Items table
    itemsTable: {
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    itemsTableHeader: {
        flexDirection: 'row',
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    itemsTableCell: {
        fontSize: 9,
        fontWeight: Typography.extraBold,
        color: Colors.charcoalLight,
        letterSpacing: 0.4,
        flex: 1,
    },
    itemsTableRight: { textAlign: 'right' },
    itemsTableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    itemName: { fontSize: 12, color: Colors.charcoal, fontWeight: Typography.semiBold },
    itemUnit: { fontSize: 10, color: Colors.charcoalLight, marginTop: 1 },
    itemValue: { fontSize: 12, color: Colors.charcoalMid, flex: 1 },

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

    // Actions
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

    // Empty
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
});
import React, { useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
    Share,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/theme/theme';
import { ServiceBooking } from '@/features/booking/types/ServiceBooking';

// ─── Types ────────────────────────────────────────────────────────────────────
type Props = NativeStackScreenProps<RootStackParamList, 'serviceBookingDetail'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtCurrency = (n?: number) =>
    n != null ? '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—';

const fmtDate = (d?: Date | string) =>
    d
        ? new Date(d).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
          })
        : '—';

const fmtDateTime = (d?: Date | string) =>
    d
        ? new Date(d).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : '—';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<
    string,
    { label: string; color: string; bg: string; border: string; icon: string }
> = {
    enquiry: {
        label: 'Enquiry',
        color: Colors.warning,
        bg: Colors.warningLight,
        border: Colors.primaryBorder,
        icon: 'chatbubble-ellipses-outline',
    },
    confirmed: {
        label: 'Confirmed',
        color: Colors.success,
        bg: Colors.successLight,
        border: '#BBF7D0',
        icon: 'checkmark-circle-outline',
    },
    cancelled: {
        label: 'Cancelled',
        color: Colors.danger,
        bg: Colors.dangerLight,
        border: '#FECACA',
        icon: 'close-circle-outline',
    },
};

const PAYMENT_CFG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    pending: {
        label: 'Payment Pending',
        color: Colors.warning,
        bg: Colors.warningLight,
        icon: 'time-outline',
    },
    paid: {
        label: 'Paid',
        color: Colors.success,
        bg: Colors.successLight,
        icon: 'checkmark-circle',
    },
    failed: {
        label: 'Failed',
        color: Colors.danger,
        bg: Colors.dangerLight,
        icon: 'alert-circle-outline',
    },
};

// ─── Small reusable pieces ────────────────────────────────────────────────────
function SectionCard({ children, style }: { children: React.ReactNode; style?: any }) {
    return <View style={[s.sectionCard, style]}>{children}</View>;
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
    return (
        <View style={s.sectionHeaderRow}>
            <View style={s.sectionIconWrap}>
                <Ionicons name={icon as any} size={14} color={Colors.primary} />
            </View>
            <Text style={s.sectionTitle}>{title}</Text>
        </View>
    );
}

function InfoRow({
    label,
    value,
    valueColor,
    mono,
}: {
    label: string;
    value?: string;
    valueColor?: string;
    mono?: boolean;
}) {
    return (
        <View style={s.infoRow}>
            <Text style={s.infoLabel}>{label}</Text>
            <Text
                style={[
                    s.infoValue,
                    valueColor ? { color: valueColor } : null,
                    mono ? s.infoValueMono : null,
                ]}
                numberOfLines={2}
            >
                {value ?? '—'}
            </Text>
        </View>
    );
}

function Divider() {
    return <View style={s.divider} />;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ServiceBookingDetailScreen({ route, navigation }: Props) {
    // Supports two entry points:
    //   1. navigator passes `bookingData` directly  → no fetch needed
    //   2. navigator passes only `bookingId`        → fetch via hook
    const { bookingData, bookingId } = route.params as {
        bookingData?: ServiceBooking;
        bookingId?: string;
    };

    const booking: ServiceBooking | undefined = bookingData;
    const isLoading = false;
    const isError = !booking;
    const refetch = undefined; // no hook to call

    // ── Animations ────────────────────────────────────────────────────────────
    const headerFade = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-20)).current;
    const contentFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!isLoading && booking) {
            Animated.parallel([
                Animated.timing(headerFade, {
                    toValue: 1,
                    duration: 340,
                    useNativeDriver: true,
                }),
                Animated.spring(headerSlide, {
                    toValue: 0,
                    speed: 16,
                    bounciness: 4,
                    useNativeDriver: true,
                }),
                Animated.timing(contentFade, {
                    toValue: 1,
                    duration: 480,
                    delay: 120,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isLoading, booking]);

    const handleShare = useCallback(async () => {
        if (!booking) return;
        try {
            await Share.share({
                message: [
                    `Service Booking — ${booking.serviceSnapshot?.title ?? 'Service'}`,
                    `Booking #${booking.bookingNumber ?? booking.quotationNumber ?? 'N/A'}`,
                    `Event Date: ${fmtDate(booking.eventDate)}`,
                    `Total: ${fmtCurrency(booking.pricing?.total ?? booking.amount)}`,
                ].join('\n'),
            });
        } catch {
            // share dismissed — no-op
        }
    }, [booking]);

    // ── Derived ───────────────────────────────────────────────────────────────
    const statusCfg = STATUS_CFG[booking?.status ?? ''] ?? STATUS_CFG.enquiry;
    const paymentCfg = PAYMENT_CFG[booking?.paymentStatus ?? ''] ?? PAYMENT_CFG.pending;

    const subtotal = booking?.pricing?.subtotal ?? booking?.amount ?? 0;
    const cgst = booking?.pricing?.serviceCGST ?? 0;
    const sgst = booking?.pricing?.serviceSGST ?? 0;
    const platformFee = booking?.pricing?.platformFee ?? 0;
    const platformFeeGST = booking?.pricing?.platformFeeGST ?? 0;
    const discount = booking?.coupon?.discountAmount ?? 0;
    const total = booking?.pricing?.total ?? booking?.amount ?? 0;

    // ── Loading state ─────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <View style={s.centeredState}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={s.centeredStateText}>Loading booking…</Text>
            </View>
        );
    }

    // ── Error / missing state ─────────────────────────────────────────────────
    if (isError || !booking) {
        return (
            <View style={s.centeredState}>
                <View style={s.errorIconWrap}>
                    <Ionicons name="alert-circle-outline" size={32} color={Colors.danger} />
                </View>
                <Text style={s.centeredStateText}>Failed to load booking</Text>
                {refetch && (
                    <TouchableOpacity
                        style={s.retryBtn}
                        onPress={() =>console.log('Refetch')}
                        activeOpacity={0.8}
                    >
                        <Text style={s.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
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
                    <TouchableOpacity
                        style={s.backBtn}
                        onPress={() => navigation.goBack()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="chevron-back" size={20} color={Colors.charcoalMid} />
                    </TouchableOpacity>

                    <View style={s.headerCenter}>
                        <Text style={s.headerEyebrow}>SERVICE BOOKING</Text>
                        <Text style={s.headerTitle} numberOfLines={1}>
                            {booking.serviceSnapshot?.title ?? 'Booking Detail'}
                        </Text>
                    </View>

                    <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.8}>
                        <Ionicons name="share-outline" size={18} color={Colors.charcoalMid} />
                    </TouchableOpacity>
                </View>

                {/* Status + payment strip */}
                <View style={s.statusStrip}>
                    <View
                        style={[
                            s.statusBadge,
                            {
                                backgroundColor: statusCfg.bg,
                                borderColor: statusCfg.border,
                            },
                        ]}
                    >
                        <Ionicons name={statusCfg.icon as any} size={12} color={statusCfg.color} />
                        <Text style={[s.statusBadgeText, { color: statusCfg.color }]}>
                            {statusCfg.label}
                        </Text>
                    </View>

                    <View style={[s.statusBadge, { backgroundColor: paymentCfg.bg }]}>
                        <Ionicons
                            name={paymentCfg.icon as any}
                            size={12}
                            color={paymentCfg.color}
                        />
                        <Text style={[s.statusBadgeText, { color: paymentCfg.color }]}>
                            {paymentCfg.label}
                        </Text>
                    </View>

                    {booking.bookingNumber ?? booking.quotationNumber ? (
                        <View style={s.bookingNumBadge}>
                            <Text style={s.bookingNumText}>
                                #{booking.bookingNumber ?? booking.quotationNumber}
                            </Text>
                        </View>
                    ) : null}
                </View>
            </Animated.View>

            {/* ── Body ── */}
            <Animated.ScrollView
                style={{ opacity: contentFade }}
                contentContainerStyle={s.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Hero total card ── */}
                <View style={s.heroCard}>
                    <View style={s.heroLeft}>
                        <Text style={s.heroLabel}>Total Amount</Text>
                        <Text style={s.heroAmount}>{fmtCurrency(total)}</Text>
                        <Text style={s.heroMeta}>Event on {fmtDate(booking.eventDate)}</Text>
                    </View>
                    <View style={s.heroRight}>
                        <View style={[s.heroIconWrap, { backgroundColor: Colors.primaryLight }]}>
                            <Ionicons name="construct-outline" size={26} color={Colors.primary} />
                        </View>
                        <Text style={s.heroCategory} numberOfLines={1}>
                            {booking.serviceSnapshot?.category ?? 'Service'}
                        </Text>
                    </View>
                </View>

                {/* ── Service info ── */}
                <SectionCard>
                    <SectionHeader icon="construct-outline" title="Service Details" />
                    <Divider />
                    <InfoRow label="Service" value={booking.serviceSnapshot?.title} />
                    <InfoRow label="Category" value={booking.serviceSnapshot?.category} />
                    <InfoRow label="Company" value={booking.serviceSnapshot?.companyName} />
                    <InfoRow
                        label="Location"
                        value={
                            [booking.serviceSnapshot?.city, booking.serviceSnapshot?.state]
                                .filter(Boolean)
                                .join(', ') || undefined
                        }
                    />
                    <InfoRow label="Event Date" value={fmtDate(booking.eventDate)} />
                </SectionCard>

                {/* ── Customer info ── */}
                {booking.customerInfo && (
                    <SectionCard>
                        <SectionHeader icon="person-outline" title="Customer Details" />
                        <Divider />
                        <InfoRow label="Name" value={booking.customerInfo.name} />
                        <InfoRow label="Email" value={booking.customerInfo.email} />
                        <InfoRow label="Phone" value={booking.customerInfo.phone} />
                        <InfoRow label="Company" value={booking.customerInfo.company} />
                        <InfoRow label="Event Name" value={booking.customerInfo.eventName} />
                        {booking.customerInfo.notes ? (
                            <>
                                <Divider />
                                <View style={s.notesWrap}>
                                    <Text style={s.notesLabel}>Notes</Text>
                                    <Text style={s.notesText}>{booking.customerInfo.notes}</Text>
                                </View>
                            </>
                        ) : null}
                    </SectionCard>
                )}

                {/* ── Line items ── */}
                {(booking.items?.length ?? 0) > 0 && (
                    <SectionCard>
                        <SectionHeader icon="list-outline" title="Items" />
                        <Divider />
                        {booking.items.map((item, i) => (
                            <View key={i}>
                                <View style={s.itemRow}>
                                    <View style={s.itemLeft}>
                                        <View style={s.itemDot} />
                                        <View style={s.itemMeta}>
                                            <Text style={s.itemName}>
                                                {item.name ?? `Item ${i + 1}`}
                                            </Text>
                                            <Text style={s.itemUnit}>
                                                {[
                                                    item.quantity != null
                                                        ? `Qty: ${item.quantity}`
                                                        : null,
                                                    item.unit ?? null,
                                                    item.price != null
                                                        ? `· ${fmtCurrency(item.price)} each`
                                                        : null,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ')}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={s.itemAmount}>{fmtCurrency(item.amount)}</Text>
                                </View>
                                {i < booking.items.length - 1 && <View style={s.itemSeparator} />}
                            </View>
                        ))}
                    </SectionCard>
                )}

                {/* ── Pricing breakdown ── */}
                <SectionCard>
                    <SectionHeader icon="receipt-outline" title="Pricing Breakdown" />
                    <Divider />

                    <View style={s.pricingRow}>
                        <Text style={s.pricingLabel}>Subtotal</Text>
                        <Text style={s.pricingValue}>{fmtCurrency(subtotal)}</Text>
                    </View>

                    {cgst > 0 && (
                        <View style={s.pricingRow}>
                            <Text style={s.pricingLabel}>
                                CGST
                                {booking.pricing?.cgstPct ? ` (${booking.pricing.cgstPct}%)` : ''}
                            </Text>
                            <Text style={s.pricingValue}>{fmtCurrency(cgst)}</Text>
                        </View>
                    )}
                    {sgst > 0 && (
                        <View style={s.pricingRow}>
                            <Text style={s.pricingLabel}>
                                SGST
                                {booking.pricing?.sgstPct ? ` (${booking.pricing.sgstPct}%)` : ''}
                            </Text>
                            <Text style={s.pricingValue}>{fmtCurrency(sgst)}</Text>
                        </View>
                    )}
                    {platformFee > 0 && (
                        <View style={s.pricingRow}>
                            <Text style={s.pricingLabel}>
                                Platform Fee
                                {booking.pricing?.platformFeePct
                                    ? ` (${booking.pricing.platformFeePct}%)`
                                    : ''}
                            </Text>
                            <Text style={s.pricingValue}>{fmtCurrency(platformFee)}</Text>
                        </View>
                    )}
                    {platformFeeGST > 0 && (
                        <View style={s.pricingRow}>
                            <Text style={s.pricingLabel}>Platform Fee GST</Text>
                            <Text style={s.pricingValue}>{fmtCurrency(platformFeeGST)}</Text>
                        </View>
                    )}
                    {discount > 0 && (
                        <View style={s.pricingRow}>
                            <Text style={[s.pricingLabel, { color: Colors.success }]}>
                                {booking.coupon?.code
                                    ? `Coupon (${booking.coupon.code})`
                                    : 'Discount'}
                            </Text>
                            <Text style={[s.pricingValue, { color: Colors.success }]}>
                                -{fmtCurrency(discount)}
                            </Text>
                        </View>
                    )}

                    <View style={s.pricingTotalRow}>
                        <Text style={s.pricingTotalLabel}>Total</Text>
                        <Text style={s.pricingTotalValue}>{fmtCurrency(total)}</Text>
                    </View>
                </SectionCard>

                {/* ── Payment details ── */}
                {booking.paymentDetails?.razorpay_payment_id ? (
                    <SectionCard>
                        <SectionHeader icon="card-outline" title="Payment Details" />
                        <Divider />
                        <InfoRow
                            label="Payment ID"
                            value={booking.paymentDetails.razorpay_payment_id}
                            mono
                        />
                        {booking.paymentDetails.razorpay_order_id ? (
                            <InfoRow
                                label="Order ID"
                                value={booking.paymentDetails.razorpay_order_id}
                                mono
                            />
                        ) : null}
                        {booking.paymentDetails.paidAt ? (
                            <InfoRow
                                label="Paid At"
                                value={fmtDateTime(booking.paymentDetails.paidAt)}
                            />
                        ) : null}
                    </SectionCard>
                ) : null}

                {/* ── Meta info ── */}
                <SectionCard>
                    <SectionHeader icon="information-circle-outline" title="Booking Info" />
                    <Divider />
                    {booking.bookingNumber ? (
                        <InfoRow label="Booking #" value={booking.bookingNumber} mono />
                    ) : null}
                    {booking.quotationNumber ? (
                        <InfoRow label="Quotation #" value={booking.quotationNumber} mono />
                    ) : null}
                    <InfoRow label="Created" value={fmtDateTime(booking.createdAt)} />
                    <InfoRow label="Last Updated" value={fmtDateTime(booking.updatedAt)} />
                    {booking.downloadedAt ? (
                        <InfoRow label="Downloaded" value={fmtDateTime(booking.downloadedAt)} />
                    ) : null}
                </SectionCard>

                <View style={{ height: 40 }} />
            </Animated.ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },

    // Centered states
    centeredState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        gap: Spacing.md,
        paddingHorizontal: Spacing.xl,
    },
    centeredStateText: {
        fontSize: Typography.md,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    errorIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.dangerLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    retryBtn: {
        marginTop: Spacing.sm,
        paddingHorizontal: Spacing.xl,
        paddingVertical: 10,
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        ...Shadows.primary,
    },
    retryBtnText: {
        fontSize: Typography.base,
        fontWeight: Typography.extraBold,
        color: Colors.surface,
    },

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
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg,
        paddingBottom: Spacing.sm,
        gap: Spacing.sm,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        flexShrink: 0,
    },
    headerCenter: { flex: 1 },
    headerEyebrow: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: Typography.wider,
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    shareBtn: {
        width: 36,
        height: 36,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        flexShrink: 0,
    },

    // Status strip
    statusStrip: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xs,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    statusBadgeText: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        letterSpacing: 0.2,
    },
    bookingNumBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radii.full,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    bookingNumText: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.3,
    },

    // Scroll body
    scroll: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        gap: Spacing.md,
    },

    // Hero card
    heroCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        padding: Spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        ...Shadows.card,
    },
    heroLeft: { gap: 4 },
    heroLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: Typography.wide,
        textTransform: 'uppercase',
    },
    heroAmount: {
        fontSize: 32,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -1,
    },
    heroMeta: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    heroRight: { alignItems: 'center', gap: Spacing.sm },
    heroIconWrap: {
        width: 56,
        height: 56,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
    },
    heroCategory: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.primary,
        maxWidth: 90,
        textAlign: 'center',
    },

    // Section card
    sectionCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: Spacing.sm,
        ...Shadows.card,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    sectionIconWrap: {
        width: 28,
        height: 28,
        borderRadius: Radii.sm,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: Typography.md,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
    },

    divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.xs },

    // Info row
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: Spacing.md,
        paddingVertical: 3,
    },
    infoLabel: {
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        flexShrink: 0,
        minWidth: 100,
    },
    infoValue: {
        fontSize: Typography.base,
        color: Colors.charcoal,
        fontWeight: Typography.semiBold,
        textAlign: 'right',
        flex: 1,
    },
    infoValueMono: {
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
        fontSize: Typography.sm,
        letterSpacing: 0.3,
    },

    // Notes
    notesWrap: { gap: 4 },
    notesLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        textTransform: 'uppercase',
        letterSpacing: Typography.wide,
    },
    notesText: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
        lineHeight: 20,
    },

    // Line items
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
    },
    itemLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, flex: 1 },
    itemDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: Colors.primary,
        marginTop: 5,
        flexShrink: 0,
    },
    itemMeta: { flex: 1, gap: 2 },
    itemName: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    itemUnit: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    itemAmount: {
        fontSize: Typography.base,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        flexShrink: 0,
    },
    itemSeparator: { height: 1, backgroundColor: Colors.divider, marginLeft: 20 },

    // Pricing breakdown
    pricingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    pricingLabel: {
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    pricingValue: {
        fontSize: Typography.base,
        color: Colors.charcoal,
        fontWeight: Typography.semiBold,
    },
    pricingTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.sm,
        paddingTop: Spacing.sm,
        borderTopWidth: 1.5,
        borderTopColor: Colors.border,
    },
    pricingTotalLabel: {
        fontSize: Typography.md,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
    },
    pricingTotalValue: {
        fontSize: 20,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
        letterSpacing: -0.5,
    },
});

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    StatusBar,
    ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';
import { useGetBookingDetail } from '../hooks/useGetBookingDetail';
import { useUpdateStatus } from '../hooks/useUpdateStatus';
import { useCancelBooking } from '../hooks/useCancelBooking';
import { useApproveBooking } from '../hooks/useApproveBooking';
import { ApiError } from '@/types/ApiError';
import { useAlert } from '@/context/AlertContext';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors, Spacing, Radii, Typography, Shadows, StatusConfig } from '@/theme/theme';
import { useCreatePaymentOrder, useVerifyPayment } from '../hooks/usePayment';
import { Config } from 'react-native-config';
import RazorpayCheckout from 'react-native-razorpay';

// ─── Types ────────────────────────────────────────────────────────────────────

type statusIdType = 'confirm' | 'confirmSoon' | 'cancel';
type BookingDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'venueBookingDetail'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d?: string | Date) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const formatDateShort = (d?: string | Date) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

/** Normalise "HH:MM" 24-h or "HH:MM AM/PM" to 12-h display.
 *  Returns the raw string if it's a label like "Closing". */
const formatTimeStr = (t?: string): string => {
    if (!t) return '—';
    // Non-time labels (e.g. "Closing") — return as-is
    if (!/^\d{1,2}:\d{2}/.test(t)) return t.trim();
    if (/[AaPp][Mm]/.test(t)) return t.trim();
    const [hStr, mStr] = t.split(':');
    const h = parseInt(hStr, 10);
    const m = mStr ?? '00';
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m} ${period}`;
};

/** Returns duration string. Returns '—' if either time is a non-numeric label. */
const calcHours = (start?: string, end?: string): string => {
    if (!start || !end) return '—';
    // Guard against labels like "Closing"
    if (!/^\d{1,2}:\d{2}/.test(start) || !/^\d{1,2}:\d{2}/.test(end)) return '—';
    try {
        const toMinutes = (t: string) => {
            const isPM = /[Pp][Mm]/.test(t);
            const cleaned = t.replace(/\s*[AaPp][Mm]/, '').trim();
            const [hPart, mPart] = cleaned.split(':');
            const h = parseInt(hPart, 10);
            const mins = parseInt(mPart ?? '0', 10);
            let total = (h % 12) * 60 + mins;
            if (isPM) total += 12 * 60;
            return total;
        };
        let diff = toMinutes(end) - toMinutes(start);
        if (diff < 0) diff += 24 * 60;
        const hrs = Math.floor(diff / 60);
        const mins = diff % 60;
        return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    } catch {
        return '—';
    }
};

const formatCurrency = (n?: number) =>
    n == null
        ? '—'
        : `₹${Number(n).toLocaleString('en-IN', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
          })}`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({
    icon,
    label,
    value,
    valueColor,
}: {
    icon: string;
    label: string;
    value: string;
    valueColor?: string;
}) {
    return (
        <View style={infoRowStyles.row}>
            <View style={infoRowStyles.iconWrap}>
                <Ionicons name={icon as any} size={16} color={Colors.primary} />
            </View>
            <View style={infoRowStyles.textWrap}>
                <Text style={infoRowStyles.label}>{label}</Text>
                <Text style={[infoRowStyles.value, valueColor ? { color: valueColor } : null]}>
                    {value}
                </Text>
            </View>
        </View>
    );
}

const infoRowStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: Radii.sm,
        backgroundColor: Colors.primaryDim,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },
    textWrap: { flex: 1 },
    label: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: Typography.wide,
        textTransform: 'uppercase',
        marginBottom: 3,
    },
    value: {
        fontSize: Typography.md,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
        lineHeight: 20,
    },
});

function Section({
    icon,
    title,
    children,
    noPad,
    headerRight,
}: {
    icon: string;
    title: string;
    children: React.ReactNode;
    noPad?: boolean;
    headerRight?: React.ReactNode;
}) {
    return (
        <View style={sectionStyles.card}>
            <View style={sectionStyles.header}>
                <Ionicons name={icon as any} size={15} color={Colors.primary} />
                <Text style={sectionStyles.title}>{title}</Text>
                {headerRight && <View style={sectionStyles.headerRight}>{headerRight}</View>}
            </View>
            <View style={noPad ? undefined : sectionStyles.body}>{children}</View>
        </View>
    );
}

const sectionStyles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        marginBottom: Spacing.md,
        overflow: 'hidden',
        ...Shadows.card,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    headerRight: { marginLeft: 'auto' },
    title: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: Typography.normal,
        textTransform: 'uppercase',
    },
    body: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
});

function AmenityRow({
    name,
    type,
    quantity,
    total,
}: {
    name: string;
    type: string;
    quantity: number;
    total: number;
}) {
    const isPaid = type === 'Paid';
    return (
        <View style={amenityStyles.row}>
            <View style={amenityStyles.left}>
                <Ionicons
                    name={isPaid ? 'pricetag-outline' : 'checkmark-circle-outline'}
                    size={13}
                    color={isPaid ? Colors.primary : Colors.success}
                />
                <Text style={amenityStyles.name} numberOfLines={1}>
                    {name}
                </Text>
                {quantity > 1 && (
                    <View style={amenityStyles.qtyBadge}>
                        <Text style={amenityStyles.qtyText}>×{quantity}</Text>
                    </View>
                )}
            </View>
            <Text style={[amenityStyles.amount, isPaid && amenityStyles.amountPaid]}>
                {isPaid ? formatCurrency(total) : 'Free'}
            </Text>
        </View>
    );
}

const amenityStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
    name: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
        flex: 1,
    },
    qtyBadge: {
        backgroundColor: Colors.primaryDim,
        borderRadius: Radii.sm,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    qtyText: { fontSize: Typography.xs, color: Colors.primaryDark, fontWeight: Typography.bold },
    amount: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.success },
    amountPaid: { color: Colors.charcoalMid },
});

function PriceRow({
    label,
    value,
    bold,
    accent,
    separator,
    sub,
}: {
    label: string;
    value: string;
    bold?: boolean;
    accent?: boolean;
    separator?: boolean;
    sub?: boolean;
}) {
    return (
        <>
            {separator && <View style={priceStyles.separator} />}
            <View style={priceStyles.row}>
                <Text
                    style={[
                        priceStyles.label,
                        bold && priceStyles.bold,
                        accent && priceStyles.accentText,
                        sub && priceStyles.subText,
                    ]}
                >
                    {label}
                </Text>
                <Text
                    style={[
                        priceStyles.value,
                        bold && priceStyles.bold,
                        accent && priceStyles.accentText,
                        sub && priceStyles.subText,
                    ]}
                >
                    {value}
                </Text>
            </View>
        </>
    );
}

const priceStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 7,
    },
    label: { fontSize: Typography.base, color: Colors.charcoalMid, fontWeight: Typography.medium },
    value: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.semiBold,
    },
    bold: { fontWeight: Typography.extraBold, fontSize: Typography.lg, color: Colors.charcoal },
    accentText: { color: Colors.primary },
    subText: { fontSize: Typography.sm, color: Colors.charcoalLight },
    separator: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.xs },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BookingDetailScreen({ route, navigation }: BookingDetailScreenProps) {
    // Route may pass either bookingId (string) or a full booking object
    const routeBookingId = (route.params as any)?.bookingId ?? (route.params as any)?.booking?._id;

    const { user } = useAuthStore();
    const { data: bookingData, isLoading, refetch } = useGetBookingDetail(routeBookingId);

    // Fall back to the passed booking object while the fetch is in-flight
    const booking = bookingData?.booking ?? (route.params as any)?.booking ?? {};

    const { mutate: updateStatus } = useUpdateStatus();
    const { mutate: cancelBooking } = useCancelBooking();
    const { mutate: approveSoon } = useApproveBooking();
    const { mutate: createPaymentOrder } = useCreatePaymentOrder();
    const { mutate: verifyPaymentMutate } = useVerifyPayment();
    const alert = useAlert();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 340, useNativeDriver: true }),
            Animated.spring(slideAnim, {
                toValue: 0,
                speed: 16,
                bounciness: 5,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim]);

    // ── Derived values ──────────────────────────────────────────────────────

    const cfg = StatusConfig[booking.status] ?? {
        color: Colors.charcoalLight,
        bg: Colors.border,
        icon: 'ellipse',
        label: booking.status ?? '—',
    };

    // FIX: API returns `businessName`, not `bussinessName`
    const venueName = booking.venue?.businessName ?? 'Unknown Venue';
    const venueAddress = booking.venue?.location
        ? [booking.venue.location.address, booking.venue.location.area, booking.venue.location.city]
              .filter(Boolean)
              .join(', ')
        : '—';

    const basicAmenities = booking.selectedAmenities?.basic ?? [];
    const paidAmenities = basicAmenities.filter((a: any) => a.type === 'Paid');
    const freeAmenities = basicAmenities.filter((a: any) => a.type !== 'Paid');
    // Deduplicate free amenities by name
    const uniqueFreeAmenities = freeAmenities.filter(
        (a: any, idx: number, arr: any[]) => arr.findIndex((x: any) => x.name === a.name) === idx,
    );

    const thalis = booking.selectedAmenities?.lunchThalis ?? [];
    const beverages = booking.selectedAmenities?.beverages ?? [];
    const refreshments = booking.selectedAmenities?.refreshmentFood ?? [];
    const additional = booking.selectedAmenities?.additional ?? [];

    const { priceBreakdown, customerDetails } = booking;

    // ── Actions ─────────────────────────────────────────────────────────────

    /** Wraps mutation in a promise so isSubmitting stays true until callback fires */
    const handleStatusUpdate = (id: statusIdType, status: string) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        const onSuccess = () => {
            refetch();
            alert.success('Success', 'Booking updated successfully');
            setIsSubmitting(false);
        };
        const onError = (error: ApiError) => {
            alert.error('Failed', error?.message || 'Something went wrong');
            setIsSubmitting(false);
        };

        if (id === 'cancel') {
            cancelBooking(
                { id: routeBookingId, payload: { reason: 'Cancelled by user' } },
                { onSuccess, onError },
            );
        } else if (id === 'confirmSoon') {
            approveSoon(routeBookingId, { onSuccess, onError });
        } else {
            updateStatus({ id: routeBookingId, data: { status } }, { onSuccess, onError });
        }
    };

    const handlePayment = useCallback(
        (bookingId: string): Promise<void> =>
            new Promise((resolve, reject) => {
                createPaymentOrder(
                    {
                        bookingId,
                        amount: priceBreakdown?.total ,
                        bookingType: booking.bookingType,
                    },
                    {
                        onSuccess: async (orderData: any) => {
                            if (!orderData?.success) {
                                reject(new Error('Failed to create payment order'));
                                return;
                            }
                            try {
                                const options = {
                                    key: Config.RAZORPAY_KEY_TEST ?? '',
                                    amount: orderData.order.amount,
                                    currency: orderData.order.currency ?? 'INR',
                                    name: 'RentalMeet',
                                    description: `Booking Payment - ${venueName}`,
                                    order_id: orderData.order.id,
                                    prefill: { name: customerDetails?.fullName, email: customerDetails?.email, contact: customerDetails?.phone },
                                    theme: { color: '#F59F0A' },
                                };

                                const razorpayResponse = await RazorpayCheckout.open(options);

                                if (!razorpayResponse?.razorpay_payment_id) {
                                    reject(new Error('Payment not completed'));
                                    return;
                                }

                                // FIX 7: verifyPaymentMutate is the mutate fn — call it properly
                                verifyPaymentMutate(
                                    {
                                        razorpay_order_id: razorpayResponse.razorpay_order_id,
                                        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                                        razorpay_signature: razorpayResponse.razorpay_signature,
                                        bookingId,
                                        paidAmount: priceBreakdown?.total,
                                        bookingType: booking.bookingType,
                                    },
                                    {
                                        onSuccess: (verifyData: any) => {
                                            if (verifyData?.success) {
                                                alert.success(
                                                    'Payment Successful',
                                                    'Booking confirmed!',
                                                );
                                                navigation.popToTop?.() ?? navigation.goBack();
                                                resolve();
                                            } else {
                                                reject(new Error('Payment verification failed'));
                                            }
                                        },
                                        onError: (err: any) => reject(err),
                                    },
                                );
                            } catch (err) {
                                reject(err);
                            }
                        },
                        onError: (err: any) => reject(err),
                    },
                );
            }),
        [
            createPaymentOrder,
            verifyPaymentMutate,
            alert,
            navigation,
        ],
    );

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <View style={styles.root}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

            {/* ── Sticky Header ── */}
            <View style={styles.stickyHeader}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.75}
                >
                    <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {venueName}
                    </Text>
                    <Text style={styles.headerSub}>#{booking.bookingNumber ?? '—'}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                    <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
            </View>

            <Animated.ScrollView
                style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Hero Banner ── */}
                <View style={[styles.heroBanner, { backgroundColor: cfg.bg }]}>
                    <View style={[styles.heroAccentBar, { backgroundColor: cfg.color }]} />
                    <View style={styles.heroContent}>
                        <View style={styles.heroLeft}>
                            <Text style={styles.heroVenueName}>{venueName}</Text>
                            <View style={styles.heroAddressRow}>
                                <Ionicons
                                    name="location-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={styles.heroAddress} numberOfLines={2}>
                                    {venueAddress}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.heroBadge, { borderColor: cfg.color }]}>
                            <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
                            <Text style={[styles.heroBadgeText, { color: cfg.color }]}>
                                {cfg.label}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── Booking Info ── */}
                <Section
                    icon="calendar-outline"
                    title="Booking Details"
                    headerRight={
                        // Show Modify button only for confirmed bookings (owner can modify)
                        user?.role === 'owner' && booking.status === 'confirmed' ? (
                            <TouchableOpacity
                                style={styles.modifyBtn}
                                onPress={() =>
                                    navigation.navigate('modifyVenueBooking', {
                                        bookingId: routeBookingId,
                                        booking: booking,
                                    })
                                }
                                activeOpacity={0.8}
                            >
                                <Ionicons name="create-outline" size={13} color={Colors.primary} />
                                <Text style={styles.modifyBtnText}>Modify</Text>
                            </TouchableOpacity>
                        ) : null
                    }
                >
                    <InfoRow
                        icon="barcode-outline"
                        label="Booking Number"
                        value={booking.bookingNumber ?? '—'}
                    />
                    <View style={styles.divider} />
                    <InfoRow
                        icon="calendar-outline"
                        label="Booking Date"
                        value={formatDate(booking.bookingDate)}
                    />
                    <View style={styles.divider} />
                    <InfoRow
                        icon="time-outline"
                        label="Time Slot"
                        value={
                            `${formatTimeStr(booking.startTime)} – ${formatTimeStr(
                                booking.endTime,
                            )}` +
                            (calcHours(booking.startTime, booking.endTime) !== '—'
                                ? `  (${calcHours(booking.startTime, booking.endTime)})`
                                : '')
                        }
                    />
                    <View style={styles.divider} />
                    <InfoRow
                        icon="bookmark-outline"
                        label="Booking Type"
                        value={
                            booking.bookingType?.replace(/\b\w/g, (c: string) => c.toUpperCase()) ??
                            '—'
                        }
                    />
                    <View style={styles.divider} />
                    <InfoRow
                        icon="receipt-outline"
                        label="Created On"
                        value={formatDateShort(booking.createdAt)}
                    />
                    <View style={styles.divider} />
                    <InfoRow
                        icon="card-outline"
                        label="Payment Status"
                        value={
                            booking.paymentStatus?.replace(/\b\w/g, (c: string) =>
                                c.toUpperCase(),
                            ) ?? '—'
                        }
                        valueColor={
                            booking.paymentStatus === 'paid' ? Colors.success : Colors.warning
                        }
                    />
                    {user?.role === 'customer' &&
                        booking.paymentStatus === 'pending' &&
                        booking.status !== 'cancelled' && (
                            <>
                                <View style={styles.divider} />
                                <TouchableOpacity
                                    style={styles.payNowRow}
                                    onPress={() => handlePayment(routeBookingId)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.payNowLeft}>
                                        <View style={styles.payNowIconWrap}>
                                            <Ionicons
                                                name="card-outline"
                                                size={16}
                                                color={Colors.white}
                                            />
                                        </View>
                                        <View>
                                            <Text style={styles.payNowLabel}>PAYMENT DUE</Text>
                                            <Text style={styles.payNowValue}>
                                                {formatCurrency(priceBreakdown?.total)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.payNowBtn}>
                                        <Text style={styles.payNowBtnText}>Pay Now</Text>
                                        <Ionicons
                                            name="arrow-forward"
                                            size={14}
                                            color={Colors.white}
                                        />
                                    </View>
                                </TouchableOpacity>
                            </>
                        )}
                    {/* Cancellation reason */}
                    {!!booking.cancellationReason && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.notesBox}>
                                <View style={styles.notesIconRow}>
                                    <Ionicons
                                        name="close-circle-outline"
                                        size={13}
                                        color={Colors.danger}
                                    />
                                    <Text style={[styles.notesLabel, { color: Colors.danger }]}>
                                        Cancellation Reason
                                    </Text>
                                </View>
                                <Text style={styles.notesText}>{booking.cancellationReason}</Text>
                            </View>
                        </>
                    )}
                </Section>

                {/* ── Customer Details ── */}
                {customerDetails && (
                    <Section icon="person-outline" title="Customer Details">
                        <InfoRow
                            icon="person-outline"
                            label="Name"
                            value={customerDetails.name ?? '—'}
                        />
                        <View style={styles.divider} />
                        <InfoRow
                            icon="mail-outline"
                            label="Email"
                            value={customerDetails.email ?? '—'}
                        />
                        <View style={styles.divider} />
                        <InfoRow
                            icon="call-outline"
                            label="Phone"
                            value={customerDetails.phone ?? '—'}
                        />
                        <View style={styles.divider} />
                        <InfoRow
                            icon="star-outline"
                            label="Event Type"
                            value={customerDetails.eventType ?? '—'}
                        />
                        <View style={styles.divider} />
                        <InfoRow
                            icon="people-outline"
                            label="Guest Count"
                            value={
                                customerDetails.guestCount != null
                                    ? `${customerDetails.guestCount} guests`
                                    : '—'
                            }
                        />
                        {!!customerDetails.specialRequirements && (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.notesBox}>
                                    <View style={styles.notesIconRow}>
                                        <Ionicons
                                            name="document-text-outline"
                                            size={13}
                                            color={Colors.primary}
                                        />
                                        <Text style={styles.notesLabel}>Special Requirements</Text>
                                    </View>
                                    <Text style={styles.notesText}>
                                        {customerDetails.specialRequirements}
                                    </Text>
                                </View>
                            </>
                        )}
                    </Section>
                )}

                {/* ── Included Amenities ── */}
                {uniqueFreeAmenities.length > 0 && (
                    <Section icon="checkmark-done-outline" title="Included Amenities" noPad>
                        <View style={styles.amenityList}>
                            <View style={styles.amenityGrid}>
                                {uniqueFreeAmenities.map((a: any, idx: number) => (
                                    <View key={`${a.name}-${idx}`} style={styles.amenityChip}>
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={13}
                                            color={Colors.success}
                                        />
                                        <Text style={styles.amenityChipText}>{a.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </Section>
                )}

                {/* ── Paid Amenities ── */}
                {paidAmenities.length > 0 && (
                    <Section icon="pricetag-outline" title="Paid Amenities">
                        {paidAmenities.map((a: any, idx: number) => (
                            <AmenityRow
                                key={a._id ?? idx}
                                name={a.name}
                                type={a.type}
                                quantity={a.quantity ?? 1}
                                total={a.total ?? 0}
                            />
                        ))}
                    </Section>
                )}

                {/* ── Lunch Thalis ── */}
                {thalis.length > 0 && (
                    <Section icon="restaurant-outline" title="Lunch Thalis">
                        {thalis.map((t: any, idx: number) => (
                            <View key={t._id ?? idx} style={styles.thaliRow}>
                                <View style={styles.thaliLeft}>
                                    <Text style={styles.thaliName}>{t.thaliType}</Text>
                                    <Text style={styles.thaliCategory}>{t.category}</Text>
                                    {!!t.itemNames && (
                                        <Text style={styles.thaliItems}>{t.itemNames}</Text>
                                    )}
                                </View>
                                <View style={styles.thaliRight}>
                                    <Text style={styles.thaliQty}>×{t.quantity}</Text>
                                    <Text style={styles.thaliTotal}>{formatCurrency(t.total)}</Text>
                                    <Text style={styles.thaliRate}>
                                        {formatCurrency(t.ratePerPlate)}/plate
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </Section>
                )}

                {/* ── Beverages ── */}
                {beverages.length > 0 && (
                    <Section icon="cafe-outline" title="Beverages">
                        {beverages.map((b: any, idx: number) => (
                            <AmenityRow
                                key={b._id ?? idx}
                                name={b.name}
                                type="Paid"
                                quantity={b.quantity ?? 1}
                                total={b.total ?? 0}
                            />
                        ))}
                    </Section>
                )}

                {/* ── Refreshments ── */}
                {refreshments.length > 0 && (
                    <Section icon="fast-food-outline" title="Refreshments / Food">
                        {refreshments.map((r: any, idx: number) => (
                            <AmenityRow
                                key={r._id ?? idx}
                                name={r.name}
                                type="Paid"
                                quantity={r.quantity ?? 1}
                                total={r.total ?? 0}
                            />
                        ))}
                    </Section>
                )}

                {/* ── Additional ── */}
                {additional.length > 0 && (
                    <Section icon="add-circle-outline" title="Additional Items">
                        {additional.map((a: any, idx: number) => (
                            <AmenityRow
                                key={a._id ?? idx}
                                name={a.name}
                                type={a.type}
                                quantity={a.quantity ?? 1}
                                total={a.total ?? 0}
                            />
                        ))}
                    </Section>
                )}

                {/* ── Price Breakdown ── */}
                {priceBreakdown && (
                    <Section icon="calculator-outline" title="Price Breakdown">
                        <PriceRow
                            label="Base Price"
                            value={formatCurrency(priceBreakdown.basePrice)}
                        />
                        {(priceBreakdown.amenitiesTotal ?? 0) > 0 && (
                            <PriceRow
                                label="Amenities"
                                value={formatCurrency(priceBreakdown.amenitiesTotal)}
                            />
                        )}
                        <PriceRow
                            label="Subtotal"
                            value={formatCurrency(priceBreakdown.subtotal)}
                        />
                        {(priceBreakdown.gstRate ?? 0) > 0 && (
                            <PriceRow
                                label={`GST (${priceBreakdown.gstRate}%)`}
                                value={formatCurrency(priceBreakdown.gst)}
                                sub
                            />
                        )}
                        {(priceBreakdown.platformFee ?? 0) > 0 && (
                            <PriceRow
                                label="Platform Fee"
                                value={formatCurrency(priceBreakdown.platformFee)}
                                sub
                            />
                        )}
                        {(priceBreakdown.discount ?? 0) > 0 && (
                            <PriceRow
                                label={`Discount${
                                    priceBreakdown.couponCode
                                        ? ` (${priceBreakdown.couponCode})`
                                        : ''
                                }`}
                                value={`- ${formatCurrency(priceBreakdown.discount)}`}
                                sub
                            />
                        )}
                        <PriceRow
                            label="Total Amount"
                            value={formatCurrency(priceBreakdown.total)}
                            bold
                            accent
                            separator
                        />
                    </Section>
                )}

                {/* ── Venue Location ── */}
                {booking.venue?.location && (
                    <Section icon="map-outline" title="Venue Location">
                        <InfoRow
                            icon="location-outline"
                            label="Address"
                            value={
                                [booking.venue.location.address, booking.venue.location.landmark]
                                    .filter(Boolean)
                                    .join(', ') || '—'
                            }
                        />
                        <View style={styles.divider} />
                        <InfoRow
                            icon="business-outline"
                            label="Area / City"
                            value={
                                [
                                    booking.venue.location.area,
                                    booking.venue.location.city,
                                    booking.venue.location.state,
                                    booking.venue.location.pincode
                                        ? `– ${booking.venue.location.pincode}`
                                        : '',
                                ]
                                    .filter(Boolean)
                                    .join(', ') || '—'
                            }
                        />
                        {!!booking.venue.location.parkingAvailability && (
                            <>
                                <View style={styles.divider} />
                                <InfoRow
                                    icon="car-outline"
                                    label="Parking"
                                    value={booking.venue.location.parkingAvailability}
                                />
                            </>
                        )}
                        {!!booking.venue.location.nearestBusAuto && (
                            <>
                                <View style={styles.divider} />
                                <InfoRow
                                    icon="bus-outline"
                                    label="Nearest Bus / Auto"
                                    value={booking.venue.location.nearestBusAuto}
                                />
                            </>
                        )}
                        {!!booking.venue.location.nearestMetroTrain && (
                            <>
                                <View style={styles.divider} />
                                <InfoRow
                                    icon="train-outline"
                                    label="Nearest Metro / Train"
                                    value={booking.venue.location.nearestMetroTrain}
                                />
                            </>
                        )}
                    </Section>
                )}

                {/* ── Action Buttons (owner) ── */}
                {user?.role === 'owner' && booking.status === 'pending' && (
                    <View style={styles.actionsContainer}>
                        <View style={styles.actionsRow}>
                            <TouchableOpacity
                                style={[
                                    styles.actionBtn,
                                    styles.actionBtnConfirm,
                                    isSubmitting && styles.actionBtnDisabled,
                                ]}
                                onPress={() => handleStatusUpdate('confirm', 'confirmed')}
                                activeOpacity={0.8}
                                disabled={isSubmitting}
                            >
                                <Ionicons
                                    name="checkmark-circle-outline"
                                    size={18}
                                    color={Colors.white}
                                />
                                <Text style={styles.actionBtnText}>Confirm</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.actionBtn,
                                    styles.actionBtnPending,
                                    isSubmitting && styles.actionBtnDisabled,
                                ]}
                                onPress={() => handleStatusUpdate('confirmSoon', 'confirmed')}
                                activeOpacity={0.8}
                                disabled={isSubmitting}
                            >
                                <Ionicons name="time-outline" size={18} color={Colors.warning} />
                                <Text style={[styles.actionBtnText, { color: Colors.warning }]}>
                                    Confirm Soon
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.actionBtn,
                                styles.actionBtnReject,
                                { alignSelf: 'stretch' },
                                isSubmitting && styles.actionBtnDisabled,
                            ]}
                            onPress={() => handleStatusUpdate('cancel', 'cancelled')}
                            activeOpacity={0.8}
                            disabled={isSubmitting}
                        >
                            <Ionicons name="close-circle-outline" size={18} color={Colors.danger} />
                            <Text style={[styles.actionBtnText, { color: Colors.danger }]}>
                                Cancel Booking
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── Action Buttons (customer) ── */}
                {user?.role === 'customer' && booking.status === 'pending' && (
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[
                                styles.actionBtn,
                                styles.actionBtnReject,
                                { alignSelf: 'stretch' },
                                isSubmitting && styles.actionBtnDisabled,
                            ]}
                            onPress={() => handleStatusUpdate('cancel', 'cancelled')}
                            activeOpacity={0.8}
                            disabled={isSubmitting}
                        >
                            <Ionicons name="close-circle-outline" size={18} color={Colors.danger} />
                            <Text style={[styles.actionBtnText, { color: Colors.danger }]}>
                                Cancel Booking
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 48 }} />
            </Animated.ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },

    stickyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
        ...Shadows.header,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: Radii.sm,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
    },
    headerSub: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        marginTop: 1,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: Radii.full,
    },
    statusPillText: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        letterSpacing: Typography.normal,
    },
    scroll: { paddingTop: Spacing.lg, paddingHorizontal: Spacing.lg },

    heroBanner: {
        borderRadius: Radii.xl,
        marginBottom: Spacing.md,
        overflow: 'hidden',
        ...Shadows.card,
    },
    heroAccentBar: { height: 4 },
    heroContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    heroLeft: { flex: 1 },
    heroVenueName: {
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
        marginBottom: Spacing.xs,
    },
    heroAddressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
    heroAddress: {
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        flex: 1,
        lineHeight: 18,
    },
    heroBadge: {
        alignItems: 'center',
        borderRadius: Radii.lg,
        borderWidth: 1.5,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        gap: 4,
        backgroundColor: Colors.surface,
    },
    heroBadgeText: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        letterSpacing: Typography.normal,
    },

    divider: { height: 1, backgroundColor: Colors.divider },

    modifyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radii.full,
        backgroundColor: Colors.primaryLight,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    modifyBtnText: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },

    notesBox: {
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        padding: Spacing.md,
        marginTop: Spacing.sm,
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
    },
    notesIconRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
    notesLabel: {
        fontSize: 10,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    notesText: { fontSize: Typography.base, color: Colors.charcoalMid, lineHeight: 19 },

    amenityList: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    amenityChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.successLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: Radii.full,
    },
    amenityChipText: {
        fontSize: Typography.sm,
        color: Colors.success,
        fontWeight: Typography.semiBold,
    },

    thaliRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    thaliLeft: { flex: 1, gap: 2 },
    thaliName: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.charcoal },
    thaliCategory: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    thaliItems: { fontSize: Typography.sm, color: Colors.charcoalMid, fontStyle: 'italic' },
    thaliRight: { alignItems: 'flex-end', gap: 2 },
    thaliQty: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    thaliTotal: {
        fontSize: Typography.md,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
    },
    thaliRate: { fontSize: Typography.xs, color: Colors.charcoalLight },

    actionsContainer: { marginBottom: Spacing.md, gap: Spacing.sm },
    actionsRow: { flexDirection: 'row', gap: Spacing.sm },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: Radii.lg,
        gap: 7,
    },
    actionBtnConfirm: { backgroundColor: Colors.success, ...Shadows.card },
    actionBtnPending: {
        backgroundColor: Colors.warningLight,
        borderWidth: 1.5,
        borderColor: Colors.warning,
    },
    actionBtnReject: {
        backgroundColor: Colors.dangerLight,
        borderWidth: 1.5,
        borderColor: '#FECACA',
    },
    actionBtnDisabled: { opacity: 0.5 },
    actionBtnText: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.white,
        letterSpacing: Typography.normal,
    },
    payNowRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
        gap: Spacing.md,
    },
    payNowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        flex: 1,
    },
    payNowIconWrap: {
        width: 36,
        height: 36,
        borderRadius: Radii.sm,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    payNowLabel: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: Typography.wide,
        textTransform: 'uppercase',
        marginBottom: 3,
    },
    payNowValue: {
        fontSize: Typography.md,
        fontWeight: Typography.semiBold,
        color: Colors.warning,
    },
    payNowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.full,
    },
    payNowBtnText: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.white,
    },
});

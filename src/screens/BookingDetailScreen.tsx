import React, { useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Alert,
    StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows, StatusConfig } from '../theme/theme';
import { useAuthStore } from '../store/auth-store';

// ─── Navigation types ─────────────────────────────────────────────────────────
// Attach to your stack param list as:
//   BookingDetail: { booking: BookingItem }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

const formatDateShort = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

const formatTimeStr = (t: string): string => {
    if (!t) return '';
    if (/[AaPp][Mm]/.test(t)) return t.trim();
    const [hStr, mStr] = t.split(':');
    const h = parseInt(hStr, 10);
    const m = mStr ?? '00';
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m} ${period}`;
};

const calcHours = (start: string, end: string): string => {
    try {
        const toMinutes = (t: string) => {
            const cleaned = t.replace(/[AaPp][Mm]/, '').trim();
            const [h, m] = cleaned.split(':').map(Number);
            const isPM = /[Pp][Mm]/.test(t) && h !== 12;
            const isAM = /[Aa][Mm]/.test(t) && h === 12;
            let total = h * 60 + (m || 0);
            if (isPM) total += 12 * 60;
            if (isAM) total -= 12 * 60;
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

const formatCurrency = (n: number) =>
    `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Eyebrow label + content row */
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

/** Section wrapper with header */
function Section({
    icon,
    title,
    children,
    noPad,
}: {
    icon: string;
    title: string;
    children: React.ReactNode;
    noPad?: boolean;
}) {
    return (
        <View style={sectionStyles.card}>
            <View style={sectionStyles.header}>
                <Ionicons name={icon as any} size={15} color={Colors.primary} />
                <Text style={sectionStyles.title}>{title}</Text>
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
    title: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: Typography.normal,
        textTransform: 'uppercase',
    },
    body: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
});

/** Amenity row inside the amenities section */
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

/** Price breakdown row */
function PriceRow({
    label,
    value,
    bold,
    accent,
    separator,
}: {
    label: string;
    value: string;
    bold?: boolean;
    accent?: boolean;
    separator?: boolean;
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
                    ]}
                >
                    {label}
                </Text>
                <Text
                    style={[
                        priceStyles.value,
                        bold && priceStyles.bold,
                        accent && priceStyles.accentText,
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
    separator: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.xs },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

interface BookingDetailScreenProps {
    route: { params: { booking: any } };
    navigation: any;
}

export default function BookingDetailScreen({ route, navigation }: BookingDetailScreenProps) {
    const { booking } = route.params;
    const { user } = useAuthStore();

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
    }, []);

    // ── Derived values ──────────────────────────────────────────────────────
    const cfg = StatusConfig[booking.status] ?? {
        color: Colors.charcoalLight,
        bg: Colors.border,
        icon: 'ellipse',
        label: booking.status,
    };

    const venueName = booking.venue?.businessName ?? 'Unknown Venue';
    const venueAddress = booking.venue?.location
        ? `${booking.venue.location.address}, ${booking.venue.location.area}, ${booking.venue.location.city}`
        : '—';
    const bookingId = booking._id ?? booking.id;

    const paidAmenities = (booking.selectedAmenities?.basic ?? []).filter(
        (a: any) => a.type === 'Paid',
    );
    const freeAmenities = (booking.selectedAmenities?.basic ?? []).filter(
        (a: any) => a.type !== 'Paid',
    );
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
    const handleStatusUpdate = useCallback(
        (status: string, title: string) => {
            Alert.alert(title, `Are you sure you want to ${title.toLowerCase()} this booking?`, [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes',
                    style: status === 'cancelled' ? 'destructive' : 'default',
                    onPress: () => {
                        // call your API here, e.g. bookingAPI.updateStatus(bookingId, status)
                        Alert.alert('Updated', `Booking marked as ${status}.`);
                        navigation.goBack();
                    },
                },
            ]);
        },
        [bookingId, navigation],
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
                    <Text style={styles.headerSub}>#{booking.bookingNumber}</Text>
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
                <Section icon="calendar-outline" title="Booking Details">
                    <InfoRow
                        icon="barcode-outline"
                        label="Booking Number"
                        value={booking.bookingNumber}
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
                        value={`${formatTimeStr(booking.startTime)} – ${formatTimeStr(
                            booking.endTime,
                        )}  (${calcHours(booking.startTime, booking.endTime)})`}
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
                            value={`${customerDetails.guestCount ?? '—'} guests`}
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
                                {uniqueFreeAmenities.map((a: any) => (
                                    <View key={a._id} style={styles.amenityChip}>
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
                        {paidAmenities.map((a: any) => (
                            <AmenityRow
                                key={a._id}
                                name={a.name}
                                type={a.type}
                                quantity={a.quantity}
                                total={a.total}
                            />
                        ))}
                    </Section>
                )}

                {/* ── Lunch Thalis ── */}
                {thalis.length > 0 && (
                    <Section icon="restaurant-outline" title="Lunch Thalis">
                        {thalis.map((t: any) => (
                            <View key={t._id} style={styles.thaliRow}>
                                <View style={styles.thaliLeft}>
                                    <Text style={styles.thaliName}>{t.thaliType}</Text>
                                    <Text style={styles.thaliCategory}>{t.category}</Text>
                                    {t.itemNames ? (
                                        <Text style={styles.thaliItems}>{t.itemNames}</Text>
                                    ) : null}
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
                        {beverages.map((b: any) => (
                            <AmenityRow
                                key={b._id}
                                name={b.name}
                                type="Paid"
                                quantity={b.quantity}
                                total={b.total}
                            />
                        ))}
                    </Section>
                )}

                {/* ── Refreshments ── */}
                {refreshments.length > 0 && (
                    <Section icon="fast-food-outline" title="Refreshments / Food">
                        {refreshments.map((r: any) => (
                            <AmenityRow
                                key={r._id}
                                name={r.name}
                                type="Paid"
                                quantity={r.quantity}
                                total={r.total}
                            />
                        ))}
                    </Section>
                )}

                {/* ── Additional ── */}
                {additional.length > 0 && (
                    <Section icon="add-circle-outline" title="Additional Items">
                        {additional.map((a: any) => (
                            <AmenityRow
                                key={a._id}
                                name={a.name}
                                type={a.type}
                                quantity={a.quantity}
                                total={a.total}
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
                        <PriceRow
                            label="Amenities Total"
                            value={formatCurrency(priceBreakdown.amenitiesTotal)}
                        />
                        <PriceRow
                            label="Subtotal"
                            value={formatCurrency(priceBreakdown.subtotal)}
                        />
                        {priceBreakdown.gstRate > 0 && (
                            <PriceRow
                                label={`GST (${priceBreakdown.gstRate}%)`}
                                value={formatCurrency(priceBreakdown.gst)}
                            />
                        )}
                        <PriceRow
                            label="Platform Fee"
                            value={formatCurrency(priceBreakdown.platformFee)}
                        />
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
                            value={`${booking.venue.location.address}, ${booking.venue.location.landmark}`}
                        />
                        <View style={styles.divider} />
                        <InfoRow
                            icon="business-outline"
                            label="Area / City"
                            value={`${booking.venue.location.area}, ${booking.venue.location.city}, ${booking.venue.location.state} – ${booking.venue.location.pincode}`}
                        />
                        <View style={styles.divider} />
                        <InfoRow
                            icon="car-outline"
                            label="Parking"
                            value={booking.venue.location.parkingAvailability ?? '—'}
                        />
                        <View style={styles.divider} />
                        <InfoRow
                            icon="bus-outline"
                            label="Nearest Bus / Auto"
                            value={booking.venue.location.nearestBusAuto ?? '—'}
                        />
                        <View style={styles.divider} />
                        <InfoRow
                            icon="train-outline"
                            label="Nearest Metro / Train"
                            value={booking.venue.location.nearestMetroTrain ?? '—'}
                        />
                    </Section>
                )}

                {/* ── Action Buttons (owner) ── */}
                {user?.role === 'owner' && booking.status === 'pending' && (
                    <View style={styles.actionsContainer}>
                        <View style={styles.actionsRow}>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.actionBtnConfirm]}
                                onPress={() => handleStatusUpdate('confirmed', 'Confirm')}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name="checkmark-circle-outline"
                                    size={18}
                                    color={Colors.white}
                                />
                                <Text style={styles.actionBtnText}>Confirm</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.actionBtnPending]}
                                onPress={() => handleStatusUpdate('confirmed', 'Confirm Soon')}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="time-outline" size={18} color={Colors.warning} />
                                <Text style={[styles.actionBtnText, { color: Colors.warning }]}>
                                    Confirm Soon
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnReject, styles.actionBtnFull]}
                            onPress={() => handleStatusUpdate('cancelled', 'Cancel Booking')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="close-circle-outline" size={18} color={Colors.danger} />
                            <Text style={[styles.actionBtnText, { color: Colors.danger }]}>
                                Cancel Booking
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── Action Buttons (client) ── */}
                {user?.role === 'customer' && booking.status === 'pending' && (
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnReject, styles.actionBtnFull]}
                            onPress={() => handleStatusUpdate('cancelled', 'Cancel Booking')}
                            activeOpacity={0.8}
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

    // Sticky header
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

    // Scroll
    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

    // Hero banner
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

    // Utility
    divider: { height: 1, backgroundColor: Colors.divider },

    // Notes
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

    // Free amenity grid
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

    // Thali row
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

    // Action buttons
    actionsContainer: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: Radii.lg,
        gap: 7,
    },
    actionBtnFull: {
        flex: 0, // override flex:1 so it spans full width naturally
    },
    actionBtnConfirm: { backgroundColor: Colors.success, ...Shadows.card },
    actionBtnPending: {
        backgroundColor: Colors.warningLight, // use your theme's warning tint
        borderWidth: 1.5,
        borderColor: Colors.warning,
    },
    actionBtnReject: {
        backgroundColor: Colors.dangerLight,
        borderWidth: 1.5,
        borderColor: '#FECACA',
    },
    actionBtnText: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.white,
        letterSpacing: Typography.normal,
    },
});

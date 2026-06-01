import React, { useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    Platform,
    Share,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '@/theme/theme';
import { Venue } from '@/features/venue/types/Venue';
import { SelectedAmenityItem } from '@/features/venue/models/BookingSheet';
import { PlatformSettings } from '@/features/booking/types/PlatformSettings';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuotationData {
    // Booking details
    bookingDate: string;         // 'YYYY-MM-DD'
    startTime: string;           // display format e.g. '10:00 AM'
    endTime: string;             // display format e.g. '02:00 PM'
    bookingType: 'hourly' | 'halfday' | 'fullday';
    durationLabel: string;       // e.g. '4h', 'Half Day'
    isWeekend: boolean;

    // Customer
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    eventType: string;
    guestCount: number;
    specialRequirements?: string;

    // Pricing
    basePrice: number;
    amenitiesTotal: number;
    subtotal: number;
    venueCGST: number;
    venueCGSTRate: number;
    venueSGST: number;
    venueSGSTRate: number;
    venueGSTTotal: number;
    platformFee: number;
    platformFeeLabel: string;
    platformCGST: number;
    platformCGSTRate: number;
    platformSGST: number;
    platformSGSTRate: number;
    platformFeeTotal: number;
    grandTotal: number;

    // Amenities
    paidAmenities: SelectedAmenityItem[];
    allAmenities: SelectedAmenityItem[];

    // Meta
    quotationNumber: string;
    generatedAt: Date;
    validUntil: Date;
}

interface QuotationModalProps {
    visible: boolean;
    venue: Venue;
    quotationData: QuotationData;
    platformSettings: PlatformSettings;
    onClose: () => void;
    onConfirmBooking: () => void;
    confirmLoading?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    '₹' + Math.round(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const fmtDec = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : new Date(d);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const bookingTypeLabel = (type: string) => {
    switch (type) {
        case 'hourly': return 'Hourly';
        case 'halfday': return 'Half Day (4 hrs)';
        case 'fullday': return 'Full Day (8 hrs)';
        default: return type;
    }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, badge }: { icon: string; title: string; badge?: string }) {
    return (
        <View style={sh.row}>
            <View style={sh.iconWrap}>
                <Ionicons name={icon as any} size={15} color={Colors.primary} />
            </View>
            <Text style={sh.title}>{title}</Text>
            {badge ? <View style={sh.badge}><Text style={sh.badgeText}>{badge}</Text></View> : null}
        </View>
    );
}
const sh = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    iconWrap: {
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: Colors.primaryDim,
        alignItems: 'center', justifyContent: 'center',
    },
    title: {
        flex: 1,
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
    },
    badge: {
        backgroundColor: Colors.primaryDim,
        borderRadius: Radii.full,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    badgeText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.primaryDark },
});

function InfoRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
    return (
        <View style={ir.row}>
            <Text style={ir.label}>{label}</Text>
            <Text style={[ir.value, muted && ir.valueMuted]} numberOfLines={2}>{value || '—'}</Text>
        </View>
    );
}
const ir = StyleSheet.create({
    row: { flexDirection: 'row', paddingVertical: 4, gap: 8 },
    label: {
        width: 90,
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    value: { flex: 1, fontSize: Typography.sm, color: Colors.charcoal, fontWeight: Typography.semiBold },
    valueMuted: { color: Colors.charcoalMid, fontWeight: Typography.regular },
});

function PriceRow({
    label, value, bold, highlight, danger, sub,
}: {
    label: string; value: string; bold?: boolean; highlight?: boolean; danger?: boolean; sub?: boolean;
}) {
    return (
        <View style={pr.row}>
            <Text style={[pr.label, bold && pr.bold, sub && pr.sub, danger && pr.danger]}>
                {label}
            </Text>
            <Text style={[pr.value, bold && pr.bold, highlight && pr.highlight, danger && pr.danger]}>
                {value}
            </Text>
        </View>
    );
}
const pr = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    label: { fontSize: Typography.sm, color: Colors.charcoalMid, fontWeight: Typography.medium, flex: 1 },
    value: { fontSize: Typography.sm, color: Colors.charcoal, fontWeight: Typography.semiBold },
    bold: { fontWeight: Typography.bold, color: Colors.charcoal },
    highlight: { color: Colors.primary },
    danger: { color: Colors.danger },
    sub: { fontSize: Typography.xs, color: Colors.charcoalLight },
});

function Divider() {
    return <View style={{ height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.sm }} />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuotationModal({
    visible,
    venue,
    quotationData: qd,
    platformSettings,
    onClose,
    onConfirmBooking,
    confirmLoading = false,
}: QuotationModalProps) {

    const handleShare = async () => {
        try {
            const text = [
                `📄 BOOKING QUOTATION — ${qd.quotationNumber}`,
                ``,
                `🏢 Venue: ${venue.businessName}`,
                `📍 ${venue.location?.city}, ${venue.location?.area}`,
                ``,
                `📅 Date: ${fmtDate(qd.bookingDate)}`,
                `⏰ Time: ${qd.startTime} – ${qd.endTime}`,
                `📋 Type: ${bookingTypeLabel(qd.bookingType)} (${qd.isWeekend ? 'Weekend' : 'Weekday'})`,
                ``,
                `👤 Customer: ${qd.customerName}`,
                `📞 Phone: ${qd.customerPhone}`,
                `✉️ Email: ${qd.customerEmail}`,
                `🎉 Event: ${qd.eventType} | Guests: ${qd.guestCount}`,
                ``,
                `── PRICE BREAKDOWN ──`,
                `Venue Rental: ${fmt(qd.basePrice)}`,
                qd.amenitiesTotal > 0 ? `Amenities: ${fmt(qd.amenitiesTotal)}` : null,
                `Subtotal: ${fmt(qd.subtotal)}`,
                qd.venueGSTTotal > 0 ? `Venue GST: ${fmtDec(qd.venueGSTTotal)}` : null,
                `Platform Fee: ${fmtDec(qd.platformFee)}`,
                qd.platformFeeTotal > qd.platformFee
                    ? `Platform Fee Total (incl. GST): ${fmtDec(qd.platformFeeTotal)}`
                    : null,
                ``,
                `💰 GRAND TOTAL: ${fmt(qd.grandTotal)}`,
                ``,
                `Valid until: ${fmtDate(qd.validUntil)}`,
                `Ref: ${qd.quotationNumber}`,
            ]
                .filter(Boolean)
                .join('\n');

            await Share.share({ message: text, title: `Quotation — ${qd.quotationNumber}` });
        } catch {
            // ignore
        }
    };

    // ── Amenity groups for display ────────────────────────────────────────────
    const amenityGroups = useMemo(() => {
        const included = qd.allAmenities.filter(a => a.category === 'basic_included');
        const paid = qd.paidAmenities;
        return { included, paid };
    }, [qd.allAmenities, qd.paidAmenities]);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={s.root}>

                {/* ── Modal header ── */}
                <View style={s.header}>
                    <View>
                        <Text style={s.headerTitle}>Booking Quotation</Text>
                        <Text style={s.headerSub}>{qd.quotationNumber}</Text>
                    </View>
                    <View style={s.headerActions}>
                        <TouchableOpacity style={s.headerBtn} onPress={handleShare} activeOpacity={0.8}>
                            <Ionicons name="share-outline" size={18} color={Colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={s.headerBtn} onPress={onClose} activeOpacity={0.8}>
                            <Ionicons name="close" size={18} color={Colors.charcoal} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={s.headerDivider} />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={s.scroll}
                >
                    {/* ── Draft badge + validity ── */}
                    <View style={s.metaStrip}>
                        <View style={s.draftBadge}>
                            <Ionicons name="document-text-outline" size={11} color={Colors.primaryDark} />
                            <Text style={s.draftBadgeText}>DRAFT QUOTATION</Text>
                        </View>
                        <Text style={s.validText}>Valid until {fmtDate(qd.validUntil)}</Text>
                    </View>

                    {/* ── Venue + Customer info ── */}
                    <View style={s.twoCardRow}>
                        {/* Venue card */}
                        <View style={[s.infoCard, s.infoCardBlue]}>
                            <SectionHeader icon="business-outline" title="Venue" />
                            <InfoRow label="Name" value={venue.businessName} />
                            <InfoRow label="Location" value={`${venue.location?.city}, ${venue.location?.area}`} />
                            <InfoRow label="Address" value={venue.location?.address} muted />
                            <InfoRow label="Capacity" value={String(venue.capacity)} />
                        </View>
                        {/* Customer card */}
                        <View style={[s.infoCard, s.infoCardGreen]}>
                            <SectionHeader icon="person-outline" title="Customer" />
                            <InfoRow label="Name" value={qd.customerName} />
                            <InfoRow label="Phone" value={qd.customerPhone} />
                            <InfoRow label="Email" value={qd.customerEmail} muted />
                            <InfoRow label="Event" value={qd.eventType} />
                            <InfoRow label="Guests" value={String(qd.guestCount)} />
                        </View>
                    </View>

                    {/* ── Booking details ── */}
                    <View style={s.section}>
                        <SectionHeader
                            icon="calendar-outline"
                            title="Booking Details"
                            badge={qd.isWeekend ? 'Weekend' : 'Weekday'}
                        />
                        <View style={s.bookingDetailGrid}>
                            {[
                                { icon: 'calendar-outline', label: 'Date', value: fmtDate(qd.bookingDate) },
                                { icon: 'time-outline', label: 'Time', value: `${qd.startTime} – ${qd.endTime}` },
                                { icon: 'hourglass-outline', label: 'Type', value: bookingTypeLabel(qd.bookingType) },
                                { icon: 'pricetag-outline', label: 'Rate', value: qd.isWeekend ? 'Weekend' : 'Weekday' },
                            ].map((item, i) => (
                                <View key={i} style={s.bookingDetailCell}>
                                    <View style={s.bookingDetailIcon}>
                                        <Ionicons name={item.icon as any} size={14} color={Colors.primary} />
                                    </View>
                                    <Text style={s.bookingDetailLabel}>{item.label}</Text>
                                    <Text style={s.bookingDetailValue}>{item.value}</Text>
                                </View>
                            ))}
                        </View>
                        {qd.specialRequirements ? (
                            <View style={s.specialReqBox}>
                                <Ionicons name="chatbubble-outline" size={13} color={Colors.primary} />
                                <Text style={s.specialReqText}>{qd.specialRequirements}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* ── Invoice 1: Venue ── */}
                    <View style={[s.invoiceSection, s.invoiceSectionBlue]}>
                        <View style={s.invoiceHeader}>
                            <View style={s.invoiceHeaderLeft}>
                                <Text style={s.invoiceLabel}>INVOICE 1</Text>
                                <Text style={s.invoiceTitle}>Venue Rental</Text>
                            </View>
                            <Text style={s.invoiceNumber}>{qd.quotationNumber}-V</Text>
                        </View>

                        {/* Base rental */}
                        <View style={s.lineItemRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.lineItemName}>Venue Rental — {venue.businessName}</Text>
                                <Text style={s.lineItemSub}>
                                    {fmtDate(qd.bookingDate)} · {qd.startTime} – {qd.endTime} · {bookingTypeLabel(qd.bookingType)}
                                </Text>
                            </View>
                            <Text style={s.lineItemAmount}>{fmt(qd.basePrice)}</Text>
                        </View>

                        {/* Amenities */}
                        {amenityGroups.included.length > 0 && (
                            <View style={s.amenityGroup}>
                                <Text style={s.amenityGroupTitle}>Included Amenities</Text>
                                {amenityGroups.included.map((a, i) => (
                                    <View key={i} style={s.amenityLineRow}>
                                        <View style={s.amenityDot} />
                                        <Text style={s.amenityLineName}>{a.name}</Text>
                                        <View style={s.freeTag}>
                                            <Text style={s.freeTagText}>Free</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {amenityGroups.paid.length > 0 && (
                            <View style={s.amenityGroup}>
                                <Text style={s.amenityGroupTitle}>Add-on Amenities & Services</Text>
                                {amenityGroups.paid.map((a, i) => (
                                    <View key={i} style={s.lineItemRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.amenityLineName}>{a.name}</Text>
                                            <Text style={s.lineItemSub}>
                                                {fmtDec(a.unitPrice)} × {a.qty} {a.rateType ? `(${a.rateType})` : ''}
                                            </Text>
                                        </View>
                                        <Text style={s.lineItemAmount}>{fmt(a.total)}</Text>
                                    </View>
                                ))}
                                <View style={s.amenitySubtotalRow}>
                                    <Text style={s.amenitySubtotalLabel}>Amenities Subtotal</Text>
                                    <Text style={s.amenitySubtotalValue}>{fmt(qd.amenitiesTotal)}</Text>
                                </View>
                            </View>
                        )}

                        <Divider />

                        {/* Venue totals */}
                        <View style={s.totalBox}>
                            <PriceRow
                                label="Subtotal (Rental + Amenities)"
                                value={fmt(qd.subtotal)}
                            />
                            {qd.venueCGSTRate > 0 && (
                                <PriceRow
                                    label={`CGST (${qd.venueCGSTRate}%)`}
                                    value={fmtDec(qd.venueCGST)}
                                    sub
                                />
                            )}
                            {qd.venueSGSTRate > 0 && (
                                <PriceRow
                                    label={`SGST (${qd.venueSGSTRate}%)`}
                                    value={fmtDec(qd.venueSGST)}
                                    sub
                                />
                            )}
                            <Divider />
                            <PriceRow
                                label="Venue Invoice Total"
                                value={fmtDec(qd.subtotal + qd.venueGSTTotal)}
                                bold
                                highlight
                            />
                        </View>
                    </View>

                    {/* ── Invoice 2: Platform ── */}
                    <View style={[s.invoiceSection, s.invoiceSectionPurple]}>
                        <View style={s.invoiceHeader}>
                            <View style={s.invoiceHeaderLeft}>
                                <Text style={[s.invoiceLabel, { color: Colors.info }]}>INVOICE 2</Text>
                                <Text style={s.invoiceTitle}>Platform Fee</Text>
                            </View>
                            <Text style={s.invoiceNumber}>{qd.quotationNumber}-P</Text>
                        </View>

                        <View style={s.lineItemRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.lineItemName}>Platform Service Fee</Text>
                                <Text style={s.lineItemSub}>
                                    Booking facilitation for {venue.businessName}
                                </Text>
                            </View>
                            <Text style={s.lineItemAmount}>{fmtDec(qd.platformFee)}</Text>
                        </View>

                        <Divider />

                        <View style={s.totalBox}>
                            <PriceRow label={qd.platformFeeLabel} value={fmtDec(qd.platformFee)} />
                            {qd.platformCGSTRate > 0 && (
                                <PriceRow
                                    label={`CGST (${qd.platformCGSTRate}%)`}
                                    value={fmtDec(qd.platformCGST)}
                                    sub
                                />
                            )}
                            {qd.platformSGSTRate > 0 && (
                                <PriceRow
                                    label={`SGST (${qd.platformSGSTRate}%)`}
                                    value={fmtDec(qd.platformSGST)}
                                    sub
                                />
                            )}
                            <Divider />
                            <PriceRow
                                label="Platform Invoice Total"
                                value={fmtDec(qd.platformFeeTotal)}
                                bold
                                highlight
                            />
                        </View>
                    </View>

                    {/* ── Grand Total ── */}
                    <View style={s.grandTotalCard}>
                        <View style={s.grandTotalBreakdown}>
                            <PriceRow
                                label="Venue Invoice Total"
                                value={fmtDec(qd.subtotal + qd.venueGSTTotal)}
                            />
                            <PriceRow
                                label="Platform Invoice Total"
                                value={fmtDec(qd.platformFeeTotal)}
                            />
                        </View>
                        <View style={s.grandTotalMain}>
                            <View>
                                <Text style={s.grandTotalLabel}>Grand Total</Text>
                                <Text style={s.grandTotalSub}>All inclusive</Text>
                            </View>
                            <Text style={s.grandTotalValue}>{fmt(qd.grandTotal)}</Text>
                        </View>
                    </View>

                    {/* ── Terms ── */}
                    <View style={s.section}>
                        <SectionHeader icon="document-text-outline" title="Terms & Conditions" />
                        {[
                            'This quotation is valid for 7 days from the date of issue.',
                            'Two separate invoices will be generated upon confirmation: Venue Invoice and Platform Invoice.',
                            'This is a booking request and not a confirmed booking. Final confirmation is subject to venue owner approval.',
                            'Payment to be made after venue owner confirmation through the RentalMeet platform.',
                            'Cancellation policy: Full refund if cancelled 48 hrs before, 50% if cancelled 24 hrs before, no refund for same-day cancellations.',
                            'Customer is responsible for any damages to the venue property during the event.',
                        ].map((t, i) => (
                            <View key={i} style={s.termRow}>
                                <View style={s.termBullet} />
                                <Text style={s.termText}>{t}</Text>
                            </View>
                        ))}
                    </View>

                    {/* ── Footer note ── */}
                    <View style={s.footerNote}>
                        <Text style={s.footerNoteText}>
                            Quotation Ref: {qd.quotationNumber} · Generated {fmtDate(qd.generatedAt)}
                        </Text>
                        <Text style={s.footerNoteText}>
                            RentalMeet · bookings@rentalmeet.com
                        </Text>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* ── Footer CTA ── */}
                <View style={s.footer}>
                    <TouchableOpacity style={s.footerBack} onPress={onClose} activeOpacity={0.8}>
                        <Ionicons name="arrow-back-outline" size={16} color={Colors.charcoalMid} />
                        <Text style={s.footerBackText}>Back to Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[s.footerConfirm, confirmLoading && s.footerConfirmDisabled]}
                        onPress={onConfirmBooking}
                        activeOpacity={0.85}
                        disabled={confirmLoading}
                    >
                        {confirmLoading ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={17} color={Colors.white} />
                                <Text style={s.footerConfirmText}>Confirm & Pay</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingTop: Platform.OS === 'ios' ? 20 : 20,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.4,
    },
    headerSub: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        marginTop: 2,
    },
    headerActions: { flexDirection: 'row', gap: 8 },
    headerBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: Colors.background,
        borderWidth: 1, borderColor: Colors.border,
        alignItems: 'center', justifyContent: 'center',
    },
    headerDivider: { height: 1, backgroundColor: Colors.divider },

    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

    // Meta strip
    metaStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.lg,
    },
    draftBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryDim,
        borderRadius: Radii.full,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    draftBadgeText: {
        fontSize: 10,
        fontWeight: Typography.extraBold,
        color: Colors.primaryDark,
        letterSpacing: 0.5,
    },
    validText: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },

    // Two-card row
    twoCardRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    infoCard: {
        flex: 1,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        borderWidth: 1.5,
        ...Shadows.card,
    },
    infoCardBlue: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
    infoCardGreen: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },

    // Section
    section: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.card,
    },

    // Booking detail grid
    bookingDetailGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    bookingDetailCell: {
        width: '47%',
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        padding: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 3,
    },
    bookingDetailIcon: {
        width: 24, height: 24, borderRadius: 7,
        backgroundColor: Colors.primaryDim,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 2,
    },
    bookingDetailLabel: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    bookingDetailValue: {
        fontSize: Typography.sm,
        color: Colors.charcoal,
        fontWeight: Typography.bold,
    },
    specialReqBox: {
        flexDirection: 'row',
        gap: 6,
        backgroundColor: Colors.primaryDim,
        borderRadius: Radii.md,
        padding: Spacing.sm,
        marginTop: Spacing.md,
        alignItems: 'flex-start',
    },
    specialReqText: {
        flex: 1,
        fontSize: Typography.sm,
        color: Colors.primaryDark,
        fontWeight: Typography.medium,
    },

    // Invoice sections
    invoiceSection: {
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        borderWidth: 2,
    },
    invoiceSectionBlue: { backgroundColor: '#EFF6FF', borderColor: '#93C5FD' },
    invoiceSectionPurple: { backgroundColor: '#FAF5FF', borderColor: '#C4B5FD' },
    invoiceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1.5,
        borderBottomColor: 'rgba(0,0,0,0.08)',
    },
    invoiceHeaderLeft: { gap: 2 },
    invoiceLabel: {
        fontSize: 9,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: 1,
    },
    invoiceTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    invoiceNumber: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        marginTop: 2,
    },

    // Line items
    lineItemRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingVertical: 6,
    },
    lineItemName: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    lineItemSub: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        marginTop: 2,
    },
    lineItemAmount: {
        fontSize: Typography.sm,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },

    // Amenities inside invoice
    amenityGroup: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: Radii.md,
        padding: Spacing.sm,
        marginTop: Spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    amenityGroupTitle: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    amenityLineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 3,
    },
    amenityDot: {
        width: 5, height: 5, borderRadius: 3,
        backgroundColor: Colors.primaryBorder,
    },
    amenityLineName: {
        flex: 1,
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    freeTag: {
        backgroundColor: Colors.successLight ?? '#DCFCE7',
        borderRadius: Radii.sm,
        paddingHorizontal: 6,
        paddingVertical: 1,
    },
    freeTagText: {
        fontSize: 9,
        fontWeight: Typography.bold,
        color: Colors.success,
    },
    amenitySubtotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: Spacing.sm,
        marginTop: Spacing.xs ?? 4,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
    },
    amenitySubtotalLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    amenitySubtotalValue: {
        fontSize: Typography.sm,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
    },

    // Total box inside invoice
    totalBox: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: Radii.md,
        padding: Spacing.md,
        marginTop: Spacing.sm,
    },

    // Grand total card
    grandTotalCard: {
        backgroundColor: Colors.primary,
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadows.primary,
    },
    grandTotalBreakdown: {
        marginBottom: Spacing.sm,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.25)',
        gap: 2,
    },
    grandTotalMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Spacing.sm,
    },
    grandTotalLabel: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: -0.3,
    },
    grandTotalSub: {
        fontSize: Typography.xs,
        color: 'rgba(255,255,255,0.75)',
        fontWeight: Typography.medium,
    },
    grandTotalValue: {
        fontSize: 28,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: -0.5,
    },

    // Terms
    termRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' },
    termBullet: {
        width: 5, height: 5, borderRadius: 3,
        backgroundColor: Colors.primary,
        marginTop: 6, flexShrink: 0,
    },
    termText: { flex: 1, fontSize: Typography.sm, color: Colors.charcoalMid, lineHeight: 18 },

    // Footer note
    footerNote: {
        alignItems: 'center',
        gap: 4,
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
    },
    footerNoteText: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        textAlign: 'center',
    },

    // Footer CTA
    footer: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.lg,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
        ...Shadows.floating,
    },
    footerBack: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.lg,
        height: 50,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    footerBackText: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    footerConfirm: {
        flex: 1,
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        borderRadius: Radii.full,
        backgroundColor: Colors.primary,
        ...Shadows.primary,
    },
    footerConfirmDisabled: { opacity: 0.5 },
    footerConfirmText: {
        fontSize: Typography.base,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.2,
    },

    // Grand total breakdown text overrides (on primary bg)
});

// Override PriceRow colors inside grand total — handled inline via props above
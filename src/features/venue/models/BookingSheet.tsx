import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radii, Shadows } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import { Venue } from '@/features/venue/types/Venue';

// ─── Types ────────────────────────────────────────────────────────────────────
export type SelectedAmenityItem = {
    name: string;
    category: 'basic_included' | 'basic_paid' | 'additional' | 'beverage' | 'refreshment' | 'thali';
    qty: number;
    unitPrice: number;
    total: number;
    rateType: string;
    thaliCategory?: string;
    numberOfItems?: number;
    itemNames?: string;
};

export type SheetDurationOption = {
    label: string;
    hours: number;
    price: number;
    type: 'perHour' | 'halfDay' | 'fullDay';
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function formatTime(t: string): string {
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export function isWeekend(dateStr: string): boolean {
    const d = new Date(dateStr);
    return d.getDay() === 0 || d.getDay() === 6;
}

function buildSheetDurations(
    pricing: NonNullable<Venue['pricing']>,
    wknd: boolean,
): SheetDurationOption[] {
    const opts: SheetDurationOption[] = [];

    const useEnabled = !!(
        pricing.enabledOptions?.perHour ||
        pricing.enabledOptions?.halfDay ||
        pricing.enabledOptions?.fullDay
    );

    if (!useEnabled || pricing.enabledOptions?.perHour) {
        const rate = wknd ? pricing.perHour?.weekend : pricing.perHour?.weekday;
        if (rate && rate > 0) {
            [1, 2, 4].forEach(h =>
                opts.push({ label: `${h}H`, hours: h, price: rate * h, type: 'perHour' }),
            );
        }
    }
    if (!useEnabled || pricing.enabledOptions?.halfDay) {
        const rate = wknd ? pricing.halfDay?.weekend : pricing.halfDay?.weekday;
        if (rate && rate > 0)
            opts.push({ label: 'Half Day', hours: 4, price: rate, type: 'halfDay' });
    }
    if (!useEnabled || pricing.enabledOptions?.fullDay) {
        const rate = wknd ? pricing.fullDay?.weekend : pricing.fullDay?.weekday;
        if (rate && rate > 0)
            opts.push({ label: 'Full Day', hours: 8, price: rate, type: 'fullDay' });
    }

    return opts;
}

// ─── Props ────────────────────────────────────────────────────────────────────
export type BookingSheetProps = {
    visible: boolean;
    venue: Venue;
    paidAmenities: SelectedAmenityItem[];
    amenitiesTotal: number;
    allAmenities: SelectedAmenityItem[];
    onClose: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function BookingSheet({
    visible,
    venue,
    paidAmenities,
    amenitiesTotal,
    allAmenities,
    onClose,
}: BookingSheetProps) {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // Safe pricing defaults
    const pricing = venue.pricing ?? {};
    const avail = venue.availability ?? {};

    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = [
        tomorrowDate.getFullYear(),
        String(tomorrowDate.getMonth() + 1).padStart(2, '0'),
        String(tomorrowDate.getDate()).padStart(2, '0'),
    ].join('-');

    const wknd = isWeekend(tomorrowStr);

    const durationOptions = useMemo(() => buildSheetDurations(pricing, wknd), [pricing, wknd]);

    const [durationIdx, setDurationIdx] = useState(0);
    const selected = durationOptions[durationIdx];
    const venueRental = selected?.price ?? 0;
    const estimatedSubtotal = venueRental + amenitiesTotal;

    const baseHourlyRate = wknd ? pricing.perHour?.weekend ?? 0 : pricing.perHour?.weekday ?? 0;

    const handleReserve = () => {
        if (!selected) return;
        onClose();
        navigation.navigate('venueBooking', {
            venue,
            selectedAmenities: allAmenities,
            amenitiesTotal,
            preselectedDurationHours: selected.hours,
            preselectedDurationType: selected.type,
        });
    };

    const openingTime = avail.openingTime ? formatTime(avail.openingTime) : '—';
    const closingTime = avail.closingTime ? formatTime(avail.closingTime) : '—';

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={s.overlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFillObject}
                    onPress={onClose}
                    activeOpacity={1}
                />
                <View style={s.container}>
                    {/* Handle */}
                    <View style={s.handle} />

                    {/* Header */}
                    <View style={s.header}>
                        <View>
                            <Text style={s.headerTitle}>Book This Venue</Text>
                            {baseHourlyRate > 0 && (
                                <View style={s.priceRow}>
                                    <Text style={s.startingFrom}>Starting from </Text>
                                    <Text style={s.price}>₹{baseHourlyRate.toLocaleString()}</Text>
                                    <Text style={s.perHour}>/hour</Text>
                                    {wknd && <Text style={s.weekendTag}> · Weekend</Text>}
                                </View>
                            )}
                        </View>
                        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                            <Ionicons name="close" size={20} color={Colors.charcoalMid} />
                        </TouchableOpacity>
                    </View>

                    <View style={s.divider} />

                    {/* Duration selector */}
                    <Text style={s.fieldLabel}>Select Duration</Text>
                    {durationOptions.length === 0 ? (
                        <Text style={s.noDurations}>
                            No pricing options configured for this venue.
                        </Text>
                    ) : (
                        <View style={s.durationRow}>
                            {durationOptions.map((d, i) => (
                                <TouchableOpacity
                                    key={`${d.label}-${i}`}
                                    style={[
                                        s.durationBtn,
                                        i === durationIdx && s.durationBtnActive,
                                    ]}
                                    onPress={() => setDurationIdx(i)}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            s.durationText,
                                            i === durationIdx && s.durationTextActive,
                                        ]}
                                    >
                                        {d.label}
                                    </Text>
                                    <Text
                                        style={[
                                            s.durationPrice,
                                            i === durationIdx && s.durationPriceActive,
                                        ]}
                                    >
                                        ₹{d.price.toLocaleString()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Summary */}
                    <View style={s.summaryBox}>
                        <View style={s.summaryRow}>
                            <Text style={s.summaryLabel}>Base Price</Text>
                            <Text style={s.summaryValue}>₹{venueRental.toLocaleString()}</Text>
                        </View>
                        {amenitiesTotal > 0 && (
                            <View style={[s.summaryRow, { marginTop: 6 }]}>
                                <Text style={s.summaryLabel}>
                                    Amenities ({paidAmenities.length} item
                                    {paidAmenities.length !== 1 ? 's' : ''})
                                </Text>
                                <Text style={s.summaryValue}>
                                    ₹{amenitiesTotal.toLocaleString()}
                                </Text>
                            </View>
                        )}
                        <View style={[s.summaryRow, { marginTop: 8 }]}>
                            <Text style={[s.summaryLabel, { fontWeight: Typography.bold }]}>
                                Subtotal (excl. taxes)
                            </Text>
                            <Text style={s.estimatedTotal}>
                                ₹{estimatedSubtotal.toLocaleString()}
                            </Text>
                        </View>
                        <Text style={s.taxNote}>* Platform fee & GST applied at checkout</Text>
                    </View>

                    {/* Reserve button */}
                    <TouchableOpacity
                        style={[s.reserveBtn, !selected && { opacity: 0.5 }]}
                        onPress={handleReserve}
                        disabled={!selected}
                        activeOpacity={0.85}
                    >
                        <Ionicons
                            name="calendar"
                            size={18}
                            color={Colors.white}
                            style={{ marginRight: 8 }}
                        />
                        <Text style={s.reserveText}>Reserve Now</Text>
                    </TouchableOpacity>

                    {/* Info strip */}
                    <View style={s.infoStrip}>
                        {[
                            { icon: 'time-outline', text: `${openingTime} – ${closingTime}` },
                            { icon: 'people-outline', text: `Capacity: ${venue.capacity ?? '—'}` },
                        ].map((info, i) => (
                            <View key={i} style={s.infoItem}>
                                <Ionicons
                                    name={info.icon as any}
                                    size={13}
                                    color={Colors.primary}
                                />
                                <Text style={s.infoText}>{info.text}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Share */}
                    <TouchableOpacity style={s.shareBtn} activeOpacity={0.8}>
                        <Ionicons name="share-social-outline" size={16} color={Colors.primary} />
                        <Text style={s.shareText}>Share Venue</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
    container: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
        paddingTop: Spacing.lg,
        ...Shadows.floating,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginBottom: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.lg,
    },
    headerTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 4 },
    startingFrom: { fontSize: Typography.sm, color: Colors.charcoalLight },
    price: { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: Colors.primary },
    perHour: { fontSize: Typography.sm, color: Colors.charcoalLight },
    weekendTag: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semiBold },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: { height: 1, backgroundColor: Colors.divider, marginBottom: Spacing.lg },
    fieldLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.3,
        marginBottom: Spacing.sm,
    },
    noDurations: { fontSize: Typography.sm, color: Colors.charcoalLight, marginBottom: Spacing.lg },
    durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.lg },
    durationBtn: {
        flex: 1,
        minWidth: 70,
        paddingVertical: 10,
        paddingHorizontal: 6,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: 'center',
        backgroundColor: Colors.background,
        gap: 2,
    },
    durationBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    durationText: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
    },
    durationTextActive: { color: Colors.white },
    durationPrice: { fontSize: 10, fontWeight: Typography.semiBold, color: Colors.charcoalLight },
    durationPriceActive: { color: Colors.white },
    summaryBox: {
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    summaryValue: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    estimatedTotal: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
    },
    taxNote: { fontSize: 10, color: Colors.charcoalLight, marginTop: 6, fontStyle: 'italic' },
    reserveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        paddingVertical: 15,
        marginBottom: Spacing.lg,
        ...Shadows.primary,
    },
    reserveText: { fontSize: Typography.lg, fontWeight: Typography.extraBold, color: Colors.white },
    infoStrip: { gap: 6, marginBottom: Spacing.lg },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        borderRadius: Radii.full,
        paddingVertical: 12,
        gap: 6,
    },
    shareText: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.primary,
    },
});

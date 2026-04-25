import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StatusBar,
    Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';
import { Colors, Typography, Spacing, Radii, Shadows } from '@/theme/theme';
import { useModifyingBooking } from '../hooks/useModifyingBooking';
import { ApiError } from '@/types/ApiError';
import { ModifyBookingPayload } from '../types/Booking';
import { useAlert } from '@/context/AlertContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModifyBookingScreenProps = NativeStackScreenProps<RootStackParamList, 'modifyBooking'>;

type BookingType = 'hourly' | 'halfday' | 'fullday';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BOOKING_TYPE_OPTIONS: { value: BookingType; label: string; icon: string }[] = [
    { value: 'hourly', label: 'Per Hour', icon: 'time-outline' },
    { value: 'halfday', label: 'Half Day', icon: 'partly-sunny-outline' },
    { value: 'fullday', label: 'Full Day', icon: 'sunny-outline' },
];

const formatDisplayDate = (d: Date) =>
    d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

/** Convert "HH:MM" 24-h or "HH:MM AM/PM" to a Date object (today's date, only time matters) */
const timeStrToDate = (t: string): Date => {
    const base = new Date();
    if (!t || !/^\d{1,2}:\d{2}/.test(t)) {
        base.setHours(9, 0, 0, 0);
        return base;
    }
    if (/[AaPp][Mm]/.test(t)) {
        const [timePart, period] = t.trim().split(/\s+/);
        const [h, m] = timePart.split(':').map(Number);
        let hours = h % 12;
        if (/[Pp][Mm]/i.test(period)) hours += 12;
        base.setHours(hours, m, 0, 0);
    } else {
        const [h, m] = t.split(':').map(Number);
        base.setHours(h, m, 0, 0);
    }
    return base;
};

/** Format a Date to "HH:MM" (24-h) for API submission */
const dateToTimeStr = (d: Date): string => {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
};

/** Format a Date to "HH:MM AM/PM" for display */
const dateToDisplayTime = (d: Date): string => {
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m} ${period}`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormLabel({ label, required }: { label: string; required?: boolean }) {
    return (
        <Text style={formStyles.label}>
            {label}
            {required && <Text style={formStyles.required}> *</Text>}
        </Text>
    );
}

function FieldCard({ children }: { children: React.ReactNode }) {
    return <View style={formStyles.fieldCard}>{children}</View>;
}

const formStyles = StyleSheet.create({
    label: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: Typography.wide,
        textTransform: 'uppercase',
        marginBottom: Spacing.xs,
    },
    required: { color: Colors.danger },
    fieldCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        borderWidth: 1.5,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ModifyBookingScreen({ route, navigation }: ModifyBookingScreenProps) {
    const { bookingId, booking: initialBooking } = route.params;
    const { mutate: modifyBooking } = useModifyingBooking();
    const alert = useAlert();

    // ── Form state — initialised from existing booking ──────────────────────
    const [bookingDate, setBookingDate] = useState<Date>(
        initialBooking?.bookingDate ? new Date(initialBooking.bookingDate) : new Date(),
    );
    const [startTime, setStartTime] = useState<Date>(
        timeStrToDate(initialBooking?.startTime ?? '09:00'),
    );
    // Add this near the top of the component, before your useState calls:
    const venueObj = typeof initialBooking?.venue === 'object' ? initialBooking.venue : null;
    const [endTime, setEndTime] = useState<Date>(
        timeStrToDate(
            // "Closing" is not a real time — default to closing time from venue or 18:00
            /^\d{1,2}:\d{2}/.test(initialBooking?.endTime ?? '')
                ? initialBooking.endTime
                : venueObj?.availability?.closingTime ?? '18:00',
        ),
    );
    const [bookingType, setBookingType] = useState<BookingType>(
        initialBooking?.bookingType ?? 'hourly',
    );
    const [guestCount, setGuestCount] = useState<string>(
        String(initialBooking?.customerDetails?.guestCount ?? ''),
    );
    const [eventType, setEventType] = useState<string>(
        initialBooking?.customerDetails?.eventType ?? '',
    );
    const [specialRequirements, setSpecialRequirements] = useState<string>(
        initialBooking?.customerDetails?.specialRequirements ?? '',
    );

    // ── Date / time picker visibility ────────────────────────────────────────
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const onDateChange = useCallback((_: DateTimePickerEvent, selected?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selected) setBookingDate(selected);
    }, []);

    const onStartChange = useCallback((_: DateTimePickerEvent, selected?: Date) => {
        setShowStartPicker(Platform.OS === 'ios');
        if (selected) setStartTime(selected);
    }, []);

    const onEndChange = useCallback((_: DateTimePickerEvent, selected?: Date) => {
        setShowEndPicker(Platform.OS === 'ios');
        if (selected) setEndTime(selected);
    }, []);

    const handleSubmit = () => {
        // Basic validation
        if (bookingType === 'hourly' && endTime <= startTime) {
            alert.error('Invalid Time', 'End time must be after start time.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            bookingDate, // always a Date (from useState)
            startTime: dateToTimeStr(startTime),
            endTime:
                bookingType === 'fullday'
                    ? venueObj?.availability?.closingTime ?? dateToTimeStr(endTime)
                    : dateToTimeStr(endTime),
            bookingType,
            selectedAmenities: initialBooking?.selectedAmenities,
            amenitiesTotal: initialBooking?.amenitiesTotal,
            priceBreakdown: initialBooking?.priceBreakdown,
            amount: initialBooking?.amount,
            customerDetails: {
                ...initialBooking?.customerDetails,
                guestCount: guestCount
                    ? Number(guestCount)
                    : initialBooking?.customerDetails?.guestCount,
                eventType: eventType || initialBooking?.customerDetails?.eventType,
                specialRequirements,
            },
        } as ModifyBookingPayload; // ← cast here, not Partial<>

        modifyBooking(
            { id: bookingId, payload },
            {
                onSuccess: () => {
                    setIsSubmitting(false);
                    alert.success('Updated', 'Booking modified successfully.');
                    navigation.goBack();
                },
                onError: (error: ApiError) => {
                    setIsSubmitting(false);
                    alert.error('Failed', error?.message || 'Something went wrong.');
                },
            },
        );
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <View style={styles.root}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.75}
                >
                    <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Modify Booking</Text>
                    <Text style={styles.headerSub}>
                        #{initialBooking?.bookingNumber ?? bookingId}
                    </Text>
                </View>
                {/* Save button in header for quick access */}
                <TouchableOpacity
                    style={[styles.saveHeaderBtn, isSubmitting && { opacity: 0.5 }]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                >
                    <Text style={styles.saveHeaderBtnText}>
                        {isSubmitting ? 'Saving…' : 'Save'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Info Banner ── */}
                <View style={styles.infoBanner}>
                    <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
                    <Text style={styles.infoBannerText}>
                        Changes will update the booking date, time, type, and guest details. Pricing
                        is recalculated automatically.
                    </Text>
                </View>

                {/* ── Booking Date ── */}
                <View style={styles.fieldGroup}>
                    <FormLabel label="Booking Date" required />
                    <FieldCard>
                        <TouchableOpacity
                            style={styles.pickerRow}
                            onPress={() => setShowDatePicker(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                            <Text style={styles.pickerText}>{formatDisplayDate(bookingDate)}</Text>
                            <Ionicons
                                name="chevron-down-outline"
                                size={16}
                                color={Colors.charcoalLight}
                            />
                        </TouchableOpacity>
                    </FieldCard>
                    {showDatePicker && (
                        <DateTimePicker
                            value={bookingDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            minimumDate={new Date()}
                            onChange={onDateChange}
                        />
                    )}
                </View>

                {/* ── Booking Type ── */}
                <View style={styles.fieldGroup}>
                    <FormLabel label="Booking Type" required />
                    <View style={styles.typeRow}>
                        {BOOKING_TYPE_OPTIONS.map(opt => {
                            const isActive = bookingType === opt.value;
                            return (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[styles.typeChip, isActive && styles.typeChipActive]}
                                    onPress={() => setBookingType(opt.value)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name={opt.icon as any}
                                        size={16}
                                        color={isActive ? Colors.white : Colors.charcoalMid}
                                    />
                                    <Text
                                        style={[
                                            styles.typeChipText,
                                            isActive && styles.typeChipTextActive,
                                        ]}
                                    >
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* ── Time Slot (hidden for fullday) ── */}
                {bookingType !== 'fullday' && (
                    <View style={styles.fieldGroup}>
                        <FormLabel label="Time Slot" required />
                        <View style={styles.timeRow}>
                            {/* Start Time */}
                            <View style={{ flex: 1 }}>
                                <Text style={styles.timeSubLabel}>Start</Text>
                                <FieldCard>
                                    <TouchableOpacity
                                        style={styles.pickerRow}
                                        onPress={() => setShowStartPicker(true)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons
                                            name="time-outline"
                                            size={18}
                                            color={Colors.primary}
                                        />
                                        <Text style={styles.pickerText}>
                                            {dateToDisplayTime(startTime)}
                                        </Text>
                                    </TouchableOpacity>
                                </FieldCard>
                                {showStartPicker && (
                                    <DateTimePicker
                                        value={startTime}
                                        mode="time"
                                        is24Hour={false}
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={onStartChange}
                                    />
                                )}
                            </View>

                            <View style={styles.timeSeparator}>
                                <Text style={styles.timeSeparatorText}>–</Text>
                            </View>

                            {/* End Time */}
                            <View style={{ flex: 1 }}>
                                <Text style={styles.timeSubLabel}>End</Text>
                                <FieldCard>
                                    <TouchableOpacity
                                        style={styles.pickerRow}
                                        onPress={() => setShowEndPicker(true)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons
                                            name="time-outline"
                                            size={18}
                                            color={Colors.primary}
                                        />
                                        <Text style={styles.pickerText}>
                                            {dateToDisplayTime(endTime)}
                                        </Text>
                                    </TouchableOpacity>
                                </FieldCard>
                                {showEndPicker && (
                                    <DateTimePicker
                                        value={endTime}
                                        mode="time"
                                        is24Hour={false}
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={onEndChange}
                                    />
                                )}
                            </View>
                        </View>
                    </View>
                )}

                {/* fullday time summary */}
                {bookingType === 'fullday' && venueObj?.availability && (
                    <View style={styles.fulldayInfo}>
                        <Ionicons name="sunny-outline" size={14} color={Colors.primary} />
                        <Text style={styles.fulldayInfoText}>
                            Full day: {venueObj.availability.openingTime ?? '—'} –{' '}
                            {venueObj.availability.closingTime ?? '—'}
                        </Text>
                    </View>
                )}

                {/* ── Customer Details ── */}
                <View style={styles.sectionDivider}>
                    <Text style={styles.sectionDividerText}>Guest Details</Text>
                </View>

                <View style={styles.fieldGroup}>
                    <FormLabel label="Event Type" />
                    <FieldCard>
                        <TextInput
                            style={styles.textInput}
                            value={eventType}
                            onChangeText={setEventType}
                            placeholder="e.g. Meeting, Birthday, Conference"
                            placeholderTextColor={Colors.charcoalLight}
                        />
                    </FieldCard>
                </View>

                <View style={styles.fieldGroup}>
                    <FormLabel label="Guest Count" />
                    <FieldCard>
                        <TextInput
                            style={styles.textInput}
                            value={guestCount}
                            onChangeText={text => setGuestCount(text.replace(/[^0-9]/g, ''))}
                            placeholder="Number of guests"
                            placeholderTextColor={Colors.charcoalLight}
                            keyboardType="number-pad"
                        />
                    </FieldCard>
                </View>

                <View style={styles.fieldGroup}>
                    <FormLabel label="Special Requirements" />
                    <FieldCard>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={specialRequirements}
                            onChangeText={setSpecialRequirements}
                            placeholder="Any special requests or notes…"
                            placeholderTextColor={Colors.charcoalLight}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </FieldCard>
                </View>

                {/* ── Existing Price Summary (read-only) ── */}
                {initialBooking?.priceBreakdown && (
                    <>
                        <View style={styles.sectionDivider}>
                            <Text style={styles.sectionDividerText}>Current Pricing</Text>
                        </View>
                        <View style={styles.priceSummaryCard}>
                            <View style={styles.priceSummaryRow}>
                                <Text style={styles.priceSummaryLabel}>Base Price</Text>
                                <Text style={styles.priceSummaryValue}>
                                    ₹
                                    {Number(
                                        initialBooking.priceBreakdown.basePrice ?? 0,
                                    ).toLocaleString('en-IN')}
                                </Text>
                            </View>
                            {(initialBooking.priceBreakdown.amenitiesTotal ?? 0) > 0 && (
                                <View style={styles.priceSummaryRow}>
                                    <Text style={styles.priceSummaryLabel}>Amenities</Text>
                                    <Text style={styles.priceSummaryValue}>
                                        ₹
                                        {Number(
                                            initialBooking.priceBreakdown.amenitiesTotal,
                                        ).toLocaleString('en-IN')}
                                    </Text>
                                </View>
                            )}
                            <View style={[styles.priceSummaryRow, styles.priceSummaryTotal]}>
                                <Text style={styles.priceSummaryTotalLabel}>Total</Text>
                                <Text style={styles.priceSummaryTotalValue}>
                                    ₹
                                    {Number(
                                        initialBooking.priceBreakdown.total ??
                                            initialBooking.amount,
                                    ).toLocaleString('en-IN')}
                                </Text>
                            </View>
                            <Text style={styles.priceSummaryNote}>
                                * Final amount may change based on new date/time/type.
                            </Text>
                        </View>
                    </>
                )}

                {/* ── Submit Button ── */}
                <TouchableOpacity
                    style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                >
                    {isSubmitting ? (
                        <>
                            <Ionicons name="reload-outline" size={20} color={Colors.white} />
                            <Text style={styles.submitBtnText}>Saving Changes…</Text>
                        </>
                    ) : (
                        <>
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={20}
                                color={Colors.white}
                            />
                            <Text style={styles.submitBtnText}>Save Changes</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 48 }} />
            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },

    header: {
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
    saveHeaderBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.lg,
        paddingVertical: 8,
        borderRadius: Radii.full,
    },
    saveHeaderBtnText: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.white,
    },

    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
    },
    infoBannerText: {
        flex: 1,
        fontSize: Typography.sm,
        color: Colors.primaryDark,
        fontWeight: Typography.medium,
        lineHeight: 18,
    },

    fieldGroup: { marginBottom: Spacing.lg },

    pickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
    },
    pickerText: {
        flex: 1,
        fontSize: Typography.md,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },

    typeRow: { flexDirection: 'row', gap: Spacing.sm },
    typeChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: Radii.lg,
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    typeChipText: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
    },
    typeChipTextActive: { color: Colors.white },

    timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
    timeSubLabel: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: Typography.wide,
        textTransform: 'uppercase',
        marginBottom: Spacing.xs,
    },
    timeSeparator: { paddingBottom: 14, alignItems: 'center' },
    timeSeparatorText: {
        fontSize: Typography.xl,
        color: Colors.charcoalLight,
        fontWeight: Typography.bold,
    },

    fulldayInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        marginTop: -Spacing.sm,
        marginBottom: Spacing.lg,
    },
    fulldayInfoText: {
        fontSize: Typography.sm,
        color: Colors.primaryDark,
        fontWeight: Typography.medium,
    },

    sectionDivider: {
        marginBottom: Spacing.md,
        marginTop: Spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
        paddingBottom: Spacing.xs,
    },
    sectionDividerText: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: Typography.wider,
        textTransform: 'uppercase',
    },

    textInput: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 13,
        fontSize: Typography.md,
        color: Colors.charcoal,
        fontWeight: Typography.medium,
    },
    textArea: {
        minHeight: 90,
        paddingTop: Spacing.md,
    },

    priceSummaryCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadows.card,
    },
    priceSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    priceSummaryLabel: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    priceSummaryValue: {
        fontSize: Typography.base,
        color: Colors.charcoal,
        fontWeight: Typography.semiBold,
    },
    priceSummaryTotal: {
        borderBottomWidth: 0,
        marginTop: Spacing.xs,
    },
    priceSummaryTotalLabel: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
    priceSummaryTotalValue: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
    },
    priceSummaryNote: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        marginTop: Spacing.sm,
        fontStyle: 'italic',
    },

    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.primary,
        borderRadius: Radii.lg,
        paddingVertical: 16,
        marginTop: Spacing.sm,
        ...Shadows.card,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.white,
        letterSpacing: Typography.normal,
    },
});

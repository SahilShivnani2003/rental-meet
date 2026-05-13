import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radii, Typography } from '@/theme/theme';
import { VendorService } from '@features/otherService/types/VendorService';

// ─── Types ──────────────────────────────────────────────────────────────────

type Props = {
    data: Partial<VendorService>;
    onChange: (key: keyof VendorService, value: any) => void;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
] as const;
const DAY_SHORT: Record<string, string> = {
    Monday: 'Mon',
    Tuesday: 'Tue',
    Wednesday: 'Wed',
    Thursday: 'Thu',
    Friday: 'Fri',
    Saturday: 'Sat',
    Sunday: 'Sun',
};

const ADVANCE_OPTIONS = [
    { value: 'same-day', label: 'Same day allowed', icon: 'flash-outline' },
    { value: '24h', label: '24 hours minimum', icon: 'time-outline' },
    { value: '48h', label: '48 hours minimum', icon: 'hourglass-outline' },
    { value: '1week', label: '1 week minimum', icon: 'calendar-outline' },
    { value: 'custom', label: 'Custom', icon: 'create-outline' },
] as const;

const CONFIRM_TIMES = [
    { value: '1h', label: '1 Hr' },
    { value: '2h', label: '2 Hrs' },
    { value: '3h', label: '3 Hrs' },
] as const;

const AGREEMENT_SECTIONS = [
    {
        title: '1. Platform Fee & Payouts',
        points: [
            'I/We agree to pay RentalMeet platform fee as per the applicable policy on all confirmed bookings made through the platform.',
            'Platform fee will be deducted before payout. Payouts for services booked through the platform will follow standard billing cycles as communicated by RentalMeet.',
        ],
    },
    {
        title: '2. Information Accuracy',
        points: [
            'I confirm that all information provided during registration — including business details, portfolio, pricing, documents, and bank details — is accurate, truthful, and up to date.',
        ],
    },
    {
        title: '3. Quality Standards',
        points: [
            'I will maintain quality standards as represented in my portfolio and service listing.',
            'I will respond to booking inquiries within 2 hours during working hours.',
        ],
    },
    {
        title: '4. Booking Obligations',
        points: [
            'I will honor all confirmed bookings and provide services exactly as promised.',
            'I agree to receive booking notifications via Email, SMS, and WhatsApp.',
            'I understand that RentalMeet acts as a platform for lead generation and booking facilitation.',
        ],
    },
];

const WHAT_NEXT = [
    {
        step: 1,
        label: 'Application Received',
        time: 'Immediately',
        icon: 'checkmark-circle-outline',
    },
    { step: 2, label: 'Application Review', time: '24–48 hours', icon: 'document-text-outline' },
    {
        step: 3,
        label: 'Document Verification',
        time: '24–48 hours',
        icon: 'shield-checkmark-outline',
    },
    { step: 4, label: 'Vendor Approval', time: '3–5 business days', icon: 'ribbon-outline' },
    { step: 5, label: 'Profile Goes Live', time: '3–5 business days', icon: 'globe-outline' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Animated checkbox */
function Checkbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
    const scale = useRef(new Animated.Value(checked ? 1 : 0)).current;

    React.useEffect(() => {
        Animated.spring(scale, {
            toValue: checked ? 1 : 0,
            useNativeDriver: true,
            damping: 14,
            stiffness: 200,
        }).start();
    }, [checked]);

    return (
        <TouchableOpacity
            style={[cb.outer, checked && cb.outerActive]}
            onPress={onToggle}
            activeOpacity={0.7}
        >
            <Animated.View style={{ transform: [{ scale }] }}>
                <Ionicons name="checkmark" size={11} color="#fff" />
            </Animated.View>
        </TouchableOpacity>
    );
}

/** Single availability row */
function DayRow({
    avail,
    onToggle,
    onTimeChange,
}: {
    avail: { day: string; isAvailable: boolean; startTime: string; endTime: string };
    onToggle: (val: boolean) => void;
    onTimeChange: (field: 'startTime' | 'endTime', val: string) => void;
}) {
    return (
        <View style={[dr.row, !avail.isAvailable && dr.rowOff]}>
            {/* Day chip */}
            <View style={dr.dayChip}>
                <Text style={[dr.dayText, !avail.isAvailable && dr.dayTextOff]}>
                    {DAY_SHORT[avail.day] ?? avail.day}
                </Text>
            </View>

            {/* Yes / No toggle pill */}
            <View style={dr.togglePill}>
                {(['Yes', 'No'] as const).map(opt => {
                    const active = avail.isAvailable === (opt === 'Yes');
                    return (
                        <TouchableOpacity
                            key={opt}
                            style={[dr.toggleOpt, active && dr.toggleOptActive]}
                            onPress={() => onToggle(opt === 'Yes')}
                            activeOpacity={0.75}
                        >
                            <Text style={[dr.toggleText, active && dr.toggleTextActive]}>
                                {opt}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Time inputs */}
            {avail.isAvailable ? (
                <View style={dr.timeWrap}>
                    <TextInput
                        style={dr.timeInput}
                        value={avail.startTime}
                        onChangeText={v => onTimeChange('startTime', v)}
                        placeholder="09:00"
                        placeholderTextColor={Colors.charcoalLight}
                        textAlign="center"
                    />
                    <Text style={dr.timeSep}>–</Text>
                    <TextInput
                        style={dr.timeInput}
                        value={avail.endTime}
                        onChangeText={v => onTimeChange('endTime', v)}
                        placeholder="18:00"
                        placeholderTextColor={Colors.charcoalLight}
                        textAlign="center"
                    />
                </View>
            ) : (
                <View style={dr.timeWrap}>
                    <Text style={dr.unavailText}>Not available</Text>
                </View>
            )}
        </View>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Step8Availability({ data, onChange }: Props) {
    const availability = data.availability?.length
        ? data.availability
        : DAYS.map(day => ({ day, isAvailable: true, startTime: '09:00', endTime: '18:00' }));

    const publicHoliday = data.publicHoliday || { isAvailable: false };
    const advanceBooking = (data as any).advanceBooking || '';
    const customDays = (data as any).customAdvanceDays;
    const confirmTime = (data as any).confirmationTime || '3h';
    const termsAccepted = data.termsAccepted || false;

    const updateDay = (idx: number, field: string, value: any) => {
        const updated = availability.map((a, i) => (i === idx ? { ...a, [field]: value } : a));
        onChange('availability', updated);
    };

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.container}
            keyboardShouldPersistTaps="handled"
        >
            {/* ── SECTION: Service Availability ────────────────────────── */}
            <View style={s.sectionHeader}>
                <View style={[s.sectionIconWrap, { backgroundColor: BRAND }]}>
                    <Ionicons name="calendar-outline" size={16} color="#fff" />
                </View>
                <View>
                    <Text style={s.sectionTitle}>Service Availability</Text>
                    <Text style={s.sectionSub}>Set your working days and hours</Text>
                </View>
            </View>

            <View style={s.availCard}>
                {availability.map((avail, idx) => (
                    <DayRow
                        key={avail.day ?? idx}
                        avail={avail as any}
                        onToggle={val => updateDay(idx, 'isAvailable', val)}
                        onTimeChange={(field, val) => updateDay(idx, field, val)}
                    />
                ))}
            </View>

            {/* ── Public Holidays ────────────────────────────────────────── */}
            <View style={s.holidayCard}>
                <View style={s.holidayLeft}>
                    <Ionicons name="sunny-outline" size={18} color={BRAND} />
                    <Text style={s.holidayLabel}>Public Holidays</Text>
                </View>
                <View style={dr.togglePill}>
                    {(['Yes', 'No'] as const).map(opt => {
                        const active = publicHoliday.isAvailable === (opt === 'Yes');
                        return (
                            <TouchableOpacity
                                key={opt}
                                style={[dr.toggleOpt, active && dr.toggleOptActive]}
                                onPress={() =>
                                    onChange('publicHoliday', {
                                        ...publicHoliday,
                                        isAvailable: opt === 'Yes',
                                    })
                                }
                                activeOpacity={0.75}
                            >
                                <Text style={[dr.toggleText, active && dr.toggleTextActive]}>
                                    {opt}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* ── SECTION: Advance Booking ──────────────────────────────── */}
            <View style={[s.sectionHeader, { marginTop: Spacing.xl }]}>
                <View style={[s.sectionIconWrap, { backgroundColor: BRAND }]}>
                    <Ionicons name="time-outline" size={16} color="#fff" />
                </View>
                <View>
                    <Text style={s.sectionTitle}>Advance Booking Required</Text>
                    <Text style={s.sectionSub}>Minimum notice before a booking</Text>
                </View>
            </View>

            <View style={s.optionList}>
                {ADVANCE_OPTIONS.map(opt => {
                    const active = advanceBooking === opt.value;
                    return (
                        <TouchableOpacity
                            key={opt.value}
                            style={[s.optionRow, active && s.optionRowActive]}
                            onPress={() => onChange('advanceBooking' as any, opt.value)}
                            activeOpacity={0.75}
                        >
                            <View style={[s.optionIconWrap, active && s.optionIconWrapActive]}>
                                <Ionicons
                                    name={opt.icon}
                                    size={16}
                                    color={active ? BRAND : Colors.charcoalLight}
                                />
                            </View>
                            <Text style={[s.optionLabel, active && s.optionLabelActive]}>
                                {opt.label}
                            </Text>
                            <View style={[s.radioOuter, active && s.radioOuterActive]}>
                                {active && <View style={s.radioInner} />}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Custom days input */}
            {advanceBooking === 'custom' && (
                <View style={s.customWrap}>
                    <Ionicons
                        name="create-outline"
                        size={16}
                        color={Colors.charcoalLight}
                        style={{ marginRight: 8 }}
                    />
                    <TextInput
                        style={s.customInput}
                        placeholder="Enter number of days"
                        placeholderTextColor={Colors.charcoalLight}
                        keyboardType="numeric"
                        value={customDays?.toString() || ''}
                        onChangeText={v => onChange('customAdvanceDays' as any, parseInt(v) || 0)}
                    />
                    <Text style={s.customUnit}>days</Text>
                </View>
            )}

            {/* ── SECTION: Max Confirmation Time ───────────────────────── */}
            <View style={s.confirmWrap}>
                <View style={s.confirmLabelRow}>
                    <Text style={s.confirmTitle}>Maximum time to confirm a booking request</Text>
                    <View style={s.confirmBadge}>
                        <Text style={s.confirmBadgeText}>max 3 hours</Text>
                    </View>
                </View>

                <View style={s.confirmToggleRow}>
                    {CONFIRM_TIMES.map(ct => {
                        const active = confirmTime === ct.value;
                        return (
                            <TouchableOpacity
                                key={ct.value}
                                style={[s.confirmBtn, active && s.confirmBtnActive]}
                                onPress={() => onChange('confirmationTime' as any, ct.value)}
                                activeOpacity={0.75}
                            >
                                <Text style={[s.confirmBtnText, active && s.confirmBtnTextActive]}>
                                    {ct.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={s.confirmHint}>
                    <Ionicons name="information-circle-outline" size={13} color={BRAND} />
                    <Text style={s.confirmHintText}>
                        Default: 3 hours. Customers will see this on your service page.
                    </Text>
                </View>
            </View>

            {/* ── SECTION: Terms & Conditions ──────────────────────────── */}
            <View style={tc.box}>
                <View style={tc.headerRow}>
                    <Ionicons name="document-text-outline" size={18} color={BRAND} />
                    <Text style={tc.headerText}>Terms & Conditions</Text>
                </View>

                {/* Scrollable agreement content */}
                <ScrollView
                    style={tc.scrollArea}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    indicatorStyle="black"
                >
                    <Text style={tc.agreementTitle}>RentalMeet Vendor Service Agreement</Text>
                    {AGREEMENT_SECTIONS.map((sec, si) => (
                        <View key={si} style={{ marginBottom: 10 }}>
                            <Text style={tc.secTitle}>{sec.title}</Text>
                            {sec.points.map((pt, pi) => (
                                <View key={pi} style={tc.pointRow}>
                                    <Text style={tc.bullet}>•</Text>
                                    <Text style={tc.pointText}>{pt}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </ScrollView>

                {/* Single declaration checkbox */}
                <TouchableOpacity
                    style={tc.declarationRow}
                    onPress={() => onChange('termsAccepted', !termsAccepted)}
                    activeOpacity={0.8}
                >
                    <Checkbox
                        checked={termsAccepted}
                        onToggle={() => onChange('termsAccepted', !termsAccepted)}
                    />
                    <Text style={tc.declarationText}>
                        I declare that all information provided is true and correct. I have read,
                        understood, and agree to all the terms and conditions of the RentalMeet
                        Vendor Service Agreement. I understand that providing false information may
                        lead to immediate termination of my vendor account.
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ── SECTION: What Happens After Submission ───────────────── */}
            <View style={wn.box}>
                <View style={wn.headerRow}>
                    <Ionicons name="rocket-outline" size={18} color={BRAND} />
                    <Text style={wn.headerText}>What Happens After Submission?</Text>
                </View>

                {WHAT_NEXT.map((item, idx) => (
                    <View key={item.step} style={wn.stepRow}>
                        {/* Step line */}
                        <View style={wn.stepLeft}>
                            <View style={[wn.stepCircle, idx === 0 && wn.stepCircleFirst]}>
                                <Text style={[wn.stepNum, idx === 0 && wn.stepNumFirst]}>
                                    {item.step}
                                </Text>
                            </View>
                            {idx < WHAT_NEXT.length - 1 && <View style={wn.stepLine} />}
                        </View>

                        {/* Content */}
                        <View style={wn.stepContent}>
                            <View style={wn.stepLabelRow}>
                                <Text style={wn.stepLabel}>{item.label}</Text>
                                <View style={[wn.timePill, idx === 0 && wn.timePillFirst]}>
                                    <Text style={[wn.timeText, idx === 0 && wn.timeTextFirst]}>
                                        {item.time}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ))}

                <View style={wn.note}>
                    <Ionicons name="mail-outline" size={13} color={BRAND} />
                    <Text style={wn.noteText}>
                        You will receive email/SMS updates at each stage. Our team may contact you
                        for additional information if required.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND = '#F97316'; // RentalMeet orange
const BRAND_LIGHT = '#FFF7ED';
const BRAND_BORDER = '#FED7AA';

// ─── Main Styles ─────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    container: { paddingBottom: 40 },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    sectionIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
    },
    sectionSub: { fontSize: 11, color: Colors.charcoalLight, marginTop: 1 },

    // Availability card
    availCard: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.md ?? 12,
        overflow: 'hidden',
        backgroundColor: Colors.surface,
        marginBottom: Spacing.md,
    },

    // Public holiday
    holidayCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#EFF6FF',
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    holidayLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    holidayLabel: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },

    // Advance booking option rows
    optionList: { gap: Spacing.sm, marginBottom: Spacing.md },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.sm,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    optionRowActive: { borderColor: BRAND, backgroundColor: BRAND_LIGHT },
    optionIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: `${Colors.charcoalLight}18`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionIconWrapActive: { backgroundColor: `${BRAND}18` },
    optionLabel: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    optionLabelActive: { color: Colors.charcoal, fontWeight: Typography.semiBold },
    radioOuter: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterActive: { borderColor: BRAND },
    radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND },

    // Custom days
    customWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
        marginLeft: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.surface,
    },
    customInput: {
        flex: 1,
        paddingVertical: Spacing.md,
        fontSize: Typography.base,
        color: Colors.charcoal,
    },
    customUnit: { fontSize: Typography.sm, color: Colors.charcoalLight },

    // Confirmation time
    confirmWrap: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.md ?? 12,
        backgroundColor: Colors.surface,
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    confirmLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        flexWrap: 'wrap',
        marginBottom: Spacing.md,
    },
    confirmTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
        flex: 1,
    },
    confirmBadge: {
        backgroundColor: `${BRAND}15`,
        borderRadius: 5,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    confirmBadgeText: { fontSize: 10, color: BRAND, fontWeight: '600' },
    confirmToggleRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: Radii.sm,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: 'center',
        backgroundColor: Colors.surface,
    },
    confirmBtnActive: { backgroundColor: BRAND, borderColor: BRAND },
    confirmBtnText: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    confirmBtnTextActive: { color: '#fff' },
    confirmHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    confirmHintText: { fontSize: 11, color: BRAND },
});

// ─── Day Row Styles ───────────────────────────────────────────────────────────

const dr = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider ?? Colors.border,
        gap: Spacing.sm,
        backgroundColor: Colors.surface,
    },
    rowOff: { backgroundColor: `${Colors.charcoalLight}08` },

    dayChip: {
        width: 40,
        alignItems: 'flex-start',
    },
    dayText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    dayTextOff: { color: Colors.charcoalLight },

    togglePill: {
        flexDirection: 'row',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    toggleOpt: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        backgroundColor: Colors.surface,
    },
    toggleOptActive: { backgroundColor: BRAND },
    toggleText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.charcoalLight,
    },
    toggleTextActive: { color: '#fff' },

    timeWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginLeft: 'auto',
    },
    timeInput: {
        width: 58,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 7,
        paddingVertical: 5,
        paddingHorizontal: 4,
        fontSize: Typography.sm,
        color: Colors.charcoal,
        backgroundColor: Colors.surface,
        textAlign: 'center',
    },
    timeSep: { fontSize: 12, color: Colors.charcoalLight },
    unavailText: {
        fontSize: 11,
        color: Colors.charcoalLight,
        fontStyle: 'italic',
    },
});

// ─── Checkbox Styles ──────────────────────────────────────────────────────────

const cb = StyleSheet.create({
    outer: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: Colors.charcoalLight,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 2,
    },
    outerActive: { backgroundColor: BRAND, borderColor: BRAND },
});

// ─── Terms Styles ─────────────────────────────────────────────────────────────

const tc = StyleSheet.create({
    box: {
        borderWidth: 1.5,
        borderColor: BRAND_BORDER,
        borderRadius: Radii.md ?? 12,
        backgroundColor: BRAND_LIGHT,
        overflow: 'hidden',
        marginBottom: Spacing.xl,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.sm,
    },
    headerText: {
        fontSize: 15,
        fontWeight: Typography.bold,
        color: BRAND,
    },
    scrollArea: {
        maxHeight: 220,
        backgroundColor: '#fff',
        marginHorizontal: Spacing.lg,
        borderRadius: 8,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: BRAND_BORDER,
    },
    agreementTitle: {
        fontSize: 13,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginBottom: 10,
    },
    secTitle: {
        fontSize: 12,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
        marginBottom: 4,
    },
    pointRow: { flexDirection: 'row', gap: 4, marginBottom: 4 },
    bullet: { fontSize: 11, color: Colors.charcoalMid, marginTop: 1 },
    pointText: { flex: 1, fontSize: 11, color: Colors.charcoalMid, lineHeight: 16 },

    declarationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
        paddingTop: Spacing.xs,
    },
    declarationText: {
        flex: 1,
        fontSize: 12,
        color: Colors.charcoal,
        lineHeight: 17,
        fontWeight: Typography.medium,
    },
});

// ─── What Next Styles ─────────────────────────────────────────────────────────

const wn = StyleSheet.create({
    box: {
        borderWidth: 1.5,
        borderColor: BRAND_BORDER,
        borderRadius: Radii.md ?? 12,
        backgroundColor: BRAND_LIGHT,
        padding: Spacing.lg,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    headerText: {
        fontSize: 15,
        fontWeight: Typography.bold,
        color: BRAND,
    },

    stepRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        minHeight: 44,
    },
    stepLeft: {
        alignItems: 'center',
        width: 28,
    },
    stepCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: `${BRAND}20`,
        borderWidth: 1.5,
        borderColor: BRAND_BORDER,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCircleFirst: {
        backgroundColor: BRAND,
        borderColor: BRAND,
    },
    stepNum: {
        fontSize: 12,
        fontWeight: '700',
        color: BRAND,
    },
    stepNumFirst: { color: '#fff' },
    stepLine: {
        flex: 1,
        width: 1.5,
        backgroundColor: BRAND_BORDER,
        marginVertical: 2,
    },

    stepContent: {
        flex: 1,
        paddingBottom: Spacing.md,
        justifyContent: 'center',
    },
    stepLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.sm,
    },
    stepLabel: {
        fontSize: Typography.base,
        fontWeight: Typography.medium,
        color: Colors.charcoal,
        flex: 1,
    },
    timePill: {
        backgroundColor: `${BRAND}18`,
        borderRadius: 5,
        paddingHorizontal: 7,
        paddingVertical: 3,
    },
    timePillFirst: { backgroundColor: BRAND },
    timeText: {
        fontSize: 11,
        color: BRAND,
        fontWeight: '700',
    },
    timeTextFirst: { color: '#fff' },

    note: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: BRAND_BORDER,
    },
    noteText: {
        flex: 1,
        fontSize: 11,
        color: BRAND,
        lineHeight: 16,
        fontStyle: 'italic',
    },
});

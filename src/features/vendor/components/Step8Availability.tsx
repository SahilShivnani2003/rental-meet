import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radii, Typography } from '@/theme/theme';
import { VendorService } from '@features/otherService/types/VendorService';

type Props = {
    data: Partial<VendorService>;
    onChange: (key: keyof VendorService, value: any) => void;
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ADVANCE_OPTIONS = [
    { value: 'same-day', label: 'Same day allowed' },
    { value: '24h', label: '24 hours minimum' },
    { value: '48h', label: '48 hours minimum' },
    { value: '1week', label: '1 week minimum' },
    { value: 'custom', label: 'Custom' },
] as const;

const TERMS = [
    'I/We agree to pay RentalMeet platform fee as per policy',
    'I confirm all information provided is accurate and truthful',
    'I will maintain quality standards as represented in my portfolio',
    'I will respond to booking inquiries within 2 hours',
    'I will honor confirmed bookings and provide services as promised',
    'I agree to receive booking notifications via Email/SMS/WhatsApp',
    'I understand that RentalMeet acts as a platform for lead generation and booking',
    'Payouts for services booked through the platform will follow standard billing cycles',
];

const WHAT_NEXT = [
    { label: 'Application Review', time: '24-48 hours' },
    { label: 'Document Verification', time: '24-48 hours' },
    { label: 'Vendor Approval', time: '3-5 business days' },
    { label: 'Profile Live', time: '3-5 business days' },
];

export default function Step8Availability({ data, onChange }: Props) {
    const availability =
        data.availability ||
        DAYS.map(day => ({
            day,
            isAvailable: true,
            startTime: '09:00',
            endTime: '18:00',
        }));

    const publicHoliday = data.publicHoliday || { isAvailable: false };
    const [termsChecked, setTermsChecked] = React.useState<boolean[]>(
        new Array(TERMS.length).fill(false),
    );

    const updateDay = (idx: number, field: string, value: any) => {
        const updated = availability.map((a, i) => (i === idx ? { ...a, [field]: value } : a));
        onChange('availability', updated);
    };

    const allTermsChecked = termsChecked.every(Boolean);

    const toggleTerm = (idx: number) => {
        const updated = [...termsChecked];
        updated[idx] = !updated[idx];
        setTermsChecked(updated);
        onChange('termsAccepted', updated.every(Boolean));
    };

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.container}
            keyboardShouldPersistTaps="handled"
        >
            {/* Service Availability */}
            <Text style={s.sectionTitle}>Service Availability</Text>

            {availability.map((avail, idx) => (
                <View key={avail.day || idx} style={s.dayRow}>
                    <Text style={s.dayLabel}>{avail.day}</Text>
                    <View style={s.dayToggle}>
                        {(['Yes', 'No'] as const).map(opt => (
                            <TouchableOpacity
                                key={opt}
                                style={s.radioOption}
                                onPress={() => updateDay(idx, 'isAvailable', opt === 'Yes')}
                                activeOpacity={0.7}
                            >
                                <View
                                    style={[
                                        s.radioOuter,
                                        avail.isAvailable === (opt === 'Yes') && s.radioOuterActive,
                                    ]}
                                >
                                    {avail.isAvailable === (opt === 'Yes') && (
                                        <View style={s.radioInner} />
                                    )}
                                </View>
                                <Text style={s.radioText}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {avail.isAvailable && (
                        <View style={s.timeRow}>
                            <TextInput
                                style={s.timeInput}
                                value={avail.startTime || '09:00'}
                                onChangeText={v => updateDay(idx, 'startTime', v)}
                                placeholder="09:00"
                                placeholderTextColor={Colors.charcoalLight}
                            />
                            <Text style={s.timeSep}>to</Text>
                            <TextInput
                                style={s.timeInput}
                                value={avail.endTime || '18:00'}
                                onChangeText={v => updateDay(idx, 'endTime', v)}
                                placeholder="18:00"
                                placeholderTextColor={Colors.charcoalLight}
                            />
                        </View>
                    )}
                </View>
            ))}

            {/* Public Holidays */}
            <View style={[s.dayRow, s.publicHolidayRow]}>
                <Text style={s.dayLabel}>Public Holidays</Text>
                <View style={s.dayToggle}>
                    {(['Yes', 'No'] as const).map(opt => (
                        <TouchableOpacity
                            key={opt}
                            style={s.radioOption}
                            onPress={() =>
                                onChange('publicHoliday', {
                                    ...publicHoliday,
                                    isAvailable: opt === 'Yes',
                                })
                            }
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    s.radioOuter,
                                    publicHoliday.isAvailable === (opt === 'Yes') &&
                                        s.radioOuterActive,
                                ]}
                            >
                                {publicHoliday.isAvailable === (opt === 'Yes') && (
                                    <View style={s.radioInner} />
                                )}
                            </View>
                            <Text style={s.radioText}>{opt}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Advance Booking */}
            <View style={s.section}>
                <Text style={s.sectionSubTitle}>Advance Booking Required</Text>
                {ADVANCE_OPTIONS.map(opt => (
                    <TouchableOpacity
                        key={opt.value}
                        style={s.radioOption}
                        onPress={() => onChange('advanceBooking', opt.value)}
                        activeOpacity={0.7}
                    >
                        <View
                            style={[
                                s.radioOuter,
                                data.advanceBooking === opt.value && s.radioOuterActive,
                            ]}
                        >
                            {data.advanceBooking === opt.value && <View style={s.radioInner} />}
                        </View>
                        <Text
                            style={[
                                s.radioText,
                                data.advanceBooking === opt.value && s.radioTextActive,
                            ]}
                        >
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
                {data.advanceBooking === 'custom' && (
                    <View style={s.customDaysWrap}>
                        <TextInput
                            style={s.customDaysInput}
                            placeholder="Enter number of days"
                            placeholderTextColor={Colors.charcoalLight}
                            keyboardType="numeric"
                            value={data.customAdvanceDays?.toString() || ''}
                            onChangeText={v => onChange('customAdvanceDays', parseInt(v) || 0)}
                        />
                    </View>
                )}
            </View>

            {/* Terms & Agreement */}
            <View style={s.termsBox}>
                <Text style={s.termsTitle}>Terms & Agreement</Text>
                {TERMS.map((term, idx) => (
                    <TouchableOpacity
                        key={idx}
                        style={s.termRow}
                        onPress={() => toggleTerm(idx)}
                        activeOpacity={0.7}
                    >
                        <View style={[s.checkbox, termsChecked[idx] && s.checkboxActive]}>
                            {termsChecked[idx] && (
                                <Ionicons name="checkmark" size={12} color={Colors.surface} />
                            )}
                        </View>
                        <Text style={s.termText}>{term}</Text>
                    </TouchableOpacity>
                ))}
                <Text style={s.termsDeclaration}>
                    I declare that the information provided is true and correct. Providing false
                    information may lead to immediate termination of my vendor account.
                </Text>
            </View>

            {/* What Happens Next */}
            <View style={s.whatNextBox}>
                <Text style={s.whatNextTitle}>What Happens Next?</Text>
                {WHAT_NEXT.map((item, idx) => (
                    <View key={idx} style={s.whatNextRow}>
                        <View style={s.whatNextDot} />
                        <Text style={s.whatNextLabel}>{item.label}</Text>
                        <Text style={s.whatNextTime}>{item.time}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { paddingBottom: Spacing.xl },
    sectionTitle: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        marginBottom: Spacing.lg,
    },
    sectionSubTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
        marginBottom: Spacing.md,
    },

    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
        gap: Spacing.sm,
        flexWrap: 'wrap',
    },
    publicHolidayRow: {
        backgroundColor: Colors.infoLight,
        borderRadius: Radii.sm,
        borderBottomWidth: 0,
        paddingHorizontal: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    dayLabel: {
        width: 90,
        fontSize: Typography.base,
        color: Colors.charcoal,
        fontWeight: Typography.medium,
    },
    dayToggle: { flexDirection: 'row', gap: Spacing.md },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginLeft: 'auto' },
    timeInput: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 6,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 5,
        fontSize: Typography.sm,
        color: Colors.charcoal,
        width: 64,
        backgroundColor: Colors.surface,
        textAlign: 'center',
    },
    timeSep: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
    },

    section: { marginTop: Spacing.lg, marginBottom: Spacing.lg },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: 5,
    },
    radioOuter: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterActive: { borderColor: Colors.primary },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    radioText: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    radioTextActive: { color: Colors.charcoal, fontWeight: Typography.semiBold },

    customDaysWrap: { marginTop: Spacing.sm, paddingLeft: 26 },
    customDaysInput: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        fontSize: Typography.base,
        color: Colors.charcoal,
        backgroundColor: Colors.surface,
        maxWidth: 220,
    },

    termsBox: {
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        borderRadius: Radii.md,
        backgroundColor: Colors.primaryLight,
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    termsTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginBottom: Spacing.md,
    },
    termRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    checkbox: {
        width: 16,
        height: 16,
        borderRadius: 3,
        borderWidth: 1.5,
        borderColor: Colors.charcoalLight,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
        flexShrink: 0,
    },
    checkboxActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    termText: {
        fontSize: 12,
        color: Colors.charcoalMid,
        flex: 1,
        lineHeight: 17,
    },
    termsDeclaration: {
        fontSize: 11,
        color: Colors.danger,
        fontStyle: 'italic',
        lineHeight: 16,
        marginTop: Spacing.sm,
    },

    whatNextBox: {
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        borderRadius: Radii.md,
        backgroundColor: Colors.primaryLight,
        padding: Spacing.lg,
    },
    whatNextTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginBottom: Spacing.md,
    },
    whatNextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    whatNextDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
    },
    whatNextLabel: {
        fontSize: Typography.sm,
        color: Colors.charcoal,
        fontWeight: Typography.medium,
        flex: 1,
    },
    whatNextTime: {
        fontSize: Typography.sm,
        color: Colors.primary,
        fontWeight: Typography.bold,
    },
});

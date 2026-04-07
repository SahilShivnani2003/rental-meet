import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme/theme';
import { StepHeader } from '../UI/shared-components';
import { VenueFormData } from '../../types/Venue';

const TERMS = [
    {
        section: '1. Commission Agreement',
        points: [
            'I agree to pay RentalMeet 15% commission on all confirmed bookings',
            'Commission will be deducted before payout',
            'Payouts processed within 24-48 hours after event completion',
        ],
    },
    {
        section: '2. Venue Standards',
        points: [
            'Maintain venue as described in listing',
            'Provide all promised amenities and facilities',
            'Ensure venue is clean and ready before each booking',
        ],
    },
    {
        section: '3. Booking Management',
        points: [
            'Respond to booking requests within 2 hours',
            'Honor confirmed bookings',
            'Update calendar regularly',
        ],
    },
    {
        section: '4. Cancellation Policy',
        points: [
            'Follow RentalMeet standard cancellation policy',
            'Refunds processed as per policy guidelines',
            'Excessive cancellations may result in account suspension',
        ],
    },
    {
        section: '5. Platform Usage',
        points: [
            'Do not engage in off-platform transactions',
            'Maintain accurate venue information at all times',
            'Report any disputes through official channels',
        ],
    },
];

const CONFIRMATION_HOURS: Array<1 | 2 | 3> = [1, 2, 3];

interface Props {
    data: VenueFormData['terms'];
    onChange: (data: VenueFormData['terms']) => void;
    onPrev: () => void;
    onSubmit: () => void;
}

export default function Step7Terms({ data, onChange, onPrev, onSubmit }: Props) {
    const [submitting, setSubmitting] = useState(false);
    const set = (patch: Partial<VenueFormData['terms']>) => onChange({ ...data, ...patch });

    const handleSubmit = async () => {
        if (!data.agreed) return;
        setSubmitting(true);
        try {
            await onSubmit();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
        >
            <StepHeader title="Step 7: Terms" current={7} />

            {/* ── Info banner ── */}
            <View style={s.infoBanner}>
                <Ionicons name="information-circle-outline" size={22} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                    <Text style={s.infoTitle}>Terms & Conditions</Text>
                    <Text style={s.infoSub}>
                        Please read and accept the terms before submitting
                    </Text>
                </View>
            </View>

            {/* ── Confirmation hours ── */}
            <View style={s.confirmCard}>
                <View style={s.confirmHeader}>
                    <View style={s.confirmIconWrap}>
                        <Ionicons name="timer-outline" size={18} color={Colors.info} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.confirmTitle}>Booking Confirmation Time</Text>
                        <Text style={s.confirmSub}>
                            How long will you take to confirm a booking request?
                        </Text>
                    </View>
                </View>

                <View style={s.hoursRow}>
                    {CONFIRMATION_HOURS.map(hr => {
                        const active = data.confirmationHours === hr;
                        return (
                            <TouchableOpacity
                                key={hr}
                                style={[s.hourChip, active && s.hourChipActive]}
                                onPress={() => set({ confirmationHours: hr })}
                                activeOpacity={0.75}
                            >
                                <View style={[s.hourCircle, active && s.hourCircleActive]}>
                                    <Text style={[s.hourNum, active && s.hourNumActive]}>{hr}</Text>
                                </View>
                                <Text style={[s.hourLabel, active && s.hourLabelActive]}>
                                    {hr === 1 ? '1 Hour' : `${hr} Hours`}
                                </Text>
                                {active && (
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={16}
                                        color={Colors.info}
                                        style={{ marginLeft: 4 }}
                                    />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={s.confirmNote}>
                    <Ionicons
                        name="information-circle-outline"
                        size={13}
                        color={Colors.charcoalLight}
                    />
                    <Text style={s.confirmNoteText}>
                        You must confirm or decline booking requests within{' '}
                        <Text style={s.confirmNoteHighlight}>
                            {data.confirmationHours}{' '}
                            {data.confirmationHours === 1 ? 'hour' : 'hours'}
                        </Text>{' '}
                        of receiving them.
                    </Text>
                </View>
            </View>

            {/* ── Terms box ── */}
            <View style={s.termsBox}>
                <Text style={s.agreementTitle}>RentalMeet Venue Owner Agreement</Text>
                <ScrollView
                    showsVerticalScrollIndicator
                    nestedScrollEnabled
                    contentContainerStyle={{ paddingBottom: 4 }}
                >
                    {TERMS.map((t, i) => (
                        <View key={i} style={s.termSection}>
                            <Text style={s.termSectionTitle}>{t.section}</Text>
                            {t.points.map((pt, j) => (
                                <View key={j} style={s.termPoint}>
                                    <Text style={s.bullet}>•</Text>
                                    <Text style={s.termText}>{pt}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* ── Agree checkbox ── */}
            <TouchableOpacity
                style={[s.checkRow, data.agreed && s.checkRowActive]}
                onPress={() => set({ agreed: !data.agreed })}
                activeOpacity={0.8}
            >
                <View style={[s.checkbox, data.agreed && s.checkboxActive]}>
                    {data.agreed && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                </View>
                <Text style={s.checkText}>
                    I have read and agree to all terms and conditions. I confirm that all
                    information provided is accurate and truthful.
                </Text>
            </TouchableOpacity>

            {/* ── Nav ── */}
            <View style={s.navRow}>
                <TouchableOpacity style={s.prevBtn} onPress={onPrev} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={15} color={Colors.primary} />
                    <Text style={s.prevText}>Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[s.submitBtn, !data.agreed && s.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={!data.agreed || submitting}
                    activeOpacity={0.85}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                        <>
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={17}
                                color={data.agreed ? Colors.charcoal : Colors.charcoalLight}
                            />
                            <Text style={[s.submitText, !data.agreed && s.submitTextDisabled]}>
                                Submit Venue
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        padding: Spacing.md,
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderLeftWidth: 4,
        borderColor: Colors.primaryBorder,
        borderLeftColor: Colors.primary,
    },
    infoTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.charcoal },
    infoSub: { fontSize: Typography.sm, color: Colors.charcoalLight, marginTop: 2 },

    // ── Confirmation hours card ──
    confirmCard: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        padding: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.card,
    },
    confirmHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    confirmIconWrap: {
        width: 34,
        height: 34,
        borderRadius: Radii.sm,
        backgroundColor: Colors.infoLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmTitle: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    confirmSub: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        marginTop: 2,
    },
    hoursRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    hourChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.xs,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
        gap: Spacing.xs,
    },
    hourChipActive: {
        borderColor: Colors.info ?? Colors.primary,
        backgroundColor: Colors.infoLight ?? Colors.primaryLight,
    },
    hourCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.border,
    },
    hourCircleActive: { backgroundColor: Colors.info ?? Colors.primary },
    hourNum: {
        fontSize: Typography.base,
        fontWeight: Typography.extraBold,
        color: Colors.charcoalLight,
    },
    hourNumActive: { color: Colors.white },
    hourLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalLight,
    },
    hourLabelActive: { color: Colors.info ?? Colors.primary },
    confirmNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.xs,
        backgroundColor: Colors.background,
        borderRadius: Radii.sm,
        padding: Spacing.sm,
        marginTop: Spacing.xs,
    },
    confirmNoteText: {
        flex: 1,
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        lineHeight: 16,
    },
    confirmNoteHighlight: {
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
    },

    // ── Terms box ──
    termsBox: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        padding: Spacing.lg,
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border,
        height: 300,
        ...Shadows.card,
    },
    agreementTitle: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginBottom: Spacing.md,
    },
    termSection: { marginBottom: Spacing.md },
    termSectionTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        marginBottom: Spacing.xs,
    },
    termPoint: { flexDirection: 'row', gap: Spacing.xs, marginBottom: 4 },
    bullet: { fontSize: Typography.base, color: Colors.charcoalLight },
    termText: { flex: 1, fontSize: Typography.sm, color: Colors.charcoalLight, lineHeight: 18 },

    // ── Agree checkbox ──
    checkRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        padding: Spacing.md,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    checkRowActive: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryLight },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
        flexShrink: 0,
        marginTop: 1,
    },
    checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    checkText: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        lineHeight: 19,
    },

    // ── Nav ──
    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.xl,
    },
    prevBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.xl,
        paddingVertical: 11,
    },
    prevText: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.primary },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.xl,
        paddingVertical: 13,
        minWidth: 140,
        justifyContent: 'center',
        ...Shadows.primary,
    },
    submitBtnDisabled: { backgroundColor: Colors.border, shadowOpacity: 0 },
    submitText: {
        fontSize: Typography.md,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
    submitTextDisabled: { color: Colors.charcoalLight },
});

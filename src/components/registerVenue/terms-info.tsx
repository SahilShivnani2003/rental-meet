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

interface Props {
    onPrev: () => void;
    onSubmit: () => void;
}

export default function Step7Terms({ onPrev, onSubmit }: Props) {
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!agreed) return;
        setSubmitting(true);
        await new Promise(r => setTimeout(() => {
            console.log('testing')
        }, 500));
        setSubmitting(false);
        onSubmit();
    };

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
        >
            <StepHeader title="Step 7: Terms" current={7} />

            <View style={s.infoBanner}>
                <Ionicons name="information-circle-outline" size={22} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                    <Text style={s.infoTitle}>Terms & Conditions</Text>
                    <Text style={s.infoSub}>
                        Please read and accept the terms before submitting
                    </Text>
                </View>
            </View>

            <View style={s.termsBox}>
                <Text style={s.agreementTitle}>RentalMeet Venue Owner Agreement</Text>
                <ScrollView
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
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

            <TouchableOpacity
                style={[s.checkRow, agreed && s.checkRowActive]}
                onPress={() => setAgreed(!agreed)}
                activeOpacity={0.8}
            >
                <View style={[s.checkbox, agreed && s.checkboxActive]}>
                    {agreed && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                </View>
                <Text style={s.checkText}>
                    I have read and agree to all terms and conditions. I confirm that all
                    information provided is accurate and truthful.
                </Text>
            </TouchableOpacity>

            <View style={s.navRow}>
                <TouchableOpacity style={s.prevBtn} onPress={onPrev} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={15} color={Colors.primary} />
                    <Text style={s.prevText}>Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[s.submitBtn, !agreed && s.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={!agreed || submitting}
                    activeOpacity={0.85}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                        <>
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={17}
                                color={agreed ? Colors.charcoal : Colors.charcoalLight}
                            />
                            <Text style={[s.submitText, !agreed && s.submitTextDisabled]}>
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
    termsBox: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        padding: Spacing.lg,
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border,
        height: 320,
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
    checkText: { flex: 1, fontSize: Typography.base, color: Colors.charcoalMid, lineHeight: 19 },
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

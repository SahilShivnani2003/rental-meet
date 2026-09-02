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
import { Colors, Typography, Spacing, Radii, Shadows } from '../../../theme/theme';
import { StepHeader } from '../../../components/UI/shared-components';
import { VenueFormData } from '../types/VenueFormData';
import { useTermsCondition } from '@/features/booking/hooks/useTermsCondition';

interface Props {
    data: VenueFormData['terms'];
    onChange: (data: VenueFormData['terms']) => void;
    onPrev: () => void;
    onSubmit: () => void;
    isSubmitting?: boolean;
}

interface ParsedTermSection {
    title: string;
    points: string[];
}

function parseVenueTerms(raw?: string): { heading: string; sections: ParsedTermSection[] } {
    if (!raw) return { heading: '', sections: [] };

    const lines = raw
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);
    let heading = '';
    const sections: ParsedTermSection[] = [];
    let current: ParsedTermSection | null = null;

    for (const line of lines) {
        if (/^\d+\.\s/.test(line)) {
            // New numbered section header, e.g. "1. Commission Agreement"
            current = { title: line.replace(/^\d+\.\s*/, ''), points: [] };
            sections.push(current);
        } else if (line.startsWith('•')) {
            const point = line.replace(/^•\s*/, '');
            if (current) current.points.push(point);
        } else if (!current) {
            // Any line before the first numbered section is the heading
            heading = heading ? `${heading} ${line}` : line;
        }
    }

    return { heading, sections };
}

export default function Step7Terms({
    data,
    onChange,
    onPrev,
    onSubmit,
    isSubmitting = false,
}: Props) {
    const { data: terms, isLoading, isError, refetch } = useTermsCondition();
    const set = (patch: Partial<VenueFormData['terms']>) => onChange({ ...data, ...patch });
    const { heading, sections } = parseVenueTerms(terms?.terms?.venueOnboardingTerms);

    const hasParsedContent = sections.length > 0;
    const hasRawFallback = !hasParsedContent && !!terms?.terms?.venueOnboardingTerms?.trim();

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
        >
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

            {/* ── Terms box ── */}
            <View style={s.termsBox}>
                <Text style={s.agreementTitle}>
                    {heading || 'RentalMeet Venue Owner Agreement'}
                </Text>

                {isLoading ? (
                    <View style={s.centerState}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={s.centerStateText}>Loading terms…</Text>
                    </View>
                ) : isError ? (
                    <View style={s.centerState}>
                        <Ionicons name="alert-circle-outline" size={22} color={Colors.danger} />
                        <Text style={s.centerStateText}>Couldn't load terms.</Text>
                        <TouchableOpacity onPress={() => refetch()} style={s.retryBtn}>
                            <Text style={s.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator
                        nestedScrollEnabled
                        contentContainerStyle={{ paddingBottom: 4 }}
                    >
                        {hasParsedContent ? (
                            sections.map((t, i) => (
                                <View key={i} style={s.termSection}>
                                    <Text style={s.termSectionTitle}>{t.title}</Text>
                                    {t.points.map((pt, j) => (
                                        <View key={j} style={s.termPoint}>
                                            <Text style={s.bullet}>•</Text>
                                            <Text style={s.termText}>{pt}</Text>
                                        </View>
                                    ))}
                                </View>
                            ))
                        ) : hasRawFallback ? (
                            // Parsing didn't match the expected format — show the raw text
                            // rather than an empty box, so nothing is silently lost.
                            <Text style={s.termText}>{terms.terms.venueOnboardingTerms}</Text>
                        ) : (
                            <View style={s.centerState}>
                                <Text style={s.centerStateText}>No terms available.</Text>
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>

            {/* ── Agree checkbox ── */}
            <TouchableOpacity
                style={[s.checkRow, data.agreed && s.checkRowActive]}
                onPress={() => !isSubmitting && set({ agreed: !data.agreed })}
                activeOpacity={0.8}
                disabled={isSubmitting}
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
                <TouchableOpacity
                    style={[s.prevBtn, isSubmitting && s.btnDisabled]}
                    onPress={onPrev}
                    activeOpacity={0.8}
                    disabled={isSubmitting}
                >
                    <Ionicons name="chevron-back" size={15} color={Colors.primary} />
                    <Text style={s.prevText}>Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[s.submitBtn, (!data.agreed || isSubmitting) && s.submitBtnDisabled]}
                    onPress={onSubmit}
                    disabled={!data.agreed || isSubmitting}
                    activeOpacity={0.85}
                >
                    {isSubmitting ? (
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

    termsBox: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        padding: Spacing.lg,
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border,
        height: 400,
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
        color: Colors.charcoal, // was charcoalMid
        marginBottom: Spacing.xs,
    },
    bullet: { fontSize: Typography.base, color: Colors.charcoalMid }, // was charcoalLight
    termText: { flex: 1, fontSize: Typography.sm, color: Colors.charcoalMid, lineHeight: 19 }, // was charcoalLight

    centerState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xl,
        gap: Spacing.sm,
    },
    centerStateText: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
    },
    retryBtn: {
        marginTop: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    retryText: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },
    termPoint: { flexDirection: 'row', gap: Spacing.xs, marginBottom: 4 },
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
    btnDisabled: { opacity: 0.5 },
});

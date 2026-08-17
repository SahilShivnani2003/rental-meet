import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, Radii, Typography } from '@/theme/theme';
import { VendorService } from '@/features/otherService/types/VendorService';
import Field from '@/components/UI/InputField';
import Ionicons from 'react-native-vector-icons/Ionicons';

// ─── Types ─────────────────────────────────────────────────────────────────

type Props = {
    data: Partial<VendorService>;
    onChange: (key: keyof VendorService, value: any) => void;
};

// ─── Constants ─────────────────────────────────────────────────────────────

const PRIMARY = Colors.primary;

const ROLES = [
    { value: 'owner', label: 'Owner', icon: 'person-circle-outline' },
    { value: 'manager', label: 'Manager', icon: 'briefcase-outline' },
    { value: 'representative', label: 'Representative', icon: 'people-outline' },
] as const;

const REQUIRED_FIELDS = ['fullName', 'primaryMobile', 'role'];

// ─── Main Component ────────────────────────────────────────────────────────

export default function Step1Contact({ data, onChange }: Props) {
    const contact = (data.contactInfo as Record<string, any>) || {};

    const update = (field: string, value: string) =>
        onChange('contactInfo', { ...contact, [field]: value });

    // ── Progress calculation ─────────────────────────────────────────────
    const requiredFilled = REQUIRED_FIELDS.filter(f => !!contact[f]).length;
    const totalRequired = REQUIRED_FIELDS.length;
    const pct = Math.round((requiredFilled / totalRequired) * 100);

    // ── Mobile validation hint ───────────────────────────────────────────
    const primaryValid = contact.primaryMobile?.length === 10;

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.container}
            keyboardShouldPersistTaps="handled"
        >

            {/* ── Full Name ────────────────────────────────────────────── */}
            <Field
                label="Full Name *"
                placeholder="Your full name"
                icon="person-outline"
                value={contact.fullName || ''}
                onChangeText={v => update('fullName', v)}
                autoCapitalize="words"
            />

            {/* ── Primary + Alternate mobile row ───────────────────────── */}
            <View style={s.rowWrap}>
                <View style={{ flex: 1 }}>
                    <Field
                        label="Primary Mobile *"
                        placeholder="10-digit number"
                        icon="call-outline"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={contact.primaryMobile || ''}
                        onChangeText={v => update('primaryMobile', v)}
                    />
                    {contact.primaryMobile?.length > 0 && (
                        <View style={s.hintRow}>
                            <Ionicons
                                name={
                                    primaryValid
                                        ? 'checkmark-circle-outline'
                                        : 'information-circle-outline'
                                }
                                size={11}
                                color={primaryValid ? PRIMARY : Colors.charcoalLight}
                            />
                            <Text style={[s.hintText, !primaryValid && s.hintTextMuted]}>
                                {primaryValid
                                    ? 'Valid number'
                                    : `${10 - contact.primaryMobile.length} more digits`}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={{ flex: 1 }}>
                    <Field
                        label="Alternate Mobile"
                        placeholder="Optional"
                        icon="call-outline"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={contact.secondaryMobile || ''}
                        onChangeText={v => update('secondaryMobile', v)}
                    />
                </View>
            </View>

            {/* ── Role ─────────────────────────────────────────────────── */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>
                    Your Role <Text style={s.required}>*</Text>
                </Text>
                <View style={s.roleRow}>
                    {ROLES.map(role => {
                        const active = contact.role === role.value;
                        return (
                            <TouchableOpacity
                                key={role.value}
                                style={[s.roleCard, active && s.roleCardActive]}
                                onPress={() => update('role', role.value)}
                                activeOpacity={0.75}
                            >
                                <View style={[s.roleIconWrap, active && s.roleIconWrapActive]}>
                                    <Ionicons
                                        name={role.icon as any}
                                        size={20}
                                        color={active ? PRIMARY : Colors.charcoalLight}
                                    />
                                </View>
                                <Text style={[s.roleLabel, active && s.roleLabelActive]}>
                                    {role.label}
                                </Text>
                                <View style={[s.radioOuter, active && s.radioOuterActive]}>
                                    {active && <View style={s.radioInner} />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* ── Info note ─────────────────────────────────────────────── */}
            <View style={s.infoNote}>
                <Ionicons name="lock-closed-outline" size={15} color={PRIMARY} />
                <Text style={s.infoNoteText}>
                    Your contact details are only used for booking confirmations and support. They
                    are never sold or shared with third parties.
                </Text>
            </View>
        </ScrollView>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const PRIMARY_COLOR = Colors.primary;

const s = StyleSheet.create({
    container: { paddingBottom: Spacing.xl },

    // Header
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: PRIMARY_COLOR,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    sectionSub: {
        fontSize: 11,
        color: Colors.charcoalLight,
        marginTop: 2,
    },

    // Progress
    progressWrap: { marginBottom: Spacing.xl },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    progressLabel: { fontSize: 11, color: Colors.charcoalLight },
    progressPct: { fontSize: 11, color: PRIMARY_COLOR, fontWeight: '600' },
    progressTrack: {
        height: 4,
        borderRadius: 2,
        backgroundColor: `${PRIMARY_COLOR}18`,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
        backgroundColor: PRIMARY_COLOR,
    },

    // Layout
    rowWrap: { flexDirection: "column", gap: Spacing.md },
    fieldWrap: { marginBottom: Spacing.lg },

    // Label
    label: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        marginBottom: 7,
    },
    required: { color: Colors.danger },

    // Hints
    hintRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: -Spacing.sm,
        marginBottom: Spacing.sm,
    },
    hintText: { fontSize: 10, color: PRIMARY_COLOR },
    hintTextMuted: { color: Colors.charcoalLight },

    // Role cards — mirrors bank screen's account type cards exactly
    roleRow: { gap: Spacing.sm },
    roleCard: {
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
    roleCardActive: {
        borderColor: PRIMARY_COLOR,
        backgroundColor: `${PRIMARY_COLOR}08`,
    },
    roleIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: `${Colors.charcoalLight}15`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roleIconWrapActive: { backgroundColor: `${PRIMARY_COLOR}15` },
    roleLabel: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    roleLabelActive: {
        color: Colors.charcoal,
        fontWeight: Typography.semiBold,
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
    radioOuterActive: { borderColor: PRIMARY_COLOR },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: PRIMARY_COLOR,
    },

    // Info note
    infoNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        backgroundColor: `${PRIMARY_COLOR}08`,
        borderRadius: Radii.sm,
        padding: Spacing.md,
        marginTop: Spacing.sm,
    },
    infoNoteText: {
        flex: 1,
        fontSize: 11,
        color: Colors.charcoalLight,
        lineHeight: 16,
    },
});

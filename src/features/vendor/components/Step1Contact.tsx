import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, Radii, Typography } from '@/theme/theme';
import { VendorService } from '@/features/otherService/types/VendorService';

type Props = {
    data: Partial<VendorService>;
    onChange: (key: keyof VendorService, value: any) => void;
};

const ROLES = ['owner', 'manager', 'representative'] as const;

export default function Step1Contact({ data, onChange }: Props) {
    const contact = data.contactInfo || {};

    const update = (field: string, value: string) => {
        onChange('contactInfo', { ...contact, [field]: value });
    };

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.container}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={s.sectionTitle}>Contact Information</Text>

            {/* Full Name */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>
                    Full Name <Text style={s.required}>*</Text>
                </Text>
                <TextInput
                    style={s.input}
                    placeholder="Your full name"
                    placeholderTextColor={Colors.charcoalLight}
                    value={contact.fullName || ''}
                    onChangeText={v => update('fullName', v)}
                />
            </View>

            {/* Primary Mobile */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>
                    Primary Mobile <Text style={s.required}>*</Text>
                </Text>
                <View style={s.phoneRow}>
                    <View style={s.countryCode}>
                        <Text style={s.countryCodeText}>+91</Text>
                    </View>
                    <TextInput
                        style={[s.input, s.phoneInput]}
                        placeholder="10-digit mobile"
                        placeholderTextColor={Colors.charcoalLight}
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={contact.primaryMobile || ''}
                        onChangeText={v => update('primaryMobile', v)}
                    />
                </View>
            </View>

            {/* Alternate Mobile */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>Alternate Mobile</Text>
                <View style={s.phoneRow}>
                    <View style={s.countryCode}>
                        <Text style={s.countryCodeText}>+91</Text>
                    </View>
                    <TextInput
                        style={[s.input, s.phoneInput]}
                        placeholder="Optional"
                        placeholderTextColor={Colors.charcoalLight}
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={contact.secondaryMobile || ''}
                        onChangeText={v => update('secondaryMobile', v)}
                    />
                </View>
            </View>

            {/* Role */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>
                    Your Role <Text style={s.required}>*</Text>
                </Text>
                <View style={s.roleRow}>
                    {ROLES.map(role => (
                        <TouchableOpacity
                            key={role}
                            style={[s.roleOption, contact.role === role && s.roleOptionActive]}
                            onPress={() => update('role', role)}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[s.radioOuter, contact.role === role && s.radioOuterActive]}
                            >
                                {contact.role === role && <View style={s.radioInner} />}
                            </View>
                            <Text style={[s.roleText, contact.role === role && s.roleTextActive]}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
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
        marginBottom: Spacing.xl,
    },

    fieldWrap: { marginBottom: Spacing.lg },

    label: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
        marginBottom: Spacing.xs,
    },
    required: { color: Colors.danger },

    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        fontSize: Typography.base,
        color: Colors.charcoal,
        backgroundColor: Colors.surface,
    },

    phoneRow: { flexDirection: 'row', gap: Spacing.sm },
    countryCode: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.background,
        justifyContent: 'center',
    },
    countryCodeText: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    phoneInput: { flex: 1 },

    roleRow: { gap: Spacing.sm },
    roleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: Radii.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    roleOptionActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
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
    roleText: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    roleTextActive: {
        color: Colors.primaryDark,
        fontWeight: Typography.semiBold,
    },
});

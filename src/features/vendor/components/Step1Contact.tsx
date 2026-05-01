import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, Radii, Typography } from '@/theme/theme';
import { VendorService } from '@/features/otherService/types/VendorService';
import Field from '@/components/UI/InputField';

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
            <Field
                label="Full Name *"
                placeholder="Your full name"
                icon="person-outline"
                value={contact.fullName || ''}
                onChangeText={v => update('fullName', v)}
                autoCapitalize="words"
            />

            {/* Primary Mobile */}
            <View style={s.fieldWrap}>
                <View style={s.phoneRow}>
                    <View style={s.phoneField}>
                        <Field
                            label="Primary Mobile *"
                            placeholder="10-digit mobile"
                            icon="call-outline"
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={contact.primaryMobile || ''}
                            onChangeText={v => update('primaryMobile', v)}
                        />
                    </View>
                </View>
            </View>

            {/* Alternate Mobile */}
            <View style={s.fieldWrap}>
                <View style={s.phoneRow}>
                    
                    <View style={s.phoneField}>
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

    fieldWrap: { marginBottom: Spacing.md },

    label: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 7,
    },
    required: { color: Colors.danger },

    // Phone row — aligns +91 badge with the Field's input box
    phoneRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
    countryCode: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.md,
        paddingHorizontal: Spacing.md,
        height: 54, // matches Field's input height
        backgroundColor: Colors.background,
        justifyContent: 'center',
        marginBottom: Spacing.md, // matches Field's wrap marginBottom
    },
    countryCodeText: {
        fontSize: 15,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    phoneField: { flex: 1 },

    // Role picker
    roleRow: { gap: Spacing.sm },
    roleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: Radii.sm,
        borderWidth: 1.5,
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

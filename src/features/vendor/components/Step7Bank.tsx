import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radii, Typography } from '@/theme/theme';
import { VendorService } from '@features/otherService/types/VendorService';

type Props = {
    data: Partial<VendorService>;
    onChange: (key: keyof VendorService, value: any) => void;
};

export default function Step7Bank({ data, onChange }: Props) {
    const bank = data.bankDetails || {};

    const update = (field: string, value: any) => {
        onChange('bankDetails', { ...bank, [field]: value });
    };

    const hasProof = !!bank.proof;

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.container}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={s.sectionTitle}>Bank Details for Payouts</Text>

            {/* Two column rows */}
            <View style={s.rowWrap}>
                <View style={[s.fieldWrap, { flex: 1 }]}>
                    <Text style={s.label}>
                        Account Holder Name <Text style={s.required}>*</Text>
                    </Text>
                    <TextInput
                        style={s.input}
                        placeholder=""
                        placeholderTextColor={Colors.charcoalLight}
                        value={bank.accountHolderName || ''}
                        onChangeText={v => update('accountHolderName', v)}
                    />
                </View>
                <View style={[s.fieldWrap, { flex: 1 }]}>
                    <Text style={s.label}>
                        Account Number <Text style={s.required}>*</Text>
                    </Text>
                    <TextInput
                        style={s.input}
                        placeholder=""
                        placeholderTextColor={Colors.charcoalLight}
                        keyboardType="numeric"
                        value={bank.accountNumber || ''}
                        onChangeText={v => update('accountNumber', v)}
                    />
                </View>
            </View>

            <View style={s.rowWrap}>
                <View style={[s.fieldWrap, { flex: 1 }]}>
                    <Text style={s.label}>
                        IFSC Code <Text style={s.required}>*</Text>
                    </Text>
                    <TextInput
                        style={s.input}
                        placeholder=""
                        placeholderTextColor={Colors.charcoalLight}
                        autoCapitalize="characters"
                        value={bank.ifsc || ''}
                        onChangeText={v => update('ifsc', v.toUpperCase())}
                    />
                </View>
                <View style={[s.fieldWrap, { flex: 1 }]}>
                    <Text style={s.label}>
                        Bank Name <Text style={s.required}>*</Text>
                    </Text>
                    <TextInput
                        style={s.input}
                        placeholder=""
                        placeholderTextColor={Colors.charcoalLight}
                        value={bank.bankName || ''}
                        onChangeText={v => update('bankName', v)}
                    />
                </View>
            </View>

            <View style={s.rowWrap}>
                <View style={[s.fieldWrap, { flex: 1 }]}>
                    <Text style={s.label}>Branch Name</Text>
                    <TextInput
                        style={s.input}
                        placeholder=""
                        placeholderTextColor={Colors.charcoalLight}
                        value={bank.branchName || ''}
                        onChangeText={v => update('branchName', v)}
                    />
                </View>
                <View style={[s.fieldWrap, { flex: 1 }]}>
                    <Text style={s.label}>
                        Account Type <Text style={s.required}>*</Text>
                    </Text>
                    <View style={s.radioRow}>
                        {(['savings', 'current'] as const).map(t => (
                            <TouchableOpacity
                                key={t}
                                style={s.radioOption}
                                onPress={() => update('accountType', t)}
                                activeOpacity={0.7}
                            >
                                <View
                                    style={[
                                        s.radioOuter,
                                        bank.accountType === t && s.radioOuterActive,
                                    ]}
                                >
                                    {bank.accountType === t && <View style={s.radioInner} />}
                                </View>
                                <Text
                                    style={[
                                        s.radioText,
                                        bank.accountType === t && s.radioTextActive,
                                    ]}
                                >
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            {/* UPI */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>UPI ID (optional)</Text>
                <TextInput
                    style={s.input}
                    placeholder="yourname@upi"
                    placeholderTextColor={Colors.charcoalLight}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={bank.upiId || ''}
                    onChangeText={v => update('upiId', v)}
                />
            </View>

            {/* Bank Proof */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>
                    Bank A/C Proof (Cheque / Passbook / Statement) <Text style={s.required}>*</Text>
                </Text>
                {hasProof ? (
                    <View style={s.proofUploaded}>
                        <View style={s.proofRow}>
                            <Ionicons
                                name="document-text-outline"
                                size={20}
                                color={Colors.success}
                            />
                            <Text style={s.proofText}>Document uploaded</Text>
                        </View>
                        <View style={s.proofBar}>
                            <View style={s.proofStatus}>
                                <Ionicons
                                    name="checkmark-circle"
                                    size={14}
                                    color={Colors.surface}
                                />
                                <Text style={s.proofStatusText}>Uploaded</Text>
                            </View>
                            <View style={s.proofActions}>
                                <TouchableOpacity onPress={() => console.log('View proof')}>
                                    <Text style={s.proofActionText}>View</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => update('proof', '')}>
                                    <Text style={s.proofActionText}>Change</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={s.uploadBox}
                        onPress={() => {
                            console.log('Upload bank proof');
                            // Real: launch doc picker
                        }}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="cloud-upload-outline"
                            size={22}
                            color={Colors.charcoalLight}
                        />
                        <Text style={s.uploadText}>Click to upload</Text>
                        <Text style={s.uploadSubtext}>JPG, PNG, PDF (max 10MB)</Text>
                    </TouchableOpacity>
                )}
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
    rowWrap: { flexDirection: 'row', gap: Spacing.md },

    radioRow: { flexDirection: 'row', gap: Spacing.lg, paddingTop: 10 },
    radioOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
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

    uploadBox: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        borderRadius: Radii.sm,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xl,
        backgroundColor: Colors.surface,
        gap: Spacing.xs,
    },
    uploadText: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    uploadSubtext: { fontSize: 10, color: Colors.charcoalLight },

    proofUploaded: {
        borderWidth: 1,
        borderColor: Colors.success,
        borderRadius: Radii.sm,
        overflow: 'hidden',
        backgroundColor: Colors.successLight,
    },
    proofRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: Spacing.md,
    },
    proofText: {
        fontSize: Typography.sm,
        color: Colors.charcoal,
        fontWeight: Typography.medium,
    },
    proofBar: {
        backgroundColor: Colors.success,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: 7,
    },
    proofStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    proofStatusText: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.surface,
    },
    proofActions: { flexDirection: 'row', gap: Spacing.lg },
    proofActionText: {
        fontSize: 11,
        color: Colors.surface,
        fontWeight: Typography.semiBold,
        textDecorationLine: 'underline',
    },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radii, Typography } from '@/theme/theme';
import { VendorService } from '@features/otherService/types/VendorService';

type Props = {
    data: Partial<VendorService>;
    onChange: (key: keyof VendorService, value: any) => void;
};

type DocField = {
    key: string;
    label: string;
    required?: boolean;
    highlight?: boolean;
};

const BUSINESS_DOCS: DocField[] = [
    { key: 'registrationCertificate', label: 'Registration Certificate', required: true },
    { key: 'msme', label: 'MSME Certificate' },
    { key: 'gst', label: 'GST Certificate' },
    { key: 'pan', label: 'PAN Card (Business)' },
    { key: 'tradeLicense', label: 'Trade License' },
    { key: 'fssai', label: 'FSSAI License (Catering)' },
];

const OWNER_DOCS: DocField[] = [
    { key: 'aadhaarFront', label: 'Aadhaar Card — Front', required: true },
    { key: 'aadhaarBack', label: 'Aadhaar Card — Back', required: true, highlight: true },
    { key: 'pan', label: 'PAN Card' },
    { key: 'selfie', label: 'Selfie / Photo', required: true },
];

function DocUploadBox({
    label,
    required,
    highlight,
    value,
    onUpload,
    onView,
    onChange,
}: {
    label: string;
    required?: boolean;
    highlight?: boolean;
    value?: string;
    onUpload: () => void;
    onView?: () => void;
    onChange?: () => void;
}) {
    if (value) {
        return (
            <View style={[s.docBox, s.docBoxFilled]}>
                <View style={s.docFilledRow}>
                    <Ionicons name="document-text-outline" size={20} color={Colors.success} />
                    <Text style={s.docFilledText}>Document uploaded</Text>
                </View>
                <View style={s.docFilledBar}>
                    <View style={s.docFilledStatus}>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.surface} />
                        <Text style={s.docFilledStatusText}>Uploaded</Text>
                    </View>
                    <View style={s.docFilledActions}>
                        {onView && (
                            <TouchableOpacity onPress={onView} activeOpacity={0.7}>
                                <Text style={s.docActionText}>View</Text>
                            </TouchableOpacity>
                        )}
                        {onChange && (
                            <TouchableOpacity onPress={onChange} activeOpacity={0.7}>
                                <Text style={s.docActionText}>Change</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    }

    return (
        <TouchableOpacity
            style={[s.docBox, highlight && s.docBoxHighlight]}
            onPress={onUpload}
            activeOpacity={0.8}
        >
            <Ionicons name="cloud-upload-outline" size={22} color={Colors.charcoalLight} />
            <Text style={s.docUploadText}>Click to upload</Text>
            <Text style={s.docUploadSubtext}>JPG, PNG, PDF (max 10MB)</Text>
        </TouchableOpacity>
    );
}

export default function Step6Documents({ data, onChange }: Props) {
    const bizDocs = data.businessDocs || {};
    const ownerDocs = data.ownerDocs || {};

    const handleBizUpload = (key: string) => {
        console.log('Upload business doc:', key);
        // Real: launch doc picker then call onChange('businessDocs', { ...bizDocs, [key]: uri })
    };

    const handleOwnerUpload = (key: string) => {
        console.log('Upload owner doc:', key);
        // Real: launch doc picker then call onChange('ownerDocs', { ...ownerDocs, [key]: uri })
    };

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.container}
            keyboardShouldPersistTaps="handled"
        >
            {/* Business Documents */}
            <Text style={s.sectionTitle}>Business Documents</Text>
            <View style={s.grid}>
                {BUSINESS_DOCS.map(doc => (
                    <View key={doc.key} style={s.gridItem}>
                        <Text style={s.docLabel}>
                            {doc.label}
                            {doc.required && <Text style={s.required}> *</Text>}
                        </Text>
                        <DocUploadBox
                            label={doc.label}
                            required={doc.required}
                            highlight={doc.highlight}
                            value={(bizDocs as any)[doc.key]}
                            onUpload={() => handleBizUpload(doc.key)}
                            onView={() => console.log('View', doc.key)}
                            onChange={() => handleBizUpload(doc.key)}
                        />
                    </View>
                ))}
            </View>

            {/* Owner / Manager Documents */}
            <Text style={[s.sectionTitle, { marginTop: Spacing.xl }]}>
                Owner / Manager Documents
            </Text>
            <View style={s.grid}>
                {OWNER_DOCS.map(doc => (
                    <View key={doc.key} style={s.gridItem}>
                        <Text style={s.docLabel}>
                            {doc.label}
                            {doc.required && <Text style={s.required}> *</Text>}
                        </Text>
                        <DocUploadBox
                            label={doc.label}
                            required={doc.required}
                            highlight={doc.highlight}
                            value={(ownerDocs as any)[doc.key]}
                            onUpload={() => handleOwnerUpload(doc.key)}
                            onView={() => console.log('View', doc.key)}
                            onChange={() => handleOwnerUpload(doc.key)}
                        />
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
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.lg,
    },
    gridItem: {
        width: '47%',
    },
    docLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
        marginBottom: Spacing.xs,
    },
    required: { color: Colors.danger },
    docBox: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        borderRadius: Radii.sm,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xl,
        backgroundColor: Colors.surface,
        gap: Spacing.xs,
        minHeight: 90,
    },
    docBoxHighlight: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
    },
    docBoxFilled: {
        borderStyle: 'solid',
        borderColor: Colors.success,
        backgroundColor: Colors.successLight,
        padding: 0,
        overflow: 'hidden',
        minHeight: 90,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    docFilledRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: Spacing.md,
        flex: 1,
    },
    docFilledText: {
        fontSize: Typography.sm,
        color: Colors.charcoal,
        fontWeight: Typography.medium,
        flex: 1,
    },
    docFilledBar: {
        width: '100%',
        backgroundColor: Colors.success,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 6,
    },
    docFilledStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    docFilledStatusText: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.surface,
    },
    docFilledActions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    docActionText: {
        fontSize: 11,
        color: Colors.surface,
        fontWeight: Typography.semiBold,
        textDecorationLine: 'underline',
    },
    docUploadText: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    docUploadSubtext: {
        fontSize: 9,
        color: Colors.charcoalLight,
    },
});

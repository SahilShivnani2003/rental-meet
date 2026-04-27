import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radii, Typography } from '@/theme/theme';
import { VendorService } from '@features/otherService/types/VendorService';

type Props = {
    data: Partial<VendorService>;
    onChange: (key: keyof VendorService, value: any) => void;
};

const UNITS = [
    'Per Day',
    'Per Hour',
    'Per Event',
    'Per Person',
    'Per Plate',
    'Per Photo',
    'Per Video',
    'Fixed',
    'Custom',
];

type Package = {
    sno?: number;
    name?: string;
    price?: number;
    unit?: string;
    quantity?: number;
};

export default function Step4Pricing({ data, onChange }: Props) {
    const packages: Package[] = data.packages || [
        { sno: 1, name: '', price: undefined, unit: '', quantity: undefined },
    ];
    const [openUnitIdx, setOpenUnitIdx] = React.useState<number | null>(null);

    const updatePackage = (idx: number, field: keyof Package, value: any) => {
        const updated = packages.map((p, i) => (i === idx ? { ...p, [field]: value } : p));
        onChange('packages', updated);
    };

    const addRow = () => {
        onChange('packages', [
            ...packages,
            { sno: packages.length + 1, name: '', price: undefined, unit: '', quantity: undefined },
        ]);
    };

    const removeRow = (idx: number) => {
        if (packages.length === 1) return;
        const updated = packages.filter((_, i) => i !== idx).map((p, i) => ({ ...p, sno: i + 1 }));
        onChange('packages', updated);
    };

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.container}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={s.sectionTitle}>Service Details & Rates</Text>

            {/* Starting Price + Minimum Order */}
            <View style={s.rowWrap}>
                <View style={[s.fieldWrap, { flex: 1 }]}>
                    <Text style={s.label}>
                        Starting Price (₹) <Text style={s.required}>*</Text>
                    </Text>
                    <TextInput
                        style={s.input}
                        placeholder=""
                        placeholderTextColor={Colors.charcoalLight}
                        keyboardType="numeric"
                        value={data.startingPrice?.toString() || ''}
                        onChangeText={v => onChange('startingPrice', parseInt(v) || 0)}
                    />
                </View>
                <View style={[s.fieldWrap, { flex: 1 }]}>
                    <Text style={s.label}>
                        Minimum Order (₹) <Text style={s.required}>*</Text>
                    </Text>
                    <TextInput
                        style={s.input}
                        placeholder=""
                        placeholderTextColor={Colors.charcoalLight}
                        keyboardType="numeric"
                        value={data.minimumOrderPrice?.toString() || ''}
                        onChangeText={v => onChange('minimumOrderPrice', parseInt(v) || 0)}
                    />
                </View>
            </View>

            {/* Rate List / Packages */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>Rate List / Packages</Text>
                <View style={s.tableWrap}>
                    {/* Header */}
                    <View style={s.tableHeader}>
                        <Text style={[s.colHeader, s.colSno]}>S.No</Text>
                        <Text style={[s.colHeader, s.colService]}>Service</Text>
                        <Text style={[s.colHeader, s.colRate]}>Rate (₹)</Text>
                        <Text style={[s.colHeader, s.colUnit]}>Unit</Text>
                        <Text style={[s.colHeader, s.colQty]}>Qty</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    {/* Rows */}
                    {packages.map((pkg, idx) => (
                        <View key={idx} style={s.tableRow}>
                            <Text style={[s.cellText, s.colSno]}>{pkg.sno || idx + 1}</Text>
                            <TextInput
                                style={[s.cellInput, s.colService]}
                                placeholder="Service name"
                                placeholderTextColor={Colors.charcoalLight}
                                value={pkg.name || ''}
                                onChangeText={v => updatePackage(idx, 'name', v)}
                            />
                            <TextInput
                                style={[s.cellInput, s.colRate]}
                                placeholder=""
                                placeholderTextColor={Colors.charcoalLight}
                                keyboardType="numeric"
                                value={pkg.price?.toString() || ''}
                                onChangeText={v => updatePackage(idx, 'price', parseInt(v) || 0)}
                            />
                            {/* Unit picker */}
                            <View style={[{ position: 'relative' }, s.colUnit]}>
                                <TouchableOpacity
                                    style={s.unitBtn}
                                    onPress={() => setOpenUnitIdx(openUnitIdx === idx ? null : idx)}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            s.unitBtnText,
                                            !pkg.unit && { color: Colors.charcoalLight },
                                        ]}
                                    >
                                        {pkg.unit || 'Select'}
                                    </Text>
                                    <Text style={s.chevron}>▾</Text>
                                </TouchableOpacity>
                                {openUnitIdx === idx && (
                                    <View style={s.unitDropdown}>
                                        {UNITS.map(u => (
                                            <TouchableOpacity
                                                key={u}
                                                style={[
                                                    s.unitDropdownItem,
                                                    pkg.unit === u && s.unitDropdownItemActive,
                                                ]}
                                                onPress={() => {
                                                    updatePackage(idx, 'unit', u);
                                                    setOpenUnitIdx(null);
                                                }}
                                            >
                                                <Text
                                                    style={[
                                                        s.unitDropdownText,
                                                        pkg.unit === u && {
                                                            color: Colors.primaryDark,
                                                        },
                                                    ]}
                                                >
                                                    {u}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                            <TextInput
                                style={[s.cellInput, s.colQty]}
                                placeholder=""
                                placeholderTextColor={Colors.charcoalLight}
                                keyboardType="numeric"
                                value={pkg.quantity?.toString() || ''}
                                onChangeText={v => updatePackage(idx, 'quantity', parseInt(v) || 0)}
                            />
                            <TouchableOpacity
                                onPress={() => removeRow(idx)}
                                style={s.removeBtn}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="close"
                                    size={14}
                                    color={packages.length === 1 ? Colors.border : Colors.danger}
                                />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={s.addRowBtn} onPress={addRow} activeOpacity={0.7}>
                    <Ionicons name="add" size={16} color={Colors.primary} />
                    <Text style={s.addRowText}>Add Row</Text>
                </TouchableOpacity>
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

    tableWrap: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        overflow: 'hidden',
        backgroundColor: Colors.surface,
    },
    tableHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
    },
    colHeader: {
        fontSize: 10,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 0.3,
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        gap: 4,
    },
    colSno: { width: 32, textAlign: 'center' },
    colService: { flex: 1 },
    colRate: { width: 70 },
    colUnit: { width: 80 },
    colQty: { width: 42 },

    cellText: {
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
        textAlign: 'center',
    },
    cellInput: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 6,
        fontSize: Typography.sm,
        color: Colors.charcoal,
        backgroundColor: Colors.surface,
    },
    removeBtn: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },

    unitBtn: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
    },
    unitBtnText: { fontSize: 10, color: Colors.charcoal, flex: 1 },
    chevron: { fontSize: 10, color: Colors.charcoalLight },
    unitDropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 6,
        zIndex: 200,
        maxHeight: 160,
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 10,
    },
    unitDropdownItem: {
        paddingHorizontal: 8,
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    unitDropdownItemActive: { backgroundColor: Colors.primaryLight },
    unitDropdownText: { fontSize: Typography.xs, color: Colors.charcoal },

    addRowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
    },
    addRowText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.primary,
    },
});

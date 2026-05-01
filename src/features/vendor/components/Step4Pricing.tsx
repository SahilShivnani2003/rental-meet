import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radii, Typography } from '@/theme/theme';
import { VendorService } from '@features/otherService/types/VendorService';
import Field from '@/components/UI/InputField';

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
                <View style={s.halfWrap}>
                    <Field
                        label="Starting Price (₹) *"
                        placeholder="e.g. 5000"
                        icon="cash-outline"
                        keyboardType="numeric"
                        value={data.startingPrice?.toString() || ''}
                        onChangeText={v => onChange('startingPrice', parseInt(v) || 0)}
                    />
                </View>
                <View style={s.halfWrap}>
                    <Field
                        label="Minimum Order (₹) *"
                        placeholder="e.g. 2000"
                        icon="wallet-outline"
                        keyboardType="numeric"
                        value={data.minimumOrderPrice?.toString() || ''}
                        onChangeText={v => onChange('minimumOrderPrice', parseInt(v) || 0)}
                    />
                </View>
            </View>

            {/* Rate List / Packages */}
            <View style={s.fieldWrap}>
                <Text style={s.tableLabel}>Rate List / Packages</Text>

                <View style={s.tableWrap}>
                    {/* Header */}
                    <View style={s.tableHeader}>
                        <Text style={[s.colHeader, s.colSno]}>#</Text>
                        <Text style={[s.colHeader, s.colService]}>Service</Text>
                        <Text style={[s.colHeader, s.colRate]}>Rate (₹)</Text>
                        <Text style={[s.colHeader, s.colUnit]}>Unit</Text>
                        <Text style={[s.colHeader, s.colQty]}>Qty</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    {/* Rows */}
                    {packages.map((pkg, idx) => (
                        <View
                            key={idx}
                            style={[
                                s.tableRow,
                                idx % 2 === 0 && { backgroundColor: Colors.background },
                            ]}
                        >
                            {/* S.No */}
                            <View style={[s.colSno, s.snoWrap]}>
                                <Text style={s.snoText}>{pkg.sno ?? idx + 1}</Text>
                            </View>

                            {/* Service name */}
                            <TextInput
                                style={[s.cellInput, s.colService]}
                                placeholder="Name"
                                placeholderTextColor={Colors.charcoalLight}
                                value={pkg.name || ''}
                                onChangeText={v => updatePackage(idx, 'name', v)}
                            />

                            {/* Rate */}
                            <TextInput
                                style={[s.cellInput, s.colRate]}
                                placeholder="0"
                                placeholderTextColor={Colors.charcoalLight}
                                keyboardType="numeric"
                                value={pkg.price?.toString() || ''}
                                onChangeText={v => updatePackage(idx, 'price', parseInt(v) || 0)}
                            />

                            {/* Unit picker */}
                            <View style={[s.colUnit, { position: 'relative' }]}>
                                <TouchableOpacity
                                    style={[
                                        s.unitBtn,
                                        openUnitIdx === idx && s.unitBtnOpen,
                                        pkg.unit && s.unitBtnFilled,
                                    ]}
                                    onPress={() => setOpenUnitIdx(openUnitIdx === idx ? null : idx)}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            s.unitBtnText,
                                            !pkg.unit && { color: Colors.charcoalLight },
                                            pkg.unit && { color: Colors.primary },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {pkg.unit || 'Unit'}
                                    </Text>
                                    <Ionicons
                                        name={openUnitIdx === idx ? 'chevron-up' : 'chevron-down'}
                                        size={10}
                                        color={Colors.charcoalLight}
                                    />
                                </TouchableOpacity>

                                {openUnitIdx === idx && (
                                    <View style={s.unitDropdown}>
                                        <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }}>
                                            {UNITS.map(u => {
                                                const active = pkg.unit === u;
                                                return (
                                                    <TouchableOpacity
                                                        key={u}
                                                        style={[
                                                            s.unitDropdownItem,
                                                            active && s.unitDropdownItemActive,
                                                        ]}
                                                        onPress={() => {
                                                            updatePackage(idx, 'unit', u);
                                                            setOpenUnitIdx(null);
                                                        }}
                                                    >
                                                        <Ionicons
                                                            name={
                                                                active
                                                                    ? 'checkmark-circle'
                                                                    : 'ellipse-outline'
                                                            }
                                                            size={12}
                                                            color={
                                                                active
                                                                    ? Colors.primary
                                                                    : Colors.border
                                                            }
                                                            style={{ marginRight: 5 }}
                                                        />
                                                        <Text
                                                            style={[
                                                                s.unitDropdownText,
                                                                active && s.unitDropdownTextActive,
                                                            ]}
                                                        >
                                                            {u}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            {/* Qty */}
                            <TextInput
                                style={[s.cellInput, s.colQty]}
                                placeholder="—"
                                placeholderTextColor={Colors.charcoalLight}
                                keyboardType="numeric"
                                value={pkg.quantity?.toString() || ''}
                                onChangeText={v => updatePackage(idx, 'quantity', parseInt(v) || 0)}
                            />

                            {/* Remove */}
                            <TouchableOpacity
                                onPress={() => removeRow(idx)}
                                style={s.removeBtn}
                                activeOpacity={0.7}
                                disabled={packages.length === 1}
                            >
                                <Ionicons
                                    name="trash-outline"
                                    size={14}
                                    color={packages.length === 1 ? Colors.border : Colors.danger}
                                />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* Add row */}
                <TouchableOpacity style={s.addRowBtn} onPress={addRow} activeOpacity={0.7}>
                    <View style={s.addRowIconWrap}>
                        <Ionicons name="add" size={15} color={Colors.primary} />
                    </View>
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

    // Starting Price + Min Order row
    rowWrap: { flexDirection: 'row', gap: Spacing.md },
    halfWrap: { flex: 1 },

    // Rate list section
    fieldWrap: { marginBottom: Spacing.lg },
    tableLabel: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 10,
    },

    // Table
    tableWrap: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.md,
        overflow: 'hidden',
        backgroundColor: Colors.surface,
    },
    tableHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.charcoal,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        gap: 4,
    },
    colHeader: {
        fontSize: 10,
        fontWeight: Typography.bold,
        color: Colors.white,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        gap: 4,
        backgroundColor: Colors.surface,
    },

    // Column widths
    colSno: { width: 28 },
    colService: { flex: 1 },
    colRate: { width: 68 },
    colUnit: { width: 76 },
    colQty: { width: 40 },

    // S.No badge
    snoWrap: { alignItems: 'center' },
    snoText: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        textAlign: 'center',
    },

    // Cell inputs
    cellInput: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: 6,
        paddingVertical: 7,
        fontSize: 12,
        color: Colors.charcoal,
        backgroundColor: Colors.background,
    },

    // Unit picker
    unitBtn: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: 6,
        paddingVertical: 7,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.background,
        gap: 2,
    },
    unitBtnOpen: { borderColor: Colors.primary },
    unitBtnFilled: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryLight },
    unitBtnText: { fontSize: 10, color: Colors.charcoal, flex: 1 },

    unitDropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        zIndex: 500,
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 10,
        minWidth: 120,
    },
    unitDropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    unitDropdownItemActive: { backgroundColor: Colors.primaryLight },
    unitDropdownText: { fontSize: 12, color: Colors.charcoal },
    unitDropdownTextActive: { color: Colors.primaryDark, fontWeight: Typography.semiBold },

    // Remove button
    removeBtn: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Radii.sm,
    },

    // Add row button
    addRowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xs,
        marginTop: 4,
    },
    addRowIconWrap: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: Colors.primaryLight,
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addRowText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.primary,
    },
});

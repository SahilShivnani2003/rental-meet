import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    Modal,
    Animated,
    Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radii, Typography } from '@/theme/theme';
import { VendorService } from '@features/otherService/types/VendorService';
import Field from '@/components/UI/InputField';

// ─── Types ──────────────────────────────────────────────────────────────────

type Props = {
    data: Partial<VendorService>;
    onChange: (key: keyof VendorService, value: any) => void;
};

type Package = {
    sno?: number;
    name?: string;
    price?: number;
    unit?: string;
    quantity?: number;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const PRIMARY = '#6C63FF';

const UNITS: { value: string; icon: string }[] = [
    { value: 'Per Day', icon: 'sunny-outline' },
    { value: 'Per Hour', icon: 'time-outline' },
    { value: 'Per Event', icon: 'calendar-outline' },
    { value: 'Per Person', icon: 'person-outline' },
    { value: 'Per Plate', icon: 'restaurant-outline' },
    { value: 'Per Photo', icon: 'camera-outline' },
    { value: 'Per Video', icon: 'videocam-outline' },
    { value: 'Fixed', icon: 'pricetag-outline' },
    { value: 'Custom', icon: 'create-outline' },
];

// ─── Unit Picker Bottom Sheet ────────────────────────────────────────────────

function UnitPickerSheet({
    visible,
    current,
    onSelect,
    onClose,
}: {
    visible: boolean;
    current?: string;
    onSelect: (unit: string) => void;
    onClose: () => void;
}) {
    const slide = useRef(new Animated.Value(400)).current;

    React.useEffect(() => {
        Animated.spring(slide, {
            toValue: visible ? 0 : 400,
            useNativeDriver: true,
            damping: 18,
            stiffness: 160,
        }).start();
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <TouchableOpacity style={sheet.backdrop} activeOpacity={1} onPress={onClose} />
            <Animated.View style={[sheet.container, { transform: [{ translateY: slide }] }]}>
                <View style={sheet.handle} />
                <Text style={sheet.title}>Select Unit</Text>
                <Text style={sheet.subtitle}>How is this service priced?</Text>

                <View style={sheet.grid}>
                    {UNITS.map(u => {
                        const active = current === u.value;
                        return (
                            <TouchableOpacity
                                key={u.value}
                                style={[sheet.unitCard, active && sheet.unitCardActive]}
                                onPress={() => {
                                    onSelect(u.value);
                                    onClose();
                                }}
                                activeOpacity={0.75}
                            >
                                <View
                                    style={[sheet.unitIconWrap, active && sheet.unitIconWrapActive]}
                                >
                                    <Ionicons
                                        name={u.icon}
                                        size={20}
                                        color={active ? PRIMARY : Colors.charcoalLight}
                                    />
                                </View>
                                <Text style={[sheet.unitLabel, active && sheet.unitLabelActive]}>
                                    {u.value}
                                </Text>
                                {active && (
                                    <View style={sheet.activeTick}>
                                        <Ionicons name="checkmark" size={10} color="#fff" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity style={sheet.cancel} onPress={onClose} activeOpacity={0.7}>
                    <Text style={sheet.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </Animated.View>
        </Modal>
    );
}

// ─── Package Row ─────────────────────────────────────────────────────────────

function PackageRow({
    pkg,
    idx,
    isLast,
    canRemove,
    onUpdate,
    onRemove,
    onOpenUnit,
}: {
    pkg: Package;
    idx: number;
    isLast: boolean;
    canRemove: boolean;
    onUpdate: (field: keyof Package, value: any) => void;
    onRemove: () => void;
    onOpenUnit: () => void;
}) {
    const isFilled = !!(pkg.name && pkg.price && pkg.unit);

    return (
        <View style={[row.wrap, !isLast && row.wrapBorder, isFilled && row.wrapFilled]}>
            {/* Row number */}
            <View style={[row.snoWrap, isFilled && row.snoWrapFilled]}>
                <Text style={[row.sno, isFilled && row.snoFilled]}>{pkg.sno ?? idx + 1}</Text>
            </View>

            {/* Fields */}
            <View style={row.fieldsCol}>
                {/* Service name */}
                <TextInput
                    style={row.nameInput}
                    placeholder="Service / package name"
                    placeholderTextColor={Colors.charcoalLight}
                    value={pkg.name || ''}
                    onChangeText={v => onUpdate('name', v)}
                />

                {/* Rate + Unit + Qty row */}
                <View style={row.metaRow}>
                    {/* Rate */}
                    <View style={row.rateWrap}>
                        <Text style={row.ratePrefix}>₹</Text>
                        <TextInput
                            style={row.rateInput}
                            placeholder="0"
                            placeholderTextColor={Colors.charcoalLight}
                            keyboardType="numeric"
                            value={pkg.price?.toString() || ''}
                            onChangeText={v => onUpdate('price', parseInt(v) || 0)}
                        />
                    </View>

                    {/* Unit pill */}
                    <TouchableOpacity
                        style={[row.unitBtn, pkg.unit && row.unitBtnFilled]}
                        onPress={onOpenUnit}
                        activeOpacity={0.8}
                    >
                        {pkg.unit ? (
                            <>
                                <Ionicons
                                    name={
                                        UNITS.find(u => u.value === pkg.unit)?.icon ??
                                        'pricetag-outline'
                                    }
                                    size={11}
                                    color={PRIMARY}
                                />
                                <Text style={row.unitBtnFilledText}>{pkg.unit}</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons
                                    name="pricetag-outline"
                                    size={11}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={row.unitBtnEmptyText}>Unit</Text>
                            </>
                        )}
                        <Ionicons
                            name="chevron-down"
                            size={10}
                            color={pkg.unit ? PRIMARY : Colors.charcoalLight}
                        />
                    </TouchableOpacity>

                    {/* Qty */}
                    <View style={row.qtyWrap}>
                        <Text style={row.qtyLabel}>Qty</Text>
                        <TextInput
                            style={row.qtyInput}
                            placeholder="—"
                            placeholderTextColor={Colors.charcoalLight}
                            keyboardType="numeric"
                            value={pkg.quantity?.toString() || ''}
                            onChangeText={v => onUpdate('quantity', parseInt(v) || 0)}
                        />
                    </View>
                </View>
            </View>

            {/* Remove */}
            <TouchableOpacity
                style={[row.removeBtn, !canRemove && row.removeBtnDisabled]}
                onPress={onRemove}
                activeOpacity={0.7}
                disabled={!canRemove}
            >
                <Ionicons
                    name="trash-outline"
                    size={15}
                    color={canRemove ? Colors.danger : Colors.border}
                />
            </TouchableOpacity>
        </View>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Step4Pricing({ data, onChange }: Props) {
    const packages: Package[] = data.packages?.length
        ? data.packages
        : [{ sno: 1, name: '', price: undefined, unit: '', quantity: undefined }];

    const [unitSheetFor, setUnitSheetFor] = useState<number | null>(null);

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

    // Summary stats
    const filledRows = packages.filter(p => p.name && p.price);
    const minPrice = filledRows.length ? Math.min(...filledRows.map(p => p.price!)) : null;
    const maxPrice = filledRows.length ? Math.max(...filledRows.map(p => p.price!)) : null;
    const startingFmt = data.startingPrice ? `₹${data.startingPrice.toLocaleString('en-IN')}` : '—';
    const minFmt = data.minimumOrderPrice
        ? `₹${data.minimumOrderPrice.toLocaleString('en-IN')}`
        : '—';

    return (
        <>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.container}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Header ──────────────────────────────────────────── */}
                <View style={s.headerRow}>
                    <View style={s.headerIcon}>
                        <Ionicons name="pricetags" size={18} color="#fff" />
                    </View>
                    <View>
                        <Text style={s.sectionTitle}>Service Details & Rates</Text>
                        <Text style={s.sectionSub}>Set your pricing and package list</Text>
                    </View>
                </View>

                {/* ── Starting Price + Minimum Order ───────────────────── */}
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

                {/* ── Live summary pill ─────────────────────────────────── */}
                {data.startingPrice || data.minimumOrderPrice ? (
                    <View style={s.summaryStrip}>
                        <View style={s.summaryItem}>
                            <Ionicons name="trending-up-outline" size={14} color={PRIMARY} />
                            <Text style={s.summaryLabel}>Starts at</Text>
                            <Text style={s.summaryValue}>{startingFmt}</Text>
                        </View>
                        <View style={s.summaryDivider} />
                        <View style={s.summaryItem}>
                            <Ionicons name="shield-checkmark-outline" size={14} color={PRIMARY} />
                            <Text style={s.summaryLabel}>Min order</Text>
                            <Text style={s.summaryValue}>{minFmt}</Text>
                        </View>
                        {filledRows.length > 0 && (
                            <>
                                <View style={s.summaryDivider} />
                                <View style={s.summaryItem}>
                                    <Ionicons name="list-outline" size={14} color={PRIMARY} />
                                    <Text style={s.summaryLabel}>Packages</Text>
                                    <Text style={s.summaryValue}>{filledRows.length}</Text>
                                </View>
                            </>
                        )}
                    </View>
                ) : null}

                {/* ── Rate List / Packages ──────────────────────────────── */}
                <View style={s.tableSection}>
                    <View style={s.tableLabelRow}>
                        <Text style={s.tableLabel}>Rate List / Packages</Text>
                        <View style={s.rowCountBadge}>
                            <Text style={s.rowCountText}>
                                {packages.length} row{packages.length !== 1 ? 's' : ''}
                            </Text>
                        </View>
                    </View>
                    <Text style={s.tableHint}>
                        Add individual services or bundles with rate and pricing unit.
                    </Text>

                    {/* Table header */}
                    <View style={s.tableHeader}>
                        <View style={s.thSno}>
                            <Text style={s.thText}>#</Text>
                        </View>
                        <Text style={[s.thText, { flex: 1 }]}>SERVICE / PACKAGE</Text>
                        <Text style={[s.thText, { width: 80 }]}>RATE</Text>
                        <Text style={[s.thText, { width: 74 }]}>UNIT</Text>
                        <Text style={[s.thText, { width: 44 }]}>QTY</Text>
                        <View style={{ width: 32 }} />
                    </View>

                    {/* Package rows */}
                    <View style={s.tableBody}>
                        {packages.map((pkg, idx) => (
                            <PackageRow
                                key={idx}
                                pkg={pkg}
                                idx={idx}
                                isLast={idx === packages.length - 1}
                                canRemove={packages.length > 1}
                                onUpdate={(field, val) => updatePackage(idx, field, val)}
                                onRemove={() => removeRow(idx)}
                                onOpenUnit={() => setUnitSheetFor(idx)}
                            />
                        ))}
                    </View>

                    {/* Add row */}
                    <TouchableOpacity style={s.addRowBtn} onPress={addRow} activeOpacity={0.75}>
                        <View style={s.addRowIconWrap}>
                            <Ionicons name="add" size={16} color={PRIMARY} />
                        </View>
                        <Text style={s.addRowText}>Add Row</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Info note ─────────────────────────────────────────── */}
                <View style={s.infoNote}>
                    <Ionicons name="information-circle-outline" size={15} color={PRIMARY} />
                    <Text style={s.infoNoteText}>
                        Customers will see your starting price and package list on your public
                        profile. Minimum order is for internal reference only.
                    </Text>
                </View>
            </ScrollView>

            {/* ── Unit Picker Sheet ─────────────────────────────────────── */}
            <UnitPickerSheet
                visible={unitSheetFor !== null}
                current={unitSheetFor !== null ? packages[unitSheetFor]?.unit : undefined}
                onSelect={val => {
                    if (unitSheetFor !== null) updatePackage(unitSheetFor, 'unit', val);
                }}
                onClose={() => setUnitSheetFor(null)}
            />
        </>
    );
}

// ─── Package Row Styles ───────────────────────────────────────────────────────

const row = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
        backgroundColor: Colors.surface,
    },
    wrapBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider ?? Colors.border,
    },
    wrapFilled: { backgroundColor: `${PRIMARY}05` },

    snoWrap: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: `${Colors.charcoalLight}20`,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        flexShrink: 0,
    },
    snoWrapFilled: { backgroundColor: `${PRIMARY}18` },
    sno: { fontSize: 11, fontWeight: '700', color: Colors.charcoalLight },
    snoFilled: { color: PRIMARY },

    fieldsCol: { flex: 1, gap: 7 },

    nameInput: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 8,
        fontSize: Typography.sm,
        color: Colors.charcoal,
        backgroundColor: Colors.background ?? Colors.surface,
    },

    metaRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },

    rateWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        backgroundColor: Colors.background ?? Colors.surface,
        paddingHorizontal: 6,
    },
    ratePrefix: {
        fontSize: 13,
        color: Colors.charcoalMid,
        fontWeight: Typography.semiBold,
        marginRight: 2,
    },
    rateInput: {
        flex: 1,
        paddingVertical: 7,
        fontSize: Typography.sm,
        color: Colors.charcoal,
    },

    unitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: 7,
        paddingVertical: 8,
        backgroundColor: Colors.background ?? Colors.surface,
        minWidth: 74,
    },
    unitBtnFilled: {
        borderColor: `${PRIMARY}55`,
        backgroundColor: `${PRIMARY}08`,
    },
    unitBtnEmptyText: { fontSize: 10, color: Colors.charcoalLight, flex: 1 },
    unitBtnFilledText: { fontSize: 10, color: PRIMARY, fontWeight: '600', flex: 1 },

    qtyWrap: {
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: 6,
        paddingVertical: 5,
        backgroundColor: Colors.background ?? Colors.surface,
        minWidth: 44,
    },
    qtyLabel: { fontSize: 8, color: Colors.charcoalLight, fontWeight: '600', letterSpacing: 0.4 },
    qtyInput: {
        fontSize: Typography.sm,
        color: Colors.charcoal,
        textAlign: 'center',
        paddingVertical: 0,
        minWidth: 28,
    },

    removeBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF0F0',
        marginTop: 6,
        flexShrink: 0,
    },
    removeBtnDisabled: { backgroundColor: Colors.surface },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    container: { paddingBottom: Spacing.xl },

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
        backgroundColor: PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    sectionSub: { fontSize: 11, color: Colors.charcoalLight, marginTop: 2 },

    rowWrap: { flexDirection: 'row', gap: Spacing.md },
    halfWrap: { flex: 1 },

    // Summary strip
    summaryStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${PRIMARY}08`,
        borderRadius: Radii.sm,
        borderWidth: 1,
        borderColor: `${PRIMARY}20`,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.lg,
    },
    summaryItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    summaryLabel: { fontSize: 10, color: Colors.charcoalLight, flex: 1 },
    summaryValue: { fontSize: 12, fontWeight: '700', color: Colors.charcoal },
    summaryDivider: { width: 1, height: 20, backgroundColor: `${PRIMARY}25`, marginHorizontal: 4 },

    // Table section
    tableSection: { marginBottom: Spacing.lg },
    tableLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: 4,
    },
    tableLabel: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    rowCountBadge: {
        backgroundColor: `${PRIMARY}12`,
        borderRadius: 5,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    rowCountText: { fontSize: 10, color: PRIMARY, fontWeight: '700' },
    tableHint: { fontSize: 11, color: Colors.charcoalLight, marginBottom: Spacing.md },

    tableHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.charcoal,
        paddingVertical: 9,
        paddingHorizontal: Spacing.md,
        borderTopLeftRadius: Radii.md ?? 12,
        borderTopRightRadius: Radii.md ?? 12,
        gap: 6,
    },
    thSno: { width: 24, alignItems: 'center' },
    thText: {
        fontSize: 9,
        fontWeight: Typography.bold,
        color: 'rgba(255,255,255,0.75)',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },

    tableBody: {
        borderWidth: 1.5,
        borderTopWidth: 0,
        borderColor: Colors.border,
        borderBottomLeftRadius: Radii.md ?? 12,
        borderBottomRightRadius: Radii.md ?? 12,
        overflow: 'hidden',
    },

    // Add row
    addRowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        paddingTop: Spacing.md,
        alignSelf: 'flex-start',
    },
    addRowIconWrap: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: `${PRIMARY}15`,
        borderWidth: 1.5,
        borderColor: `${PRIMARY}40`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addRowText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: PRIMARY,
    },

    // Info note
    infoNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        backgroundColor: `${PRIMARY}08`,
        borderRadius: Radii.sm,
        padding: Spacing.md,
    },
    infoNoteText: {
        flex: 1,
        fontSize: 11,
        color: Colors.charcoalLight,
        lineHeight: 16,
    },
});

// ─── Bottom Sheet Styles ──────────────────────────────────────────────────────

const sheet = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.xl,
        paddingTop: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 20,
    },
    handle: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E0E0E0',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.charcoal,
        letterSpacing: -0.3,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 13,
        color: Colors.charcoalLight,
        textAlign: 'center',
        marginTop: 4,
        marginBottom: Spacing.lg,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    unitCard: {
        width: '30%',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xs,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
        gap: 5,
        position: 'relative',
    },
    unitCardActive: {
        borderColor: PRIMARY,
        backgroundColor: `${PRIMARY}08`,
    },
    unitIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${Colors.charcoalLight}15`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unitIconWrapActive: { backgroundColor: `${PRIMARY}15` },
    unitLabel: {
        fontSize: 10,
        color: Colors.charcoalMid,
        fontWeight: '600',
        textAlign: 'center',
    },
    unitLabelActive: { color: PRIMARY },
    activeTick: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancel: {
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderRadius: Radii.sm,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cancelText: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.charcoalMid,
    },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii } from '../../theme/theme';
import Field from '../UI/input-field';
import {
    StepHeader,
    SectionCard,
    SectionTitle,
    NavButtons,
    PickerRow,
} from '../UI/shared-components';

// ─── Data ─────────────────────────────────────────────────────────────────────

const BASIC_AMENITIES = [
    { id: 'firstAid', name: 'First Aid Box', isDefault: true },
    { id: 'fireSafety', name: 'Fire & Safety', isDefault: true },
    { id: 'wifi', name: 'High-Speed WiFi' },
    { id: 'ac', name: 'Air Conditioning' },
    { id: 'projector', name: 'Projector' },
    { id: 'projScreen', name: 'Projection Screen' },
    { id: 'whiteboard', name: 'Whiteboard' },
    { id: 'soundSystem', name: 'Sound System' },
    { id: 'mic', name: 'Microphone' },
    { id: 'tv', name: 'LED / Smart TV' },
    { id: 'videoConf', name: 'Video Conferencing' },
    { id: 'confPhone', name: 'Conference Phone' },
    { id: 'seating', name: 'Comfortable Seating' },
    { id: 'printing', name: 'Printing / Photocopy' },
];

const BEVERAGES = [
    { id: 'tea', name: 'Tea', unit: 'Per Cup' },
    { id: 'coffee', name: 'Coffee', unit: 'Per Cup' },
    { id: 'water350', name: 'Water Bottle (350ml)', unit: 'Per Bottle' },
    { id: 'water500', name: 'Water Bottle (500ml)', unit: 'Per Bottle' },
    { id: 'water1l', name: 'Water Bottle (1 Ltr)', unit: 'Per Bottle' },
    { id: 'water2l', name: 'Water Bottle (2 Ltr)', unit: 'Per Bottle' },
    { id: 'dispenser', name: 'Water Dispenser (20 Ltr)', unit: 'Per Dispenser' },
    { id: 'soft350', name: 'Soft Drink (350ml)', unit: 'Per Bottle' },
    { id: 'soft750', name: 'Soft Drink (750ml)', unit: 'Per Bottle' },
    { id: 'soft1125', name: 'Soft Drink (1/1.25 Ltr)', unit: 'Per Bottle' },
    { id: 'soft2225', name: 'Soft Drink (2/2.25 Ltr)', unit: 'Per Bottle' },
];

const ADDITIONAL = [
    'Separate Washrooms',
    'Power Backup',
    'Security Personnel',
    'Daily Cleaning',
    'Reception Service',
    'Storage Space',
    'Valet Parking',
    'Wheelchair Access',
    'Elevator',
];

const SNACK_PACKS = [{ id: 'snack3', name: 'Snacks Pack (3 Items)' }];
const BREAKFAST_PACKS = [
    { id: 'bp1', name: 'Breakfast Pack (1 Item)' },
    { id: 'bp2', name: 'Breakfast Pack (2 Items)' },
    { id: 'bp3', name: 'Breakfast Pack (3 Items)' },
];
const THALI_TYPES = ['Select Thali Type', 'Regular', 'Special', 'Maharaja'];
const RATE_TYPES = ['Fixed', 'Per Use'];
const PRICING_OPTIONS = ['Select', 'Included', 'Paid'];

// ─── Types ────────────────────────────────────────────────────────────────────

type PricingType = 'included' | 'paid';
type AmenityData = { pricing: PricingType; rate: string; rateType: string; rateTypeOpen: boolean };
type BevData = { checked: boolean; rate: string; brand: string };
type PackData = { checked: boolean; rate: string; items: string };
type ThaliRow = { type: string; rate: string; items: string };

interface Props {
    onPrev: () => void;
    onNext: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Step3Amenities({ onPrev, onNext }: Props) {
    // Basic amenities
    const [basicSelected, setBasicSelected] = useState<string[]>(['firstAid', 'fireSafety']);
    const [amenityData, setAmenityData] = useState<Record<string, AmenityData>>({
        firstAid: { pricing: 'included', rate: '', rateType: 'Fixed', rateTypeOpen: false },
        fireSafety: { pricing: 'included', rate: '', rateType: 'Fixed', rateTypeOpen: false },
    });

    // Beverages
    const [beverageData, setBeverageData] = useState<Record<string, BevData>>({});

    // Additional
    const [additionalSelected, setAdditionalSelected] = useState<string[]>([]);

    // Food
    const [snackData, setSnackData] = useState<Record<string, PackData>>({});
    const [breakfastData, setBreakfastData] = useState<Record<string, PackData>>({});
    const [thalis, setThalis] = useState<ThaliRow[]>([]);

    // Kitchen / Dining
    const [kitchenAvail, setKitchenAvail] = useState(false);
    const [kitchenPricing, setKitchenPricing] = useState(PRICING_OPTIONS[0]);
    const [kitchenOpen, setKitchenOpen] = useState(false);
    const [diningAvail, setDiningAvail] = useState(false);
    const [diningPricing, setDiningPricing] = useState(PRICING_OPTIONS[0]);
    const [diningOpen, setDiningOpen] = useState(false);

    // ── Basic amenity helpers ─────────────────────────────────────────────────

    const toggleBasic = (id: string, isDefault?: boolean) => {
        if (isDefault) return;
        const nowSelected = !basicSelected.includes(id);
        setBasicSelected(p => (nowSelected ? [...p, id] : p.filter(x => x !== id)));
        if (nowSelected) {
            setAmenityData(p => ({
                ...p,
                [id]: p[id] ?? {
                    pricing: 'included',
                    rate: '',
                    rateType: 'Fixed',
                    rateTypeOpen: false,
                },
            }));
        }
    };

    const setAmenityPricing = (id: string, pricing: PricingType) =>
        setAmenityData(p => ({ ...p, [id]: { ...p[id], pricing, rate: '' } }));

    const setAmenityRate = (id: string, rate: string) =>
        setAmenityData(p => ({ ...p, [id]: { ...p[id], rate } }));

    const toggleRateTypeOpen = (id: string) =>
        setAmenityData(p => ({ ...p, [id]: { ...p[id], rateTypeOpen: !p[id]?.rateTypeOpen } }));

    const setAmenityRateType = (id: string, rateType: string) =>
        setAmenityData(p => ({ ...p, [id]: { ...p[id], rateType, rateTypeOpen: false } }));

    // ── Beverage helpers ──────────────────────────────────────────────────────

    const toggleBeverage = (id: string) =>
        setBeverageData(p => ({
            ...p,
            [id]: { checked: !p[id]?.checked, rate: p[id]?.rate || '', brand: p[id]?.brand || '' },
        }));

    const updateBev = (id: string, field: 'rate' | 'brand', value: string) =>
        setBeverageData(p => ({ ...p, [id]: { ...p[id], [field]: value } }));

    // ── Additional helpers ────────────────────────────────────────────────────

    const toggleAdditional = (name: string) =>
        setAdditionalSelected(p => (p.includes(name) ? p.filter(x => x !== name) : [...p, name]));

    // ── Food pack helpers ─────────────────────────────────────────────────────

    const togglePack = (
        id: string,
        setter: React.Dispatch<React.SetStateAction<Record<string, PackData>>>,
    ) =>
        setter(p => ({
            ...p,
            [id]: { checked: !p[id]?.checked, rate: p[id]?.rate || '', items: p[id]?.items || '' },
        }));

    const updatePack = (
        id: string,
        field: 'rate' | 'items',
        value: string,
        setter: React.Dispatch<React.SetStateAction<Record<string, PackData>>>,
    ) => setter(p => ({ ...p, [id]: { ...p[id], [field]: value } }));

    // ── Thali helpers ─────────────────────────────────────────────────────────

    const addThali = (type: string) => {
        if (type === THALI_TYPES[0]) return;
        setThalis(p => [...p, { type, rate: '', items: '' }]);
    };

    const removeThali = (idx: number) => setThalis(p => p.filter((_, i) => i !== idx));
    const updateThali = (idx: number, field: keyof ThaliRow, value: string) =>
        setThalis(p => p.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
        >
            <StepHeader title="Step 3: Amenities" current={3} />

            {/* ── Basic Amenities ── */}
            <SectionCard accentColor={Colors.primary}>
                <SectionTitle
                    icon="star-outline"
                    title="Basic Amenities"
                    subtitle="Select amenities and specify if they are included or paid"
                />

                {BASIC_AMENITIES.map(item => {
                    const selected = basicSelected.includes(item.id);
                    const data = amenityData[item.id];
                    return (
                        <View key={item.id} style={[s.amenCard, selected && s.amenCardActive]}>
                            {/* Checkbox row */}
                            <TouchableOpacity
                                style={s.amenRow}
                                onPress={() => toggleBasic(item.id, item.isDefault)}
                                activeOpacity={0.75}
                            >
                                <View style={[s.checkbox, selected && s.checkboxActive]}>
                                    {selected && (
                                        <Ionicons name="checkmark" size={11} color={Colors.white} />
                                    )}
                                </View>
                                <Text style={[s.amenText, selected && s.amenTextActive]}>
                                    {item.name}
                                </Text>
                                {item.isDefault && (
                                    <View style={s.defaultBadge}>
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={11}
                                            color={Colors.success}
                                        />
                                        <Text style={s.defaultBadgeText}>Included (Default)</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* Included / Paid expanded area */}
                            {selected && data && (
                                <View style={s.amenExpanded}>
                                    <View style={s.radioRow}>
                                        {/* Included radio */}
                                        <TouchableOpacity
                                            style={s.radioBtn}
                                            onPress={() => setAmenityPricing(item.id, 'included')}
                                            activeOpacity={0.7}
                                        >
                                            <View
                                                style={[
                                                    s.radioOuter,
                                                    data.pricing === 'included' &&
                                                        s.radioOuterActive,
                                                ]}
                                            >
                                                {data.pricing === 'included' && (
                                                    <View style={s.radioInner} />
                                                )}
                                            </View>
                                            <Text
                                                style={[
                                                    s.radioLabel,
                                                    data.pricing === 'included' &&
                                                        s.radioLabelActive,
                                                ]}
                                            >
                                                Included
                                            </Text>
                                        </TouchableOpacity>

                                        {/* Paid radio */}
                                        <TouchableOpacity
                                            style={s.radioBtn}
                                            onPress={() => setAmenityPricing(item.id, 'paid')}
                                            activeOpacity={0.7}
                                        >
                                            <View
                                                style={[
                                                    s.radioOuter,
                                                    data.pricing === 'paid' && s.radioOuterPaid,
                                                ]}
                                            >
                                                {data.pricing === 'paid' && (
                                                    <View
                                                        style={[s.radioInner, s.radioInnerPaid]}
                                                    />
                                                )}
                                            </View>
                                            <Text
                                                style={[
                                                    s.radioLabel,
                                                    data.pricing === 'paid' && s.radioLabelPaid,
                                                ]}
                                            >
                                                Paid
                                            </Text>
                                        </TouchableOpacity>

                                        {/* Rate + Fixed/Per Use — only when Paid */}
                                        {data.pricing === 'paid' && (
                                            <View style={s.rateRow}>
                                                <Text style={s.rateLabel}>Rate:</Text>
                                                <View style={s.rateInputBox}>
                                                    <Text style={s.rupee}>₹</Text>
                                                    <TextInput
                                                        style={s.rateInputText}
                                                        placeholder="0"
                                                        placeholderTextColor={Colors.charcoalLight}
                                                        value={data.rate}
                                                        onChangeText={v =>
                                                            setAmenityRate(item.id, v)
                                                        }
                                                        keyboardType="numeric"
                                                    />
                                                </View>
                                                <View style={s.miniPickerWrap}>
                                                    <PickerRow
                                                        value={data.rateType}
                                                        options={RATE_TYPES}
                                                        open={data.rateTypeOpen}
                                                        onToggle={() => toggleRateTypeOpen(item.id)}
                                                        onSelect={v =>
                                                            setAmenityRateType(item.id, v)
                                                        }
                                                    />
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}
                        </View>
                    );
                })}
            </SectionCard>

            {/* ── Beverages ── */}
            <SectionCard accentColor={Colors.info}>
                <SectionTitle
                    icon="cafe-outline"
                    title="Beverages"
                    subtitle="Select available beverages and set rates"
                    iconColor={Colors.info}
                    bgColor={Colors.infoLight}
                />
                {BEVERAGES.map(bev => {
                    const data = beverageData[bev.id];
                    const checked = !!data?.checked;
                    return (
                        <View key={bev.id}>
                            <TouchableOpacity
                                style={[s.amenCard, checked && s.amenCardActive]}
                                onPress={() => toggleBeverage(bev.id)}
                                activeOpacity={0.75}
                            >
                                <View style={s.amenRow}>
                                    <View style={[s.checkbox, checked && s.checkboxActive]}>
                                        {checked && (
                                            <Ionicons
                                                name="checkmark"
                                                size={11}
                                                color={Colors.white}
                                            />
                                        )}
                                    </View>
                                    <Text style={[s.amenText, checked && s.amenTextActive]}>
                                        {bev.name}
                                    </Text>
                                    <Text style={s.unitBadge}>{bev.unit}</Text>
                                </View>
                            </TouchableOpacity>

                            {checked && (
                                <View style={s.expandedFields}>
                                    <View style={s.fieldRow}>
                                        <View style={{ flex: 1 }}>
                                            <Field
                                                label="Rate (₹)"
                                                placeholder="0.00"
                                                icon="cash-outline"
                                                value={data?.rate || ''}
                                                onChangeText={(v: string) =>
                                                    updateBev(bev.id, 'rate', v)
                                                }
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Field
                                                label="Brand (optional)"
                                                placeholder="e.g. Bisleri"
                                                icon="pricetag-outline"
                                                value={data?.brand || ''}
                                                onChangeText={(v: string) =>
                                                    updateBev(bev.id, 'brand', v)
                                                }
                                            />
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    );
                })}
            </SectionCard>

            {/* ── Food Options ── */}
            <SectionCard accentColor={Colors.success}>
                <SectionTitle
                    icon="restaurant-outline"
                    title="Food Options"
                    subtitle="Select food packages and set rates"
                    iconColor={Colors.success}
                    bgColor={Colors.successLight}
                />

                {/* Snacks */}
                <Text style={s.foodGroupLabel}>Snacks</Text>
                {SNACK_PACKS.map(pack => {
                    const data = snackData[pack.id];
                    const checked = !!data?.checked;
                    return (
                        <View key={pack.id}>
                            <TouchableOpacity
                                style={[s.amenCard, checked && s.amenCardActive]}
                                onPress={() => togglePack(pack.id, setSnackData)}
                                activeOpacity={0.75}
                            >
                                <View style={s.amenRow}>
                                    <View style={[s.checkbox, checked && s.checkboxActive]}>
                                        {checked && (
                                            <Ionicons
                                                name="checkmark"
                                                size={11}
                                                color={Colors.white}
                                            />
                                        )}
                                    </View>
                                    <Text style={[s.amenText, checked && s.amenTextActive]}>
                                        {pack.name}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            {checked && (
                                <View style={s.expandedFields}>
                                    <View style={s.fieldRow}>
                                        <View style={{ flex: 1 }}>
                                            <Field
                                                label="Rate per plate (₹)"
                                                placeholder="0"
                                                icon="cash-outline"
                                                value={data?.rate || ''}
                                                onChangeText={(v: string) =>
                                                    updatePack(pack.id, 'rate', v, setSnackData)
                                                }
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Field
                                                label="Item names"
                                                placeholder="Samosa, Kachori..."
                                                icon="list-outline"
                                                value={data?.items || ''}
                                                onChangeText={(v: string) =>
                                                    updatePack(pack.id, 'items', v, setSnackData)
                                                }
                                            />
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    );
                })}

                {/* Breakfast */}
                <Text style={[s.foodGroupLabel, { marginTop: Spacing.md }]}>Breakfast Packs</Text>
                {BREAKFAST_PACKS.map(pack => {
                    const data = breakfastData[pack.id];
                    const checked = !!data?.checked;
                    return (
                        <View key={pack.id}>
                            <TouchableOpacity
                                style={[s.amenCard, checked && s.amenCardActive]}
                                onPress={() => togglePack(pack.id, setBreakfastData)}
                                activeOpacity={0.75}
                            >
                                <View style={s.amenRow}>
                                    <View style={[s.checkbox, checked && s.checkboxActive]}>
                                        {checked && (
                                            <Ionicons
                                                name="checkmark"
                                                size={11}
                                                color={Colors.white}
                                            />
                                        )}
                                    </View>
                                    <Text style={[s.amenText, checked && s.amenTextActive]}>
                                        {pack.name}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            {checked && (
                                <View style={s.expandedFields}>
                                    <View style={s.fieldRow}>
                                        <View style={{ flex: 1 }}>
                                            <Field
                                                label="Rate (₹)"
                                                placeholder="0"
                                                icon="cash-outline"
                                                value={data?.rate || ''}
                                                onChangeText={(v: string) =>
                                                    updatePack(pack.id, 'rate', v, setBreakfastData)
                                                }
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Field
                                                label="Item names"
                                                placeholder="Poha, Idli..."
                                                icon="list-outline"
                                                value={data?.items || ''}
                                                onChangeText={(v: string) =>
                                                    updatePack(
                                                        pack.id,
                                                        'items',
                                                        v,
                                                        setBreakfastData,
                                                    )
                                                }
                                            />
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    );
                })}

                {/* Lunch Thalis */}
                <Text style={[s.foodGroupLabel, { marginTop: Spacing.md }]}>Lunch Thalis</Text>
                <Text style={s.foodGroupSub}>
                    Select thali type, then choose categories (Regular/Special/Maharaja)
                </Text>
                <ThaliAddRow onAdd={addThali} />

                {thalis.length === 0 ? (
                    <View style={s.emptyThali}>
                        <Text style={s.emptyThaliText}>
                            No thalis added yet. Select from dropdown above.
                        </Text>
                    </View>
                ) : (
                    thalis.map((thali, idx) => (
                        <View key={idx} style={s.expandedFields}>
                            <View style={s.thaliHeader}>
                                <Text style={s.thaliType}>{thali.type} Thali</Text>
                                <TouchableOpacity onPress={() => removeThali(idx)} hitSlop={6}>
                                    <Ionicons name="close-circle" size={18} color={Colors.danger} />
                                </TouchableOpacity>
                            </View>
                            <View style={s.fieldRow}>
                                <View style={{ flex: 1 }}>
                                    <Field
                                        label="Rate (₹)"
                                        placeholder="0"
                                        icon="cash-outline"
                                        value={thali.rate}
                                        onChangeText={v => updateThali(idx, 'rate', v)}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Field
                                        label="Item names"
                                        placeholder="Dal, Sabzi, Roti..."
                                        icon="list-outline"
                                        value={thali.items}
                                        onChangeText={v => updateThali(idx, 'items', v)}
                                    />
                                </View>
                            </View>
                        </View>
                    ))
                )}

                {/* Kitchen & Dining */}
                <View style={[s.fieldRow, { marginTop: Spacing.md }]}>
                    <View style={{ flex: 1 }}>
                        <FacilityToggle
                            label="Kitchen Access"
                            available={kitchenAvail}
                            onToggle={() => setKitchenAvail(v => !v)}
                            pricing={kitchenPricing}
                            open={kitchenOpen}
                            onPricingToggle={() => setKitchenOpen(v => !v)}
                            onPricingSelect={v => {
                                setKitchenPricing(v);
                                setKitchenOpen(false);
                            }}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <FacilityToggle
                            label="Dining Area"
                            available={diningAvail}
                            onToggle={() => setDiningAvail(v => !v)}
                            pricing={diningPricing}
                            open={diningOpen}
                            onPricingToggle={() => setDiningOpen(v => !v)}
                            onPricingSelect={v => {
                                setDiningPricing(v);
                                setDiningOpen(false);
                            }}
                        />
                    </View>
                </View>
            </SectionCard>

            {/* ── Additional Facilities ── */}
            <SectionCard accentColor={Colors.warning}>
                <SectionTitle
                    icon="build-outline"
                    title="Additional Facilities"
                    subtitle="Select facilities available at your venue"
                    iconColor={Colors.warning}
                    bgColor={Colors.warningLight}
                />
                {ADDITIONAL.map(item => {
                    const selected = additionalSelected.includes(item);
                    return (
                        <TouchableOpacity
                            key={item}
                            style={[s.amenCard, selected && s.amenCardActive]}
                            onPress={() => toggleAdditional(item)}
                            activeOpacity={0.75}
                        >
                            <View style={s.amenRow}>
                                <View style={[s.checkbox, selected && s.checkboxActive]}>
                                    {selected && (
                                        <Ionicons name="checkmark" size={11} color={Colors.white} />
                                    )}
                                </View>
                                <Text style={[s.amenText, selected && s.amenTextActive]}>
                                    {item}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </SectionCard>

            <NavButtons onPrev={onPrev} onNext={onNext} />
        </ScrollView>
    );
}

// ─── ThaliAddRow ──────────────────────────────────────────────────────────────

function ThaliAddRow({ onAdd }: { onAdd: (type: string) => void }) {
    const [selected, setSelected] = useState(THALI_TYPES[0]);
    const [open, setOpen] = useState(false);
    return (
        <View style={ft.row}>
            <View style={{ flex: 1 }}>
                <PickerRow
                    value={selected}
                    options={THALI_TYPES}
                    open={open}
                    onToggle={() => setOpen(v => !v)}
                    onSelect={v => {
                        setSelected(v);
                        setOpen(false);
                    }}
                />
            </View>
            <TouchableOpacity
                style={ft.addBtn}
                onPress={() => {
                    onAdd(selected);
                    setSelected(THALI_TYPES[0]);
                }}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={16} color={Colors.white} />
                <Text style={ft.addBtnText}>Add</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── FacilityToggle ───────────────────────────────────────────────────────────

function FacilityToggle({
    label,
    available,
    onToggle,
    pricing,
    open,
    onPricingToggle,
    onPricingSelect,
}: {
    label: string;
    available: boolean;
    onToggle: () => void;
    pricing: string;
    open: boolean;
    onPricingToggle: () => void;
    onPricingSelect: (v: string) => void;
}) {
    return (
        <View style={ft.facilityCard}>
            <TouchableOpacity style={ft.facilityRow} onPress={onToggle} activeOpacity={0.8}>
                <View style={[ft.checkbox, available && ft.checkboxActive]}>
                    {available && <Ionicons name="checkmark" size={11} color={Colors.white} />}
                </View>
                <Text style={[ft.facilityLabel, available && ft.facilityLabelActive]}>{label}</Text>
            </TouchableOpacity>
            {available && (
                <View style={{ marginTop: Spacing.xs }}>
                    <PickerRow
                        value={pricing}
                        options={PRICING_OPTIONS}
                        open={open}
                        onToggle={onPricingToggle}
                        onSelect={onPricingSelect}
                    />
                </View>
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    amenCard: {
        borderRadius: Radii.sm,
        borderWidth: 1,
        borderColor: 'transparent',
        marginBottom: 4,
        backgroundColor: Colors.background,
        overflow: 'hidden',
    },
    amenCardActive: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryLight },
    amenRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: 11,
        paddingHorizontal: Spacing.sm,
    },
    amenText: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    amenTextActive: { color: Colors.primary, fontWeight: Typography.semiBold },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
        flexShrink: 0,
    },
    checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    defaultBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: Colors.successLight,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radii.full,
    },
    defaultBadgeText: {
        fontSize: Typography.xs,
        fontWeight: Typography.semiBold,
        color: Colors.success,
    },
    unitBadge: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        backgroundColor: Colors.background,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: Colors.border,
    },

    // Included / Paid expanded
    amenExpanded: { paddingHorizontal: Spacing.sm, paddingBottom: Spacing.sm },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    radioBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    radioOuter: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterActive: { borderColor: Colors.primary },
    radioOuterPaid: { borderColor: Colors.warning },
    radioInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.primary },
    radioInnerPaid: { backgroundColor: Colors.warning },
    radioLabel: { fontSize: Typography.sm, color: Colors.charcoalMid },
    radioLabelActive: { color: Colors.primary, fontWeight: Typography.semiBold },
    radioLabelPaid: { color: Colors.warning, fontWeight: Typography.semiBold },

    // Inline rate input
    rateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginLeft: Spacing.sm,
    },
    rateLabel: { fontSize: Typography.sm, color: Colors.charcoalMid },
    rateInputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.sm,
        height: 36,
        backgroundColor: Colors.surface,
        minWidth: 72,
    },
    rupee: { fontSize: Typography.sm, color: Colors.charcoalMid, marginRight: 2 },
    rateInputText: {
        fontSize: Typography.sm,
        color: Colors.charcoal,
        flex: 1,
        padding: 0,
    },
    miniPickerWrap: { width: 110 },

    // Expanded Field panels
    expandedFields: {
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.sm,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        padding: Spacing.sm,
        marginBottom: 4,
    },
    fieldRow: { flexDirection: 'row', gap: Spacing.sm },

    // Food
    foodGroupLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        marginBottom: Spacing.xs,
    },
    foodGroupSub: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        marginBottom: Spacing.sm,
    },
    emptyThali: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        borderRadius: Radii.sm,
        padding: Spacing.lg,
        alignItems: 'center',
        marginBottom: 4,
    },
    emptyThaliText: { fontSize: Typography.sm, color: Colors.charcoalLight },
    thaliHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    thaliType: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
    },
});

const ft = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: Spacing.sm,
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primary,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.md,
        height: 54,
        justifyContent: 'center',
    },
    addBtnText: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.white,
    },
    facilityCard: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        padding: Spacing.sm,
        backgroundColor: Colors.surface,
    },
    facilityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
    },
    checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    facilityLabel: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    facilityLabelActive: { color: Colors.primary, fontWeight: Typography.semiBold },
});

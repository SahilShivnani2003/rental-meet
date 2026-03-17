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
import { VenueFormData } from '../../types/venue.type';

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

type AmenityData = VenueFormData['amenities']['amenityData'][string];
type PricingType = 'included' | 'paid';

interface Props {
    data: VenueFormData['amenities'];
    onChange: (data: VenueFormData['amenities']) => void;
    onPrev: () => void;
    onNext: () => void;
}

export default function Step3Amenities({ data, onChange, onPrev, onNext }: Props) {
    const set = (patch: Partial<VenueFormData['amenities']>) => onChange({ ...data, ...patch });

    // ── Basic amenity helpers ─────────────────────────────────────────────────
    const toggleBasic = (id: string, isDefault?: boolean) => {
        if (isDefault) return;
        const nowSelected = !data.basicSelected.includes(id);
        const basicSelected = nowSelected
            ? [...data.basicSelected, id]
            : data.basicSelected.filter(x => x !== id);
        const amenityData =
            nowSelected && !data.amenityData[id]
                ? {
                      ...data.amenityData,
                      [id]: {
                          pricing: 'included' as PricingType,
                          rate: '',
                          rateType: 'Fixed',
                          rateTypeOpen: false,
                      },
                  }
                : data.amenityData;
        set({ basicSelected, amenityData });
    };

    const setAmenityPricing = (id: string, pricing: PricingType) =>
        set({
            amenityData: {
                ...data.amenityData,
                [id]: { ...data.amenityData[id], pricing, rate: '' },
            },
        });

    const setAmenityRate = (id: string, rate: string) =>
        set({ amenityData: { ...data.amenityData, [id]: { ...data.amenityData[id], rate } } });

    const toggleRateTypeOpen = (id: string) =>
        set({
            amenityData: {
                ...data.amenityData,
                [id]: {
                    ...data.amenityData[id],
                    rateTypeOpen: !data.amenityData[id]?.rateTypeOpen,
                },
            },
        });

    const setAmenityRateType = (id: string, rateType: string) =>
        set({
            amenityData: {
                ...data.amenityData,
                [id]: { ...data.amenityData[id], rateType, rateTypeOpen: false },
            },
        });

    // ── Beverage helpers ──────────────────────────────────────────────────────
    const toggleBeverage = (id: string) =>
        set({
            beverageData: {
                ...data.beverageData,
                [id]: {
                    checked: !data.beverageData[id]?.checked,
                    rate: data.beverageData[id]?.rate || '',
                    brand: data.beverageData[id]?.brand || '',
                },
            },
        });

    const updateBev = (id: string, field: 'rate' | 'brand', value: string) =>
        set({
            beverageData: {
                ...data.beverageData,
                [id]: { ...data.beverageData[id], [field]: value },
            },
        });

    // ── Additional ────────────────────────────────────────────────────────────
    const toggleAdditional = (name: string) =>
        set({
            additionalSelected: data.additionalSelected.includes(name)
                ? data.additionalSelected.filter(x => x !== name)
                : [...data.additionalSelected, name],
        });

    // ── Food pack helpers ─────────────────────────────────────────────────────
    type PackKey = 'snackData' | 'breakfastData';

    const togglePack = (id: string, packKey: PackKey) => {
        const prev = data[packKey];
        set({
            [packKey]: {
                ...prev,
                [id]: {
                    checked: !prev[id]?.checked,
                    rate: prev[id]?.rate || '',
                    items: prev[id]?.items || '',
                },
            },
        });
    };

    const updatePack = (id: string, field: 'rate' | 'items', value: string, packKey: PackKey) => {
        set({ [packKey]: { ...data[packKey], [id]: { ...data[packKey][id], [field]: value } } });
    };

    // ── Thali helpers ─────────────────────────────────────────────────────────
    const addThali = (type: string) => {
        if (type === THALI_TYPES[0]) return;
        set({ thalis: [...data.thalis, { type, rate: '', items: '' }] });
    };
    const removeThali = (idx: number) => set({ thalis: data.thalis.filter((_, i) => i !== idx) });
    const updateThali = (idx: number, field: 'type' | 'rate' | 'items', value: string) =>
        set({ thalis: data.thalis.map((t, i) => (i === idx ? { ...t, [field]: value } : t)) });

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
                    const selected = data.basicSelected.includes(item.id);
                    const d = data.amenityData[item.id];
                    return (
                        <View key={item.id} style={[s.amenCard, selected && s.amenCardActive]}>
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
                            {selected && d && (
                                <View style={s.amenExpanded}>
                                    <View style={s.radioRow}>
                                        <TouchableOpacity
                                            style={s.radioBtn}
                                            onPress={() => setAmenityPricing(item.id, 'included')}
                                            activeOpacity={0.7}
                                        >
                                            <View
                                                style={[
                                                    s.radioOuter,
                                                    d.pricing === 'included' && s.radioOuterActive,
                                                ]}
                                            >
                                                {d.pricing === 'included' && (
                                                    <View style={s.radioInner} />
                                                )}
                                            </View>
                                            <Text
                                                style={[
                                                    s.radioLabel,
                                                    d.pricing === 'included' && s.radioLabelActive,
                                                ]}
                                            >
                                                Included
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={s.radioBtn}
                                            onPress={() => setAmenityPricing(item.id, 'paid')}
                                            activeOpacity={0.7}
                                        >
                                            <View
                                                style={[
                                                    s.radioOuter,
                                                    d.pricing === 'paid' && s.radioOuterPaid,
                                                ]}
                                            >
                                                {d.pricing === 'paid' && (
                                                    <View
                                                        style={[s.radioInner, s.radioInnerPaid]}
                                                    />
                                                )}
                                            </View>
                                            <Text
                                                style={[
                                                    s.radioLabel,
                                                    d.pricing === 'paid' && s.radioLabelPaid,
                                                ]}
                                            >
                                                Paid
                                            </Text>
                                        </TouchableOpacity>
                                        {d.pricing === 'paid' && (
                                            <View style={s.rateRow}>
                                                <Text style={s.rateLabel}>Rate:</Text>
                                                <View style={s.rateInputBox}>
                                                    <Text style={s.rupee}>₹</Text>
                                                    <TextInput
                                                        style={s.rateInputText}
                                                        placeholder="0"
                                                        placeholderTextColor={Colors.charcoalLight}
                                                        value={d.rate}
                                                        onChangeText={v =>
                                                            setAmenityRate(item.id, v)
                                                        }
                                                        keyboardType="numeric"
                                                    />
                                                </View>
                                                <View style={s.miniPickerWrap}>
                                                    <PickerRow
                                                        value={d.rateType}
                                                        options={RATE_TYPES}
                                                        open={d.rateTypeOpen}
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
                    const d = data.beverageData[bev.id];
                    const checked = !!d?.checked;
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
                                                value={d?.rate || ''}
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
                                                value={d?.brand || ''}
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

                <Text style={s.foodGroupLabel}>Snacks</Text>
                {SNACK_PACKS.map(pack => {
                    const d = data.snackData[pack.id];
                    const checked = !!d?.checked;
                    return (
                        <View key={pack.id}>
                            <TouchableOpacity
                                style={[s.amenCard, checked && s.amenCardActive]}
                                onPress={() => togglePack(pack.id, 'snackData')}
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
                                                value={d?.rate || ''}
                                                onChangeText={(v: string) =>
                                                    updatePack(pack.id, 'rate', v, 'snackData')
                                                }
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Field
                                                label="Item names"
                                                placeholder="Samosa, Kachori..."
                                                icon="list-outline"
                                                value={d?.items || ''}
                                                onChangeText={(v: string) =>
                                                    updatePack(pack.id, 'items', v, 'snackData')
                                                }
                                            />
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    );
                })}

                <Text style={[s.foodGroupLabel, { marginTop: Spacing.md }]}>Breakfast Packs</Text>
                {BREAKFAST_PACKS.map(pack => {
                    const d = data.breakfastData[pack.id];
                    const checked = !!d?.checked;
                    return (
                        <View key={pack.id}>
                            <TouchableOpacity
                                style={[s.amenCard, checked && s.amenCardActive]}
                                onPress={() => togglePack(pack.id, 'breakfastData')}
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
                                                value={d?.rate || ''}
                                                onChangeText={(v: string) =>
                                                    updatePack(pack.id, 'rate', v, 'breakfastData')
                                                }
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Field
                                                label="Item names"
                                                placeholder="Poha, Idli..."
                                                icon="list-outline"
                                                value={d?.items || ''}
                                                onChangeText={(v: string) =>
                                                    updatePack(pack.id, 'items', v, 'breakfastData')
                                                }
                                            />
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    );
                })}

                <Text style={[s.foodGroupLabel, { marginTop: Spacing.md }]}>Lunch Thalis</Text>
                <Text style={s.foodGroupSub}>
                    Select thali type, then choose categories (Regular/Special/Maharaja)
                </Text>
                <ThaliAddRow onAdd={addThali} />
                {data.thalis.length === 0 ? (
                    <View style={s.emptyThali}>
                        <Text style={s.emptyThaliText}>
                            No thalis added yet. Select from dropdown above.
                        </Text>
                    </View>
                ) : (
                    data.thalis.map((thali, idx) => (
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

                <View style={[s.fieldRow, { marginTop: Spacing.md }]}>
                    <View style={{ flex: 1 }}>
                        <FacilityToggle
                            label="Kitchen Access"
                            available={data.kitchenAvail}
                            onToggle={() => set({ kitchenAvail: !data.kitchenAvail })}
                            pricing={data.kitchenPricing}
                            open={false}
                            onPricingToggle={() => {}}
                            onPricingSelect={v => set({ kitchenPricing: v })}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <FacilityToggle
                            label="Dining Area"
                            available={data.diningAvail}
                            onToggle={() => set({ diningAvail: !data.diningAvail })}
                            pricing={data.diningPricing}
                            open={false}
                            onPricingToggle={() => {}}
                            onPricingSelect={v => set({ diningPricing: v })}
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
                    const selected = data.additionalSelected.includes(item);
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

// ── Sub-components (unchanged from original) ──────────────────────────────────

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
    amenExpanded: { paddingHorizontal: Spacing.sm, paddingBottom: Spacing.sm },
    radioRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm },
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
    rateInputText: { fontSize: Typography.sm, color: Colors.charcoal, flex: 1, padding: 0 },
    miniPickerWrap: { width: 110 },
    expandedFields: {
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.sm,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        padding: Spacing.sm,
        marginBottom: 4,
    },
    fieldRow: { flexDirection: 'row', gap: Spacing.sm },
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
    thaliType: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.charcoalMid },
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
    addBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.white },
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

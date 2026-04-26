import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii } from '../../../theme/theme';
import Field from '../../../components/UI/InputField';
import {
    StepHeader,
    SectionCard,
    SectionTitle,
    NavButtons,
    PickerRow,
} from '../../../components/UI/shared-components';
import {
    VenueFormData,
    BasicAmenityForm,
    BeverageForm,
    FoodPackForm,
    ThaliForm,
    AdditionalForm,
    FacilityForm,
} from '../../types/Venue';

const THALI_TYPES = [
    'Select Thali Type',
    'North Indian Thali',
    'Punjabi Thali',
    'Non-Veg Thali',
    'South Indian Thali',
    'Gujarati Thali',
    'Rajasthani Thali',
    'Bengali Thali',
    'Maharashtrian Thali',
    'Kashmiri Thali',
    'Simple/Daily Thali',
    'Protein-Packed Thali',
    'Festive/Banquet Thali',
];

const THALI_CATEGORIES = ['Select Category', 'Regular Thali', 'Special Thali', 'Maharaja Thali'];

const RATE_TYPES: Array<'Fixed' | 'Per Use'> = ['Fixed', 'Per Use'];

interface Props {
    data: VenueFormData['amenities'];
    onChange: (data: VenueFormData['amenities']) => void;
    onPrev: () => void;
    onNext: () => void;
}

export default function Step3Amenities({ data, onChange, onPrev, onNext }: Props) {
    const set = (patch: Partial<VenueFormData['amenities']>) => onChange({ ...data, ...patch });

    // ── Generic array updaters ────────────────────────────────────────────────

    const updateBasic = (idx: number, patch: Partial<BasicAmenityForm>) =>
        set({ basic: data.basic.map((a, i) => (i === idx ? { ...a, ...patch } : a)) });

    const updateBeverage = (idx: number, patch: Partial<BeverageForm>) =>
        set({ beverages: data.beverages.map((b, i) => (i === idx ? { ...b, ...patch } : b)) });

    const updateFood = (idx: number, patch: Partial<FoodPackForm>) =>
        set({
            refreshmentFood: data.refreshmentFood.map((f, i) =>
                i === idx ? { ...f, ...patch } : f,
            ),
        });

    const updateThali = (idx: number, patch: Partial<ThaliForm>) =>
        set({ lunchThalis: data.lunchThalis.map((t, i) => (i === idx ? { ...t, ...patch } : t)) });

    const removeThali = (idx: number) =>
        set({ lunchThalis: data.lunchThalis.filter((_, i) => i !== idx) });

    const addThali = (thaliType: string) => {
        if (thaliType === THALI_TYPES[0]) return;
        set({
            lunchThalis: [
                ...data.lunchThalis,
                { thaliType, category: '', ratePerPlate: '', items: '' },
            ],
        });
    };

    const updateAdditional = (idx: number, patch: Partial<AdditionalForm>) =>
        set({ additional: data.additional.map((a, i) => (i === idx ? { ...a, ...patch } : a)) });

    const updateFacility = (key: 'kitchenAccess' | 'diningArea', patch: Partial<FacilityForm>) =>
        set({ [key]: { ...data[key], ...patch } });

    // ── Sections ──────────────────────────────────────────────────────────────

    const snacks = data.refreshmentFood.filter(f => f.category === 'Snack');
    const breakfast = data.refreshmentFood.filter(f => f.category === 'Breakfast');
    const foodIdx = (item: FoodPackForm) => data.refreshmentFood.indexOf(item);

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
                {data.basic.map((item, idx) => (
                    <View key={item.id} style={[s.amenCard, item.selected && s.amenCardActive]}>
                        <TouchableOpacity
                            style={s.amenRow}
                            onPress={() =>
                                !item.locked && updateBasic(idx, { selected: !item.selected })
                            }
                            activeOpacity={item.locked ? 1 : 0.75}
                        >
                            {/* Checkbox */}
                            <View
                                style={[
                                    s.checkbox,
                                    item.selected && s.checkboxActive,
                                    item.locked && s.checkboxLocked,
                                ]}
                            >
                                {item.locked ? (
                                    <Ionicons name="lock-closed" size={10} color={Colors.white} />
                                ) : (
                                    item.selected && (
                                        <Ionicons name="checkmark" size={11} color={Colors.white} />
                                    )
                                )}
                            </View>

                            <Text style={[s.amenText, item.selected && s.amenTextActive]}>
                                {item.name}
                            </Text>

                            {item.locked && (
                                <View style={s.lockedBadge}>
                                    <Ionicons
                                        name="shield-checkmark"
                                        size={11}
                                        color={Colors.danger}
                                    />
                                    <Text style={s.lockedBadgeText}>Mandatory</Text>
                                </View>
                            )}
                            {item.isDefault && !item.locked && (
                                <View style={s.defaultBadge}>
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={11}
                                        color={Colors.success}
                                    />
                                    <Text style={s.defaultBadgeText}>Default</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Pricing — only for non-locked selected items */}
                        {item.selected && !item.locked && (
                            <View style={s.amenExpanded}>
                                <View style={s.radioRow}>
                                    <PricingRadio
                                        value={item.type}
                                        onChange={v => updateBasic(idx, { type: v, rate: '' })}
                                    />
                                    {item.type === 'Paid' && (
                                        <View style={s.rateRow}>
                                            <Text style={s.rateLabel}>Rate:</Text>
                                            <View style={s.rateInputBox}>
                                                <Text style={s.rupee}>₹</Text>
                                                <TextInput
                                                    style={s.rateInputText}
                                                    placeholder="0"
                                                    placeholderTextColor={Colors.charcoalLight}
                                                    value={item.rate}
                                                    onChangeText={v =>
                                                        updateBasic(idx, { rate: v })
                                                    }
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                            <View style={s.miniPickerWrap}>
                                                <RateTypePicker
                                                    value={item.rateType}
                                                    onChange={v =>
                                                        updateBasic(idx, { rateType: v })
                                                    }
                                                />
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>
                ))}
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
                {data.beverages.map((bev, idx) => (
                    <View key={bev.id}>
                        <TouchableOpacity
                            style={[s.amenCard, bev.selected && s.amenCardActive]}
                            onPress={() => updateBeverage(idx, { selected: !bev.selected })}
                            activeOpacity={0.75}
                        >
                            <View style={s.amenRow}>
                                <View style={[s.checkbox, bev.selected && s.checkboxActive]}>
                                    {bev.selected && (
                                        <Ionicons name="checkmark" size={11} color={Colors.white} />
                                    )}
                                </View>
                                <Text style={[s.amenText, bev.selected && s.amenTextActive]}>
                                    {bev.name}
                                </Text>
                                <Text style={s.unitBadge}>{bev.unit}</Text>
                            </View>
                        </TouchableOpacity>
                        {bev.selected && (
                            <View style={s.expandedFields}>
                                <View style={s.fieldRow}>
                                    <View style={{ flex: 1 }}>
                                        <Field
                                            label="Rate (₹)"
                                            placeholder="0.00"
                                            icon="cash-outline"
                                            value={bev.ratePerUnit}
                                            onChangeText={(v: string) =>
                                                updateBeverage(idx, { ratePerUnit: v })
                                            }
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Field
                                            label="Brand (optional)"
                                            placeholder="e.g. Bisleri"
                                            icon="pricetag-outline"
                                            value={bev.brand}
                                            onChangeText={(v: string) =>
                                                updateBeverage(idx, { brand: v })
                                            }
                                        />
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                ))}
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
                {snacks.map(pack => {
                    const idx = foodIdx(pack);
                    return (
                        <View key={pack.id}>
                            <TouchableOpacity
                                style={[s.amenCard, pack.selected && s.amenCardActive]}
                                onPress={() => updateFood(idx, { selected: !pack.selected })}
                                activeOpacity={0.75}
                            >
                                <View style={s.amenRow}>
                                    <View style={[s.checkbox, pack.selected && s.checkboxActive]}>
                                        {pack.selected && (
                                            <Ionicons
                                                name="checkmark"
                                                size={11}
                                                color={Colors.white}
                                            />
                                        )}
                                    </View>
                                    <Text style={[s.amenText, pack.selected && s.amenTextActive]}>
                                        {pack.name}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            {pack.selected && (
                                <View style={s.expandedFields}>
                                    <View style={s.fieldRow}>
                                        <View style={{ flex: 1 }}>
                                            <Field
                                                label="Rate per plate (₹)"
                                                placeholder="0"
                                                icon="cash-outline"
                                                value={pack.ratePerPlate}
                                                onChangeText={(v: string) =>
                                                    updateFood(idx, { ratePerPlate: v })
                                                }
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Field
                                                label="Item names"
                                                placeholder="Samosa, Kachori..."
                                                icon="list-outline"
                                                value={pack.items}
                                                onChangeText={(v: string) =>
                                                    updateFood(idx, { items: v })
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
                {breakfast.map(pack => {
                    const idx = foodIdx(pack);
                    return (
                        <View key={pack.id}>
                            <TouchableOpacity
                                style={[s.amenCard, pack.selected && s.amenCardActive]}
                                onPress={() => updateFood(idx, { selected: !pack.selected })}
                                activeOpacity={0.75}
                            >
                                <View style={s.amenRow}>
                                    <View style={[s.checkbox, pack.selected && s.checkboxActive]}>
                                        {pack.selected && (
                                            <Ionicons
                                                name="checkmark"
                                                size={11}
                                                color={Colors.white}
                                            />
                                        )}
                                    </View>
                                    <Text style={[s.amenText, pack.selected && s.amenTextActive]}>
                                        {pack.name}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            {pack.selected && (
                                <View style={s.expandedFields}>
                                    <View style={s.fieldRow}>
                                        <View style={{ flex: 1 }}>
                                            <Field
                                                label="Rate (₹)"
                                                placeholder="0"
                                                icon="cash-outline"
                                                value={pack.ratePerPlate}
                                                onChangeText={(v: string) =>
                                                    updateFood(idx, { ratePerPlate: v })
                                                }
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Field
                                                label="Item names"
                                                placeholder="Poha, Idli..."
                                                icon="list-outline"
                                                value={pack.items}
                                                onChangeText={(v: string) =>
                                                    updateFood(idx, { items: v })
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
                <Text style={s.foodGroupSub}>Select thali type and add rate + items</Text>
                <ThaliAddRow onAdd={addThali} />
                {data.lunchThalis.length === 0 ? (
                    <View style={s.emptyThali}>
                        <Text style={s.emptyThaliText}>
                            No thalis added yet. Select from dropdown above.
                        </Text>
                    </View>
                ) : (
                    data.lunchThalis.map((thali, idx) => (
                        <ThaliCard
                            key={idx}
                            thali={thali}
                            idx={idx}
                            onUpdate={updateThali}
                            onRemove={removeThali}
                        />
                    ))
                )}

                {/* Kitchen & Dining */}
                <View style={[s.fieldRow, { marginTop: Spacing.md }]}>
                    <View style={{ flex: 1 }}>
                        <FacilityToggle
                            label="Kitchen Access"
                            data={data.kitchenAccess}
                            onChange={p => updateFacility('kitchenAccess', p)}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <FacilityToggle
                            label="Dining Area"
                            data={data.diningArea}
                            onChange={p => updateFacility('diningArea', p)}
                        />
                    </View>
                </View>
            </SectionCard>

            {/* ── Additional Facilities ── */}
            <SectionCard accentColor={Colors.warning}>
                <SectionTitle
                    icon="build-outline"
                    title="Additional Facilities"
                    subtitle="Select facilities and specify if they are included or paid"
                    iconColor={Colors.warning}
                    bgColor={Colors.warningLight}
                />
                {data.additional.map((item, idx) => (
                    <View key={item.name} style={[s.amenCard, item.selected && s.amenCardActive]}>
                        <TouchableOpacity
                            style={s.amenRow}
                            onPress={() =>
                                updateAdditional(idx, {
                                    selected: !item.selected,
                                    type: 'Included',
                                    rate: '',
                                })
                            }
                            activeOpacity={0.75}
                        >
                            <View style={[s.checkbox, item.selected && s.checkboxActive]}>
                                {item.selected && (
                                    <Ionicons name="checkmark" size={11} color={Colors.white} />
                                )}
                            </View>
                            <Text style={[s.amenText, item.selected && s.amenTextActive]}>
                                {item.name}
                            </Text>
                        </TouchableOpacity>

                        {item.selected && (
                            <View style={s.amenExpanded}>
                                <View style={s.radioRow}>
                                    <PricingRadio
                                        value={item.type}
                                        onChange={v => updateAdditional(idx, { type: v, rate: '' })}
                                    />
                                </View>
                                {item.type === 'Paid' && (
                                    <View style={[s.rateRow, { marginTop: Spacing.xs }]}>
                                        <Text style={s.rateLabel}>Rate:</Text>
                                        <View style={s.rateInputBox}>
                                            <Text style={s.rupee}>₹</Text>
                                            <TextInput
                                                style={s.rateInputText}
                                                placeholder="0"
                                                placeholderTextColor={Colors.charcoalLight}
                                                value={item.rate}
                                                onChangeText={v =>
                                                    updateAdditional(idx, { rate: v })
                                                }
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                ))}
            </SectionCard>

            <NavButtons onPrev={onPrev} onNext={onNext} />
        </ScrollView>
    );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

/** Included / Paid radio pair */
function PricingRadio({
    value,
    onChange,
}: {
    value: 'Included' | 'Paid';
    onChange: (v: 'Included' | 'Paid') => void;
}) {
    return (
        <>
            <TouchableOpacity
                style={s.radioBtn}
                onPress={() => onChange('Included')}
                activeOpacity={0.7}
            >
                <View style={[s.radioOuter, value === 'Included' && s.radioOuterActive]}>
                    {value === 'Included' && <View style={s.radioInner} />}
                </View>
                <Text style={[s.radioLabel, value === 'Included' && s.radioLabelActive]}>
                    Included
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={s.radioBtn}
                onPress={() => onChange('Paid')}
                activeOpacity={0.7}
            >
                <View style={[s.radioOuter, value === 'Paid' && s.radioOuterPaid]}>
                    {value === 'Paid' && <View style={[s.radioInner, s.radioInnerPaid]} />}
                </View>
                <Text style={[s.radioLabel, value === 'Paid' && s.radioLabelPaid]}>Paid</Text>
            </TouchableOpacity>
        </>
    );
}

/** Inline rate-type picker (Fixed / Per Use) */
function RateTypePicker({
    value,
    onChange,
}: {
    value: 'Fixed' | 'Per Use';
    onChange: (v: 'Fixed' | 'Per Use') => void;
}) {
    const [open, setOpen] = useState(false);
    return (
        <PickerRow
            value={value}
            options={RATE_TYPES}
            open={open}
            onToggle={() => setOpen(o => !o)}
            onSelect={v => {
                onChange(v as 'Fixed' | 'Per Use');
                setOpen(false);
            }}
        />
    );
}

/** Thali add row */
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
                    onToggle={() => setOpen(o => !o)}
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

/** Kitchen / Dining facility toggle */
function FacilityToggle({
    label,
    data,
    onChange,
}: {
    label: string;
    data: FacilityForm;
    onChange: (patch: Partial<FacilityForm>) => void;
}) {
    return (
        <View style={ft.facilityCard}>
            <TouchableOpacity
                style={ft.facilityRow}
                onPress={() => onChange({ available: !data.available, type: 'Included', rate: '' })}
                activeOpacity={0.8}
            >
                <View style={[ft.checkbox, data.available && ft.checkboxActive]}>
                    {data.available && <Ionicons name="checkmark" size={11} color={Colors.white} />}
                </View>
                <Text style={[ft.facilityLabel, data.available && ft.facilityLabelActive]}>
                    {label}
                </Text>
            </TouchableOpacity>

            {data.available && (
                <>
                    <View style={[s.radioRow, { marginTop: Spacing.xs }]}>
                        <PricingRadio
                            value={data.type}
                            onChange={v => onChange({ type: v, rate: '' })}
                        />
                    </View>
                    {data.type === 'Paid' && (
                        <View style={[s.rateRow, { marginTop: Spacing.xs }]}>
                            <Text style={s.rateLabel}>Rate:</Text>
                            <View style={s.rateInputBox}>
                                <Text style={s.rupee}>₹</Text>
                                <TextInput
                                    style={s.rateInputText}
                                    placeholder="0"
                                    placeholderTextColor={Colors.charcoalLight}
                                    value={data.rate}
                                    onChangeText={v => onChange({ rate: v })}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    )}
                </>
            )}
        </View>
    );
}

/** Individual thali card with type label, category picker, rate + items */
function ThaliCard({
    thali,
    idx,
    onUpdate,
    onRemove,
}: {
    thali: ThaliForm;
    idx: number;
    onUpdate: (idx: number, patch: Partial<ThaliForm>) => void;
    onRemove: (idx: number) => void;
}) {
    const [catOpen, setCatOpen] = useState(false);
    const categoryValue = thali.category || THALI_CATEGORIES[0];

    return (
        <View style={s.expandedFields}>
            {/* Header — thali type name + remove */}
            <View style={s.thaliHeader}>
                <Text style={s.thaliType}>{thali.thaliType}</Text>
                <TouchableOpacity onPress={() => onRemove(idx)} hitSlop={6}>
                    <Ionicons name="close-circle" size={18} color={Colors.danger} />
                </TouchableOpacity>
            </View>

            {/* Category picker */}
            <Text style={s.thaliCategoryLabel}>
                Category <Text style={{ color: Colors.danger }}>*</Text>
            </Text>
            <View style={{ marginBottom: Spacing.sm }}>
                <PickerRow
                    value={categoryValue}
                    options={THALI_CATEGORIES}
                    open={catOpen}
                    onToggle={() => setCatOpen(o => !o)}
                    onSelect={v => {
                        onUpdate(idx, { category: v === THALI_CATEGORIES[0] ? '' : v });
                        setCatOpen(false);
                    }}
                />
            </View>

            {/* Rate + Items */}
            <View style={s.fieldRow}>
                <View style={{ flex: 1 }}>
                    <Field
                        label="Rate per plate (₹)"
                        placeholder="0"
                        icon="cash-outline"
                        value={thali.ratePerPlate}
                        onChangeText={v => onUpdate(idx, { ratePerPlate: v })}
                        keyboardType="numeric"
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Field
                        label="Item names"
                        placeholder="Dal, Sabzi, Roti..."
                        icon="list-outline"
                        value={thali.items}
                        onChangeText={v => onUpdate(idx, { items: v })}
                    />
                </View>
            </View>
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
    checkboxLocked: { backgroundColor: Colors.danger, borderColor: Colors.danger },
    lockedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: Colors.dangerLight ?? '#fff0f0',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radii.full,
    },
    lockedBadgeText: {
        fontSize: Typography.xs,
        fontWeight: Typography.semiBold,
        color: Colors.danger,
    },
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
    thaliCategoryLabel: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        marginBottom: 5,
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

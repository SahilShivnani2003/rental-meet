import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii } from '../../theme/theme';
import Field from '../UI/input-field';
import { StepHeader, SectionCard, SectionTitle, NavButtons } from '../UI/shared-components';

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

interface Props {
    onPrev: () => void;
    onNext: () => void;
}

type BevData = { checked: boolean; rate: string; brand: string };

export default function Step3Amenities({ onPrev, onNext }: Props) {
    const [basicSelected, setBasicSelected] = useState<string[]>(['firstAid', 'fireSafety']);
    const [beverageData, setBeverageData] = useState<Record<string, BevData>>({});
    const [additionalSelected, setAdditionalSelected] = useState<string[]>([]);
    // Track which beverage is expanded for Field inputs
    const [expandedBev, setExpandedBev] = useState<string | null>(null);

    const toggleBasic = (id: string, isDefault?: boolean) => {
        if (isDefault) return;
        setBasicSelected(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
    };

    const toggleBeverage = (id: string) => {
        setBeverageData(p => ({
            ...p,
            [id]: { checked: !p[id]?.checked, rate: p[id]?.rate || '', brand: p[id]?.brand || '' },
        }));
        setExpandedBev(prev => (prev === id ? null : id));
    };

    const updateBev = (id: string, field: 'rate' | 'brand', value: string) =>
        setBeverageData(p => ({ ...p, [id]: { ...p[id], [field]: value } }));

    const toggleAdditional = (name: string) =>
        setAdditionalSelected(p => (p.includes(name) ? p.filter(x => x !== name) : [...p, name]));

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
        >
            <StepHeader title="Step 3: Amenities" current={3} />

            {/* Basic Amenities */}
            <SectionCard accentColor={Colors.primary}>
                <SectionTitle
                    icon="star-outline"
                    title="Basic Amenities"
                    subtitle="Select amenities and specify if they are included or paid"
                />
                {BASIC_AMENITIES.map(item => {
                    const selected = basicSelected.includes(item.id);
                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={[s.amenRow, selected && s.amenRowActive]}
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
                    );
                })}
            </SectionCard>

            {/* Beverages */}
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
                                style={[
                                    s.amenRow,
                                    checked && s.amenRowActive,
                                    { marginBottom: checked ? 0 : 4 },
                                ]}
                                onPress={() => toggleBeverage(bev.id)}
                                activeOpacity={0.75}
                            >
                                <View style={[s.checkbox, checked && s.checkboxActive]}>
                                    {checked && (
                                        <Ionicons name="checkmark" size={11} color={Colors.white} />
                                    )}
                                </View>
                                <Text style={[s.amenText, checked && s.amenTextActive]}>
                                    {bev.name}
                                </Text>
                                <Text style={s.unitBadge}>{bev.unit}</Text>
                            </TouchableOpacity>

                            {/* Expanded rate + brand inputs using Field */}
                            {checked && (
                                <View style={s.bevFields}>
                                    <View style={s.bevFieldRow}>
                                        <View style={{ flex: 1 }}>
                                            <Field
                                                label="Rate (₹)"
                                                placeholder="0.00"
                                                icon="logo-usd"
                                                value={data?.rate || ''}
                                                onChangeText={(v: any) =>
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
                                                onChangeText={(v: any) =>
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

            {/* Additional Facilities */}
            <SectionCard accentColor={Colors.warning}>
                <SectionTitle
                    icon="build-outline"
                    title="Additional Facilities"
                    subtitle="Select facilities and specify if they are included or paid"
                    iconColor={Colors.warning}
                    bgColor={Colors.warningLight}
                />
                {ADDITIONAL.map(item => {
                    const selected = additionalSelected.includes(item);
                    return (
                        <TouchableOpacity
                            key={item}
                            style={[s.amenRow, selected && s.amenRowActive]}
                            onPress={() => toggleAdditional(item)}
                            activeOpacity={0.75}
                        >
                            <View style={[s.checkbox, selected && s.checkboxActive]}>
                                {selected && (
                                    <Ionicons name="checkmark" size={11} color={Colors.white} />
                                )}
                            </View>
                            <Text style={[s.amenText, selected && s.amenTextActive]}>{item}</Text>
                        </TouchableOpacity>
                    );
                })}
            </SectionCard>

            <NavButtons onPrev={onPrev} onNext={onNext} />
        </ScrollView>
    );
}

const s = StyleSheet.create({
    amenRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: 11,
        paddingHorizontal: Spacing.sm,
        borderRadius: Radii.sm,
        borderWidth: 1,
        borderColor: 'transparent',
        marginBottom: 4,
        backgroundColor: Colors.background,
    },
    amenRowActive: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryLight },
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
    bevFields: {
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.sm,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        padding: Spacing.sm,
        marginBottom: 4,
    },
    bevFieldRow: { flexDirection: 'row', gap: Spacing.sm },
});

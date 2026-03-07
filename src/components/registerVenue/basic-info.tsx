import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii } from '../../theme/theme';
import { StepHeader, SectionCard, PickerRow, NavButtons, Textarea } from '../UI/shared-components';
import Field from '../UI/input-field';

const VENUE_TYPES = [
    'Conference Hall',
    'Banquet Hall',
    'Marriage Garden',
    'Function Hall',
    'Meeting Hall',
    'Party Hall',
    'Training Room',
];
const CAPACITY_RANGES = [
    'Select capacity range',
    '1–50',
    '51–100',
    '101–200',
    '201–500',
    '501–1000',
    '1000+',
];

interface Props {
    onNext: () => void;
}

export default function Step1BasicInfo({ onNext }: Props) {
    const [venueName, setVenueName] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [capacity, setCapacity] = useState(CAPACITY_RANGES[0]);
    const [capOpen, setCapOpen] = useState(false);
    const [totalArea, setTotalArea] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const wordCount = description.trim() === '' ? 0 : description.trim().split(/\s+/).length;

    const toggleType = (type: string) =>
        setSelectedTypes(p => (p.includes(type) ? p.filter(t => t !== type) : [...p, type]));

    const validate = () => {
        const e: Record<string, string> = {};
        if (!venueName.trim()) e.venueName = 'Venue name is required';
        if (selectedTypes.length === 0) e.venueType = 'Select at least one venue type';
        if (!description.trim()) e.description = 'Description is required';
        if (wordCount > 200) e.description = 'Maximum 200 words allowed';
        if (capacity === CAPACITY_RANGES[0]) e.capacity = 'Select a capacity range';
        if (!totalArea.trim()) e.totalArea = 'Total area is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
        >
            <StepHeader title="Step 1: Basic Info" current={1} />

            <SectionCard>
                <Field
                    label="Business/Venue Name"
                    placeholder="Elite Conference Center"
                    icon="business-outline"
                    value={venueName}
                    onChangeText={v => {
                        setVenueName(v);
                        setErrors(p => ({ ...p, venueName: '' }));
                    }}
                    error={errors.venueName}
                />

                {/* Venue Type multi-select */}
                <View style={s.typeSection}>
                    <Text style={s.typeLabel}>
                        VENUE TYPE <Text style={s.req}>*</Text>
                    </Text>
                    <View style={s.typeGrid}>
                        {VENUE_TYPES.map(type => {
                            const active = selectedTypes.includes(type);
                            return (
                                <TouchableOpacity
                                    key={type}
                                    style={[s.typeChip, active && s.typeChipActive]}
                                    onPress={() => {
                                        toggleType(type);
                                        setErrors(p => ({ ...p, venueType: '' }));
                                    }}
                                    activeOpacity={0.75}
                                >
                                    {active && (
                                        <Ionicons
                                            name="checkmark"
                                            size={11}
                                            color={Colors.primary}
                                            style={{ marginRight: 3 }}
                                        />
                                    )}
                                    <Text style={[s.typeText, active && s.typeTextActive]}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    {!!errors.venueType && (
                        <View style={s.errorRow}>
                            <Ionicons name="alert-circle" size={12} color={Colors.danger} />
                            <Text style={s.errorText}>{errors.venueType}</Text>
                        </View>
                    )}
                </View>

                <Textarea
                    label={`Venue Description (Max 200 words) *  —  ${wordCount}/200`}
                    placeholder="Modern conference space with premium amenities, perfect for corporate meetings and events..."
                    value={description}
                    onChangeText={v => {
                        setDescription(v);
                        setErrors(p => ({ ...p, description: '' }));
                    }}
                    numberOfLines={5}
                    style={s.textarea}
                />
                {!!errors.description && (
                    <View style={[s.errorRow, { marginTop: -Spacing.sm }]}>
                        <Ionicons name="alert-circle" size={12} color={Colors.danger} />
                        <Text style={s.errorText}>{errors.description}</Text>
                    </View>
                )}

                {/* Capacity picker */}
                <View style={s.pickerSection}>
                    <Text style={s.typeLabel}>
                        MAXIMUM CAPACITY <Text style={s.req}>*</Text>
                    </Text>
                    <PickerRow
                        value={capacity}
                        options={CAPACITY_RANGES}
                        open={capOpen}
                        onToggle={() => setCapOpen(!capOpen)}
                        onSelect={v => {
                            setCapacity(v);
                            setCapOpen(false);
                            setErrors(p => ({ ...p, capacity: '' }));
                        }}
                    />
                    {!!errors.capacity && (
                        <View style={s.errorRow}>
                            <Ionicons name="alert-circle" size={12} color={Colors.danger} />
                            <Text style={s.errorText}>{errors.capacity}</Text>
                        </View>
                    )}
                </View>

                <Field
                    label="Total Area (sq.ft)"
                    placeholder="1000"
                    icon="resize-outline"
                    value={totalArea}
                    onChangeText={v => {
                        setTotalArea(v);
                        setErrors(p => ({ ...p, totalArea: '' }));
                    }}
                    keyboardType="numeric"
                    error={errors.totalArea}
                />
            </SectionCard>

            <NavButtons
                onNext={() => {
                    if (validate()) onNext();
                }}
                showPrev={false}
            />
        </ScrollView>
    );
}

const s = StyleSheet.create({
    typeSection: { marginBottom: Spacing.md },
    typeLabel: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 7,
    },
    req: { color: Colors.primary },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: 7,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    typeChipActive: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryLight },
    typeText: {
        fontSize: Typography.sm,
        fontWeight: Typography.medium,
        color: Colors.charcoalLight,
    },
    typeTextActive: { color: Colors.primary, fontWeight: Typography.bold },
    textarea: { height: 120 },
    pickerSection: { marginBottom: Spacing.md },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
    errorText: { fontSize: 11, color: Colors.danger, fontWeight: Typography.semiBold },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ADVANCE_OPTIONS = [
    'Select option',
    '2 hours',
    '4 hours',
    '1 day',
    '2 days',
    '3 days',
    '1 week',
];
const PRICE_ROWS = [
    { key: 'perHour', label: 'Per Hour' },
    { key: 'halfDay', label: 'Half Day (4 hrs)' },
    { key: 'fullDay', label: 'Full Day (8 hrs)' },
    { key: 'extraHour', label: 'Extra Hour Rate' },
];

interface Props {
    onPrev: () => void;
    onNext: () => void;
}

export default function Step4Pricing({ onPrev, onNext }: Props) {
    const [prices, setPrices] = useState<Record<string, { weekday: string; weekend: string }>>({});
    const [openTime, setOpenTime] = useState('');
    const [closeTime, setCloseTime] = useState('');
    const [availDays, setAvailDays] = useState<string[]>([]);
    const [advanceBooking, setAdvanceBooking] = useState(ADVANCE_OPTIONS[0]);
    const [advOpen, setAdvOpen] = useState(false);
    const [blackoutDate, setBlackoutDate] = useState('');

    const updatePrice = (key: string, type: 'weekday' | 'weekend', value: string) =>
        setPrices(p => ({ ...p, [key]: { ...p[key], [type]: value } }));

    const toggleDay = (day: string) =>
        setAvailDays(p => (p.includes(day) ? p.filter(d => d !== day) : [...p, day]));

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
        >
            <StepHeader title="Step 4: Pricing" current={4} />

            {/* Pricing Structure — each row uses two Field components side by side */}
            <SectionCard accentColor={Colors.primary}>
                <SectionTitle icon="logo-usd" title="Pricing Structure" />
                <View style={s.tableHeader}>
                    <Text style={[s.colHead, { flex: 1.3 }]}>Period</Text>
                    <Text style={[s.colHead, { flex: 1 }]}>Weekday</Text>
                    <Text style={[s.colHead, { flex: 1 }]}>Weekend</Text>
                </View>
                {PRICE_ROWS.map(row => (
                    <View key={row.key} style={s.priceRow}>
                        <Text style={s.priceLabel}>{row.label}</Text>
                        <View style={{ flex: 1 }}>
                            <Field
                                label=""
                                placeholder="₹ 0"
                                icon="logo-usd"
                                value={prices[row.key]?.weekday || ''}
                                onChangeText={(v: any) => updatePrice(row.key, 'weekday', v)}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Field
                                label=""
                                placeholder="₹ 0"
                                icon="logo-usd"
                                value={prices[row.key]?.weekend || ''}
                                onChangeText={(v: any) => updatePrice(row.key, 'weekend', v)}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                ))}
            </SectionCard>

            {/* Availability Schedule */}
            <SectionCard accentColor={Colors.info}>
                <SectionTitle
                    icon="time-outline"
                    title="Availability Schedule"
                    iconColor={Colors.info}
                    bgColor={Colors.infoLight}
                />

                <View style={s.row}>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="Opening Time"
                            placeholder="09:00 AM"
                            icon="time-outline"
                            value={openTime}
                            onChangeText={setOpenTime}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="Closing Time"
                            placeholder="09:00 PM"
                            icon="time-outline"
                            value={closeTime}
                            onChangeText={setCloseTime}
                        />
                    </View>
                </View>

                <Text style={s.sectionLabel}>
                    AVAILABLE DAYS <Text style={s.req}>*</Text>
                </Text>
                <View style={s.daysGrid}>
                    {DAYS.map(day => {
                        const active = availDays.includes(day);
                        return (
                            <TouchableOpacity
                                key={day}
                                style={[s.dayChip, active && s.dayChipActive]}
                                onPress={() => toggleDay(day)}
                                activeOpacity={0.75}
                            >
                                <Text style={[s.dayText, active && s.dayTextActive]}>
                                    {day.slice(0, 3)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={{ marginTop: Spacing.md }}>
                    <Text style={s.sectionLabel}>
                        MINIMUM ADVANCE BOOKING <Text style={s.req}>*</Text>
                    </Text>
                    <PickerRow
                        value={advanceBooking}
                        options={ADVANCE_OPTIONS}
                        open={advOpen}
                        onToggle={() => setAdvOpen(!advOpen)}
                        onSelect={(v: any) => {
                            setAdvanceBooking(v);
                            setAdvOpen(false);
                        }}
                    />
                </View>
            </SectionCard>

            {/* Blackout Dates */}
            <SectionCard accentColor={Colors.danger}>
                <SectionTitle
                    icon="calendar-outline"
                    title="Blackout Dates (Optional)"
                    subtitle="Dates when venue is unavailable for booking"
                    iconColor={Colors.danger}
                    bgColor={Colors.dangerLight}
                />
                <Field
                    label="Date"
                    placeholder="dd-mm-yyyy"
                    icon="calendar-outline"
                    value={blackoutDate}
                    onChangeText={setBlackoutDate}
                />
                <Text style={s.hint}>
                    Note: You can add multiple blackout dates after venue approval
                </Text>
            </SectionCard>

            <NavButtons onPrev={onPrev} onNext={onNext} />
        </ScrollView>
    );
}

const s = StyleSheet.create({
    tableHeader: {
        flexDirection: 'row',
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1.5,
        borderBottomColor: Colors.border,
        marginBottom: 4,
    },
    colHead: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        textAlign: 'center',
    },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    priceLabel: {
        flex: 1.3,
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    row: { flexDirection: 'row', gap: Spacing.sm },
    sectionLabel: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 7,
    },
    req: { color: Colors.primary },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    dayChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    dayChipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryBorder },
    dayText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalLight,
    },
    dayTextActive: { color: Colors.primary },
    hint: { fontSize: Typography.xs, color: Colors.charcoalLight, marginTop: -Spacing.sm },
});

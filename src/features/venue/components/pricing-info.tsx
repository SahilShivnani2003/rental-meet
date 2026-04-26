import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    FlatList,
    Platform,
} from 'react-native';
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
import { VenueFormData } from '../../types/Venue';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ADVANCE_OPTIONS = [
    'Select option',
    'Same day allowed',
    '24 hours in advance',
    '48 hours in advance',
    '1 week in advance',
];
const PRICE_ROWS = [
    { key: 'perHour', label: 'Per Hour' },
    { key: 'halfDay', label: 'Half Day (4 hrs)' },
    { key: 'fullDay', label: 'Full Day (8 hrs)' },
    { key: 'extraHour', label: 'Extra Hour Rate' },
];

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')); // 01-12
const MINUTES = ['00', '15', '30', '45'];
const PERIODS = ['AM', 'PM'];

const ITEM_H = 48; // height of each drum item

// ─── Drum column ──────────────────────────────────────────────────────────────
function DrumColumn({
    items,
    selected,
    onSelect,
    width = 64,
}: {
    items: string[];
    selected: string;
    onSelect: (v: string) => void;
    width?: number;
}) {
    const ref = useRef<FlatList>(null);
    const idx = items.indexOf(selected);

    return (
        <View style={[dc.wrap, { width }]}>
            {/* faded top / bottom overlays */}
            <View style={dc.fadeTop} pointerEvents="none" />
            <View style={dc.fadeBottom} pointerEvents="none" />
            {/* centre highlight bar */}
            <View style={dc.highlight} pointerEvents="none" />

            <FlatList
                ref={ref}
                data={items}
                keyExtractor={i => i}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_H}
                decelerationRate="fast"
                initialScrollIndex={Math.max(idx, 0)}
                getItemLayout={(_, index) => ({
                    length: ITEM_H,
                    offset: ITEM_H * index,
                    index,
                })}
                contentContainerStyle={{ paddingVertical: ITEM_H }}
                renderItem={({ item }) => {
                    const active = item === selected;
                    return (
                        <TouchableOpacity
                            style={dc.item}
                            activeOpacity={0.7}
                            onPress={() => {
                                onSelect(item);
                                ref.current?.scrollToIndex({
                                    index: items.indexOf(item),
                                    animated: true,
                                });
                            }}
                        >
                            <Text style={[dc.itemText, active && dc.itemTextActive]}>{item}</Text>
                        </TouchableOpacity>
                    );
                }}
                onMomentumScrollEnd={e => {
                    const newIdx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
                    const clamped = Math.max(0, Math.min(newIdx, items.length - 1));
                    onSelect(items[clamped]);
                }}
            />
        </View>
    );
}

// ─── Time Picker Modal ────────────────────────────────────────────────────────
interface TimePickerModalProps {
    visible: boolean;
    label: string;
    value: string; // "09:00 AM"
    onDone: (v: string) => void;
    onClose: () => void;
}

function parseTime(v: string) {
    const match = v.match(/^(\d{2}):(\d{2})\s?(AM|PM)$/i);
    if (match) return { h: match[1], m: match[2], p: match[3].toUpperCase() };
    return { h: '09', m: '00', p: 'AM' };
}

function TimePickerModal({ visible, label, value, onDone, onClose }: TimePickerModalProps) {
    const parsed = parseTime(value);
    const [h, setH] = useState(parsed.h);
    const [m, setM] = useState(parsed.m);
    const [p, setP] = useState(parsed.p);

    // reset whenever dialog opens with a fresh value
    React.useEffect(() => {
        if (visible) {
            const { h: ph, m: pm, p: pp } = parseTime(value);
            setH(ph);
            setM(pm);
            setP(pp);
        }
    }, [visible, value]);

    const confirm = () => {
        onDone(`${h}:${m} ${p}`);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <TouchableOpacity style={tp.backdrop} activeOpacity={1} onPress={onClose} />

            <View style={tp.sheet}>
                {/* Header */}
                <View style={tp.header}>
                    <TouchableOpacity onPress={onClose} hitSlop={8}>
                        <Ionicons name="close" size={20} color={Colors.charcoalMid} />
                    </TouchableOpacity>
                    <Text style={tp.title}>{label}</Text>
                    <TouchableOpacity onPress={confirm} hitSlop={8}>
                        <Text style={tp.done}>Done</Text>
                    </TouchableOpacity>
                </View>

                {/* Preview */}
                <View style={tp.preview}>
                    <Ionicons name="time-outline" size={18} color={Colors.primary} />
                    <Text style={tp.previewText}>
                        {h}:{m} {p}
                    </Text>
                </View>

                {/* Drums */}
                <View style={tp.drums}>
                    <DrumColumn items={HOURS} selected={h} onSelect={setH} width={72} />
                    <Text style={tp.colon}>:</Text>
                    <DrumColumn items={MINUTES} selected={m} onSelect={setM} width={72} />
                    <DrumColumn items={PERIODS} selected={p} onSelect={setP} width={64} />
                </View>

                {/* Quick presets */}
                <Text style={tp.presetsLabel}>Quick select</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={tp.presets}
                >
                    {[
                        '06:00 AM',
                        '07:00 AM',
                        '08:00 AM',
                        '09:00 AM',
                        '10:00 AM',
                        '12:00 PM',
                        '01:00 PM',
                        '05:00 PM',
                        '06:00 PM',
                        '08:00 PM',
                        '09:00 PM',
                        '10:00 PM',
                    ].map(t => {
                        const active = `${h}:${m} ${p}` === t;
                        return (
                            <TouchableOpacity
                                key={t}
                                style={[tp.preset, active && tp.presetActive]}
                                onPress={() => {
                                    const { h: ph, m: pm, p: pp } = parseTime(t);
                                    setH(ph);
                                    setM(pm);
                                    setP(pp);
                                }}
                                activeOpacity={0.75}
                            >
                                <Text style={[tp.presetText, active && tp.presetTextActive]}>
                                    {t}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <TouchableOpacity style={tp.confirmBtn} onPress={confirm} activeOpacity={0.85}>
                    <Text style={tp.confirmText}>Confirm</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

// ─── Time Field (trigger button) ──────────────────────────────────────────────
function TimeField({
    label,
    value,
    onPress,
}: {
    label: string;
    value: string;
    onPress: () => void;
}) {
    const hasValue = value && value !== '';
    return (
        <View style={tf.wrap}>
            <Text style={tf.label}>{label}</Text>
            <TouchableOpacity style={tf.btn} onPress={onPress} activeOpacity={0.8}>
                <Ionicons
                    name="time-outline"
                    size={18}
                    color={hasValue ? Colors.primary : Colors.charcoalLight}
                />
                <Text style={[tf.value, !hasValue && tf.placeholder]}>
                    {hasValue ? value : 'Select time'}
                </Text>
                <Ionicons name="chevron-down" size={15} color={Colors.charcoalLight} />
            </TouchableOpacity>
        </View>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
    data: VenueFormData['pricing'];
    onChange: (data: VenueFormData['pricing']) => void;
    onPrev: () => void;
    onNext: () => void;
}

export default function Step4Pricing({ data, onChange, onPrev, onNext }: Props) {
    const set = (patch: Partial<VenueFormData['pricing']>) => onChange({ ...data, ...patch });

    const [advOpen, setAdvOpen] = useState(false);
    const [openPickerOpen, setOpenPickerOpen] = useState(false);
    const [closePickerOpen, setClosePickerOpen] = useState(false);

    const updatePrice = (key: string, type: 'weekday' | 'weekend', value: string) =>
        set({ prices: { ...data.prices, [key]: { ...data.prices[key], [type]: value } } });

    const toggleDay = (day: string) =>
        set({
            availDays: data.availDays.includes(day)
                ? data.availDays.filter(d => d !== day)
                : [...data.availDays, day],
        });

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
        >
            <StepHeader title="Step 4: Pricing" current={4} />

            {/* ── Pricing Structure ── */}
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
                                icon=""
                                value={data.prices[row.key]?.weekday || ''}
                                onChangeText={(v: any) => updatePrice(row.key, 'weekday', v)}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Field
                                label=""
                                placeholder="₹ 0"
                                icon=""
                                value={data.prices[row.key]?.weekend || ''}
                                onChangeText={(v: any) => updatePrice(row.key, 'weekend', v)}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                ))}
            </SectionCard>

            {/* ── Availability Schedule ── */}
            <SectionCard accentColor={Colors.info}>
                <SectionTitle
                    icon="time-outline"
                    title="Availability Schedule"
                    iconColor={Colors.info}
                    bgColor={Colors.infoLight}
                />

                {/* Time pickers */}
                <View style={s.row}>
                    <View style={{ flex: 1 }}>
                        <TimeField
                            label="Opening Time"
                            value={data.openTime}
                            onPress={() => setOpenPickerOpen(true)}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <TimeField
                            label="Closing Time"
                            value={data.closeTime}
                            onPress={() => setClosePickerOpen(true)}
                        />
                    </View>
                </View>

                {/* Available Days */}
                <Text style={s.sectionLabel}>
                    AVAILABLE DAYS <Text style={s.req}>*</Text>
                </Text>
                <View style={s.daysGrid}>
                    {DAYS.map(day => {
                        const active = data.availDays.includes(day);
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

                {/* Advance Booking */}
                <View style={{ marginTop: Spacing.md }}>
                    <Text style={s.sectionLabel}>
                        MINIMUM ADVANCE BOOKING <Text style={s.req}>*</Text>
                    </Text>
                    <PickerRow
                        value={data.advanceBooking}
                        options={ADVANCE_OPTIONS}
                        open={advOpen}
                        onToggle={() => setAdvOpen(!advOpen)}
                        onSelect={v => {
                            set({ advanceBooking: v });
                            setAdvOpen(false);
                        }}
                    />
                </View>
            </SectionCard>

            {/* ── Blackout Dates ── */}
            <SectionCard accentColor={Colors.danger}>
                <SectionTitle
                    icon="calendar-outline"
                    title="Blackout Dates (Optional)"
                    subtitle="Dates when venue is unavailable"
                    iconColor={Colors.danger}
                    bgColor={Colors.dangerLight}
                />
                <Field
                    label="Date"
                    placeholder="dd-mm-yyyy"
                    icon="calendar-outline"
                    value={data.blackoutDate}
                    onChangeText={v => set({ blackoutDate: v })}
                />
                <Text style={s.hint}>
                    Note: You can add multiple blackout dates after venue approval
                </Text>
            </SectionCard>

            <NavButtons onPrev={onPrev} onNext={onNext} />

            {/* ── Time Picker Modals ── */}
            <TimePickerModal
                visible={openPickerOpen}
                label="Opening Time"
                value={data.openTime || '09:00 AM'}
                onDone={v => set({ openTime: v })}
                onClose={() => setOpenPickerOpen(false)}
            />
            <TimePickerModal
                visible={closePickerOpen}
                label="Closing Time"
                value={data.closeTime || '09:00 PM'}
                onDone={v => set({ closeTime: v })}
                onClose={() => setClosePickerOpen(false)}
            />
        </ScrollView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

// TimeField styles
const tf = StyleSheet.create({
    wrap: { marginBottom: Spacing.sm },
    label: {
        fontSize: Typography.xs,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
        marginBottom: 5,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: 13,
        backgroundColor: Colors.surface,
    },
    value: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.charcoal,
        fontWeight: Typography.medium,
    },
    placeholder: { color: Colors.charcoalLight, fontWeight: Typography.regular },
});

// TimePicker modal styles
const tp = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        paddingTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    title: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    done: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },
    preview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.primaryLight,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    previewText: {
        fontSize: 28,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: 2,
    },
    drums: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: ITEM_H * 3,
        overflow: 'hidden',
        marginVertical: Spacing.md,
        gap: 4,
    },
    colon: {
        fontSize: 28,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        marginBottom: 4,
    },
    presetsLabel: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    presets: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    preset: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 7,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
    },
    presetActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryBorder },
    presetText: {
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    presetTextActive: { color: Colors.primary, fontWeight: Typography.semiBold },
    confirmBtn: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.sm,
        backgroundColor: Colors.primary,
        borderRadius: Radii.md,
        paddingVertical: 14,
        alignItems: 'center',
    },
    confirmText: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.white,
    },
});

// DrumColumn styles
const dc = StyleSheet.create({
    wrap: {
        height: ITEM_H * 3,
        overflow: 'hidden',
        position: 'relative',
    },
    item: {
        height: ITEM_H,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemText: {
        fontSize: 22,
        fontWeight: Typography.medium,
        color: Colors.charcoalLight,
    },
    itemTextActive: {
        fontSize: 26,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    highlight: {
        position: 'absolute',
        top: ITEM_H,
        left: 4,
        right: 4,
        height: ITEM_H,
        borderRadius: Radii.sm,
        backgroundColor: Colors.primaryLight,
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        zIndex: 0,
    },
    fadeTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: ITEM_H,
        zIndex: 1,
        backgroundColor: Colors.surface,
        opacity: 0.7,
    },
    fadeBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: ITEM_H,
        zIndex: 1,
        backgroundColor: Colors.surface,
        opacity: 0.7,
    },
});

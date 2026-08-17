import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radii, Typography } from '@/theme/theme';
import { VendorService } from '@features/otherService/types/VendorService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Field from '@/components/UI/InputField';

// ─── Types ─────────────────────────────────────────────────────────────────

type Props = {
    data: Partial<VendorService>;
    onChange: (key: keyof VendorService, value: any) => void;
};

// ─── Constants ─────────────────────────────────────────────────────────────

const PRIMARY = Colors.primary;

export const CATEGORIES = [
    { value: 'Catering & Food', icon: 'restaurant-outline' },

    { value: 'Makeup & Beauty', icon: 'sparkles-outline' },

    { value: 'Photography & Video', icon: 'camera-outline' },

    { value: 'Entertainment', icon: 'musical-notes-outline' },

    { value: 'Decor & Floral', icon: 'flower-outline' },

    { value: 'Security', icon: 'shield-outline' },

    { value: 'Celebrity', icon: 'star-outline' },

    { value: 'Logistics & Support', icon: 'cube-outline' },
];

// Required fields for progress
const REQUIRED_FIELDS = ['title', 'companyName', 'category', 'experienceYears', 'description'];

// ─── Category Picker Field ─────────────────────────────────────────────────

type CategoryPickerProps = {
    value: string;
    open: boolean;
    onToggle: () => void;
    onSelect: (v: string) => void;
};

function CategoryPicker({ value, open, onToggle, onSelect }: CategoryPickerProps) {
    const selected = CATEGORIES.find(c => c.value === value);

    return (
        <View style={pk.wrap}>
            <Text style={pk.label}>
                Category <Text style={pk.required}>*</Text>
            </Text>
            <TouchableOpacity
                style={[pk.btn, open && pk.btnOpen]}
                onPress={onToggle}
                activeOpacity={0.8}
            >
                <View style={[pk.iconWrap, open && pk.iconWrapActive]}>
                    <Ionicons
                        name={(selected?.icon ?? 'apps-outline') as any}
                        size={16}
                        color={open ? PRIMARY : value ? Colors.charcoalMid : Colors.charcoalLight}
                    />
                </View>
                <Text style={[pk.btnText, !value && pk.btnPlaceholder]} numberOfLines={1}>
                    {value || 'Select category'}
                </Text>
                <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={15}
                    color={open ? PRIMARY : Colors.charcoalLight}
                />
            </TouchableOpacity>
            {open && (
                <View style={pk.dropdown}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }}>
                        {CATEGORIES.map(c => {
                            const active = value === c.value;
                            return (
                                <TouchableOpacity
                                    key={c.value}
                                    style={[pk.item, active && pk.itemActive]}
                                    onPress={() => onSelect(c.value)}
                                >
                                    <Ionicons
                                        name={c.icon as any}
                                        size={15}
                                        color={active ? PRIMARY : Colors.charcoalLight}
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={[pk.itemText, active && pk.itemTextActive]}>
                                        {c.value}
                                    </Text>
                                    {active && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={15}
                                            color={PRIMARY}
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function Step2Business({ data, onChange }: Props) {
    const [showCategoryPicker, setShowCategoryPicker] = React.useState(false);

    // ── Progress calculation ─────────────────────────────────────────────
    const requiredFilled = REQUIRED_FIELDS.filter(f => !!(data as any)[f]).length;
    const totalRequired = REQUIRED_FIELDS.length;
    const pct = Math.round((requiredFilled / totalRequired) * 100);

    // ── Char count for description ───────────────────────────────────────
    const descLength = (data.description || '').length;
    const DESC_MIN = 50;

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.container}
            keyboardShouldPersistTaps="handled"
        >
            {/* ── Service Title ────────────────────────────────────────── */}
            <Field
                label="Service Title *"
                placeholder="e.g. Royal Wedding Photography"
                icon="briefcase-outline"
                value={data.title || ''}
                onChangeText={v => onChange('title', v)}
                autoCapitalize="words"
            />

            {/* ── Company + Brand row ──────────────────────────────────── */}
            <View style={s.rowWrap}>
                <View style={{ flex: 1 }}>
                    <Field
                        label="Company Name *"
                        placeholder="Registered name"
                        icon="business-outline"
                        value={data.companyName || ''}
                        onChangeText={v => onChange('companyName', v)}
                        autoCapitalize="words"
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Field
                        label="Brand Name"
                        placeholder="e.g. Studio Luxe"
                        icon="pricetag-outline"
                        value={data.brandName || ''}
                        onChangeText={v => onChange('brandName', v)}
                        autoCapitalize="words"
                    />
                </View>
            </View>

            {/* ── Category + Experience row ────────────────────────────── */}
            <View style={[s.rowWrap, { zIndex: 20 }]}>
                <View style={{ flex: 1.4 }}>
                    <CategoryPicker
                        value={data.category || ''}
                        open={showCategoryPicker}
                        onToggle={() => setShowCategoryPicker(v => !v)}
                        onSelect={v => {
                            onChange('category', v);
                            setShowCategoryPicker(false);
                        }}
                    />
                </View>
                <View style={{ flex: 0.6 }}>
                    <Field
                        label="Experience *"
                        placeholder="Yrs"
                        icon="time-outline"
                        keyboardType="numeric"
                        value={data.experienceYears?.toString() || ''}
                        onChangeText={v => onChange('experienceYears', parseInt(v) || 0)}
                    />
                    {!!data.experienceYears && data.experienceYears > 0 && (
                        <View style={s.hintRow}>
                            <Ionicons name="star-outline" size={11} color={PRIMARY} />
                            <Text style={s.hintText}>{data.experienceYears}+ yrs</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* ── Description ──────────────────────────────────────────── */}
            <View style={s.fieldWrap}>
                <View style={s.labelRow}>
                    <Text style={s.label}>
                        Service Description <Text style={s.required}>*</Text>
                    </Text>
                    <Text style={[s.charCount, descLength >= DESC_MIN && s.charCountOk]}>
                        {descLength} / {DESC_MIN} min
                    </Text>
                </View>
                <View
                    style={[
                        s.textareaBox,
                        (data.description?.length ?? 0) > 0 && s.textareaBoxFocused,
                    ]}
                >
                    <TextInput
                        style={s.textarea}
                        placeholder="Describe your service, what makes you unique, packages offered..."
                        placeholderTextColor={Colors.charcoalLight}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                        value={data.description || ''}
                        onChangeText={v => onChange('description', v)}
                    />
                </View>
                {descLength > 0 && descLength < DESC_MIN && (
                    <View style={s.hintRow}>
                        <Ionicons
                            name="information-circle-outline"
                            size={11}
                            color={Colors.charcoalLight}
                        />
                        <Text style={s.hintTextMuted}>
                            Add {DESC_MIN - descLength} more characters
                        </Text>
                    </View>
                )}
                {descLength >= DESC_MIN && (
                    <View style={s.hintRow}>
                        <Ionicons name="checkmark-circle-outline" size={11} color={PRIMARY} />
                        <Text style={s.hintText}>Looks great!</Text>
                    </View>
                )}
            </View>

            {/* ── Divider ──────────────────────────────────────────────── */}
            <View style={s.divider}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>Optional</Text>
                <View style={s.dividerLine} />
            </View>

            {/* ── Specialization ───────────────────────────────────────── */}
            <Field
                label="Specialization"
                placeholder="e.g. North Indian, Continental, Live Counters"
                icon="ribbon-outline"
                value={data.specialization || ''}
                onChangeText={v => onChange('specialization', v)}
            />

            {/* ── Tags ─────────────────────────────────────────────────── */}
            <View style={s.fieldWrap}>
                <Field
                    label="Tags"
                    placeholder="e.g. wedding, candid, album"
                    icon="pricetags-outline"
                    value={(data.tags || []).join(', ')}
                    onChangeText={v =>
                        onChange(
                            'tags',
                            v
                                .split(',')
                                .map(t => t.trim())
                                .filter(Boolean),
                        )
                    }
                />
                <View style={s.hintRow}>
                    <Ionicons
                        name="information-circle-outline"
                        size={11}
                        color={Colors.charcoalLight}
                    />
                    <Text style={s.hintTextMuted}>Separate multiple tags with a comma</Text>
                </View>
            </View>

            {/* ── Info note ─────────────────────────────────────────────── */}
            <View style={s.infoNote}>
                <Ionicons name="bulb-outline" size={15} color={PRIMARY} />
                <Text style={s.infoNoteText}>
                    A detailed description and accurate category help customers find your service
                    faster in search results.
                </Text>
            </View>
        </ScrollView>
    );
}

// ─── Constants ─────────────────────────────────────────────────────────────

const PRIMARY_COLOR = Colors.primary;

// ─── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    container: { paddingBottom: Spacing.xl },

    // Header
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
        backgroundColor: PRIMARY_COLOR,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    sectionSub: {
        fontSize: 11,
        color: Colors.charcoalLight,
        marginTop: 2,
    },

    // Progress
    progressWrap: { marginBottom: Spacing.xl },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    progressLabel: { fontSize: 11, color: Colors.charcoalLight },
    progressPct: { fontSize: 11, color: PRIMARY_COLOR, fontWeight: '600' },
    progressTrack: {
        height: 4,
        borderRadius: 2,
        backgroundColor: `${PRIMARY_COLOR}18`,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
        backgroundColor: PRIMARY_COLOR,
    },

    // Layout
    rowWrap: { flexDirection: 'column', gap: Spacing.md },
    fieldWrap: { marginBottom: Spacing.md },

    // Label row (for fields with right-aligned accessory like char count)
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 7,
    },
    label: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
    },
    required: { color: Colors.danger },
    charCount: { fontSize: 10, color: Colors.charcoalLight, fontWeight: '500' },
    charCountOk: { color: PRIMARY_COLOR },

    // Inline hints
    hintRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: -Spacing.sm,
        marginBottom: Spacing.sm,
    },
    hintText: { fontSize: 10, color: PRIMARY_COLOR },
    hintTextMuted: { fontSize: 10, color: Colors.charcoalLight },

    // Textarea
    textareaBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        minHeight: 120,
    },
    textareaBoxFocused: {
        borderColor: `${PRIMARY_COLOR}88`,
        backgroundColor: `${PRIMARY_COLOR}04`,
    },
    textareaIcon: { marginRight: Spacing.sm, marginTop: 2 },
    textarea: {
        flex: 1,
        fontSize: 15,
        color: Colors.charcoal,
        textAlignVertical: 'top',
        minHeight: 100,
    },

    // Divider
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginVertical: Spacing.lg,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
    dividerText: { fontSize: 11, color: Colors.charcoalLight, fontWeight: '500' },

    // Info note
    infoNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        backgroundColor: `${PRIMARY_COLOR}08`,
        borderRadius: Radii.sm,
        padding: Spacing.md,
        marginTop: Spacing.sm,
    },
    infoNoteText: {
        flex: 1,
        fontSize: 11,
        color: Colors.charcoalLight,
        lineHeight: 16,
    },
});

// ─── Category Picker Styles ────────────────────────────────────────────────

const pk = StyleSheet.create({
    wrap: { marginBottom: Spacing.md },
    label: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        marginBottom: 7,
    },
    required: { color: Colors.danger },

    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        height: 54,
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
    },
    btnOpen: {
        borderColor: PRIMARY_COLOR,
        backgroundColor: `${PRIMARY_COLOR}08`,
    },

    iconWrap: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: `${Colors.charcoalLight}15`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapActive: {
        backgroundColor: `${PRIMARY_COLOR}15`,
    },

    btnText: { flex: 1, fontSize: 15, color: Colors.charcoal },
    btnPlaceholder: { color: Colors.charcoalLight },

    dropdown: {
        position: 'absolute',
        top: 54 + 7 + 18,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.md,
        zIndex: 100,
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    itemActive: { backgroundColor: `${PRIMARY_COLOR}08` },
    itemText: { flex: 1, fontSize: Typography.base, color: Colors.charcoal },
    itemTextActive: { color: PRIMARY_COLOR, fontWeight: Typography.semiBold },
});

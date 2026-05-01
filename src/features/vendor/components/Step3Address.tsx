import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radii, Typography } from '@/theme/theme';
import { VendorService } from '@features/otherService/types/VendorService';
import Field from '@/components/UI/InputField';

type Props = {
    data: Partial<VendorService>;
    onChange: (key: keyof VendorService, value: any) => void;
};

const STATES = [
    'Andhra Pradesh',
    'Chhattisgarh',
    'Delhi',
    'Goa',
    'Gujarat',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Punjab',
    'Rajasthan',
    'Tamil Nadu',
    'Telangana',
    'Uttar Pradesh',
    'West Bengal',
];

const CITIES_BY_STATE: Record<string, string[]> = {
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Itarsi', 'Sagar', 'Rewa'],
    Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
    Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
    Delhi: ['New Delhi', 'Dwarka', 'Rohini', 'Lajpat Nagar'],
    Rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'],
};

// ── Reusable picker styled to match Field exactly ─────────────────────────────
type PickerFieldProps = {
    label: string;
    icon: string;
    value: string;
    placeholder: string;
    disabled?: boolean;
    open: boolean;
    onToggle: () => void;
    options: string[];
    onSelect: (v: string) => void;
};

function PickerField({
    label,
    icon,
    value,
    placeholder,
    disabled,
    open,
    onToggle,
    options,
    onSelect,
}: PickerFieldProps) {
    return (
        <View style={p.wrap}>
            <Text style={p.label}>{label}</Text>
            <TouchableOpacity
                style={[p.btn, disabled && p.btnDisabled, open && p.btnOpen]}
                onPress={onToggle}
                activeOpacity={0.8}
                disabled={disabled}
            >
                <Ionicons
                    name={icon as any}
                    size={18}
                    color={value ? Colors.primary : Colors.charcoalLight}
                    style={p.leadIcon}
                />
                <Text style={[p.btnText, !value && p.btnPlaceholder]} numberOfLines={1}>
                    {value || placeholder}
                </Text>
                <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={15}
                    color={Colors.charcoalLight}
                />
            </TouchableOpacity>
            {open && options.length > 0 && (
                <View style={p.dropdown}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                        {options.map(opt => {
                            const active = value === opt;
                            return (
                                <TouchableOpacity
                                    key={opt}
                                    style={[p.item, active && p.itemActive]}
                                    onPress={() => onSelect(opt)}
                                >
                                    <Ionicons
                                        name={active ? 'checkmark-circle' : 'ellipse-outline'}
                                        size={15}
                                        color={active ? Colors.primary : Colors.border}
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={[p.itemText, active && p.itemTextActive]}>
                                        {opt}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

// ── Prefix field (@ / /) styled to match Field ────────────────────────────────
type PrefixFieldProps = {
    label: string;
    prefix: string;
    icon: string;
    placeholder?: string;
    value: string;
    onChangeText: (v: string) => void;
};

function PrefixField({
    label,
    prefix,
    icon,
    placeholder = '',
    value,
    onChangeText,
}: PrefixFieldProps) {
    return (
        <View style={pf.wrap}>
            <Text style={pf.label}>{label}</Text>
            <View style={pf.row}>
                <View style={pf.prefixBox}>
                    <Text style={pf.prefixText}>{prefix}</Text>
                </View>
                <View style={pf.fieldBox}>
                    <Ionicons
                        name={icon as any}
                        size={18}
                        color={Colors.charcoalLight}
                        style={pf.icon}
                    />
                    <Field
                        label=""
                        placeholder={placeholder}
                        icon={icon}
                        value={value}
                        onChangeText={onChangeText}
                        autoCapitalize="none"
                    />
                </View>
            </View>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Step3Address({ data, onChange }: Props) {
    const [showStatePicker, setShowStatePicker] = React.useState(false);
    const [showCityPicker, setShowCityPicker] = React.useState(false);

    const cities = CITIES_BY_STATE[data.state || ''] || [];

    const closeAll = () => {
        setShowStatePicker(false);
        setShowCityPicker(false);
    };

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.container}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={s.sectionTitle}>Business Address</Text>

            {/* Office Address */}
            <Field
                label="Office / Work Address *"
                placeholder="Building, street, landmark"
                icon="business-outline"
                value={data.officeAddress || ''}
                onChangeText={v => onChange('officeAddress', v)}
            />

            {/* State picker */}
            <View style={{ zIndex: 20 }}>
                <PickerField
                    label="State *"
                    icon="map-outline"
                    value={data.state || ''}
                    placeholder="Select state"
                    open={showStatePicker}
                    onToggle={() => {
                        setShowStatePicker(v => !v);
                        setShowCityPicker(false);
                    }}
                    options={STATES}
                    onSelect={st => {
                        onChange('state', st);
                        onChange('city', '');
                        closeAll();
                    }}
                />
            </View>

            {/* City picker */}
            <View style={{ zIndex: 10 }}>
                <PickerField
                    label="City *"
                    icon="location-outline"
                    value={data.city || ''}
                    placeholder={data.state ? 'Select city' : 'Select state first'}
                    disabled={!data.state}
                    open={showCityPicker}
                    onToggle={() => {
                        setShowCityPicker(v => !v);
                        setShowStatePicker(false);
                    }}
                    options={cities}
                    onSelect={c => {
                        onChange('city', c);
                        closeAll();
                    }}
                />
            </View>

            {/* Pincode */}
            <Field
                label="Pincode *"
                placeholder="6-digit pincode"
                icon="locate-outline"
                keyboardType="numeric"
                maxLength={6}
                value={data.pincode || ''}
                onChangeText={v => onChange('pincode', v)}
            />

            {/* Area */}
            <Field
                label="Area / Locality"
                placeholder="e.g. Civil Lines, Station Road"
                icon="navigate-outline"
                value={data.area || ''}
                onChangeText={v => onChange('area', v)}
            />

            {/* Village */}
            <Field
                label="Village"
                placeholder="Village name (if applicable)"
                icon="home-outline"
                value={data.village || ''}
                onChangeText={v => onChange('village', v)}
            />

            {/* Serviceable Areas */}
            <Field
                label="Serviceable Areas"
                placeholder="Bhopal, Indore, Gwalior etc."
                icon="earth-outline"
                value={(data.serviceableAreas || []).join(', ')}
                onChangeText={v =>
                    onChange(
                        'serviceableAreas',
                        v
                            .split(',')
                            .map(a => a.trim())
                            .filter(Boolean),
                    )
                }
            />

            {/* ── Online Presence ── */}
            <Text style={[s.sectionTitle, { marginTop: Spacing.lg }]}>Online Presence</Text>

            {/* Website */}
            <Field
                label="Website"
                placeholder="https://yourwebsite.com"
                icon="globe-outline"
                keyboardType="url"
                autoCapitalize="none"
                value={data.website || ''}
                onChangeText={v => onChange('website', v)}
            />

            {/* Instagram — prefix @ */}
            <View style={s.prefixWrap}>
                <Field
                    label="Instagram"
                    placeholder="yourhandle"
                    icon="at-outline"
                    autoCapitalize="none"
                    value={data.instagram || ''}
                    onChangeText={v => onChange('instagram', v)}
                />
            </View>

            {/* Facebook — prefix / */}
            <View style={s.prefixWrap}>
                <Field
                    label="Facebook"
                    placeholder="yourpagename"
                    icon="people-outline"
                    autoCapitalize="none"
                    value={data.facebook || ''}
                    onChangeText={v => onChange('facebook', v)}
                />
            </View>
        </ScrollView>
    );
}

// ── PickerField styles ────────────────────────────────────────────────────────
const p = StyleSheet.create({
    wrap: { marginBottom: Spacing.md },
    label: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 7,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        height: 54,
        paddingHorizontal: Spacing.md,
    },
    btnDisabled: { backgroundColor: Colors.surface, opacity: 0.6 },
    btnOpen: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight + '44' },
    leadIcon: { marginRight: Spacing.sm },
    btnText: { flex: 1, fontSize: 15, color: Colors.charcoal },
    btnPlaceholder: { color: Colors.charcoalLight },
    dropdown: {
        position: 'absolute',
        top: 54 + 7,
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
    itemActive: { backgroundColor: Colors.primaryLight },
    itemText: { fontSize: Typography.base, color: Colors.charcoal },
    itemTextActive: { color: Colors.primaryDark, fontWeight: Typography.semiBold },
});

// ── Prefix field styles ───────────────────────────────────────────────────────
const pf = StyleSheet.create({
    wrap: { marginBottom: Spacing.md },
    label: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 7,
    },
    row: { flexDirection: 'row', alignItems: 'flex-end' },
    prefixBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        height: 54,
        paddingHorizontal: Spacing.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRightWidth: 0,
        borderTopLeftRadius: Radii.md,
        borderBottomLeftRadius: Radii.md,
        backgroundColor: Colors.surface,
        marginBottom: Spacing.md, // aligns with Field's wrap marginBottom
    },
    prefixText: {
        fontSize: 15,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    icon: { marginRight: Spacing.sm },
    fieldBox: { flex: 1 },
});

// ── Main styles ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    container: { paddingBottom: Spacing.xl },

    sectionTitle: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        marginBottom: Spacing.xl,
    },

    // Prefix rows (Instagram / Facebook)
    prefixWrap: { marginBottom: Spacing.sm },
    prefixLabel: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    prefixRow: { flexDirection: 'row', alignItems: 'flex-end' },
    prefixBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        height: 54,
        paddingHorizontal: Spacing.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRightWidth: 0,
        borderTopLeftRadius: Radii.md,
        borderBottomLeftRadius: Radii.md,
        backgroundColor: Colors.surface,
        marginBottom: Spacing.sm,
    },
    prefixText: {
        fontSize: 15,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
});

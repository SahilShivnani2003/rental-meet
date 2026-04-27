import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radii, Typography } from '@/theme/theme';
import { VendorService } from '@features/otherService/types/VendorService';

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

export default function Step3Address({ data, onChange }: Props) {
    const [showStatePicker, setShowStatePicker] = React.useState(false);
    const [showCityPicker, setShowCityPicker] = React.useState(false);

    const cities = CITIES_BY_STATE[data.state || ''] || [];

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.container}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={s.sectionTitle}>Business Address</Text>

            {/* Office Address */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>
                    Office / Work Address <Text style={s.required}>*</Text>
                </Text>
                <TextInput
                    style={s.input}
                    placeholder=""
                    placeholderTextColor={Colors.charcoalLight}
                    value={data.officeAddress || ''}
                    onChangeText={v => onChange('officeAddress', v)}
                />
            </View>

            {/* State */}
            <View style={[s.fieldWrap, { zIndex: 20 }]}>
                <Text style={s.label}>
                    State <Text style={s.required}>*</Text>
                </Text>
                <TouchableOpacity
                    style={s.selectBtn}
                    onPress={() => {
                        setShowStatePicker(v => !v);
                        setShowCityPicker(false);
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={[s.selectBtnText, !data.state && { color: Colors.charcoalLight }]}>
                        {data.state || 'Select state'}
                    </Text>
                    <Text style={s.chevron}>▾</Text>
                </TouchableOpacity>
                {showStatePicker && (
                    <View style={s.dropdown}>
                        <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                            {STATES.map(st => (
                                <TouchableOpacity
                                    key={st}
                                    style={[
                                        s.dropdownItem,
                                        data.state === st && s.dropdownItemActive,
                                    ]}
                                    onPress={() => {
                                        onChange('state', st);
                                        onChange('city', '');
                                        setShowStatePicker(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            s.dropdownItemText,
                                            data.state === st && s.dropdownItemTextActive,
                                        ]}
                                    >
                                        {st}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>

            {/* City */}
            <View style={[s.fieldWrap, { zIndex: 10 }]}>
                <Text style={s.label}>
                    City <Text style={s.required}>*</Text>
                </Text>
                <TouchableOpacity
                    style={[s.selectBtn, !data.state && s.selectBtnDisabled]}
                    onPress={() => {
                        if (!data.state) return;
                        setShowCityPicker(v => !v);
                        setShowStatePicker(false);
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={[s.selectBtnText, !data.city && { color: Colors.charcoalLight }]}>
                        {data.city || (data.state ? 'Select city' : 'Select state first')}
                    </Text>
                    <Text style={s.chevron}>▾</Text>
                </TouchableOpacity>
                {showCityPicker && cities.length > 0 && (
                    <View style={s.dropdown}>
                        <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                            {cities.map(c => (
                                <TouchableOpacity
                                    key={c}
                                    style={[
                                        s.dropdownItem,
                                        data.city === c && s.dropdownItemActive,
                                    ]}
                                    onPress={() => {
                                        onChange('city', c);
                                        setShowCityPicker(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            s.dropdownItemText,
                                            data.city === c && s.dropdownItemTextActive,
                                        ]}
                                    >
                                        {c}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>

            {/* Pincode */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>
                    Pincode <Text style={s.required}>*</Text>
                </Text>
                <View style={s.iconInputWrap}>
                    <Ionicons
                        name="location-outline"
                        size={16}
                        color={Colors.charcoalLight}
                        style={s.inputIcon}
                    />
                    <TextInput
                        style={[s.input, s.iconInput]}
                        placeholder="6-digit pincode"
                        placeholderTextColor={Colors.charcoalLight}
                        keyboardType="numeric"
                        maxLength={6}
                        value={data.pincode || ''}
                        onChangeText={v => onChange('pincode', v)}
                    />
                </View>
            </View>

            {/* Area */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>Area / Locality</Text>
                <TextInput
                    style={s.input}
                    placeholder="e.g. Civil Lines, Station Road"
                    placeholderTextColor={Colors.charcoalLight}
                    value={data.area || ''}
                    onChangeText={v => onChange('area', v)}
                />
            </View>

            {/* Village */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>Village</Text>
                <TextInput
                    style={s.input}
                    placeholder=""
                    placeholderTextColor={Colors.charcoalLight}
                    value={data.village || ''}
                    onChangeText={v => onChange('village', v)}
                />
            </View>

            {/* Serviceable Areas */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>Serviceable Areas</Text>
                <TextInput
                    style={s.input}
                    placeholder="Bhopal, Indore, Gwalior etc."
                    placeholderTextColor={Colors.charcoalLight}
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
            </View>

            {/* Online Presence */}
            <Text style={[s.sectionTitle, { marginTop: Spacing.lg }]}>Online Presence</Text>

            <View style={s.fieldWrap}>
                <Text style={s.label}>Website</Text>
                <TextInput
                    style={s.input}
                    placeholder="https://yourwebsite.com"
                    placeholderTextColor={Colors.charcoalLight}
                    keyboardType="url"
                    autoCapitalize="none"
                    value={data.website || ''}
                    onChangeText={v => onChange('website', v)}
                />
            </View>

            <View style={s.fieldWrap}>
                <Text style={s.label}>Instagram</Text>
                <View style={s.prefixInputWrap}>
                    <View style={s.prefix}>
                        <Text style={s.prefixText}>@</Text>
                    </View>
                    <TextInput
                        style={[s.input, s.prefixInput]}
                        placeholder=""
                        placeholderTextColor={Colors.charcoalLight}
                        autoCapitalize="none"
                        value={data.instagram || ''}
                        onChangeText={v => onChange('instagram', v)}
                    />
                </View>
            </View>

            <View style={s.fieldWrap}>
                <Text style={s.label}>Facebook</Text>
                <View style={s.prefixInputWrap}>
                    <View style={s.prefix}>
                        <Text style={s.prefixText}>/</Text>
                    </View>
                    <TextInput
                        style={[s.input, s.prefixInput]}
                        placeholder=""
                        placeholderTextColor={Colors.charcoalLight}
                        autoCapitalize="none"
                        value={data.facebook || ''}
                        onChangeText={v => onChange('facebook', v)}
                    />
                </View>
            </View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { paddingBottom: Spacing.xl },
    sectionTitle: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        marginBottom: Spacing.xl,
    },
    fieldWrap: { marginBottom: Spacing.lg },
    label: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
        marginBottom: Spacing.xs,
    },
    required: { color: Colors.danger },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        fontSize: Typography.base,
        color: Colors.charcoal,
        backgroundColor: Colors.surface,
    },
    selectBtn: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.surface,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectBtnDisabled: { backgroundColor: Colors.background },
    selectBtnText: { fontSize: Typography.base, color: Colors.charcoal },
    chevron: { fontSize: 14, color: Colors.charcoalLight },
    dropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        zIndex: 100,
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    dropdownItem: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    dropdownItemActive: { backgroundColor: Colors.primaryLight },
    dropdownItemText: { fontSize: Typography.base, color: Colors.charcoal },
    dropdownItemTextActive: { color: Colors.primaryDark, fontWeight: Typography.semiBold },

    iconInputWrap: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
    inputIcon: { position: 'absolute', left: Spacing.md, zIndex: 1 },
    iconInput: { flex: 1, paddingLeft: 36 },

    prefixInputWrap: { flexDirection: 'row' },
    prefix: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRightWidth: 0,
        borderTopLeftRadius: Radii.sm,
        borderBottomLeftRadius: Radii.sm,
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        minWidth: 36,
        alignItems: 'center',
    },
    prefixText: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.semiBold,
    },
    prefixInput: {
        flex: 1,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
    },
});

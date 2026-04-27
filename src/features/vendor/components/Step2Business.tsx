import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radii, Typography } from '@/theme/theme';
import { VendorService } from '@features/otherService/types/VendorService';

type Props = {
    data: Partial<VendorService>;
    onChange: (key: keyof VendorService, value: any) => void;
};

const CATEGORIES = [
    'Photography',
    'Videography',
    'Catering',
    'Decoration',
    'Music & DJ',
    'Venue',
    'Makeup & Beauty',
    'Event Management',
    'Mehendi',
    'Wedding Planning',
    'Other',
];

export default function Step2Business({ data, onChange }: Props) {
    const [showCategoryPicker, setShowCategoryPicker] = React.useState(false);

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.container}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={s.sectionTitle}>Business Information</Text>

            {/* Service Title */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>
                    Service Title <Text style={s.required}>*</Text>
                </Text>
                <TextInput
                    style={s.input}
                    placeholder="e.g. Royal Wedding Photography"
                    placeholderTextColor={Colors.charcoalLight}
                    value={data.title || ''}
                    onChangeText={v => onChange('title', v)}
                />
            </View>

            {/* Company Name */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>
                    Business / Company Name <Text style={s.required}>*</Text>
                </Text>
                <TextInput
                    style={s.input}
                    placeholder=""
                    placeholderTextColor={Colors.charcoalLight}
                    value={data.companyName || ''}
                    onChangeText={v => onChange('companyName', v)}
                />
            </View>

            {/* Brand Name */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>Brand Name (if different)</Text>
                <TextInput
                    style={s.input}
                    placeholder=""
                    placeholderTextColor={Colors.charcoalLight}
                    value={data.brandName || ''}
                    onChangeText={v => onChange('brandName', v)}
                />
            </View>

            {/* Category + Experience row */}
            <View style={s.rowWrap}>
                <View style={[s.fieldWrap, { flex: 1 }]}>
                    <Text style={s.label}>
                        Category <Text style={s.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                        style={s.selectBtn}
                        onPress={() => setShowCategoryPicker(v => !v)}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                s.selectBtnText,
                                !data.category && { color: Colors.charcoalLight },
                            ]}
                        >
                            {data.category || 'Select'}
                        </Text>
                        <Text style={s.chevron}>▾</Text>
                    </TouchableOpacity>
                    {showCategoryPicker && (
                        <View style={s.dropdown}>
                            {CATEGORIES.map(c => (
                                <TouchableOpacity
                                    key={c}
                                    style={[
                                        s.dropdownItem,
                                        data.category === c && s.dropdownItemActive,
                                    ]}
                                    onPress={() => {
                                        onChange('category', c);
                                        setShowCategoryPicker(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            s.dropdownItemText,
                                            data.category === c && s.dropdownItemTextActive,
                                        ]}
                                    >
                                        {c}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <View style={[s.fieldWrap, { flex: 1 }]}>
                    <Text style={s.label}>
                        Years of Experience <Text style={s.required}>*</Text>
                    </Text>
                    <TextInput
                        style={s.input}
                        placeholder=""
                        placeholderTextColor={Colors.charcoalLight}
                        keyboardType="numeric"
                        value={data.experienceYears?.toString() || ''}
                        onChangeText={v => onChange('experienceYears', parseInt(v) || 0)}
                    />
                </View>
            </View>

            {/* Description */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>
                    Service Description <Text style={s.required}>*</Text>
                </Text>
                <TextInput
                    style={[s.input, s.textarea]}
                    placeholder="Describe your service..."
                    placeholderTextColor={Colors.charcoalLight}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                    value={data.description || ''}
                    onChangeText={v => onChange('description', v)}
                />
            </View>

            {/* Specialization */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>Specialization</Text>
                <TextInput
                    style={s.input}
                    placeholder="e.g. North Indian, Continental, Live Counters"
                    placeholderTextColor={Colors.charcoalLight}
                    value={data.specialization || ''}
                    onChangeText={v => onChange('specialization', v)}
                />
            </View>

            {/* Tags */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>Tags (comma separated)</Text>
                <TextInput
                    style={s.input}
                    placeholder="e.g. wedding, candid, album"
                    placeholderTextColor={Colors.charcoalLight}
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
    textarea: { minHeight: 100, paddingTop: Spacing.md },
    rowWrap: { flexDirection: 'row', gap: Spacing.md },

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
    selectBtnText: {
        fontSize: Typography.base,
        color: Colors.charcoal,
    },
    chevron: {
        fontSize: 14,
        color: Colors.charcoalLight,
    },
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
        maxHeight: 200,
        ...{
            shadowColor: Colors.charcoal,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
        },
    },
    dropdownItem: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    dropdownItemActive: { backgroundColor: Colors.primaryLight },
    dropdownItemText: {
        fontSize: Typography.base,
        color: Colors.charcoal,
    },
    dropdownItemTextActive: {
        color: Colors.primaryDark,
        fontWeight: Typography.semiBold,
    },
});

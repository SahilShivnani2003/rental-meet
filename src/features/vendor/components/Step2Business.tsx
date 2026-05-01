import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radii, Typography } from '@/theme/theme';
import { VendorService } from '@features/otherService/types/VendorService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Field from '@/components/UI/InputField';

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
            <Field
                label="Service Title *"
                placeholder="e.g. Royal Wedding Photography"
                icon="briefcase-outline"
                value={data.title || ''}
                onChangeText={v => onChange('title', v)}
                autoCapitalize="words"
            />

            {/* Company Name */}
            <Field
                label="Business / Company Name *"
                placeholder="Your registered company name"
                icon="business-outline"
                value={data.companyName || ''}
                onChangeText={v => onChange('companyName', v)}
                autoCapitalize="words"
            />

            {/* Brand Name */}
            <Field
                label="Brand Name (if different)"
                placeholder="e.g. Studio Luxe"
                icon="pricetag-outline"
                value={data.brandName || ''}
                onChangeText={v => onChange('brandName', v)}
                autoCapitalize="words"
            />

            {/* Category + Experience row */}
            <View style={s.rowWrap}>
                {/* Category — custom picker styled to match Field */}
                <View style={s.halfWrap}>
                    <Text style={s.fieldLabel}>Category *</Text>
                    <TouchableOpacity
                        style={s.selectBtn}
                        onPress={() => setShowCategoryPicker(v => !v)}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="apps-outline"
                            size={18}
                            color={data.category ? Colors.primary : Colors.charcoalLight}
                            style={s.selectIcon}
                        />
                        <Text
                            style={[
                                s.selectBtnText,
                                !data.category && { color: Colors.charcoalLight },
                            ]}
                            numberOfLines={1}
                        >
                            {data.category || 'Select'}
                        </Text>
                        <Ionicons
                            name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
                            size={15}
                            color={Colors.charcoalLight}
                        />
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
                                    {data.category === c && (
                                        <Ionicons
                                            name="checkmark"
                                            size={14}
                                            color={Colors.primary}
                                            style={{ marginRight: 6 }}
                                        />
                                    )}
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

                {/* Years of Experience */}
                <View style={s.halfWrap}>
                    <Field
                        label="Experience (yrs) *"
                        placeholder="e.g. 5"
                        icon="time-outline"
                        keyboardType="numeric"
                        value={data.experienceYears?.toString() || ''}
                        onChangeText={v => onChange('experienceYears', parseInt(v) || 0)}
                    />
                </View>
            </View>

            {/* Description — multiline, Field doesn't support this so styled to match */}
            <View style={s.textareaWrap}>
                <Text style={s.fieldLabel}>Service Description *</Text>
                <View style={s.textareaBox}>
                    <Ionicons
                        name="document-text-outline"
                        size={18}
                        color={Colors.charcoalLight}
                        style={s.textareaIcon}
                    />
                    <TextInput
                        style={s.textarea}
                        placeholder="Describe your service, what makes you unique..."
                        placeholderTextColor={Colors.charcoalLight}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                        value={data.description || ''}
                        onChangeText={v => onChange('description', v)}
                    />
                </View>
            </View>

            {/* Specialization */}
            <Field
                label="Specialization"
                placeholder="e.g. North Indian, Continental, Live Counters"
                icon="ribbon-outline"
                value={data.specialization || ''}
                onChangeText={v => onChange('specialization', v)}
            />

            {/* Tags */}
            <Field
                label="Tags (comma separated)"
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

    // Shared label — mirrors Field's label style exactly
    fieldLabel: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 7,
    },

    // Category + Experience side-by-side
    rowWrap: {
        flexDirection: 'row',
        gap: Spacing.md,
        zIndex: 10, // so dropdown floats above fields below
    },
    halfWrap: { flex: 1 },

    // Category picker — matches Field's row exactly
    selectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        height: 54,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.md, // match Field's wrap marginBottom
    },
    selectIcon: { marginRight: Spacing.sm },
    selectBtnText: {
        flex: 1,
        fontSize: 15,
        color: Colors.charcoal,
    },

    // Dropdown
    dropdown: {
        position: 'absolute',
        top: 54 + 7, // height of selectBtn + label gap
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.md,
        zIndex: 100,
        maxHeight: 220,
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
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

    // Textarea — mirrors Field visually
    textareaWrap: { marginBottom: Spacing.md },
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
    textareaIcon: { marginRight: Spacing.sm, marginTop: 2 },
    textarea: {
        flex: 1,
        fontSize: 15,
        color: Colors.charcoal,
        textAlignVertical: 'top',
        minHeight: 100,
    },
});

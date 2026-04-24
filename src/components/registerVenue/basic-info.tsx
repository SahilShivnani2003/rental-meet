import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii } from '../../theme/theme';
import { StepHeader, SectionCard, PickerRow, NavButtons, Textarea } from '../UI/shared-components';
import Field from '../UI/InputField';
import { venueAPI } from '../../service/apis/venues';
import { VenueFormData } from '../../types/Venue';

interface VenueType {
    _id: string;
    name: string;
    icon: string;
    isActive: boolean;
}

const CAPACITY_RANGES = [
    'Select capacity range',
    '10-20',
    '20-30',
    '30-40',
    '40-50',
    '50-100',
    '100-200',
    '200-300',
    '300-400',
    '400-500',
    '500-600',
    '600-700',
    '700-800',
    '800-1000',
    '1000-1500',
    '1500-2000',
    'More than 2000',
];

interface Props {
    data: VenueFormData['basic'];
    onChange: (data: VenueFormData['basic']) => void;
    onNext: () => void;
}

export default function Step1BasicInfo({ data, onChange, onNext }: Props) {
    const set = (patch: Partial<VenueFormData['basic']>) => onChange({ ...data, ...patch });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [venueTypes, setVenueTypes] = useState<VenueType[]>([]);
    const [loadingTypes, setLoadingTypes] = useState(false);
    const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
    const [typeSearch, setTypeSearch] = useState('');
    const [capOpen, setCapOpen] = useState(false);

    const wordCount =
        data.description.trim() === '' ? 0 : data.description.trim().split(/\s+/).length;

    React.useEffect(() => {
        fetchVenueTypes();
    }, []);

    const fetchVenueTypes = async () => {
        setLoadingTypes(true);
        try {
            const response = await venueAPI.venueTypes();
            if (response?.success)
            setVenueTypes(response.venueTypes.filter((t: VenueType) => t.isActive));
        } catch (e: any) {
            console.error('FETCH VENUE TYPE ERROR:', e);
        } finally {
            setLoadingTypes(false);
        }
    };

    const filteredTypes = venueTypes.filter(t =>
        t.name.toLowerCase().includes(typeSearch.toLowerCase()),
    );

    const toggleType = (id: string) => {
        const next = data.venueTypes.includes(id)
            ? data.venueTypes.filter(x => x !== id)
            : [...data.venueTypes, id];
        set({ venueTypes: next });
        setErrors(p => ({ ...p, venueType: '' }));
    };
    const removeType = (id: string) => set({ venueTypes: data.venueTypes.filter(x => x !== id) });
    const getTypeName = (id: string) => venueTypes.find(t => t._id === id)?.name ?? '';
    const getTypeIcon = (id: string) => venueTypes.find(t => t._id === id)?.icon ?? '';

    const validate = () => {
        const e: Record<string, string> = {};
        if (!data.businessName.trim()) e.venueName = 'Venue name is required';
        if (data.venueTypes.length === 0) e.venueType = 'Select at least one venue type';
        if (!data.description.trim()) e.description = 'Description is required';
        if (wordCount > 200) e.description = 'Maximum 200 words allowed';
        if (data.capacity === CAPACITY_RANGES[0]) e.capacity = 'Select a capacity range';
        if (!data.areaSqft.trim()) e.totalArea = 'Total area is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
        >
            <StepHeader title="Step 1: Basic Info" current={1} />
            <SectionCard>
                <Field
                    label="Business/Venue Name"
                    placeholder="Elite Conference Center"
                    icon="business-outline"
                    value={data.businessName}
                    onChangeText={v => {
                        set({ businessName: v });
                        setErrors(p => ({ ...p, venueName: '' }));
                    }}
                    error={errors.venueName}
                />

                <View style={s.typeSection}>
                    <Text style={s.typeLabel}>
                        VENUE TYPE <Text style={s.req}>*</Text>
                    </Text>
                    <TouchableOpacity
                        style={[s.picker, !!errors.venueType && s.pickerError]}
                        onPress={() => {
                            if (!loadingTypes) {
                                setTypeDropdownOpen(v => !v);
                                setTypeSearch('');
                            }
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={[s.pickerText, data.venueTypes.length === 0 && s.placeholder]}>
                            {loadingTypes
                                ? 'Loading types...'
                                : data.venueTypes.length > 0
                                ? `${data.venueTypes.length} type${
                                      data.venueTypes.length > 1 ? 's' : ''
                                  } selected`
                                : 'Select venue type(s)'}
                        </Text>
                        {loadingTypes ? (
                            <ActivityIndicator size="small" color={Colors.charcoalLight} />
                        ) : (
                            <Ionicons
                                name={typeDropdownOpen ? 'chevron-up' : 'chevron-down'}
                                size={15}
                                color={Colors.charcoalLight}
                            />
                        )}
                    </TouchableOpacity>

                    {typeDropdownOpen && (
                        <View style={s.list}>
                            <View style={s.searchRow}>
                                <Ionicons
                                    name="search-outline"
                                    size={14}
                                    color={Colors.charcoalLight}
                                    style={{ marginRight: 8 }}
                                />
                                <TextInput
                                    style={s.searchInput}
                                    placeholder="Search venue types..."
                                    placeholderTextColor={Colors.charcoalLight}
                                    value={typeSearch}
                                    onChangeText={setTypeSearch}
                                    autoFocus
                                    returnKeyType="done"
                                />
                                {typeSearch.length > 0 && (
                                    <TouchableOpacity onPress={() => setTypeSearch('')} hitSlop={6}>
                                        <Ionicons
                                            name="close-circle"
                                            size={15}
                                            color={Colors.charcoalLight}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <ScrollView
                                style={s.optionsList}
                                nestedScrollEnabled
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                {filteredTypes.length === 0 ? (
                                    <Text style={s.noResults}>No matching types found</Text>
                                ) : (
                                    filteredTypes.map(type => {
                                        const selected = data.venueTypes.includes(type._id);
                                        return (
                                            <TouchableOpacity
                                                key={type._id}
                                                style={[s.item, selected && s.itemActive]}
                                                onPress={() => toggleType(type.name)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={s.itemLeft}>
                                                    <Text style={s.itemIcon}>{type.icon}</Text>
                                                    <Text
                                                        style={[
                                                            s.itemText,
                                                            selected && s.itemTextActive,
                                                        ]}
                                                    >
                                                        {type.name}
                                                    </Text>
                                                </View>
                                                {selected && (
                                                    <Ionicons
                                                        name="checkmark"
                                                        size={14}
                                                        color={Colors.primary}
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                            </ScrollView>
                            <TouchableOpacity
                                style={s.doneRow}
                                onPress={() => setTypeDropdownOpen(false)}
                            >
                                <Text style={s.doneText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {data.venueTypes.length > 0 && (
                        <View style={s.tagRow}>
                            {data.venueTypes.map(id => (
                                <View key={id} style={s.tag}>
                                    <Text style={s.tagIcon}>{getTypeIcon(id)}</Text>
                                    <Text style={s.tagText}>{getTypeName(id)}</Text>
                                    <TouchableOpacity onPress={() => removeType(id)} hitSlop={6}>
                                        <Ionicons name="close" size={12} color={Colors.primary} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                    {!!errors.venueType && (
                        <View style={s.errorRow}>
                            <Ionicons name="alert-circle" size={12} color={Colors.danger} />
                            <Text style={s.errorText}>{errors.venueType}</Text>
                        </View>
                    )}
                </View>

                <View style={s.pickerSection}>
                    <Text style={s.typeLabel}>
                        MAXIMUM CAPACITY <Text style={s.req}>*</Text>
                    </Text>
                    <PickerRow
                        value={data.capacity}
                        options={CAPACITY_RANGES}
                        open={capOpen}
                        onToggle={() => setCapOpen(v => !v)}
                        onSelect={v => {
                            set({ capacity: v });
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
                    value={data.areaSqft}
                    onChangeText={v => {
                        set({ areaSqft: v });
                        setErrors(p => ({ ...p, totalArea: '' }));
                    }}
                    keyboardType="numeric"
                    error={errors.totalArea}
                />

                <Textarea
                    label={`Venue Description (Max 200 words) *  —  ${wordCount}/200`}
                    placeholder="Description.."
                    value={data.description}
                    onChangeText={v => {
                        set({ description: v });
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
    picker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
        backgroundColor: Colors.surface,
        height: 54,
    },
    pickerError: { borderColor: Colors.danger },
    pickerText: { fontSize: Typography.md, color: Colors.charcoal },
    placeholder: { color: Colors.charcoalLight },
    list: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        marginTop: 4,
        backgroundColor: Colors.surface,
        overflow: 'hidden',
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    searchInput: { flex: 1, fontSize: Typography.md, color: Colors.charcoal, padding: 0 },
    optionsList: { maxHeight: 192 },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    itemIcon: { fontSize: 16 },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    itemActive: { backgroundColor: Colors.primaryLight },
    itemText: { fontSize: Typography.md, color: Colors.charcoal },
    itemTextActive: { color: Colors.primary, fontWeight: Typography.semiBold },
    noResults: {
        textAlign: 'center',
        fontSize: Typography.md,
        color: Colors.charcoalLight,
        paddingVertical: 14,
    },
    doneRow: {
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.primaryLight,
    },
    doneText: { fontSize: Typography.md, fontWeight: Typography.semiBold, color: Colors.primary },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.md,
        paddingVertical: 5,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        backgroundColor: Colors.primaryLight,
    },
    tagIcon: { fontSize: 12 },
    tagText: { fontSize: Typography.xs, fontWeight: Typography.semiBold, color: Colors.primary },
    textarea: { height: 120 },
    pickerSection: { marginBottom: Spacing.md },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
    errorText: { fontSize: 11, color: Colors.danger, fontWeight: Typography.semiBold },
});

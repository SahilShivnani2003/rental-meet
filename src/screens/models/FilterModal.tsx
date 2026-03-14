import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Animated,
    TextInput,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme/theme';

const { height: H } = Dimensions.get('window');

// ── Filter state maps 1-to-1 with API query params ────────────────────────────
export type FilterState = {
    city: string;
    venueType: string; // single venueType name e.g. "Meeting Hall"
    capacity: string; // e.g. "10-50", "50-100", "100-200", "200+"
    minPrice: string; // numeric string e.g. "1000"
    maxPrice: string; // numeric string e.g. "50000"
};

export const DEFAULT_FILTERS: FilterState = {
    city: '',
    venueType: '',
    capacity: '',
    minPrice: '',
    maxPrice: '',
};

// ── Static option lists ───────────────────────────────────────────────────────
const VENUE_TYPES = [
    'Meeting Hall',
    'Conference Hall',
    'Banquet Hall',
    'Function Hall',
    'Marriage Garden',
    'Farm House',
    'Hotel',
    'Restaurant',
    'Open Lawn',
    'Co-Work Space',
    'Training Center',
    'Guest House',
    'Private Auditorium Hall',
    'Govt. Auditorium Hall',
    'School Auditorium Hall',
    'Collage Auditorium Hall',
];

const CAPACITY_OPTIONS = [
    { label: 'Any', value: '' },
    { label: 'Up to 20', value: '0-20' },
    { label: '20 – 50', value: '20-50' },
    { label: '50 – 100', value: '50-100' },
    { label: '100 – 200', value: '100-200' },
    { label: '200 – 500', value: '200-500' },
    { label: '500+', value: '500-9999' },
];

const PRICE_OPTIONS = [
    { label: 'Any', min: '', max: '' },
    { label: 'Under ₹2,000', min: '0', max: '2000' },
    { label: '₹2,000 – ₹5,000', min: '2000', max: '5000' },
    { label: '₹5,000 – ₹10,000', min: '5000', max: '10000' },
    { label: '₹10,000 – ₹25,000', min: '10000', max: '25000' },
    { label: 'Above ₹25,000', min: '25000', max: '' },
];

// ── Props ─────────────────────────────────────────────────────────────────────
type FilterModalProps = {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
    initialFilters?: FilterState;
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function FilterModal({
    visible,
    onClose,
    onApply,
    initialFilters,
}: FilterModalProps) {
    const [filters, setFilters] = useState<FilterState>(initialFilters ?? DEFAULT_FILTERS);
    const slideAnim = useRef(new Animated.Value(H)).current;

    React.useEffect(() => {
        if (visible) {
            // Sync with any external changes to initialFilters each time modal opens
            setFilters(initialFilters ?? DEFAULT_FILTERS);
            slideAnim.setValue(H);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                speed: 16,
                bounciness: 4,
            }).start();
        }
    }, [visible]);

    const set = (key: keyof FilterState, value: string) =>
        setFilters(prev => ({ ...prev, [key]: value }));

    const resetFilters = () => setFilters(DEFAULT_FILTERS);

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    // Count how many filters are non-default
    const activeCount = Object.entries(filters).filter(([, v]) => v !== '').length;

    // Price option matching helper
    const activePriceLabel =
        PRICE_OPTIONS.find(o => o.min === filters.minPrice && o.max === filters.maxPrice)?.label ??
        'Any';

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            {/* Backdrop */}
            <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

            {/* Bottom sheet */}
            <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
                <View style={s.handle} />

                {/* ── Title row ── */}
                <View style={s.titleRow}>
                    <View style={s.titleLeft}>
                        <Ionicons name="options-outline" size={20} color={Colors.charcoal} />
                        <Text style={s.title}>Filters</Text>
                        {activeCount > 0 && (
                            <View style={s.badge}>
                                <Text style={s.badgeText}>{activeCount}</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                        <Ionicons name="close" size={18} color={Colors.charcoal} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={s.body}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── City ── */}
                    <View style={s.section}>
                        <Text style={s.sectionLabel}>City</Text>
                        <View style={s.inputWrap}>
                            <Ionicons
                                name="location-outline"
                                size={16}
                                color={Colors.charcoalLight}
                            />
                            <TextInput
                                style={s.input}
                                placeholder="e.g. Bhopal, Indore..."
                                placeholderTextColor={Colors.charcoalLight}
                                value={filters.city}
                                onChangeText={v => set('city', v)}
                                returnKeyType="done"
                            />
                            {filters.city !== '' && (
                                <TouchableOpacity onPress={() => set('city', '')}>
                                    <Ionicons
                                        name="close-circle"
                                        size={15}
                                        color={Colors.charcoalLight}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={s.divider} />

                    {/* ── Venue Type ── */}
                    <View style={s.section}>
                        <Text style={s.sectionLabel}>Venue Type</Text>
                        <View style={s.checkGrid}>
                            {/* "Any" option */}
                            <TouchableOpacity
                                style={s.checkRow}
                                onPress={() => set('venueType', '')}
                                activeOpacity={0.7}
                            >
                                <View style={[s.radio, filters.venueType === '' && s.radioActive]}>
                                    {filters.venueType === '' && <View style={s.radioDot} />}
                                </View>
                                <Text
                                    style={[
                                        s.checkLabel,
                                        filters.venueType === '' && s.checkLabelActive,
                                    ]}
                                >
                                    Any
                                </Text>
                            </TouchableOpacity>

                            {VENUE_TYPES.map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={s.checkRow}
                                    onPress={() =>
                                        set('venueType', filters.venueType === type ? '' : type)
                                    }
                                    activeOpacity={0.7}
                                >
                                    <View
                                        style={[
                                            s.radio,
                                            filters.venueType === type && s.radioActive,
                                        ]}
                                    >
                                        {filters.venueType === type && <View style={s.radioDot} />}
                                    </View>
                                    <Text
                                        style={[
                                            s.checkLabel,
                                            filters.venueType === type && s.checkLabelActive,
                                        ]}
                                    >
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={s.divider} />

                    {/* ── Capacity ── */}
                    <View style={s.section}>
                        <Text style={s.sectionLabel}>Capacity</Text>
                        <View style={s.chipRow}>
                            {CAPACITY_OPTIONS.map(opt => (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[s.chip, filters.capacity === opt.value && s.chipActive]}
                                    onPress={() => set('capacity', opt.value)}
                                    activeOpacity={0.75}
                                >
                                    <Text
                                        style={[
                                            s.chipText,
                                            filters.capacity === opt.value && s.chipTextActive,
                                        ]}
                                    >
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={s.divider} />

                    {/* ── Price Range ── */}
                    <View style={s.section}>
                        <View style={s.sectionHeaderRow}>
                            <Text style={s.sectionLabel}>Price Range</Text>
                            {activePriceLabel !== 'Any' && (
                                <Text style={s.sectionValue}>{activePriceLabel}</Text>
                            )}
                        </View>
                        <View style={s.chipRow}>
                            {PRICE_OPTIONS.map(opt => {
                                const isActive =
                                    filters.minPrice === opt.min && filters.maxPrice === opt.max;
                                return (
                                    <TouchableOpacity
                                        key={opt.label}
                                        style={[s.chip, isActive && s.chipActive]}
                                        onPress={() => {
                                            set('minPrice', opt.min);
                                            set('maxPrice', opt.max);
                                            // set both at once
                                            setFilters(prev => ({
                                                ...prev,
                                                minPrice: opt.min,
                                                maxPrice: opt.max,
                                            }));
                                        }}
                                        activeOpacity={0.75}
                                    >
                                        <Text style={[s.chipText, isActive && s.chipTextActive]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>

                {/* ── Footer ── */}
                <View style={s.footer}>
                    <TouchableOpacity
                        style={s.resetBtn}
                        onPress={resetFilters}
                        activeOpacity={0.75}
                    >
                        <Ionicons
                            name="close-circle-outline"
                            size={16}
                            color={Colors.charcoalMid}
                        />
                        <Text style={s.resetText}>Reset</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={s.applyBtn} onPress={handleApply} activeOpacity={0.88}>
                        <Text style={s.applyText}>Apply Filters</Text>
                        {activeCount > 0 && (
                            <View style={s.applyBadge}>
                                <Text style={s.applyBadgeText}>{activeCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Modal>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
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
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        maxHeight: '90%',
        paddingBottom: 32,
        ...Shadows.floating,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 4,
    },

    // Title
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    titleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    badge: {
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
    },
    badgeText: { fontSize: 10, fontWeight: Typography.extraBold, color: Colors.charcoal },
    closeBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },

    // Body
    body: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },

    // Section
    section: { paddingVertical: Spacing.md },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    sectionLabel: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
        marginBottom: Spacing.sm,
    },
    sectionValue: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.primaryDark,
        marginBottom: Spacing.sm,
    },

    // City input
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        paddingHorizontal: 14,
        height: 48,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    input: {
        flex: 1,
        fontSize: Typography.md,
        color: Colors.charcoal,
    },

    // Radio list (venue type — single select)
    checkGrid: { gap: 2 },
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 9,
        paddingHorizontal: Spacing.sm,
        borderRadius: Radii.sm,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
    },
    radioDot: {
        width: 9,
        height: 9,
        borderRadius: 4.5,
        backgroundColor: Colors.primary,
    },
    checkLabel: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    checkLabelActive: {
        color: Colors.charcoal,
        fontWeight: Typography.semiBold,
    },

    // Chip row (capacity / price)
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: Radii.full,
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    chipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    chipText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    chipTextActive: {
        color: Colors.charcoal,
        fontWeight: Typography.bold,
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: Colors.divider,
        marginVertical: Spacing.xs,
    },

    // Footer
    footer: {
        flexDirection: 'row',
        gap: Spacing.md,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
    },
    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 50,
        paddingHorizontal: Spacing.xl,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
    },
    resetText: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    applyBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 50,
        borderRadius: Radii.md,
        backgroundColor: Colors.primary,
        ...Shadows.primary,
    },
    applyText: {
        fontSize: Typography.base,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: 0.2,
    },
    applyBadge: {
        backgroundColor: Colors.charcoal,
        borderRadius: Radii.full,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
    },
    applyBadgeText: {
        fontSize: 10,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
    },
});

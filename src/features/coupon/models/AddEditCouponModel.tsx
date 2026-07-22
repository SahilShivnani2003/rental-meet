import { Colors, Radii, Shadows, Spacing, Typography } from '@/theme/theme';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    View,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Text,
    ScrollView,
    TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIocn from 'react-native-vector-icons/MaterialIcons';
import { Coupon } from '../types/Coupon';
import React from 'react';
import { FormState } from '../screens/VenueCouponScreen';
import { useGetOwnerVenue } from '@/features/venue/hooks/useGetOwnerVenue';
import { useAuthStore } from '@/store/useAuthStore';
import { Venue } from '@/features/venue/types/Venue';
import CalendarModal from '@/components/UI/calenderModal';

const EMPTY_FORM: FormState = {
    code: '',
    discountType: 'percentage',
    discountValue: '',
    maxDiscount: '',
    minBookingAmount: '',
    maxUses: '',
    expiryDate: '',
    isActive: true,
    venue: '',
};

const APPLIES_TO_OPTIONS: NonNullable<Coupon['appliesTo']>[] = [
    'total',
    'platformFee',
    'amenities',
    'baseAmount',
];

export default function AddEditCouponModal({
    visible,
    onClose,
    initial,
    onSubmit,
    submitting,
}: {
    visible: boolean;
    onClose: () => void;
    initial: Coupon | null;
    onSubmit: (form: FormState) => void;
    submitting: boolean;
}) {
    const { user } = useAuthStore();
    const slideAnim = useRef(new Animated.Value(600)).current;
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [venueOpen, setVenueOpen] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const { data: venueData } = useGetOwnerVenue({
        enabled: user?.role === 'owner' ? true : false,
    });
    const isEdit = !!initial;
    const venueList = venueData?.venues;
    const activeVenues: Venue[] = (
        Array.isArray(venueList) ? venueList : venueList ? [venueList] : []
    ).filter(v => v.status === 'approved');

    const selectedVenue = activeVenues.find(v => v._id === form.venue);

    React.useEffect(() => {
        if (visible) {
            setForm(
                initial
                    ? {
                          code: initial.code ?? '',
                          discountType: initial.discountType ?? 'percentage',
                          discountValue: String(initial.discountValue ?? ''),
                          maxDiscount: initial.maxDiscount ? String(initial.maxDiscount) : '',
                          minBookingAmount: initial.minBookingAmount
                              ? String(initial.minBookingAmount)
                              : '',
                          maxUses: initial.maxUses ? String(initial.maxUses) : '',
                          expiryDate: initial.expiryDate
                              ? new Date(initial.expiryDate).toISOString().slice(0, 10)
                              : '',
                          isActive: initial.isActive ?? true,
                          venue: (initial as any).venue ?? '', // ← was missing entirely
                      }
                    : EMPTY_FORM,
            );
            setErrors({});
            slideAnim.setValue(600);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                speed: 18,
                bounciness: 4,
            }).start();
        }
    }, [visible, initial]);

    const handleClose = () => {
        Animated.timing(slideAnim, { toValue: 600, duration: 220, useNativeDriver: true }).start(
            onClose,
        );
    };

    const clearError = (key: string) => setErrors(prev => ({ ...prev, [key]: '' }));

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.code.trim()) e.code = 'Coupon code is required';
        if (!form.discountValue.trim()) {
            e.discountValue = 'Discount value is required';
        } else if (isNaN(Number(form.discountValue)) || Number(form.discountValue) <= 0) {
            e.discountValue = 'Enter a valid positive number';
        } else if (form.discountType === 'percentage' && Number(form.discountValue) > 100) {
            e.discountValue = 'Percentage cannot exceed 100';
        }
        if (form.maxDiscount && isNaN(Number(form.maxDiscount))) {
            e.maxDiscount = 'Enter a valid number';
        }
        if (form.minBookingAmount && isNaN(Number(form.minBookingAmount))) {
            e.minBookingAmount = 'Enter a valid number';
        }
        if (form.maxUses && isNaN(Number(form.maxUses))) {
            e.maxUses = 'Enter a valid number';
        }
        if (form.expiryDate && isNaN(new Date(form.expiryDate).getTime())) {
            e.expiryDate = 'Use format YYYY-MM-DD';
        }
        return e;
    };

    const handleSubmit = () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) return;
        onSubmit(form);
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFillObject}
                    activeOpacity={1}
                    onPress={handleClose}
                />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.kavWrapper}
                >
                    <Animated.View
                        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
                    >
                        <View style={styles.handle} />

                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetHeaderTitle}>
                                {isEdit ? 'Edit Coupon' : 'New Coupon'}
                            </Text>
                            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                                <Ionicons name="close" size={20} color={Colors.charcoal} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.sheetBody}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Code */}
                            {/* Code */}
                            <Text style={styles.fieldLabel}>Coupon Code</Text>
                            {isEdit ? (
                                <View style={[styles.inputRow, styles.inputRowLocked]}>
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={16}
                                        color={Colors.charcoalLight}
                                    />
                                    <Text style={[styles.input, { color: Colors.charcoalMid }]}>
                                        {form.code}
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <View
                                        style={[
                                            styles.inputRow,
                                            !!errors.code && styles.inputRowError,
                                        ]}
                                    >
                                        <Ionicons
                                            name="pricetag-outline"
                                            size={16}
                                            color={Colors.charcoalMid}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. WELCOME20"
                                            placeholderTextColor={Colors.charcoalLight}
                                            value={form.code}
                                            autoCapitalize="characters"
                                            onChangeText={t => {
                                                setForm(prev => ({
                                                    ...prev,
                                                    code: t.toUpperCase(),
                                                }));
                                                clearError('code');
                                            }}
                                        />
                                    </View>
                                    {!!errors.code && (
                                        <Text style={styles.errorText}>{errors.code}</Text>
                                    )}
                                </>
                            )}

                            {/* Venue */}
                            {!isEdit && (
                                <>
                                    <Text style={styles.fieldLabel}>Venue</Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.inputRow,
                                            !!errors.venue && styles.inputRowError,
                                        ]}
                                        onPress={() => setVenueOpen(o => !o)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons
                                            name="business-outline"
                                            size={16}
                                            color={Colors.charcoalMid}
                                        />
                                        <Text
                                            style={[
                                                styles.input,
                                                !selectedVenue && { color: Colors.charcoalLight },
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {selectedVenue?.businessName ?? 'Select venue'}
                                        </Text>
                                        <Ionicons
                                            name={venueOpen ? 'chevron-up' : 'chevron-down'}
                                            size={16}
                                            color={Colors.charcoalMid}
                                        />
                                    </TouchableOpacity>
                                    {!!errors.venue && (
                                        <Text style={styles.errorText}>{errors.venue}</Text>
                                    )}

                                    {venueOpen && (
                                        <View style={styles.venueDropdown}>
                                            {activeVenues.length === 0 ? (
                                                <Text style={styles.venueEmptyText}>
                                                    No active venues found
                                                </Text>
                                            ) : (
                                                activeVenues.map(v => (
                                                    <TouchableOpacity
                                                        key={v._id}
                                                        style={styles.venueOption}
                                                        onPress={() => {
                                                            setForm(prev => ({
                                                                ...prev,
                                                                venue: v._id!,
                                                            }));
                                                            clearError('venue');
                                                            setVenueOpen(false);
                                                        }}
                                                        activeOpacity={0.75}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.venueOptionText,
                                                                v._id === form.venue &&
                                                                    styles.venueOptionTextActive,
                                                            ]}
                                                            numberOfLines={1}
                                                        >
                                                            {v.businessName}
                                                        </Text>
                                                        {v._id === form.venue && (
                                                            <Ionicons
                                                                name="checkmark"
                                                                size={16}
                                                                color={Colors.primary}
                                                            />
                                                        )}
                                                    </TouchableOpacity>
                                                ))
                                            )}
                                        </View>
                                    )}
                                </>
                            )}

                            {/* Discount type */}
                            {!isEdit && (
                                <>
                                    <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
                                        Discount Type
                                    </Text>
                                    <View style={styles.chipRow}>
                                        {(['percentage', 'fixed'] as const).map(type => (
                                            <TouchableOpacity
                                                key={type}
                                                style={[
                                                    styles.chip,
                                                    form.discountType === type && styles.chipActive,
                                                ]}
                                                onPress={() =>
                                                    setForm(prev => ({
                                                        ...prev,
                                                        discountType: type,
                                                    }))
                                                }
                                                activeOpacity={0.8}
                                            >
                                                <Text
                                                    style={[
                                                        styles.chipText,
                                                        form.discountType === type &&
                                                            styles.chipTextActive,
                                                    ]}
                                                >
                                                    {type === 'percentage'
                                                        ? 'Percentage (%)'
                                                        : 'Fixed (₹)'}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Discount value */}
                                    <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
                                        Discount Value{' '}
                                        {form.discountType === 'percentage' ? '(%)' : '(₹)'}
                                    </Text>
                                    <View
                                        style={[
                                            styles.inputRow,
                                            !!errors.discountValue && styles.inputRowError,
                                        ]}
                                    >
                                        {form.discountType === 'fixed' ? (
                                            <Ionicons
                                                name="cash-outline"
                                                size={16}
                                                color={Colors.charcoalMid}
                                            />
                                        ) : (
                                            <MaterialIocn
                                                name="percent"
                                                size={16}
                                                color={Colors.charcoalMid}
                                            />
                                        )}

                                        <TextInput
                                            style={styles.input}
                                            placeholder={
                                                form.discountType === 'percentage' ? '20' : '200'
                                            }
                                            placeholderTextColor={Colors.charcoalLight}
                                            value={form.discountValue}
                                            keyboardType="numeric"
                                            onChangeText={t => {
                                                setForm(prev => ({
                                                    ...prev,
                                                    discountValue: t.replace(/[^0-9.]/g, ''),
                                                }));
                                                clearError('discountValue');
                                            }}
                                        />
                                    </View>
                                    {!!errors.discountValue && (
                                        <Text style={styles.errorText}>{errors.discountValue}</Text>
                                    )}
                                </>
                            )}

                            {/* Max discount — only relevant for percentage */}
                            {!isEdit && form.discountType === 'percentage' && (
                                <>
                                    <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
                                        Max Discount Cap (₹, optional)
                                    </Text>
                                    <View
                                        style={[
                                            styles.inputRow,
                                            !!errors.maxDiscount && styles.inputRowError,
                                        ]}
                                    >
                                        <Ionicons
                                            name="lock-closed-outline"
                                            size={16}
                                            color={Colors.charcoalMid}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. 500"
                                            placeholderTextColor={Colors.charcoalLight}
                                            value={form.maxDiscount}
                                            keyboardType="numeric"
                                            onChangeText={t => {
                                                setForm(prev => ({
                                                    ...prev,
                                                    maxDiscount: t.replace(/[^0-9.]/g, ''),
                                                }));
                                                clearError('maxDiscount');
                                            }}
                                        />
                                    </View>
                                    {!!errors.maxDiscount && (
                                        <Text style={styles.errorText}>{errors.maxDiscount}</Text>
                                    )}
                                </>
                            )}

                            {/* Min booking amount */}
                            {!isEdit && (
                                <>
                                    <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
                                        Minimum Booking Amount (₹, optional)
                                    </Text>
                                    <View
                                        style={[
                                            styles.inputRow,
                                            !!errors.minBookingAmount && styles.inputRowError,
                                        ]}
                                    >
                                        <Ionicons
                                            name="wallet-outline"
                                            size={16}
                                            color={Colors.charcoalMid}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. 1000"
                                            placeholderTextColor={Colors.charcoalLight}
                                            value={form.minBookingAmount}
                                            keyboardType="numeric"
                                            onChangeText={t => {
                                                setForm(prev => ({
                                                    ...prev,
                                                    minBookingAmount: t.replace(/[^0-9.]/g, ''),
                                                }));
                                                clearError('minBookingAmount');
                                            }}
                                        />
                                    </View>
                                    {!!errors.minBookingAmount && (
                                        <Text style={styles.errorText}>
                                            {errors.minBookingAmount}
                                        </Text>
                                    )}
                                </>
                            )}

                            {/* Max uses */}
                            <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
                                Max Uses (optional)
                            </Text>
                            <View
                                style={[styles.inputRow, !!errors.maxUses && styles.inputRowError]}
                            >
                                <Ionicons
                                    name="repeat-outline"
                                    size={16}
                                    color={Colors.charcoalMid}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 100"
                                    placeholderTextColor={Colors.charcoalLight}
                                    value={form.maxUses}
                                    keyboardType="numeric"
                                    onChangeText={t => {
                                        setForm(prev => ({
                                            ...prev,
                                            maxUses: t.replace(/[^0-9]/g, ''),
                                        }));
                                        clearError('maxUses');
                                    }}
                                />
                            </View>
                            {!!errors.maxUses && (
                                <Text style={styles.errorText}>{errors.maxUses}</Text>
                            )}

                            {/* Expiry date */}
                            <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
                                Expiry Date (optional)
                            </Text>
                            <TouchableOpacity
                                style={[
                                    styles.inputRow,
                                    !!errors.expiryDate && styles.inputRowError,
                                ]}
                                onPress={() => setCalendarOpen(true)}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name="calendar-outline"
                                    size={16}
                                    color={Colors.charcoalMid}
                                />
                                <Text
                                    style={[
                                        styles.input,
                                        !form.expiryDate && { color: Colors.charcoalLight },
                                    ]}
                                >
                                    {form.expiryDate || 'Select expiry date'}
                                </Text>
                                {!!form.expiryDate && (
                                    <TouchableOpacity
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        onPress={() =>
                                            setForm(prev => ({ ...prev, expiryDate: '' }))
                                        }
                                    >
                                        <Ionicons
                                            name="close-circle"
                                            size={16}
                                            color={Colors.charcoalLight}
                                        />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                            {!!errors.expiryDate && (
                                <Text style={styles.errorText}>{errors.expiryDate}</Text>
                            )}

                            {/* Active toggle */}
                            <TouchableOpacity
                                style={styles.activeRow}
                                onPress={() =>
                                    setForm(prev => ({ ...prev, isActive: !prev.isActive }))
                                }
                                activeOpacity={0.8}
                            >
                                <View
                                    style={[
                                        styles.toggleTrack,
                                        form.isActive && styles.toggleTrackOn,
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.toggleThumb,
                                            form.isActive && styles.toggleThumbOn,
                                        ]}
                                    />
                                </View>
                                <Text style={styles.activeRowText}>
                                    {form.isActive ? 'Active' : 'Inactive'} on save
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                                onPress={handleSubmit}
                                disabled={submitting}
                                activeOpacity={0.9}
                            >
                                <Text style={styles.submitBtnText}>
                                    {submitting
                                        ? 'Saving…'
                                        : isEdit
                                        ? 'Save Changes'
                                        : 'Create Coupon'}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </Animated.View>
                </KeyboardAvoidingView>

                <CalendarModal
                    visible={calendarOpen}
                    selectedDate={form.expiryDate}
                    onSelect={date => {
                        setForm(prev => ({ ...prev, expiryDate: date }));
                        clearError('expiryDate');
                    }}
                    onClose={() => setCalendarOpen(false)}
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    kavWrapper: { justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        paddingTop: 12,
        maxHeight: '92%',
        ...Shadows.floating,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginBottom: 16,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    sheetHeaderTitle: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: Radii.sm,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sheetBody: { padding: Spacing.xl, paddingBottom: 40 },

    fieldLabel: {
        fontSize: 12,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalLight,
        marginBottom: Spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        height: 52,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.md,
    },
    inputRowLocked: {
        backgroundColor: Colors.background,
        borderColor: Colors.divider,
    },
    inputRowError: { borderColor: Colors.danger },
    input: { flex: 1, fontSize: 14, color: Colors.charcoal, fontWeight: Typography.medium },
    errorText: {
        fontSize: 11,
        color: Colors.danger,
        fontWeight: Typography.semiBold,
        marginTop: 4,
    },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
    chip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
    },
    chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    chipText: { fontSize: 12.5, color: Colors.charcoalLight, fontWeight: Typography.semiBold },
    chipTextActive: { color: Colors.charcoal, fontWeight: Typography.bold },

    activeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    toggleTrack: {
        width: 44,
        height: 26,
        borderRadius: 13,
        backgroundColor: Colors.border,
        padding: 3,
        justifyContent: 'center',
    },
    toggleTrackOn: { backgroundColor: Colors.primary },
    toggleThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.white,
    },
    toggleThumbOn: { alignSelf: 'flex-end' },
    activeRowText: {
        fontSize: 13,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },

    submitBtn: {
        backgroundColor: Colors.charcoal,
        borderRadius: Radii.md,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.floating,
    },
    submitBtnText: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.3,
    },
    venueDropdown: {
        marginTop: 6,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
        overflow: 'hidden',
    },
    venueOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    venueOptionText: {
        fontSize: 14,
        color: Colors.charcoal,
        fontWeight: Typography.medium,
        flex: 1,
    },
    venueOptionTextActive: { color: Colors.primary, fontWeight: Typography.bold },
    venueEmptyText: {
        padding: Spacing.md,
        fontSize: 13,
        color: Colors.charcoalLight,
        fontStyle: 'italic',
    },
    calendarBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendarSheet: {
        width: '90%',
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        ...Shadows.floating,
    },
});

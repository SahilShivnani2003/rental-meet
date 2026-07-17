import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Modal,
    Animated,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';
import { Colors, Radii, Spacing, Shadows, Typography } from '@/theme/theme';
import { useAlert } from '@/context/AlertContext';
import Loader from '@/components/UI/loader';
import {
    useGetVenueCoupons,
    useCreateVenueCoupon,
    useUpdateVenueCoupon,
    useDeleteVenueCoupon,
} from '../hooks/useVenueCoupon';
import { Coupon } from '../types/Coupon';

type VenueCouponScreenProps = NativeStackScreenProps<RootStackParamList, 'venueCoupon'>;

const APPLIES_TO_OPTIONS: NonNullable<Coupon['appliesTo']>[] = [
    'total',
    'platformFee',
    'amenities',
    'baseAmount',
];

const APPLIES_TO_LABEL: Record<NonNullable<Coupon['appliesTo']>, string> = {
    total: 'Total',
    platformFee: 'Platform Fee',
    amenities: 'Amenities',
    baseAmount: 'Base Amount',
};

type FormState = {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: string;
    appliesTo: NonNullable<Coupon['appliesTo']>;
    maxDiscount: string;
    minBookingAmount: string;
    maxUses: string;
    expiryDate: string; // yyyy-mm-dd
    isActive: boolean;
};

const EMPTY_FORM: FormState = {
    code: '',
    discountType: 'percentage',
    discountValue: '',
    appliesTo: 'total',
    maxDiscount: '',
    minBookingAmount: '',
    maxUses: '',
    expiryDate: '',
    isActive: true,
};

function isExpired(coupon: Coupon) {
    if (!coupon.expiryDate) return false;
    return new Date(coupon.expiryDate).getTime() < Date.now();
}

function formatDiscount(coupon: Coupon) {
    return coupon.discountType === 'percentage'
        ? `${coupon.discountValue}% off`
        : `₹${coupon.discountValue} off`;
}

// ─── Coupon card ────────────────────────────────────────────────────────────────
function CouponCard({
    coupon,
    onEdit,
    onDelete,
    onToggleActive,
}: {
    coupon: Coupon;
    onEdit: () => void;
    onDelete: () => void;
    onToggleActive: () => void;
}) {
    const expired = isExpired(coupon);
    const active = !!coupon.isActive && !expired;

    return (
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <View style={styles.codeWrap}>
                    <Ionicons name="pricetag" size={16} color={Colors.primary} />
                    <Text style={styles.codeText}>{coupon.code}</Text>
                </View>
                <View
                    style={[
                        styles.statusBadge,
                        {
                            backgroundColor: expired
                                ? Colors.dangerLight
                                : active
                                ? Colors.successLight
                                : Colors.border,
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.statusBadgeText,
                            {
                                color: expired
                                    ? Colors.danger
                                    : active
                                    ? Colors.success
                                    : Colors.charcoalLight,
                            },
                        ]}
                    >
                        {expired ? 'Expired' : active ? 'Active' : 'Inactive'}
                    </Text>
                </View>
            </View>

            <Text style={styles.discountText}>{formatDiscount(coupon)}</Text>
            <Text style={styles.appliesText}>
                Applies to {APPLIES_TO_LABEL[coupon.appliesTo ?? 'total']}
                {coupon.maxDiscount ? ` · capped at ₹${coupon.maxDiscount}` : ''}
            </Text>

            <View style={styles.metaRow}>
                {!!coupon.minBookingAmount && (
                    <View style={styles.metaItem}>
                        <Ionicons name="wallet-outline" size={13} color={Colors.charcoalLight} />
                        <Text style={styles.metaText}>Min ₹{coupon.minBookingAmount}</Text>
                    </View>
                )}
                <View style={styles.metaItem}>
                    <Ionicons name="repeat-outline" size={13} color={Colors.charcoalLight} />
                    <Text style={styles.metaText}>
                        {coupon.usedCount ?? 0}
                        {coupon.maxUses ? ` / ${coupon.maxUses}` : ''} used
                    </Text>
                </View>
                {!!coupon.expiryDate && (
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={13} color={Colors.charcoalLight} />
                        <Text style={styles.metaText}>
                            Expires {new Date(coupon.expiryDate).toLocaleDateString()}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={onToggleActive}
                    activeOpacity={0.75}
                >
                    <Ionicons
                        name={coupon.isActive ? 'pause-outline' : 'play-outline'}
                        size={15}
                        color={Colors.charcoalMid}
                    />
                    <Text style={styles.actionBtnText}>
                        {coupon.isActive ? 'Deactivate' : 'Activate'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={onEdit} activeOpacity={0.75}>
                    <Ionicons name="create-outline" size={15} color={Colors.charcoalMid} />
                    <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnDanger]}
                    onPress={onDelete}
                    activeOpacity={0.75}
                >
                    <Ionicons name="trash-outline" size={15} color={Colors.danger} />
                    <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Empty state ────────────────────────────────────────────────────────────────
function EmptyState() {
    return (
        <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
                <Ionicons name="pricetags-outline" size={30} color={Colors.charcoalLight} />
            </View>
            <Text style={styles.emptyTitle}>No coupons yet</Text>
            <Text style={styles.emptySubtitle}>
                Create a coupon to offer discounts on bookings for this venue.
            </Text>
        </View>
    );
}

// ─── Create / Edit sheet ────────────────────────────────────────────────────────
function CouponFormSheet({
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
    const slideAnim = useRef(new Animated.Value(600)).current;
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const isEdit = !!initial;

    React.useEffect(() => {
        if (visible) {
            setForm(
                initial
                    ? {
                          code: initial.code ?? '',
                          discountType: initial.discountType ?? 'percentage',
                          discountValue: String(initial.discountValue ?? ''),
                          appliesTo: initial.appliesTo ?? 'total',
                          maxDiscount: initial.maxDiscount ? String(initial.maxDiscount) : '',
                          minBookingAmount: initial.minBookingAmount
                              ? String(initial.minBookingAmount)
                              : '',
                          maxUses: initial.maxUses ? String(initial.maxUses) : '',
                          expiryDate: initial.expiryDate
                              ? new Date(initial.expiryDate).toISOString().slice(0, 10)
                              : '',
                          isActive: initial.isActive ?? true,
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
                            <Text style={styles.fieldLabel}>Coupon Code</Text>
                            <View style={[styles.inputRow, !!errors.code && styles.inputRowError]}>
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
                                        setForm(prev => ({ ...prev, code: t.toUpperCase() }));
                                        clearError('code');
                                    }}
                                />
                            </View>
                            {!!errors.code && <Text style={styles.errorText}>{errors.code}</Text>}

                            {/* Discount type */}
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
                                            setForm(prev => ({ ...prev, discountType: type }))
                                        }
                                        activeOpacity={0.8}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                form.discountType === type && styles.chipTextActive,
                                            ]}
                                        >
                                            {type === 'percentage' ? 'Percentage (%)' : 'Fixed (₹)'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Discount value */}
                            <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
                                Discount Value {form.discountType === 'percentage' ? '(%)' : '(₹)'}
                            </Text>
                            <View
                                style={[
                                    styles.inputRow,
                                    !!errors.discountValue && styles.inputRowError,
                                ]}
                            >
                                <Ionicons
                                    name={
                                        form.discountType === 'percentage'
                                            ? 'percent-outline'
                                            : 'cash-outline'
                                    }
                                    size={16}
                                    color={Colors.charcoalMid}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder={form.discountType === 'percentage' ? '20' : '200'}
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

                            {/* Applies to */}
                            <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
                                Applies To
                            </Text>
                            <View style={styles.chipRow}>
                                {APPLIES_TO_OPTIONS.map(opt => (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[
                                            styles.chip,
                                            form.appliesTo === opt && styles.chipActive,
                                        ]}
                                        onPress={() =>
                                            setForm(prev => ({ ...prev, appliesTo: opt }))
                                        }
                                        activeOpacity={0.8}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                form.appliesTo === opt && styles.chipTextActive,
                                            ]}
                                        >
                                            {APPLIES_TO_LABEL[opt]}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Max discount — only relevant for percentage */}
                            {form.discountType === 'percentage' && (
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
                                <Text style={styles.errorText}>{errors.minBookingAmount}</Text>
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
                            <View
                                style={[
                                    styles.inputRow,
                                    !!errors.expiryDate && styles.inputRowError,
                                ]}
                            >
                                <Ionicons
                                    name="calendar-outline"
                                    size={16}
                                    color={Colors.charcoalMid}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={Colors.charcoalLight}
                                    value={form.expiryDate}
                                    onChangeText={t => {
                                        setForm(prev => ({ ...prev, expiryDate: t }));
                                        clearError('expiryDate');
                                    }}
                                />
                            </View>
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
            </View>
        </Modal>
    );
}

// ─── Screen ─────────────────────────────────────────────────────────────────────
export const VenueCouponScreen = ({ navigation }: VenueCouponScreenProps) => {
    const alert = useAlert();

    const { data, isLoading, isRefetching, refetch } = useGetVenueCoupons();
    const coupons: Coupon[] = (data as any)?.coupons ?? (data as any) ?? [];

    const { mutate: createCoupon, isPending: creating } = useCreateVenueCoupon();
    const { mutate: updateCoupon, isPending: updating } = useUpdateVenueCoupon();
    const { mutate: deleteCoupon } = useDeleteVenueCoupon();

    const [sheetVisible, setSheetVisible] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    const handleRefresh = useCallback(() => refetch(), [refetch]);

    const openCreate = () => {
        setEditingCoupon(null);
        setSheetVisible(true);
    };

    const openEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setSheetVisible(true);
    };

    const buildPayload = (form: FormState) => ({
        code: form.code.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        appliesTo: form.appliesTo,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        minBookingAmount: form.minBookingAmount ? Number(form.minBookingAmount) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiryDate: form.expiryDate ? new Date(form.expiryDate) : null,
        isActive: form.isActive,
    });

    const handleFormSubmit = (form: FormState) => {
        const payload = buildPayload(form);

        if (editingCoupon?._id) {
            updateCoupon({ id: editingCoupon._id, ...payload } as any, {
                onSuccess: () => {
                    setSheetVisible(false);
                    refetch();
                    alert.success('Coupon Updated', 'The coupon has been updated.');
                },
                onError: (err: any) => {
                    alert.error('Update Failed', err?.message || 'Something went wrong.');
                },
            });
        } else {
            createCoupon(payload as any, {
                onSuccess: () => {
                    setSheetVisible(false);
                    refetch();
                    alert.success('Coupon Created', 'The coupon is ready to use.');
                },
                onError: (err: any) => {
                    alert.error('Creation Failed', err?.message || 'Something went wrong.');
                },
            });
        }
    };

    const handleToggleActive = (coupon: Coupon) => {
        if (!coupon._id) return;
        updateCoupon({ id: coupon._id, isActive: !coupon.isActive } as any, {
            onSuccess: () => refetch(),
            onError: (err: any) => {
                alert.error('Update Failed', err?.message || 'Could not update coupon status.');
            },
        });
    };

    const handleDelete = (coupon: Coupon) => {
        alert.show({
            type: 'confirm',
            title: 'Delete Coupon',
            message: `Delete "${coupon.code}"? This cannot be undone.`,
            buttons: [
                { label: 'Cancel', onPress: alert.dismiss, style: 'ghost' },
                {
                    label: 'Delete',
                    style: 'danger',
                    onPress: () => {
                        if (!coupon._id) return;
                        deleteCoupon(coupon._id as any, {
                            onSuccess: () => {
                                alert.dismiss();
                                refetch();
                            },
                            onError: (err: any) => {
                                alert.dismiss();
                                alert.error(
                                    'Delete Failed',
                                    err?.message || 'Could not delete coupon.',
                                );
                            },
                        });
                    },
                },
            ],
        });
    };

    if (isLoading && !data) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerAccentBar} />
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.headerEyebrow}>OFFERS</Text>
                            <Text style={styles.headerTitle}>Venue Coupons</Text>
                        </View>
                    </View>
                </View>
                <Loader size="md" label="Loading coupons…" style={styles.loader} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <View style={styles.headerAccentBar} />
                <View style={styles.headerContent}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={18} color={Colors.charcoal} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerEyebrow}>OFFERS</Text>
                        <Text style={styles.headerTitle}>Venue Coupons</Text>
                    </View>
                    <View style={{ width: 36 }} />
                </View>
            </View>

            <FlatList
                data={coupons}
                keyExtractor={(item, index) => item._id ?? String(index)}
                contentContainerStyle={
                    coupons.length === 0 ? styles.listEmptyContainer : styles.listContent
                }
                renderItem={({ item }) => (
                    <CouponCard
                        coupon={item}
                        onEdit={() => openEdit(item)}
                        onDelete={() => handleDelete(item)}
                        onToggleActive={() => handleToggleActive(item)}
                    />
                )}
                ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
                ListEmptyComponent={<EmptyState />}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={handleRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
            />

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={openCreate} activeOpacity={0.85}>
                <Ionicons name="add" size={26} color={Colors.white} />
            </TouchableOpacity>

            <CouponFormSheet
                visible={sheetVisible}
                onClose={() => setSheetVisible(false)}
                initial={editingCoupon}
                onSubmit={handleFormSubmit}
                submitting={creating || updating}
            />
        </View>
    );
};

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    header: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        paddingBottom: Spacing.xl,
        ...Shadows.header,
    },
    headerAccentBar: { height: 4, backgroundColor: Colors.primary },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        gap: Spacing.md,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: Radii.sm,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerEyebrow: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: Typography.wider,
        marginBottom: Spacing.xxs,
        textAlign: 'center',
    },
    headerTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
        textAlign: 'center',
    },

    loader: { paddingTop: 80 },

    listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 120 },
    listEmptyContainer: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

    // ── Coupon card ──
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        ...Shadows.card,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.xs,
    },
    codeWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    codeText: {
        fontSize: Typography.md,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: 0.5,
    },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.full },
    statusBadgeText: { fontSize: Typography.sm, fontWeight: Typography.bold },

    discountText: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.primaryDark,
        marginBottom: 2,
    },
    appliesText: {
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        marginBottom: Spacing.sm,
    },

    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.sm },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: {
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },

    cardActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: Spacing.sm,
        marginTop: Spacing.xs,
        gap: Spacing.sm,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: Radii.sm,
        backgroundColor: Colors.background,
    },
    actionBtnDanger: { backgroundColor: Colors.dangerLight },
    actionBtnText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },

    // ── Empty state ──
    emptyWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingHorizontal: Spacing.xl,
    },
    emptyIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    emptyTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        textAlign: 'center',
        lineHeight: 19,
    },

    // ── FAB ──
    fab: {
        position: 'absolute',
        right: Spacing.xl,
        bottom: Spacing.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.primary,
    },

    // ── Sheet (shared with EditProfileModal-style sheets) ──
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
});

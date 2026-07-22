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
import CouponCard from '../components/CouponCard';
import AddEditCouponModal from '../models/AddEditCouponModel';

type VenueCouponScreenProps = NativeStackScreenProps<RootStackParamList, 'venueCoupon'>;

export type FormState = {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: string;
    maxDiscount: string;
    minBookingAmount: string;
    maxUses: string;
    expiryDate: string; // yyyy-mm-dd
    isActive: boolean;
    venue: string;
};

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
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        minBookingAmount: form.minBookingAmount ? Number(form.minBookingAmount) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiryDate: form.expiryDate,
        isActive: form.isActive,
        venueId: form.venue,
    });

    const handleFormSubmit = (form: FormState) => {
        const payload = buildPayload(form);
        console.log('coupon payload : ', payload);
        if (editingCoupon?._id) {
            updateCoupon(
                {
                    id: editingCoupon._id,
                    payload: {
                        ...editingCoupon,
                        expiryDate: payload.expiryDate,
                        maxUses: payload.maxUses,
                    },
                } as any,
                {
                    onSuccess: () => {
                        setSheetVisible(false);
                        refetch();
                        alert.success('Coupon Updated', 'The coupon has been updated.');
                    },
                    onError: (err: any) => {
                        alert.error('Update Failed', err?.message || 'Something went wrong.');
                    },
                },
            );
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

        updateCoupon(
            {
                id: coupon._id,
                payload: {
                    ...coupon,
                    isActive: !coupon.isActive,
                },
            },
            {
                onSuccess: () => refetch(),
                onError: (err: any) => {
                    alert.error('Update Failed', err?.message || 'Could not update coupon status.');
                },
            },
        );
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

            <AddEditCouponModal
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
});

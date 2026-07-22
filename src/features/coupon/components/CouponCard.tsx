import { Colors, Radii, Shadows, Spacing, Typography } from '@/theme/theme';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Coupon } from '../types/Coupon';

export const APPLIES_TO_LABEL: Record<NonNullable<Coupon['appliesTo']>, string> = {
    total: 'Total',
    platformFee: 'Platform Fee',
    amenities: 'Amenities',
    baseAmount: 'Base Amount',
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

export default function CouponCard({
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

const styles = StyleSheet.create({
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
});

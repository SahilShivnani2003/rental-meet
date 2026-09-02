import { Colors, Spacing, Radii, Shadows, Typography } from '@/theme/theme';
import React from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// ── Types ─────────────────────────────────────────────────────────────────────
export type PayoutMethod = 'upi' | 'bank';

export interface BankAccountDetails {
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    verified?: boolean;
}

export interface RequestPayoutModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (payload: { amount: number; method: PayoutMethod }) => void;
    availableBalance: number;
    upiId?: string;
    upiVerified?: boolean;
    bankAccount?: BankAccountDetails;
    isSubmitting?: boolean;
    minWithdrawal?: number;
}

const N_A = 'N/A';

// ── Small building blocks ────────────────────────────────────────────────────

const VerifiedPill = () => (
    <View style={styles.verifiedPill}>
        <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
        <Text style={styles.verifiedPillText}>Verified</Text>
    </View>
);

const DetailRow = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
);

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function RequestPayoutModal({
    visible,
    onClose,
    onConfirm,
    availableBalance,
    upiId,
    upiVerified = true,
    bankAccount,
    isSubmitting = false,
    minWithdrawal = 100,
}: RequestPayoutModalProps) {
    const [method, setMethod] = React.useState<PayoutMethod>('upi');
    const [amount, setAmount] = React.useState('');

    // Reset local state whenever the modal is (re)opened
    React.useEffect(() => {
        if (visible) {
            setAmount('');
            setMethod('upi');
        }
    }, [visible]);

    const numericAmount = Number(amount);
    const isAmountValid =
        amount.trim().length > 0 &&
        !isNaN(numericAmount) &&
        numericAmount >= minWithdrawal &&
        numericAmount <= availableBalance;

    const canSubmit = isAmountValid && !isSubmitting;

    const handleConfirm = () => {
        if (!canSubmit) return;
        onConfirm({ amount: numericAmount, method });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                style={styles.backdrop}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                <View style={styles.card}>
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>Request Payout</Text>
                            <Text style={styles.subtitle}>Available: ₹{availableBalance}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="close" size={20} color={Colors.charcoalLight} />
                        </TouchableOpacity>
                    </View>

                    {/* Amount input */}
                    <View style={styles.fieldBlock}>
                        <Text style={styles.fieldLabel}>Withdrawal Amount (₹) *</Text>
                        <TextInput
                            style={styles.amountInput}
                            placeholder={`Min. ₹${minWithdrawal}`}
                            placeholderTextColor={Colors.charcoalLight}
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
                            editable={!isSubmitting}
                        />
                    </View>

                    {/* Payout method */}
                    <View style={styles.fieldBlock}>
                        <Text style={styles.fieldLabel}>Payout Method</Text>
                        <View style={styles.methodToggleRow}>
                            <TouchableOpacity
                                style={[
                                    styles.methodButton,
                                    method === 'upi' && styles.methodButtonActiveUpi,
                                ]}
                                onPress={() => setMethod('upi')}
                                disabled={isSubmitting}
                            >
                                <Text
                                    style={[
                                        styles.methodButtonText,
                                        method === 'upi' && styles.methodButtonTextActiveUpi,
                                    ]}
                                >
                                    UPI ID
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.methodButton,
                                    method === 'bank' && styles.methodButtonActiveBank,
                                ]}
                                onPress={() => setMethod('bank')}
                                disabled={isSubmitting}
                            >
                                <Text
                                    style={[
                                        styles.methodButtonText,
                                        method === 'bank' && styles.methodButtonTextActiveBank,
                                    ]}
                                >
                                    Bank Transfer
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Method details */}
                    {method === 'upi' ? (
                        <View style={styles.detailsCard}>
                            <View style={styles.detailsCardHeader}>
                                <Text style={styles.detailsCardTitle}>Registered UPI ID</Text>
                                {upiVerified && <VerifiedPill />}
                            </View>
                            <Text style={styles.upiValue}>{upiId ?? N_A}</Text>
                            <Text style={styles.detailsCardCaption}>
                                Withdrawals will be transferred directly to this UPI address.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.detailsCard}>
                            <View style={styles.detailsCardHeader}>
                                <Text style={styles.detailsCardTitle}>Registered Bank Account</Text>
                                {bankAccount?.verified !== false && <VerifiedPill />}
                            </View>
                            <View style={{ marginTop: Spacing.xs, gap: Spacing.xs }}>
                                <DetailRow
                                    label="Account Holder:"
                                    value={bankAccount?.accountHolder || N_A}
                                />
                                <DetailRow label="Bank Name:" value={bankAccount?.bankName || N_A} />
                                <DetailRow
                                    label="Account Number:"
                                    value={bankAccount?.accountNumber || N_A}
                                />
                                <DetailRow
                                    label="IFSC Code:"
                                    value={bankAccount?.ifscCode || N_A}
                                    valueColor={bankAccount?.ifscCode ? undefined : Colors.warning ?? '#D97706'}
                                />
                            </View>
                        </View>
                    )}

                    {/* Confirm */}
                    <TouchableOpacity
                        style={[styles.confirmButton, !canSubmit && styles.confirmButtonDisabled]}
                        onPress={handleConfirm}
                        disabled={!canSubmit}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                            <Text style={styles.confirmButtonText}>Confirm Withdrawal</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.lg,
    },
    card: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl ?? Radii.lg,
        padding: Spacing.lg,
        gap: Spacing.lg,
        ...Shadows.card,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: Typography.lg ?? Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
    subtitle: {
        marginTop: 2,
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
    },
    closeButton: {
        width: 28,
        height: 28,
        borderRadius: Radii.full,
        alignItems: 'center',
        justifyContent: 'center',
    },

    fieldBlock: {
        gap: Spacing.xs,
    },
    fieldLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    amountInput: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: Typography.base,
        color: Colors.charcoal,
        backgroundColor: Colors.background,
    },

    methodToggleRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    methodButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
    },
    methodButtonActiveUpi: {
        backgroundColor: Colors.charcoal,
        borderColor: Colors.charcoal,
    },
    methodButtonActiveBank: {
        backgroundColor: Colors.warning ?? '#F5A623',
        borderColor: Colors.charcoal,
        borderWidth: 2,
    },
    methodButtonText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    methodButtonTextActiveUpi: {
        color: Colors.white,
    },
    methodButtonTextActiveBank: {
        color: Colors.charcoal,
    },

    detailsCard: {
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.md,
    },
    detailsCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    detailsCardTitle: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    detailsCardCaption: {
        marginTop: Spacing.xxs,
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
    },
    upiValue: {
        marginTop: Spacing.xs,
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    verifiedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    verifiedPillText: {
        fontSize: Typography.xs,
        fontWeight: Typography.semiBold,
        color: Colors.success,
    },

    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailLabel: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
    },
    detailValue: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },

    confirmButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: Colors.success,
    },
    confirmButtonDisabled: {
        opacity: 0.5,
    },
    confirmButtonText: {
        color: Colors.white,
        fontSize: Typography.base,
        fontWeight: Typography.bold,
    },
});
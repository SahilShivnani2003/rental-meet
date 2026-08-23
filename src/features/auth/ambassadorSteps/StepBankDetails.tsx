import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '@/theme/theme';
import Field from '@/components/UI/InputField';
import { AmbassadorRegistration } from '../types/AmbassadarRegister';
import { FieldErrors } from '../validation/ambassadorValidation';

interface StepBankDetailsProps {
    data: AmbassadorRegistration;
    onChange: (updater: (prev: AmbassadorRegistration) => AmbassadorRegistration) => void;
    errors: FieldErrors;
}

export default function StepBankDetails({ data, onChange, errors }: StepBankDetailsProps) {
    const [showAccountNumber, setShowAccountNumber] = useState(false);
    const { bankDetails } = data;

    const setBank = <K extends keyof AmbassadorRegistration['bankDetails']>(
        key: K,
        value: AmbassadorRegistration['bankDetails'][K],
    ) => {
        onChange(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, [key]: value } }));
    };

    return (
        <View>
            <Text style={styles.heading}>Part G & H: Bank Details for Payouts & Referral</Text>
            <Text style={styles.subText}>
                Provide bank or UPI details for direct instant reward transfers.
            </Text>

            <Field
                label="UPI ID (Fastest Payouts)"
                placeholder="yourname@bank"
                icon="flash-outline"
                value={bankDetails.upiId}
                onChangeText={t => setBank('upiId', t)}
                error={errors.upiId}
            />

            <View style={styles.pairRow}>
                <View style={styles.pairItem}>
                    <Field
                        label="Account Holder Name"
                        placeholder="As per bank records"
                        icon="person-outline"
                        value={bankDetails.accountHolderName}
                        onChangeText={t => setBank('accountHolderName', t)}
                        autoCapitalize="words"
                    />
                </View>
                <View style={styles.pairItem}>
                    <Field
                        label="Bank Name"
                        placeholder="e.g. Bank of India"
                        icon="business-outline"
                        value={bankDetails.bankName}
                        onChangeText={t => setBank('bankName', t)}
                        autoCapitalize="words"
                    />
                </View>
            </View>

            <View style={styles.pairRow}>
                <View style={styles.pairItem}>
                    <Field
                        label="Account Number"
                        placeholder="Bank account number"
                        icon="card-outline"
                        value={bankDetails.accountNumber}
                        onChangeText={t => setBank('accountNumber', t.replace(/\D/g, '').slice(0, 18))}
                        keyboardType="number-pad"
                        secureTextEntry={!showAccountNumber}
                        trailingIcon={showAccountNumber ? 'eye-off-outline' : 'eye-outline'}
                        onTrailingPress={() => setShowAccountNumber(v => !v)}
                        error={errors.accountNumber}
                    />
                </View>
                <View style={styles.pairItem}>
                    <Field
                        label="IFSC Code"
                        placeholder="HDFC0000123"
                        icon="pricetag-outline"
                        value={bankDetails.ifscCode}
                        onChangeText={t => setBank('ifscCode', t.toUpperCase().slice(0, 11))}
                        autoCapitalize="characters"
                        maxLength={11}
                        error={errors.ifscCode}
                    />
                </View>
            </View>

            <Field
                label="Referred By (Ambassador Referral Code)"
                placeholder="E.G. AMB82910X (OPTIONAL)"
                icon="gift-outline"
                value={data.referralCode ?? ''}
                onChangeText={t => onChange(prev => ({ ...prev, referralCode: t.toUpperCase() }))}
                autoCapitalize="characters"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    heading: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        marginBottom: Spacing.xs,
    },
    subText: {
        fontSize: 12.5,
        color: Colors.info,
        marginBottom: Spacing.lg,
    },
    pairRow: { flexDirection: 'column', gap: Spacing.md },
    pairItem: { flex: 1 },
});

import { View, Text, StyleSheet } from 'react-native';
import SelectField from '../components/SelectField';
import { Colors, Spacing, Typography } from '@/theme/theme';
import Field from '@/components/UI/InputField';
import PasswordStrength from '@/components/UI/password-strength-bar';
import { GENDER_OPTIONS } from '@/utils/defaults';
import { FieldErrors } from '@/utils/validation';
import { AmbassadorRegistration } from '../types/AmbassadarRegister';

interface StepPersonalInfoProps {
    data: AmbassadorRegistration;
    onChange: (updater: (prev: AmbassadorRegistration) => AmbassadorRegistration) => void;
    confirmPassword: string;
    onConfirmPasswordChange: (value: string) => void;
    errors: FieldErrors;
}

export default function StepPersonalInfo({
    data,
    onChange,
    confirmPassword,
    onConfirmPasswordChange,
    errors,
}: StepPersonalInfoProps) {
    const setPersonal = <K extends keyof AmbassadorRegistration['personalInfo']>(
        key: K,
        value: AmbassadorRegistration['personalInfo'][K],
    ) => {
        onChange(prev => {
            const personalInfo = { ...prev.personalInfo, [key]: value };
            // The screenshot only collects one phone number, used as both the
            // mobile and WhatsApp number in the interface.
            if (key === 'whatsAppNumber') personalInfo.mobileNumber = value as string;

            return {
                ...prev,
                personalInfo,
                // Keep top-level auth fields in sync with the detailed profile fields.
                ...(key === 'fullName' ? { name: value as string } : {}),
                ...(key === 'email' ? { email: value as string } : {}),
                ...(key === 'whatsAppNumber' ? { phone: value as string } : {}),
            };
        });
    };

    const formatDob = (raw: string) => {
        const digits = raw.replace(/\D/g, '').slice(0, 8);
        const day = digits.slice(0, 2);
        const month = digits.slice(2, 4);
        const year = digits.slice(4, 8);
        return [day, month, year].filter(Boolean).join('-');
    };

    return (
        <View>
            <Text style={styles.heading}>Part A: Personal Information & Account Setup</Text>

            <Field
                label="Full Name *"
                placeholder="Enter your full name as per Aadhaar"
                icon="person-outline"
                value={data.personalInfo.fullName}
                onChangeText={t => setPersonal('fullName', t)}
                autoCapitalize="words"
                error={errors.fullName}
            />

            <View style={styles.pairRow}>
                <View style={styles.pairItem}>
                    <Field
                        label="Date of Birth *"
                        placeholder="dd-mm-yyyy"
                        icon="calendar-outline"
                        value={data.personalInfo.dateOfBirth}
                        onChangeText={t => setPersonal('dateOfBirth', formatDob(t))}
                        keyboardType="number-pad"
                        maxLength={10}
                        error={errors.dateOfBirth}
                    />
                </View>
                <View style={styles.pairItem}>
                    <SelectField
                        label="Gender *"
                        value={data.personalInfo.gender}
                        options={GENDER_OPTIONS}
                        onSelect={v => setPersonal('gender', v)}
                        error={errors.gender}
                    />
                </View>
            </View>

            <Field
                label="Email Address *"
                placeholder="email@domain.com"
                icon="mail-outline"
                value={data.personalInfo.email}
                onChangeText={t => setPersonal('email', t)}
                keyboardType="email-address"
                trailingIcon="checkmark-circle-outline"
                error={errors.email}
            />

            <Field
                label="Phone Number (WhatsApp Number) *"
                placeholder="10-digit mobile number"
                icon="call-outline"
                value={data.personalInfo.whatsAppNumber}
                onChangeText={t => setPersonal('whatsAppNumber', t.replace(/\D/g, '').slice(0, 10))}
                keyboardType="phone-pad"
                maxLength={10}
                trailingIcon="checkmark-circle-outline"
                error={errors.whatsAppNumber}
            />

            <View style={styles.pairRow}>
                <View style={styles.pairItem}>
                    <Field
                        label="Aadhaar Card Number *"
                        placeholder="12-digit Aadhaar Number"
                        icon="card-outline"
                        value={data.personalInfo.aadhaarNumber}
                        onChangeText={t => setPersonal('aadhaarNumber', t.replace(/\D/g, '').slice(0, 12))}
                        keyboardType="number-pad"
                        maxLength={12}
                        error={errors.aadhaarNumber}
                    />
                </View>
                <View style={styles.pairItem}>
                    <Field
                        label="PAN Card Number (Optional)"
                        placeholder="ABCDE1234F"
                        icon="card-outline"
                        value={data.personalInfo.panNumber}
                        onChangeText={t => setPersonal('panNumber', t.toUpperCase().slice(0, 10))}
                        autoCapitalize="characters"
                        maxLength={10}
                        error={errors.panNumber}
                    />
                </View>
            </View>

            <View style={styles.pairRow}>
                <View style={styles.pairItem}>
                    <Field
                        label="Create Password *"
                        placeholder="Create a password"
                        icon="lock-closed-outline"
                        value={data.password}
                        onChangeText={t => onChange(prev => ({ ...prev, password: t }))}
                        secureTextEntry
                        trailingIcon="eye-outline"
                        error={errors.password}
                    />
                </View>
                <View style={styles.pairItem}>
                    <Field
                        label="Confirm Password *"
                        placeholder="Repeat password"
                        icon="lock-closed-outline"
                        value={confirmPassword}
                        onChangeText={onConfirmPasswordChange}
                        secureTextEntry
                        trailingIcon="eye-outline"
                        error={errors.confirmPassword}
                    />
                </View>
            </View>
            <PasswordStrength password={data.password} />
        </View>
    );
}

const styles = StyleSheet.create({
    heading: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        marginBottom: Spacing.lg,
    },
    pairRow: { flexDirection: 'row', gap: Spacing.md },
    pairItem: { flex: 1 },
});

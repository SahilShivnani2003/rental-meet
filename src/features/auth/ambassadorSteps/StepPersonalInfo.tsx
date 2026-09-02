import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import SelectField from '../components/SelectField';
import CalendarModal from '@components/UI/calenderModal';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/theme/theme';
import Field from '@/components/UI/InputField';
import PasswordStrength from '@/components/UI/password-strength-bar';
import { AmbassadorRegistration } from '../types/AmbassadarRegister';
import { FieldErrors } from '../validation/ambassadorValidation';
import { GENDER_OPTIONS } from '../validation/createAmbassadorForm';
import { useState } from 'react';
import LoadingDots from '@/components/UI/loading-dots';
import { ApiError } from '@/types/ApiError';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
    useSendEmailOtp,
    useSendPhoneOtp,
    useVerifyEmailOtp,
    useVerifyPhoneOtp,
} from '../hooks/useVerfication';
import { useAlert } from '@/context/AlertContext';

type OtpStep = 'none' | 'email' | 'phone';

interface StepPersonalInfoProps {
    data: AmbassadorRegistration;
    onChange: (updater: (prev: AmbassadorRegistration) => AmbassadorRegistration) => void;
    confirmPassword: string;
    onConfirmPasswordChange: (value: string) => void;
    errors: FieldErrors;
}

// ── DOB <-> calendar format conversion ─────────────────────────────────────
// The form stores DOB as "dd-mm-yyyy"; CalendarModal works in "yyyy-mm-dd".
const dbDateToIso = (ddmmyyyy: string): string => {
    const parts = ddmmyyyy.split('-');
    if (parts.length !== 3) return '';
    const [dd, mm, yyyy] = parts;
    if (dd.length !== 2 || mm.length !== 2 || yyyy.length !== 4) return '';
    return `${yyyy}-${mm}-${dd}`;
};

const isoDateToDb = (yyyymmdd: string): string => {
    const [yyyy, mm, dd] = yyyymmdd.split('-');
    return `${dd}-${mm}-${yyyy}`;
};

export default function StepPersonalInfo({
    data,
    onChange,
    confirmPassword,
    onConfirmPasswordChange,
    errors,
}: StepPersonalInfoProps) {
    const alert = useAlert();
    const [emailVerified, setEmailVerified] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [dobCalendarVisible, setDobCalendarVisible] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    // ── OTP modal state ───────────────────────────────────────────────────────
    const [otpStep, setOtpStep] = useState<OtpStep>('none');
    const [otpValue, setOtpValue] = useState('');
    const [otpError, setOtpError] = useState('');

    const { mutate: sendEmailOtp, isPending: sendingEmailOtp } = useSendEmailOtp();
    const { mutate: sendPhoneOtp, isPending: sendingPhoneOtp } = useSendPhoneOtp();
    const { mutate: verifyEmailOtp, isPending: verifyingEmailOtp } = useVerifyEmailOtp();
    const { mutate: verifyPhoneOtp, isPending: verifyingPhoneOtp } = useVerifyPhoneOtp();

    const isOtpModalVisible = otpStep !== 'none';
    const otpIsPending = verifyingEmailOtp || verifyingPhoneOtp;

    // DOB bounds: must be at least 18, and not older than 100 years.
    const today = new Date();
    const maxDob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const minDob = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());

    const setPersonal = <K extends keyof AmbassadorRegistration['personalInfo']>(
        key: K,
        value: AmbassadorRegistration['personalInfo'][K],
    ) => {
        onChange(prev => {
            const personalInfo = { ...prev.personalInfo, [key]: value };
            if (key === 'whatsAppNumber') personalInfo.mobileNumber = value as string;

            return {
                ...prev,
                personalInfo,
                ...(key === 'fullName' ? { name: value as string } : {}),
                ...(key === 'email' ? { email: value as string } : {}),
                ...(key === 'whatsAppNumber' ? { phone: value as string } : {}),
            };
        });
    };

    // ── OTP: Send email ───────────────────────────────────────────────────────
    const handleSendEmailOtp = () => {
        const email = data.personalInfo.email;
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            alert.error('Invalid Email', 'Enter a valid email first');
            return;
        }
        setOtpValue('');
        setOtpError('');
        sendEmailOtp(
            { email, name: data.personalInfo.fullName },
            {
                onSuccess: () => {
                    setOtpStep('email');
                },
                onError: (error: ApiError) => {
                    alert.error('OTP Error', error?.message || 'Failed to send OTP');
                },
            },
        );
    };

    // ── OTP: Verify email ─────────────────────────────────────────────────────
    const handleVerifyEmailOtp = () => {
        if (otpValue.length < 4) {
            setOtpError('Enter the complete OTP');
            return;
        }
        verifyEmailOtp(
            { email: data.personalInfo.email, otp: otpValue },
            {
                onSuccess: () => {
                    setEmailVerified(true);
                    setOtpStep('none');
                    alert.success('OTP Verified', 'Email verified successfully');
                },
                onError: (error: ApiError) => {
                    setOtpError(error?.message || 'Invalid OTP. Please try again.');
                },
            },
        );
    };

    // ── OTP: Send phone ───────────────────────────────────────────────────────
    const handleSendPhoneOtp = () => {
        const phone = data.personalInfo.whatsAppNumber;
        if (phone.replace(/\D/g, '').length < 10) {
            alert.error('Invalid Number', 'Enter a valid 10-digit number first');
            return;
        }
        setOtpValue('');
        setOtpError('');
        sendPhoneOtp(
            { phone, name: data.personalInfo.fullName },
            {
                onSuccess: () => {
                    setOtpStep('phone');
                },
                onError: (error: ApiError) => {
                    alert.error('OTP Error', error?.message || 'Failed to send OTP');
                },
            },
        );
    };

    // ── OTP: Verify phone ─────────────────────────────────────────────────────
    const handleVerifyPhoneOtp = () => {
        if (otpValue.length < 4) {
            setOtpError('Enter the complete OTP');
            return;
        }
        verifyPhoneOtp(
            { phone: data.personalInfo.whatsAppNumber, otp: otpValue },
            {
                onSuccess: () => {
                    setPhoneVerified(true);
                    setOtpStep('none');
                    alert.success('OTP Verified', 'Phone number verified successfully');
                },
                onError: (error: ApiError) => {
                    setOtpError(error?.message || 'Invalid OTP. Please try again.');
                },
            },
        );
    };

    // ── OTP: Modal action dispatchers ───────────────────────────────────────
    const handleOtpConfirm = () => {
        if (otpStep === 'email') handleVerifyEmailOtp();
        else if (otpStep === 'phone') handleVerifyPhoneOtp();
    };

    const handleResendOtp = () => {
        if (otpStep === 'email') handleSendEmailOtp();
        else if (otpStep === 'phone') handleSendPhoneOtp();
    };

    return (
        <>
            {/* OTP Verification Modal */}
            <Modal
                visible={isOtpModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setOtpStep('none')}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Ionicons
                                name={
                                    otpStep === 'email' ? 'mail-outline' : 'phone-portrait-outline'
                                }
                                size={28}
                                color={Colors.primary}
                            />
                            <Text style={styles.modalTitle}>
                                Verify {otpStep === 'email' ? 'Email' : 'Phone'}
                            </Text>
                            <Text style={styles.modalSubtitle}>
                                Enter the OTP sent to{' '}
                                <Text
                                    style={{ fontWeight: Typography.bold, color: Colors.charcoal }}
                                >
                                    {otpStep === 'email'
                                        ? data.personalInfo.email
                                        : data.personalInfo.whatsAppNumber}
                                </Text>
                            </Text>
                        </View>

                        <TextInput
                            style={[styles.otpInput, !!otpError && styles.otpInputError]}
                            value={otpValue}
                            onChangeText={t => {
                                setOtpValue(t.replace(/\D/g, ''));
                                setOtpError('');
                            }}
                            keyboardType="number-pad"
                            maxLength={6}
                            placeholder="------"
                            placeholderTextColor={Colors.charcoalLight}
                            textAlign="center"
                        />
                        {!!otpError && (
                            <View style={[styles.errorRow, { marginBottom: Spacing.sm }]}>
                                <Ionicons name="alert-circle" size={12} color={Colors.danger} />
                                <Text style={styles.errorText}>{otpError}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.registerBtn, otpIsPending && { opacity: 0.7 }]}
                            onPress={handleOtpConfirm}
                            disabled={otpIsPending}
                            activeOpacity={0.9}
                        >
                            {otpIsPending ? (
                                <LoadingDots />
                            ) : (
                                <Text style={styles.registerBtnText}>Verify OTP</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.modalFooterRow}>
                            <TouchableOpacity
                                onPress={handleResendOtp}
                                disabled={sendingEmailOtp || sendingPhoneOtp}
                            >
                                <Text style={styles.resendText}>Resend OTP</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setOtpStep('none')}>
                                <Text style={[styles.resendText, { color: Colors.danger }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Date of Birth calendar */}
            <CalendarModal
                visible={dobCalendarVisible}
                selectedDate={dbDateToIso(data.personalInfo.dateOfBirth)}
                onSelect={iso => setPersonal('dateOfBirth', isoDateToDb(iso))}
                onClose={() => setDobCalendarVisible(false)}
                minDate={minDob}
                maxDate={maxDob}
                outOfRangeLabel="Not eligible"
            />

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
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setDobCalendarVisible(true)}
                        >
                            <View pointerEvents="none">
                                <Field
                                    label="Date of Birth *"
                                    placeholder="dd-mm-yyyy"
                                    icon="calendar-outline"
                                    value={data.personalInfo.dateOfBirth}
                                    onChangeText={() => {}}
                                    error={errors.dateOfBirth}
                                />
                            </View>
                        </TouchableOpacity>
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
                    onChangeText={t => {
                        setPersonal('email', t);
                        if (emailVerified) setEmailVerified(false);
                    }}
                    keyboardType="email-address"
                    trailingIcon="checkmark-circle-outline"
                    error={errors.email}
                    autoCapitalize="none"
                />
                {!emailVerified && (
                    <TouchableOpacity
                        style={styles.verifyBtn}
                        onPress={handleSendEmailOtp}
                        disabled={sendingEmailOtp}
                        activeOpacity={0.8}
                    >
                        {sendingEmailOtp ? (
                            <LoadingDots />
                        ) : (
                            <Text style={styles.verifyBtnText}>Verify Email</Text>
                        )}
                    </TouchableOpacity>
                )}
                {emailVerified && (
                    <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
                        <Text style={styles.verifiedText}>Email verified</Text>
                    </View>
                )}

                <Field
                    label="Phone Number (WhatsApp Number) *"
                    placeholder="10-digit mobile number"
                    icon="call-outline"
                    value={data.personalInfo.whatsAppNumber}
                    onChangeText={t => {
                        setPersonal('whatsAppNumber', t.replace(/\D/g, '').slice(0, 10));
                        if (phoneVerified) setPhoneVerified(false);
                    }}
                    keyboardType="phone-pad"
                    maxLength={10}
                    trailingIcon="checkmark-circle-outline"
                    error={errors.whatsAppNumber}
                />
                {!phoneVerified && (
                    <TouchableOpacity
                        style={styles.verifyBtn}
                        onPress={handleSendPhoneOtp}
                        disabled={sendingPhoneOtp}
                        activeOpacity={0.8}
                    >
                        {sendingPhoneOtp ? (
                            <LoadingDots />
                        ) : (
                            <Text style={styles.verifyBtnText}>Verify Phone</Text>
                        )}
                    </TouchableOpacity>
                )}
                {phoneVerified && (
                    <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
                        <Text style={styles.verifiedText}>Phone verified</Text>
                    </View>
                )}

                <View style={styles.pairRow}>
                    <View style={styles.pairItem}>
                        <Field
                            label="Aadhaar Card Number *"
                            placeholder="12-digit Aadhaar Number"
                            icon="card-outline"
                            value={data.personalInfo.aadhaarNumber}
                            onChangeText={t =>
                                setPersonal('aadhaarNumber', t.replace(/\D/g, '').slice(0, 12))
                            }
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
                            onChangeText={t =>
                                setPersonal('panNumber', t.toUpperCase().slice(0, 10))
                            }
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
                            secureTextEntry={!showPassword}
                            trailingIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            onTrailingPress={() => setShowPassword(s => !s)}
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
                            secureTextEntry={!showConfirmPassword}
                            trailingIcon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                            onTrailingPress={() => setShowConfirmPassword(s => !s)}
                            error={errors.confirmPassword}
                        />
                    </View>
                </View>
                <PasswordStrength password={data.password} />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    heading: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        marginBottom: Spacing.lg,
    },
    pairRow: { flexDirection: 'column', gap: Spacing.md },
    pairItem: { flex: 1 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalCard: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: Radii.xxl,
        padding: Spacing.xl,
        ...Shadows.floating,
    },
    modalHeader: { alignItems: 'center', marginBottom: Spacing.lg, gap: Spacing.sm },
    modalTitle: {
        fontSize: 20,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.4,
    },
    modalSubtitle: {
        fontSize: 13,
        color: Colors.charcoalLight,
        textAlign: 'center',
        lineHeight: 20,
    },
    otpInput: {
        height: 56,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
        fontSize: 22,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: 8,
        marginBottom: Spacing.sm,
    },
    otpInputError: { borderColor: Colors.danger },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    errorText: { fontSize: 12, color: Colors.danger },
    modalFooterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.md,
    },
    resendText: {
        fontSize: 13,
        fontWeight: Typography.semiBold,
        color: Colors.primary,
    },
    registerBtn: {
        height: 52,
        borderRadius: Radii.md,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    registerBtnText: {
        fontSize: 15,
        fontWeight: Typography.bold,
        color: Colors.white,
    },
    verifyBtn: {
        alignSelf: 'flex-start',
        marginTop: -Spacing.xs,
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: Colors.primary + '44',
    },
    verifyBtnText: {
        fontSize: 12,
        fontWeight: Typography.semiBold,
        color: Colors.primary,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: -Spacing.xs,
        marginBottom: Spacing.sm,
    },
    verifiedText: {
        fontSize: 12,
        fontWeight: Typography.semiBold,
        color: Colors.success,
    },
});

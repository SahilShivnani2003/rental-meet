import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Field from '@/components/UI/InputField';
import LoadingDots from '@/components/UI/loading-dots';
import PasswordStrength from '@/components/UI/password-strength-bar';
import { useAlert } from '@/context/AlertContext';
import { Colors, Typography, Spacing, Radii, Shadows } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import { ApiError } from '@/types/ApiError';
import { useForgotPassword, useResetPassword } from '../hooks/usePasswordReset';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Steps ─────────────────────────────────────────────────────────────────────
type Step = 'email' | 'reset';

type Props = NativeStackScreenProps<RootStackParamList, 'forgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
    const alert = useAlert();
    const { mutate: forgotPassword, isPending: sendingOtp } = useForgotPassword();
    const { mutate: resetPassword, isPending: resetting } = useResetPassword();

    // ── Step state ────────────────────────────────────────────────────────────
    const [step, setStep] = useState<Step>('email');

    // ── Fields ────────────────────────────────────────────────────────────────
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ── Animations ────────────────────────────────────────────────────────────
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(28)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const btnScale = useRef(new Animated.Value(1)).current;
    const stepFade = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        StatusBar.setBarStyle('dark-content');
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                speed: 14,
                bounciness: 6,
            }),
        ]).start();
    }, []);

    const shakeCard = () =>
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 9, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 7, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -7, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
        ]).start();

    const transitionToReset = () => {
        Animated.timing(stepFade, { toValue: 0, duration: 180, useNativeDriver: true }).start(
            () => {
                setStep('reset');
                Animated.timing(stepFade, {
                    toValue: 1,
                    duration: 220,
                    useNativeDriver: true,
                }).start();
            },
        );
    };

    const pressBounce = (cb: () => void) => {
        Animated.sequence([
            Animated.timing(btnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
            Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
        ]).start(cb);
    };

    const clearError = (key: string) => setErrors(prev => ({ ...prev, [key]: '' }));

    // ── Validation ────────────────────────────────────────────────────────────
    const validateEmail = () => {
        const e: Record<string, string> = {};
        if (!email.trim()) {
            e.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            e.email = 'Enter a valid email address';
        }
        return e;
    };

    const validateReset = () => {
        const e: Record<string, string> = {};
        if (!otp.trim() || otp.length < 4) e.otp = 'Enter the complete OTP';
        if (!newPassword) {
            e.newPassword = 'Password is required';
        } else if (newPassword.length < 8) {
            e.newPassword = 'Must be at least 8 characters';
        }
        if (!confirmPassword) {
            e.confirmPassword = 'Please confirm your password';
        } else if (confirmPassword !== newPassword) {
            e.confirmPassword = 'Passwords do not match';
        }
        return e;
    };

    // ── Step 1: Send OTP ──────────────────────────────────────────────────────
    const handleSendOtp = () => {
        const e = validateEmail();
        setErrors(e);
        if (Object.keys(e).length > 0) {
            shakeCard();
            return;
        }

        pressBounce(() => {
            forgotPassword(
                { email },
                {
                    onSuccess: () => {
                        alert.success('OTP Sent', `A reset code was sent to ${email}`);
                        transitionToReset();
                    },
                    onError: (error: ApiError) => {
                        alert.error('Error', error?.message || 'Failed to send OTP');
                    },
                },
            );
        });
    };

    // ── Step 2: Reset password ────────────────────────────────────────────────
    const handleResetPassword = () => {
        const e = validateReset();
        setErrors(e);
        if (Object.keys(e).length > 0) {
            shakeCard();
            return;
        }

        pressBounce(() => {
            resetPassword(
                { email, otp, newPassword },
                {
                    onSuccess: () => {
                        alert.success(
                            'Password Reset',
                            'Your password has been updated. Please sign in.',
                        );
                        navigation.navigate('login');
                    },
                    onError: (error: ApiError) => {
                        // If OTP is wrong surface it on the otp field
                        const msg = error?.message ?? 'Something went wrong';
                        if (
                            msg.toLowerCase().includes('otp') ||
                            msg.toLowerCase().includes('code')
                        ) {
                            setErrors(prev => ({ ...prev, otp: msg }));
                        } else {
                            alert.error('Reset Failed', msg);
                        }
                        shakeCard();
                    },
                },
            );
        });
    };

    // ── Resend OTP ────────────────────────────────────────────────────────────
    const handleResend = () => {
        forgotPassword(
            { email },
            {
                onSuccess: () => alert.success('OTP Resent', `A new code was sent to ${email}`),
                onError: (error: ApiError) =>
                    alert.error('Error', error?.message || 'Failed to resend OTP'),
            },
        );
    };

    const loading = sendingOtp || resetting;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.arcTop} />

                {/* Top nav */}
                <Animated.View style={[styles.topBar, { opacity: fadeAnim }]}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => (step === 'reset' ? setStep('email') : navigation.goBack())}
                    >
                        <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
                    </TouchableOpacity>
                    {/* <Text style={styles.topBarTitle}>
                        {step === 'email' ? 'Forgot Password' : 'Reset Password'}
                    </Text> */}
                    <View style={{ width: 44 }} />
                </Animated.View>

                {/* Step indicator */}
                <Animated.View style={[styles.stepWrap, { opacity: fadeAnim }]}>
                    {(['email', 'reset'] as Step[]).map((s, i) => {
                        const done = step === 'reset' && s === 'email';
                        const active = step === s;
                        return (
                            <React.Fragment key={s}>
                                <View
                                    style={[
                                        styles.stepDot,
                                        active && styles.stepDotActive,
                                        done && styles.stepDotDone,
                                    ]}
                                >
                                    {done ? (
                                        <Ionicons name="checkmark" size={11} color={Colors.white} />
                                    ) : (
                                        <Text
                                            style={[
                                                styles.stepDotText,
                                                (active || done) && { color: Colors.white },
                                            ]}
                                        >
                                            {i + 1}
                                        </Text>
                                    )}
                                </View>
                                {i < 1 && (
                                    <View style={[styles.stepLine, done && styles.stepLineDone]} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </Animated.View>

                {/* Heading */}
                <Animated.View style={[styles.heading, { opacity: fadeAnim }]}>
                    {step === 'email' ? (
                        <>
                            <Text style={styles.headingTitle}>Forgot your{'\n'}password?</Text>
                            <Text style={styles.headingSubtitle}>
                                No worries — enter your email and we'll send you a reset code.
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.headingTitle}>Set a new{'\n'}password</Text>
                            <Text style={styles.headingSubtitle}>
                                Enter the OTP sent to{' '}
                                <Text
                                    style={{ fontWeight: Typography.bold, color: Colors.charcoal }}
                                >
                                    {email}
                                </Text>{' '}
                                and choose a new password.
                            </Text>
                        </>
                    )}
                </Animated.View>

                {/* Icon illustration */}
                <Animated.View style={[styles.iconWrap, { opacity: fadeAnim }]}>
                    <View style={styles.iconCircle}>
                        <Ionicons
                            name={step === 'email' ? 'lock-open-outline' : 'key-outline'}
                            size={36}
                            color={Colors.primary}
                        />
                    </View>
                </Animated.View>

                {/* Form card */}
                <Animated.View
                    style={[
                        styles.card,
                        {
                            opacity: Animated.multiply(fadeAnim, stepFade),
                            transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
                        },
                    ]}
                >
                    {step === 'email' ? (
                        /* ── Step 1 ── */
                        <>
                            <Field
                                label="Email Address"
                                placeholder="you@example.com"
                                icon="mail-outline"
                                value={email}
                                onChangeText={t => {
                                    setEmail(t);
                                    clearError('email');
                                }}
                                error={errors.email}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <Animated.View
                                style={{ transform: [{ scale: btnScale }], marginTop: Spacing.sm }}
                            >
                                <TouchableOpacity
                                    style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                                    onPress={handleSendOtp}
                                    activeOpacity={0.9}
                                    disabled={loading}
                                >
                                    {sendingOtp ? (
                                        <LoadingDots />
                                    ) : (
                                        <>
                                            <Text style={styles.primaryBtnText}>
                                                Send Reset Code
                                            </Text>
                                            <View style={styles.primaryBtnArrow}>
                                                <Ionicons
                                                    name="arrow-forward"
                                                    size={17}
                                                    color={Colors.primary}
                                                />
                                            </View>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        </>
                    ) : (
                        /* ── Step 2 ── */
                        <>
                            {/* OTP field */}
                            <Field
                                label="OTP Code"
                                placeholder="Enter the code from your email"
                                icon="shield-checkmark-outline"
                                value={otp}
                                onChangeText={t => {
                                    setOtp(t.replace(/\D/g, '').slice(0, 6));
                                    clearError('otp');
                                }}
                                error={errors.otp}
                                keyboardType="number-pad"
                                maxLength={6}
                            />

                            {/* Resend link */}
                            <TouchableOpacity
                                style={styles.resendRow}
                                onPress={handleResend}
                                disabled={sendingOtp}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="refresh-outline" size={13} color={Colors.primary} />
                                <Text style={styles.resendText}>
                                    {sendingOtp ? 'Resending…' : 'Resend OTP'}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            {/* New password */}
                            <Field
                                label="New Password"
                                placeholder="Minimum 8 characters"
                                icon="lock-closed-outline"
                                value={newPassword}
                                onChangeText={t => {
                                    setNewPassword(t);
                                    clearError('newPassword');
                                }}
                                error={errors.newPassword}
                                secureTextEntry={!showNew}
                                trailingIcon={showNew ? 'eye-off-outline' : 'eye-outline'}
                                onTrailingPress={() => setShowNew(!showNew)}
                            />

                            <PasswordStrength password={newPassword} />

                            {newPassword.length > 0 && (
                                <View style={styles.hintsGrid}>
                                    {[
                                        { ok: newPassword.length >= 8, text: 'Min 8 characters' },
                                        { ok: /[A-Z]/.test(newPassword), text: 'Uppercase letter' },
                                        { ok: /[0-9]/.test(newPassword), text: 'Number included' },
                                        {
                                            ok: /[^a-zA-Z0-9]/.test(newPassword),
                                            text: 'Special character',
                                        },
                                    ].map((h, i) => (
                                        <View key={i} style={styles.hintItem}>
                                            <Ionicons
                                                name={h.ok ? 'checkmark-circle' : 'ellipse-outline'}
                                                size={13}
                                                color={h.ok ? Colors.success : Colors.charcoalLight}
                                            />
                                            <Text
                                                style={[styles.hintText, h.ok && styles.hintTextOk]}
                                            >
                                                {h.text}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Confirm password */}
                            <Field
                                label="Confirm Password"
                                placeholder="Re-enter your password"
                                icon="lock-closed-outline"
                                value={confirmPassword}
                                onChangeText={t => {
                                    setConfirmPassword(t);
                                    clearError('confirmPassword');
                                }}
                                error={errors.confirmPassword}
                                secureTextEntry={!showConfirm}
                                trailingIcon={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                                onTrailingPress={() => setShowConfirm(!showConfirm)}
                            />

                            {/* Match indicator */}
                            {confirmPassword.length > 0 && (
                                <View style={styles.matchRow}>
                                    <Ionicons
                                        name={
                                            confirmPassword === newPassword
                                                ? 'checkmark-circle'
                                                : 'close-circle'
                                        }
                                        size={13}
                                        color={
                                            confirmPassword === newPassword
                                                ? Colors.success
                                                : Colors.danger
                                        }
                                    />
                                    <Text
                                        style={[
                                            styles.matchText,
                                            {
                                                color:
                                                    confirmPassword === newPassword
                                                        ? Colors.success
                                                        : Colors.danger,
                                            },
                                        ]}
                                    >
                                        {confirmPassword === newPassword
                                            ? 'Passwords match'
                                            : 'Passwords do not match'}
                                    </Text>
                                </View>
                            )}

                            <Animated.View
                                style={{ transform: [{ scale: btnScale }], marginTop: Spacing.md }}
                            >
                                <TouchableOpacity
                                    style={[styles.primaryBtn, resetting && { opacity: 0.7 }]}
                                    onPress={handleResetPassword}
                                    activeOpacity={0.9}
                                    disabled={resetting}
                                >
                                    {resetting ? (
                                        <LoadingDots />
                                    ) : (
                                        <>
                                            <Text style={styles.primaryBtnText}>
                                                Reset Password
                                            </Text>
                                            <View style={styles.primaryBtnArrow}>
                                                <Ionicons
                                                    name="arrow-forward"
                                                    size={17}
                                                    color={Colors.primary}
                                                />
                                            </View>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        </>
                    )}
                </Animated.View>

                {/* Back to sign in */}
                <Animated.View style={[styles.loginRow, { opacity: fadeAnim }]}>
                    <Text style={styles.loginText}>Remember your password? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('login')}>
                        <Text style={styles.loginLink}>Sign in</Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { flexGrow: 1, alignItems: 'center', paddingBottom: 48 },

    arcTop: {
        position: 'absolute',
        top: -SCREEN_WIDTH * 0.5,
        left: -SCREEN_WIDTH * 0.3,
        width: SCREEN_WIDTH * 1.1,
        height: SCREEN_WIDTH * 1.1,
        borderRadius: SCREEN_WIDTH * 0.55,
        backgroundColor: Colors.primaryLight,
        opacity: 0.5,
    },

    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: SCREEN_WIDTH,
        paddingHorizontal: Spacing.lg,
        paddingTop: 24,
        paddingBottom: Spacing.sm,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: Radii.md,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.card,
    },
    topBarTitle: {
        fontSize: 16,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
    },

    // Step indicator
    stepWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    stepDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    stepDotActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    stepDotDone: {
        backgroundColor: Colors.success,
        borderColor: Colors.success,
    },
    stepDotText: {
        fontSize: 12,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
    },
    stepLine: {
        width: 48,
        height: 2,
        backgroundColor: Colors.border,
        marginHorizontal: 4,
    },
    stepLineDone: {
        backgroundColor: Colors.success,
    },

    // Icon illustration
    iconWrap: { marginTop: Spacing.sm, marginBottom: Spacing.xs },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primaryLight,
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },

    heading: { width: SCREEN_WIDTH - 32, marginTop: Spacing.lg, marginBottom: Spacing.md },
    headingTitle: {
        fontSize: 30,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.8,
        lineHeight: 36,
        marginBottom: 8,
    },
    headingSubtitle: { fontSize: 13, color: Colors.charcoalLight, lineHeight: 20 },

    card: {
        width: SCREEN_WIDTH - 32,
        backgroundColor: Colors.surface,
        borderRadius: Radii.xxl,
        padding: Spacing.xl,
        ...Shadows.header,
    },

    primaryBtn: {
        backgroundColor: Colors.charcoal,
        borderRadius: Radii.md,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        ...Shadows.floating,
    },
    primaryBtnText: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.3,
    },
    primaryBtnArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },

    divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.lg },

    resendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-end',
        marginTop: -Spacing.sm,
        marginBottom: Spacing.sm,
        paddingVertical: 4,
    },
    resendText: {
        fontSize: 12,
        fontWeight: Typography.semiBold,
        color: Colors.primary,
    },

    hintsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        marginBottom: Spacing.md,
        marginTop: -Spacing.sm,
    },
    hintItem: { flexDirection: 'row', alignItems: 'center', gap: 4, width: '47%' },
    hintText: { fontSize: 11, color: Colors.charcoalLight, fontWeight: Typography.medium },
    hintTextOk: { color: Colors.success, fontWeight: Typography.semiBold },

    matchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: -Spacing.sm,
        marginBottom: Spacing.sm,
    },
    matchText: { fontSize: 12, fontWeight: Typography.semiBold },

    loginRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xl },
    loginText: { fontSize: 14, color: Colors.charcoalLight },
    loginLink: { fontSize: 14, color: Colors.primary, fontWeight: Typography.extraBold },
});

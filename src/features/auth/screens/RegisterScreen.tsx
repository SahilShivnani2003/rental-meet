import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Field from '@/components/UI/InputField';
import LoadingDots from '@/components/UI/loading-dots';
import PasswordStrength from '@/components/UI/password-strength-bar';
import { useAlert } from '@/context/AlertContext';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors, Typography, Spacing, Radii, Shadows } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import { ROLE_META } from '../data/RoleMetaData';
import { useRegister } from '../hooks/useRegister';
import { ApiError } from '@/types/ApiError';
import {
    useSendEmailOtp,
    useSendPhoneOtp,
    useVerifyEmailOtp,
    useVerifyPhoneOtp,
} from '../hooks/useVerfication';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Vendor category options ───────────────────────────────────────────────────
const VENDOR_CATEGORIES = [
    'Catering & Food',
    'Photography & Video',
    'Decoration & Flowers',
    'Entertainment & Music',
    'Event Management',
    'AV & Tech Equipment',
    'Transportation',
    'Security Services',
    'Cleaning Services',
    'Other',
];

// ── OTP step type ─────────────────────────────────────────────────────────────
type OtpStep = 'none' | 'email' | 'phone';

type registerProps = NativeStackScreenProps<RootStackParamList, 'register'>;

export default function RegisterScreen({ navigation, route }: registerProps) {
    // FIX: ROLE_META key must match the role value. Fallback to 'customer' not 'client'.
    const role = route.params?.role ?? 'customer';
    const meta = ROLE_META[role] ?? ROLE_META['client'];
    const alert = useAlert();
    const { setUser } = useAuthStore();
    const { mutate: register } = useRegister();
    const { mutate: sendEmailOtp, isPending: sendingEmailOtp } = useSendEmailOtp();
    const { mutate: sendPhoneOtp, isPending: sendingPhoneOtp } = useSendPhoneOtp();
    const { mutate: verifyEmailOtp, isPending: verifyingEmailOtp } = useVerifyEmailOtp();
    const { mutate: verifyPhoneOtp, isPending: verifyingPhoneOtp } = useVerifyPhoneOtp();

    // ── Common fields ─────────────────────────────────────────────────────────
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [referralCode, setReferralCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ── Verification state ────────────────────────────────────────────────────
    const [emailVerified, setEmailVerified] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);

    // ── OTP modal state ───────────────────────────────────────────────────────
    const [otpStep, setOtpStep] = useState<OtpStep>('none');
    const [otpValue, setOtpValue] = useState('');
    const [otpError, setOtpError] = useState('');

    // ── Customer / Vendor location fields ─────────────────────────────────────
    const [city, setCity] = useState('');
    const [state, setState] = useState('');

    // ── Vendor-only fields ────────────────────────────────────────────────────
    const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');
    const [vendorCategory, setVendorCategory] = useState('');

    // ── Animations ────────────────────────────────────────────────────────────
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(28)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const btnScale = useRef(new Animated.Value(1)).current;

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

    const clearError = (key: string) => setErrors(prev => ({ ...prev, [key]: '' }));

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = () => {
        const e: Record<string, string> = {};

        if (!fullName.trim()) e.fullName = 'Full name is required';

        if (!email.trim()) {
            e.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            e.email = 'Enter a valid email';
        } else if (!emailVerified) {
            // FIX: enforce email OTP verification before submission
            e.email = 'Please verify your email first';
        }

        if (!phone.trim()) {
            e.phone = 'Phone number is required';
        } else if (phone.replace(/\D/g, '').length < 10) {
            e.phone = 'Enter a valid 10-digit number';
        } else if (!phoneVerified) {
            // FIX: enforce phone OTP verification before submission
            e.phone = 'Please verify your phone number first';
        }

        // FIX: password min-length consistent with hint UI (8, not 6)
        if (!password) {
            e.password = 'Password is required';
        } else if (password.length < 8) {
            e.password = 'Must be at least 8 characters';
        }

        if (role === 'customer' || role === 'vendor') {
            if (!city.trim()) e.city = 'City is required';
            if (!state.trim()) e.state = 'State is required';
        }

        if (role === 'vendor') {
            if (!vendorCategory) e.vendorCategory = 'Please select a category';
        }

        if (!agreed) e.agreed = 'Please accept the terms to continue';

        return e;
    };

    // ── OTP: Send email ───────────────────────────────────────────────────────
    const handleSendEmailOtp = () => {
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            setErrors(prev => ({ ...prev, email: 'Enter a valid email first' }));
            return;
        }
        setOtpValue('');
        setOtpError('');
        sendEmailOtp(
            { email, name: fullName },
            {
                onSuccess: () => {
                    alert.success('OTP Sent', 'An OTP has been sent to your email');
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
            { email, otp: otpValue },
            {
                onSuccess: () => {
                    setEmailVerified(true);
                    setOtpStep('none');
                    clearError('email');
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
        if (phone.replace(/\D/g, '').length < 10) {
            setErrors(prev => ({ ...prev, phone: 'Enter a valid 10-digit number first' }));
            return;
        }
        setOtpValue('');
        setOtpError('');
        sendPhoneOtp(
            { phone, name: fullName },
            {
                onSuccess: () => {
                    alert.success('OTP Sent', 'An OTP has been sent to your phone');
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
            { phone, otp: otpValue },
            {
                onSuccess: () => {
                    setPhoneVerified(true);
                    setOtpStep('none');
                    clearError('phone');
                    alert.success('OTP Verified', 'Phone number verified successfully');
                },
                onError: (error: ApiError) => {
                    setOtpError(error?.message || 'Invalid OTP. Please try again.');
                },
            },
        );
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleRegister = async () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) {
            shakeCard();
            return;
        }

        Animated.sequence([
            Animated.timing(btnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
            Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
        ]).start();

        const base = {
            name: fullName,
            email,
            phone,
            password,
            referralCode: referralCode.trim() || undefined,
        };

        const registerData =
            role === 'customer'
                ? { ...base, role: 'customer' as const, city, state }
                : role === 'vendor'
                ? { ...base, role: 'vendor' as const, city, state, accountType, vendorCategory }
                : { ...base, role: 'owner' as const };

        setLoading(true);

        register(registerData, {
            onSuccess: data => {
                setLoading(false);
                setUser(data?.user, data?.token);
                alert.success('Registration succeeded', `${role} registered successfully`);
            },
            onError: (error: ApiError) => {
                setLoading(false);
                alert.error('Registration failed', error?.message || 'Something went wrong');
            },
        });
    };

    // ── OTP Modal ─────────────────────────────────────────────────────────────
    const isOtpModalVisible = otpStep !== 'none';
    const otpIsPending = otpStep === 'email' ? verifyingEmailOtp : verifyingPhoneOtp;

    const handleOtpConfirm = () => {
        if (otpStep === 'email') handleVerifyEmailOtp();
        else if (otpStep === 'phone') handleVerifyPhoneOtp();
    };

    const handleResendOtp = () => {
        if (otpStep === 'email') handleSendEmailOtp();
        else if (otpStep === 'phone') handleSendPhoneOtp();
    };

    // ── Render ────────────────────────────────────────────────────────────────
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
                                    {otpStep === 'email' ? email : phone}
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
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
                        </TouchableOpacity>
                        <Text style={styles.topBarTitle}>Create Account</Text>
                        <View style={{ width: 44 }} />
                    </Animated.View>

                    {/* Role pill */}
                    <Animated.View style={[styles.rolePillWrap, { opacity: fadeAnim }]}>
                        <View
                            style={[
                                styles.rolePill,
                                { backgroundColor: meta.bg, borderColor: meta.color + '55' },
                            ]}
                        >
                            <View
                                style={[
                                    styles.rolePillIcon,
                                    { backgroundColor: meta.color + '22' },
                                ]}
                            >
                                <Ionicons name={meta.icon as any} size={14} color={meta.color} />
                            </View>
                            <Text style={[styles.rolePillText, { color: meta.color }]}>
                                Registering as{' '}
                                <Text style={{ fontWeight: Typography.extraBold }}>
                                    {meta.label}
                                </Text>
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Heading */}
                    <Animated.View style={[styles.heading, { opacity: fadeAnim }]}>
                        <Text style={styles.headingTitle}>Let's get{'\n'}you set up</Text>
                        <Text style={styles.headingSubtitle}>
                            Fill in your details to create a free account.
                        </Text>
                    </Animated.View>

                    {/* Form card */}
                    <Animated.View
                        style={[
                            styles.card,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
                            },
                        ]}
                    >
                        {/* ── Common fields ── */}
                        <Field
                            label="Full Name"
                            placeholder="Sara Patel"
                            icon="person-outline"
                            value={fullName}
                            onChangeText={t => {
                                setFullName(t);
                                clearError('fullName');
                            }}
                            error={errors.fullName}
                            autoCapitalize="words"
                        />

                        {/* Email with verify button */}
                        <Field
                            label="Email Address"
                            placeholder="you@example.com"
                            icon="mail-outline"
                            value={email}
                            onChangeText={t => {
                                setEmail(t);
                                setEmailVerified(false); // reset verification if email changes
                                clearError('email');
                            }}
                            error={errors.email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            trailingIcon={emailVerified ? 'checkmark-circle' : undefined}
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
                                <Ionicons
                                    name="checkmark-circle"
                                    size={13}
                                    color={Colors.success}
                                />
                                <Text style={styles.verifiedText}>Email verified</Text>
                            </View>
                        )}

                        {/* Phone with verify button */}
                        {/* FIX: removed maxLength={10} since the field stores raw digits
                            and placeholder shows formatted number. maxLength now 10 for digits only. */}
                        <Field
                            label="Phone Number"
                            placeholder="9876543210"
                            icon="call-outline"
                            value={phone}
                            onChangeText={t => {
                                // strip non-digits and cap at 10
                                const digits = t.replace(/\D/g, '').slice(0, 10);
                                setPhone(digits);
                                setPhoneVerified(false); // reset if phone changes
                                clearError('phone');
                            }}
                            error={errors.phone}
                            keyboardType="phone-pad"
                            maxLength={10}
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
                                <Ionicons
                                    name="checkmark-circle"
                                    size={13}
                                    color={Colors.success}
                                />
                                <Text style={styles.verifiedText}>Phone verified</Text>
                            </View>
                        )}

                        <Field
                            label="Password"
                            placeholder="Minimum 8 characters"
                            icon="lock-closed-outline"
                            value={password}
                            onChangeText={t => {
                                setPassword(t);
                                clearError('password');
                            }}
                            error={errors.password}
                            secureTextEntry={!showPassword}
                            trailingIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            onTrailingPress={() => setShowPassword(!showPassword)}
                        />

                        <PasswordStrength password={password} />

                        {password.length > 0 && (
                            <View style={styles.hintsGrid}>
                                {[
                                    // FIX: consistent with validation — 8 chars, not 6
                                    { ok: password.length >= 8, text: 'Min 8 characters' },
                                    { ok: /[A-Z]/.test(password), text: 'Uppercase letter' },
                                    { ok: /[0-9]/.test(password), text: 'Number included' },
                                    {
                                        ok: /[^a-zA-Z0-9]/.test(password),
                                        text: 'Special character',
                                    },
                                ].map((h, i) => (
                                    <View key={i} style={styles.hintItem}>
                                        <Ionicons
                                            name={h.ok ? 'checkmark-circle' : 'ellipse-outline'}
                                            size={13}
                                            color={h.ok ? Colors.success : Colors.charcoalLight}
                                        />
                                        <Text style={[styles.hintText, h.ok && styles.hintTextOk]}>
                                            {h.text}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* ── Location fields (customer + vendor) ── */}
                        {(role === 'customer' || role === 'vendor') && (
                            // FIX: added minWidth:0 on children so they shrink correctly in row
                            <View style={styles.row}>
                                <View style={styles.rowItem}>
                                    <Field
                                        label="City"
                                        placeholder="Mumbai"
                                        icon="location-outline"
                                        value={city}
                                        onChangeText={t => {
                                            setCity(t);
                                            clearError('city');
                                        }}
                                        error={errors.city}
                                        autoCapitalize="words"
                                    />
                                </View>
                                <View style={styles.rowItem}>
                                    <Field
                                        label="State"
                                        placeholder="Maharashtra"
                                        icon="map-outline"
                                        value={state}
                                        onChangeText={t => {
                                            setState(t);
                                            clearError('state');
                                        }}
                                        error={errors.state}
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>
                        )}

                        {/* ── Vendor-only fields ── */}
                        {role === 'vendor' && (
                            <>
                                <Text style={styles.fieldLabel}>Account Type</Text>
                                <View style={styles.toggleRow}>
                                    {(['individual', 'company'] as const).map(type => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[
                                                styles.toggleBtn,
                                                accountType === type && styles.toggleBtnActive,
                                            ]}
                                            onPress={() => setAccountType(type)}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons
                                                name={
                                                    type === 'individual'
                                                        ? 'person-outline'
                                                        : 'business-outline'
                                                }
                                                size={15}
                                                color={
                                                    accountType === type
                                                        ? Colors.white
                                                        : Colors.charcoalLight
                                                }
                                            />
                                            <Text
                                                style={[
                                                    styles.toggleBtnText,
                                                    accountType === type &&
                                                        styles.toggleBtnTextActive,
                                                ]}
                                            >
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={styles.fieldLabel}>Vendor Category</Text>
                                <View style={styles.categoryGrid}>
                                    {VENDOR_CATEGORIES.map(cat => {
                                        const active = vendorCategory === cat;
                                        return (
                                            <TouchableOpacity
                                                key={cat}
                                                style={[
                                                    styles.categoryChip,
                                                    active && styles.categoryChipActive,
                                                ]}
                                                onPress={() => {
                                                    setVendorCategory(cat);
                                                    clearError('vendorCategory');
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                <Text
                                                    style={[
                                                        styles.categoryChipText,
                                                        active && styles.categoryChipTextActive,
                                                    ]}
                                                >
                                                    {cat}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                                {!!errors.vendorCategory && (
                                    <View style={styles.errorRow}>
                                        <Ionicons
                                            name="alert-circle"
                                            size={12}
                                            color={Colors.danger}
                                        />
                                        <Text style={styles.errorText}>
                                            {errors.vendorCategory}
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}

                        {/* ── Referral code ── */}
                        <Field
                            label="Referral Code (Optional)"
                            placeholder="Enter referral code if any"
                            icon="people-outline"
                            value={referralCode}
                            onChangeText={setReferralCode}
                            autoCapitalize="characters"
                        />

                        <View style={styles.divider} />

                        {/* Terms */}
                        <TouchableOpacity
                            style={styles.termsRow}
                            onPress={() => {
                                setAgreed(!agreed);
                                clearError('agreed');
                            }}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.checkbox,
                                    agreed && styles.checkboxOn,
                                    !!errors.agreed && styles.checkboxErr,
                                ]}
                            >
                                {agreed && (
                                    <Ionicons name="checkmark" size={11} color={Colors.white} />
                                )}
                            </View>
                            <Text style={styles.termsText}>
                                I agree to the{' '}
                                <Text
                                    style={styles.termsLink}
                                    onPress={() => Alert.alert('Terms', 'Coming soon.')}
                                >
                                    Terms of Service
                                </Text>{' '}
                                and{' '}
                                <Text
                                    style={styles.termsLink}
                                    onPress={() => Alert.alert('Privacy', 'Coming soon.')}
                                >
                                    Privacy Policy
                                </Text>
                            </Text>
                        </TouchableOpacity>
                        {!!errors.agreed && (
                            <View
                                style={[
                                    styles.errorRow,
                                    { marginTop: 0, marginBottom: Spacing.sm },
                                ]}
                            >
                                <Ionicons name="alert-circle" size={12} color={Colors.danger} />
                                <Text style={styles.errorText}>{errors.agreed}</Text>
                            </View>
                        )}

                        {/* CTA */}
                        <Animated.View
                            style={{ transform: [{ scale: btnScale }], marginTop: Spacing.sm }}
                        >
                            <TouchableOpacity
                                style={[styles.registerBtn, loading && { opacity: 0.7 }]}
                                onPress={handleRegister}
                                activeOpacity={0.9}
                                disabled={loading}
                            >
                                {loading ? (
                                    <LoadingDots />
                                ) : (
                                    <>
                                        <Text style={styles.registerBtnText}>Create Account</Text>
                                        <View style={styles.registerBtnArrow}>
                                            <Ionicons
                                                name="arrow-forward"
                                                size={17}
                                                color={meta.color}
                                            />
                                        </View>
                                    </>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    </Animated.View>

                    {/* Sign in link */}
                    <Animated.View style={[styles.loginRow, { opacity: fadeAnim }]}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('login')}>
                            <Text style={styles.loginLink}>Sign in</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
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
        paddingTop: 56,
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
    rolePillWrap: { width: SCREEN_WIDTH - 32, marginTop: Spacing.lg, marginBottom: Spacing.sm },
    rolePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: Radii.full,
        borderWidth: 1,
    },
    rolePillIcon: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rolePillText: { fontSize: 12, fontWeight: Typography.medium, letterSpacing: 0.1 },
    heading: { width: SCREEN_WIDTH - 32, marginBottom: Spacing.lg },
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

    // FIX: row children need minWidth:0 to shrink properly
    row: { flexDirection: 'row', gap: Spacing.sm },
    rowItem: { flex: 1, minWidth: 0 },

    // OTP verify buttons
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

    // Password hints
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

    fieldLabel: {
        fontSize: 12,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalLight,
        marginBottom: Spacing.xs,
        marginTop: Spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Account-type toggle
    toggleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 44,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    toggleBtnActive: { backgroundColor: Colors.charcoal, borderColor: Colors.charcoal },
    toggleBtnText: { fontSize: 14, fontWeight: Typography.medium, color: Colors.charcoalLight },
    toggleBtnTextActive: { color: Colors.white, fontWeight: Typography.bold },

    // Vendor category chips
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    categoryChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
    },
    categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    categoryChipText: { fontSize: 13, color: Colors.charcoalLight, fontWeight: Typography.medium },
    categoryChipTextActive: { color: Colors.white, fontWeight: Typography.bold },

    divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.lg },
    termsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
        flexShrink: 0,
    },
    checkboxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    checkboxErr: { borderColor: Colors.danger },
    termsText: { flex: 1, fontSize: 13, color: Colors.charcoalLight, lineHeight: 20 },
    termsLink: { color: Colors.primary, fontWeight: Typography.bold },
    registerBtn: {
        backgroundColor: Colors.charcoal,
        borderRadius: Radii.md,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        ...Shadows.floating,
    },
    registerBtnText: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.3,
    },
    registerBtnArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xl },
    loginText: { fontSize: 14, color: Colors.charcoalLight },
    loginLink: { fontSize: 14, color: Colors.primary, fontWeight: Typography.extraBold },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
    errorText: { fontSize: 11, color: Colors.danger, fontWeight: Typography.semiBold },

    // OTP Modal
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
});

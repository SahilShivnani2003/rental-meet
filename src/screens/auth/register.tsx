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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme/theme';
import Field from '../../components/UI/InputField';
import LoadingDots from '../../components/UI/loading-dots';
import PasswordStrength from '../../components/UI/password-strength-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigations/RootNavigation';
import { useAlert } from '../../context/AlertContext';
import { authAPI } from '../../service/apis/auth';
import { useAuthStore } from '../../store/useAuthStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface roleMeta {
    label: string;
    icon: string;
    color: string;
    bg: string
}

const ROLE_META: Record<string, roleMeta> = {
    client: {
        label: 'Client',
        icon: 'person',
        color: Colors.info,
        bg: Colors.infoLight
    },
    owner: {
        label: 'Space Owner',
        icon: 'business',
        color: Colors.primary,
        bg: Colors.primaryLight
    },
    vendor: {
        label: 'Service Vendor',
        icon: 'construct',
        color: Colors.success,
        bg: Colors.successLight
    },
};

type registerProps = NativeStackScreenProps<RootStackParamList, 'register'>

export default function RegisterScreen({ navigation, route }: registerProps) {
    const role = route.params?.role ?? 'customer';
    const meta = ROLE_META[role] ?? ROLE_META.client;
    const alert = useAlert();
    const { setUser } = useAuthStore();

    // Form fields
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [refralCode, setRefralCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(28)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const btnScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        StatusBar.setBarStyle('dark-content');
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6 }),
        ]).start();
    }, []);

    const shakeCard = () =>
        Animated.sequence([
            Animated.timing(shakeAnim, {
                toValue: 9,
                duration: 55,
                useNativeDriver: true
            }),
            Animated.timing(shakeAnim, {
                toValue: -9,
                duration: 55,
                useNativeDriver: true
            }),

            Animated.timing(shakeAnim, {
                toValue: 7,
                duration: 55,
                useNativeDriver: true
            }),
            Animated.timing(shakeAnim, {
                toValue: -7,
                duration: 55,
                useNativeDriver: true
            }),
            Animated.timing(shakeAnim, {
                toValue: 0,
                duration: 55,
                useNativeDriver: true
            }),
        ]).start();

    const clearError = (key: string) => setErrors((prev) => ({ ...prev, [key]: '' }));

    const validate = () => {
        const e: Record<string, string> = {};

        if (!fullName.trim()) {
            e.fullName = 'Full name is required';
        }

        if (!email.trim()) {
            e.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            e.email = 'Enter a valid email';
        }

        if (!phone.trim()) {
            e.phone = 'Phone number is required';
        } else if (phone.replace(/\D/g, '').length < 10) {
            e.phone = 'Enter a valid 10-digit number';
        }

        if (!password) {
            e.password = 'Password is required';
        } else if (password.length < 6) {
            e.password = 'Must be at least 6 characters';
        }

        if (!agreed) {
            e.agreed = 'Please accept the terms to continue';
        }

        return e;
    };

    const handleRegister = async () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) { shakeCard(); return; }

        Animated.sequence([
            Animated.timing(btnScale, {
                toValue: 0.95,
                duration: 80,
                useNativeDriver: true
            }),
            Animated.spring(btnScale, {
                toValue: 1,
                useNativeDriver: true,
                speed: 20
            }),
        ]).start();

        try {

            setLoading(true);

            const registerData = {
                name: fullName,
                email: email,
                phone: phone,
                password: password,
                role: role,
                referralCode: refralCode
            }

            const response = await authAPI.register(registerData)

            console.log('REGISTER RESPONSE : ', response);

            if (!response.success) {
                alert.error('Registration failed', response?.message || 'Something went wrong')
                return;
            }

            setUser(response?.user, response?.token);
            alert.success('Registration Succed', `${role} registered Successfully`);

            navigation.replace('login');

        } catch (error: any) {
            console.error('REGISTER ERROR : ', error)
            alert.error('Register failed', error?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Decorative arc */}
                <View style={styles.arcTop} />

                {/* ── Top nav bar ── */}
                <Animated.View style={[styles.topBar, { opacity: fadeAnim }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons
                            name="arrow-back"
                            size={20}
                            color={Colors.charcoal}
                        />
                    </TouchableOpacity>
                    <Text style={styles.topBarTitle}>Create Account</Text>
                    <View style={{ width: 44 }} />
                </Animated.View>

                {/* ── Role pill ── */}
                <Animated.View style={[styles.rolePillWrap, { opacity: fadeAnim }]}>
                    <View style={[styles.rolePill, { backgroundColor: meta.bg, borderColor: meta.color + '55' }]}>
                        <View style={[styles.rolePillIcon, { backgroundColor: meta.color + '22' }]}>
                            <Ionicons
                                name={meta.icon as any}
                                size={14}
                                color={meta.color}
                            />
                        </View>
                        <Text style={[styles.rolePillText, { color: meta.color }]}>
                            Registering as <Text style={{ fontWeight: Typography.extraBold }}>{meta.label}</Text>
                        </Text>
                    </View>
                </Animated.View>

                {/* ── Heading ── */}
                <Animated.View style={[styles.heading, { opacity: fadeAnim }]}>
                    <Text style={styles.headingTitle}>Let's get{'\n'}you set up</Text>
                    <Text style={styles.headingSubtitle}>Fill in your details to create a free account.</Text>
                </Animated.View>

                {/* ── Form card ── */}
                <Animated.View
                    style={[
                        styles.card,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
                        },
                    ]}
                >
                    {/* Full Name */}
                    <Field
                        label="Full Name"
                        placeholder="Sara Patel"
                        icon="person-outline"
                        value={fullName}
                        onChangeText={(t) => { setFullName(t); clearError('fullName'); }}
                        error={errors.fullName}
                        autoCapitalize="words"
                    />

                    {/* Email */}
                    <Field
                        label="Email Address"
                        placeholder="you@example.com"
                        icon="mail-outline"
                        value={email}
                        onChangeText={(t) => { setEmail(t); clearError('email'); }}
                        error={errors.email}
                        keyboardType="email-address"
                    />

                    {/* Phone */}
                    <Field
                        label="Phone Number"
                        placeholder="+91 98765 43210"
                        icon="call-outline"
                        value={phone}
                        onChangeText={(t) => { setPhone(t.replace(/[^\d\s+\-()]/g, '')); clearError('phone'); }}
                        error={errors.phone}
                        keyboardType="phone-pad"
                        maxLength={10}
                    />

                    {/* Password */}
                    <Field
                        label="Password"
                        placeholder="Minimum 6 characters"
                        icon="lock-closed-outline"
                        value={password}
                        onChangeText={(t) => { setPassword(t); clearError('password'); }}
                        error={errors.password}
                        secureTextEntry={!showPassword}
                        trailingIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        onTrailingPress={() => setShowPassword(!showPassword)}
                    />

                    {/**Refral Code */}
                    <Field
                        label='Refral Code (Optional'
                        placeholder='Enter Refral Code (If any)'
                        icon="people-outline"
                        value={refralCode}
                        onChangeText={(t) => { setRefralCode(t); }}

                    />

                    {/* Password strength */}
                    <PasswordStrength password={password} />

                    {/* Password rule hints */}
                    {password.length > 0 && (
                        <View style={styles.hintsGrid}>
                            {[
                                { ok: password.length >= 8, text: 'Min 8 characters' },
                                { ok: /[A-Z]/.test(password), text: 'Uppercase letter' },
                                { ok: /[0-9]/.test(password), text: 'Number included' },
                                { ok: /[^a-zA-Z0-9]/.test(password), text: 'Special character' },
                            ].map((h, i) => (
                                <View key={i} style={styles.hintItem}>
                                    <Ionicons
                                        name={h.ok ? 'checkmark-circle' : 'ellipse-outline'}
                                        size={13}
                                        color={h.ok ? Colors.success : Colors.charcoalLight}
                                    />
                                    <Text style={[styles.hintText, h.ok && styles.hintTextOk]}>{h.text}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Terms */}
                    <TouchableOpacity
                        style={styles.termsRow}
                        onPress={() => { setAgreed(!agreed); clearError('agreed'); }}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.checkbox,
                            agreed && styles.checkboxOn,
                            !!errors.agreed && styles.checkboxErr,
                        ]}>
                            {agreed && <Ionicons name="checkmark" size={11} color={Colors.white} />}
                        </View>
                        <Text style={styles.termsText}>
                            I agree to the{' '}
                            <Text style={styles.termsLink} onPress={() => Alert.alert('Terms', 'Coming soon.')}>Terms of Service</Text>
                            {' '}and{' '}
                            <Text style={styles.termsLink} onPress={() => Alert.alert('Privacy', 'Coming soon.')}>Privacy Policy</Text>
                        </Text>
                    </TouchableOpacity>
                    {!!errors.agreed && (
                        <View style={[styles.errorRow, { marginTop: 0, marginBottom: Spacing.sm }]}>
                            <Ionicons name="alert-circle" size={12} color={Colors.danger} />
                            <Text style={styles.errorText}>{errors.agreed}</Text>
                        </View>
                    )}

                    {/* Register CTA */}
                    <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: Spacing.sm }}>
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
                                        <Ionicons name="arrow-forward" size={17} color={meta.color} />
                                    </View>
                                </>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>

                {/* Already have account */}
                <Animated.View style={[styles.loginRow, { opacity: fadeAnim }]}>
                    <Text style={styles.loginText}>Already have an account? </Text>
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
    container: {
        flex: 1,
        backgroundColor: Colors.background
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingBottom: 48
    },
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
        paddingBottom: Spacing.sm
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: Radii.md,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.card
    },
    topBarTitle: {
        fontSize: 16,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: -0.2
    },
    rolePillWrap: {
        width: SCREEN_WIDTH - 32,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm
    },
    rolePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: Radii.full,
        borderWidth: 1
    },
    rolePillIcon: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center'
    },
    rolePillText: {
        fontSize: 12,
        fontWeight: Typography.medium,
        letterSpacing: 0.1
    },
    heading: {
        width: SCREEN_WIDTH - 32,
        marginBottom: Spacing.lg
    },
    headingTitle: {
        fontSize: 30,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.8,
        lineHeight: 36,
        marginBottom: 8
    },
    headingSubtitle: {
        fontSize: 13,
        color: Colors.charcoalLight,
        lineHeight: 20
    },
    card: {
        width: SCREEN_WIDTH - 32,
        backgroundColor: Colors.surface,
        borderRadius: Radii.xxl,
        padding: Spacing.xl,
        ...Shadows.header
    },
    hintsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        marginBottom: Spacing.md,
        marginTop: -Spacing.sm
    },
    hintItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        width: '47%'
    },
    hintText: {
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium
    },
    hintTextOk: {
        color: Colors.success,
        fontWeight: Typography.semiBold
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.lg
    },
    termsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        marginBottom: Spacing.sm
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
        flexShrink: 0
    },
    checkboxOn: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary
    },
    checkboxErr: {
        borderColor: Colors.danger
    },
    termsText: {
        flex: 1,
        fontSize: 13,
        color: Colors.charcoalLight,
        lineHeight: 20
    },
    termsLink: {
        color: Colors.primary,
        fontWeight: Typography.bold
    },
    registerBtn: {
        backgroundColor: Colors.charcoal,
        borderRadius: Radii.md,
        height: 56, flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        ...Shadows.floating
    },
    registerBtnText: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.3
    },
    registerBtnArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center'
    },
    loginRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.xl
    },
    loginText: {
        fontSize: 14,
        color: Colors.charcoalLight
    },
    loginLink: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: Typography.extraBold
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 5
    },
    errorText: {
        fontSize: 11,
        color: Colors.danger,
        fontWeight: Typography.semiBold
    },
});
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Animated,
    Dimensions,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Field from '@/components/UI/InputField';
import LoadingDots from '@/components/UI/loading-dots';
import { useAlert } from '@/context/AlertContext';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors, Spacing, Radii, Shadows, Typography } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import { useLogin } from '../hooks/useLogin';
import { ApiError } from '@/types/ApiError';
import { User } from '@/features/profile/types/User';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type LoginProps = NativeStackScreenProps<RootStackParamList, 'login'>;

export default function LoginScreen({ navigation }: LoginProps) {
    const { setUser } = useAuthStore();
    const {mutate: login} = useLogin();
    const alert = useAlert();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ── Animation refs ──────────────────────────────────────────────────────────
    const logoAnim = useRef(new Animated.Value(0)).current;
    const cardAnim = useRef(new Animated.Value(40)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const btnScale = useRef(new Animated.Value(1)).current;
    const skipAnim = useRef(new Animated.Value(0)).current;

    const clearError = (key: string) => setErrors(prev => ({ ...prev, [key]: '' }));

    useEffect(() => {
        StatusBar.setBarStyle('dark-content');
        Animated.sequence([
            Animated.timing(logoAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.parallel([
                Animated.spring(cardAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    speed: 14,
                    bounciness: 6,
                }),
                Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
                // Skip button fades in slightly after the card
                Animated.timing(skipAnim, {
                    toValue: 1,
                    duration: 400,
                    delay: 300,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, []);

    const shakeCard = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!email.trim()) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
        if (!password) e.password = 'Password is required';
        else if (password.length < 6) e.password = 'Must be at least 6 characters';
        return e;
    };

    const handleLogin = async () => {
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

        setLoading(true);
        login({email, password},
            {
                onSuccess:(data)=>{
                    setLoading(false)
                    alert.success('Success', data.message || 'Login successful');
                    setUser(data?.user, data?.token);

                    const userData = data?.user as User;

                    if(userData.role === 'owner'){
                        navigation.replace('owner');
                    }else if(userData.role === 'vendor'){
                        navigation.replace('vendor');
                    }else if(userData.role === 'customer'){
                        navigation.replace('client');
                    }else{
                        navigation.replace('login')
                    }
                    
                },
                onError:(error:ApiError)=>{
                    setLoading(false)
                    alert.error('Login failed', error?.message || 'Something went wrong');
                }
            }
        )
    };

    // ── Skip — navigates as a guest client ──────────────────────────────────────
    const handleSkip = () => {
        console.log('Skip press')
        alert.show({
            title: 'Continue as Guest',
            message: 'You can browse venues without singing in. Some features will be limited',
            buttons: [
                { label: 'Cancel', onPress: alert.dismiss, style: 'ghost' },
                {
                    label: 'Continue',
                    onPress: () => {
                        navigation.replace('client');
                        alert.dismiss();
                    },
                    style: 'primary',
                },
            ],
        });
    };

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
                {/* ── Decorative background arcs ── */}
                <View style={styles.arcTop} />
                <View style={styles.arcBottom} />

                {/* ── Skip button (top-right) ── */}
                <Animated.View style={[styles.skipWrapper, { opacity: skipAnim }]}>
                    <TouchableOpacity
                        style={styles.skipBtn}
                        onPress={handleSkip}
                        activeOpacity={0.75}
                    >
                        <Text style={styles.skipText}>Skip</Text>
                        <Ionicons name="chevron-forward" size={14} color={Colors.charcoalLight} />
                    </TouchableOpacity>
                </Animated.View>

                {/* ── Logo area ── */}
                <Animated.View
                    style={[
                        styles.logoArea,
                        {
                            opacity: logoAnim,
                            transform: [
                                {
                                    translateY: logoAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-20, 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <View style={styles.logoCard}>
                        <Image
                            source={require('@assets/MainLogo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                </Animated.View>

                {/* ── Login card ── */}
                <Animated.View
                    style={[
                        styles.card,
                        {
                            opacity: cardOpacity,
                            transform: [{ translateY: cardAnim }, { translateX: shakeAnim }],
                        },
                    ]}
                >
                    <Text style={styles.cardTitle}>Welcome back</Text>
                    <Text style={styles.cardSubtitle}>Sign in to continue</Text>

                    <Field
                        label="Email"
                        placeholder="you@example.com"
                        icon="mail-outline"
                        value={email}
                        onChangeText={t => {
                            setEmail(t);
                            clearError('email');
                        }}
                        error={errors.email}
                        keyboardType="email-address"
                    />

                    <Field
                        label="Password"
                        placeholder="Minimum 6 characters"
                        icon="lock-closed-outline"
                        value={password}
                        onChangeText={t => {
                            setPassword(t);
                            clearError('password');
                        }}
                        error={errors.password}
                        secureTextEntry={!showPassword}
                        trailingIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        onTrailingPress={() => setShowPass(!showPassword)}
                    />

                    <TouchableOpacity
                        style={styles.forgotRow}
                        onPress={() => Alert.alert('Reset Password', 'A reset link has been sent.')}
                    >
                        <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>

                    {/* ── Login button ── */}
                    <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                        <TouchableOpacity
                            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                            onPress={handleLogin}
                            activeOpacity={0.9}
                            disabled={loading}
                        >
                            {loading ? (
                                <View style={styles.loadingRow}>
                                    <LoadingDots />
                                </View>
                            ) : (
                                <>
                                    <Text style={styles.loginBtnText}>Sign In</Text>
                                    <View style={styles.loginBtnArrow}>
                                        <Ionicons
                                            name="arrow-forward"
                                            size={18}
                                            color={Colors.primary}
                                        />
                                    </View>
                                </>
                            )}
                        </TouchableOpacity>
                    </Animated.View>

                    {/* ── Divider ── */}
                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* ── Guest / Skip button (inside card, secondary style) ── */}
                    <TouchableOpacity
                        style={styles.guestBtn}
                        onPress={handleSkip}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="person-outline" size={17} color={Colors.charcoalLight} />
                        <Text style={styles.guestBtnText}>Continue as Guest</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* ── Sign up nudge ── */}
                <Animated.View style={[styles.signupRow, { opacity: cardOpacity }]}>
                    <Text style={styles.signupText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('registerType')}>
                        <Text style={styles.signupLink}>Sign up</Text>
                    </TouchableOpacity>
                </Animated.View>

                <Text style={styles.version}>RentalMeet v1.0.0</Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { flexGrow: 1, alignItems: 'center', paddingBottom: Spacing.xxl, paddingTop: 0 },

    // Arcs
    arcTop: {
        position: 'absolute',
        top: -SCREEN_WIDTH * 0.5,
        left: -SCREEN_WIDTH * 0.5,
        width: SCREEN_WIDTH * 1,
        height: SCREEN_WIDTH * 1,
        borderRadius: SCREEN_WIDTH * 0.5,
        backgroundColor: Colors.primaryLight,
        opacity: 0.6,
    },
    arcBottom: {
        position: 'absolute',
        bottom: -SCREEN_WIDTH * 0.4,
        right: -SCREEN_WIDTH * 0.4,
        width: SCREEN_WIDTH * 0.8,
        height: SCREEN_WIDTH * 0.8,
        borderRadius: SCREEN_WIDTH * 0.4,
        backgroundColor: Colors.primaryLight,
        opacity: 0.4,
    },

    // ── Skip (top-right corner) ──
    skipWrapper: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 54 : 20,
        right: Spacing.lg,
        zIndex: 10,
    },
    skipBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: Radii.full ?? 99,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border ?? 'rgba(0,0,0,0.08)',
        ...Shadows.card,
    },
    skipText: {
        fontSize: 13,
        fontWeight: Typography.semiBold ?? Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 0.2,
    },

    // Logo
    logoArea: { alignItems: 'center', paddingTop: SCREEN_HEIGHT * 0.09, marginBottom: Spacing.xxl },
    logoCard: {
        width: 200,
        height: 110,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    logo: { width: '100%', height: '100%' },
    brandRow: { flexDirection: 'row', alignItems: 'baseline' },
    brandRental: {
        fontSize: 32,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: -0.5,
    },
    brandMeet: {
        fontSize: 32,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.5,
    },
    brandTagline: {
        fontSize: 9,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginTop: 4,
    },

    // Card
    card: {
        width: SCREEN_WIDTH - 32,
        backgroundColor: Colors.surface,
        borderRadius: Radii.xxl,
        padding: Spacing.xl,
        ...Shadows.header,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.4,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: Typography.md,
        color: Colors.charcoalLight,
        fontWeight: Typography.regular,
        marginBottom: Spacing.lg,
    },

    // Forgot
    forgotRow: { alignItems: 'flex-end', marginBottom: Spacing.lg, marginTop: -4 },
    forgotText: { fontSize: 13, color: Colors.primary, fontWeight: Typography.bold },

    // Login button
    loginBtn: {
        backgroundColor: Colors.charcoal,
        borderRadius: Radii.md,
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        ...Shadows.floating,
    },
    loginBtnDisabled: { opacity: 0.7 },
    loginBtnText: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.3,
    },
    loginBtnArrow: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingRow: { alignItems: 'center', justifyContent: 'center', height: 24 },

    // Divider
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing.md,
        gap: Spacing.sm,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border ?? 'rgba(0,0,0,0.08)' },
    dividerText: { fontSize: 12, color: Colors.charcoalLight, fontWeight: Typography.medium },

    // Guest button
    guestBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 50,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border ?? 'rgba(0,0,0,0.1)',
        backgroundColor: 'transparent',
    },
    guestBtnText: {
        fontSize: 15,
        fontWeight: Typography.semiBold ?? Typography.bold,
        color: Colors.charcoalLight,
    },

    // Sign up
    signupRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xl },
    signupText: { fontSize: 14, color: Colors.charcoalLight, fontWeight: Typography.regular },
    signupLink: { fontSize: 14, color: Colors.primary, fontWeight: Typography.extraBold },

    version: {
        marginTop: Spacing.lg,
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
});
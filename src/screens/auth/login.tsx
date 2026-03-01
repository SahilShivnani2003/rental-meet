import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
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
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme/theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigations/RootNavigation';
import LoadingDots from '../../components/UI/loading-dots';
import Field from '../../components/UI/input-field';
import { useAlert } from '../../context/AlertContext';
import { authAPI } from '../../service/apis/auth';
import { useAuthStore } from '../../store/auth-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type LoginProps = NativeStackScreenProps<RootStackParamList, 'login'>;

export default function LoginScreen({ navigation }: LoginProps) {
    const { setUser } = useAuthStore();
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

    //Clear errors 
    const clearError = (key: string) => setErrors((prev) => ({ ...prev, [key]: '' }));

    useEffect(() => {
        StatusBar.setBarStyle('dark-content');
        Animated.sequence([
            Animated.timing(logoAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.parallel([
                Animated.spring(cardAnim, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6 }),
                Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
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

        if (!email.trim()) {
            e.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            e.email = 'Enter a valid email';
        }

        if (!password) {
            e.password = 'Password is required';
        } else if (password.length < 6) {
            e.password = 'Must be at least 6 characters';
        }

        return e;
    }
    const handleLogin = async () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) {
            shakeCard();
            return;
        }

        // Button press animation
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

            const loginData = {
                email: email,
                password: password
            };

            const response = await authAPI.login(loginData);

            console.log('LOGIN RESPONSE : ', response);

            if (!response?.success) {
                alert.error('Login failed', response?.message || 'Something went wrong');
                return;
            }

            setUser(response?.user, response?.token);
            alert.success('Success', response?.message || 'Login Successfull');

            if (response?.user?.role === 'owner') {
                navigation.replace('owner');
            } else {
                navigation.replace('client');
            }

        } catch (error: any) {
            console.log('LOGIN ERROR : ', error);
            alert.error('Login failed', error?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* ── Decorative background arcs ── */}
                <View style={styles.arcTop} />
                <View style={styles.arcBottom} />

                {/* ── Logo area ── */}
                <Animated.View style={[styles.logoArea, {
                    opacity: logoAnim,
                    transform: [{
                        translateY: logoAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-20, 0]
                        })
                    }]
                }]}
                >
                    <View style={styles.logoCard}>
                        <Image
                            source={require('../../assets/logo.jpeg')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    <View style={styles.brandRow}>
                        <Text style={styles.brandRental}>Rental</Text>
                        <Text style={styles.brandMeet}>Meet</Text>
                    </View>
                    <Text style={styles.brandTagline}>BOOK YOUR PREMIUM MEETING VENUES</Text>
                </Animated.View>

                {/* ── Login card ── */}
                <Animated.View
                    style={[
                        styles.card,
                        {
                            opacity: cardOpacity,
                            transform: [
                                { translateY: cardAnim },
                                { translateX: shakeAnim },
                            ],
                        },
                    ]}
                >
                    <Text style={styles.cardTitle}>Welcome back</Text>
                    <Text style={styles.cardSubtitle}>Sign in to continue</Text>

                    {/* ── Email field ── */}
                    <Field
                        label='Email'
                        placeholder="you@example.com"
                        icon="mail-outline"
                        value={email}
                        onChangeText={(t) => { setEmail(t); clearError('email') }}
                        error={errors.email}
                        keyboardType="email-address"
                    />

                    {/* ── Password field ── */}
                    <Field
                        label='Password'
                        placeholder="Minimum 6 characters"
                        icon="lock-closed-outline"
                        value={password}
                        onChangeText={(t) => { setPassword(t); clearError('password') }}
                        error={errors.password}
                        secureTextEntry={!showPassword}
                        trailingIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        onTrailingPress={() => setShowPass(!showPassword)}
                    />

                    {/* Forgot password */}
                    <TouchableOpacity style={styles.forgotRow}
                        onPress={() => Alert.alert('Reset Password', 'A reset link has been sent.')}>
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
                                        <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
                                    </View>
                                </>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
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
    container: {
        flex: 1,
        backgroundColor: Colors.background
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingBottom: Spacing.xxl,
        paddingTop: 0
    },

    // Decorative arcs
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

    // Logo area
    logoArea: {
        alignItems: 'center',
        paddingTop: SCREEN_HEIGHT * 0.09,
        marginBottom: Spacing.xxl
    },
    logoCard: {
        width: 110,
        height: 110,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md
    },
    logo: {
        width: '100%',
        height: '100%'
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'baseline'
    },
    brandRental: {
        fontSize: 32,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: -0.5
    },
    brandMeet: {
        fontSize: 32,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.5
    },
    brandTagline: {
        fontSize: 9,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginTop: 4
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
        marginBottom: 4
    },
    cardSubtitle: {
        fontSize: Typography.md,
        color: Colors.charcoalLight,
        fontWeight: Typography.regular,
        marginBottom: Spacing.lg
    },

    // Forgot
    forgotRow: {
        alignItems: 'flex-end',
        marginBottom: Spacing.lg,
        marginTop: -4

    },


    forgotText: {
        fontSize: 13,
        color: Colors.primary,
        fontWeight: Typography.bold

    },


    // Login button
    loginBtn: {
        backgroundColor: Colors.charcoal,
        borderRadius: Radii.md,
        height: 54, flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        ...Shadows.floating
    },
    loginBtnDisabled: {
        opacity: 0.7

    },
    loginBtnText: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.white, letterSpacing: 0.3

    },
    loginBtnArrow: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center'

    },
    loadingRow: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 24

    },

    // Sign up
    signupRow: {
        flexDirection: 'row', alignItems: 'center',
        marginTop: Spacing.xl

    },
    signupText: {
        fontSize: 14,
        color: Colors.charcoalLight,
        fontWeight: Typography.regular
    },
    signupLink: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: Typography.extraBold
    },

    version: {
        marginTop: Spacing.lg,
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium
    },
});
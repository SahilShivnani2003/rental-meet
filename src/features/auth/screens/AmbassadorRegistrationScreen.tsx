import { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/theme/theme';
import StepAddressDetails from '../ambassadorSteps/StepAddressDetails';
import StepBankDetails from '../ambassadorSteps/StepBankDetails';
import StepDocumentsDeclaration from '../ambassadorSteps/StepDocumentsDeclaration';
import StepPersonalInfo from '../ambassadorSteps/StepPersonalInfo';
import StepProfessionalBackground from '../ambassadorSteps/StepProfessionalBackground';
import StepVenueNetwork from '../ambassadorSteps/StepVenueNetwork';
import StepIndicator from '../components/StepIndicator';
import { AmbassadorRegistration } from '../types/AmbassadarRegister';
import {
    FieldErrors,
    validatePersonalInfo,
    validateAddressDetails,
    validateProfessionalBackground,
    validateVenueNetwork,
    validateBankDetails,
    validateDocumentsAndDeclaration,
} from '../validation/ambassadorValidation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';
import { useAlert } from '@/context/AlertContext';
import { createEmptyAmbassadorForm } from '../validation/createAmbassadorForm';
import { useAmbassadorApply } from '../hooks/useRegister';
import { ApiError } from '@/types/ApiError';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEP_LABELS = [
    'Personal Information',
    'Address & Working Area',
    'Professional Background',
    'Venue Network & Performance',
    'Bank Details & Referral',
    'Documents & Declaration',
];

// Short, friendly sub-copy shown under the big heading for each step.
const STEP_SUBTITLES = [
    "Tell us a bit about yourself so we know who's joining.",
    'Where are you based, and where would you like to work?',
    'Your experience helps us match you to the right venues.',
    'Share the venues and network you already bring to the table.',
    'Add your payout details and referral info, if you have one.',
    'Upload your documents and confirm the declaration to finish up.',
];

type AmbassadorRegistrationScreenProps = NativeStackScreenProps<
    RootStackParamList,
    'ambassadorRegister'
>;

export default function AmbassadorRegistrationScreen({
    navigation,
}: AmbassadorRegistrationScreenProps) {
    const alert = useAlert();
    const insets = useSafeAreaInsets();
    const [stepIndex, setStepIndex] = useState(0);
    const [form, setForm] = useState<AmbassadorRegistration>(createEmptyAmbassadorForm());
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<FieldErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const scrollRef = useRef<ScrollView>(null);
    const { mutate: applyAmbassador } = useAmbassadorApply();

    // ── Animations ────────────────────────────────────────────────────────────
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(28)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const btnScale = useRef(new Animated.Value(1)).current;

    // Initial mount entrance.
    useEffect(() => {
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

    useEffect(() => {
        fadeAnim.setValue(0);
        slideAnim.setValue(20);
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                speed: 16,
                bounciness: 5,
            }),
        ]).start();
    }, [stepIndex]);

    const shakeCard = () =>
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 9, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 7, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -7, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
        ]).start();

    const bounceButton = () =>
        Animated.sequence([
            Animated.timing(btnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
            Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
        ]).start();

    const updateForm = (updater: (prev: AmbassadorRegistration) => AmbassadorRegistration) => {
        setForm(updater);
    };

    const validateCurrentStep = (): boolean => {
        let stepErrors: FieldErrors = {};
        switch (stepIndex) {
            case 0:
                stepErrors = validatePersonalInfo(form, confirmPassword);
                break;
            case 1:
                stepErrors = validateAddressDetails(form);
                break;
            case 2:
                stepErrors = validateProfessionalBackground(form);
                break;
            case 3:
                stepErrors = validateVenueNetwork(form);
                break;
            case 4:
                stepErrors = validateBankDetails(form);
                break;
            case 5:
                stepErrors = validateDocumentsAndDeclaration(form);
                break;
        }
        setErrors(stepErrors);
        return Object.keys(stepErrors).length === 0;
    };

    const goNext = () => {
        bounceButton();
        if (!validateCurrentStep()) {
            shakeCard();
            return;
        }
        if (stepIndex < STEP_LABELS.length - 1) {
            setErrors({});
            setStepIndex(i => i + 1);
            scrollRef.current?.scrollTo({ y: 0, animated: false });
        } else {
            handleSubmit();
        }
    };

    const goBack = () => {
        if (stepIndex === 0) return;
        setErrors({});
        setStepIndex(i => i - 1);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
    };

    // Screen-level back button: step back through the form first, then leave.
    const handleBackPress = () => {
        if (stepIndex > 0) {
            goBack();
        } else {
            navigation.goBack();
        }
    };

    const handleSubmit = async () => {
        setSubmitError(null);
        setSubmitting(true);

        applyAmbassador(form, {
            onSuccess: data => {
                if (data.success) {
                    navigation.replace('login');
                    alert.success(
                        'Applicatio submitted',
                        'Form submitted successfully wait for approval.',
                    );
                }

                setSubmitting(false);
            },
            onError: (error: ApiError) => {
                alert.error('Application failed', error?.message || 'Something went wrong');
                shakeCard();
                setSubmitting(false);
            },
        });
    };

    const renderStep = () => {
        switch (stepIndex) {
            case 0:
                return (
                    <StepPersonalInfo
                        data={form}
                        onChange={updateForm}
                        confirmPassword={confirmPassword}
                        onConfirmPasswordChange={setConfirmPassword}
                        errors={errors}
                    />
                );
            case 1:
                return <StepAddressDetails data={form} onChange={updateForm} errors={errors} />;
            case 2:
                return (
                    <StepProfessionalBackground data={form} onChange={updateForm} errors={errors} />
                );
            case 3:
                return <StepVenueNetwork data={form} onChange={updateForm} errors={errors} />;
            case 4:
                return <StepBankDetails data={form} onChange={updateForm} errors={errors} />;
            case 5:
                return (
                    <StepDocumentsDeclaration data={form} onChange={updateForm} errors={errors} />
                );
            default:
                return null;
        }
    };

    const isLastStep = stepIndex === STEP_LABELS.length - 1;

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                ref={scrollRef}
                style={styles.container}
                contentContainerStyle={[
                    styles.scrollContent,
                    // Reserve room at the bottom so content never renders
                    // underneath the sticky footer.
                    { paddingBottom: 32 + insets.bottom },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.arcTop} />

                {/* Top nav */}
                <Animated.View style={[styles.topBar, { opacity: fadeAnim }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={handleBackPress}>
                        <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
                    </TouchableOpacity>
                    <Text style={styles.topBarTitle}>Ambassador Registration</Text>
                    <View style={{ width: 44 }} />
                </Animated.View>

                {/* Step indicator */}
                <Animated.View style={[styles.stepIndicatorWrap, { opacity: fadeAnim }]}>
                    <StepIndicator steps={STEP_LABELS} currentIndex={stepIndex} />
                </Animated.View>

                {/* Heading */}
                <Animated.View style={[styles.heading, { opacity: fadeAnim }]}>
                    <Text style={styles.stepCounter}>
                        STEP {stepIndex + 1} OF {STEP_LABELS.length}
                    </Text>
                    <Text style={styles.headingTitle}>{STEP_LABELS[stepIndex]}</Text>
                    <Text style={styles.headingSubtitle}>{STEP_SUBTITLES[stepIndex]}</Text>
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
                    {renderStep()}

                    {!!submitError && (
                        <View style={styles.submitErrorBox}>
                            <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                            <Text style={styles.submitErrorText}>{submitError}</Text>
                        </View>
                    )}

                    <View style={styles.footer}>
                        {stepIndex > 0 && (
                            <TouchableOpacity
                                style={styles.backFooterBtn}
                                onPress={goBack}
                                disabled={submitting}
                            >
                                <Ionicons
                                    name="chevron-back"
                                    size={18}
                                    color={Colors.charcoalMid}
                                />
                                <Text style={styles.backFooterBtnText}>Back</Text>
                            </TouchableOpacity>
                        )}
                        <Animated.View
                            style={[styles.nextBtnWrap, { transform: [{ scale: btnScale }] }]}
                        >
                            <TouchableOpacity
                                style={[styles.nextBtn, submitting && styles.nextBtnDisabled]}
                                onPress={goNext}
                                disabled={submitting}
                                activeOpacity={0.85}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color={Colors.white} />
                                ) : (
                                    <>
                                        <Text style={styles.nextBtnText}>
                                            {isLastStep ? 'Submit' : 'Next'}
                                        </Text>
                                        <Ionicons
                                            name={isLastStep ? 'checkmark' : 'chevron-forward'}
                                            size={18}
                                            color={Colors.white}
                                        />
                                    </>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.background },
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { flexGrow: 1, alignItems: 'center' },

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

    stepIndicatorWrap: {
        width: SCREEN_WIDTH - 32,
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
    },

    heading: { width: SCREEN_WIDTH - 32, marginBottom: Spacing.lg },
    stepCounter: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: 1.6,
        marginBottom: 6,
    },
    headingTitle: {
        fontSize: 26,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.6,
        lineHeight: 32,
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

    submitErrorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.dangerLight,
        borderRadius: Radii.md,
        padding: Spacing.md,
        marginTop: Spacing.md,
    },
    submitErrorText: {
        flex: 1,
        fontSize: 12.5,
        color: Colors.danger,
        fontWeight: Typography.medium,
    },

    footer: {
        flexDirection: 'row',
        gap: Spacing.md,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    backFooterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        height: 56,
        paddingHorizontal: Spacing.lg,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        justifyContent: 'center',
    },
    backFooterBtnText: { fontSize: 14, fontWeight: Typography.bold, color: Colors.charcoalMid },
    nextBtnWrap: { flex: 1 },
    nextBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 56,
        borderRadius: Radii.md,
        backgroundColor: Colors.charcoal,
        ...Shadows.floating,
    },
    nextBtnDisabled: { opacity: 0.7 },
    nextBtnText: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.3,
    },
});

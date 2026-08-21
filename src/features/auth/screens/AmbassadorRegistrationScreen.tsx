import { useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/theme/theme';
import StepAddressDetails from '../ambassadorSteps/StepAddressDetails';
import StepBankDetails from '../ambassadorSteps/StepBankDetails';
import StepDocumentsDeclaration from '../ambassadorSteps/StepDocumentsDeclaration';
import StepPersonalInfo from '../ambassadorSteps/StepPersonalInfo';
import StepProfessionalBackground from '../ambassadorSteps/StepProfessionalBackground';
import StepVenueNetwork from '../ambassadorSteps/StepVenueNetwork';
import StepIndicator from '../components/StepIndicator';
import { submitAmbassadorRegistration } from '../service/ambassadorApi';
import { AmbassadorRegistration } from '../types/AmbassadarRegister';
import { createEmptyAmbassadorForm } from '@/utils/defaults';
import { FieldErrors, validatePersonalInfo, validateAddressDetails, validateProfessionalBackground, validateVenueNetwork, validateBankDetails, validateDocumentsAndDeclaration } from '@/utils/validation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';
import { useAlert } from '@/context/AlertContext';

const STEP_LABELS = [
    'Personal Information',
    'Address & Working Area',
    'Professional Background',
    'Venue Network & Performance',
    'Bank Details & Referral',
    'Documents & Declaration',
];

type AmbassadorRegistrationScreenProps = NativeStackScreenProps<RootStackParamList, 'ambassadorRegister'>
export default function AmbassadorRegistrationScreen({navigation}: AmbassadorRegistrationScreenProps) {
    const alert = useAlert();
    const [stepIndex, setStepIndex] = useState(0);
    const [form, setForm] = useState<AmbassadorRegistration>(createEmptyAmbassadorForm());
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<FieldErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const scrollRef = useRef<ScrollView>(null);

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
        if (!validateCurrentStep()) return;
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

    const handleSubmit = async () => {
        setSubmitError(null);
        setSubmitting(true);
        try {
            const result = await submitAmbassadorRegistration(form);
            if (result.success) {

                alert.success('Registration submitted', 'Form submitted successfully wait for approval.');
            }
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
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
                return <StepProfessionalBackground data={form} onChange={updateForm} errors={errors} />;
            case 3:
                return <StepVenueNetwork data={form} onChange={updateForm} errors={errors} />;
            case 4:
                return <StepBankDetails data={form} onChange={updateForm} errors={errors} />;
            case 5:
                return <StepDocumentsDeclaration data={form} onChange={updateForm} errors={errors} />;
            default:
                return null;
        }
    };

    const isLastStep = stepIndex === STEP_LABELS.length - 1;

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Ambassador Registration</Text>
                <StepIndicator steps={STEP_LABELS} currentIndex={stepIndex} />
            </View>

            <ScrollView
                ref={scrollRef}
                style={styles.flex}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {renderStep()}

                {!!submitError && (
                    <View style={styles.submitErrorBox}>
                        <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                        <Text style={styles.submitErrorText}>{submitError}</Text>
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                {stepIndex > 0 && (
                    <TouchableOpacity style={styles.backBtn} onPress={goBack} disabled={submitting}>
                        <Ionicons name="chevron-back" size={18} color={Colors.charcoalMid} />
                        <Text style={styles.backBtnText}>Back</Text>
                    </TouchableOpacity>
                )}
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
                            <Text style={styles.nextBtnText}>{isLastStep ? 'Submit' : 'Next'}</Text>
                            <Ionicons
                                name={isLastStep ? 'checkmark' : 'chevron-forward'}
                                size={18}
                                color={Colors.white}
                            />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.background },
    header: {
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        ...Shadows.header,
    },
    headerTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        marginBottom: Spacing.md,
        letterSpacing: Typography.tight,
    },
    scrollContent: {
        padding: Spacing.xl,
        paddingBottom: Spacing.xxl,
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
    submitErrorText: { flex: 1, fontSize: 12.5, color: Colors.danger, fontWeight: Typography.medium },
    footer: {
        flexDirection: 'row',
        gap: Spacing.md,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        height: 50,
        paddingHorizontal: Spacing.lg,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        justifyContent: 'center',
    },
    backBtnText: { fontSize: 14, fontWeight: Typography.bold, color: Colors.charcoalMid },
    nextBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 50,
        borderRadius: Radii.md,
        backgroundColor: Colors.primary,
        ...Shadows.primary,
    },
    nextBtnDisabled: { opacity: 0.7 },
    nextBtnText: { fontSize: 15, fontWeight: Typography.bold, color: Colors.white },
});

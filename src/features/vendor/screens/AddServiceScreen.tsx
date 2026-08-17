import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radii, Shadows, Typography } from '@/theme/theme';
import { VendorService } from '@/features/otherService/types/VendorService';
import Step1Contact from '../components/Step1Contact';
import Step2Business from '../components/Step2Business';
import Step3Address from '../components/Step3Address';
import Step4Pricing from '../components/Step4Pricing';
import Step5Portfolio from '../components/Step5Portfolio';
import Step6Documents from '../components/Step6Documents';
import Step7Bank from '../components/Step7Bank';
import Step8Availability from '../components/Step8Availability';
import { useCreateVendorService } from '../hooks/useVendorService';
import { useAlert } from '@/context/AlertContext';
import { ApiError } from '@/types/ApiError';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY = Colors.primary;
const SUCCESS = '#22C55E';

// ─── Step Config ──────────────────────────────────────────────────────────────

type StepMeta = {
    key: string;
    label: string;
    icon: string;
    description: string;
};

const STEPS: StepMeta[] = [
    {
        key: 'contact',
        label: 'Contact',
        icon: 'person-outline',
        description: 'Your contact details',
    },
    {
        key: 'business',
        label: 'Business',
        icon: 'briefcase-outline',
        description: 'Business & service info',
    },
    {
        key: 'address',
        label: 'Address',
        icon: 'location-outline',
        description: 'Location & online presence',
    },
    { key: 'pricing', label: 'Pricing', icon: 'cash-outline', description: 'Packages & pricing' },
    {
        key: 'portfolio',
        label: 'Portfolio',
        icon: 'images-outline',
        description: 'Photos & work samples',
    },
    {
        key: 'documents',
        label: 'Documents',
        icon: 'document-text-outline',
        description: 'KYC & business docs',
    },
    { key: 'bank', label: 'Bank', icon: 'card-outline', description: 'Payout bank details' },
    {
        key: 'availability',
        label: 'Availability',
        icon: 'calendar-outline',
        description: 'Working hours & holidays',
    },
];

// ─── Validation ───────────────────────────────────────────────────────────────

type ValidationResult = { valid: boolean; errors: string[] };

function validateStep(step: number, data: Partial<VendorService>): ValidationResult {
    const errors: string[] = [];
    const contact = (data.contactInfo as Record<string, any>) || {};

    switch (step) {
        case 0: // Contact
            if (!contact.fullName?.trim()) errors.push('Full name is required');
            if (!contact.primaryMobile?.trim()) errors.push('Primary mobile is required');
            else if (contact.primaryMobile.length !== 10) errors.push('Mobile must be 10 digits');
            if (!contact.role) errors.push('Please select your role');
            break;

        case 1: // Business
            if (!data.title?.trim()) errors.push('Service title is required');
            if (!data.companyName?.trim()) errors.push('Company name is required');
            if (!data.category) errors.push('Please select a category');
            if (!data.experienceYears && data.experienceYears !== 0)
                errors.push('Years of experience is required');
            if (!data.description?.trim()) errors.push('Service description is required');
            else if (data.description.trim().length < 50)
                errors.push('Description must be at least 50 characters');
            break;

        case 2: // Address
            if (!data.officeAddress?.trim()) errors.push('Office address is required');
            if (!data.state) errors.push('Please select a state');
            if (!data.city) errors.push('Please select a city');
            if (!data.pincode?.trim()) errors.push('Pincode is required');
            else if (data.pincode.length !== 6) errors.push('Pincode must be 6 digits');
            break;

        case 3: // Pricing — optional step, just warn if nothing set
            break;

        case 4: // Portfolio — optional
            break;

        case 5: // Documents — optional
            break;

        case 6: // Bank
            const bank = (data.bankDetails as Record<string, any>) || {};
            if (!bank.accountHolderName?.trim()) errors.push('Account holder name is required');
            if (!bank.accountNumber?.trim()) errors.push('Account number is required');
            if (!bank.ifsc?.trim()) errors.push('IFSC code is required');
            else if (bank.ifsc.length !== 11) errors.push('IFSC must be 11 characters');
            if (!bank.bankName?.trim()) errors.push('Bank name is required');
            if (!bank.accountType) errors.push('Please select account type');
            if (!bank.proof) errors.push('Bank proof document is required');
            break;

        case 7: // Availability — optional
            break;
    }

    return { valid: errors.length === 0, errors };
}

// ─── Initial Data ─────────────────────────────────────────────────────────────

const INITIAL_DATA: VendorService = {
    vendor: 'vendor123',
    contactInfo: {},
    title: '',
    category: '',
    companyName: '',
    brandName: '',
    experienceYears: undefined,
    description: '',
    specialization: '',
    tags: [],
    officeAddress: '',
    state: '',
    city: '',
    area: '',
    pincode: '',
    serviceableAreas: [],
    startingPrice: undefined,
    minimumOrderPrice: undefined,
    packages: [{ sno: 1, name: '', price: undefined, unit: '', quantity: undefined }],
    featuredImage: '',
    images: [],
    videoLinks: ['', '', ''],
    previousWorkLinks: ['', '', ''],
    businessDocs: {},
    ownerDocs: {},
    bankDetails: {},
    availability: [],
    publicHoliday: { isAvailable: false },
    advanceBooking: '24h',
    termsAccepted: false,
    status: 'draft',
};

// ─── Step Progress Bar ────────────────────────────────────────────────────────

function StepProgressBar({ current, total }: { current: number; total: number }) {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(progress, {
            toValue: (current / total) * 100,
            duration: 400,
            useNativeDriver: false,
        }).start();
    }, [current]);

    return (
        <View style={ps.track}>
            <Animated.View
                style={[
                    ps.fill,
                    {
                        width: progress.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%'],
                        }),
                    },
                ]}
            />
        </View>
    );
}

const ps = StyleSheet.create({
    track: {
        height: 3,
        backgroundColor: Colors.border,
        width: '100%',
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        backgroundColor: PRIMARY,
    },
});

// ─── Step Tabs ────────────────────────────────────────────────────────────────

function StepTabs({
    current,
    steps,
    completedSteps,
    onPress,
}: {
    current: number;
    steps: StepMeta[];
    completedSteps: Set<number>;
    onPress: (idx: number) => void;
}) {
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ x: Math.max(0, (current - 2) * 90), animated: true });
    }, [current]);

    return (
        <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={ts.tabsContent}
            style={ts.tabsScroll}
        >
            {steps.map((step, idx) => {
                const isDone = completedSteps.has(idx);
                const isActive = idx === current;
                const isAccessible = idx <= current || isDone;

                return (
                    <React.Fragment key={step.key}>
                        <TouchableOpacity
                            style={[
                                ts.tab,
                                isActive && ts.tabActive,
                                isDone && !isActive && ts.tabDone,
                            ]}
                            onPress={() => isAccessible && onPress(idx)}
                            activeOpacity={isAccessible ? 0.7 : 1}
                        >
                            {isDone && !isActive ? (
                                <Ionicons name="checkmark-circle" size={13} color={SUCCESS} />
                            ) : (
                                <Ionicons
                                    name={step.icon as any}
                                    size={13}
                                    color={isActive ? '#fff' : Colors.charcoalLight}
                                />
                            )}
                            <Text
                                style={[
                                    ts.tabText,
                                    isActive && ts.tabTextActive,
                                    isDone && !isActive && ts.tabTextDone,
                                ]}
                            >
                                {step.label}
                            </Text>
                        </TouchableOpacity>
                        {idx < steps.length - 1 && (
                            <View style={[ts.connector, isDone && ts.connectorDone]} />
                        )}
                    </React.Fragment>
                );
            })}
        </ScrollView>
    );
}

const ts = StyleSheet.create({
    tabsScroll: { flexGrow: 0 },
    tabsContent: {
        paddingHorizontal: Spacing.xl,
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: Radii.full,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tabActive: {
        backgroundColor: PRIMARY,
        borderColor: PRIMARY,
    },
    tabDone: {
        backgroundColor: `${SUCCESS}15`,
        borderColor: `${SUCCESS}50`,
    },
    tabText: {
        fontSize: 11,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalLight,
    },
    tabTextActive: { color: '#fff' },
    tabTextDone: { color: SUCCESS },
    connector: {
        width: 16,
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 2,
    },
    connectorDone: { backgroundColor: `${SUCCESS}60` },
});

// ─── Validation Toast ─────────────────────────────────────────────────────────

function ValidationToast({ errors, visible }: { errors: string[]; visible: boolean }) {
    const slideY = useRef(new Animated.Value(-80)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible && errors.length > 0) {
            Animated.parallel([
                Animated.spring(slideY, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 16,
                    stiffness: 180,
                }),
                Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideY, { toValue: -80, duration: 200, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
            ]).start();
        }
    }, [visible, errors]);

    if (errors.length === 0) return null;

    return (
        <Animated.View style={[vt.container, { transform: [{ translateY: slideY }], opacity }]}>
            <View style={vt.iconWrap}>
                <Ionicons name="alert-circle" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={vt.title}>Please fix the following:</Text>
                {errors.map((e, i) => (
                    <Text key={i} style={vt.error}>
                        · {e}
                    </Text>
                ))}
            </View>
        </Animated.View>
    );
}

const vt = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: Spacing.lg,
        right: Spacing.lg,
        zIndex: 999,
        backgroundColor: '#EF4444',
        borderRadius: Radii.md,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        padding: Spacing.md,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    iconWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 3,
    },
    error: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 17,
    },
});

// ─── Step Info Banner ─────────────────────────────────────────────────────────

function StepBanner({ step }: { step: StepMeta }) {
    return (
        <View style={sb.container}>
            <View style={sb.iconWrap}>
                <Ionicons name={step.icon as any} size={16} color={PRIMARY} />
            </View>
            <View>
                <Text style={sb.label}>{step.label}</Text>
                <Text style={sb.desc}>{step.description}</Text>
            </View>
        </View>
    );
}

const sb = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: `${PRIMARY}08`,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        marginBottom: Spacing.lg,
        borderLeftWidth: 3,
        borderLeftColor: PRIMARY,
    },
    iconWrap: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: `${PRIMARY}15`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 13,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
    },
    desc: {
        fontSize: 11,
        color: Colors.charcoalLight,
        marginTop: 1,
    },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddServiceScreen({ navigation }: any) {
    const [step, setStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [showToast, setShowToast] = useState(false);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const alert = useAlert();
    const [formData, setFormData] = useState<VendorService>(INITIAL_DATA);
    const contentFade = useRef(new Animated.Value(1)).current;
    const { mutate: createService } = useCreateVendorService();

    const handleChange = useCallback((key: keyof VendorService, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    }, []);

    const animateTransition = (cb: () => void) => {
        Animated.timing(contentFade, { toValue: 0, duration: 110, useNativeDriver: true }).start(
            () => {
                cb();
                Animated.timing(contentFade, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            },
        );
    };

    const showValidationToast = (errors: string[]) => {
        setValidationErrors(errors);
        setShowToast(true);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setShowToast(false), 4000);
    };

    const handleNext = () => {
        const { valid, errors } = validateStep(step, formData);
        if (!valid) {
            showValidationToast(errors);
            return;
        }
        setShowToast(false);
        setCompletedSteps(prev => new Set([...prev, step]));
        if (step < STEPS.length - 1) {
            animateTransition(() => setStep(s => s + 1));
        }
    };

    const handleBack = () => {
        setShowToast(false);
        if (step > 0) {
            animateTransition(() => setStep(s => s - 1));
        }
    };

    const handleTabPress = (idx: number) => {
        setShowToast(false);
        animateTransition(() => setStep(idx));
    };

    const handleSubmit = () => {
        const { valid, errors } = validateStep(step, formData);
        if (!valid) {
            showValidationToast(errors);
            return;
        }

        const cleanData = JSON.parse(
            JSON.stringify(formData, (_, value) => {
                if (
                    value === undefined ||
                    value === null ||
                    value === '' ||
                    (Array.isArray(value) && value.length === 0) ||
                    (typeof value === 'object' &&
                        !Array.isArray(value) &&
                        Object.keys(value).length === 0)
                )
                    return undefined;
                return value;
            }),
        );

        createService(cleanData, {
            onSuccess: () => {
                alert.success('Success', 'Service created successfully');
                navigation.goBack();
            },
            onError: (error: ApiError) => {
                alert.error('Failed', error.message || 'Something went wrong');
            },
        });
    };

    const renderStep = () => {
        const props = { data: formData, onChange: handleChange };
        switch (step) {
            case 0:
                return <Step1Contact {...props} />;
            case 1:
                return <Step2Business {...props} />;
            case 2:
                return <Step3Address {...props} />;
            case 3:
                return <Step4Pricing {...props} />;
            case 4:
                return <Step5Portfolio {...props} />;
            case 5:
                return <Step6Documents {...props} />;
            case 6:
                return <Step7Bank {...props} />;
            case 7:
                return <Step8Availability {...props} />;
            default:
                return null;
        }
    };

    const isLastStep = step === STEPS.length - 1;
    const currentStep = STEPS[step];

    // Overall completion percentage across all steps
    const overallPct = Math.round(
        ((step + (completedSteps.has(step) ? 1 : 0)) / STEPS.length) * 100,
    );

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={s.root}>
                {/* ── Header ───────────────────────────────────────────── */}
                <View style={s.header}>
                    <View style={s.headerTop}>
                        <TouchableOpacity
                            style={s.iconBtn}
                            onPress={() => navigation?.goBack?.()}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
                        </TouchableOpacity>

                        <View style={s.headerCenter}>
                            <Text style={s.headerTitle}>Add New Service</Text>
                            <View style={s.headerSubRow}>
                                <Text style={s.headerSub}>
                                    Step {step + 1} of {STEPS.length}
                                </Text>
                                <View style={s.headerDot} />
                                <Text style={[s.headerSub, { color: PRIMARY }]}>
                                    {overallPct}% complete
                                </Text>
                            </View>
                        </View>

                        {/* Save-as-draft button */}
                        <TouchableOpacity style={s.iconBtn} activeOpacity={0.7}>
                            <Ionicons
                                name="bookmark-outline"
                                size={18}
                                color={Colors.charcoalMid}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Step tabs */}
                    <StepTabs
                        current={step}
                        steps={STEPS}
                        completedSteps={completedSteps}
                        onPress={handleTabPress}
                    />

                    {/* Progress bar */}
                    <StepProgressBar current={step + 1} total={STEPS.length} />
                </View>

                {/* ── Content ──────────────────────────────────────────── */}
                <View style={s.content}>
                    {/* Validation toast — floats above card */}
                    <ValidationToast errors={validationErrors} visible={showToast} />

                    {/* Form card */}
                    <View style={[s.card, { flex: 1 }]}>
                        <Animated.View style={{ flex: 1, opacity: contentFade }}>
                            {/* Step banner */}
                            <StepBanner step={currentStep} />

                            {renderStep()}
                        </Animated.View>

                        {/* ── Footer nav ───────────────────────────────── */}
                        <View style={s.footer}>
                            {/* Back */}
                            <TouchableOpacity
                                style={[s.backBtn, step === 0 && s.backBtnDisabled]}
                                onPress={handleBack}
                                disabled={step === 0}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="chevron-back"
                                    size={16}
                                    color={step === 0 ? Colors.border : Colors.charcoal}
                                />
                                <Text style={[s.backBtnText, step === 0 && s.disabledText]}>
                                    Back
                                </Text>
                            </TouchableOpacity>

                            {/* Step dots */}
                            <View style={s.dotsRow}>
                                {STEPS.map((_, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            s.dot,
                                            i === step && s.dotActive,
                                            completedSteps.has(i) && s.dotDone,
                                        ]}
                                    />
                                ))}
                            </View>

                            {/* Next / Submit */}
                            {isLastStep ? (
                                <TouchableOpacity
                                    style={s.submitBtn}
                                    onPress={handleSubmit}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons
                                        name="checkmark-circle-outline"
                                        size={16}
                                        color="#fff"
                                    />
                                    <Text style={s.submitBtnText}>Submit</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={s.nextBtn}
                                    onPress={handleNext}
                                    activeOpacity={0.85}
                                >
                                    <Text style={s.nextBtnText}>Next</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },

    // Header
    header: {
        backgroundColor: Colors.surface,
        paddingTop: Platform.OS === 'ios' ? 52 : 16,
        ...Shadows.header,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.sm,
        gap: Spacing.sm,
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: Radii.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    headerSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 2,
    },
    headerSub: {
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    headerDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: Colors.border,
    },

    // Content
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    },

    // Card
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        padding: Spacing.xl,
        ...Shadows.card,
        overflow: 'hidden',
    },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
        marginTop: Spacing.md,
    },

    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    backBtnDisabled: {
        borderColor: Colors.divider,
        backgroundColor: Colors.background,
    },
    backBtnText: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    disabledText: { color: Colors.border },

    // Step dots
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.border,
    },
    dotActive: {
        width: 18,
        borderRadius: 3,
        backgroundColor: PRIMARY,
    },
    dotDone: {
        backgroundColor: SUCCESS,
    },

    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: PRIMARY,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
    },
    nextBtnText: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: '#fff',
    },

    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: SUCCESS,
        shadowColor: SUCCESS,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
    },
    submitBtnText: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: '#fff',
    },
});

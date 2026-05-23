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
    ActivityIndicator,
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
import { useUpdateVendorService, useGetVendorServiceById } from '../hooks/useVendorService';
import { useAlert } from '@/context/AlertContext';
import { ApiError } from '@/types/ApiError';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';

// ─── Step Config ──────────────────────────────────────────────────────────────
type StepMeta = {
    key: string;
    label: string;
    icon: string;
};

const STEPS: StepMeta[] = [
    { key: 'contact', label: 'Contact', icon: 'person-outline' },
    { key: 'business', label: 'Business', icon: 'briefcase-outline' },
    { key: 'address', label: 'Address', icon: 'location-outline' },
    { key: 'pricing', label: 'Pricing', icon: 'cash-outline' },
    { key: 'portfolio', label: 'Portfolio', icon: 'images-outline' },
    { key: 'documents', label: 'Documents', icon: 'document-text-outline' },
    { key: 'bank', label: 'Bank', icon: 'card-outline' },
    { key: 'availability', label: 'Availability', icon: 'calendar-outline' },
];

// ─── Step Progress Bar ────────────────────────────────────────────────────────
function StepProgressBar({ current, total }: { current: number; total: number }) {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(progress, {
            toValue: (current / total) * 100,
            duration: 300,
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
        borderRadius: 2,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },
});

// ─── Step Tabs (scrollable) ───────────────────────────────────────────────────
function StepTabs({
    current,
    steps,
    onPress,
}: {
    current: number;
    steps: StepMeta[];
    onPress: (idx: number) => void;
}) {
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ x: Math.max(0, (current - 2) * 88), animated: true });
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
                const isDone = idx < current;
                const isActive = idx === current;
                return (
                    <React.Fragment key={step.key}>
                        <TouchableOpacity
                            style={[ts.tab, isActive && ts.tabActive, isDone && ts.tabDone]}
                            onPress={() => onPress(idx)} // ← Allow free navigation in edit mode
                            activeOpacity={0.7}
                        >
                            {isDone ? (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={14}
                                    color={Colors.success}
                                />
                            ) : (
                                <Ionicons
                                    name={step.icon as any}
                                    size={14}
                                    color={isActive ? Colors.surface : Colors.charcoalLight}
                                />
                            )}
                            <Text
                                style={[
                                    ts.tabText,
                                    isActive && ts.tabTextActive,
                                    isDone && ts.tabTextDone,
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
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    tabDone: {
        backgroundColor: Colors.successLight,
        borderColor: Colors.success + '50',
    },
    tabText: {
        fontSize: 11,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalLight,
    },
    tabTextActive: { color: Colors.surface },
    tabTextDone: { color: Colors.success },
    connector: {
        width: 20,
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 3,
    },
    connectorDone: { backgroundColor: Colors.success },
});
type updateScreeenProps = NativeStackScreenProps<RootStackParamList, 'updateVendorService'>
// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function UpdateServiceScreen({ navigation, route }: updateScreeenProps) {
    const { serviceId, initialData } = route?.params ?? {};

    const [step, setStep] = useState(0);
    const alert = useAlert();
    const [formData, setFormData] = useState<VendorService | null>(initialData ?? null);
    const contentFade = useRef(new Animated.Value(1)).current;

    const { mutate: updateService, isPending: isUpdating } = useUpdateVendorService();

    // Fetch the service if initialData was not provided
    const { data: fetchedService, isLoading: isFetching } = useGetVendorServiceById(serviceId);

    // Populate form once data arrives
    useEffect(() => {
        if (fetchedService && !formData) {
            setFormData(fetchedService);
        }
    }, [fetchedService]);

    const handleChange = useCallback((key: keyof VendorService, value: any) => {
        setFormData(prev => (prev ? { ...prev, [key]: value } : prev));
    }, []);

    const animateTransition = (cb: () => void) => {
        Animated.timing(contentFade, {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
        }).start(() => {
            cb();
            Animated.timing(contentFade, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        });
    };

    const handleNext = () => {
        if (step < STEPS.length - 1) {
            animateTransition(() => setStep(s => s + 1));
        }
    };

    const handleBack = () => {
        if (step > 0) {
            animateTransition(() => setStep(s => s - 1));
        }
    };

    const handleTabPress = (idx: number) => {
        animateTransition(() => setStep(idx));
    };

    const handleUpdate = () => {
        if (!formData || !serviceId) return;

        // Deep-clean: strip empty/null/undefined/empty-array/empty-object values
        const cleanData = JSON.parse(
            JSON.stringify(formData, (_key, value) => {
                if (
                    value === undefined ||
                    value === null ||
                    value === '' ||
                    (Array.isArray(value) && value.length === 0) ||
                    (typeof value === 'object' &&
                        !Array.isArray(value) &&
                        Object.keys(value).length === 0)
                ) {
                    return undefined;
                }
                return value;
            }),
        );

        console.log('Update service payload:', cleanData);

        updateService(cleanData,
            {
                onSuccess: () => {
                    alert.success('Updated', 'Service updated successfully');
                    navigation.goBack();
                },
                onError: (error: ApiError) => {
                    alert.error('Failed', error.message || 'Something went wrong');
                },
            },
        );
    };

    const renderStep = () => {
        if (!formData) return null;
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
    const isLoading = isFetching || !formData;

    // ── Loading state ──
    if (isLoading) {
        return (
            <View style={s.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={s.loadingText}>Loading service details…</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <View style={s.root}>
                {/* ── Header ── */}
                <View style={s.header}>
                    <View style={s.headerTop}>
                        <TouchableOpacity
                            style={s.backBtn}
                            onPress={() => navigation?.goBack?.()}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
                        </TouchableOpacity>

                        <View style={s.headerCenter}>
                            {/* Edit badge */}
                            <View style={s.editBadge}>
                                <Ionicons name="create-outline" size={11} color={Colors.primary} />
                                <Text style={s.editBadgeText}>Editing</Text>
                            </View>
                            <Text style={s.headerTitle}>Update Service</Text>
                            <Text style={s.headerSub}>
                                Step {step + 1} of {STEPS.length}
                            </Text>
                        </View>

                        <TouchableOpacity style={s.notifBtn} activeOpacity={0.7}>
                            <Ionicons
                                name="notifications-outline"
                                size={20}
                                color={Colors.charcoalMid}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Step tabs — free navigation in edit mode */}
                    <StepTabs current={step} steps={STEPS} onPress={handleTabPress} />

                    {/* Progress bar */}
                    <View style={s.progressWrap}>
                        <StepProgressBar current={step + 1} total={STEPS.length} />
                    </View>
                </View>

                {/* ── Content ── */}
                <View style={s.content}>
                    <View style={s.breadcrumb}>
                        <TouchableOpacity
                            style={s.breadcrumbBtn}
                            onPress={() => navigation?.goBack?.()}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="arrow-back-outline"
                                size={14}
                                color={Colors.charcoalMid}
                            />
                            <Text style={s.breadcrumbText}>Back to Services</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Form card */}
                    <View style={[s.card, { flex: 1 }]}>
                        <Animated.View style={{ flex: 1, opacity: contentFade }}>
                            {renderStep()}
                        </Animated.View>

                        {/* ── Footer ── */}
                        <View style={s.footer}>
                            {/* Back */}
                            <TouchableOpacity
                                style={[s.backFooterBtn, step === 0 && s.btnDisabled]}
                                onPress={handleBack}
                                disabled={step === 0}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="chevron-back"
                                    size={16}
                                    color={step === 0 ? Colors.border : Colors.charcoal}
                                />
                                <Text style={[s.backFooterText, step === 0 && s.btnTextDisabled]}>
                                    Back
                                </Text>
                            </TouchableOpacity>

                            <Text style={s.stepCounter}>
                                {step + 1} / {STEPS.length}
                            </Text>

                            {/* Save Changes (visible on every step in edit mode) */}
                            {isLastStep ? (
                                <TouchableOpacity
                                    style={[s.saveBtn, isUpdating && s.btnLoading]}
                                    onPress={handleUpdate}
                                    disabled={isUpdating}
                                    activeOpacity={0.85}
                                >
                                    {isUpdating ? (
                                        <ActivityIndicator size="small" color={Colors.surface} />
                                    ) : (
                                        <Ionicons
                                            name="checkmark-circle-outline"
                                            size={16}
                                            color={Colors.surface}
                                        />
                                    )}
                                    <Text style={s.saveBtnText}>
                                        {isUpdating ? 'Saving…' : 'Save Changes'}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={s.footerRight}>
                                    {/* Quick-save on any step */}
                                    <TouchableOpacity
                                        style={[s.quickSaveBtn, isUpdating && s.btnLoading]}
                                        onPress={handleUpdate}
                                        disabled={isUpdating}
                                        activeOpacity={0.8}
                                    >
                                        {isUpdating ? (
                                            <ActivityIndicator
                                                size="small"
                                                color={Colors.primary}
                                            />
                                        ) : (
                                            <Ionicons
                                                name="save-outline"
                                                size={15}
                                                color={Colors.primary}
                                            />
                                        )}
                                        <Text style={s.quickSaveText}>Save</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={s.nextBtn}
                                        onPress={handleNext}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={s.nextBtnText}>Next</Text>
                                        <Ionicons
                                            name="chevron-forward"
                                            size={16}
                                            color={Colors.surface}
                                        />
                                    </TouchableOpacity>
                                </View>
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

    // Loading
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        gap: Spacing.md,
    },
    loadingText: {
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },

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
    },
    backBtn: {
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
    editBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: Colors.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: Radii.full,
        marginBottom: 2,
    },
    editBadgeText: {
        fontSize: 10,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    headerSub: {
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        marginTop: 1,
    },
    notifBtn: {
        width: 36,
        height: 36,
        borderRadius: Radii.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    progressWrap: { paddingHorizontal: 0 },

    // Content
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    },
    breadcrumb: { marginBottom: Spacing.sm },
    breadcrumbBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
    },
    breadcrumbText: {
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
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
    backFooterBtn: {
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
    backFooterText: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    btnDisabled: { borderColor: Colors.divider, backgroundColor: Colors.background },
    btnTextDisabled: { color: Colors.border },
    btnLoading: { opacity: 0.7 },
    stepCounter: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.semiBold,
    },

    // Right side of footer (next step)
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },

    // Quick-save (inline steps)
    quickSaveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.primary + '60',
        backgroundColor: Colors.primary + '10',
    },
    quickSaveText: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },

    // Next
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: Colors.primary,
        ...Shadows.primary,
    },
    nextBtnText: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.surface,
    },

    // Final save
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: Colors.success,
        shadowColor: Colors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnText: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.surface,
    },
});

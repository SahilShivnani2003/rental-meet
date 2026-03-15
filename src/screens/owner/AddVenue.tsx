import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows, TAB_BAR_HEIGHT } from '../../theme/theme';
import Step3Amenities from '../../components/registerVenue/amenities-info';
import Step1BasicInfo from '../../components/registerVenue/basic-info';
import Step6Documents from '../../components/registerVenue/documents-info';
import Step2Location from '../../components/registerVenue/location-info';
import Step4Pricing from '../../components/registerVenue/pricing-info';
import Step7Terms from '../../components/registerVenue/terms-info';
import Step5Photos from '../../components/registerVenue/photos-upload';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { OwnerTabParamList } from '../../navigations/tabNavigations/OwnerTabNavigation';

const TOTAL_STEPS = 7;

const STEP_LABELS = [
    'Basic Info',
    'Location',
    'Amenities',
    'Pricing',
    'Photos',
    'Documents',
    'Terms',
];

type registerVenueProps = NativeBottomTabScreenProps<OwnerTabParamList, 'addVenue'>;

export default function RegisterVenueScreen({ navigation }: registerVenueProps) {
    const [step, setStep] = useState(1);
    const [successModal, setSuccessModal] = useState(false);

    const goNext = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
    const goPrev = () => setStep(s => Math.max(s - 1, 1));

    const renderStep = () => {
        switch (step) {
            case 1:
                return <Step1BasicInfo onNext={goNext} />;
            case 2:
                return <Step2Location onPrev={goPrev} onNext={goNext} />;
            case 3:
                return <Step3Amenities onPrev={goPrev} onNext={goNext} />;
            case 4:
                return <Step4Pricing onPrev={goPrev} onNext={goNext} />;
            case 5:
                return <Step5Photos onPrev={goPrev} onNext={goNext} />;
            case 6:
                return <Step6Documents onPrev={goPrev} onNext={goNext} />;
            case 7:
                return <Step7Terms onPrev={goPrev} onSubmit={() => setSuccessModal(true)} />;
            default:
                return null;
        }
    };

    return (
        <KeyboardAvoidingView
            style={s.root}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* ── Header — matches app design pattern ── */}
            <View style={s.header}>
                {/* Golden accent bar */}
                <View style={s.headerAccentBar} />

                <View style={s.headerContent}>
                    <View style={s.headerLeft}>
                        <Text style={s.headerEyebrow}>VENUE REGISTRATION</Text>
                        <Text style={s.headerTitle}>{STEP_LABELS[step - 1]}</Text>
                        <Text style={s.headerSub}>
                            Step {step} of {TOTAL_STEPS} · Complete all steps to list your venue
                        </Text>
                    </View>

                    {/* Step counter pill */}
                    <View style={s.stepPill}>
                        <Text style={s.stepPillNum}>{step}</Text>
                        <Text style={s.stepPillSep}>/</Text>
                        <Text style={s.stepPillTotal}>{TOTAL_STEPS}</Text>
                    </View>
                </View>

                {/* Progress bar */}
                <View style={s.progressWrap}>
                    <View style={s.progressTrack}>
                        <View
                            style={[
                                s.progressFill,
                                { width: `${(step / TOTAL_STEPS) * 100}%` as any },
                            ]}
                        />
                    </View>
                    <Text style={s.progressPct}>{Math.round((step / TOTAL_STEPS) * 100)}%</Text>
                </View>
            </View>

            {/* ── Step indicator — inlined ── */}
            <View style={s.stepsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.stepsScroll}
                >
                    {STEP_LABELS.map((label, idx) => {
                        const n = idx + 1;
                        const completed = n < step;
                        const active = n === step;
                        const showLabel = active || completed;
                        return (
                            <View key={idx} style={s.stepRow}>
                                {idx > 0 && (
                                    <View
                                        style={[
                                            s.stepConnector,
                                            completed ? s.connectorDone : s.connectorIdle,
                                        ]}
                                    />
                                )}
                                <View
                                    style={[
                                        s.stepChip,
                                        active && s.stepChipActive,
                                        completed && s.stepChipDone,
                                    ]}
                                >
                                    <View
                                        style={[
                                            s.stepNum,
                                            active && s.stepNumActive,
                                            completed && s.stepNumDone,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                s.stepNumText,
                                                active && s.stepNumTextActive,
                                                completed && s.stepNumTextDone,
                                            ]}
                                        >
                                            {n}
                                        </Text>
                                    </View>
                                    {showLabel && (
                                        <Text
                                            style={[
                                                s.stepLabel,
                                                active && s.stepLabelActive,
                                                completed && s.stepLabelDone,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {label}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ── Step content ── */}
            <View style={s.content}>{renderStep()}</View>

            {/* ── Success modal ── */}
            <Modal visible={successModal} transparent animationType="fade">
                <View style={s.overlay}>
                    <View style={s.modalCard}>
                        {/* Icon */}
                        <View style={s.successRing}>
                            <View style={s.successIcon}>
                                <Ionicons name="checkmark" size={34} color={Colors.white} />
                            </View>
                        </View>

                        <Text style={s.modalTitle}>Venue Submitted!</Text>
                        <Text style={s.modalSub}>
                            Your venue has been submitted for review. We'll notify you within 24–48
                            hours once approved.
                        </Text>

                        {/* Divider */}
                        <View style={s.modalDivider} />

                        <View style={s.modalInfoRow}>
                            <Ionicons name="time-outline" size={14} color={Colors.charcoalLight} />
                            <Text style={s.modalInfoText}>Review takes 24–48 hours</Text>
                        </View>
                        <View style={s.modalInfoRow}>
                            <Ionicons
                                name="notifications-outline"
                                size={14}
                                color={Colors.charcoalLight}
                            />
                            <Text style={s.modalInfoText}>You'll get notified on approval</Text>
                        </View>

                        <TouchableOpacity
                            style={s.modalBtn}
                            onPress={() => {
                                setSuccessModal(false);
                                navigation.goBack();
                            }}
                            activeOpacity={0.85}
                        >
                            <Text style={s.modalBtnText}>Back to Dashboard</Text>
                            <Ionicons name="arrow-forward" size={15} color={Colors.charcoal} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },

    // ── Header ──
    header: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        paddingBottom: Spacing.lg,
        ...Shadows.header,
    },
    headerAccentBar: {
        height: 4,
        backgroundColor: Colors.primary,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingTop: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg,
        marginBottom: Spacing.lg,
    },
    headerLeft: { flex: 1, marginRight: Spacing.md },
    headerEyebrow: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: Typography.wider,
        marginBottom: Spacing.xxs,
    },
    headerTitle: {
        fontSize: Typography.xxl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
        marginBottom: Spacing.xxs,
    },
    headerSub: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },

    // Step counter pill
    stepPill: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 1,
        backgroundColor: Colors.primaryLight,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Radii.full,
        marginTop: 4,
    },
    stepPillNum: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
        letterSpacing: -0.5,
    },
    stepPillSep: {
        fontSize: 11,
        color: Colors.primaryBorder,
        fontWeight: Typography.medium,
        marginHorizontal: 1,
    },
    stepPillTotal: {
        fontSize: 11,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalLight,
    },

    // Progress bar
    progressWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.xl,
    },
    progressTrack: {
        flex: 1,
        height: 5,
        backgroundColor: Colors.border,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 3,
    },
    progressPct: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.primaryDark,
        minWidth: 30,
        textAlign: 'right',
    },

    // ── Step indicator (inlined) ──
    stepsWrapper: {
        marginTop:10,
        backgroundColor: Colors.background,
        paddingVertical: Spacing.md,
        borderBottomColor: Colors.border,
    },
    stepsScroll: {
        paddingHorizontal: Spacing.lg,
        alignItems: 'center',
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepConnector: {
        width: 10,
        height: 1.5,
        borderRadius: 1,
    },
    connectorDone: { backgroundColor: Colors.success },
    connectorIdle: { backgroundColor: Colors.border },
    stepChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 5,
        paddingLeft: 5,
        paddingRight: 5,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    stepChipActive: {
        paddingRight: 12,
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
    },
    stepChipDone: {
        paddingRight: 10,
        borderColor: Colors.successLight,
        backgroundColor: Colors.successLight,
    },
    stepNum: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    stepNumActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    stepNumDone: {
        backgroundColor: Colors.success,
        borderColor: Colors.success,
    },
    stepNumText: {
        fontSize: 11,
        fontWeight: Typography.extraBold,
        color: Colors.charcoalLight,
        lineHeight: 13,
    },
    stepNumTextActive: { color: Colors.charcoal },
    stepNumTextDone: { color: Colors.white },
    stepLabel: {
        fontSize: 12,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
    },
    stepLabelActive: { color: Colors.primaryDark },
    stepLabelDone: { color: Colors.success, fontWeight: Typography.semiBold },

    // ── Step content ──
    content: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingBottom: TAB_BAR_HEIGHT,
    },

    // ── Success modal ──
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    modalCard: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: Radii.xxl,
        padding: Spacing.xxl,
        alignItems: 'center',
        ...Shadows.floating,
    },
    successRing: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: Colors.successLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    successIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        marginBottom: Spacing.sm,
    },
    modalSub: {
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: Spacing.sm,
    },
    modalDivider: {
        width: '100%',
        height: 1,
        backgroundColor: Colors.divider,
        marginVertical: Spacing.lg,
    },
    modalInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
        marginBottom: Spacing.sm,
    },
    modalInfoText: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    modalBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.md,
        marginTop: Spacing.lg,
        width: '100%',
        ...Shadows.primary,
    },
    modalBtnText: {
        fontSize: Typography.md,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: 0.2,
    },
});

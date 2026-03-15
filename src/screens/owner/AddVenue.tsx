import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows, TAB_BAR_HEIGHT } from '../../theme/theme';
import Step3Amenities from '../../components/registerVenue/amenities-info';
import Step1BasicInfo from '../../components/registerVenue/basic-info';
import Step6Documents from '../../components/registerVenue/documents-info';
import Step2Location from '../../components/registerVenue/location-info';
import Step4Pricing from '../../components/registerVenue/pricing-info';
import StepIndicator from '../../components/registerVenue/step-indicator';
import Step7Terms from '../../components/registerVenue/terms-info';
import Step5Photos from '../../components/registerVenue/photos-upload';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { OwnerTabParamList } from '../../navigations/tabNavigations/OwnerTabNavigation';

// Tab screen — navigated from the owner tab bar
type registerVenueProps = NativeBottomTabScreenProps<OwnerTabParamList, 'addVenue'>;

export default function RegisterVenueScreen({ navigation }: registerVenueProps) {
    const [step, setStep] = useState(1);
    const [successModal, setSuccessModal] = useState(false);

    const TOTAL_STEPS = 7;

    const goNext = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
    const goPrev = () => setStep(s => Math.max(s - 1, 1));

    const handleClose = () => navigation.goBack();

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
        // FIX: KeyboardAvoidingView wraps everything so inputs are never hidden by keyboard
        <KeyboardAvoidingView
            style={s.root}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            {/* ── Top bar ── */}
            <View style={s.topBar}>
                <TouchableOpacity style={s.closeBtn} onPress={handleClose} activeOpacity={0.8}>
                    <Ionicons name="close" size={20} color={Colors.charcoalMid} />
                </TouchableOpacity>
                <View style={s.titleWrap}>
                    <Text style={s.pageTitle}>
                        Register Your <Text style={{ color: Colors.primary }}>Venue</Text>
                    </Text>
                    <Text style={s.pageSub}>
                        Complete all steps to list your venue on RentalMeet
                    </Text>
                </View>
                {/* Step counter */}
                <View style={s.stepCounter}>
                    <Text style={s.stepCounterText}>{step}</Text>
                    <Text style={s.stepCounterSep}>/</Text>
                    <Text style={s.stepCounterTotal}>{TOTAL_STEPS}</Text>
                </View>
            </View>

            {/* ── Step indicator ── */}
            <StepIndicator currentStep={step} />

            {/* ── Step content ── */}
            <View style={s.content}>{renderStep()}</View>

            {/* ── Success modal ── */}
            <Modal visible={successModal} transparent animationType="fade">
                <View style={s.overlay}>
                    <View style={s.modalCard}>
                        <View style={s.successIconWrap}>
                            <Ionicons name="checkmark" size={36} color={Colors.white} />
                        </View>
                        <Text style={s.modalTitle}>Venue Submitted!</Text>
                        <Text style={s.modalSub}>
                            Your venue has been submitted for review. We'll notify you within 24–48
                            hours once approved.
                        </Text>
                        <TouchableOpacity
                            style={s.modalBtn}
                            onPress={() => {
                                setSuccessModal(false);
                                handleClose();
                            }}
                            activeOpacity={0.85}
                        >
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={16}
                                color={Colors.charcoal}
                            />
                            <Text style={s.modalBtnText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    // FIX: root is the KeyboardAvoidingView itself — flex: 1 + background
    root: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    // ── Top bar ──
    // FIX: added paddingTop for iOS status bar safe area
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 54 : Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap: Spacing.md,
        ...Shadows.header,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    titleWrap: { flex: 1 },
    pageTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
    },
    pageSub: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        marginTop: 2,
    },

    // Step counter badge (e.g. "3 / 7")
    stepCounter: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 1,
        backgroundColor: Colors.primaryLight,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radii.full,
    },
    stepCounterText: {
        fontSize: 14,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
    },
    stepCounterSep: {
        fontSize: 11,
        color: Colors.primaryBorder,
        fontWeight: Typography.medium,
    },
    stepCounterTotal: {
        fontSize: 11,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalLight,
    },

    // ── Step content ──
    content: {
        flex: 1,
        backgroundColor: Colors.background,
        // Push step content up so fixed bottom buttons clear the tab bar
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
    successIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
        // Soft glow ring
        borderWidth: 6,
        borderColor: Colors.successLight,
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
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.sm,
    },
    modalBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.md,
        ...Shadows.primary,
    },
    modalBtnText: {
        fontSize: Typography.md,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme/theme';
import Step3Amenities from '../../components/registerVenue/amenities-info';
import Step1BasicInfo from '../../components/registerVenue/basic-info';
import Step6Documents from '../../components/registerVenue/documents-info';
import Step2Location from '../../components/registerVenue/location-info';
import Step4Pricing from '../../components/registerVenue/pricing-info';
import StepIndicator from '../../components/registerVenue/step-indicator';
import Step7Terms from '../../components/registerVenue/terms-info';
import Step5Photos from '../../components/registerVenue/photos-upload';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigations/RootNavigation';

type registerVenueProps = NativeStackScreenProps<RootStackParamList, 'registerVenue'>;

export default function RegisterVenueScreen({ navigation }: registerVenueProps) {
    const [step, setStep] = useState(1);
    const [successModal, setSuccessModal] = useState(false);

    const goNext = () => setStep(s => Math.min(s + 1, 7));
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

    const handleClose = () => {
        navigation.goBack();
    };
    return (
        <View style={s.root}>
            {/* Top bar */}
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
            </View>

            <StepIndicator currentStep={step} />

            <View style={s.content}>{renderStep()}</View>

            {/* Success modal */}
            <Modal visible={successModal} transparent animationType="fade">
                <View style={s.overlay}>
                    <View style={s.modalCard}>
                        <View style={s.successIcon}>
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
                            <Text style={s.modalBtnText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
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
    },
    titleWrap: { flex: 1 },
    pageTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
    },
    pageSub: { fontSize: Typography.sm, color: Colors.charcoalLight, marginTop: 1 },
    content: { flex: 1, backgroundColor: Colors.background },
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
    successIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    modalTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        marginBottom: Spacing.sm,
    },
    modalSub: {
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: Spacing.xl,
    },
    modalBtn: {
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

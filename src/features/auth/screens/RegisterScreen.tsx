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
    Modal,
    Image,
    Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Field from '@/components/UI/InputField';
import LoadingDots from '@/components/UI/loading-dots';
import PasswordStrength from '@/components/UI/password-strength-bar';
import { useAlert } from '@/context/AlertContext';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors, Typography, Spacing, Radii, Shadows } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import { ROLE_META } from '../data/RoleMetaData';
import { useRegister } from '../hooks/useRegister';
import { ApiError } from '@/types/ApiError';
import {
    useSendEmailOtp,
    useSendPhoneOtp,
    useVerifyEmailOtp,
    useVerifyPhoneOtp,
} from '../hooks/useVerfication';
import { useUploadKycDoc } from '@/features/profile/hooks/useUploadkycDoc';
import { useUploadImage } from '@/features/profile/hooks/useUploadImage';
import {
    Asset,
    launchCamera,
    launchImageLibrary,
    ImagePickerResponse,
} from 'react-native-image-picker';
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile';
import { KycDocCard } from '../components/KycDocCard';
import { getCitiesByState, getStates, City, State } from '@/utils/location';
import SearchableDropdown, { DropdownOption } from '@/components/UI/SearchableDropDown';
import { User } from '@/features/profile/types/User';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── OTP step type ─────────────────────────────────────────────────────────────
type OtpStep = 'none' | 'email' | 'phone';

// ── KYC types (step 2, customer only) ─────────────────────────────────────────
type IdProofType = 'Aadhaar' | 'PAN' | 'Passport' | 'Voter ID' | 'Driving License';
const ID_PROOF_TYPES: IdProofType[] = ['Aadhaar', 'PAN', 'Passport', 'Voter ID', 'Driving License'];
type KycSlot = 'front' | 'back' | 'selfie' | 'addressProof';
export interface PickedFile {
    uri: string;
    name: string;
    type: string;
}

type registerProps = NativeStackScreenProps<RootStackParamList, 'register'>;

export default function RegisterScreen({ navigation, route }: registerProps) {
    const role = route.params?.role ?? 'customer';
    const meta = ROLE_META[role] ?? ROLE_META['client'];
    const isCustomer = role === 'customer';
    const alert = useAlert();
    const { setUser } = useAuthStore();
    const { mutate: register } = useRegister();
    const { mutate: sendEmailOtp, isPending: sendingEmailOtp } = useSendEmailOtp();
    const { mutate: sendPhoneOtp, isPending: sendingPhoneOtp } = useSendPhoneOtp();
    const { mutate: verifyEmailOtp, isPending: verifyingEmailOtp } = useVerifyEmailOtp();
    const { mutate: verifyPhoneOtp, isPending: verifyingPhoneOtp } = useVerifyPhoneOtp();

    // ── Step control — only customers get a 2-step flow ─────────────────────────
    const [step, setStep] = useState<1 | 2>(1);

    // ── Common fields ─────────────────────────────────────────────────────────
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [referralCode, setReferralCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ── Verification state ────────────────────────────────────────────────────
    const [emailVerified, setEmailVerified] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    // ── OTP modal state ───────────────────────────────────────────────────────
    const [otpStep, setOtpStep] = useState<OtpStep>('none');
    const [otpValue, setOtpValue] = useState('');
    const [otpError, setOtpError] = useState('');

    // ── Customer / Vendor location fields ─────────────────────────────────────
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    // Google place_ids for the selected city/state, in case the payload or a
    // later step wants them (not required for buildRegisterData currently).
    const [cityPlaceId, setCityPlaceId] = useState<string | null>(null);
    const [statePlaceId, setStatePlaceId] = useState<string | null>(null);

    // ── KYC state (step 2, customer only) ────────────────────────────────────
    const [kycIdProofType, setKycIdProofType] = useState<IdProofType>('Aadhaar');
    const [kycFront, setKycFront] = useState<PickedFile | null>(null);
    const [kycBack, setKycBack] = useState<PickedFile | null>(null);
    const [kycSelfie, setKycSelfie] = useState<PickedFile | null>(null);
    const [kycAddressProof, setKycAddressProof] = useState<PickedFile | null>(null);
    const [kycErrors, setKycErrors] = useState<Record<string, string>>({});
    const [kycLoading, setKycLoading] = useState(false);

    //For Step 2 for customer only
    const { mutate: uploadKycDoc } = useUploadKycDoc();
    const { mutate: uploadProfilePhoto } = useUploadImage();
    const { mutate: updateUser } = useUpdateProfile();

    // ── Animations ────────────────────────────────────────────────────────────
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(28)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const btnScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        StatusBar.setBarStyle('dark-content');
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

    const shakeCard = () =>
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 9, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 7, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -7, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
        ]).start();

    const clearError = (key: string) => setErrors(prev => ({ ...prev, [key]: '' }));

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = () => {
        const e: Record<string, string> = {};

        if (!fullName.trim()) e.fullName = 'Full name is required';

        if (!email.trim()) {
            e.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            e.email = 'Enter a valid email';
        } else if (!emailVerified) {
            // FIX: enforce email OTP verification before submission
            e.email = 'Please verify your email first';
        }

        if (!phone.trim()) {
            e.phone = 'Phone number is required';
        } else if (phone.replace(/\D/g, '').length < 10) {
            e.phone = 'Enter a valid 10-digit number';
        } else if (!phoneVerified) {
            // FIX: enforce phone OTP verification before submission
            e.phone = 'Please verify your phone number first';
        }

        // FIX: password min-length consistent with hint UI (8, not 6)
        if (!password) {
            e.password = 'Password is required';
        } else if (password.length < 8) {
            e.password = 'Must be at least 8 characters';
        }

        if (!confirmPassword) {
            e.confirmPassword = 'Please confirm your password';
        } else if (confirmPassword !== password) {
            e.confirmPassword = 'Passwords do not match';
        }

        if (role === 'customer' || role === 'vendor') {
            if (!state.trim()) e.state = 'State is required';
            if (!city.trim()) e.city = 'City is required';
        }

        if (!agreed) e.agreed = 'Please accept the terms to continue';

        return e;
    };

    // ── OTP: Send email ───────────────────────────────────────────────────────
    const handleSendEmailOtp = () => {
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            setErrors(prev => ({ ...prev, email: 'Enter a valid email first' }));
            return;
        }
        setOtpValue('');
        setOtpError('');
        sendEmailOtp(
            { email, name: fullName },
            {
                onSuccess: () => {
                    alert.success('OTP Sent', 'An OTP has been sent to your email');
                    setOtpStep('email');
                },
                onError: (error: ApiError) => {
                    alert.error('OTP Error', error?.message || 'Failed to send OTP');
                },
            },
        );
    };

    // ── OTP: Verify email ─────────────────────────────────────────────────────
    const handleVerifyEmailOtp = () => {
        if (otpValue.length < 4) {
            setOtpError('Enter the complete OTP');
            return;
        }
        verifyEmailOtp(
            { email, otp: otpValue },
            {
                onSuccess: () => {
                    setEmailVerified(true);
                    setOtpStep('none');
                    clearError('email');
                    alert.success('OTP Verified', 'Email verified successfully');
                },
                onError: (error: ApiError) => {
                    setOtpError(error?.message || 'Invalid OTP. Please try again.');
                },
            },
        );
    };

    // ── OTP: Send phone ───────────────────────────────────────────────────────
    const handleSendPhoneOtp = () => {
        if (phone.replace(/\D/g, '').length < 10) {
            setErrors(prev => ({ ...prev, phone: 'Enter a valid 10-digit number first' }));
            return;
        }
        setOtpValue('');
        setOtpError('');
        sendPhoneOtp(
            { phone, name: fullName },
            {
                onSuccess: () => {
                    alert.success('OTP Sent', 'An OTP has been sent to your phone');
                    setOtpStep('phone');
                },
                onError: (error: ApiError) => {
                    alert.error('OTP Error', error?.message || 'Failed to send OTP');
                },
            },
        );
    };

    // ── OTP: Verify phone ─────────────────────────────────────────────────────
    const handleVerifyPhoneOtp = () => {
        if (otpValue.length < 4) {
            setOtpError('Enter the complete OTP');
            return;
        }
        verifyPhoneOtp(
            { phone, otp: otpValue },
            {
                onSuccess: () => {
                    setPhoneVerified(true);
                    setOtpStep('none');
                    clearError('phone');
                    alert.success('OTP Verified', 'Phone number verified successfully');
                },
                onError: (error: ApiError) => {
                    setOtpError(error?.message || 'Invalid OTP. Please try again.');
                },
            },
        );
    };

    // ── Location: State / City searchable dropdowns ───────────────────────────
    // State results — filtered by whatever the user has typed so far.
    const fetchStateOptions = async (query: string): Promise<DropdownOption[]> => {
        const results: State[] = await getStates(query);
        return results.map(r => ({ name: r.name, placeId: r.placeId }));
    };

    // City results depend on the currently selected state; guarded by
    // `disabled` on the dropdown too, but double-checked here.
    const fetchCityOptions = async (query: string): Promise<DropdownOption[]> => {
        if (!state.trim()) return [];
        const results: City[] = await getCitiesByState(query, state);
        return results.map(r => ({ name: r.name, placeId: r.placeId }));
    };

    const handleStateSelect = (option: DropdownOption) => {
        setState(option.name);
        setStatePlaceId(option.placeId);
        clearError('state');

        // Changing the state invalidates any previously picked city.
        setCity('');
        setCityPlaceId(null);
    };

    const handleCitySelect = (option: DropdownOption) => {
        setCity(option.name);
        setCityPlaceId(option.placeId);
        clearError('city');
    };

    const handleStateTextChange = (text: string) => {
        setState(text);
        setStatePlaceId(null); // typed text no longer matches a confirmed selection
        clearError('state');
    };

    const handleCityTextChange = (text: string) => {
        setCity(text);
        setCityPlaceId(null);
        clearError('city');
    };

    // ── Build the payload shared by both the single-step and 2-step flows ─────
    const buildRegisterData = () => {
        const base = {
            name: fullName,
            email,
            phone,
            password,
            referralCode: referralCode.trim() || undefined,
        };

        return role === 'customer'
            ? { ...base, role: 'customer' as const, city, state }
            : role === 'vendor'
            ? { ...base, role: 'vendor' as const, city, state }
            : { ...base, role: 'owner' as const, city, state };
    };

    // ── Submit: non-customer roles (single step, unchanged) ───────────────────
    const handleRegister = async () => {
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

        register(buildRegisterData(), {
            onSuccess: data => {
                setLoading(false);
                setUser(data?.user, data?.token);
                const user: User = data?.user;
                alert.success('Registration succeeded', `${role} registered successfully`);
                if (user.role === 'owner') {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'owner' }],
                    });
                } else if (user.role === 'vendor') {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'vendor' }],
                    });
                }
            },
            onError: (error: ApiError) => {
                setLoading(false);
                alert.error('Registration failed', error?.message || 'Something went wrong');
            },
        });
    };

    // ── Submit: customer step 1 → creates the account, then advances to step 2 ─
    const handleContinueToKyc = () => {
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

        register(buildRegisterData(), {
            onSuccess: data => {
                setLoading(false);
                setUser(data?.user, data?.token);
                setStep(2);
            },
            onError: (error: ApiError) => {
                setLoading(false);
                alert.error('Registration failed', error?.message || 'Something went wrong');
            },
        });
    };

    // ── OTP Modal ─────────────────────────────────────────────────────────────
    const isOtpModalVisible = otpStep !== 'none';
    const otpIsPending = otpStep === 'email' ? verifyingEmailOtp : verifyingPhoneOtp;

    const handleOtpConfirm = () => {
        if (otpStep === 'email') handleVerifyEmailOtp();
        else if (otpStep === 'phone') handleVerifyPhoneOtp();
    };

    const handleResendOtp = () => {
        if (otpStep === 'email') handleSendEmailOtp();
        else if (otpStep === 'phone') handleSendPhoneOtp();
    };

    // ── Profile photo upload (used in step 2) ──────────────────────────────────
    const pickFromCamera = async () => {
        const result = await launchCamera({
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 1080,
            maxHeight: 1080,
            saveToPhotos: true,
        });
        if (result.didCancel || !result.assets?.length) return;
        if (result.errorCode) {
            alert.error?.('Camera error', result.errorMessage ?? 'Could not open camera.');
            return;
        }
        handleUploadPhoto(result.assets[0]);
    };

    const pickFromGallery = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 1080,
            maxHeight: 1080,
            selectionLimit: 1,
        });
        if (result.didCancel || !result.assets?.length) return;
        if (result.errorCode) {
            alert.error?.('Gallery error', result.errorMessage ?? 'Could not open gallery.');
            return;
        }
        handleUploadPhoto(result.assets[0]);
    };

    const handlePhotoOptions = () => {
        alert.show({
            type: 'confirm',
            title: 'Update Profile Photo',
            message: 'Choose a source for your new profile photo.',
            buttons: [
                {
                    label: 'Take Photo',
                    onPress: () => {
                        alert.dismiss();
                        pickFromCamera();
                    },
                },
                {
                    label: 'Gallery',
                    onPress: () => {
                        alert.dismiss();
                        pickFromGallery();
                    },
                },
                { label: 'Cancel', onPress: alert.dismiss, style: 'ghost' },
            ],
        });
    };

    const handleUploadPhoto = (asset: Asset) => {
        if (!asset.uri) return;

        const formData = new FormData();
        formData.append('file', {
            uri: asset.uri,
            type: asset.type ?? 'image/jpeg',
            name: asset.fileName ?? `profile_${Date.now()}.jpg`,
        } as any);

        formData.append('folder', 'profiles');
        setUploadingPhoto(true);

        uploadProfilePhoto(formData, {
            onSuccess: (res: any) => {
                const url = res?.url ?? res?.data?.url ?? res?.image?.url;
                if (!url) {
                    alert.error?.('Upload failed', 'Could not get the uploaded image URL.');
                    return;
                }
                setProfilePicUrl(url);

                // Persist it on the profile
                updateUser({ profilePicture: url } as any, {
                    onSuccess: () => {},
                    onError: () => {
                        alert.error?.('Update failed', 'Photo uploaded but profile update failed.');
                    },
                });
            },
            onError: () => {
                alert.error?.('Upload failed', 'Could not upload your photo. Please try again.');
            },
            onSettled: () => {
                setUploadingPhoto(false);
            },
        });
    };

    // ── KYC doc upload (step 2, customer only) ─────────────────────────────────
    const getKycSetter = (slot: KycSlot) => {
        switch (slot) {
            case 'front':
                return setKycFront;
            case 'back':
                return setKycBack;
            case 'selfie':
                return setKycSelfie;
            case 'addressProof':
                return setKycAddressProof;
        }
    };

    const pickKycImage = (slot: KycSlot) => {
        const setter = getKycSetter(slot);
        launchImageLibrary(
            { mediaType: 'photo', quality: 0.8, includeBase64: false },
            (response: ImagePickerResponse) => {
                if (response.didCancel || response.errorCode) return;
                const asset = response.assets?.[0];
                if (!asset?.uri) return;
                setter({
                    uri: asset.uri,
                    name: asset.fileName ?? `${slot}_${Date.now()}.jpg`,
                    type: asset.type ?? 'image/jpeg',
                });
                setKycErrors(prev => ({ ...prev, [slot]: '' }));
            },
        );
    };

    const openKycCamera = (slot: KycSlot) => {
        const setter = getKycSetter(slot);
        launchCamera(
            { mediaType: 'photo', quality: 0.8, saveToPhotos: false },
            (response: ImagePickerResponse) => {
                if (response.didCancel || response.errorCode) return;
                const asset = response.assets?.[0];
                if (!asset?.uri) return;
                setter({
                    uri: asset.uri,
                    name: asset.fileName ?? `${slot}_${Date.now()}.jpg`,
                    type: asset.type ?? 'image/jpeg',
                });
                setKycErrors(prev => ({ ...prev, [slot]: '' }));
            },
        );
    };

    const showKycPickerOptions = (slot: KycSlot) => {
        alert.show({
            type: 'confirm',
            title: 'Choose Source',
            message: 'Select from gallery or take a new photo',
            buttons: [
                {
                    label: 'Gallery',
                    onPress: () => {
                        alert.dismiss();
                        pickKycImage(slot);
                    },
                    style: 'ghost',
                },
                {
                    label: 'Camera',
                    onPress: () => {
                        alert.dismiss();
                        openKycCamera(slot);
                    },
                },
            ],
        });
    };

    const hasAnyKycInput = !!(kycFront || kycBack || kycSelfie || kycAddressProof);

    const validateKyc = () => {
        const e: Record<string, string> = {};
        if (!kycFront) e.front = 'Front side of ID is required';
        if (kycIdProofType !== 'PAN' && !kycBack) e.back = 'Back side of ID is required';
        if (!kycSelfie) e.selfie = 'Selfie is required';
        return e;
    };

    // Final step — called whether KYC was filled in, uploaded, or skipped.
    const finishSetup = () => {
        alert.success('All set!', 'Your account has been created successfully.');
        navigation.reset({ index: 0, routes: [{ name: 'client' }] });
    };

    const handleSkipKyc = () => finishSetup();

    const handleSubmitKyc = () => {
        if (!hasAnyKycInput) {
            finishSetup();
            return;
        }

        const e = validateKyc();
        setKycErrors(e);
        if (Object.keys(e).length > 0) return;

        const formData = new FormData();
        formData.append('idProofType', kycIdProofType);

        formData.append('idProof', {
            uri: kycFront!.uri,
            name: kycFront!.name,
            type: kycFront!.type,
        } as any);

        if (kycBack) {
            formData.append('idProofBack', {
                uri: kycBack.uri,
                name: kycBack.name,
                type: kycBack.type,
            } as any);
        }

        formData.append('selfie', {
            uri: kycSelfie!.uri,
            name: kycSelfie!.name,
            type: kycSelfie!.type,
        } as any);

        if (kycAddressProof) {
            formData.append('addressProof', {
                uri: kycAddressProof.uri,
                name: kycAddressProof.name,
                type: kycAddressProof.type,
            } as any);
        }

        setKycLoading(true);
        uploadKycDoc(formData, {
            onSuccess: () => {
                setKycLoading(false);
                finishSetup();
            },
            onError: (error: ApiError) => {
                setKycLoading(false);
                alert.error('KYC Upload Failed', error?.message || 'Something went wrong.');
            },
        });
    };

    // ── Back button: step 2 goes back to step 1 instead of leaving the screen ──
    const handleBackPress = () => {
        if (isCustomer && step === 2) {
            setStep(1);
        } else {
            navigation.goBack();
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            {/* OTP Verification Modal */}
            <Modal
                visible={isOtpModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setOtpStep('none')}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Ionicons
                                name={
                                    otpStep === 'email' ? 'mail-outline' : 'phone-portrait-outline'
                                }
                                size={28}
                                color={Colors.primary}
                            />
                            <Text style={styles.modalTitle}>
                                Verify {otpStep === 'email' ? 'Email' : 'Phone'}
                            </Text>
                            <Text style={styles.modalSubtitle}>
                                Enter the OTP sent to{' '}
                                <Text
                                    style={{ fontWeight: Typography.bold, color: Colors.charcoal }}
                                >
                                    {otpStep === 'email' ? email : phone}
                                </Text>
                            </Text>
                        </View>

                        <TextInput
                            style={[styles.otpInput, !!otpError && styles.otpInputError]}
                            value={otpValue}
                            onChangeText={t => {
                                setOtpValue(t.replace(/\D/g, ''));
                                setOtpError('');
                            }}
                            keyboardType="number-pad"
                            maxLength={6}
                            placeholder="------"
                            placeholderTextColor={Colors.charcoalLight}
                            textAlign="center"
                        />
                        {!!otpError && (
                            <View style={[styles.errorRow, { marginBottom: Spacing.sm }]}>
                                <Ionicons name="alert-circle" size={12} color={Colors.danger} />
                                <Text style={styles.errorText}>{otpError}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.registerBtn, otpIsPending && { opacity: 0.7 }]}
                            onPress={handleOtpConfirm}
                            disabled={otpIsPending}
                            activeOpacity={0.9}
                        >
                            {otpIsPending ? (
                                <LoadingDots />
                            ) : (
                                <Text style={styles.registerBtnText}>Verify OTP</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.modalFooterRow}>
                            <TouchableOpacity
                                onPress={handleResendOtp}
                                disabled={sendingEmailOtp || sendingPhoneOtp}
                            >
                                <Text style={styles.resendText}>Resend OTP</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setOtpStep('none')}>
                                <Text style={[styles.resendText, { color: Colors.danger }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
                    <View style={styles.arcTop} />

                    {/* Top nav */}
                    <Animated.View style={[styles.topBar, { opacity: fadeAnim }]}>
                        <TouchableOpacity style={styles.backBtn} onPress={handleBackPress}>
                            <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
                        </TouchableOpacity>
                        <Text style={styles.topBarTitle}>Create Account</Text>
                        <View style={{ width: 44 }} />
                    </Animated.View>

                    {/* Role pill */}
                    <Animated.View style={[styles.rolePillWrap, { opacity: fadeAnim }]}>
                        <View
                            style={[
                                styles.rolePill,
                                { backgroundColor: meta.bg, borderColor: meta.color + '55' },
                            ]}
                        >
                            <View
                                style={[
                                    styles.rolePillIcon,
                                    { backgroundColor: meta.color + '22' },
                                ]}
                            >
                                <Ionicons name={meta.icon as any} size={14} color={meta.color} />
                            </View>
                            <Text style={[styles.rolePillText, { color: meta.color }]}>
                                Registering as{' '}
                                <Text style={{ fontWeight: Typography.extraBold }}>
                                    {meta.label}
                                </Text>
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Step indicator — customer only */}
                    {isCustomer && (
                        <Animated.View style={[styles.stepRow, { opacity: fadeAnim }]}>
                            <View style={styles.stepItem}>
                                <View style={[styles.stepDot, styles.stepDotActive]}>
                                    <Text style={styles.stepDotTextActive}>1</Text>
                                </View>
                                <Text style={styles.stepLabelActive}>Your details</Text>
                            </View>
                            <View
                                style={[
                                    styles.stepConnector,
                                    step === 2 && styles.stepConnectorActive,
                                ]}
                            />
                            <View style={styles.stepItem}>
                                <View style={[styles.stepDot, step === 2 && styles.stepDotActive]}>
                                    <Text
                                        style={
                                            step === 2
                                                ? styles.stepDotTextActive
                                                : styles.stepDotText
                                        }
                                    >
                                        2
                                    </Text>
                                </View>
                                <Text
                                    style={step === 2 ? styles.stepLabelActive : styles.stepLabel}
                                >
                                    KYC & photo
                                </Text>
                            </View>
                        </Animated.View>
                    )}

                    {/* Heading */}
                    <Animated.View style={[styles.heading, { opacity: fadeAnim }]}>
                        <Text style={styles.headingTitle}>
                            {isCustomer && step === 2
                                ? "You're almost\nthere"
                                : "Let's get\nyou set up"}
                        </Text>
                        <Text style={styles.headingSubtitle}>
                            {isCustomer && step === 2
                                ? 'Add a profile photo and verify your identity. You can also skip this and do it later.'
                                : 'Fill in your details to create a free account.'}
                        </Text>
                    </Animated.View>

                    {/* ════════════════════════ STEP 1 — account details ═══════════════════════ */}
                    {step === 1 && (
                        <Animated.View
                            style={[
                                styles.card,
                                {
                                    opacity: fadeAnim,
                                    transform: [
                                        { translateY: slideAnim },
                                        { translateX: shakeAnim },
                                    ],
                                },
                            ]}
                        >
                            {/* ── Common fields ── */}
                            <Field
                                label="Full Name"
                                placeholder="Sara Patel"
                                icon="person-outline"
                                value={fullName}
                                onChangeText={t => {
                                    setFullName(t);
                                    clearError('fullName');
                                }}
                                error={errors.fullName}
                                autoCapitalize="words"
                            />
                            <View style={styles.row}>
                                <View style={styles.rowItem}>
                                    <SearchableDropdown
                                        label="State"
                                        icon="map-outline"
                                        placeholder="Search state"
                                        value={state}
                                        onChangeText={handleStateTextChange}
                                        fetchOptions={fetchStateOptions}
                                        onSelect={handleStateSelect}
                                        error={errors.state}
                                    />
                                </View>
                                <View style={styles.rowItem}>
                                    <SearchableDropdown
                                        label="City"
                                        icon="location-outline"
                                        placeholder="Search city"
                                        disabledHint="Select a state first"
                                        value={city}
                                        onChangeText={handleCityTextChange}
                                        fetchOptions={fetchCityOptions}
                                        onSelect={handleCitySelect}
                                        error={errors.city}
                                        disabled={!state.trim()}
                                    />
                                </View>
                            </View>

                            {/* Email with verify button */}
                            <Field
                                label="Email Address"
                                placeholder="you@example.com"
                                icon="mail-outline"
                                value={email}
                                onChangeText={t => {
                                    setEmail(t);
                                    setEmailVerified(false); // reset verification if email changes
                                    clearError('email');
                                }}
                                error={errors.email}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                trailingIcon={emailVerified ? 'checkmark-circle' : undefined}
                            />
                            {!emailVerified && (
                                <TouchableOpacity
                                    style={styles.verifyBtn}
                                    onPress={handleSendEmailOtp}
                                    disabled={sendingEmailOtp}
                                    activeOpacity={0.8}
                                >
                                    {sendingEmailOtp ? (
                                        <LoadingDots />
                                    ) : (
                                        <Text style={styles.verifyBtnText}>Verify Email</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                            {emailVerified && (
                                <View style={styles.verifiedBadge}>
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={13}
                                        color={Colors.success}
                                    />
                                    <Text style={styles.verifiedText}>Email verified</Text>
                                </View>
                            )}

                            {/* Phone with verify button */}
                            <Field
                                label="Phone Number"
                                placeholder="9876543210"
                                icon="call-outline"
                                value={phone}
                                onChangeText={t => {
                                    // strip non-digits and cap at 10
                                    const digits = t.replace(/\D/g, '').slice(0, 10);
                                    setPhone(digits);
                                    setPhoneVerified(false); // reset if phone changes
                                    clearError('phone');
                                }}
                                error={errors.phone}
                                keyboardType="phone-pad"
                                maxLength={10}
                            />
                            {!phoneVerified && (
                                <TouchableOpacity
                                    style={styles.verifyBtn}
                                    onPress={handleSendPhoneOtp}
                                    disabled={sendingPhoneOtp}
                                    activeOpacity={0.8}
                                >
                                    {sendingPhoneOtp ? (
                                        <LoadingDots />
                                    ) : (
                                        <Text style={styles.verifyBtnText}>Verify Phone</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                            {phoneVerified && (
                                <View style={styles.verifiedBadge}>
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={13}
                                        color={Colors.success}
                                    />
                                    <Text style={styles.verifiedText}>Phone verified</Text>
                                </View>
                            )}

                            <Field
                                label="Password"
                                placeholder="Minimum 8 characters"
                                icon="lock-closed-outline"
                                value={password}
                                onChangeText={t => {
                                    setPassword(t);
                                    clearError('password');
                                    if (confirmPassword) {
                                        setErrors(prev => ({
                                            ...prev,
                                            confirmPassword:
                                                confirmPassword === t
                                                    ? ''
                                                    : 'Passwords do not match',
                                        }));
                                    }
                                }}
                                error={errors.password}
                                secureTextEntry={!showPassword}
                                trailingIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                onTrailingPress={() => setShowPassword(!showPassword)}
                            />

                            <PasswordStrength password={password} />

                            {password.length > 0 && (
                                <View style={styles.hintsGrid}>
                                    {[
                                        // FIX: consistent with validation — 8 chars, not 6
                                        { ok: password.length >= 8, text: 'Min 8 characters' },
                                        { ok: /[A-Z]/.test(password), text: 'Uppercase letter' },
                                        { ok: /[0-9]/.test(password), text: 'Number included' },
                                        {
                                            ok: /[^a-zA-Z0-9]/.test(password),
                                            text: 'Special character',
                                        },
                                    ].map((h, i) => (
                                        <View key={i} style={styles.hintItem}>
                                            <Ionicons
                                                name={h.ok ? 'checkmark-circle' : 'ellipse-outline'}
                                                size={13}
                                                color={h.ok ? Colors.success : Colors.charcoalLight}
                                            />
                                            <Text
                                                style={[styles.hintText, h.ok && styles.hintTextOk]}
                                            >
                                                {h.text}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* ── Confirm Password ── */}
                            <Field
                                label="Confirm Password"
                                placeholder="Re-enter your password"
                                icon="lock-closed-outline"
                                value={confirmPassword}
                                onChangeText={t => {
                                    setConfirmPassword(t);
                                    setErrors(prev => ({
                                        ...prev,
                                        confirmPassword:
                                            t === password ? '' : 'Passwords do not match',
                                    }));
                                }}
                                error={errors.confirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                trailingIcon={
                                    showConfirmPassword ? 'eye-off-outline' : 'eye-outline'
                                }
                                onTrailingPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            />

                            {/* ── Referral code ── */}
                            <Field
                                label="Referral Code (Optional)"
                                placeholder="Enter referral code if any"
                                icon="people-outline"
                                value={referralCode}
                                onChangeText={setReferralCode}
                                autoCapitalize="characters"
                            />

                            <View style={styles.divider} />

                            {/* Terms */}
                            <TouchableOpacity
                                style={styles.termsRow}
                                onPress={() => {
                                    setAgreed(!agreed);
                                    clearError('agreed');
                                }}
                                activeOpacity={0.7}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        agreed && styles.checkboxOn,
                                        !!errors.agreed && styles.checkboxErr,
                                    ]}
                                >
                                    {agreed && (
                                        <Ionicons name="checkmark" size={11} color={Colors.white} />
                                    )}
                                </View>
                                <Text style={styles.termsText}>
                                    I agree to the{' '}
                                    <Text
                                        style={styles.termsLink}
                                        onPress={() =>
                                            Linking.openURL('https://rentalmeet.com/terms')
                                        }
                                    >
                                        Terms of Service
                                    </Text>{' '}
                                    and{' '}
                                    <Text
                                        style={styles.termsLink}
                                        onPress={() =>
                                            Linking.openURL('https://rentalmeet.com/privacy')
                                        }
                                    >
                                        Privacy Policy
                                    </Text>
                                </Text>
                            </TouchableOpacity>
                            {!!errors.agreed && (
                                <View
                                    style={[
                                        styles.errorRow,
                                        { marginTop: 0, marginBottom: Spacing.sm },
                                    ]}
                                >
                                    <Ionicons name="alert-circle" size={12} color={Colors.danger} />
                                    <Text style={styles.errorText}>{errors.agreed}</Text>
                                </View>
                            )}

                            {/* CTA */}
                            <Animated.View
                                style={{ transform: [{ scale: btnScale }], marginTop: Spacing.sm }}
                            >
                                <TouchableOpacity
                                    style={[styles.registerBtn, loading && { opacity: 0.7 }]}
                                    onPress={isCustomer ? handleContinueToKyc : handleRegister}
                                    activeOpacity={0.9}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <LoadingDots />
                                    ) : (
                                        <>
                                            <Text style={styles.registerBtnText}>
                                                {isCustomer ? 'Continue' : 'Create Account'}
                                            </Text>
                                            <View style={styles.registerBtnArrow}>
                                                <Ionicons
                                                    name="arrow-forward"
                                                    size={17}
                                                    color={meta.color}
                                                />
                                            </View>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        </Animated.View>
                    )}

                    {/* ════════════════════ STEP 2 — KYC + profile photo (customer) ═══════════════ */}
                    {isCustomer && step === 2 && (
                        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                            {/* Profile photo */}
                            <Text style={styles.sectionLabel}>PROFILE PHOTO</Text>
                            <View style={styles.avatarWrap}>
                                <TouchableOpacity
                                    onPress={handlePhotoOptions}
                                    activeOpacity={0.85}
                                    style={styles.avatarTouchable}
                                >
                                    {profilePicUrl ? (
                                        <Image
                                            source={{ uri: profilePicUrl }}
                                            style={styles.avatarImage}
                                        />
                                    ) : (
                                        <View style={styles.avatarPlaceholder}>
                                            <Ionicons
                                                name="person"
                                                size={32}
                                                color={Colors.charcoalLight}
                                            />
                                        </View>
                                    )}
                                    <View style={styles.avatarEditBadge}>
                                        {uploadingPhoto ? (
                                            <LoadingDots />
                                        ) : (
                                            <Ionicons
                                                name="camera"
                                                size={13}
                                                color={Colors.white}
                                            />
                                        )}
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.avatarLabel}>
                                    {profilePicUrl
                                        ? 'Tap to change photo'
                                        : 'Add a profile photo (optional)'}
                                </Text>
                            </View>

                            <View style={styles.divider} />

                            {/* KYC */}
                            <Text style={styles.sectionLabel}>IDENTITY VERIFICATION (KYC)</Text>
                            <Text style={styles.kycHint}>
                                Verifying your identity unlocks bookings and payouts faster. You can
                                also do this later from your profile.
                            </Text>

                            <Text style={[styles.fieldLabel, { marginTop: Spacing.sm }]}>
                                ID Type
                            </Text>
                            <View style={styles.typeRow}>
                                {ID_PROOF_TYPES.map(type => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.typeChip,
                                            kycIdProofType === type && styles.typeChipActive,
                                        ]}
                                        onPress={() => {
                                            setKycIdProofType(type);
                                            setKycBack(null);
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Text
                                            style={[
                                                styles.typeChipText,
                                                kycIdProofType === type &&
                                                    styles.typeChipTextActive,
                                            ]}
                                        >
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
                                {kycIdProofType} — Front Side
                            </Text>
                            <KycDocCard
                                label={`${kycIdProofType} — Front`}
                                icon="id-card-outline"
                                file={kycFront}
                                onPick={() => showKycPickerOptions('front')}
                                onRemove={() => setKycFront(null)}
                                error={kycErrors.front}
                            />

                            {kycIdProofType !== 'PAN' && (
                                <>
                                    <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
                                        {kycIdProofType} — Back Side
                                    </Text>
                                    <KycDocCard
                                        label={`${kycIdProofType} — Back`}
                                        icon="id-card-outline"
                                        file={kycBack}
                                        onPick={() => showKycPickerOptions('back')}
                                        onRemove={() => setKycBack(null)}
                                        error={kycErrors.back}
                                    />
                                </>
                            )}

                            <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
                                Address Proof (Optional)
                            </Text>
                            <KycDocCard
                                label="Address Proof"
                                icon="home-outline"
                                file={kycAddressProof}
                                onPick={() => showKycPickerOptions('addressProof')}
                                onRemove={() => setKycAddressProof(null)}
                                error={kycErrors.addressProof}
                                preferCamera
                            />

                            <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
                                Selfie with ID
                            </Text>
                            <KycDocCard
                                label="Selfie with ID"
                                icon="camera-outline"
                                file={kycSelfie}
                                onPick={() => showKycPickerOptions('selfie')}
                                onRemove={() => setKycSelfie(null)}
                                error={kycErrors.selfie}
                                preferCamera
                            />

                            {/* CTAs */}
                            <TouchableOpacity
                                style={[
                                    styles.registerBtn,
                                    kycLoading && { opacity: 0.7 },
                                    { marginTop: Spacing.lg },
                                ]}
                                onPress={handleSubmitKyc}
                                activeOpacity={0.9}
                                disabled={kycLoading}
                            >
                                {kycLoading ? (
                                    <LoadingDots />
                                ) : (
                                    <Text style={styles.registerBtnText}>
                                        {hasAnyKycInput ? 'Submit & Finish' : 'Finish'}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {!kycLoading && (
                                <TouchableOpacity
                                    style={styles.skipBtn}
                                    onPress={handleSkipKyc}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.skipBtnText}>Skip for now</Text>
                                </TouchableOpacity>
                            )}
                        </Animated.View>
                    )}

                    {/* Sign in link */}
                    {step === 1 && (
                        <Animated.View style={[styles.loginRow, { opacity: fadeAnim }]}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('login')}>
                                <Text style={styles.loginLink}>Sign in</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { flexGrow: 1, alignItems: 'center', paddingBottom: 48 },
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
    rolePillWrap: { width: SCREEN_WIDTH - 32, marginTop: Spacing.lg, marginBottom: Spacing.sm },
    rolePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: Radii.full,
        borderWidth: 1,
    },
    rolePillIcon: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rolePillText: { fontSize: 12, fontWeight: Typography.medium, letterSpacing: 0.1 },

    // Step indicator
    stepRow: {
        width: SCREEN_WIDTH - 32,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.sm,
        marginBottom: Spacing.md,
    },
    stepItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    stepDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepDotActive: { backgroundColor: Colors.primary },
    stepDotText: { fontSize: 11, fontWeight: Typography.bold, color: Colors.charcoalLight },
    stepDotTextActive: { fontSize: 11, fontWeight: Typography.bold, color: Colors.charcoal },
    stepLabel: { fontSize: 12, color: Colors.charcoalLight, fontWeight: Typography.medium },
    stepLabelActive: { fontSize: 12, color: Colors.charcoal, fontWeight: Typography.bold },
    stepConnector: { flex: 1, height: 1.5, backgroundColor: Colors.border, marginHorizontal: 8 },
    stepConnectorActive: { backgroundColor: Colors.primary },

    heading: { width: SCREEN_WIDTH - 32, marginBottom: Spacing.lg },
    headingTitle: {
        fontSize: 30,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.8,
        lineHeight: 36,
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

    // FIX: row children need minWidth:0 to shrink properly
    row: { flexDirection: 'column' },
    rowItem: { flex: 1, minWidth: 0 },

    // OTP verify buttons
    verifyBtn: {
        alignSelf: 'flex-start',
        marginTop: -Spacing.xs,
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: Colors.primary + '44',
    },
    verifyBtnText: {
        fontSize: 12,
        fontWeight: Typography.semiBold,
        color: Colors.primary,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: -Spacing.xs,
        marginBottom: Spacing.sm,
    },
    verifiedText: {
        fontSize: 12,
        fontWeight: Typography.semiBold,
        color: Colors.success,
    },

    // Password hints
    hintsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        marginBottom: Spacing.md,
        marginTop: -Spacing.sm,
    },
    hintItem: { flexDirection: 'row', alignItems: 'center', gap: 4, width: '47%' },
    hintText: { fontSize: 11, color: Colors.charcoalLight, fontWeight: Typography.medium },
    hintTextOk: { color: Colors.success, fontWeight: Typography.semiBold },

    fieldLabel: {
        fontSize: 12,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalLight,
        marginBottom: Spacing.xs,
        marginTop: Spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 1.8,
        marginBottom: Spacing.sm,
    },
    kycHint: {
        fontSize: 12,
        color: Colors.charcoalLight,
        lineHeight: 17,
        marginBottom: Spacing.sm,
    },

    // Profile photo (step 2)
    avatarWrap: { alignItems: 'center', marginBottom: Spacing.sm },
    avatarTouchable: { position: 'relative' },
    avatarImage: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.background },
    avatarPlaceholder: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    avatarLabel: {
        fontSize: 12,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        marginTop: Spacing.sm,
    },

    // ID type chips (also reused in step 2)
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
    typeChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
    },
    typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    typeChipText: { fontSize: 12.5, color: Colors.charcoalLight, fontWeight: Typography.semiBold },
    typeChipTextActive: { color: Colors.charcoal, fontWeight: Typography.bold },

    divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.lg },
    termsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
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
        flexShrink: 0,
    },
    checkboxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    checkboxErr: { borderColor: Colors.danger },
    termsText: { flex: 1, fontSize: 13, color: Colors.charcoalLight, lineHeight: 20 },
    termsLink: { color: Colors.primary, fontWeight: Typography.bold },
    registerBtn: {
        backgroundColor: Colors.charcoal,
        borderRadius: Radii.md,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        ...Shadows.floating,
    },
    registerBtnText: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.3,
    },
    registerBtnArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    skipBtn: { alignSelf: 'center', marginTop: Spacing.md, padding: Spacing.xs },
    skipBtnText: { fontSize: 13, fontWeight: Typography.semiBold, color: Colors.charcoalLight },
    loginRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xl },
    loginText: { fontSize: 14, color: Colors.charcoalLight },
    loginLink: { fontSize: 14, color: Colors.primary, fontWeight: Typography.extraBold },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
    errorText: { fontSize: 11, color: Colors.danger, fontWeight: Typography.semiBold },

    // OTP Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalCard: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: Radii.xxl,
        padding: Spacing.xl,
        ...Shadows.floating,
    },
    modalHeader: { alignItems: 'center', marginBottom: Spacing.lg, gap: Spacing.sm },
    modalTitle: {
        fontSize: 20,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.4,
    },
    modalSubtitle: {
        fontSize: 13,
        color: Colors.charcoalLight,
        textAlign: 'center',
        lineHeight: 20,
    },
    otpInput: {
        height: 56,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
        fontSize: 22,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: 8,
        marginBottom: Spacing.sm,
    },
    otpInputError: { borderColor: Colors.danger },
    modalFooterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.md,
    },
    resendText: {
        fontSize: 13,
        fontWeight: Typography.semiBold,
        color: Colors.primary,
    },
});

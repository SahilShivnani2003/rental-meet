import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DeviceInfo from 'react-native-device-info';
import { launchImageLibrary } from 'react-native-image-picker';
import { RootStackParamList } from '@/types/RootStackParamList';
import { useAlert } from '@/context/AlertContext';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/theme/theme';
import { RegisterOwner } from '../types/Register';
import { useRegister } from '../hooks/useRegister';
import { useUploadImage } from '@/features/profile/hooks/useUploadImage';
import StepIndicator from '../components/StepIndicator';
import SelectField from '../components/SelectField';
import SearchableDropdown, { DropdownOption } from '@/components/UI/SearchableDropDown';
import { City, getCitiesByState, getStates, State } from '@/utils/location';
import {
    getCurrentCoordinates,
    LocationPermissionDeniedError,
    LocationTimeoutError,
} from '@/utils/deviceLocation';
import { coordinatesToAddress } from '@/utils/geocoding';
import { useSendPhoneOtp, useVerifyPhoneOtp } from '../hooks/useVerfication';
import { ApiError } from '@/types/ApiError';

type OtpStep = 'none' | 'phone';

const STEP_LABELS = ['Account', 'Venue', 'Location', 'Pricing', 'Photos'];

const VENUE_CATEGORIES = [
    'Meeting Hall',
    'Restaurant',
    'Conference Hall',
    'Co-Work Space',
    'Auditorium',
    'Guest House',
    'Banquet Hall',
    'Training Center',
    'Farm House',
    'Marriage Garden',
    'Hotel',
    'Play Zone',
];

const CAPACITY_OPTIONS = [
    'Up to 10',
    '10-25',
    '25-50',
    '50-100',
    '100-150',
    '150-200',
    '200-300',
    '300-400',
    '400-500',
    '500-700',
    '700-1000',
    '1000-1500',
    '1500-2000',
    '2000+',
];

const PHOTO_SLOTS = [
    {
        key: 'Front / Entrance',
        label: 'Front / entrance',
        hint: 'Exterior or main entrance view',
        required: true,
    },
    {
        key: 'Main Hall / Space',
        label: 'Main hall / space',
        hint: 'Your main function area',
        required: true,
    },
    {
        key: 'Seating Area',
        label: 'Seating area',
        hint: 'Tables, chairs, or stage seating',
        required: true,
    },
    { key: 'Parking', label: 'Parking area', hint: 'Vehicle parking area', required: false },
    {
        key: 'Facilities',
        label: 'Facilities',
        hint: 'Restrooms, stage, or other facilities',
        required: false,
    },
    {
        key: 'Outdoor Area',
        label: 'Outdoor area',
        hint: 'Lawn, garden, terrace, or deck',
        required: false,
    },
    { key: 'Other', label: 'Other', hint: 'Any additional view', required: false },
] as const;

type VenuePhoto = { uri: string; fileName: string; type: string };
type VenueLocation = RegisterOwner['venueData']['location'];
type PricingModel = RegisterOwner['venueData']['pricing']['selectedPricingModels'][number];
type VenueOwnerRegistrationScreenProps = NativeStackScreenProps<
    RootStackParamList,
    'venueOwnerRegister'
>;

const createInitialForm = (): RegisterOwner => ({
    name: '',
    email: '',
    phone: '',
    password: '',
    city: '',
    state: '',
    role: 'owner',
    venueData: {
        businessName: '',
        description: '',
        venueType: [],
        capacity: '',
        areaSqft: 0,
        location: {
            address: '',
            state: '',
            city: '',
            area: '',
            pincode: '',
        },
        pricing: {
            enabledOptions: { perHour: false, halfDay: false, fullDay: false },
            selectedPricingModels: [],
        },
        images: [],
    },
});

const parseOptionalNumber = (value: string) => {
    const parsed = Number(value);
    return value.trim() && Number.isFinite(parsed) ? parsed : undefined;
};

function FormField({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    keyboardType = 'default',
    secureTextEntry = false,
    multiline = false,
    autoCapitalize = 'sentences',
}: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
    error?: string;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
    secureTextEntry?: boolean;
    multiline?: boolean;
    autoCapitalize?: 'none' | 'sentences' | 'words';
}) {
    return (
        <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    multiline && styles.multilineInput,
                    !!error && styles.inputError,
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={Colors.charcoalLight}
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry}
                multiline={multiline}
                textAlignVertical={multiline ? 'top' : 'center'}
                autoCapitalize={autoCapitalize}
                autoCorrect={false}
            />
            {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

function ChoicePill({
    label,
    selected,
    onPress,
}: {
    label: string;
    selected: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[styles.choicePill, selected && styles.choicePillSelected]}
            onPress={onPress}
            activeOpacity={0.75}
        >
            <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
            {selected && <Ionicons name="checkmark-circle" size={16} color={Colors.primaryDark} />}
        </TouchableOpacity>
    );
}

export const VenueOwnerRegistrationScreen = ({ navigation }: VenueOwnerRegistrationScreenProps) => {
    const alert = useAlert();
    const { setUser } = useAuthStore();
    const { mutateAsync: register } = useRegister();
    const { mutateAsync: uploadImage } = useUploadImage();
    const [stepIndex, setStepIndex] = useState(0);
    const [form, setForm] = useState<RegisterOwner>(createInitialForm);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [photos, setPhotos] = useState<Record<string, VenuePhoto | undefined>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [otpStep, setOtpStep] = useState<OtpStep>('none');
    const [otpValue, setOtpValue] = useState('');
    const [otpError, setOtpError] = useState('');
    const [statePlaceId, setStatePlaceId] = useState<string | null>(null);
    const [cityPlaceId, setCityPlaceId] = useState<string | null>(null);
    const [venueStatePlaceId, setVenueStatePlaceId] = useState<string | null>(null);
    const [venueCityPlaceId, setVenueCityPlaceId] = useState<string | null>(null);
    const [venueStateFromLocation, setVenueStateFromLocation] = useState(false);
    const [venueCityFromLocation, setVenueCityFromLocation] = useState(false);
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const scrollRef = useRef<ScrollView>(null);
    const { mutate: sendPhoneOtp, isPending: sendingPhoneOtp } = useSendPhoneOtp();
    const { mutate: verifyPhoneOtp, isPending: verifyingPhoneOtp } = useVerifyPhoneOtp();

    const updateAccount = (
        key: 'name' | 'email' | 'phone' | 'password' | 'city' | 'state',
        value: string,
    ) => {
        setForm(previous => ({ ...previous, [key]: value }));
    };

    const updateVenue = (
        key: 'businessName' | 'description' | 'capacity' | 'areaSqft',
        value: string,
    ) => {
        setForm(previous => ({
            ...previous,
            venueData: {
                ...previous.venueData,
                [key]: key === 'areaSqft' ? parseOptionalNumber(value) ?? 0 : value,
            },
        }));
    };

    const updateLocation = (key: keyof VenueLocation, value: string) => {
        setForm(previous => ({
            ...previous,
            venueData: {
                ...previous.venueData,
                location: { ...previous.venueData.location, [key]: value },
            },
        }));
    };

    const fetchStateOptions = async (query: string): Promise<DropdownOption[]> => {
        const results: State[] = await getStates(query);
        return results.map(({ name, placeId }) => ({ name, placeId }));
    };

    const fetchCityOptions = async (
        query: string,
        selectedState: string,
    ): Promise<DropdownOption[]> => {
        const results: City[] = await getCitiesByState(query, selectedState);
        return results.map(({ name, placeId }) => ({ name, placeId }));
    };

    const handleSendPhoneOtp = () => {
        if (!/^\d{10}$/.test(form.phone)) {
            setErrors(previous => ({ ...previous, phone: 'Enter a valid 10-digit phone number' }));
            return;
        }
        setOtpValue('');
        setOtpError('');
        sendPhoneOtp(
            { phone: form.phone, name: form.name },
            {
                onSuccess: () => setOtpStep('phone'),
                onError: (error: ApiError) =>
                    alert.error('OTP Error', error?.message || 'Failed to send OTP'),
            },
        );
    };

    const handleVerifyPhoneOtp = () => {
        if (otpValue.length < 4) {
            setOtpError('Enter the complete OTP');
            return;
        }
        verifyPhoneOtp(
            { phone: form.phone, otp: otpValue },
            {
                onSuccess: () => {
                    setPhoneVerified(true);
                    setOtpStep('none');
                    setOtpError('');
                    setErrors(previous => ({ ...previous, phone: '' }));
                    alert.success('OTP Verified', 'Phone number verified successfully');
                },
                onError: (error: ApiError) =>
                    setOtpError(error?.message || 'Invalid OTP. Please try again.'),
            },
        );
    };

    const handleUseCurrentLocation = async () => {
        setLocating(true);
        setLocationError(null);

        try {
            const coordinates = await getCurrentCoordinates();
            const address = await coordinatesToAddress(coordinates);

            if (!address) {
                setLocationError(
                    'Could not determine your address from this location. Please fill it in manually.',
                );
                return;
            }

            setForm(previous => ({
                ...previous,
                venueData: {
                    ...previous.venueData,
                    location: {
                        ...previous.venueData.location,
                        address:
                            address.addressLine ||
                            address.formattedAddress ||
                            previous.venueData.location.address,
                        city: address.city || previous.venueData.location.city,
                        state: address.state || previous.venueData.location.state,
                        pincode: address.pincode || previous.venueData.location.pincode,
                        googleMapLink: `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`,
                    },
                },
            }));
            if (address.state) {
                setVenueStatePlaceId(null);
                setVenueStateFromLocation(true);
            }
            if (address.city) {
                setVenueCityPlaceId(null);
                setVenueCityFromLocation(true);
            }
            setErrors(previous => ({
                ...previous,
                address: '',
                venueCity: '',
                venueState: '',
                pincode: '',
            }));
        } catch (error) {
            if (error instanceof LocationPermissionDeniedError) {
                setLocationError(
                    'Location permission denied. Enable it in your device settings, or fill in your address manually.',
                );
            } else if (error instanceof LocationTimeoutError) {
                setLocationError(error.message);
            } else {
                console.error('Error detecting current location:', error);
                setLocationError('Could not fetch your current location. Please enter it manually.');
            }
        } finally {
            setLocating(false);
        }
    };

    const validateCurrentStep = () => {
        const nextErrors: Record<string, string> = {};
        const { venueData } = form;

        if (stepIndex === 0) {
            if (!form.name.trim()) nextErrors.name = 'Enter your full name';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
                nextErrors.email = 'Enter a valid email address';
            }
            if (!/^\d{10}$/.test(form.phone)) {
                nextErrors.phone = 'Enter a 10-digit phone number';
            } else if (!phoneVerified) {
                nextErrors.phone = 'Please verify your phone number first';
            }
            if (!cityPlaceId) nextErrors.city = 'Select a city from the suggestions';
            if (!statePlaceId) nextErrors.state = 'Select a state from the suggestions';
            if (form.password.length < 8) nextErrors.password = 'Use at least 8 characters';
            if (confirmPassword !== form.password)
                nextErrors.confirmPassword = 'Passwords do not match';
        } else if (stepIndex === 1) {
            if (!venueData.businessName.trim()) nextErrors.businessName = 'Enter your venue name';
            if (venueData.description.trim().length < 20) {
                nextErrors.description = 'Add at least 20 characters about your venue';
            }
            if (venueData.venueType.length === 0)
                nextErrors.venueType = 'Choose at least one venue type';
            if (!venueData.capacity) nextErrors.capacity = 'Choose a guest capacity';
            if (venueData.areaSqft <= 0) nextErrors.areaSqft = 'Enter the venue area';
        } else if (stepIndex === 2) {
            const location = venueData.location;
            if (!location.address.trim()) nextErrors.address = 'Enter the street address';
            if (!location.area.trim()) nextErrors.area = 'Enter the locality or area';
            if (!location.city.trim()) nextErrors.venueCity = 'Select a city from the suggestions';
            else if (!venueCityPlaceId && !venueCityFromLocation) {
                nextErrors.venueCity = 'Select a city from the suggestions';
            }
            if (!location.state.trim()) nextErrors.venueState = 'Select a state from the suggestions';
            else if (!venueStatePlaceId && !venueStateFromLocation) {
                nextErrors.venueState = 'Select a state from the suggestions';
            }
            if (!/^\d{6}$/.test(location.pincode.trim()))
                nextErrors.pincode = 'Enter a 6-digit PIN code';
        } else if (stepIndex === 3) {
            const pricing = venueData.pricing;
            if (!Object.values(pricing.enabledOptions).some(Boolean)) {
                nextErrors.enabledOptions = 'Choose at least one booking duration';
            }
            if (pricing.selectedPricingModels.length === 0) {
                nextErrors.selectedPricingModels = 'Choose at least one pricing model';
            }
            const rentRate =
                pricing.onlyRent?.hourly?.rate ??
                pricing.onlyRent?.halfDay?.rate ??
                pricing.onlyRent?.fullDay?.rate;
            const amenityRate =
                pricing.rentWithAmenities?.hourly?.rate ??
                pricing.rentWithAmenities?.halfDay?.rate ??
                pricing.rentWithAmenities?.fullDay?.rate;
            if (pricing.selectedPricingModels.includes('onlyRent') && !rentRate) {
                nextErrors.onlyRent = 'Add a rate for your selected rental option';
            }
            if (pricing.selectedPricingModels.includes('rentWithAmenities') && !amenityRate) {
                nextErrors.rentWithAmenities = 'Add a rate for your selected package';
            }
            if (
                pricing.selectedPricingModels.includes('perPax') &&
                !pricing.perPax?.withoutFood?.rate
            ) {
                nextErrors.perPax = 'Add a per-person rate';
            }
        } else {
            PHOTO_SLOTS.filter(slot => slot.required).forEach(slot => {
                if (!photos[slot.key])
                    nextErrors[slot.key] = `Add a ${slot.label.toLowerCase()} photo`;
            });
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const goNext = () => {
        if (!validateCurrentStep()) return;
        if (stepIndex < STEP_LABELS.length - 1) {
            setStepIndex(index => index + 1);
            scrollRef.current?.scrollTo({ y: 0, animated: false });
            return;
        }
        void handleSubmit();
    };

    const goBack = () => {
        if (stepIndex === 0) {
            navigation.goBack();
            return;
        }
        setErrors({});
        setStepIndex(index => index - 1);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
    };

    const pickPhoto = async (photoKey: string) => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.7,
                selectionLimit: 1,
            });
            if (result.didCancel) return;
            if (result.errorCode) {
                alert.error(
                    'Photo selection failed',
                    result.errorMessage ?? 'Could not open your gallery.',
                );
                return;
            }
            const asset = result.assets?.[0];
            if (!asset?.uri) return;
            setPhotos(previous => ({
                ...previous,
                [photoKey]: {
                    uri: asset.uri!,
                    fileName:
                        asset.fileName ??
                        `${photoKey.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.jpg`,
                    type: asset.type ?? 'image/jpeg',
                },
            }));
            setErrors(previous => ({ ...previous, [photoKey]: '' }));
        } catch (error) {
            alert.error(
                'Photo selection failed',
                error instanceof Error ? error.message : 'Could not open your gallery.',
            );
        }
    };

    const uploadVenuePhotos = async () => {
        const uploaded: RegisterOwner['venueData']['images'] = [];
        for (const slot of PHOTO_SLOTS) {
            const photo = photos[slot.key];
            if (!photo) continue;
            const body = new FormData();
            body.append('file', {
                uri: photo.uri,
                name: photo.fileName,
                type: photo.type,
            } as unknown as Blob);
            body.append('folder', 'venues');
            const response = await uploadImage(body);
            if (!response?.url) {
                throw new Error(
                    `The ${slot.label.toLowerCase()} photo did not return an upload URL.`,
                );
            }
            uploaded.push({
                url: response.url,
                category: slot.key,
                isFeatured: uploaded.length === 0,
            });
        }
        return uploaded;
    };

    const handleSubmit = async () => {
        if (!validateCurrentStep()) return;
        setSubmitting(true);
        try {
            const images = await uploadVenuePhotos();
            const deviceId = await DeviceInfo.getUniqueId();
            const location = form.venueData.location;
            const payload: RegisterOwner = {
                ...form,
                referralCode: referralCode.trim() || undefined,
                deviceId,
                city: form.city.trim(),
                state: form.state.trim(),
                venueData: {
                    ...form.venueData,
                    areaSqft: Number(form.venueData.areaSqft),
                    images,
                    location: {
                        ...location,
                        address: location.address.trim(),
                        area: location.area.trim(),
                        city: location.city.trim(),
                        state: location.state.trim(),
                        pincode: location.pincode.trim(),
                        parkingAvailability:
                            form.venueData.parkingDetails?.type === 'None'
                                ? 'Not Available'
                                : form.venueData.parkingDetails?.type === 'Free'
                                ? 'Free'
                                : form.venueData.parkingDetails?.type === 'Paid'
                                ? 'Paid'
                                : form.venueData.parkingDetails
                                ? 'Available'
                                : undefined,
                    },
                },
            };
            const response = await register(payload);
            setUser(response?.user, response?.token);
            alert.success(
                'Registration complete',
                'Your owner account and venue have been created.',
            );
            navigation.reset({ index: 0, routes: [{ name: 'owner' }] });
        } catch (error: any) {
            alert.error(
                'Registration failed',
                 error?.message || 'Something went wrong. Please try again.',
            );
        } finally {
            setSubmitting(false);
        }
    };

    const toggleVenueType = (type: string) => {
        setForm(previous => ({
            ...previous,
            venueData: {
                ...previous.venueData,
                venueType: previous.venueData.venueType.includes(type)
                    ? previous.venueData.venueType.filter(value => value !== type)
                    : [...previous.venueData.venueType, type],
            },
        }));
        setErrors(previous => ({ ...previous, venueType: '' }));
    };

    const togglePricingModel = (model: PricingModel) => {
        setForm(previous => {
            const selected = previous.venueData.pricing.selectedPricingModels;
            return {
                ...previous,
                venueData: {
                    ...previous.venueData,
                    pricing: {
                        ...previous.venueData.pricing,
                        selectedPricingModels: selected.includes(model)
                            ? selected.filter(value => value !== model)
                            : [...selected, model],
                    },
                },
            };
        });
        setErrors(previous => ({ ...previous, selectedPricingModels: '' }));
    };

    const toggleDuration = (key: 'perHour' | 'halfDay' | 'fullDay') => {
        setForm(previous => ({
            ...previous,
            venueData: {
                ...previous.venueData,
                pricing: {
                    ...previous.venueData.pricing,
                    enabledOptions: {
                        ...previous.venueData.pricing.enabledOptions,
                        [key]: !previous.venueData.pricing.enabledOptions[key],
                    },
                },
            },
        }));
        setErrors(previous => ({ ...previous, enabledOptions: '' }));
    };

    const setRentalRate = (
        model: 'onlyRent' | 'rentWithAmenities',
        duration: 'hourly' | 'halfDay' | 'fullDay',
        value: string,
    ) => {
        const rate = parseOptionalNumber(value);
        setForm(previous => ({
            ...previous,
            venueData: {
                ...previous.venueData,
                pricing: {
                    ...previous.venueData.pricing,
                    [model]: {
                        ...previous.venueData.pricing[model],
                        [duration]: rate ? { rate } : undefined,
                    },
                },
            },
        }));
        setErrors(previous => ({ ...previous, [model]: '' }));
    };

    const setPerPaxRate = (field: 'rate' | 'minPax', value: string) => {
        const parsed = parseOptionalNumber(value) ?? 0;
        setForm(previous => {
            const current = previous.venueData.pricing.perPax?.withoutFood;
            return {
                ...previous,
                venueData: {
                    ...previous.venueData,
                    pricing: {
                        ...previous.venueData.pricing,
                        perPax: {
                            ...previous.venueData.pricing.perPax,
                            withoutFood: {
                                rate: current?.rate ?? 0,
                                minPax: current?.minPax ?? 0,
                                [field]: parsed,
                            },
                        },
                    },
                },
            };
        });
        setErrors(previous => ({ ...previous, perPax: '' }));
    };

    const renderStep = () => {
        const { venueData } = form;
        if (stepIndex === 0) {
            return (
                <>
                    <FormField
                        label="Full name"
                        value={form.name}
                        onChangeText={value => updateAccount('name', value)}
                        placeholder="Your name"
                        error={errors.name}
                        autoCapitalize="words"
                    />
                    <FormField
                        label="Email address"
                        value={form.email}
                        onChangeText={value => updateAccount('email', value)}
                        placeholder="you@example.com"
                        error={errors.email}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <FormField
                        label="Phone number"
                        value={form.phone}
                        onChangeText={value => {
                            updateAccount('phone', value.replace(/\D/g, '').slice(0, 10));
                            setPhoneVerified(false);
                            setErrors(previous => ({ ...previous, phone: '' }));
                        }}
                        placeholder="10-digit mobile number"
                        error={errors.phone}
                        keyboardType="phone-pad"
                    />
                    {!phoneVerified ? (
                        <TouchableOpacity
                            style={styles.verifyButton}
                            onPress={handleSendPhoneOtp}
                            disabled={sendingPhoneOtp}
                            activeOpacity={0.8}
                        >
                            {sendingPhoneOtp ? (
                                <ActivityIndicator size="small" color={Colors.primary} />
                            ) : (
                                <Text style={styles.verifyButtonText}>Verify phone number</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={15} color={Colors.success} />
                            <Text style={styles.verifiedText}>Phone number verified</Text>
                        </View>
                    )}
                    <SearchableDropdown
                        label="Your state"
                        icon="map-outline"
                        placeholder="Search state"
                        value={form.state}
                        onChangeText={value => {
                            updateAccount('state', value);
                            setStatePlaceId(null);
                            setCityPlaceId(null);
                            updateAccount('city', '');
                            setErrors(previous => ({ ...previous, state: '', city: '' }));
                        }}
                        fetchOptions={fetchStateOptions}
                        onSelect={option => {
                            updateAccount('state', option.name);
                            updateAccount('city', '');
                            setStatePlaceId(option.placeId);
                            setCityPlaceId(null);
                            setErrors(previous => ({ ...previous, state: '', city: '' }));
                        }}
                        error={errors.state}
                    />
                    <SearchableDropdown
                        label="Your city"
                        icon="location-outline"
                        placeholder="Search city"
                        disabledHint="Select a state first"
                        value={form.city}
                        onChangeText={value => {
                            updateAccount('city', value);
                            setCityPlaceId(null);
                            setErrors(previous => ({ ...previous, city: '' }));
                        }}
                        fetchOptions={query => fetchCityOptions(query, form.state)}
                        onSelect={option => {
                            updateAccount('city', option.name);
                            setCityPlaceId(option.placeId);
                            setErrors(previous => ({ ...previous, city: '' }));
                        }}
                        error={errors.city}
                        disabled={!statePlaceId}
                    />

                    <FormField
                        label="Password"
                        value={form.password}
                        onChangeText={value => updateAccount('password', value)}
                        placeholder="At least 8 characters"
                        error={errors.password}
                        secureTextEntry
                        autoCapitalize="none"
                    />
                    <FormField
                        label="Confirm password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Re-enter your password"
                        error={errors.confirmPassword}
                        secureTextEntry
                        autoCapitalize="none"
                    />
                    <FormField
                        label="Referral code (optional)"
                        value={referralCode}
                        onChangeText={setReferralCode}
                        placeholder="Enter referral code"
                        autoCapitalize="words"
                    />
                </>
            );
        }
        if (stepIndex === 1) {
            return (
                <>
                    <FormField
                        label="Venue name"
                        value={venueData.businessName}
                        onChangeText={value => updateVenue('businessName', value)}
                        placeholder="How guests know your venue"
                        error={errors.businessName}
                        autoCapitalize="words"
                    />
                    <FormField
                        label="About your venue"
                        value={venueData.description}
                        onChangeText={value => updateVenue('description', value)}
                        placeholder="Describe the space, facilities, and what makes it special"
                        error={errors.description}
                        multiline
                    />
                    <Text style={styles.fieldLabel}>VENUE TYPE</Text>
                    <View style={styles.choiceWrap}>
                        {VENUE_CATEGORIES.map(type => (
                            <ChoicePill
                                key={type}
                                label={type}
                                selected={venueData.venueType.includes(type)}
                                onPress={() => toggleVenueType(type)}
                            />
                        ))}
                    </View>
                    {!!errors.venueType && <Text style={styles.errorText}>{errors.venueType}</Text>}
                    <SelectField
                        label="Guest capacity"
                        value={venueData.capacity}
                        options={CAPACITY_OPTIONS}
                        onSelect={value => updateVenue('capacity', value)}
                        error={errors.capacity}
                        placeholder="Choose a range"
                    />
                    <FormField
                        label="Venue area (sq. ft.)"
                        value={venueData.areaSqft ? String(venueData.areaSqft) : ''}
                        onChangeText={value => updateVenue('areaSqft', value)}
                        placeholder="e.g. 2500"
                        error={errors.areaSqft}
                        keyboardType="numeric"
                    />
                    <Text style={styles.fieldLabel}>FOOD SERVICE</Text>
                    <View style={styles.choiceWrap}>
                        {(['Veg', 'Non Veg', 'Both'] as const).map(value => (
                            <ChoicePill
                                key={value}
                                label={value}
                                selected={venueData.foodType === value}
                                onPress={() =>
                                    setForm(previous => ({
                                        ...previous,
                                        venueData: { ...previous.venueData, foodType: value },
                                    }))
                                }
                            />
                        ))}
                    </View>
                </>
            );
        }
        if (stepIndex === 2) {
            return (
                <>
                    <TouchableOpacity
                        style={[styles.locationButton, locating && styles.buttonDisabled]}
                        onPress={() => void handleUseCurrentLocation()}
                        disabled={locating}
                        activeOpacity={0.8}
                    >
                        {locating ? (
                            <>
                                <ActivityIndicator size="small" color={Colors.primary} />
                                <Text style={styles.locationButtonText}>
                                    Detecting your location...
                                </Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="navigate" size={16} color={Colors.primary} />
                                <Text style={styles.locationButtonText}>Use current location</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    {!!locationError && (
                        <View style={styles.locationErrorRow}>
                            <Ionicons name="alert-circle" size={13} color={Colors.danger} />
                            <Text style={styles.locationErrorText}>{locationError}</Text>
                        </View>
                    )}
                    <FormField
                        label="Street address"
                        value={venueData.location.address}
                        onChangeText={value => updateLocation('address', value)}
                        placeholder="Building, street, and number"
                        error={errors.address}
                    />
                    <FormField
                        label="Landmark (optional)"
                        value={venueData.location.landmark ?? ''}
                        onChangeText={value => updateLocation('landmark', value)}
                        placeholder="Nearby landmark"
                    />
                    <FormField
                        label="Area / locality"
                        value={venueData.location.area}
                        onChangeText={value => updateLocation('area', value)}
                        placeholder="Locality or neighborhood"
                        error={errors.area}
                    />
                    <SearchableDropdown
                        label="Venue state"
                        icon="map-outline"
                        placeholder="Search state"
                        value={venueData.location.state}
                        onChangeText={value => {
                            updateLocation('state', value);
                            updateLocation('city', '');
                            setVenueStatePlaceId(null);
                            setVenueCityPlaceId(null);
                            setVenueStateFromLocation(false);
                            setVenueCityFromLocation(false);
                            setErrors(previous => ({
                                ...previous,
                                venueState: '',
                                venueCity: '',
                            }));
                        }}
                        fetchOptions={fetchStateOptions}
                        onSelect={option => {
                            updateLocation('state', option.name);
                            updateLocation('city', '');
                            setVenueStatePlaceId(option.placeId);
                            setVenueCityPlaceId(null);
                            setVenueStateFromLocation(false);
                            setVenueCityFromLocation(false);
                            setErrors(previous => ({
                                ...previous,
                                venueState: '',
                                venueCity: '',
                            }));
                        }}
                        error={errors.venueState}
                    />
                    <SearchableDropdown
                        label="Venue city"
                        icon="location-outline"
                        placeholder="Search city"
                        disabledHint="Select a state first"
                        value={venueData.location.city}
                        onChangeText={value => {
                            updateLocation('city', value);
                            setVenueCityPlaceId(null);
                            setVenueCityFromLocation(false);
                            setErrors(previous => ({ ...previous, venueCity: '' }));
                        }}
                        fetchOptions={query =>
                            fetchCityOptions(query, venueData.location.state)
                        }
                        onSelect={option => {
                            updateLocation('city', option.name);
                            setVenueCityPlaceId(option.placeId);
                            setVenueCityFromLocation(false);
                            setErrors(previous => ({ ...previous, venueCity: '' }));
                        }}
                        error={errors.venueCity}
                        disabled={!venueStatePlaceId && !venueStateFromLocation}
                    />
                    <FormField
                        label="PIN code"
                        value={venueData.location.pincode}
                        onChangeText={value =>
                            updateLocation('pincode', value.replace(/\D/g, '').slice(0, 6))
                        }
                        placeholder="6-digit PIN code"
                        error={errors.pincode}
                        keyboardType="numeric"
                    />
                    <FormField
                        label="Google Maps link (optional)"
                        value={venueData.location.googleMapLink ?? ''}
                        onChangeText={value => updateLocation('googleMapLink', value)}
                        placeholder="https://maps.google.com/..."
                        keyboardType="url"
                        autoCapitalize="none"
                    />
                    <Text style={styles.fieldLabel}>PARKING</Text>
                    <View style={styles.choiceWrap}>
                        {(['None', 'Free', 'Paid', 'Both'] as const).map(type => (
                            <ChoicePill
                                key={type}
                                label={type === 'None' ? 'No parking' : type}
                                selected={venueData.parkingDetails?.type === type}
                                onPress={() =>
                                    setForm(previous => ({
                                        ...previous,
                                        venueData: {
                                            ...previous.venueData,
                                            parkingDetails:
                                                type === 'None'
                                                    ? {
                                                          type,
                                                          cars: {
                                                              capacity: 0,
                                                              isChargeable: false,
                                                          },
                                                          twoWheelers: {
                                                              capacity: 0,
                                                              isChargeable: false,
                                                          },
                                                      }
                                                    : previous.venueData.parkingDetails?.type ===
                                                      type
                                                    ? undefined
                                                    : {
                                                          type,
                                                          cars: {
                                                              capacity: 0,
                                                              isChargeable: type === 'Paid',
                                                          },
                                                          twoWheelers: {
                                                              capacity: 0,
                                                              isChargeable: type === 'Paid',
                                                          },
                                                      },
                                        },
                                    }))
                                }
                            />
                        ))}
                    </View>
                    {!!venueData.parkingDetails && venueData.parkingDetails.type !== 'None' && (
                        <View style={styles.parkingFields}>
                            <FormField
                                label="Car spaces"
                                value={String(venueData.parkingDetails.cars.capacity || '')}
                                onChangeText={value =>
                                    setForm(previous => ({
                                        ...previous,
                                        venueData: {
                                            ...previous.venueData,
                                            parkingDetails: {
                                                ...previous.venueData.parkingDetails!,
                                                cars: {
                                                    ...previous.venueData.parkingDetails!.cars,
                                                    capacity: parseOptionalNumber(value) ?? 0,
                                                },
                                            },
                                        },
                                    }))
                                }
                                placeholder="Number of cars"
                                keyboardType="numeric"
                            />
                            <FormField
                                label="Two-wheeler spaces"
                                value={String(venueData.parkingDetails.twoWheelers.capacity || '')}
                                onChangeText={value =>
                                    setForm(previous => ({
                                        ...previous,
                                        venueData: {
                                            ...previous.venueData,
                                            parkingDetails: {
                                                ...previous.venueData.parkingDetails!,
                                                twoWheelers: {
                                                    ...previous.venueData.parkingDetails!
                                                        .twoWheelers,
                                                    capacity: parseOptionalNumber(value) ?? 0,
                                                },
                                            },
                                        },
                                    }))
                                }
                                placeholder="Number of two-wheelers"
                                keyboardType="numeric"
                            />
                        </View>
                    )}
                </>
            );
        }
        if (stepIndex === 3) {
            const durations = [
                { key: 'perHour', label: 'Per hour', rateKey: 'hourly' },
                { key: 'halfDay', label: 'Half day', rateKey: 'halfDay' },
                { key: 'fullDay', label: 'Full day', rateKey: 'fullDay' },
            ] as const;
            const models: { key: PricingModel; label: string; detail: string }[] = [
                { key: 'onlyRent', label: 'Venue only', detail: 'Space rental without add-ons' },
                {
                    key: 'rentWithAmenities',
                    label: 'Venue + amenities',
                    detail: 'Space bundled with amenities',
                },
                { key: 'perPax', label: 'Per guest', detail: 'Price each guest pays' },
            ];
            return (
                <>
                    <Text style={styles.sectionIntro}>Choose when guests can book your venue.</Text>
                    <View style={styles.choiceWrap}>
                        {durations.map(duration => (
                            <ChoicePill
                                key={duration.key}
                                label={duration.label}
                                selected={venueData.pricing.enabledOptions[duration.key]}
                                onPress={() => toggleDuration(duration.key)}
                            />
                        ))}
                    </View>
                    {!!errors.enabledOptions && (
                        <Text style={styles.errorText}>{errors.enabledOptions}</Text>
                    )}
                    <Text style={[styles.fieldLabel, styles.sectionLabel]}>PRICING MODEL</Text>
                    <View style={styles.modelList}>
                        {models.map(model => (
                            <TouchableOpacity
                                key={model.key}
                                style={[
                                    styles.modelCard,
                                    venueData.pricing.selectedPricingModels.includes(model.key) &&
                                        styles.modelCardSelected,
                                ]}
                                onPress={() => togglePricingModel(model.key)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.modelCopy}>
                                    <Text style={styles.modelTitle}>{model.label}</Text>
                                    <Text style={styles.modelDetail}>{model.detail}</Text>
                                </View>
                                <Ionicons
                                    name={
                                        venueData.pricing.selectedPricingModels.includes(model.key)
                                            ? 'checkmark-circle'
                                            : 'ellipse-outline'
                                    }
                                    size={20}
                                    color={
                                        venueData.pricing.selectedPricingModels.includes(model.key)
                                            ? Colors.primaryDark
                                            : Colors.charcoalLight
                                    }
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    {!!errors.selectedPricingModels && (
                        <Text style={styles.errorText}>{errors.selectedPricingModels}</Text>
                    )}
                    {(['onlyRent', 'rentWithAmenities'] as const).map(
                        model =>
                            venueData.pricing.selectedPricingModels.includes(model) && (
                                <View key={model} style={styles.rateSection}>
                                    <Text style={styles.rateHeading}>
                                        {model === 'onlyRent'
                                            ? 'Venue only rates'
                                            : 'Venue + amenities rates'}
                                    </Text>
                                    {durations
                                        .filter(item => venueData.pricing.enabledOptions[item.key])
                                        .map(duration => {
                                            const rate =
                                                venueData.pricing[model]?.[duration.rateKey]?.rate;
                                            return (
                                                <FormField
                                                    key={`${model}-${duration.key}`}
                                                    label={`${duration.label} rate (â‚¹)`}
                                                    value={rate ? String(rate) : ''}
                                                    onChangeText={value =>
                                                        setRentalRate(
                                                            model,
                                                            duration.rateKey,
                                                            value,
                                                        )
                                                    }
                                                    placeholder="Enter amount"
                                                    keyboardType="numeric"
                                                />
                                            );
                                        })}
                                    {!!errors[model] && (
                                        <Text style={styles.errorText}>{errors[model]}</Text>
                                    )}
                                </View>
                            ),
                    )}
                    {venueData.pricing.selectedPricingModels.includes('perPax') && (
                        <View style={styles.rateSection}>
                            <Text style={styles.rateHeading}>Per guest Â· without food</Text>
                            <FormField
                                label="Rate per guest (â‚¹)"
                                value={
                                    venueData.pricing.perPax?.withoutFood?.rate
                                        ? String(venueData.pricing.perPax.withoutFood.rate)
                                        : ''
                                }
                                onChangeText={value => setPerPaxRate('rate', value)}
                                placeholder="Enter amount"
                                keyboardType="numeric"
                            />
                            <FormField
                                label="Minimum guests"
                                value={
                                    venueData.pricing.perPax?.withoutFood?.minPax
                                        ? String(venueData.pricing.perPax.withoutFood.minPax)
                                        : ''
                                }
                                onChangeText={value => setPerPaxRate('minPax', value)}
                                placeholder="e.g. 50"
                                keyboardType="numeric"
                            />
                            {!!errors.perPax && (
                                <Text style={styles.errorText}>{errors.perPax}</Text>
                            )}
                        </View>
                    )}
                </>
            );
        }

        return (
            <>
                <View style={styles.photoIntro}>
                    <View style={styles.photoIntroIcon}>
                        <Ionicons name="images-outline" size={20} color={Colors.primaryDark} />
                    </View>
                    <View style={styles.photoIntroCopy}>
                        <Text style={styles.photoIntroTitle}>Show guests your space</Text>
                        <Text style={styles.photoIntroText}>
                            Add clear, well-lit photos. The first image will be featured.
                        </Text>
                    </View>
                </View>
                {PHOTO_SLOTS.map(slot => {
                    const photo = photos[slot.key];
                    return (
                        <View key={slot.key} style={styles.photoCard}>
                            {photo ? (
                                <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                            ) : (
                                <View style={styles.photoPlaceholder}>
                                    <Ionicons
                                        name="image-outline"
                                        size={25}
                                        color={Colors.charcoalLight}
                                    />
                                </View>
                            )}
                            <View style={styles.photoCopy}>
                                <Text style={styles.photoTitle}>
                                    {slot.label}
                                    {slot.required && <Text style={styles.requiredMark}> *</Text>}
                                </Text>
                                <Text style={styles.photoHint}>
                                    {photo ? 'Photo selected' : slot.hint}
                                </Text>
                                {!!errors[slot.key] && (
                                    <Text style={styles.errorText}>{errors[slot.key]}</Text>
                                )}
                            </View>
                            <TouchableOpacity
                                style={styles.photoAction}
                                onPress={() => void pickPhoto(slot.key)}
                                accessibilityLabel={`${photo ? 'Change' : 'Add'} ${
                                    slot.label
                                } photo`}
                            >
                                <Ionicons
                                    name={photo ? 'refresh-outline' : 'add'}
                                    size={20}
                                    color={Colors.primaryDark}
                                />
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </>
        );
    };

    const isLastStep = stepIndex === STEP_LABELS.length - 1;

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Modal
                visible={otpStep !== 'none'}
                transparent
                animationType="fade"
                onRequestClose={() => setOtpStep('none')}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Ionicons
                                name="phone-portrait-outline"
                                size={28}
                                color={Colors.primary}
                            />
                            <Text style={styles.modalTitle}>Verify phone number</Text>
                            <Text style={styles.modalSubtitle}>
                                Enter the OTP sent to{' '}
                                <Text style={styles.modalPhone}>{form.phone}</Text>
                            </Text>
                        </View>
                        <TextInput
                            style={[styles.otpInput, !!otpError && styles.inputError]}
                            value={otpValue}
                            onChangeText={value => {
                                setOtpValue(value.replace(/\D/g, '').slice(0, 6));
                                setOtpError('');
                            }}
                            keyboardType="number-pad"
                            maxLength={6}
                            placeholder="------"
                            placeholderTextColor={Colors.charcoalLight}
                            textAlign="center"
                        />
                        {!!otpError && <Text style={styles.errorText}>{otpError}</Text>}
                        <TouchableOpacity
                            style={[
                                styles.otpVerifyButton,
                                verifyingPhoneOtp && styles.buttonDisabled,
                            ]}
                            onPress={handleVerifyPhoneOtp}
                            disabled={verifyingPhoneOtp}
                            activeOpacity={0.85}
                        >
                            {verifyingPhoneOtp ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                            ) : (
                                <Text style={styles.nextText}>Verify OTP</Text>
                            )}
                        </TouchableOpacity>
                        <View style={styles.modalFooterRow}>
                            <TouchableOpacity
                                onPress={handleSendPhoneOtp}
                                disabled={sendingPhoneOtp}
                            >
                                <Text style={styles.resendText}>
                                    {sendingPhoneOtp ? 'Sending...' : 'Resend OTP'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setOtpStep('none')}>
                                <Text style={[styles.resendText, styles.cancelText]}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <ScrollView
                ref={scrollRef}
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.arcTop} />
                <View style={styles.topBar}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={goBack}
                        accessibilityLabel="Go back"
                    >
                        <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
                    </TouchableOpacity>
                    <Text style={styles.topBarTitle}>Owner registration</Text>
                    <View style={styles.topBarSpacer} />
                </View>
                <View style={styles.stepIndicator}>
                    <StepIndicator steps={STEP_LABELS} currentIndex={stepIndex} />
                </View>
                <View style={styles.heading}>
                    <Text style={styles.stepCounter}>
                        STEP {stepIndex + 1} OF {STEP_LABELS.length}
                    </Text>
                    <Text style={styles.title}>
                        {
                            [
                                'Create your account',
                                'Tell us about your venue',
                                'Where can guests find you?',
                                'Set your pricing',
                                'Add venue photos',
                            ][stepIndex]
                        }
                    </Text>
                    <Text style={styles.subtitle}>
                        {
                            [
                                'Your account details and where you are based.',
                                'Share the details guests need to find the right space.',
                                'Add your venue address and parking information.',
                                'Choose your booking options and set clear rates.',
                                'A few great photos help your listing stand out.',
                            ][stepIndex]
                        }
                    </Text>
                </View>
                <View style={styles.formCard}>
                    {renderStep()}
                    <View style={styles.footer}>
                        {stepIndex > 0 && (
                            <TouchableOpacity
                                style={styles.previousButton}
                                onPress={goBack}
                                disabled={submitting}
                            >
                                <Ionicons
                                    name="chevron-back"
                                    size={18}
                                    color={Colors.charcoalMid}
                                />
                                <Text style={styles.previousText}>Back</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.nextButton, submitting && styles.buttonDisabled]}
                            onPress={goNext}
                            disabled={submitting}
                            activeOpacity={0.85}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                            ) : (
                                <>
                                    <Text style={styles.nextText}>
                                        {isLastStep ? 'Create account' : 'Continue'}
                                    </Text>
                                    <Ionicons
                                        name={isLastStep ? 'checkmark' : 'chevron-forward'}
                                        size={18}
                                        color={Colors.white}
                                    />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.loginRow}>
                    <Text style={styles.loginText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('login')}>
                        <Text style={styles.loginLink}>Sign in</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: 36 },
    arcTop: {
        position: 'absolute',
        top: -210,
        left: -100,
        width: 420,
        height: 420,
        borderRadius: 210,
        backgroundColor: Colors.primaryLight,
        opacity: 0.55,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 18,
        paddingBottom: Spacing.md,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: Radii.md,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.card,
    },
    topBarTitle: { fontSize: 16, fontWeight: Typography.bold, color: Colors.charcoal },
    topBarSpacer: { width: 44 },
    stepIndicator: { marginTop: Spacing.sm, marginBottom: Spacing.md },
    heading: { marginBottom: Spacing.lg },
    stepCounter: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.primaryDark,
        letterSpacing: 1.5,
        marginBottom: Spacing.xs,
    },
    title: {
        fontSize: 27,
        lineHeight: 33,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.6,
    },
    subtitle: {
        fontSize: Typography.md,
        color: Colors.charcoalLight,
        lineHeight: 21,
        marginTop: Spacing.xs,
    },
    formCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xxl,
        padding: Spacing.lg,
        ...Shadows.header,
    },
    fieldWrap: { marginBottom: Spacing.md },
    fieldLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.7,
        textTransform: 'uppercase',
        marginBottom: Spacing.xs,
    },
    input: {
        minHeight: 52,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.md,
        fontSize: 15,
        color: Colors.charcoal,
    },
    multilineInput: { minHeight: 108, paddingTop: Spacing.md },
    inputError: { borderColor: Colors.danger },
    errorText: {
        color: Colors.danger,
        fontSize: 11,
        fontWeight: Typography.semiBold,
        marginTop: 5,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        borderRadius: Radii.md,
        paddingVertical: 12,
        backgroundColor: Colors.primaryLight,
        marginBottom: Spacing.md,
    },
    locationButtonText: {
        fontSize: Typography.md,
        fontWeight: Typography.semiBold,
        color: Colors.primary,
    },
    locationErrorRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.xs,
        marginTop: -Spacing.sm,
        marginBottom: Spacing.md,
    },
    locationErrorText: {
        flex: 1,
        fontSize: Typography.sm,
        color: Colors.danger,
    },
    verifyButton: {
        alignSelf: 'flex-start',
        marginTop: -Spacing.xs,
        marginBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        backgroundColor: Colors.primaryHighLight,
    },
    verifyButtonText: {
        color: Colors.primaryDark,
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: -Spacing.xs,
        marginBottom: Spacing.md,
    },
    verifiedText: {
        color: Colors.success,
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
    },
    choiceWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    choicePill: {
        minHeight: 40,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
    },
    choicePillSelected: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
    choiceText: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    choiceTextSelected: { color: Colors.primaryDark, fontWeight: Typography.bold },
    sectionIntro: {
        color: Colors.charcoalLight,
        fontSize: Typography.md,
        marginBottom: Spacing.md,
    },
    sectionLabel: { marginTop: Spacing.xs },
    modelList: { gap: Spacing.sm, marginBottom: Spacing.md },
    modelCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.md,
        padding: Spacing.md,
        backgroundColor: Colors.background,
    },
    modelCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryHighLight },
    modelCopy: { flex: 1 },
    modelTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.charcoal },
    modelDetail: { fontSize: Typography.sm, color: Colors.charcoalLight, marginTop: 3 },
    rateSection: {
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
        paddingTop: Spacing.md,
        marginTop: Spacing.xs,
    },
    rateHeading: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginBottom: Spacing.md,
    },
    parkingFields: { marginTop: Spacing.xs },
    photoIntro: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: Colors.primaryHighLight,
        borderRadius: Radii.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    photoIntroIcon: {
        width: 42,
        height: 42,
        borderRadius: Radii.md,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoIntroCopy: { flex: 1 },
    photoIntroTitle: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    photoIntroText: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        lineHeight: 17,
        marginTop: 3,
    },
    photoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    photoPreview: { width: 58, height: 58, borderRadius: Radii.sm, backgroundColor: Colors.border },
    photoPlaceholder: {
        width: 58,
        height: 58,
        borderRadius: Radii.sm,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoCopy: { flex: 1 },
    photoTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.charcoal },
    photoHint: { color: Colors.charcoalLight, fontSize: Typography.sm, marginTop: 4 },
    requiredMark: { color: Colors.danger },
    photoAction: {
        width: 38,
        height: 38,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        backgroundColor: Colors.primaryHighLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        flexDirection: 'row',
        gap: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: Spacing.md,
        marginTop: Spacing.md,
    },
    previousButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        minWidth: 86,
        height: 54,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.md,
    },
    previousText: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
    },
    nextButton: {
        flex: 1,
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        borderRadius: Radii.md,
        backgroundColor: Colors.primary,
        ...Shadows.primary,
    },
    buttonDisabled: { opacity: 0.7 },
    nextText: { color: Colors.white, fontSize: Typography.md, fontWeight: Typography.extraBold },
    loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
    loginText: { fontSize: Typography.md, color: Colors.charcoalLight },
    loginLink: {
        fontSize: Typography.md,
        fontWeight: Typography.extraBold,
        color: Colors.primaryDark,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    modalCard: {
        width: '100%',
        padding: Spacing.xl,
        borderRadius: Radii.xxl,
        backgroundColor: Colors.surface,
        ...Shadows.floating,
    },
    modalHeader: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
    modalTitle: {
        color: Colors.charcoal,
        fontSize: 20,
        fontWeight: Typography.extraBold,
    },
    modalSubtitle: {
        color: Colors.charcoalLight,
        textAlign: 'center',
        lineHeight: 20,
        fontSize: Typography.md,
    },
    modalPhone: { color: Colors.charcoal, fontWeight: Typography.bold },
    otpInput: {
        height: 56,
        marginBottom: Spacing.sm,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        color: Colors.charcoal,
        fontSize: 22,
        fontWeight: Typography.extraBold,
        letterSpacing: 8,
    },
    otpVerifyButton: {
        height: 54,
        marginTop: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Radii.md,
        backgroundColor: Colors.primary,
        ...Shadows.primary,
    },
    modalFooterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.lg,
    },
    resendText: {
        color: Colors.primaryDark,
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
    },
    cancelText: { color: Colors.danger },
});

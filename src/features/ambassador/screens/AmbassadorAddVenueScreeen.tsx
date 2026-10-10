import { useState } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import Field from '@/components/UI/InputField';
import SearchableDropdown, { DropdownOption } from '@/components/UI/SearchableDropDown';
import SelectField from '@/features/auth/components/SelectField';
import { useAlert } from '@/context/AlertContext';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import { getCitiesByState, getStates } from '@/utils/location';
import {
    getCurrentCoordinates,
    LocationPermissionDeniedError,
    LocationTimeoutError,
} from '@/utils/deviceLocation';
import { coordinatesToAddress } from '@/utils/geocoding';
import { useCreateVenue } from '@/features/venue/hooks/useCreateVenue';
import { useUploadImage } from '@/features/venue/hooks/useUpload';
import { AmbassadorAddVenue, PricingModel } from '../types/AmbassadorAddVenue';
import { useSendPhoneOtp, useVerifyPhoneOtp } from '@/features/auth/hooks/useVerfication';
import { ApiError } from '@/types/ApiError';

const STEP_TITLES = ['Venue details', 'Owner contact', 'Location', 'Pricing & parking', 'Photos'];
const VENUE_TYPES = [
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
const PRICING_DURATIONS = [
    { rateKey: 'hourly', label: 'Hourly' },
    { rateKey: 'halfDay', label: 'Half Day (4 Hrs)' },
    { rateKey: 'fullDay', label: 'Full Day (12 Hrs)' },
] as const;
const PER_PAX_OPTIONS = [
    { key: 'withoutFood', label: 'Per Pax without food' },
    { key: 'breakfastOnly', label: 'Per Pax with only breakfast' },
    { key: 'breakfastLunch', label: 'Per Pax with breakfast + lunch' },
    { key: 'lunchOnly', label: 'Per Pax with only lunch' },
    { key: 'dinnerOnly', label: 'Per Pax with only dinner' },
    { key: 'allMeals', label: 'Per Pax with breakfast + lunch + dinner' },
] as const;
const PRICING_MODELS: { key: PricingModel; label: string }[] = [
    { key: 'onlyRent', label: 'Only Rent' },
    { key: 'rentWithAmenities', label: 'Rent (Included Amenities)' },
    { key: 'perPax', label: 'Per Pax' },
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
];
const STEP_SUBTITLES = [
    'Introduce the venue and what makes it a good fit.',
    'Add the owner’s contact details for follow-up.',
    'Help guests find the right location.',
    'Share booking rates and available parking.',
    'Add clear photos and confirm the listing details.',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ambassadorAddVenue'>;
type VenuePhoto = { uri: string; base64: string; type: string; fileName: string };
type FormErrors = Record<string, string>;
type OtpStep = 'none' | 'phone';

const createInitialForm = (): AmbassadorAddVenue => ({
    businessName: '',
    description: '',
    venueType: [],
    foodType: 'Both',
    capacity: '',
    areaSqft: 0,
    termsAccepted: false,
    listingSource: 'ambassador',
    onboardingPhase: 5,
    isProvisional: true,
    ownerInfo: {
        fullName: '',
        mobile: '',
        email: '',
        authorisedPerson: { name: '', fullName: '', phone: '', mobile: '', email: '' },
    },
    location: {
        address: '',
        landmark: '',
        state: '',
        city: '',
        area: '',
        pincode: '',
        googleMapLink: '',
        parkingAvailability: 'None',
        parkingDetails: {
            type: 'None',
            carsCapacity: 0,
            twoWheelerCapacity: 0,
            carCharges: 0,
            twoWheelerCharges: 0,
        },
    },
    pricing: {
        selectedPricingModels: [],
        onlyRent: {
            hourly: { rate: 0, extraPerHour: 0 },
            halfDay: { rate: 0, extraPerHour: 0 },
            fullDay: { rate: 0, extraPerHour: 0 },
        },
        rentWithAmenities: {
            hourly: { rate: 0, extraPerHour: 0 },
            halfDay: { rate: 0, extraPerHour: 0 },
            fullDay: { rate: 0, extraPerHour: 0 },
        },
        perPax: {
            withoutFood: { rate: 0, minPax: 0 },
            breakfastOnly: { rate: 0, minPax: 0 },
            breakfastLunch: { rate: 0, minPax: 0 },
            lunchOnly: { rate: 0, minPax: 0 },
            dinnerOnly: { rate: 0, minPax: 0 },
            allMeals: { rate: 0, minPax: 0 },
        },
    },
    images: [],
});

function FormSection({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {!!description && <Text style={styles.sectionDescription}>{description}</Text>}
            {children}
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

export const AmbassadorAddVenueScreen = ({ navigation }: Props) => {
    const alert = useAlert();
    const queryClient = useQueryClient();
    const { mutateAsync: createVenue, isPending } = useCreateVenue();
    const { mutateAsync: uploadImage, isPending: isUploading } = useUploadImage();
    const { mutate: sendPhoneOtp, isPending: sendingPhoneOtp } = useSendPhoneOtp();
    const { mutate: verifyPhoneOtp, isPending: verifyingPhoneOtp } = useVerifyPhoneOtp();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<AmbassadorAddVenue>(createInitialForm);
    const [photos, setPhotos] = useState<Record<string, VenuePhoto>>({});
    const [errors, setErrors] = useState<FormErrors>({});
    const [statePlaceId, setStatePlaceId] = useState<string | null>(null);
    const [cityPlaceId, setCityPlaceId] = useState<string | null>(null);
    const [stateFromLocation, setStateFromLocation] = useState(false);
    const [cityFromLocation, setCityFromLocation] = useState(false);
    const [verifiedPhone, setVerifiedPhone] = useState('');
    const [otpPhone, setOtpPhone] = useState('');
    const [otpStep, setOtpStep] = useState<OtpStep>('none');
    const [otpValue, setOtpValue] = useState('');
    const [otpError, setOtpError] = useState('');
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const phoneVerified = verifiedPhone === form.ownerInfo.mobile && !!verifiedPhone;

    const clearError = (key: string) => setErrors(previous => ({ ...previous, [key]: '' }));

    const fetchStateOptions = async (query: string): Promise<DropdownOption[]> =>
        (await getStates(query)).map(({ name, placeId }) => ({ name, placeId }));

    const fetchCityOptions = async (query: string): Promise<DropdownOption[]> =>
        (await getCitiesByState(query, form.location.state)).map(({ name, placeId }) => ({
            name,
            placeId,
        }));

    const validateStep = (): boolean => {
        const nextErrors: FormErrors = {};
        if (step === 0) {
            if (!form.businessName.trim()) nextErrors.businessName = 'Enter the venue name';
            if (form.venueType.length === 0) nextErrors.venueType = 'Choose a venue type';
            if (!form.description.trim()) nextErrors.description = 'Add a short venue description';
            if (!form.capacity) nextErrors.capacity = 'Select the venue capacity';
            if (form.areaSqft <= 0) nextErrors.areaSqft = 'Enter the venue area';
        } else if (step === 1) {
            if (!form.ownerInfo.fullName.trim()) nextErrors.fullName = 'Enter the owner’s name';
            if (!/^[6-9]\d{9}$/.test(form.ownerInfo.mobile)) {
                nextErrors.mobile = 'Enter a valid 10-digit mobile number';
            } else if (!phoneVerified) {
                nextErrors.mobile = 'Verify the owner’s mobile number first';
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerInfo.email.trim())) {
                nextErrors.email = 'Enter a valid email address';
            }
        } else if (step === 2) {
            if (!form.location.address.trim()) nextErrors.address = 'Enter the street address';
            if (!form.location.area.trim()) nextErrors.area = 'Enter the area or locality';
            if (!statePlaceId && !stateFromLocation) {
                nextErrors.state = 'Select a state or use current location';
            }
            if (!cityPlaceId && !cityFromLocation) {
                nextErrors.city = 'Select a city or use current location';
            }
            if (!/^\d{6}$/.test(form.location.pincode)) {
                nextErrors.pincode = 'Enter a valid 6-digit PIN code';
            }
        } else if (step === 3) {
            if (form.pricing.selectedPricingModels.length === 0) {
                nextErrors.selectedPricingModels = 'Choose at least one pricing model';
            }
            if (form.pricing.selectedPricingModels.includes('onlyRent')) {
                const hasRentRate = Object.values(form.pricing.onlyRent).some(
                    rate => rate.rate > 0,
                );
                if (!hasRentRate) {
                    nextErrors.onlyRent = 'Add at least one venue-only rate';
                }
            }
            if (form.pricing.selectedPricingModels.includes('rentWithAmenities')) {
                const hasAmenitiesRate = Object.values(form.pricing.rentWithAmenities).some(
                    rate => rate.rate > 0,
                );
                if (!hasAmenitiesRate) {
                    nextErrors.rentWithAmenities = 'Add at least one venue + amenities rate';
                }
            }
            if (
                form.pricing.selectedPricingModels.includes('perPax') &&
                !Object.values(form.pricing.perPax).some(rate => rate.rate > 0)
            ) {
                nextErrors.perPax = 'Add a rate for at least one per-person package';
            }
        } else {
            PHOTO_SLOTS.forEach(({ key, label, required }) => {
                if (!photos[key] && required) nextErrors[key] = `Add a ${label.toLowerCase()} photo`;
            });
            if (!form.termsAccepted) nextErrors.termsAccepted = 'Confirm before submitting';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSendPhoneOtp = () => {
        if (!/^[6-9]\d{9}$/.test(form.ownerInfo.mobile)) {
            setErrors(previous => ({
                ...previous,
                mobile: 'Enter a valid 10-digit mobile number',
            }));
            return;
        }
        setOtpValue('');
        setOtpError('');
        setOtpPhone(form.ownerInfo.mobile);
        sendPhoneOtp(
            { phone: form.ownerInfo.mobile, name: form.ownerInfo.fullName },
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
            { phone: otpPhone, otp: otpValue },
            {
                onSuccess: () => {
                    setVerifiedPhone(otpPhone);
                    setOtpStep('none');
                    setOtpError('');
                    clearError('mobile');
                    alert.success('OTP verified', 'Owner’s mobile number verified successfully.');
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
                    'Could not determine an address here. Please search or enter the details manually.',
                );
                return;
            }

            setForm(previous => ({
                ...previous,
                location: {
                    ...previous.location,
                    address:
                        address.addressLine ||
                        address.formattedAddress ||
                        previous.location.address,
                    area: address.addressLine || previous.location.area,
                    city: address.city || previous.location.city,
                    state: address.state || previous.location.state,
                    pincode: address.pincode || previous.location.pincode,
                    googleMapLink: `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`,
                },
            }));
            setStatePlaceId(null);
            setCityPlaceId(null);
            setStateFromLocation(!!address.state);
            setCityFromLocation(!!address.city);
            setErrors(previous => ({
                ...previous,
                address: '',
                area: '',
                state: '',
                city: '',
                pincode: '',
            }));
        } catch (error) {
            if (error instanceof LocationPermissionDeniedError) {
                setLocationError('Location permission denied. Enable it in settings to continue.');
            } else if (error instanceof LocationTimeoutError) {
                setLocationError(error.message);
            } else {
                console.error('Error detecting current venue location:', error);
                setLocationError('Could not access your location. Please enter it manually.');
            }
        } finally {
            setLocating(false);
        }
    };

    const updatePhoto = async (slotKey: string) => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                selectionLimit: 1,
                quality: 0.4,
                includeBase64: true,
            });
            if (result.didCancel) return;
            if (result.errorCode) {
                alert.error(
                    'Photo selection failed',
                    result.errorMessage || 'Could not open your photo library.',
                );
                return;
            }
            const asset = result.assets?.[0];
            if (!asset?.uri || !asset.base64) {
                alert.error('Photo unavailable', 'Choose another photo and try again.');
                return;
            }
            setPhotos(previous => ({
                ...previous,
                [slotKey]: {
                    uri: asset.uri!,
                    base64: asset.base64!,
                    type: asset.type || 'image/jpeg',
                    fileName: asset.fileName || `${slotKey.replace(/[^a-z0-9]/gi, '-')}.jpg`,
                },
            }));
            clearError(slotKey);
        } catch (error) {
            alert.error(
                'Photo selection failed',
                error instanceof Error ? error.message : 'Could not select this photo.',
            );
        }
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;
        try {
            const images: AmbassadorAddVenue['images'] = [];
            for (const slot of PHOTO_SLOTS) {
                const photo = photos[slot.key];
                if (!photo) continue;
                const response = await uploadImage({
                    file: `data:${photo.type};base64,${photo.base64}`,
                    folder: 'venues',
                });
                if (!response?.success || typeof response.url !== 'string') {
                    throw new Error(`Could not upload the ${slot.label.toLowerCase()} photo.`);
                }
                images.push({
                    url: response.url,
                    category: slot.key,
                    isFeatured: images.length === 0,
                });
            }

            await createVenue({
                ...form,
                images,
                ownerInfo: {
                    ...form.ownerInfo,
                    authorisedPerson: {
                        name: form.ownerInfo.fullName,
                        fullName: form.ownerInfo.fullName,
                        phone: form.ownerInfo.mobile,
                        mobile: form.ownerInfo.mobile,
                        email: form.ownerInfo.email,
                    },
                },
            });
            await queryClient.invalidateQueries({ queryKey: ['getAmbassadorVenues'] });
            alert.success('Venue submitted', 'Your venue has been sent for review.');
            navigation.goBack();
        } catch (error) {
            alert.error(
                'Submission failed',
                error instanceof Error ? error.message : 'Could not submit this venue.',
            );
        }
    };

    const goNext = () => {
        if (!validateStep()) return;
        if (step === STEP_TITLES.length - 1) {
            void handleSubmit();
            return;
        }
        setErrors({});
        setStep(current => current + 1);
    };

    const renderVenueDetails = () => (
        <>
            <FormSection
                title="Venue profile"
                description="Start with the details guests will use to understand your venue."
            >
                <Field
                    label="Venue name *"
                    placeholder="e.g. The Grand Garden"
                    icon="business-outline"
                    value={form.businessName}
                    onChangeText={value => {
                        setForm(previous => ({ ...previous, businessName: value }));
                        clearError('businessName');
                    }}
                    error={errors.businessName}
                    autoCapitalize="words"
                />
                <Text style={styles.fieldLabel}>VENUE TYPE *</Text>
                <View style={styles.choiceWrap}>
                    {VENUE_TYPES.map(type => (
                        <ChoicePill
                            key={type}
                            label={type}
                            selected={form.venueType.includes(type)}
                            onPress={() => {
                                setForm(previous => ({
                                    ...previous,
                                    venueType: previous.venueType.includes(type)
                                        ? previous.venueType.filter(item => item !== type)
                                        : [...previous.venueType, type],
                                }));
                                clearError('venueType');
                            }}
                        />
                    ))}
                </View>
                {!!errors.venueType && <Text style={styles.errorText}>{errors.venueType}</Text>}
                <View style={styles.multilineField}>
                    <Text style={styles.fieldLabel}>ABOUT THE VENUE *</Text>
                    <TextInput
                        style={[styles.textArea, !!errors.description && styles.inputError]}
                        value={form.description}
                        onChangeText={value => {
                            setForm(previous => ({ ...previous, description: value }));
                            clearError('description');
                        }}
                        placeholder="Describe the space, facilities, and what makes it special"
                        placeholderTextColor={Colors.charcoalLight}
                        multiline
                        textAlignVertical="top"
                        maxLength={1000}
                    />
                    {!!errors.description && (
                        <Text style={styles.errorText}>{errors.description}</Text>
                    )}
                </View>
                <SelectField
                    label="Guest capacity *"
                    value={form.capacity}
                    options={CAPACITY_OPTIONS}
                    onSelect={value => {
                        setForm(previous => ({ ...previous, capacity: value }));
                        clearError('capacity');
                    }}
                    error={errors.capacity}
                    placeholder="Choose a range"
                />
                <Field
                    label="Venue area (sq. ft.) *"
                    placeholder="e.g. 2500"
                    icon="resize-outline"
                    value={form.areaSqft ? String(form.areaSqft) : ''}
                    onChangeText={value => {
                        const area = Number(value.replace(/\D/g, ''));
                        setForm(previous => ({ ...previous, areaSqft: area }));
                        clearError('areaSqft');
                    }}
                    error={errors.areaSqft}
                    keyboardType="numeric"
                />
                <Text style={styles.fieldLabel}>FOOD SERVICE</Text>
                <View style={styles.choiceWrap}>
                    {(['Veg', 'Non Veg', 'Both'] as const).map(foodType => (
                        <ChoicePill
                            key={foodType}
                            label={foodType}
                            selected={form.foodType === foodType}
                            onPress={() => setForm(previous => ({ ...previous, foodType }))}
                        />
                    ))}
                </View>
            </FormSection>
        </>
    );

    const renderOwnerContact = () => (
        <FormSection
            title="Owner contact"
            description="We’ll use these details to coordinate venue verification."
        >
            <Field
                label="Owner full name *"
                placeholder="Owner’s name"
                icon="person-outline"
                value={form.ownerInfo.fullName}
                onChangeText={value => {
                    setForm(previous => ({
                        ...previous,
                        ownerInfo: { ...previous.ownerInfo, fullName: value },
                    }));
                    clearError('fullName');
                }}
                error={errors.fullName}
                autoCapitalize="words"
            />
            <Field
                label="Mobile number *"
                placeholder="10-digit mobile number"
                icon="call-outline"
                value={form.ownerInfo.mobile}
                onChangeText={value => {
                    setForm(previous => ({
                        ...previous,
                        ownerInfo: {
                            ...previous.ownerInfo,
                            mobile: value.replace(/\D/g, '').slice(0, 10),
                        },
                    }));
                    setVerifiedPhone('');
                    setOtpStep('none');
                    setOtpValue('');
                    clearError('mobile');
                }}
                error={errors.mobile}
                keyboardType="phone-pad"
                maxLength={10}
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
                        <Text style={styles.verifyButtonText}>Verify mobile number</Text>
                    )}
                </TouchableOpacity>
            ) : (
                <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={15} color={Colors.success} />
                    <Text style={styles.verifiedText}>Mobile number verified</Text>
                </View>
            )}
            <Field
                label="Email address *"
                placeholder="owner@example.com"
                icon="mail-outline"
                value={form.ownerInfo.email}
                onChangeText={value => {
                    setForm(previous => ({
                        ...previous,
                        ownerInfo: { ...previous.ownerInfo, email: value },
                    }));
                    clearError('email');
                }}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
            />
        </FormSection>
    );

    const renderLocation = () => (
        <FormSection
            title="Venue location"
            description="Use your current location or search and select a city and state."
        >
            <TouchableOpacity
                style={[styles.locationButton, locating && styles.buttonDisabled]}
                onPress={() => void handleUseCurrentLocation()}
                disabled={locating}
                activeOpacity={0.8}
            >
                {locating ? (
                    <>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.locationButtonText}>Detecting your location...</Text>
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
            <Field
                label="Street address *"
                placeholder="Building, street, and number"
                icon="home-outline"
                value={form.location.address}
                onChangeText={value => {
                    setForm(previous => ({
                        ...previous,
                        location: { ...previous.location, address: value },
                    }));
                    clearError('address');
                }}
                error={errors.address}
            />
            <Field
                label="Landmark"
                placeholder="Nearby landmark (optional)"
                icon="flag-outline"
                value={form.location.landmark}
                onChangeText={value =>
                    setForm(previous => ({
                        ...previous,
                        location: { ...previous.location, landmark: value },
                    }))
                }
            />
            <Field
                label="Area / locality *"
                placeholder="Locality or neighborhood"
                icon="navigate-outline"
                value={form.location.area}
                onChangeText={value => {
                    setForm(previous => ({
                        ...previous,
                        location: { ...previous.location, area: value },
                    }));
                    clearError('area');
                }}
                error={errors.area}
            />
            <SearchableDropdown
                label="State *"
                icon="map-outline"
                placeholder="Search state"
                value={form.location.state}
                onChangeText={value => {
                    setForm(previous => ({
                        ...previous,
                        location: { ...previous.location, state: value, city: '' },
                    }));
                    setStatePlaceId(null);
                    setCityPlaceId(null);
                    setStateFromLocation(false);
                    setCityFromLocation(false);
                    setErrors(previous => ({ ...previous, state: '', city: '' }));
                }}
                fetchOptions={fetchStateOptions}
                onSelect={option => {
                    setForm(previous => ({
                        ...previous,
                        location: { ...previous.location, state: option.name, city: '' },
                    }));
                    setStatePlaceId(option.placeId);
                    setCityPlaceId(null);
                    setStateFromLocation(false);
                    setCityFromLocation(false);
                    setErrors(previous => ({ ...previous, state: '', city: '' }));
                }}
                error={errors.state}
            />
            <SearchableDropdown
                label="City *"
                icon="location-outline"
                placeholder="Search city"
                disabledHint="Select a state first"
                value={form.location.city}
                onChangeText={value => {
                    setForm(previous => ({
                        ...previous,
                        location: { ...previous.location, city: value },
                    }));
                    setCityPlaceId(null);
                    setCityFromLocation(false);
                    clearError('city');
                }}
                fetchOptions={fetchCityOptions}
                onSelect={option => {
                    setForm(previous => ({
                        ...previous,
                        location: { ...previous.location, city: option.name },
                    }));
                    setCityPlaceId(option.placeId);
                    setCityFromLocation(false);
                    clearError('city');
                }}
                error={errors.city}
                disabled={!statePlaceId && !stateFromLocation}
            />
            <Field
                label="PIN code *"
                placeholder="6-digit PIN code"
                icon="keypad-outline"
                value={form.location.pincode}
                onChangeText={value => {
                    setForm(previous => ({
                        ...previous,
                        location: {
                            ...previous.location,
                            pincode: value.replace(/\D/g, '').slice(0, 6),
                        },
                    }));
                    clearError('pincode');
                }}
                error={errors.pincode}
                keyboardType="number-pad"
                maxLength={6}
            />
            <Field
                label="Google Maps link"
                placeholder="https://maps.google.com/..."
                icon="map-outline"
                value={form.location.googleMapLink}
                onChangeText={value =>
                    setForm(previous => ({
                        ...previous,
                        location: { ...previous.location, googleMapLink: value },
                    }))
                }
                autoCapitalize="none"
            />
        </FormSection>
    );

    const togglePricingModel = (model: PricingModel) => {
        setForm(previous => {
            const selected = previous.pricing.selectedPricingModels;
            return {
                ...previous,
                pricing: {
                    ...previous.pricing,
                    selectedPricingModels: selected.includes(model)
                        ? selected.filter(value => value !== model)
                        : [...selected, model],
                },
            };
        });
        clearError('selectedPricingModels');
        clearError(model);
    };

    const setRate = (
        model: 'onlyRent' | 'rentWithAmenities',
        duration: 'hourly' | 'halfDay' | 'fullDay',
        field: 'rate' | 'extraPerHour',
        value: string,
    ) => {
        const rate = Number(value.replace(/\D/g, '')) || 0;
        setForm(previous => ({
            ...previous,
            pricing: {
                ...previous.pricing,
                [model]: {
                    ...previous.pricing[model],
                    [duration]: {
                        ...previous.pricing[model][duration],
                        [field]: rate,
                    },
                },
            },
        }));
        clearError(model);
    };

    const setPerPaxValue = (
        packageKey: (typeof PER_PAX_OPTIONS)[number]['key'],
        field: 'rate' | 'minPax',
        value: string,
    ) => {
        const amount = Number(value.replace(/\D/g, '')) || 0;
        setForm(previous => ({
            ...previous,
            pricing: {
                ...previous.pricing,
                perPax: {
                    ...previous.pricing.perPax,
                    [packageKey]: {
                        ...previous.pricing.perPax[packageKey],
                        [field]: amount,
                    },
                },
            },
        }));
        clearError('perPax');
    };

    const renderPricing = () => (
        <FormSection
            title="Pricing model"
            description="Select applicable pricing models, then add rates for each duration or meal package."
        >
            <Text style={styles.fieldLabel}>SELECT APPLICABLE PRICING MODELS *</Text>
            <View style={styles.pricingModelChoices}>
                {PRICING_MODELS.map(model => (
                    <TouchableOpacity
                        key={model.key}
                        style={[
                            styles.pricingModelChoice,
                            form.pricing.selectedPricingModels.includes(model.key) &&
                                styles.pricingModelChoiceSelected,
                        ]}
                        onPress={() => togglePricingModel(model.key)}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.pricingModelChoiceText,
                                form.pricing.selectedPricingModels.includes(model.key) &&
                                    styles.pricingModelChoiceTextSelected,
                            ]}
                        >
                            {model.label}
                        </Text>
                        <View
                            style={[
                                styles.pricingModelCheckbox,
                                form.pricing.selectedPricingModels.includes(model.key) &&
                                    styles.pricingModelCheckboxSelected,
                            ]}
                        >
                            {form.pricing.selectedPricingModels.includes(model.key) && (
                                <Ionicons name="checkmark" size={12} color={Colors.white} />
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
            {!!errors.selectedPricingModels && (
                <Text style={styles.errorText}>{errors.selectedPricingModels}</Text>
            )}
            {(['onlyRent', 'rentWithAmenities'] as const).map(
                model =>
                    form.pricing.selectedPricingModels.includes(model) && (
                        <View key={model} style={styles.rateGroup}>
                            <Text style={styles.rateTitle}>
                                {model === 'onlyRent' ? 'ONLY RENT' : 'RENT (INCLUDED AMENITIES)'}
                            </Text>
                            <View style={styles.pricingTableHeader}>
                                <Text style={[styles.pricingColumnHeader, styles.durationColumn]}>
                                    Duration Type
                                </Text>
                                <Text style={[styles.pricingColumnHeader, styles.rateColumn]}>
                                    Rate (₹)
                                </Text>
                                <Text style={[styles.pricingColumnHeader, styles.rateColumn]}>
                                    Extra Per Hr. (₹)
                                </Text>
                            </View>
                            {PRICING_DURATIONS.map(duration => (
                                <View
                                    key={`${model}-${duration.rateKey}`}
                                    style={styles.pricingRow}
                                >
                                    <Text style={[styles.durationLabel, styles.durationColumn]}>
                                        {duration.label}
                                    </Text>
                                    {(['rate', 'extraPerHour'] as const).map(field => (
                                        <TextInput
                                            key={field}
                                            style={[styles.pricingInput, styles.rateColumn]}
                                            placeholder="₹ 0"
                                            placeholderTextColor={Colors.charcoalLight}
                                            value={String(
                                                form.pricing[model][duration.rateKey][field] || '',
                                            )}
                                            onChangeText={value =>
                                                setRate(model, duration.rateKey, field, value)
                                            }
                                            keyboardType="numeric"
                                            accessibilityLabel={`${
                                                model === 'onlyRent'
                                                    ? 'Venue only'
                                                    : 'Venue with amenities'
                                            } ${duration.label} ${
                                                field === 'rate' ? 'rate' : 'extra per hour rate'
                                            }`}
                                        />
                                    ))}
                                </View>
                            ))}
                            {!!errors[model] && (
                                <Text style={styles.errorText}>{errors[model]}</Text>
                            )}
                        </View>
                    ),
            )}
            {form.pricing.selectedPricingModels.includes('perPax') && (
                <View style={styles.rateGroup}>
                    <Text style={styles.rateTitle}>PER PAX (PER PERSON)</Text>
                    <View style={styles.pricingTableHeader}>
                        <Text style={[styles.pricingColumnHeader, styles.durationColumn]}>
                            Meal / Package Type
                        </Text>
                        <Text style={[styles.pricingColumnHeader, styles.rateColumn]}>
                            Rate (₹)
                        </Text>
                        <Text style={[styles.pricingColumnHeader, styles.rateColumn]}>
                            Minimum Pax
                        </Text>
                    </View>
                    {PER_PAX_OPTIONS.map(option => (
                        <View key={option.key} style={styles.pricingRow}>
                            <Text style={[styles.durationLabel, styles.durationColumn]}>
                                {option.label}
                            </Text>
                            {(['rate', 'minPax'] as const).map(field => (
                                <TextInput
                                    key={field}
                                    style={[styles.pricingInput, styles.rateColumn]}
                                    placeholder={field === 'rate' ? '₹ 0' : '0'}
                                    placeholderTextColor={Colors.charcoalLight}
                                    value={String(form.pricing.perPax[option.key][field] || '')}
                                    onChangeText={value => setPerPaxValue(option.key, field, value)}
                                    keyboardType="numeric"
                                    accessibilityLabel={`${option.label} ${
                                        field === 'rate' ? 'rate' : 'minimum guests'
                                    }`}
                                />
                            ))}
                        </View>
                    ))}
                    {!!errors.perPax && <Text style={styles.errorText}>{errors.perPax}</Text>}
                </View>
            )}
            <View style={styles.divider} />
            <Text style={styles.rateTitle}>PARKING AVAILABILITY</Text>
            <View style={styles.choiceWrap}>
                {(['None', 'Free', 'Paid', 'Limited'] as const).map(type => (
                    <ChoicePill
                        key={type}
                        label={type === 'None' ? 'No parking' : type}
                        selected={form.location.parkingAvailability === type}
                        onPress={() =>
                            setForm(previous => ({
                                ...previous,
                                location: {
                                    ...previous.location,
                                    parkingAvailability: type,
                                    parkingDetails: { ...previous.location.parkingDetails, type },
                                },
                            }))
                        }
                    />
                ))}
            </View>
            {form.location.parkingAvailability !== 'None' && (
                <>
                    <Field
                        label="Car parking spaces"
                        placeholder="0"
                        icon="car-outline"
                        value={String(form.location.parkingDetails.carsCapacity || '')}
                        onChangeText={value =>
                            setForm(previous => ({
                                ...previous,
                                location: {
                                    ...previous.location,
                                    parkingDetails: {
                                        ...previous.location.parkingDetails,
                                        carsCapacity: Number(value.replace(/\D/g, '')) || 0,
                                    },
                                },
                            }))
                        }
                        keyboardType="numeric"
                    />
                    <Field
                        label="Two-wheeler spaces"
                        placeholder="0"
                        icon="bicycle-outline"
                        value={String(form.location.parkingDetails.twoWheelerCapacity || '')}
                        onChangeText={value =>
                            setForm(previous => ({
                                ...previous,
                                location: {
                                    ...previous.location,
                                    parkingDetails: {
                                        ...previous.location.parkingDetails,
                                        twoWheelerCapacity: Number(value.replace(/\D/g, '')) || 0,
                                    },
                                },
                            }))
                        }
                        keyboardType="numeric"
                    />
                </>
            )}
        </FormSection>
    );

    const renderPhotos = () => (
        <FormSection
            title="Venue photos"
            description="Add three clear photos so guests can picture the venue."
        >
            {PHOTO_SLOTS.map(slot => {
                const photo = photos[slot.key];
                return (
                    <View key={slot.key} style={styles.photoRow}>
                        {photo ? (
                            <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Ionicons name="image-outline" size={22} color={Colors.primary} />
                            </View>
                        )}
                        <View style={styles.photoCopy}>
                            <Text style={styles.photoTitle}>
                                {slot.label} {slot.required ? '*' : ''}
                            </Text>
                            <Text style={styles.photoHint}>
                                {photo ? photo.fileName : slot.hint}
                            </Text>
                            {!!errors[slot.key] && (
                                <Text style={styles.errorText}>{errors[slot.key]}</Text>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.photoAction}
                            onPress={() => void updatePhoto(slot.key)}
                            accessibilityLabel={`${photo ? 'Change' : 'Add'} ${slot.label} photo`}
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
            <TouchableOpacity
                style={[styles.termsRow, errors.termsAccepted && styles.termsRowError]}
                onPress={() => {
                    setForm(previous => ({
                        ...previous,
                        termsAccepted: !previous.termsAccepted,
                    }));
                    clearError('termsAccepted');
                }}
                activeOpacity={0.75}
            >
                <View
                    style={[
                        styles.checkbox,
                        form.termsAccepted && styles.checkboxSelected,
                        !!errors.termsAccepted && styles.checkboxError,
                    ]}
                >
                    {form.termsAccepted && (
                        <Ionicons name="checkmark" size={14} color={Colors.white} />
                    )}
                </View>
                <Text style={styles.termsText}>
                    I certify that I have personally visited or communicated with the authorized
                    person of this venue and captured authentic details. Submitting this form
                    provisionally creates the venue listing and sends onboarding credentials to the
                    venue owner for complete profile setup.
                </Text>
            </TouchableOpacity>
            {!!errors.termsAccepted && <Text style={styles.errorText}>{errors.termsAccepted}</Text>}
        </FormSection>
    );

    const renderStep = () => {
        switch (step) {
            case 0:
                return renderVenueDetails();
            case 1:
                return renderOwnerContact();
            case 2:
                return renderLocation();
            case 3:
                return renderPricing();
            default:
                return renderPhotos();
        }
    };

    const busy = isPending || isUploading;

    return (
        <>
            <Modal
                visible={otpStep === 'phone'}
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
                            <Text style={styles.modalTitle}>Verify mobile number</Text>
                            <Text style={styles.modalSubtitle}>
                                Enter the OTP sent to{' '}
                                <Text style={styles.modalPhone}>{otpPhone}</Text>
                            </Text>
                        </View>
                        <TextInput
                            style={[styles.otpInput, !!otpError && styles.otpInputError]}
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
                        {!!otpError && (
                            <View style={styles.otpErrorRow}>
                                <Ionicons name="alert-circle" size={13} color={Colors.danger} />
                                <Text style={styles.otpErrorText}>{otpError}</Text>
                            </View>
                        )}
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
            <KeyboardAvoidingView
                style={styles.screen}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => {
                                if (step > 0) {
                                    setErrors({});
                                    setStep(current => current - 1);
                                } else {
                                    navigation.goBack();
                                }
                            }}
                            accessibilityLabel={step > 0 ? 'Previous step' : 'Go back'}
                        >
                            <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
                        </TouchableOpacity>
                        <View style={styles.headerCopy}>
                            <Text style={styles.eyebrow}>AMBASSADOR PORTAL</Text>
                            <Text style={styles.headerTitle}>Add a venue</Text>
                        </View>
                        <View style={styles.stepBadge}>
                            <Text style={styles.stepBadgeCurrent}>{step + 1}</Text>
                            <Text style={styles.stepBadgeTotal}> / {STEP_TITLES.length}</Text>
                        </View>
                    </View>

                    <View style={styles.progressTrack}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${((step + 1) / STEP_TITLES.length) * 100}%` },
                            ]}
                        />
                    </View>
                    <View style={styles.stepMeta}>
                        <Text style={styles.stepTitle}>{STEP_TITLES[step]}</Text>
                        <Text style={styles.stepSubtitle}>{STEP_SUBTITLES[step]}</Text>
                    </View>

                    <View style={styles.formCard}>
                        {renderStep()}
                        <View style={styles.footer}>
                            {step > 0 && (
                                <TouchableOpacity
                                    style={styles.previousButton}
                                    onPress={() => {
                                        setErrors({});
                                        setStep(current => current - 1);
                                    }}
                                    disabled={busy}
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
                                style={[styles.nextButton, busy && styles.buttonDisabled]}
                                onPress={goNext}
                                disabled={busy}
                                activeOpacity={0.85}
                            >
                                {busy ? (
                                    <ActivityIndicator size="small" color={Colors.white} />
                                ) : (
                                    <>
                                        <Text style={styles.nextText}>
                                            {step === STEP_TITLES.length - 1
                                                ? 'Submit venue'
                                                : 'Continue'}
                                        </Text>
                                        <Ionicons
                                            name={
                                                step === STEP_TITLES.length - 1
                                                    ? 'checkmark'
                                                    : 'chevron-forward'
                                            }
                                            size={18}
                                            color={Colors.white}
                                        />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Text style={styles.footerHint}>
                        Step {step + 1} of {STEP_TITLES.length} · Your progress stays on this screen
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 40 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
        ...Shadows.card,
    },
    headerCopy: { flex: 1 },
    eyebrow: {
        color: Colors.primaryDark,
        fontSize: Typography.xs,
        letterSpacing: 1.5,
        fontWeight: Typography.extraBold,
    },
    headerTitle: {
        color: Colors.charcoal,
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        marginTop: 2,
    },
    stepBadge: {
        flexDirection: 'row',
        alignItems: 'baseline',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.full,
    },
    stepBadgeCurrent: {
        color: Colors.primaryDark,
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
    },
    stepBadgeTotal: {
        color: Colors.charcoalLight,
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
    },
    progressTrack: {
        height: 6,
        overflow: 'hidden',
        borderRadius: Radii.full,
        backgroundColor: Colors.border,
    },
    progressFill: { height: '100%', borderRadius: Radii.full, backgroundColor: Colors.primary },
    stepMeta: { marginTop: Spacing.lg, marginBottom: Spacing.md },
    stepTitle: {
        color: Colors.charcoal,
        fontSize: Typography.xxl,
        fontWeight: Typography.extraBold,
    },
    stepSubtitle: {
        color: Colors.charcoalLight,
        fontSize: Typography.md,
        lineHeight: 20,
        marginTop: Spacing.xs,
    },
    formCard: {
        padding: Spacing.lg,
        backgroundColor: Colors.surface,
        borderRadius: Radii.xxl,
        ...Shadows.header,
    },
    section: { gap: Spacing.xs },
    sectionTitle: {
        color: Colors.charcoal,
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        marginBottom: 2,
    },
    sectionDescription: {
        color: Colors.charcoalLight,
        fontSize: Typography.sm,
        lineHeight: 18,
        marginBottom: Spacing.md,
    },
    fieldLabel: {
        color: Colors.charcoalMid,
        fontSize: Typography.sm,
        letterSpacing: 0.8,
        fontWeight: Typography.bold,
        marginBottom: Spacing.xs,
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
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
    },
    choicePillSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
    choiceText: {
        color: Colors.charcoalMid,
        fontSize: Typography.base,
        fontWeight: Typography.medium,
    },
    choiceTextSelected: { color: Colors.primaryDark, fontWeight: Typography.bold },
    pricingModelChoices: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    pricingModelChoice: {
        minHeight: 42,
        flexGrow: 1,
        flexBasis: '30%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
    },
    pricingModelChoiceSelected: {
        borderColor: Colors.primaryBorder,
        backgroundColor: Colors.primaryHighLight,
    },
    pricingModelChoiceText: {
        flexShrink: 1,
        color: Colors.charcoalMid,
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
    },
    pricingModelChoiceTextSelected: { color: Colors.primaryDark },
    pricingModelCheckbox: {
        width: 15,
        height: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 4,
        backgroundColor: Colors.surface,
    },
    pricingModelCheckboxSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary,
    },
    pricingTableHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingBottom: Spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        marginBottom: Spacing.xs,
    },
    pricingColumnHeader: {
        color: Colors.charcoalMid,
        fontSize: 9,
        fontWeight: Typography.bold,
    },
    durationColumn: { flex: 1.15 },
    rateColumn: { flex: 0.9 },
    pricingRow: {
        minHeight: 42,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    durationLabel: {
        color: Colors.charcoalMid,
        fontSize: 10,
        fontWeight: Typography.medium,
    },
    pricingInput: {
        minHeight: 34,
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        backgroundColor: Colors.background,
        color: Colors.charcoal,
        fontSize: Typography.xs,
    },
    multilineField: { marginBottom: Spacing.md },
    textArea: {
        minHeight: 116,
        padding: Spacing.md,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
        color: Colors.charcoal,
        fontSize: Typography.md,
    },
    inputError: { borderColor: Colors.danger },
    errorText: {
        color: Colors.danger,
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        marginTop: 4,
        marginBottom: Spacing.sm,
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
        color: Colors.primaryDark,
        fontSize: Typography.md,
        fontWeight: Typography.semiBold,
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
        color: Colors.danger,
        fontSize: Typography.sm,
    },
    rateGroup: {
        marginTop: Spacing.sm,
        padding: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
    },
    rateTitle: {
        color: Colors.charcoal,
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        marginBottom: Spacing.sm,
    },
    divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.md },
    photoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    photoPreview: { width: 56, height: 56, borderRadius: Radii.sm, backgroundColor: Colors.border },
    photoPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: Radii.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primaryLight,
    },
    photoCopy: { flex: 1 },
    photoTitle: { color: Colors.charcoal, fontSize: Typography.md, fontWeight: Typography.bold },
    photoHint: { color: Colors.charcoalLight, fontSize: Typography.sm, marginTop: 3 },
    photoAction: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        backgroundColor: Colors.primaryHighLight,
    },
    termsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        marginTop: Spacing.lg,
    },
    termsRowError: { opacity: 0.95 },
    checkbox: {
        width: 22,
        height: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    checkboxSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary },
    checkboxError: { borderColor: Colors.danger },
    termsText: { flex: 1, color: Colors.charcoalMid, fontSize: Typography.sm, lineHeight: 18 },
    footer: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingTop: Spacing.md,
        marginTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    previousButton: {
        minWidth: 92,
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
    },
    previousText: {
        color: Colors.charcoalMid,
        fontSize: Typography.md,
        fontWeight: Typography.bold,
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
    buttonDisabled: { opacity: 0.65 },
    nextText: { color: Colors.white, fontSize: Typography.md, fontWeight: Typography.extraBold },
    footerHint: {
        marginTop: Spacing.md,
        color: Colors.charcoalLight,
        fontSize: Typography.sm,
        textAlign: 'center',
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
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
    },
    modalSubtitle: {
        color: Colors.charcoalLight,
        fontSize: Typography.md,
        lineHeight: 20,
        textAlign: 'center',
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
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        letterSpacing: 8,
    },
    otpInputError: { borderColor: Colors.danger },
    otpErrorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    otpErrorText: { color: Colors.danger, fontSize: Typography.sm },
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

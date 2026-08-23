import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Checkbox from '../components/Checkbox';
import { Colors, Spacing, Typography } from '@/theme/theme';
import Field from '@/components/UI/InputField';
import SearchableDropdown from '@/components/UI/SearchableDropDown';
import { getCitiesByState, getDistrictByState, getStates } from '@/utils/location';
import { AmbassadorRegistration } from '../types/AmbassadarRegister';
import { FieldErrors } from '../validation/ambassadorValidation';
import { config } from '@/config/env';

const GOOGLE_API_KEY = config.GOOGLEAPI;

interface StepAddressDetailsProps {
    data: AmbassadorRegistration;
    onChange: (updater: (prev: AmbassadorRegistration) => AmbassadorRegistration) => void;
    errors: FieldErrors;
}

// ─── Geocoding helper ─────────────────────────────────────────────────────────

interface GeocodeResult {
    address: string;
    city: string;
    area: string;
    state: string;
    pincode: string;
    googleMapLink: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
    const url =
        `https://maps.googleapis.com/maps/api/geocode/json` +
        `?latlng=${lat},${lng}` +
        `&key=${GOOGLE_API_KEY}`;

    const res = await fetch(url);
    const json = await res.json();

    if (json.status !== 'OK' || !json.results?.length) {
        throw new Error('Geocoding failed: ' + json.status);
    }

    const result = json.results[0];
    const components: { long_name: string; types: string[] }[] = result.address_components;

    const get = (type: string) => components.find(c => c.types.includes(type))?.long_name ?? '';

    const premise = get('premise');
    const subPremise = get('subpremise');
    const streetNumber = get('street_number');
    const route = get('route');
    const sublocality2 = get('sublocality_level_2');
    const sublocality1 = get('sublocality_level_1');

    const addressParts = [
        subPremise,
        premise,
        streetNumber,
        route,
        sublocality2,
        sublocality1,
    ].filter(Boolean);
    const address = addressParts.length ? addressParts.join(', ') : result.formatted_address;

    return {
        address,
        city: get('locality') || get('administrative_area_level_2'),
        area: get('sublocality_level_1') || get('sublocality_level_2') || get('neighborhood'),
        state: get('administrative_area_level_1'),
        pincode: get('postal_code'),
        googleMapLink: `https://maps.google.com/?q=${lat},${lng}`,
    };
}

async function ensureLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: 'Location Permission',
                message: 'We need your location to auto-fill your address.',
                buttonPositive: 'Allow',
                buttonNegative: 'Deny',
            },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    const permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
    const status = await check(permission);
    if (status === RESULTS.GRANTED) return true;
    if (status === RESULTS.DENIED) {
        const result = await request(permission);
        return result === RESULTS.GRANTED;
    }
    return false;
}

export default function StepAddressDetails({ data, onChange, errors }: StepAddressDetailsProps) {
    const [sameAsAddress, setSameAsAddress] = useState(false);
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const { addressDetails, preferredWorkingArea } = data;

    const setAddress = <K extends keyof AmbassadorRegistration['addressDetails']>(
        key: K,
        value: AmbassadorRegistration['addressDetails'][K],
    ) => {
        onChange(prev => ({ ...prev, addressDetails: { ...prev.addressDetails, [key]: value } }));
    };

    const setPreferred = <K extends keyof AmbassadorRegistration['preferredWorkingArea']>(
        key: K,
        value: AmbassadorRegistration['preferredWorkingArea'][K],
    ) => {
        onChange(prev => ({
            ...prev,
            preferredWorkingArea: { ...prev.preferredWorkingArea, [key]: value },
        }));
    };

    // ── Real geolocation + reverse geocoding ───────────────────────────────
    const handleUseCurrentLocation = async () => {
        setLocationError(null);
        setLocating(true);

        const hasPermission = await ensureLocationPermission();
        if (!hasPermission) {
            setLocationError('Location permission denied. Enable it in Settings to use this.');
            setLocating(false);
            return;
        }

        Geolocation.getCurrentPosition(
            async position => {
                const { latitude, longitude } = position.coords;
                try {
                    const geo = await reverseGeocode(latitude, longitude);
                    onChange(prev => ({
                        ...prev,
                        addressDetails: {
                            ...prev.addressDetails,
                            currentAddress: geo.address,
                            city: geo.city,
                            areaCoverage: geo.area || prev.addressDetails.areaCoverage,
                            state: geo.state,
                            pincode: geo.pincode,
                        },
                    }));
                } catch (e) {
                    console.error('Reverse geocode error:', e);
                    setLocationError("Couldn't detect your address. Please enter it manually.");
                } finally {
                    setLocating(false);
                }
            },
            error => {
                console.error('Geolocation error:', error);
                setLocationError(error?.message || 'Could not access your location.');
                setLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000,
            },
        );
    };

    const toggleSameAsAddress = () => {
        const next = !sameAsAddress;
        setSameAsAddress(next);
        if (next) {
            onChange(prev => ({
                ...prev,
                preferredWorkingArea: {
                    stateCoverage: prev.addressDetails.state,
                    districtCoverage: prev.addressDetails.district,
                    cityCoverage: prev.addressDetails.city,
                },
            }));
        }
    };

    return (
        <View>
            <Text style={styles.heading}>Part B: Address Details & Preferred Working Area</Text>

            <TouchableOpacity
                style={styles.locationBtn}
                onPress={handleUseCurrentLocation}
                disabled={locating}
                activeOpacity={0.8}
            >
                {locating ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                    <Ionicons name="locate-outline" size={16} color={Colors.primary} />
                )}
                <Text style={styles.locationBtnText}>
                    {locating ? 'Detecting your location…' : 'Use current location'}
                </Text>
            </TouchableOpacity>
            {!!locationError && <Text style={styles.locationErrorText}>{locationError}</Text>}

            <Field
                label="Current Address *"
                placeholder="House no., street, locality"
                icon="home-outline"
                value={addressDetails.currentAddress}
                onChangeText={t => setAddress('currentAddress', t)}
                autoCapitalize="sentences"
                error={errors.currentAddress}
            />

            <SearchableDropdown
                label="State *"
                icon="map-outline"
                placeholder="Search for your state"
                value={addressDetails.state}
                onChangeText={t => setAddress('state', t)}
                fetchOptions={q => getStates(q)}
                onSelect={opt => {
                    setAddress('state', opt.name);
                    setAddress('district', '');
                    setAddress('city', '');
                }}
                error={errors.state}
            />

            <SearchableDropdown
                label="District *"
                icon="location-outline"
                placeholder="Search for your district"
                value={addressDetails.district}
                onChangeText={t => setAddress('district', t)}
                fetchOptions={q => getDistrictByState(q, addressDetails.state)}
                onSelect={opt => {
                    setAddress('district', opt.name);
                    setAddress('city', '');
                }}
                disabled={!addressDetails.state}
                disabledHint="Select a state first"
                error={errors.district}
            />

            <SearchableDropdown
                label="City *"
                icon="business-outline"
                placeholder="Search for your city"
                value={addressDetails.city}
                onChangeText={t => setAddress('city', t)}
                fetchOptions={q => getCitiesByState(q, addressDetails.state)}
                onSelect={opt => setAddress('city', opt.name)}
                disabled={!addressDetails.district}
                disabledHint="Select a district first"
                error={errors.city}
            />

            <Field
                label="Pincode *"
                placeholder="6-digit pincode"
                icon="navigate-outline"
                value={addressDetails.pincode}
                onChangeText={t => setAddress('pincode', t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                error={errors.pincode}
            />

            <Field
                label="Area Coverage"
                placeholder="e.g. 5km radius, specific localities"
                icon="locate-outline"
                value={addressDetails.areaCoverage}
                onChangeText={t => setAddress('areaCoverage', t)}
                autoCapitalize="sentences"
            />

            <Text style={styles.subHeading}>Preferred Working Area</Text>

            <Checkbox
                checked={sameAsAddress}
                onToggle={toggleSameAsAddress}
                label="Same as current address"
                labelStyle={styles.checkboxLabel}
            />

            <View style={styles.spacer} />

            <SearchableDropdown
                label="State Coverage"
                icon="map-outline"
                placeholder="Search for a state"
                value={preferredWorkingArea.stateCoverage}
                onChangeText={t => setPreferred('stateCoverage', t)}
                fetchOptions={q => getStates(q)}
                onSelect={opt => {
                    setPreferred('stateCoverage', opt.name);
                    setPreferred('districtCoverage', '');
                    setPreferred('cityCoverage', '');
                }}
                disabled={sameAsAddress}
            />

            <SearchableDropdown
                label="District Coverage"
                icon="location-outline"
                placeholder="Search for a district"
                value={preferredWorkingArea.districtCoverage}
                onChangeText={t => setPreferred('districtCoverage', t)}
                fetchOptions={q => getDistrictByState(q, preferredWorkingArea.stateCoverage)}
                onSelect={opt => {
                    setPreferred('districtCoverage', opt.name);
                    setPreferred('cityCoverage', '');
                }}
                disabled={sameAsAddress || !preferredWorkingArea.stateCoverage}
                disabledHint="Select a state first"
            />

            <SearchableDropdown
                label="City Coverage"
                icon="business-outline"
                placeholder="Search for a city"
                value={preferredWorkingArea.cityCoverage}
                onChangeText={t => setPreferred('cityCoverage', t)}
                fetchOptions={q => getCitiesByState(q, preferredWorkingArea.stateCoverage)}
                onSelect={opt => setPreferred('cityCoverage', opt.name)}
                disabled={sameAsAddress || !preferredWorkingArea.districtCoverage}
                disabledHint="Select a district first"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    heading: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        marginBottom: Spacing.lg,
    },
    subHeading: {
        fontSize: 13,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        marginTop: Spacing.xs,
        marginBottom: Spacing.md,
    },
    checkboxLabel: { fontSize: 12.5 },
    spacer: { height: Spacing.md },
    locationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        marginBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        backgroundColor: Colors.primaryLight,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: Colors.primary + '44',
    },
    locationBtnText: {
        fontSize: 12.5,
        fontWeight: Typography.semiBold,
        color: Colors.primary,
    },
    locationErrorText: {
        fontSize: 12,
        color: Colors.danger,
        marginBottom: Spacing.md,
    },
});

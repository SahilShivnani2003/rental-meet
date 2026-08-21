import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Checkbox from '../components/Checkbox';
import { Colors, Spacing, Typography } from '@/theme/theme';
import Field from '@/components/UI/InputField';
import SearchableDropdown from '@/components/UI/SearchableDropDown';
import { getStates } from '@/utils/location';
import { FieldErrors } from '@/utils/validation';
import { getDistrictsByState, getCitiesByDistrict } from '../service/locationApi';
import { AmbassadorRegistration } from '../types/AmbassadarRegister';

interface StepAddressDetailsProps {
    data: AmbassadorRegistration;
    onChange: (updater: (prev: AmbassadorRegistration) => AmbassadorRegistration) => void;
    errors: FieldErrors;
}

export default function StepAddressDetails({ data, onChange, errors }: StepAddressDetailsProps) {
    const [sameAsAddress, setSameAsAddress] = useState(false);
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
                fetchOptions={q => getDistrictsByState(addressDetails.state, q)}
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
                fetchOptions={q => getCitiesByDistrict(addressDetails.district, q)}
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
                fetchOptions={q => getDistrictsByState(preferredWorkingArea.stateCoverage, q)}
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
                fetchOptions={q => getCitiesByDistrict(preferredWorkingArea.districtCoverage, q)}
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
});

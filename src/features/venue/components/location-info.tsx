import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    FlatList,
    TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';
import { Colors, Typography, Spacing, Radii } from '../../../theme/theme';
import Field from '../../../components/UI/InputField';
import {
    StepHeader,
    SectionCard,
    PickerRow,
    NavButtons,
    Textarea,
} from '../../../components/UI/shared-components';
import { VenueFormData } from '../types/VenueFormData';
import { config } from '@/config/env';
import SearchableDropdown, { DropdownOption } from '@/components/UI/SearchableDropDown';
import { getCitiesByState, getStates } from '@/utils/location';

const GOOGLE_API_KEY = config.GOOGLEAPI;
const PARKING_TYPES = ['Select parking type', 'Free', 'Paid', 'Limited', 'No'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlacePrediction {
    place_id: string;
    structured_formatting: { main_text: string; secondary_text: string };
}

interface DropdownLayout {
    x: number;
    y: number;
    width: number;
}

interface Props {
    data: VenueFormData['location'];
    onChange: (data: VenueFormData['location']) => void;
    onPrev: () => void;
    onNext: () => void;
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

    // Pick the most detailed result (first one)
    const result = json.results[0];
    const components: { long_name: string; types: string[] }[] = result.address_components;

    const get = (type: string) => components.find(c => c.types.includes(type))?.long_name ?? '';

    // Build a clean street address from sub-components
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

// ─── Step2Location ────────────────────────────────────────────────────────────

export default function Step2Location({ data, onChange, onPrev, onNext }: Props) {
    const set = (patch: Partial<VenueFormData['location']>) => onChange({ ...data, ...patch });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [locating, setLocating] = useState(false);
    const [parkingOpen, setParkingOpen] = useState(false);

    const clearErr = (key: string) => setErrors(p => ({ ...p, [key]: '' }));

    // ── Real geolocation + reverse geocoding ───────────────────────────────
    const handleUseCurrentLocation = () => {
        setLocating(true);
        Geolocation.getCurrentPosition(
            async position => {
                const { latitude, longitude } = position.coords;
                try {
                    const geo = await reverseGeocode(latitude, longitude);
                    set({
                        address: geo.address,
                        city: geo.city,
                        area: geo.area,
                        state: geo.state,
                        pincode: geo.pincode,
                        googleMapLink: geo.googleMapLink,
                        landmark: data.landmark, // keep existing landmark
                        village: data.village,
                    });
                    setErrors({});
                } catch (e) {
                    console.error('Reverse geocode error:', e);
                } finally {
                    setLocating(false);
                }
            },
            error => {
                console.error('Geolocation error:', error);
                setLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000,
            },
        );
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!data.address.trim()) e.address = 'Complete address is required';
        if (!data.landmark.trim()) e.landmark = 'Landmark is required';
        if (!data.city.trim()) e.city = 'City is required';
        if (!data.area.trim()) e.area = 'Area/Locality is required';
        if (!data.state.trim()) e.state = 'State is required';
        if (!data.pincode.trim()) e.pincode = 'Pincode is required';
        if (data.pincode.length > 0 && data.pincode.length !== 6)
            e.pincode = 'Enter a valid 6-digit pincode';
        if (!data.googleMapLink.trim()) e.mapsLink = 'Google Maps link is required';
        if (data.parkingAvailability === PARKING_TYPES[0]) e.parking = 'Select a parking type';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
        >
            {/* <StepHeader title="Step 2: Location" current={2} /> */}
            <SectionCard>
                {/* ── Current location button ── */}
                <TouchableOpacity
                    style={[s.locationBtn, locating && s.locationBtnDisabled]}
                    onPress={handleUseCurrentLocation}
                    disabled={locating}
                    activeOpacity={0.8}
                >
                    {locating ? (
                        <>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={s.locationBtnText}>Detecting location...</Text>
                        </>
                    ) : (
                        <>
                            <Ionicons name="navigate" size={15} color={Colors.primary} />
                            <Text style={s.locationBtnText}>Use Current Location</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={s.divider}>
                    <View style={s.dividerLine} />
                    <Text style={s.dividerText}>or fill manually</Text>
                    <View style={s.dividerLine} />
                </View>

                <Textarea
                    label="Complete Address *"
                    placeholder="Floor 3, Skyline Tower, MP Nagar"
                    value={data.address}
                    onChangeText={v => {
                        set({ address: v });
                        clearErr('address');
                    }}
                    numberOfLines={3}
                    style={{ height: 80, marginBottom: 20 }}
                />
                {!!errors.address && <ErrorRow msg={errors.address} />}

                <Field
                    label="Landmark"
                    placeholder="Near DB City Mall"
                    icon="flag-outline"
                    value={data.landmark}
                    onChangeText={v => {
                        set({ landmark: v });
                        clearErr('landmark');
                    }}
                    error={errors.landmark}
                />

                {/* ── State + Village ── */}
                <View style={s.row}>
                    <View style={{ flex: 1 }}>
                        <SearchableDropdown
                            label="State *"
                            icon="globe-outline"
                            placeholder="Madhya Pradesh"
                            value={data.state}
                            onChangeText={v => {
                                set({ state: v, city: '' }); // reset city if state text is edited
                                clearErr('state');
                            }}
                            fetchOptions={query => getStates(query)}
                            onSelect={(option: DropdownOption) => {
                                set({ state: option.name, city: '' }); // clear city on state change
                                clearErr('state');
                            }}
                            error={errors.state}
                            minQueryLength={1}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <SearchableDropdown
                            label="City *"
                            icon="location-outline"
                            placeholder="Bhopal"
                            value={data.city}
                            onChangeText={v => {
                                set({ city: v });
                                clearErr('city');
                            }}
                            fetchOptions={query => getCitiesByState(query, data.state)}
                            onSelect={(option: DropdownOption) => {
                                set({ city: option.name });
                                clearErr('city');
                            }}
                            error={errors.city}
                            disabled={!data.state.trim()}
                            disabledHint="Select a state first"
                            minQueryLength={1}
                        />
                    </View>
                </View>

                {/* ── City + Area ── */}
                <View style={s.row}>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="Village (optional)"
                            placeholder="Village name"
                            icon="home-outline"
                            value={data.village}
                            onChangeText={v => set({ village: v })}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="Area / Locality"
                            placeholder="MP Nagar"
                            icon="map-outline"
                            value={data.area}
                            onChangeText={v => {
                                set({ area: v });
                                clearErr('area');
                            }}
                            error={errors.area}
                        />
                    </View>
                </View>

                <Field
                    label="Pincode"
                    placeholder="462001"
                    icon="location-outline"
                    value={data.pincode}
                    onChangeText={v => {
                        set({ pincode: v });
                        clearErr('pincode');
                    }}
                    keyboardType="numeric"
                    maxLength={6}
                    error={errors.pincode}
                />

                <Field
                    label="Google Maps Link"
                    placeholder="https://maps.google.com/..."
                    icon="map-outline"
                    value={data.googleMapLink}
                    onChangeText={v => {
                        set({ googleMapLink: v });
                        clearErr('mapsLink');
                    }}
                    keyboardType="url"
                    autoCapitalize="none"
                    error={errors.mapsLink}
                />
                <Text style={s.hint}>Open Google Maps → Share → Copy link</Text>

                {/* ── Parking ── */}
                <View style={s.pickerSection}>
                    <Text style={s.pickerLabel}>
                        PARKING AVAILABILITY <Text style={s.req}>*</Text>
                    </Text>
                    <PickerRow
                        value={data.parkingAvailability}
                        options={PARKING_TYPES}
                        open={parkingOpen}
                        onToggle={() => setParkingOpen(!parkingOpen)}
                        onSelect={v => {
                            set({ parkingAvailability: v });
                            setParkingOpen(false);
                            clearErr('parking');
                        }}
                    />
                    {!!errors.parking && <ErrorRow msg={errors.parking} />}
                </View>

                <View style={s.row}>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="Nearest Bus/Auto Stand"
                            placeholder="MP Nagar Bus Stand - 500m"
                            icon="bus-outline"
                            value={data.nearestBusAuto}
                            onChangeText={v => set({ nearestBusAuto: v })}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="Nearest Metro/Train"
                            placeholder="MP Nagar Metro - 500m"
                            icon="train-outline"
                            value={data.nearestMetroTrain}
                            onChangeText={v => set({ nearestMetroTrain: v })}
                        />
                    </View>
                </View>
            </SectionCard>

            <NavButtons
                onPrev={onPrev}
                onNext={() => {
                    if (validate()) onNext();
                }}
            />
        </ScrollView>
    );
}

function ErrorRow({ msg }: { msg: string }) {
    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                marginTop: -8,
                marginBottom: 12,
            }}
        >
            <Ionicons name="alert-circle" size={12} color={Colors.danger} />
            <Text style={{ fontSize: 11, color: Colors.danger, fontWeight: Typography.semiBold }}>
                {msg}
            </Text>
        </View>
    );
}

const s = StyleSheet.create({
    locationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        borderRadius: Radii.sm,
        paddingVertical: 12,
        backgroundColor: Colors.primaryLight,
        marginBottom: Spacing.md,
    },
    locationBtnDisabled: { opacity: 0.6 },
    locationBtnText: {
        fontSize: Typography.md,
        fontWeight: Typography.semiBold,
        color: Colors.primary,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
    dividerText: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    row: { flexDirection: 'column', gap: Spacing.sm },
    hint: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        marginTop: -Spacing.sm,
        marginBottom: Spacing.md,
    },
    pickerSection: { marginBottom: Spacing.md },
    pickerLabel: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 7,
    },
    req: { color: Colors.primary },
});

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii } from '../../theme/theme';
import Field from '../UI/input-field';
import { StepHeader, SectionCard, PickerRow, NavButtons, Textarea } from '../UI/shared-components';

const PARKING_TYPES = ['Select parking type', 'Free', 'Paid', 'Limited', 'No'];

interface Props {
    onPrev: () => void;
    onNext: () => void;
}

export default function Step2Location({ onPrev, onNext }: Props) {
    const [address, setAddress] = useState('');
    const [landmark, setLandmark] = useState('');
    const [city, setCity] = useState('');
    const [area, setArea] = useState('');
    const [pincode, setPincode] = useState('');
    const [mapsLink, setMapsLink] = useState('');
    const [parking, setParking] = useState(PARKING_TYPES[0]);
    const [parkingOpen, setParkingOpen] = useState(false);
    const [busStand, setBusStand] = useState('');
    const [metroStation, setMetroStation] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [locating, setLocating] = useState(false);

    const clearErr = (key: string) => setErrors(p => ({ ...p, [key]: '' }));

    // ── Dummy current-location handler ──────────────────────────────────────
    const handleUseCurrentLocation = async () => {
        setLocating(true);
        try {
            // TODO: Replace with real geolocation + reverse-geocode logic
            setTimeout(() => {
                console.log('Current location');
            }, 500);

            // Dummy data — swap with actual API response fields
            setAddress('Floor 3, Skyline Tower, MP Nagar Zone II');
            setLandmark('Near DB City Mall');
            setCity('Bhopal');
            setArea('MP Nagar');
            setPincode('462011');
            setMapsLink('https://maps.google.com/?q=23.2332,77.4345');

            // Clear any existing errors for auto-filled fields
            setErrors(p => ({
                ...p,
                address: '',
                landmark: '',
                city: '',
                area: '',
                pincode: '',
                mapsLink: '',
            }));
        } catch (error: any) {
            console.error('LOCATION ERROR:', error);
        } finally {
            setLocating(false);
        }
    };
    // ────────────────────────────────────────────────────────────────────────

    const validate = () => {
        const e: Record<string, string> = {};
        if (!address.trim()) e.address = 'Complete address is required';
        if (!landmark.trim()) e.landmark = 'Landmark is required';
        if (!city.trim()) e.city = 'City is required';
        if (!area.trim()) e.area = 'Area/Locality is required';
        if (!pincode.trim()) e.pincode = 'Pincode is required';
        if (pincode.length > 0 && pincode.length !== 6) e.pincode = 'Enter a valid 6-digit pincode';
        if (!mapsLink.trim()) e.mapsLink = 'Google Maps link is required';
        if (parking === PARKING_TYPES[0]) e.parking = 'Select a parking type';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
        >
            <StepHeader title="Step 2: Location" current={2} />

            <SectionCard>
                {/* ── Use Current Location button ── */}
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

                {/* ── Divider ── */}
                <View style={s.divider}>
                    <View style={s.dividerLine} />
                    <Text style={s.dividerText}>or fill manually</Text>
                    <View style={s.dividerLine} />
                </View>

                <Textarea
                    label="Complete Address *"
                    placeholder="Floor 3, Skyline Tower, MP Nagar"
                    value={address}
                    onChangeText={v => {
                        setAddress(v);
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
                    value={landmark}
                    onChangeText={v => {
                        setLandmark(v);
                        clearErr('landmark');
                    }}
                    error={errors.landmark}
                />

                <View style={s.row}>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="City"
                            placeholder="Bhopal"
                            icon="location-outline"
                            value={city}
                            onChangeText={v => {
                                setCity(v);
                                clearErr('city');
                            }}
                            error={errors.city}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="Area / Locality"
                            placeholder="MP Nagar, Arera Colony"
                            icon="map-outline"
                            value={area}
                            onChangeText={v => {
                                setArea(v);
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
                    value={pincode}
                    onChangeText={v => {
                        setPincode(v);
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
                    value={mapsLink}
                    onChangeText={v => {
                        setMapsLink(v);
                        clearErr('mapsLink');
                    }}
                    keyboardType="url"
                    autoCapitalize="none"
                    error={errors.mapsLink}
                />
                <Text style={s.hint}>Open Google Maps → Share → Copy link</Text>

                <View style={s.pickerSection}>
                    <Text style={s.pickerLabel}>
                        PARKING AVAILABILITY <Text style={s.req}>*</Text>
                    </Text>
                    <PickerRow
                        value={parking}
                        options={PARKING_TYPES}
                        open={parkingOpen}
                        onToggle={() => setParkingOpen(!parkingOpen)}
                        onSelect={v => {
                            setParking(v);
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
                            value={busStand}
                            onChangeText={setBusStand}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="Nearest Metro/Train"
                            placeholder="MP Nagar Metro - 500m"
                            icon="train-outline"
                            value={metroStation}
                            onChangeText={setMetroStation}
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
    // ── Location button ──
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

    // ── Divider ──
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border,
    },
    dividerText: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },

    row: { flexDirection: 'row', gap: Spacing.sm },
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

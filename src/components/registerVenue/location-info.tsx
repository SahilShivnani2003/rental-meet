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
import { VenueFormData } from '../../types/venue.type';

const PARKING_TYPES = ['Select parking type', 'Free', 'Paid', 'Limited', 'No'];

interface Props {
    data: VenueFormData['location'];
    onChange: (data: VenueFormData['location']) => void;
    onPrev: () => void;
    onNext: () => void;
}

export default function Step2Location({ data, onChange, onPrev, onNext }: Props) {
    const set = (patch: Partial<VenueFormData['location']>) => onChange({ ...data, ...patch });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [locating, setLocating] = useState(false);
    const [parkingOpen, setParkingOpen] = useState(false);

    const clearErr = (key: string) => setErrors(p => ({ ...p, [key]: '' }));

    const handleUseCurrentLocation = async () => {
        setLocating(true);
        try {
            setTimeout(() => {
                console.log('Fetching location');
            }, 500);
            set({
                address: 'Floor 3, Skyline Tower, MP Nagar Zone II',
                landmark: 'Near DB City Mall',
                city: 'Bhopal',
                area: 'MP Nagar',
                pincode: '462011',
                googleMapLink: 'https://maps.google.com/?q=23.2332,77.4345',
            });
            setErrors({});
        } catch (e: any) {
            console.error('LOCATION ERROR:', e);
        } finally {
            setLocating(false);
        }
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!data.address.trim()) e.address = 'Complete address is required';
        if (!data.landmark.trim()) e.landmark = 'Landmark is required';
        if (!data.city.trim()) e.city = 'City is required';
        if (!data.area.trim()) e.area = 'Area/Locality is required';
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
        >
            <StepHeader title="Step 2: Location" current={2} />
            <SectionCard>
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

                <View style={s.row}>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="City"
                            placeholder="Bhopal"
                            icon="location-outline"
                            value={data.city}
                            onChangeText={v => {
                                set({ city: v });
                                clearErr('city');
                            }}
                            error={errors.city}
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

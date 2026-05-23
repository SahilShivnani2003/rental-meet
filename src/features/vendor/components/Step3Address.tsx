import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    TextInput,
    Alert,
    Linking,
    PermissionsAndroid,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';
import { Colors, Spacing, Radii, Typography } from '@/theme/theme';
import { VendorService } from '@features/otherService/types/VendorService';
import Field from '@/components/UI/InputField';
import Config from 'react-native-config';

// ─── Types ─────────────────────────────────────────────────────────────────

type Props = {
    data: Partial<VendorService>;
    onChange: (key: keyof VendorService, value: any) => void;
};

type LocationStatus = 'idle' | 'loading' | 'success' | 'error';

type GeocodedAddress = {
    officeAddress: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    village: string;
};

type PlacePrediction = {
    description: string;
    place_id: string;
    structured_formatting: {
        main_text: string;
        secondary_text: string;
    };
};

// ─── Constants ─────────────────────────────────────────────────────────────

const PRIMARY = '#6C63FF';
const SUCCESS = '#22C55E';
const DANGER = '#EF4444';

const GOOGLE_API_KEY = Config.GOOGLEAPI;

const REQUIRED_FIELDS: (keyof VendorService)[] = ['officeAddress', 'state', 'city', 'pincode'];

// ─── Google Reverse Geocoding ──────────────────────────────────────────────

async function reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress> {
    const url =
        `https://maps.googleapis.com/maps/api/geocode/json` +
        `?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;

    const res = await fetch(url);
    const json = await res.json();

    if (json.status !== 'OK' || !json.results?.length) {
        throw new Error(json.error_message || 'Geocoding returned no results');
    }

    const components = json.results[0].address_components as Array<{
        long_name: string;
        short_name: string;
        types: string[];
    }>;

    const get = (type: string): string =>
        components.find(c => c.types.includes(type))?.long_name ?? '';

    const streetNumber = get('street_number');
    const route = get('route');
    const sublocality = get('sublocality_level_1') || get('sublocality');
    const locality = get('locality');
    const adminL2 = get('administrative_area_level_2');
    const adminL1 = get('administrative_area_level_1');
    const adminL3 = get('administrative_area_level_3');
    const postalCode = get('postal_code');

    const streetParts = [streetNumber, route].filter(Boolean);
    const officeAddress = streetParts.length
        ? streetParts.join(' ')
        : sublocality || locality || adminL2;

    return {
        officeAddress,
        area: sublocality,
        city: locality || adminL2,
        state: adminL1,
        pincode: postalCode,
        village: adminL3,
    };
}

// ─── Google Places Autocomplete ────────────────────────────────────────────

async function fetchPlacePredictions(
    input: string,
    types: string,
    componentRestrictions?: string,
): Promise<PlacePrediction[]> {
    try {
        if (input.length < 2) return [];

        let url =
            `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
            `?input=${encodeURIComponent(input)}` +
            `&types=${types}` +
            `&key=${GOOGLE_API_KEY}`;

        if (componentRestrictions) {
            url += `&components=${componentRestrictions}`;
        }

        const res = await fetch(url);
        const json = await res.json();

        if (json.status === 'OK') {
            return json.predictions || [];
        }

        return [];
    } catch (error) {
        console.error('Error fetching place predictions:', error);
        return [];
    }
}

// ─── Request Location Permission ───────────────────────────────────────────

async function requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
        // For iOS, we just try to get location - the system will handle permission automatically
        return true;
    }

    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: 'Location Permission',
                message: 'This app needs access to your location to auto-fill your address.',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Location permission granted');
            return true;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            Alert.alert(
                'Permission Required',
                'Location permission is permanently denied. Please enable it in Settings.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Open Settings',
                        onPress: () => Linking.openSettings(),
                    },
                ],
            );
            return false;
        } else {
            console.log('Location permission denied');
            return false;
        }
    } catch (err) {
        console.warn('Permission error:', err);
        return false;
    }
}

// ─── Location Button ───────────────────────────────────────────────────────

function LocationButton({
    status,
    message,
    onPress,
}: {
    status: LocationStatus;
    message: string;
    onPress: () => void;
}) {
    const isLoading = status === 'loading';
    const isSuccess = status === 'success';
    const isError = status === 'error';

    return (
        <TouchableOpacity
            style={[lb.btn, isSuccess && lb.btnSuccess, isError && lb.btnError]}
            onPress={onPress}
            activeOpacity={0.8}
            disabled={isLoading}
        >
            <View style={[lb.iconWrap, isSuccess && lb.iconSuccess, isError && lb.iconError]}>
                {isLoading ? (
                    <ActivityIndicator size="small" color={PRIMARY} />
                ) : (
                    <Ionicons
                        name={
                            isSuccess ? 'checkmark-circle' : isError ? 'alert-circle' : 'navigate'
                        }
                        size={20}
                        color={isSuccess ? SUCCESS : isError ? DANGER : PRIMARY}
                    />
                )}
            </View>

            <View style={{ flex: 1 }}>
                <Text style={[lb.title, isSuccess && lb.titleSuccess, isError && lb.titleError]}>
                    {isLoading
                        ? 'Detecting location…'
                        : isSuccess
                        ? 'Location detected'
                        : isError
                        ? 'Location failed — tap to retry'
                        : 'Use current location'}
                </Text>
                {!!message && (
                    <Text style={lb.sub} numberOfLines={2}>
                        {message}
                    </Text>
                )}
                {!message && !isLoading && (
                    <Text style={lb.sub}>Auto-fill address from GPS via Google Maps</Text>
                )}
            </View>

            {!isLoading && (
                <View style={[lb.badge, isSuccess && lb.badgeSuccess, isError && lb.badgeError]}>
                    <Text
                        style={[
                            lb.badgeText,
                            isSuccess && lb.badgeTextSuccess,
                            isError && lb.badgeTextError,
                        ]}
                    >
                        {isSuccess ? 'Filled' : isError ? 'Retry' : 'GPS'}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const lb = StyleSheet.create({
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: `${PRIMARY}45`,
        borderRadius: Radii.md,
        backgroundColor: `${PRIMARY}06`,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        marginBottom: Spacing.lg,
    },
    btnSuccess: {
        borderStyle: 'solid',
        borderColor: `${SUCCESS}55`,
        backgroundColor: `${SUCCESS}08`,
    },
    btnError: {
        borderStyle: 'solid',
        borderColor: `${DANGER}45`,
        backgroundColor: `${DANGER}06`,
    },
    iconWrap: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: `${PRIMARY}12`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconSuccess: { backgroundColor: `${SUCCESS}15` },
    iconError: { backgroundColor: `${DANGER}12` },
    title: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
        marginBottom: 2,
    },
    titleSuccess: { color: SUCCESS },
    titleError: { color: DANGER },
    sub: { fontSize: 10, color: Colors.charcoalLight, lineHeight: 14 },
    badge: {
        backgroundColor: `${PRIMARY}12`,
        borderRadius: 4,
        paddingHorizontal: 7,
        paddingVertical: 3,
    },
    badgeSuccess: { backgroundColor: `${SUCCESS}18` },
    badgeError: { backgroundColor: `${DANGER}12` },
    badgeText: { fontSize: 10, fontWeight: '700', color: PRIMARY },
    badgeTextSuccess: { color: SUCCESS },
    badgeTextError: { color: DANGER },
});

// ─── Searchable Picker Field ───────────────────────────────────────────────

type SearchablePickerProps = {
    label: string;
    icon: string;
    value: string;
    placeholder: string;
    disabled?: boolean;
    open: boolean;
    onToggle: () => void;
    searchQuery: string;
    onSearchChange: (v: string) => void;
    options: PlacePrediction[];
    onSelect: (v: PlacePrediction) => void;
    required?: boolean;
    loading?: boolean;
};

function SearchablePicker({
    label,
    icon,
    value,
    placeholder,
    disabled,
    open,
    onToggle,
    searchQuery,
    onSearchChange,
    options,
    onSelect,
    required,
    loading,
}: SearchablePickerProps) {
    return (
        <View style={pk.wrap}>
            <Text style={pk.label}>
                {label}
                {required && <Text style={pk.required}> *</Text>}
            </Text>
            <TouchableOpacity
                style={[pk.btn, disabled && pk.btnDisabled, open && pk.btnOpen]}
                onPress={onToggle}
                activeOpacity={0.8}
                disabled={disabled}
            >
                <View style={[pk.iconWrap, open && pk.iconWrapActive]}>
                    <Ionicons
                        name={icon as any}
                        size={16}
                        color={open ? PRIMARY : value ? Colors.charcoalMid : Colors.charcoalLight}
                    />
                </View>
                <Text style={[pk.btnText, !value && pk.btnPlaceholder]} numberOfLines={1}>
                    {value || placeholder}
                </Text>
                <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={15}
                    color={open ? PRIMARY : Colors.charcoalLight}
                />
            </TouchableOpacity>
            {open && (
                <View style={pk.dropdown}>
                    <View style={pk.searchWrap}>
                        <Ionicons
                            name="search-outline"
                            size={16}
                            color={Colors.charcoalLight}
                            style={{ marginRight: 8 }}
                        />
                        <TextInput
                            style={pk.searchInput}
                            placeholder={`Search ${label.toLowerCase()}...`}
                            placeholderTextColor={Colors.charcoalLight}
                            value={searchQuery}
                            onChangeText={onSearchChange}
                            autoFocus
                            autoCapitalize="words"
                        />
                        {loading && <ActivityIndicator size="small" color={PRIMARY} />}
                    </View>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                        {options.length > 0 ? (
                            options.map(opt => (
                                <TouchableOpacity
                                    key={opt.place_id}
                                    style={pk.item}
                                    onPress={() => onSelect(opt)}
                                >
                                    <Ionicons
                                        name="location-outline"
                                        size={15}
                                        color={Colors.charcoalMid}
                                        style={{ marginRight: 8 }}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={pk.itemText}>
                                            {opt.structured_formatting.main_text}
                                        </Text>
                                        {opt.structured_formatting.secondary_text && (
                                            <Text style={pk.itemSubText}>
                                                {opt.structured_formatting.secondary_text}
                                            </Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={pk.emptyState}>
                                <Ionicons
                                    name="search-outline"
                                    size={24}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={pk.emptyText}>
                                    {searchQuery
                                        ? 'No results found'
                                        : `Type to search ${label.toLowerCase()}`}
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function Step3Address({ data, onChange }: Props) {
    const [showStatePicker, setShowStatePicker] = React.useState(false);
    const [showCityPicker, setShowCityPicker] = React.useState(false);
    const [locationStatus, setLocationStatus] = React.useState<LocationStatus>('idle');
    const [locationMsg, setLocationMsg] = React.useState('');

    // Search states
    const [stateSearchQuery, setStateSearchQuery] = React.useState('');
    const [citySearchQuery, setCitySearchQuery] = React.useState('');
    const [statePredictions, setStatePredictions] = React.useState<PlacePrediction[]>([]);
    const [cityPredictions, setCityPredictions] = React.useState<PlacePrediction[]>([]);
    const [stateLoading, setStateLoading] = React.useState(false);
    const [cityLoading, setCityLoading] = React.useState(false);

    const closeAll = () => {
        setShowStatePicker(false);
        setShowCityPicker(false);
        setStateSearchQuery('');
        setCitySearchQuery('');
    };

    // ── Progress ──────────────────────────────────────────────────────
    const requiredFilled = REQUIRED_FIELDS.filter(f => !!(data as any)[f]).length;
    const totalRequired = REQUIRED_FIELDS.length;
    const pct = Math.round((requiredFilled / totalRequired) * 100);

    // ── Location flow ──────────────────────────────────────────────────
    const handleUseLocation = async () => {
        setLocationStatus('loading');
        setLocationMsg('Requesting permission…');

        try {
            // 1 — Request permission
            const hasPermission = await requestLocationPermission();

            if (!hasPermission) {
                setLocationStatus('error');
                setLocationMsg('Location permission denied. Please enable it in Settings.');
                return;
            }

            setLocationMsg('Getting GPS coordinates…');

            // 2 — Get coordinates
            Geolocation.getCurrentPosition(
                async position => {
                    try {
                        const { latitude, longitude } = position.coords;
                        setLocationMsg('Fetching address from Google Maps…');

                        // 3 — Reverse geocode
                        const geo = await reverseGeocode(latitude, longitude);

                        // 4 — Populate form fields
                        if (geo.officeAddress) onChange('officeAddress', geo.officeAddress);
                        if (geo.area) onChange('area', geo.area);
                        if (geo.pincode) onChange('pincode', geo.pincode);
                        if (geo.village) onChange('village', geo.village);
                        if (geo.state) {
                            onChange('state', geo.state);
                            onChange('city', '');
                        }
                        if (geo.city) {
                            setTimeout(() => onChange('city', geo.city), 100);
                        }

                        setLocationStatus('success');
                        setLocationMsg([geo.area, geo.city, geo.state].filter(Boolean).join(', '));
                    } catch (err: any) {
                        console.error('Geocoding error:', err);
                        setLocationStatus('error');
                        setLocationMsg('Failed to fetch address. Please try again.');
                    }
                },
                error => {
                    console.error('Geolocation error:', error);
                    setLocationStatus('error');

                    let errorMessage = 'Could not detect location. ';
                    switch (error.code) {
                        case 1:
                            errorMessage += 'Permission denied. Enable location in Settings.';
                            break;
                        case 2:
                            errorMessage += 'Position unavailable. Check your GPS.';
                            break;
                        case 3:
                            errorMessage += 'Request timeout. Please try again.';
                            break;
                        default:
                            errorMessage += 'Please try again.';
                    }

                    setLocationMsg(errorMessage);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 10000,
                },
            );
        } catch (err: any) {
            console.error('Location error:', err);
            setLocationStatus('error');
            setLocationMsg(err?.message ?? 'Could not detect location. Please try again.');
        }
    };

    // ── State search ───────────────────────────────────────────────────
    React.useEffect(() => {
        if (!stateSearchQuery || stateSearchQuery.length < 2) {
            setStatePredictions([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setStateLoading(true);
            try {
                const predictions = await fetchPlacePredictions(
                    stateSearchQuery,
                    '(regions)',
                    'country:in',
                );
                setStatePredictions(predictions);
            } catch (error) {
                console.error('State search error:', error);
            } finally {
                setStateLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [stateSearchQuery]);

    // ── City search ────────────────────────────────────────────────────
    React.useEffect(() => {
        if (!citySearchQuery || citySearchQuery.length < 2) {
            setCityPredictions([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setCityLoading(true);
            try {
                const predictions = await fetchPlacePredictions(
                    citySearchQuery,
                    '(cities)',
                    `country:in${data.state ? `|administrative_area:${data.state}` : ''}`,
                );
                setCityPredictions(predictions);
            } catch (error) {
                console.error('City search error:', error);
            } finally {
                setCityLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [citySearchQuery, data.state]);

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.container}
            keyboardShouldPersistTaps="handled"
        >
            {/* ── Header ──────────────────────────────────────────────── */}
            <View style={s.headerRow}>
                <View style={s.headerIcon}>
                    <Ionicons name="location" size={18} color="#fff" />
                </View>
                <View>
                    <Text style={s.sectionTitle}>Business Address</Text>
                    <Text style={s.sectionSub}>Where customers can find or contact you</Text>
                </View>
            </View>

            {/* ── Progress ─────────────────────────────────────────────── */}
            <View style={s.progressWrap}>
                <View style={s.progressRow}>
                    <Text style={s.progressLabel}>
                        {requiredFilled}/{totalRequired} required fields
                    </Text>
                    <Text style={s.progressPct}>{pct}%</Text>
                </View>
                <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width: `${pct}%` as any }]} />
                </View>
            </View>

            {/* ── Location button ───────────────────────────────────────── */}
            <LocationButton
                status={locationStatus}
                message={locationMsg}
                onPress={handleUseLocation}
            />

            {/* ── Office Address ───────────────────────────────────────── */}
            <Field
                label="Office / Work Address *"
                placeholder="Building, street, landmark"
                icon="business-outline"
                value={data.officeAddress || ''}
                onChangeText={v => onChange('officeAddress', v)}
            />

            {/* ── State + City row ─────────────────────────────────────── */}
            <View style={s.rowWrap}>
                <View style={{ flex: 1, zIndex: 20 }}>
                    <SearchablePicker
                        label="State"
                        icon="map-outline"
                        value={data.state || ''}
                        placeholder="Search state"
                        required
                        open={showStatePicker}
                        onToggle={() => {
                            setShowStatePicker(v => !v);
                            setShowCityPicker(false);
                            setCitySearchQuery('');
                        }}
                        searchQuery={stateSearchQuery}
                        onSearchChange={setStateSearchQuery}
                        options={statePredictions}
                        onSelect={prediction => {
                            const stateName = prediction.structured_formatting.main_text;
                            onChange('state', stateName);
                            onChange('city', '');
                            closeAll();
                        }}
                        loading={stateLoading}
                    />
                </View>
                <View style={{ flex: 1, zIndex: 10 }}>
                    <SearchablePicker
                        label="City"
                        icon="location-outline"
                        value={data.city || ''}
                        placeholder={data.state ? 'Search city' : 'State first'}
                        disabled={!data.state}
                        required
                        open={showCityPicker}
                        onToggle={() => {
                            setShowCityPicker(v => !v);
                            setShowStatePicker(false);
                            setStateSearchQuery('');
                        }}
                        searchQuery={citySearchQuery}
                        onSearchChange={setCitySearchQuery}
                        options={cityPredictions}
                        onSelect={prediction => {
                            const cityName = prediction.structured_formatting.main_text;
                            onChange('city', cityName);
                            closeAll();
                        }}
                        loading={cityLoading}
                    />
                </View>
            </View>

            {/* ── Pincode + Area row ───────────────────────────────────── */}
            <View style={s.rowWrap}>
                <View style={{ flex: 1 }}>
                    <Field
                        label="Pincode *"
                        placeholder="6-digit pincode"
                        icon="locate-outline"
                        keyboardType="numeric"
                        maxLength={6}
                        value={data.pincode || ''}
                        onChangeText={v => onChange('pincode', v)}
                    />
                    {data.pincode?.length === 6 && (
                        <View style={s.hintRow}>
                            <Ionicons name="checkmark-circle-outline" size={12} color={PRIMARY} />
                            <Text style={s.hintText}>Valid pincode</Text>
                        </View>
                    )}
                </View>
                <View style={{ flex: 1 }}>
                    <Field
                        label="Area / Locality"
                        placeholder="e.g. Civil Lines"
                        icon="navigate-outline"
                        value={data.area || ''}
                        onChangeText={v => onChange('area', v)}
                    />
                </View>
            </View>

            {/* ── Village ──────────────────────────────────────────────── */}
            <Field
                label="Village"
                placeholder="Village name (if applicable)"
                icon="home-outline"
                value={data.village || ''}
                onChangeText={v => onChange('village', v)}
            />

            {/* ── Serviceable Areas ────────────────────────────────────── */}
            <View style={s.fieldWrap}>
                <Field
                    label="Serviceable Areas"
                    placeholder="Bhopal, Indore, Gwalior…"
                    icon="earth-outline"
                    value={(data.serviceableAreas || []).join(', ')}
                    onChangeText={v =>
                        onChange(
                            'serviceableAreas',
                            v
                                .split(',')
                                .map(a => a.trim())
                                .filter(Boolean),
                        )
                    }
                />
                <View style={s.hintRow}>
                    <Ionicons
                        name="information-circle-outline"
                        size={11}
                        color={Colors.charcoalLight}
                    />
                    <Text style={s.hintTextMuted}>Separate multiple areas with a comma</Text>
                </View>
            </View>

            {/* ── Divider ──────────────────────────────────────────────── */}
            <View style={s.divider}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>Online Presence</Text>
                <View style={s.dividerLine} />
            </View>

            <Field
                label="Website"
                placeholder="https://yourwebsite.com"
                icon="globe-outline"
                keyboardType="url"
                autoCapitalize="none"
                value={data.website || ''}
                onChangeText={v => onChange('website', v)}
            />
            <Field
                label="Instagram"
                placeholder="yourhandle (without @)"
                icon="logo-instagram"
                autoCapitalize="none"
                value={data.instagram || ''}
                onChangeText={v => onChange('instagram', v)}
            />
            <Field
                label="Facebook"
                placeholder="yourpagename"
                icon="logo-facebook"
                autoCapitalize="none"
                value={data.facebook || ''}
                onChangeText={v => onChange('facebook', v)}
            />

            {/* ── Info note ─────────────────────────────────────────────── */}
            <View style={s.infoNote}>
                <Ionicons name="shield-checkmark-outline" size={15} color={PRIMARY} />
                <Text style={s.infoNoteText}>
                    Your address is used to match you with nearby customers and is never shared
                    publicly without your consent.
                </Text>
            </View>
        </ScrollView>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    container: { paddingBottom: Spacing.xl },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    sectionSub: { fontSize: 11, color: Colors.charcoalLight, marginTop: 2 },

    progressWrap: { marginBottom: Spacing.lg },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    progressLabel: { fontSize: 11, color: Colors.charcoalLight },
    progressPct: { fontSize: 11, color: PRIMARY, fontWeight: '600' },
    progressTrack: {
        height: 4,
        borderRadius: 2,
        backgroundColor: `${PRIMARY}18`,
        overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 2, backgroundColor: PRIMARY },

    rowWrap: { flexDirection: 'row', gap: Spacing.md },
    fieldWrap: { marginBottom: Spacing.lg },

    hintRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: -Spacing.sm,
        marginBottom: Spacing.sm,
    },
    hintText: { fontSize: 10, color: PRIMARY },
    hintTextMuted: { fontSize: 10, color: Colors.charcoalLight },

    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginVertical: Spacing.lg,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
    dividerText: { fontSize: 11, color: Colors.charcoalLight, fontWeight: '500' },

    infoNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        backgroundColor: `${PRIMARY}08`,
        borderRadius: Radii.sm,
        padding: Spacing.md,
        marginTop: Spacing.sm,
    },
    infoNoteText: { flex: 1, fontSize: 11, color: Colors.charcoalLight, lineHeight: 16 },
});

const pk = StyleSheet.create({
    wrap: { marginBottom: Spacing.md },
    label: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        marginBottom: 7,
    },
    required: { color: Colors.danger },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        height: 54,
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
    },
    btnDisabled: { backgroundColor: Colors.surface, opacity: 0.6 },
    btnOpen: { borderColor: PRIMARY, backgroundColor: `${PRIMARY}08` },
    iconWrap: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: `${Colors.charcoalLight}15`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapActive: { backgroundColor: `${PRIMARY}15` },
    btnText: { flex: 1, fontSize: 15, color: Colors.charcoal },
    btnPlaceholder: { color: Colors.charcoalLight },
    dropdown: {
        position: 'absolute',
        top: 54 + 7 + 18,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.md,
        zIndex: 100,
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1.5,
        borderBottomColor: Colors.border,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.charcoal,
        padding: 0,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    itemText: {
        fontSize: Typography.base,
        color: Colors.charcoal,
        fontWeight: Typography.semiBold,
    },
    itemSubText: { fontSize: 11, color: Colors.charcoalLight, marginTop: 2 },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xl,
    },
    emptyText: {
        fontSize: 12,
        color: Colors.charcoalLight,
        marginTop: Spacing.sm,
    },
});

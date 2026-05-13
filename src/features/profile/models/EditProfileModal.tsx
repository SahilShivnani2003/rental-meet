import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Animated,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Field from '@/components/UI/InputField';
import LoadingDots from '@/components/UI/loading-dots';
import { useAlert } from '@/context/AlertContext';
import { Colors, Spacing, Radii, Shadows, Typography } from '@/theme/theme';
import { ApiError } from '@/types/ApiError';
import { User, UpdateUser } from '../types/User';
import Config from 'react-native-config';

const GOOGLE_PLACES_API_KEY = Config.GOOGLEAPI; // 🔑 Replace with your key

interface PlacePrediction {
    place_id: string;
    description: string;
    structured_formatting: {
        main_text: string;
        secondary_text: string;
    };
    types: string[];
}

interface CityStatePickerProps {
    label: string;
    placeholder: string;
    icon: string;
    value: string;
    onSelect: (value: string) => void;
    error?: string;
    types: '(cities)' | 'administrative_area_level_1';
}

function CityStatePicker({
    label,
    placeholder,
    icon,
    value,
    onSelect,
    error,
    types,
}: CityStatePickerProps) {
    const [query, setQuery] = useState(value);
    const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [fetching, setFetching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync external value changes (e.g. modal re-open pre-fill)
    useEffect(() => {
        setQuery(value);
    }, [value]);

    const fetchPredictions = async (input: string) => {
        if (!input || input.length < 2) {
            setPredictions([]);
            return;
        }
        setFetching(true);
        try {
            const typeParam = types === '(cities)' ? 'locality' : 'administrative_area_level_1';
            const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                input,
            )}&types=${typeParam}&components=country:in&key=${GOOGLE_PLACES_API_KEY}`;

            const res = await fetch(url);
            const data = await res.json();
            console.log('Google Places API response:', data);
            if (data.status === 'OK') {
                setPredictions(data.predictions ?? []);
            } else {
                setPredictions([]);
            }
        } catch(error) {
            console.error('Google Places API error:', error);
            setPredictions([]);
        } finally {
            setFetching(false);
        }
    };

    const handleChangeText = (text: string) => {
        setQuery(text);
        setShowDropdown(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchPredictions(text), 350);
    };

    const handleSelect = (prediction: PlacePrediction) => {
        const mainText = prediction.structured_formatting.main_text;
        setQuery(mainText);
        onSelect(mainText);
        setPredictions([]);
        setShowDropdown(false);
    };

    const handleBlur = () => {
        // Small delay so tap on suggestion registers before blur hides dropdown
        setTimeout(() => setShowDropdown(false), 180);
    };

    return (
        <View style={picker.wrapper}>
            {/* Label */}
            <Text style={picker.label}>{label}</Text>

            {/* Input row */}
            <View style={[picker.inputRow, error ? picker.inputRowError : null]}>
                <Ionicons
                    name={icon as string}
                    size={16}
                    color={Colors.charcoalLight}
                    style={picker.icon}
                />
                <TextInput
                    style={picker.input}
                    value={query}
                    onChangeText={handleChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.charcoalLight}
                    onFocus={() => query.length >= 2 && setShowDropdown(true)}
                    onBlur={handleBlur}
                    autoCapitalize="words"
                    autoCorrect={false}
                />
                {fetching && (
                    <Ionicons name="reload-outline" size={14} color={Colors.charcoalLight} />
                )}
                {!!query && !fetching && (
                    <TouchableOpacity
                        onPress={() => {
                            setQuery('');
                            onSelect('');
                            setPredictions([]);
                        }}
                    >
                        <Ionicons name="close-circle" size={16} color={Colors.charcoalLight} />
                    </TouchableOpacity>
                )}
            </View>

            {error ? <Text style={picker.errorText}>{error}</Text> : null}

            {/* Dropdown */}
            {showDropdown && predictions.length > 0 && (
                <View style={picker.dropdown}>
                    {predictions.map(item => (
                        <TouchableOpacity
                            key={item.place_id}
                            style={picker.suggestion}
                            onPress={() => handleSelect(item)}
                            activeOpacity={0.75}
                        >
                            <Ionicons
                                name="location-outline"
                                size={14}
                                color={Colors.charcoalLight}
                                style={{ marginRight: 8, marginTop: 1 }}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={picker.suggestionMain}>
                                    {item.structured_formatting.main_text}
                                </Text>
                                <Text style={picker.suggestionSub} numberOfLines={1}>
                                    {item.structured_formatting.secondary_text}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

// ─── Picker styles ─────────────────────────────────────────────────────────────
const picker = StyleSheet.create({
    wrapper: { marginBottom: Spacing.sm, zIndex: 10 },
    label: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginBottom: 6,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: Radii.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: Spacing.md,
        height: 48,
        gap: 8,
    },
    inputRowError: { borderColor: '#E53E3E' },
    icon: { marginRight: 2 },
    input: {
        flex: 1,
        fontSize: 14,
        color: Colors.charcoal,
        paddingVertical: 0,
    },
    errorText: { fontSize: 12, color: '#E53E3E', marginTop: 4 },
    dropdown: {
        position: 'absolute',
        top: 76, // label height + input height + gap
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderRadius: Radii.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.floating,
        zIndex: 999,
        maxHeight: 220,
        overflow: 'hidden',
    },
    suggestion: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    suggestionMain: {
        fontSize: 13,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    suggestionSub: {
        fontSize: 11,
        color: Colors.charcoalLight,
        marginTop: 1,
    },
});

// ─── Main modal ────────────────────────────────────────────────────────────────
interface Props {
    visible: boolean;
    onClose: () => void;
    user: Partial<User>;
    mutate: (
        data: UpdateUser,
        callbacks: { onSuccess: () => void; onError: (e: ApiError) => void },
    ) => void;
}

export default function EditProfileModal({ visible, onClose, user, mutate }: Props) {
    const alert = useAlert();
    const slideAnim = useRef(new Animated.Value(600)).current;

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [gstNumber, setGstNumber] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [panNumber, setPanNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (visible) {
            setName(user.name ?? '');
            setEmail(user.email ?? '');
            setPhone(user.phone ?? '');
            setAddress(user.address ?? '');
            setCity(user.city ?? '');
            setState(user.state ?? '');
            setPincode(user.pincode ?? '');
            setGstNumber(user.gstNumber ?? '');
            setCompanyName(user.companyName ?? '');
            setPanNumber(user.panNumber ?? '');
            setErrors({});

            slideAnim.setValue(600);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                speed: 18,
                bounciness: 4,
            }).start();
        }
    }, [visible]);

    const clearError = (key: string) => setErrors(prev => ({ ...prev, [key]: '' }));

    const validate = () => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = 'Name is required';
        if (!email.trim()) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
        if (pincode && !/^\d{6}$/.test(pincode)) e.pincode = 'Enter a valid 6-digit pincode';
        return e;
    };

    const handleSave = () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        const payload: UpdateUser = {
            name,
            email,
            phone: phone || undefined,
            address: address || undefined,
            city: city || undefined,
            state: state || undefined,
            pincode: pincode || undefined,
            gstNumber: gstNumber || undefined,
            companyName: companyName || undefined,
            panNumber: panNumber || undefined,
        };

        setLoading(true);
        mutate(payload, {
            onSuccess: () => {
                setLoading(false);
                alert.success('Profile Updated', 'Your profile has been updated successfully.');
                onClose();
            },
            onError: (error: ApiError) => {
                setLoading(false);
                alert.error('Update Failed', error?.message || 'Something went wrong.');
            },
        });
    };

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: 600,
            duration: 220,
            useNativeDriver: true,
        }).start(onClose);
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <View style={s.overlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFillObject}
                    activeOpacity={1}
                    onPress={handleClose}
                />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={s.kavWrapper}
                >
                    <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
                        <View style={s.handle} />

                        <View style={s.header}>
                            <View>
                                <Text style={s.headerTitle}>Edit Profile</Text>
                                <Text style={s.headerSub}>Update your personal information</Text>
                            </View>
                            <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
                                <Ionicons name="close" size={20} color={Colors.charcoal} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={s.body}
                            keyboardShouldPersistTaps="handled"
                            // Needed so dropdown isn't clipped by ScrollView
                            nestedScrollEnabled
                        >
                            <Text style={s.sectionLabel}>BASIC INFO</Text>

                            <Field
                                label="Full Name"
                                placeholder="Sara Patel"
                                icon="person-outline"
                                value={name}
                                onChangeText={t => {
                                    setName(t);
                                    clearError('name');
                                }}
                                error={errors.name}
                                autoCapitalize="words"
                            />
                            <Field
                                label="Email Address"
                                placeholder="you@example.com"
                                icon="mail-outline"
                                value={email}
                                onChangeText={t => {
                                    setEmail(t);
                                    clearError('email');
                                }}
                                error={errors.email}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <Field
                                label="Phone Number"
                                placeholder="+91 98765 43210"
                                icon="call-outline"
                                value={phone}
                                onChangeText={t => setPhone(t.replace(/[^\d\s+\-()]/g, ''))}
                                keyboardType="phone-pad"
                                maxLength={13}
                            />

                            <Text style={[s.sectionLabel, { marginTop: Spacing.lg }]}>ADDRESS</Text>

                            <Field
                                label="Address"
                                placeholder="House / Street / Locality"
                                icon="location-outline"
                                value={address}
                                onChangeText={setAddress}
                                autoCapitalize="sentences"
                            />

                            {/* ── City & State — Google Places dropdowns ── */}
                            <View style={s.row}>
                                <View style={{ flex: 1 }}>
                                    <CityStatePicker
                                        label="City"
                                        placeholder="Bhopal"
                                        icon="business-outline"
                                        value={city}
                                        onSelect={setCity}
                                        types="(cities)"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <CityStatePicker
                                        label="State"
                                        placeholder="Madhya Pradesh"
                                        icon="map-outline"
                                        value={state}
                                        onSelect={setState}
                                        types="administrative_area_level_1"
                                    />
                                </View>
                            </View>

                            <Field
                                label="Pincode"
                                placeholder="462001"
                                icon="pin-outline"
                                value={pincode}
                                onChangeText={t => {
                                    setPincode(t.replace(/\D/g, ''));
                                    clearError('pincode');
                                }}
                                error={errors.pincode}
                                keyboardType="numeric"
                                maxLength={6}
                            />

                            <Text style={[s.sectionLabel, { marginTop: Spacing.lg }]}>
                                BUSINESS (OPTIONAL)
                            </Text>

                            <Field
                                label="Company Name"
                                placeholder="Acme Pvt. Ltd."
                                icon="briefcase-outline"
                                value={companyName}
                                onChangeText={setCompanyName}
                                autoCapitalize="words"
                            />
                            <Field
                                label="GST Number"
                                placeholder="22AAAAA0000A1Z5"
                                icon="receipt-outline"
                                value={gstNumber}
                                onChangeText={t => setGstNumber(t.toUpperCase())}
                                autoCapitalize="characters"
                                maxLength={15}
                            />
                            <Field
                                label="PAN Number"
                                placeholder="ABCDE1234F"
                                icon="card-outline"
                                value={panNumber}
                                onChangeText={t => setPanNumber(t.toUpperCase())}
                                autoCapitalize="characters"
                                maxLength={10}
                            />

                            <TouchableOpacity
                                style={[s.saveBtn, loading && { opacity: 0.7 }]}
                                onPress={handleSave}
                                disabled={loading}
                                activeOpacity={0.88}
                            >
                                {loading ? (
                                    <LoadingDots />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={18}
                                            color={Colors.charcoal}
                                        />
                                        <Text style={s.saveBtnText}>Save Changes</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </Animated.View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    kavWrapper: { justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        paddingTop: 12,
        maxHeight: '92%',
        ...Shadows.floating,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    headerSub: { fontSize: 12, color: Colors.charcoalLight, marginTop: 2 },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: Radii.sm,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: { padding: Spacing.xl, paddingBottom: 40 },
    sectionLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 1.8,
        marginBottom: Spacing.sm,
    },
    row: { flexDirection: 'row', gap: Spacing.sm },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        borderRadius: Radii.md,
        height: 54,
        marginTop: Spacing.xl,
        ...Shadows.primary,
    },
    saveBtnText: { fontSize: 15, fontWeight: Typography.extraBold, color: Colors.charcoal },
});

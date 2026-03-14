import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Dimensions,
    Modal,
    FlatList,
    Platform,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme/theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigations/RootNavigation';
import { useAuthStore } from '../store/auth-store';
import { venueAPI } from '../service/apis/venues';
import { bookingAPI } from '../service/apis/booking';
import { useAlert } from '../context/AlertContext';
import { Venue, SelectedAmenityItem } from './venue-detail';

const { width: W } = Dimensions.get('window');

// ─── Types ─────────────────────────────────────────────────────────────────────

type DurationOption = {
    key: string;
    label: string;
    hours: number | null;
    price: number;
    type: 'perHour' | 'halfDay' | 'fullDay';
    multiplier?: number;
};

type PlatformSettings = {
    gstRate: number;
    platformFee: { feeType: 'percentage' | 'flat'; feeValue: number };
    commissionRate: number;
};

type BookingScreenProps = NativeStackScreenProps<RootStackParamList, 'booking'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateTimeSlots(openingTime: string, closingTime: string): string[] {
    const slots: string[] = [];
    const [openH, openM] = openingTime.split(':').map(Number);
    const [closeH, closeM] = closingTime.split(':').map(Number);
    let h = openH,
        m = openM;
    while (h < closeH || (h === closeH && m <= closeM)) {
        const suffix = h < 12 ? 'AM' : 'PM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        const displayM = m === 0 ? '00' : '30';
        slots.push(`${displayH}:${displayM} ${suffix}`);
        m += 30;
        if (m >= 60) {
            m = 0;
            h++;
        }
    }
    return slots;
}

// Convert display time "2:30 PM" → "14:30" (API expects 24-hr HH:mm)
function to24Hr(display: string): string {
    const [time, period] = display.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function isWeekend(dateStr: string): boolean {
    const d = new Date(dateStr);
    return d.getDay() === 0 || d.getDay() === 6;
}

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

function parseTermsList(raw: any): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) {
        return raw
            .map((t: any) =>
                typeof t === 'string' ? t : t?.content ?? t?.description ?? t?.title ?? '',
            )
            .filter(Boolean);
    }
    if (typeof raw === 'object') {
        const nested = raw?.terms ?? raw?.items ?? raw?.data ?? raw?.content;
        if (nested) return parseTermsList(nested);
    }
    return [];
}

// Map DurationOption.type → bookingType string expected by API
// Sample shows "fullday" (lowercase, no camel)
function toBookingType(type: DurationOption['type']): string {
    switch (type) {
        case 'perHour':
            return 'perhour';
        case 'halfDay':
            return 'halfday';
        case 'fullDay':
            return 'fullday';
    }
}

// ─── Build selectedAmenities payload ──────────────────────────────────────────
// Matches the exact shape from the sample:
// { basic[], beverages[], refreshmentFood[], lunchThalis[], additional[] }

function buildSelectedAmenitiesPayload(items: SelectedAmenityItem[]) {
    const basic: object[] = [];
    const beverages: object[] = [];
    const refreshmentFood: object[] = [];
    const lunchThalis: object[] = [];
    const additional: object[] = [];

    for (const item of items) {
        switch (item.category) {
            case 'basic_included':
                basic.push({
                    name: item.name,
                    type: 'Included',
                    rate: 0,
                    rateType: 'Fixed',
                    quantity: item.qty,
                    total: 0,
                });
                break;
            case 'basic_paid':
                basic.push({
                    name: item.name,
                    type: 'Paid',
                    rate: item.unitPrice,
                    rateType: item.rateType ?? 'Fixed',
                    quantity: item.qty,
                    total: item.total,
                });
                break;
            case 'additional':
                additional.push({
                    name: item.name,
                    type: 'Paid',
                    rate: item.unitPrice,
                    rateType: 'Fixed',
                    quantity: item.qty,
                    total: item.total,
                });
                break;
            case 'beverage':
                beverages.push({
                    name: item.name,
                    rate: item.unitPrice,
                    rateType: 'Per Person',
                    quantity: item.qty,
                    total: item.total,
                });
                break;
            case 'refreshment':
                refreshmentFood.push({
                    name: item.name,
                    ratePerPlate: item.unitPrice,
                    quantity: item.qty,
                    total: item.total,
                });
                break;
            case 'thali':
                lunchThalis.push({
                    thaliType: item.name,
                    category: item.thaliCategory ?? 'Regular Thali',
                    ratePerPlate: item.unitPrice,
                    numberOfItems: item.numberOfItems ?? 0,
                    itemNames: item.itemNames ?? '',
                    quantity: item.qty,
                    total: item.total,
                });
                break;
        }
    }

    return { basic, beverages, refreshmentFood, lunchThalis, additional };
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function BookingScreen({ navigation, route }: BookingScreenProps) {
    const params = route.params as {
        venue: Venue;
        selectedAmenities?: SelectedAmenityItem[];
        amenitiesTotal?: number;
        preselectedDurationHours?: number;
    };

    const venue = params?.venue;
    const incomingAmenities: SelectedAmenityItem[] = params?.selectedAmenities ?? [];
    const incomingAmenitiesTotal: number = params?.amenitiesTotal ?? 0;

    const { user } = useAuthStore();
    const alert = useAlert();
    const [submitting, setSubmitting] = useState(false);

    // ── Modal visibility ──────────────────────────────────────────────────────
    const [timePickerVisible, setTimePickerVisible] = useState(false);
    const [eventPickerVisible, setEventPickerVisible] = useState(false);

    // ── Platform settings & terms ─────────────────────────────────────────────
    const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
        gstRate: 18,
        platformFee: { feeType: 'percentage', feeValue: 5 },
        commissionRate: 0,
    });
    const [termsList, setTermsList] = useState<string[]>([]);

    useEffect(() => {
        fetchPlatformSettings();
        fetchTerms();
    }, []);

    const fetchPlatformSettings = async () => {
        try {
            const res = await venueAPI.platformSetting();
            // Response: { success, settings: { gstRate, platformFee: { feeType, feeValue }, commissionRate } }
            if (res?.success && res?.settings) {
                setPlatformSettings({
                    gstRate: res.settings.gstRate ?? 18,
                    platformFee: {
                        feeType: res.settings.platformFee?.feeType ?? 'percentage',
                        feeValue: res.settings.platformFee?.feeValue ?? 5,
                    },
                    commissionRate: res.settings.commissionRate ?? 0,
                });
            }
        } catch (e) {
            console.error('FETCH PLATFORM SETTING ERROR:', e);
        }
    };

    const fetchTerms = async () => {
        try {
            const res = await bookingAPI.terms();
            if (res?.success) {
                setTermsList(parseTermsList(res?.terms ?? res?.data ?? res));
            }
        } catch (e) {
            console.error('FETCH TERMS ERROR:', e);
        }
    };

    // ── Guard ─────────────────────────────────────────────────────────────────
    if (!venue) {
        return (
            <View style={s.centered}>
                <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
                <Text style={s.errorText}>Venue data not found.</Text>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={s.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { pricing, availability, venueType, capacity } = venue;
    const today = new Date().toISOString().split('T')[0];
    const wknd = isWeekend(today);

    // ── Duration options ──────────────────────────────────────────────────────
    const durationOptions: DurationOption[] = useMemo(() => {
        const opts: DurationOption[] = [];

        if (pricing?.enabledOptions?.perHour) {
            const rate = wknd ? pricing.perHour?.weekend : pricing.perHour?.weekday;
            if (rate) {
                [1, 2, 4].forEach(h =>
                    opts.push({
                        key: `${h}h`,
                        label: `${h}h`,
                        hours: h,
                        price: rate * h,
                        type: 'perHour',
                        multiplier: h,
                    }),
                );
            }
        }
        if (pricing?.enabledOptions?.halfDay) {
            const rate = wknd ? pricing.halfDay?.weekend : pricing.halfDay?.weekday;
            if (rate)
                opts.push({
                    key: 'halfDay',
                    label: 'Half Day',
                    hours: null,
                    price: rate,
                    type: 'halfDay',
                });
        }
        if (pricing?.enabledOptions?.fullDay) {
            const rate = wknd ? pricing.fullDay?.weekend : pricing.fullDay?.weekday;
            if (rate)
                opts.push({
                    key: 'fullDay',
                    label: 'Full Day',
                    hours: null,
                    price: rate,
                    type: 'fullDay',
                });
        }

        // Fallback: build from raw pricing if enabledOptions not set
        if (opts.length === 0) {
            const rate = wknd ? pricing.perHour?.weekend : pricing.perHour?.weekday;
            if (rate) {
                [1, 2, 4].forEach(h =>
                    opts.push({
                        key: `${h}h`,
                        label: `${h}h`,
                        hours: h,
                        price: rate * h,
                        type: 'perHour',
                        multiplier: h,
                    }),
                );
            }
            const halfRate = wknd ? pricing.halfDay?.weekend : pricing.halfDay?.weekday;
            if (halfRate)
                opts.push({
                    key: 'halfDay',
                    label: 'Half Day',
                    hours: null,
                    price: halfRate,
                    type: 'halfDay',
                });
            const fullRate = wknd ? pricing.fullDay?.weekend : pricing.fullDay?.weekday;
            if (fullRate)
                opts.push({
                    key: 'fullDay',
                    label: 'Full Day',
                    hours: null,
                    price: fullRate,
                    type: 'fullDay',
                });
        }

        return opts;
    }, [pricing, wknd]);

    const timeSlots = useMemo(
        () =>
            generateTimeSlots(
                availability?.openingTime ?? '09:00',
                availability?.closingTime ?? '21:00',
            ),
        [availability],
    );

    // ── Default duration (pre-selected from VenueDetailScreen) ────────────────
    const defaultDuration = useMemo(() => {
        const preHours = params?.preselectedDurationHours;
        if (preHours) {
            const match = durationOptions.find(o => o.hours === preHours);
            if (match) return match;
        }
        return durationOptions[0] ?? null;
    }, [durationOptions, params?.preselectedDurationHours]);

    // ── Form state ────────────────────────────────────────────────────────────
    const [selectedDuration, setSelectedDuration] = useState<DurationOption | null>(
        defaultDuration,
    );
    const [bookingDate, setBookingDate] = useState(today);
    const [startTime, setStartTime] = useState(timeSlots[0] ?? '10:00 AM');
    const [fullName, setFullName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [eventType, setEventType] = useState(venueType?.[0] ?? '');
    const [guestCount, setGuestCount] = useState('');
    const [specialRequirements, setSpecialRequirements] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // ── Computed end time ─────────────────────────────────────────────────────
    const endTime = useMemo(() => {
        if (!selectedDuration || selectedDuration.hours === null) return '—';
        const idx = timeSlots.indexOf(startTime);
        if (idx === -1) return '—';
        const endIdx = idx + selectedDuration.hours * 2; // 30-min slots
        return timeSlots[endIdx] ?? 'Closing';
    }, [selectedDuration, startTime, timeSlots]);

    // ── Price calculation ─────────────────────────────────────────────────────
    const basePrice = selectedDuration?.price ?? 0; // venue rental only
    const subtotal = basePrice + incomingAmenitiesTotal;

    const platformFeeRate = useMemo(() => {
        if (venue.customPlatformFee?.enabled)
            return (venue.customPlatformFee.percentage ?? 5) / 100;
        if (platformSettings.platformFee.feeType === 'percentage')
            return platformSettings.platformFee.feeValue / 100;
        return 0;
    }, [venue.customPlatformFee, platformSettings]);

    const platformFlatFee = useMemo(() => {
        if (venue.customPlatformFee?.enabled) return 0;
        if (platformSettings.platformFee.feeType === 'flat')
            return platformSettings.platformFee.feeValue;
        return 0;
    }, [venue.customPlatformFee, platformSettings]);

    const gstRate = useMemo(() => {
        if (venue.customGST?.enabled) return (venue.customGST.rate ?? 0) / 100;
        return platformSettings.gstRate / 100;
    }, [venue.customGST, platformSettings]);

    const platformFee = Math.round(subtotal * platformFeeRate) + platformFlatFee;
    const gstAmount = Math.round(subtotal * gstRate); // GST on subtotal (pre-fee)
    const total = subtotal + platformFee + gstAmount;

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = useCallback((): string | null => {
        if (!selectedDuration) return 'Please select a duration.';
        if (!bookingDate) return 'Please enter a booking date.';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) return 'Date must be YYYY-MM-DD format.';
        if (new Date(bookingDate) < new Date(today)) return 'Booking date cannot be in the past.';
        if (!fullName.trim()) return 'Full name is required.';
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return 'Please enter a valid email.';
        if (!phone.trim() || !/^[0-9]{10}$/.test(phone.replace(/\s/g, '')))
            return 'Please enter a valid 10-digit phone number.';
        if (!eventType) return 'Please select an event type.';
        if (!guestCount || isNaN(Number(guestCount)) || Number(guestCount) <= 0)
            return 'Please enter a valid guest count.';
        if (capacity && Number(guestCount) > capacity)
            return `Guest count cannot exceed venue capacity of ${capacity}.`;
        return null;
    }, [
        selectedDuration,
        bookingDate,
        today,
        fullName,
        email,
        phone,
        eventType,
        guestCount,
        capacity,
    ]);

    // ── Confirm booking ───────────────────────────────────────────────────────
    const handleConfirmBooking = async () => {
        const err = validate();
        if (err) {
            (alert.error ?? alert.show)?.('Validation Error', err);
            return;
        }
        setSubmitting(true);
        try {
            // Matches the exact payload shape from the API sample
            const bookingData = {
                venue: venue._id ?? venue.id,
                bookingDate,
                startTime: to24Hr(startTime), // "14:30"  ← 24-hr
                endTime: endTime === '—' ? null : endTime, // display string or null
                bookingType: toBookingType(selectedDuration!.type), // "fullday" / "halfday" / "perhour"
                amount: total, // top-level total
                amenitiesTotal: incomingAmenitiesTotal, // top-level
                selectedAmenities: buildSelectedAmenitiesPayload(incomingAmenities),
                priceBreakdown: {
                    basePrice, // venue rental only
                    amenitiesTotal: incomingAmenitiesTotal,
                    subtotal, // basePrice + amenitiesTotal
                    gst: gstAmount,
                    gstRate: Math.round(gstRate * 100),
                    platformFee,
                    total,
                },
                customerDetails: {
                    name: fullName.trim(),
                    email: email.trim().toLowerCase(),
                    phone: phone.trim().replace(/\s/g, ''),
                    eventType,
                    guestCount: Number(guestCount), // included in customerDetails
                    specialRequirements: specialRequirements.trim(),
                },
            };

            debugger;
            const response = await bookingAPI.create(bookingData);
            debugger;
            if (response?.success) {
                (alert.success ?? alert.show)?.(
                    'Booking Requested! 🎉',
                    'Your request has been submitted. The venue owner will confirm shortly.',
                );
                navigation.popToTop?.() ?? navigation.goBack();
            } else {
                const msg = response?.message ?? 'Something went wrong. Please try again.';
                (alert.error ?? alert.show)?.('Booking Failed', msg);
            }
        } catch (error: any) {
            console.error('CREATE BOOKING ERROR:', error);
            const msg =
                error?.response?.data?.message ??
                error?.message ??
                'Network error. Please check your connection and try again.';
            (alert.error ?? alert.show)?.('Error', msg);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Generate quotation ────────────────────────────────────────────────────
    const handleGenerateQuote = async () => {
        const err = validate();
        if (err) {
            (alert.error ?? alert.show)?.('Validation Error', err);
            return;
        }
        (alert.info ?? alert.show)?.('Coming Soon', 'Quotation generation will be available soon.');
    };

    const footerDisabled = !agreedToTerms || submitting;

    return (
        <View style={s.root}>
            {/* ── Header ───────────────────────────────────────────────────── */}
            <View style={s.header}>
                <View style={s.headerText}>
                    <Text style={s.headerTitle}>Book Venue</Text>
                    <Text style={s.headerSub} numberOfLines={1}>
                        {venue.businessName}
                    </Text>
                </View>
                <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={20} color={Colors.charcoal} />
                </TouchableOpacity>
            </View>
            <View style={s.headerDivider} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scroll}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Duration ─────────────────────────────────────────────── */}
                <View style={s.section}>
                    <Text style={s.sectionLabel}>
                        Select Duration <Text style={s.req}>*</Text>
                    </Text>
                    {durationOptions.length === 0 ? (
                        <Text style={s.noOptions}>No pricing options configured.</Text>
                    ) : (
                        <View style={s.durationGrid}>
                            {durationOptions.map(opt => {
                                const active = selectedDuration?.key === opt.key;
                                return (
                                    <TouchableOpacity
                                        key={opt.key}
                                        style={[s.durationCard, active && s.durationCardActive]}
                                        onPress={() => setSelectedDuration(opt)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons
                                            name="time-outline"
                                            size={22}
                                            color={active ? Colors.primary : Colors.charcoalLight}
                                        />
                                        <Text
                                            style={[
                                                s.durationLabel,
                                                active && s.durationLabelActive,
                                            ]}
                                        >
                                            {opt.label}
                                        </Text>
                                        <Text
                                            style={[
                                                s.durationPrice,
                                                active && s.durationPriceActive,
                                            ]}
                                        >
                                            {fmt(opt.price)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* ── Date / Time ──────────────────────────────────────────── */}
                <View style={s.section}>
                    <View style={s.dateTimeRow}>
                        {/* Booking Date */}
                        <View style={[s.dateTimeCol, { flex: 1.2 }]}>
                            <Text style={s.fieldLabel}>
                                Booking Date <Text style={s.req}>*</Text>
                            </Text>
                            <View style={s.inputWrap}>
                                <Ionicons
                                    name="calendar-outline"
                                    size={16}
                                    color={Colors.charcoalLight}
                                />
                                <TextInput
                                    style={s.input}
                                    value={bookingDate}
                                    onChangeText={setBookingDate}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={Colors.charcoalLight}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {/* Start Time */}
                        <View style={s.dateTimeCol}>
                            <Text style={s.fieldLabel}>
                                Start Time <Text style={s.req}>*</Text>
                            </Text>
                            <TouchableOpacity
                                style={s.inputWrap}
                                onPress={() => setTimePickerVisible(true)}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name="time-outline"
                                    size={16}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={[s.input, s.inputText]}>{startTime}</Text>
                                <Ionicons
                                    name="chevron-down"
                                    size={14}
                                    color={Colors.charcoalLight}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* End Time */}
                        <View style={s.dateTimeCol}>
                            <Text style={s.fieldLabel}>End Time</Text>
                            <View style={[s.inputWrap, s.inputDisabled]}>
                                <Ionicons
                                    name="time-outline"
                                    size={16}
                                    color={Colors.charcoalLight}
                                />
                                <Text
                                    style={[s.input, s.inputText, { color: Colors.charcoalLight }]}
                                >
                                    {endTime}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Your Details ─────────────────────────────────────────── */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Your Details</Text>

                    {/* Full Name + Email */}
                    <View style={s.twoCol}>
                        <View style={s.col}>
                            <Text style={s.fieldLabel}>
                                Full Name <Text style={s.req}>*</Text>
                            </Text>
                            <View style={s.inputWrap}>
                                <TextInput
                                    style={s.input}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholder="Your name"
                                    placeholderTextColor={Colors.charcoalLight}
                                />
                            </View>
                        </View>
                        <View style={s.col}>
                            <Text style={s.fieldLabel}>
                                Email <Text style={s.req}>*</Text>
                            </Text>
                            <View style={s.inputWrap}>
                                <TextInput
                                    style={s.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="you@email.com"
                                    placeholderTextColor={Colors.charcoalLight}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Phone + Event Type */}
                    <View style={s.twoCol}>
                        <View style={s.col}>
                            <Text style={s.fieldLabel}>
                                Phone <Text style={s.req}>*</Text>
                            </Text>
                            <View style={s.inputWrap}>
                                <TextInput
                                    style={s.input}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="10-digit mobile"
                                    placeholderTextColor={Colors.charcoalLight}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>
                        <View style={s.col}>
                            <Text style={s.fieldLabel}>
                                Event Type <Text style={s.req}>*</Text>
                            </Text>
                            <TouchableOpacity
                                style={s.inputWrap}
                                onPress={() => setEventPickerVisible(true)}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        s.input,
                                        s.inputText,
                                        !eventType && { color: Colors.charcoalLight },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {eventType || 'Select event type'}
                                </Text>
                                <Ionicons
                                    name="chevron-down"
                                    size={14}
                                    color={Colors.charcoalLight}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Guest Count + Special Requirements */}
                    <View style={s.twoCol}>
                        <View style={s.col}>
                            <Text style={s.fieldLabel}>
                                Guest Count <Text style={s.req}>*</Text>
                            </Text>
                            <View style={s.inputWrap}>
                                <TextInput
                                    style={s.input}
                                    value={guestCount}
                                    onChangeText={setGuestCount}
                                    placeholder="No. of guests"
                                    placeholderTextColor={Colors.charcoalLight}
                                    keyboardType="numeric"
                                />
                            </View>
                            {!!capacity && <Text style={s.hintText}>Max capacity: {capacity}</Text>}
                        </View>
                        <View style={s.col}>
                            <Text style={s.fieldLabel}>Special Requirements</Text>
                            <View style={[s.inputWrap, s.textareaWrap]}>
                                <TextInput
                                    style={[s.input, s.textarea]}
                                    value={specialRequirements}
                                    onChangeText={setSpecialRequirements}
                                    placeholder="Any special requests..."
                                    placeholderTextColor={Colors.charcoalLight}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Selected Amenities (passed from VenueDetailScreen) ────── */}
                {incomingAmenities.length > 0 && (
                    <View style={s.amenitiesCard}>
                        <View style={s.amenitiesHeader}>
                            <Ionicons name="options-outline" size={17} color={Colors.charcoal} />
                            <Text style={s.amenitiesTitle}>Selected Amenities</Text>
                            <View style={s.amenitiesCountBadge}>
                                <Text style={s.amenitiesCountText}>{incomingAmenities.length}</Text>
                            </View>
                        </View>
                        {incomingAmenities.map((item, i) => (
                            <View key={i} style={s.amenityRow}>
                                <View style={s.amenityDot} />
                                <Text style={s.amenityName} numberOfLines={1}>
                                    {item.name}
                                </Text>
                                {item.qty > 1 && <Text style={s.amenityQty}>×{item.qty}</Text>}
                                <Text style={s.amenityTotal}>{fmt(item.total)}</Text>
                            </View>
                        ))}
                        <View style={s.amenitiesDivider} />
                        <View style={s.amenitiesTotalRow}>
                            <Text style={s.amenitiesTotalLabel}>Amenities Total</Text>
                            <Text style={s.amenitiesTotalValue}>{fmt(incomingAmenitiesTotal)}</Text>
                        </View>
                    </View>
                )}

                {/* ── Price Summary ─────────────────────────────────────────── */}
                <View style={s.priceSummaryCard}>
                    <View style={s.priceSummaryHeader}>
                        <Ionicons name="receipt-outline" size={17} color={Colors.charcoal} />
                        <Text style={s.priceSummaryTitle}>Price Summary</Text>
                    </View>
                    <View style={s.priceRow}>
                        <Text style={s.priceRowLabel}>Base Price</Text>
                        <Text style={s.priceRowValue}>{fmt(basePrice)}</Text>
                    </View>
                    {incomingAmenitiesTotal > 0 && (
                        <View style={s.priceRow}>
                            <Text style={s.priceRowLabel}>Amenities</Text>
                            <Text style={s.priceRowValue}>{fmt(incomingAmenitiesTotal)}</Text>
                        </View>
                    )}
                    {incomingAmenitiesTotal > 0 && (
                        <View style={s.priceRow}>
                            <Text style={s.priceRowLabel}>Subtotal</Text>
                            <Text style={s.priceRowValue}>{fmt(subtotal)}</Text>
                        </View>
                    )}
                    <View style={s.priceRow}>
                        <Text style={s.priceRowLabel}>
                            Platform Fee ({Math.round(platformFeeRate * 100)}%)
                        </Text>
                        <Text style={[s.priceRowValue, s.priceRowFee]}>{fmt(platformFee)}</Text>
                    </View>
                    {gstRate > 0 && (
                        <View style={s.priceRow}>
                            <Text style={s.priceRowLabel}>GST ({Math.round(gstRate * 100)}%)</Text>
                            <Text style={s.priceRowValue}>{fmt(gstAmount)}</Text>
                        </View>
                    )}
                    <View style={s.priceDivider} />
                    <View style={s.priceTotalRow}>
                        <Text style={s.priceTotalLabel}>Total Amount</Text>
                        <View style={s.priceTotalRight}>
                            <Text style={s.priceTotalValue}>{fmt(total)}</Text>
                            <Text style={s.priceRateType}>
                                {wknd ? 'Weekend rate' : 'Weekday rate'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── Terms & Conditions ───────────────────────────────────── */}
                {termsList.length > 0 && (
                    <View style={s.termsCard}>
                        <Text style={s.termsTitle}>Terms & Conditions</Text>
                        {termsList.map((t, i) => (
                            <View key={i} style={s.termRow}>
                                <View style={s.termBullet} />
                                <Text style={s.termText}>{t}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* ── Agree checkbox ───────────────────────────────────────── */}
                <TouchableOpacity
                    style={s.agreeRow}
                    onPress={() => setAgreedToTerms(v => !v)}
                    activeOpacity={0.8}
                >
                    <View style={[s.agreeCheckbox, agreedToTerms && s.agreeCheckboxOn]}>
                        {agreedToTerms && (
                            <Ionicons name="checkmark" size={13} color={Colors.white} />
                        )}
                    </View>
                    <Text style={s.agreeText}>
                        I agree to the booking terms and conditions, cancellation policy, and
                        understand that this is a booking request subject to venue owner approval.
                    </Text>
                </TouchableOpacity>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* ── Footer actions ───────────────────────────────────────────── */}
            <View style={s.footer}>
                <TouchableOpacity
                    style={s.footerCancel}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.8}
                >
                    <Text style={s.footerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[s.footerQuote, footerDisabled && s.footerDim]}
                    activeOpacity={0.85}
                    disabled={footerDisabled}
                    onPress={handleGenerateQuote}
                >
                    <Ionicons name="document-text-outline" size={15} color={Colors.primary} />
                    <Text style={s.footerQuoteText}>Quotation</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[s.footerConfirm, footerDisabled && s.footerConfirmDisabled]}
                    activeOpacity={0.88}
                    disabled={footerDisabled}
                    onPress={handleConfirmBooking}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                        <>
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={16}
                                color={Colors.white}
                            />
                            <Text style={s.footerConfirmText}>Confirm Booking</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* ── Time picker modal ─────────────────────────────────────────── */}
            <Modal
                visible={timePickerVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setTimePickerVisible(false)}
            >
                <TouchableOpacity
                    style={s.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setTimePickerVisible(false)}
                />
                <View style={s.pickerSheet}>
                    <View style={s.pickerHandle} />
                    <Text style={s.pickerTitle}>Select Start Time</Text>
                    <FlatList
                        data={timeSlots}
                        keyExtractor={item => item}
                        showsVerticalScrollIndicator={false}
                        style={{ maxHeight: 300 }}
                        renderItem={({ item }) => {
                            const active = item === startTime;
                            return (
                                <TouchableOpacity
                                    style={[s.pickerOption, active && s.pickerOptionActive]}
                                    onPress={() => {
                                        setStartTime(item);
                                        setTimePickerVisible(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            s.pickerOptionText,
                                            active && s.pickerOptionTextActive,
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                    {active && (
                                        <Ionicons
                                            name="checkmark"
                                            size={16}
                                            color={Colors.primary}
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </Modal>

            {/* ── Event type picker modal ───────────────────────────────────── */}
            <Modal
                visible={eventPickerVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setEventPickerVisible(false)}
            >
                <TouchableOpacity
                    style={s.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setEventPickerVisible(false)}
                />
                <View style={s.pickerSheet}>
                    <View style={s.pickerHandle} />
                    <Text style={s.pickerTitle}>Select Event Type</Text>
                    <FlatList
                        data={venueType ?? []}
                        keyExtractor={(item: string) => item}
                        showsVerticalScrollIndicator={false}
                        style={{ maxHeight: 300 }}
                        renderItem={({ item }: { item: string }) => {
                            const active = item === eventType;
                            return (
                                <TouchableOpacity
                                    style={[s.pickerOption, active && s.pickerOptionActive]}
                                    onPress={() => {
                                        setEventType(item);
                                        setEventPickerVisible(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            s.pickerOptionText,
                                            active && s.pickerOptionTextActive,
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                    {active && (
                                        <Ionicons
                                            name="checkmark"
                                            size={16}
                                            color={Colors.primary}
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </Modal>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    // Root & error
    root: { flex: 1, backgroundColor: Colors.background },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: Spacing.xl,
    },
    errorText: {
        fontSize: Typography.lg,
        color: Colors.charcoal,
        fontWeight: Typography.bold,
        textAlign: 'center',
    },
    backBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        marginTop: 8,
    },
    backBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.white },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingTop: Platform.OS === 'ios' ? 54 : 24,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
    },
    headerText: { flex: 1 },
    headerTitle: {
        fontSize: 22,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.5,
    },
    headerSub: { fontSize: Typography.base, color: Colors.charcoalLight, marginTop: 2 },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        marginTop: 2,
    },
    headerDivider: { height: 1, backgroundColor: Colors.divider },

    // Scroll
    scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },

    // Sections
    section: { marginBottom: Spacing.xl },
    sectionLabel: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.4,
        marginBottom: Spacing.lg,
    },
    req: { color: Colors.danger },
    noOptions: { fontSize: Typography.base, color: Colors.charcoalLight },

    // Duration grid
    durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    durationCard: {
        width: (W - Spacing.xl * 2 - Spacing.sm * 3) / 4,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        borderRadius: Radii.lg,
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.border,
        gap: 4,
        ...Shadows.card,
    },
    durationCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
    durationLabel: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    durationLabelActive: { color: Colors.charcoal },
    durationPrice: {
        fontSize: Typography.sm,
        fontWeight: Typography.extraBold,
        color: Colors.charcoalLight,
    },
    durationPriceActive: { color: Colors.primary },

    // Date / time row
    dateTimeRow: { flexDirection: 'row', gap: Spacing.sm },
    dateTimeCol: { flex: 1 },

    // Form inputs
    twoCol: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    col: { flex: 1 },
    fieldLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
        marginBottom: 6,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        paddingHorizontal: 12,
        height: 46,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    inputDisabled: { backgroundColor: Colors.background },
    input: { flex: 1, fontSize: Typography.base, color: Colors.charcoal, padding: 0 },
    inputText: { paddingVertical: 0, lineHeight: 20 },
    textareaWrap: { height: 80, alignItems: 'flex-start', paddingVertical: 10 },
    textarea: { height: 60, textAlignVertical: 'top' },
    hintText: { fontSize: Typography.xs, color: Colors.charcoalLight, marginTop: 4 },

    // Selected amenities
    amenitiesCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        borderWidth: 1.5,
        borderColor: Colors.border,
        padding: Spacing.xl,
        marginBottom: Spacing.xl,
        ...Shadows.card,
    },
    amenitiesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: Spacing.md,
    },
    amenitiesTitle: {
        flex: 1,
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    amenitiesCountBadge: {
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    amenitiesCountText: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.white,
    },
    amenityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
    amenityDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: Colors.primaryBorder,
        flexShrink: 0,
    },
    amenityName: { flex: 1, fontSize: Typography.sm, color: Colors.charcoalMid },
    amenityQty: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    amenityTotal: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    amenitiesDivider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.sm },
    amenitiesTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    amenitiesTotalLabel: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    amenitiesTotalValue: {
        fontSize: Typography.base,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
    },

    // Price summary
    priceSummaryCard: {
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.xl,
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        padding: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    priceSummaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: Spacing.lg,
    },
    priceSummaryTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    priceRowLabel: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    priceRowValue: {
        fontSize: Typography.base,
        color: Colors.charcoal,
        fontWeight: Typography.semiBold,
    },
    priceRowFee: { color: Colors.primaryDark },
    priceDivider: {
        height: 1.5,
        backgroundColor: Colors.primaryBorder,
        marginVertical: Spacing.md,
    },
    priceTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    priceTotalLabel: {
        fontSize: Typography.md,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
    priceTotalRight: { alignItems: 'flex-end' },
    priceTotalValue: {
        fontSize: 22,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
        letterSpacing: -0.5,
    },
    priceRateType: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        marginTop: 2,
    },

    // Terms
    termsCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.xl,
        marginBottom: Spacing.xl,
        ...Shadows.card,
    },
    termsTitle: {
        fontSize: Typography.md,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
        marginBottom: Spacing.md,
    },
    termRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
    termBullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
        marginTop: 6,
        flexShrink: 0,
    },
    termText: { flex: 1, fontSize: Typography.sm, color: Colors.charcoalMid, lineHeight: 18 },

    // Agree
    agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: Spacing.xl },
    agreeCheckbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 1,
    },
    agreeCheckboxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    agreeText: { flex: 1, fontSize: Typography.sm, color: Colors.charcoalMid, lineHeight: 19 },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.lg,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
        ...Shadows.header,
    },
    footerCancel: {
        height: 50,
        paddingHorizontal: Spacing.lg,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerCancelText: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    footerQuote: {
        flex: 1,
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        backgroundColor: Colors.surface,
    },
    footerQuoteText: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },
    footerConfirm: {
        flex: 1.1,
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: Radii.full,
        backgroundColor: Colors.primary,
        ...Shadows.primary,
    },
    footerConfirmDisabled: { opacity: 0.45 },
    footerConfirmText: {
        fontSize: Typography.base,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.2,
    },
    footerDim: { opacity: 0.45 },

    // Picker modals (shared by time + event type pickers)
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    pickerSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        paddingHorizontal: Spacing.xl,
        paddingBottom: 32,
        ...Shadows.floating,
    },
    pickerHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    pickerTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        marginBottom: Spacing.md,
    },
    pickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 13,
        paddingHorizontal: 10,
        borderRadius: Radii.md,
        marginBottom: 2,
    },
    pickerOptionActive: { backgroundColor: Colors.primaryLight },
    pickerOptionText: {
        fontSize: Typography.md,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    pickerOptionTextActive: { color: Colors.primary, fontWeight: Typography.bold },
});

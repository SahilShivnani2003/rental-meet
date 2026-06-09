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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import RazorpayCheckout from 'react-native-razorpay';
import { useAlert } from '@/context/AlertContext';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors, Spacing, Radii, Shadows, Typography } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import { Venue } from '@/features/venue/types/Venue';
import { PlatformSettings } from '../types/PlatformSettings';
import { useCreateBooking } from '../hooks/useCreateBooking';
import { useCreatePaymentOrder, useVerifyPayment } from '../hooks/usePayment';
import { usePlatformSetting } from '../hooks/usePlatformSetting';
import { useTermsCondition } from '../hooks/useTermsCondition';
import { SelectedAmenityItem } from '@/features/venue/models/BookingSheet';
import Config from 'react-native-config';
import QuotationModal, { QuotationData } from '@/features/quotation/screens/QuotationModal';

const { width: W } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

type DurationOption = {
    key: string;
    label: string;
    hours: number;
    price: number;
    type: 'hourly' | 'halfday' | 'fullday';
    multiplier?: number;
};

// FIX: define PlatformFeeType locally — was used but never imported
type PlatformFeeType = 'fixed' | 'percentage';

type BookingScreenProps = NativeStackScreenProps<RootStackParamList, 'venueBooking'>;

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

function to24Hr(display: string): string {
    if (!display || display === '—' || display === 'Closing') return display;
    const parts = display.split(' ');
    if (parts.length < 2) return display;
    const [time, period] = parts;
    let [h, m] = time.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function isWeekend(dateStr: string): boolean {
    const d = new Date(dateStr + 'T00:00:00');
    return d.getDay() === 0 || d.getDay() === 6;
}

function toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

const fmt = (n: number) =>
    '₹' + Math.round(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const fmtDec = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function parseTermsList(raw: any): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) {
        return raw
            .map((t: any) =>
                typeof t === 'string'
                    ? t
                    : t?.point ?? t?.content ?? t?.description ?? t?.title ?? '',
            )
            .filter(Boolean);
    }
    if (typeof raw === 'object') {
        const nested = raw?.bookingTerms ?? raw?.terms ?? raw?.items ?? raw?.data ?? raw?.content;
        if (nested) return parseTermsList(nested);
    }
    return [];
}

function toBookingType(type: DurationOption['type']): 'hourly' | 'halfday' | 'fullday' {
    switch (type) {
        case 'hourly':
            return 'hourly';
        case 'halfday':
            return 'halfday';
        case 'fullday':
            return 'fullday';
    }
}

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
                    rateType: item.rateType ?? 'Per Use',
                    quantity: item.qty,
                    total: item.total,
                });
                break;
            case 'additional':
                additional.push({
                    name: item.name,
                    rate: item.unitPrice,
                    rateType: item.rateType ?? 'Fixed',
                    quantity: item.qty,
                    total: item.total,
                });
                break;
            case 'beverage':
                beverages.push({
                    name: item.name,
                    rate: item.unitPrice,
                    rateType: item.rateType ?? 'Per Person',
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

function parseMaxCapacity(capacityVal: string | number | undefined): number | null {
    if (capacityVal === undefined || capacityVal === null) return null;
    if (typeof capacityVal === 'number') return capacityVal;
    const str = String(capacityVal).trim();
    if (str.includes('-')) {
        const parts = str.split('-');
        const max = Number(parts[1]?.trim());
        return isNaN(max) ? null : max;
    }
    const num = Number(str);
    return isNaN(num) ? null : num;
}

// ─── Default platform settings ────────────────────────────────────────────────
// Used as fallback while the API loads
const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
    venueCGST: 9,
    venueSGST: 9,
    platformFeeType: 'percentage',
    platformFeePercentage: 5,
    platformCGST: 9,
    platformSGST: 9,
    serviceCategoryRates: [],
};

// ─── CalendarModal ────────────────────────────────────────────────────────────

interface CalendarModalProps {
    visible: boolean;
    selectedDate: string;
    onSelect: (date: string) => void;
    onClose: () => void;
}

const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildMonthGrid(year: number, month: number): (Date | null)[] {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid: (Date | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(new Date(year, month, d));
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
}

function CalendarModal({ visible, selectedDate, onSelect, onClose }: CalendarModalProps) {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const minDate = new Date(todayDate);
    minDate.setDate(minDate.getDate() + 1);
    const parsedSelected = selectedDate ? new Date(selectedDate + 'T00:00:00') : null;
    const initialViewDate = parsedSelected && parsedSelected >= minDate ? parsedSelected : minDate;

    const [viewYear, setViewYear] = useState(initialViewDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(initialViewDate.getMonth());

    useEffect(() => {
        if (visible) {
            const d = parsedSelected && parsedSelected >= minDate ? parsedSelected : minDate;
            setViewYear(d.getFullYear());
            setViewMonth(d.getMonth());
        }
    }, [visible]);

    const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewYear(y => y - 1);
            setViewMonth(11);
        } else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewYear(y => y + 1);
            setViewMonth(0);
        } else setViewMonth(m => m + 1);
    };

    const canGoPrev =
        viewYear > minDate.getFullYear() ||
        (viewYear === minDate.getFullYear() && viewMonth > minDate.getMonth());

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={cal.backdrop} activeOpacity={1} onPress={onClose} />
            <View style={cal.sheet}>
                <View style={cal.handle} />
                <View style={cal.monthNav}>
                    <TouchableOpacity
                        style={[cal.navBtn, !canGoPrev && cal.navBtnDisabled]}
                        onPress={canGoPrev ? prevMonth : undefined}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={18}
                            color={canGoPrev ? Colors.charcoal : Colors.border}
                        />
                    </TouchableOpacity>
                    <Text style={cal.monthLabel}>
                        {MONTH_NAMES[viewMonth]} {viewYear}
                    </Text>
                    <TouchableOpacity style={cal.navBtn} onPress={nextMonth} activeOpacity={0.7}>
                        <Ionicons name="chevron-forward" size={18} color={Colors.charcoal} />
                    </TouchableOpacity>
                </View>
                <View style={cal.dayHeader}>
                    {DAY_NAMES.map(d => (
                        <Text
                            key={d}
                            style={[
                                cal.dayName,
                                (d === 'Sun' || d === 'Sat') && cal.dayNameWeekend,
                            ]}
                        >
                            {d}
                        </Text>
                    ))}
                </View>
                <View style={cal.grid}>
                    {grid.map((date, idx) => {
                        if (!date) return <View key={`empty-${idx}`} style={cal.cell} />;
                        const dateStr = toDateStr(date);
                        const isPast = date < minDate;
                        const isSelected = dateStr === selectedDate;
                        const isToday = toDateStr(date) === toDateStr(todayDate);
                        const isWknd = date.getDay() === 0 || date.getDay() === 6;
                        return (
                            <TouchableOpacity
                                key={dateStr}
                                style={[
                                    cal.cell,
                                    isSelected && cal.cellSelected,
                                    !isPast && !isSelected && isWknd && cal.cellWeekend,
                                    isPast && cal.cellDisabled,
                                ]}
                                onPress={() => {
                                    if (!isPast) {
                                        onSelect(dateStr);
                                        onClose();
                                    }
                                }}
                                activeOpacity={isPast ? 1 : 0.75}
                                disabled={isPast}
                            >
                                <Text
                                    style={[
                                        cal.cellText,
                                        isSelected && cal.cellTextSelected,
                                        isPast && cal.cellTextDisabled,
                                        !isPast && !isSelected && isWknd && cal.cellTextWeekend,
                                    ]}
                                >
                                    {date.getDate()}
                                </Text>
                                {isToday && !isSelected && <View style={cal.todayDot} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <View style={cal.legend}>
                    {[
                        { color: Colors.primary, label: 'Selected' },
                        { color: Colors.primaryLight, label: 'Weekend', bordered: true },
                        { color: Colors.background, label: 'Unavailable' },
                    ].map(item => (
                        <View key={item.label} style={cal.legendItem}>
                            <View
                                style={[
                                    cal.legendDot,
                                    { backgroundColor: item.color },
                                    item.bordered
                                        ? { borderWidth: 1, borderColor: Colors.primaryBorder }
                                        : null,
                                ]}
                            />
                            <Text style={cal.legendText}>{item.label}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </Modal>
    );
}

const CELL_SIZE = Math.floor((W - Spacing.xl * 2 - 28) / 7);

const cal = StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        paddingHorizontal: 14,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        ...Shadows.floating,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 16,
    },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginBottom: 16,
    },
    navBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navBtnDisabled: { opacity: 0.35 },
    monthLabel: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    dayHeader: { flexDirection: 'row', marginBottom: 6 },
    dayName: {
        width: CELL_SIZE,
        textAlign: 'center',
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    dayNameWeekend: { color: Colors.primary },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: {
        width: CELL_SIZE,
        height: CELL_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: CELL_SIZE / 2,
        marginVertical: 2,
        position: 'relative',
    },
    cellSelected: { backgroundColor: Colors.primary, ...Shadows.primary },
    cellWeekend: { backgroundColor: Colors.primaryLight },
    cellDisabled: { opacity: 0.3 },
    cellText: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    cellTextSelected: { color: Colors.white, fontWeight: Typography.extraBold },
    cellTextDisabled: { color: Colors.charcoalLight, fontWeight: Typography.regular },
    cellTextWeekend: { color: Colors.primaryDark, fontWeight: Typography.bold },
    todayDot: {
        position: 'absolute',
        bottom: 4,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
});

const dummyQuotation: QuotationData = {
    // Booking details
    bookingDate: '2026-06-15',
    startTime: '10:00 AM',
    endTime: '02:00 PM',
    bookingType: 'halfday',
    durationLabel: 'Half Day',
    isWeekend: false,

    // Customer
    customerName: 'Rahul Sharma',
    customerEmail: 'rahul.sharma@example.com',
    customerPhone: '+91 9876543210',
    eventType: 'Wedding',
    guestCount: 150,
    specialRequirements: 'Stage decoration, DJ and veg catering',

    // Pricing
    basePrice: 50000,
    amenitiesTotal: 22000,
    subtotal: 72000,

    venueCGST: 6480,
    venueCGSTRate: 9,
    venueSGST: 6480,
    venueSGSTRate: 9,
    venueGSTTotal: 12960,

    platformFee: 2000,
    platformFeeLabel: 'Platform Convenience Fee',

    platformCGST: 180,
    platformCGSTRate: 9,
    platformSGST: 180,
    platformSGSTRate: 9,
    platformFeeTotal: 2360,

    grandTotal: 87320,

    // Amenities
    paidAmenities: [
        {
            name: 'DJ Setup',
            category: 'additional',
            qty: 1,
            unitPrice: 8000,
            total: 8000,
            rateType: 'fixed',
        },
        {
            name: 'Veg Catering',
            category: 'thali',
            qty: 150,
            unitPrice: 200,
            total: 30000,
            rateType: 'per_plate',
            thaliCategory: 'Veg',
            numberOfItems: 10,
            itemNames: 'Paneer, Dal, Rice, Roti, Salad, Sweet',
        },
    ],

    allAmenities: [
        {
            name: 'Parking',
            category: 'basic_included',
            qty: 1,
            unitPrice: 0,
            total: 0,
            rateType: 'included',
        },
        {
            name: 'Air Conditioning',
            category: 'basic_included',
            qty: 1,
            unitPrice: 0,
            total: 0,
            rateType: 'included',
        },
        {
            name: 'DJ Setup',
            category: 'additional',
            qty: 1,
            unitPrice: 8000,
            total: 8000,
            rateType: 'fixed',
        },
        {
            name: 'Veg Catering',
            category: 'thali',
            qty: 150,
            unitPrice: 200,
            total: 30000,
            rateType: 'per_plate',
            thaliCategory: 'Veg',
            numberOfItems: 10,
            itemNames: 'Paneer, Dal, Rice, Roti, Salad, Sweet',
        },
    ],

    // Meta
    quotationNumber: 'QT-2026-0002',
    generatedAt: new Date('2026-06-01T10:00:00'),
    validUntil: new Date('2026-06-07T23:59:59'),
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function VenueBookingScreen({ navigation, route }: BookingScreenProps) {
    const params = route.params as {
        venue: Venue;
        selectedAmenities?: SelectedAmenityItem[];
        amenitiesTotal?: number;
        preselectedDurationHours?: number;
        preselectedDurationType?: 'hourly' | 'halfday' | 'fullday';
    };
    const [viewQuotation, setVeiwQuotation] = useState<boolean>(false);
    const { mutate: createBooking } = useCreateBooking();
    const { mutate: createPaymentOrder } = useCreatePaymentOrder();
    const { mutate: verifyPaymentMutate } = useVerifyPayment();

    // FIX 1: renamed both isLoading fields to avoid duplicate identifiers
    const { data: platformSettingData, isLoading: isPlatformLoading } = usePlatformSetting();
    const { data: termsConditionData, isLoading: isTermsLoading } = useTermsCondition(); // FIX 2: was ':' syntax error

    // FIX 3: extract platformSettings from query data with typed fallback
    const platformSettings: PlatformSettings =
        platformSettingData?.settings ?? platformSettingData?.data ?? DEFAULT_PLATFORM_SETTINGS;

    // FIX 4: derive termsList directly from query data — was dead local state
    const termsList: string[] = useMemo(
        () => parseTermsList(termsConditionData?.terms ?? termsConditionData),
        [termsConditionData],
    );

    const venue = params?.venue;
    const allAmenities: SelectedAmenityItem[] = params?.selectedAmenities ?? [];
    const incomingAmenitiesTotal: number = params?.amenitiesTotal ?? 0;
    const paidAmenities = allAmenities.filter(i => i.category !== 'basic_included');

    const { user } = useAuthStore();
    const alert = useAlert();
    const [submitting, setSubmitting] = useState(false);

    const [timePickerVisible, setTimePickerVisible] = useState(false);
    const [eventPickerVisible, setEventPickerVisible] = useState(false);
    const [calendarVisible, setCalendarVisible] = useState(false);

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
    const maxCapacity = parseMaxCapacity(capacity as any);

    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = toDateStr(tomorrowDate);

    const timeSlots = useMemo(
        () =>
            generateTimeSlots(
                availability?.openingTime ?? '09:00',
                availability?.closingTime ?? '21:00',
            ),
        [availability],
    );

    // ── Form state ────────────────────────────────────────────────────────────
    const [bookingDate, setBookingDate] = useState(tomorrowStr);
    const [startTime, setStartTime] = useState(timeSlots[0] ?? '10:00 AM');
    const [fullName, setFullName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [eventType, setEventType] = useState(venueType?.[0] ?? '');
    const [guestCount, setGuestCount] = useState('');
    const [specialRequirements, setSpecialRequirements] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const clearError = (field: string) =>
        setFieldErrors(prev => {
            const n = { ...prev };
            delete n[field];
            return n;
        });

    const selectedDateIsWeekend = useMemo(
        () => (bookingDate ? isWeekend(bookingDate) : false),
        [bookingDate],
    );

    const durationOptions: DurationOption[] = useMemo(() => {
        const opts: DurationOption[] = [];
        const wknd = selectedDateIsWeekend;
        const useEnabled = !!(
            pricing?.enabledOptions?.perHour ||
            pricing?.enabledOptions?.halfDay ||
            pricing?.enabledOptions?.fullDay
        );
        if (!useEnabled || pricing?.enabledOptions?.perHour) {
            const rate = wknd ? pricing?.perHour?.weekend : pricing?.perHour?.weekday;
            if (rate) {
                [1, 2, 4].forEach(h =>
                    opts.push({
                        key: `${h}h`,
                        label: `${h}h`,
                        hours: h,
                        price: rate * h,
                        type: 'hourly',
                        multiplier: h,
                    }),
                );
            }
        }
        if (!useEnabled || pricing?.enabledOptions?.halfDay) {
            const rate = wknd ? pricing?.halfDay?.weekend : pricing?.halfDay?.weekday;
            if (rate)
                opts.push({
                    key: 'halfDay',
                    label: 'Half Day',
                    hours: 4,
                    price: rate,
                    type: 'halfday',
                });
        }
        if (!useEnabled || pricing?.enabledOptions?.fullDay) {
            const rate = wknd ? pricing?.fullDay?.weekend : pricing?.fullDay?.weekday;
            if (rate)
                opts.push({
                    key: 'fullDay',
                    label: 'Full Day',
                    hours: 8,
                    price: rate,
                    type: 'fullday',
                });
        }
        return opts;
    }, [pricing, selectedDateIsWeekend]);

    const defaultDuration = useMemo(() => {
        const preType = params?.preselectedDurationType;
        const preHours = params?.preselectedDurationHours;
        if (preType) {
            const m = durationOptions.find(o => o.type === preType);
            if (m) return m;
        }
        if (preHours) {
            const m = durationOptions.find(o => o.hours === preHours);
            if (m) return m;
        }
        return durationOptions[0] ?? null;
    }, [durationOptions]);

    const [selectedDuration, setSelectedDuration] = useState<DurationOption | null>(
        defaultDuration,
    );

    useEffect(() => {
        if (!selectedDuration) {
            setSelectedDuration(durationOptions[0] ?? null);
            return;
        }
        const match = durationOptions.find(
            o => o.type === selectedDuration.type && o.hours === selectedDuration.hours,
        );
        setSelectedDuration(match ?? durationOptions[0] ?? null);
    }, [durationOptions]);

    const endTime = useMemo(() => {
        if (!selectedDuration) return '—';
        const idx = timeSlots.indexOf(startTime);
        if (idx === -1) return '—';
        const endIdx = idx + selectedDuration.hours * 2;
        if (endIdx >= timeSlots.length) return 'Closing';
        return timeSlots[endIdx];
    }, [selectedDuration, startTime, timeSlots]);

    // ── Price calculations ────────────────────────────────────────────────────
    const basePrice = selectedDuration?.price ?? 0;
    const subtotal = basePrice + incomingAmenitiesTotal;

    // Venue GST (CGST + SGST on subtotal)
    const venueCGSTRate = (platformSettings.venueCGST ?? 0) / 100;
    const venueSGSTRate = (platformSettings.venueSGST ?? 0) / 100;
    const venueCGSTAmount = Math.round(subtotal * venueCGSTRate * 100) / 100;
    const venueSGSTAmount = Math.round(subtotal * venueSGSTRate * 100) / 100;
    const venueGSTTotal = venueCGSTAmount + venueSGSTAmount;

    // FIX 5: PlatformFeeType now defined above as a local type
    const effectivePlatformFeeType: PlatformFeeType = useMemo(() => {
        if (venue.customPlatformFee?.enabled) return 'percentage';
        return platformSettings.platformFeeType ?? 'percentage';
    }, [venue.customPlatformFee, platformSettings.platformFeeType]);

    const effectivePlatformFeePercentage: number = useMemo(() => {
        if (venue.customPlatformFee?.enabled) return venue.customPlatformFee.percentage ?? 5;
        if (platformSettings.platformFeeType === 'percentage')
            return platformSettings.platformFeePercentage ?? 0;
        return 0;
    }, [venue.customPlatformFee, platformSettings]);

    const effectivePlatformFlatFee: number = useMemo(() => {
        if (venue.customPlatformFee?.enabled) return 0;
        if (platformSettings.platformFeeType === 'fixed')
            return platformSettings.platformFeeValue ?? 0;
        return 0;
    }, [venue.customPlatformFee, platformSettings]);

    const platformFee =
        subtotal * (effectivePlatformFeePercentage / 100) + effectivePlatformFlatFee;

    const effectivePlatformCGSTRate: number = useMemo(() => {
        if (venue.customGST?.enabled && (venue.customGST.rate ?? 0) > 0)
            return (venue.customGST.rate ?? 0) / 2 / 100;
        return (platformSettings.platformCGST ?? 0) / 100;
    }, [venue.customGST, platformSettings.platformCGST]);

    const effectivePlatformSGSTRate: number = useMemo(() => {
        if (venue.customGST?.enabled && (venue.customGST.rate ?? 0) > 0)
            return (venue.customGST.rate ?? 0) / 2 / 100;
        return (platformSettings.platformSGST ?? 0) / 100;
    }, [venue.customGST, platformSettings.platformSGST]);

    const platformCGSTAmount = Math.round(platformFee * effectivePlatformCGSTRate * 100) / 100;
    const platformSGSTAmount = Math.round(platformFee * effectivePlatformSGSTRate * 100) / 100;
    const platformFeeTotal = platformFee + platformCGSTAmount + platformSGSTAmount;

    const total = subtotal + venueGSTTotal + platformFeeTotal;

    const platformFeeLabelText = useMemo(() => {
        if (venue.customPlatformFee?.enabled)
            return `Platform Fee (${venue.customPlatformFee.percentage ?? 5}%) · Custom`;
        if (platformSettings.platformFeeType === 'percentage')
            return `Platform Fee (${platformSettings.platformFeePercentage}%)`;
        return `Platform Fee (₹${platformSettings.platformFeeValue ?? 0} flat)`;
    }, [venue.customPlatformFee, platformSettings]);

    const platformCGSTLabelPct = useMemo(() => {
        if (venue.customGST?.enabled && (venue.customGST.rate ?? 0) > 0)
            return (venue.customGST.rate ?? 0) / 2;
        return platformSettings.platformCGST ?? 0;
    }, [venue.customGST, platformSettings.platformCGST]);

    const platformSGSTLabelPct = useMemo(() => {
        if (venue.customGST?.enabled && (venue.customGST.rate ?? 0) > 0)
            return (venue.customGST.rate ?? 0) / 2;
        return platformSettings.platformSGST ?? 0;
    }, [venue.customGST, platformSettings.platformSGST]);

    const guestNum = Number(guestCount);
    const guestOverCapacity = !!maxCapacity && !isNaN(guestNum) && guestNum > maxCapacity;

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = useCallback((): string | null => {
        const errors: Record<string, string> = {};
        if (!selectedDuration) errors.duration = 'Please select a duration.';
        if (!bookingDate) {
            errors.date = 'Please select a booking date.';
        } else {
            const selected = new Date(bookingDate + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selected <= today)
                errors.date = 'Please select a future date (from tomorrow onwards).';
        }
        if (!fullName.trim()) errors.fullName = 'Full name is required.';
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errors.email = 'Enter a valid email address.';
        if (!phone.trim() || !/^[0-9]{10}$/.test(phone.replace(/\s/g, '')))
            errors.phone = 'Enter a valid 10-digit phone number.';
        if (!eventType) errors.eventType = 'Please select an event type.';
        if (!guestCount || isNaN(guestNum) || guestNum <= 0) {
            errors.guestCount = 'Enter a valid guest count (minimum 1).';
        } else if (maxCapacity && guestNum > maxCapacity) {
            errors.guestCount = `Maximum capacity is ${maxCapacity} guests.`;
        }
        setFieldErrors(errors);
        return Object.values(errors)[0] ?? null;
    }, [
        selectedDuration,
        bookingDate,
        fullName,
        email,
        phone,
        eventType,
        guestCount,
        guestNum,
        maxCapacity,
    ]);
    const handlePayment = useCallback(
        (bookingId: string): Promise<void> =>
            new Promise((resolve, reject) => {
                createPaymentOrder(
                    {
                        bookingId,
                        amount: total,
                        bookingType: toBookingType(selectedDuration!.type),
                    },
                    {
                        onSuccess: async (orderData: any) => {
                            if (!orderData?.success) {
                                reject(new Error('Failed to create payment order'));
                                return;
                            }
                            try {
                                const options = {
                                    key: Config.RAZORPAY_KEY_TEST ?? '',
                                    amount: orderData.order.amount,
                                    currency: orderData.order.currency ?? 'INR',
                                    name: 'RentalMeet',
                                    description: `Booking Payment - ${venue.businessName}`,
                                    order_id: orderData.order.id,
                                    prefill: { name: fullName, email, contact: phone },
                                    theme: { color: '#F59F0A' },
                                };

                                const razorpayResponse = await RazorpayCheckout.open(options);

                                if (!razorpayResponse?.razorpay_payment_id) {
                                    reject(new Error('Payment not completed'));
                                    return;
                                }

                                // FIX 7: verifyPaymentMutate is the mutate fn — call it properly
                                verifyPaymentMutate(
                                    {
                                        razorpay_order_id: razorpayResponse.razorpay_order_id,
                                        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                                        razorpay_signature: razorpayResponse.razorpay_signature,
                                        bookingId,
                                        paidAmount: total,
                                        bookingType: toBookingType(selectedDuration!.type),
                                    },
                                    {
                                        onSuccess: (verifyData: any) => {
                                            if (verifyData?.success) {
                                                alert.success(
                                                    'Payment Successful',
                                                    'Booking confirmed!',
                                                );
                                                navigation.popToTop?.() ?? navigation.goBack();
                                                resolve();
                                            } else {
                                                reject(new Error('Payment verification failed'));
                                            }
                                        },
                                        onError: (err: any) => reject(err),
                                    },
                                );
                            } catch (err) {
                                reject(err);
                            }
                        },
                        onError: (err: any) => reject(err),
                    },
                );
            }),
        [
            createPaymentOrder,
            verifyPaymentMutate,
            total,
            selectedDuration,
            venue,
            fullName,
            email,
            phone,
            alert,
            navigation,
        ],
    );

    // ── Submit ────────────────────────────────────────────────────────────────
    // FIX 8: createBooking mutate result is now received via onSuccess callback, not a return value
    const handleConfirmBooking = async () => {
        const err = validate();
        if (err) {
            alert.error('Validation Error', err);
            return;
        }

        setSubmitting(true);
        if (!venue?._id) {
            alert.error('Error', 'Venue not selected');
            return;
        }
        const bookingPayload = {
            venue: venue._id,
            bookingDate: new Date(bookingDate),
            startTime: to24Hr(startTime),
            endTime: to24Hr(endTime),
            bookingType: toBookingType(selectedDuration!.type),
            amount: total,
            amenitiesTotal: incomingAmenitiesTotal,
            selectedAmenities: buildSelectedAmenitiesPayload(allAmenities),
            priceBreakdown: {
                basePrice,
                amenitiesTotal: incomingAmenitiesTotal,
                subtotal,
                venueCGST: venueCGSTAmount,
                venueCGSTRate: platformSettings.venueCGST,
                venueSGST: venueSGSTAmount,
                venueSGSTRate: platformSettings.venueSGST,
                gst: venueGSTTotal,
                platformFee,
                platformFeeRate: effectivePlatformFeePercentage,
                platformFeeCGST: platformCGSTAmount,
                platformFeeCGSTRate: platformCGSTLabelPct,
                platformFeeSGST: platformSGSTAmount,
                platformFeeSGSTRate: platformSGSTLabelPct,
                platformFeeTotal,
                total,
            },
            customerDetails: {
                name: fullName.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim().replace(/\s/g, ''),
                eventType,
                guestCount: guestNum,
                specialRequirements: specialRequirements.trim(),
            },
        };
        debugger;
        createBooking(bookingPayload, {
            // FIX 8: response is received here in onSuccess, not as a return value
            onSuccess: async (response: any) => {
                if (response?.success) {
                    try {
                        await handlePayment(response.booking._id);
                    } catch (payErr: any) {
                        console.error('PAYMENT ERROR:', payErr);
                        alert.error(
                            'Payment Failed',
                            payErr?.message ?? 'Payment could not be processed.',
                        );
                    }
                } else {
                    alert.error('Booking Failed', response?.message ?? 'Something went wrong.');
                }
                setSubmitting(false);
            },
            onError: (error: any) => {
                console.error('CREATE BOOKING ERROR:', error);
                const msg =
                    error?.response?.data?.message ??
                    error?.message ??
                    'Network error. Please try again.';
                alert.error('Error', msg);
                setSubmitting(false);
            },
        });
    };

    const handleGenerateQuote = async () => {
        const err = validate();
        if (err) {
            alert.error('Validation Error', err);
            return;
        }
        //alert.info('Coming Soon', 'Quotation generation will be available soon.');
        setVeiwQuotation(true);
    };

    const displayDate = useMemo(() => {
        if (!bookingDate) return 'Select date';
        const d = new Date(bookingDate + 'T00:00:00');
        return d.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    }, [bookingDate]);

    const footerDisabled = !agreedToTerms || submitting;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <View style={s.root}>
            {/* ── Header ── */}
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
                {/* ── Duration ── */}
                <View style={s.section}>
                    <View style={s.sectionLabelRow}>
                        <Text style={s.sectionLabel}>
                            Select Duration <Text style={s.req}>*</Text>
                        </Text>
                        {bookingDate && (
                            <View
                                style={[
                                    s.dayTypePill,
                                    selectedDateIsWeekend
                                        ? s.dayTypePillWeekend
                                        : s.dayTypePillWeekday,
                                ]}
                            >
                                <Text
                                    style={[
                                        s.dayTypePillText,
                                        selectedDateIsWeekend
                                            ? s.dayTypePillTextWeekend
                                            : s.dayTypePillTextWeekday,
                                    ]}
                                >
                                    {selectedDateIsWeekend ? 'Weekend rate' : 'Weekday rate'}
                                </Text>
                            </View>
                        )}
                    </View>
                    {fieldErrors.duration ? (
                        <Text style={s.inlineError}>{fieldErrors.duration}</Text>
                    ) : null}
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
                                        onPress={() => {
                                            setSelectedDuration(opt);
                                            clearError('duration');
                                        }}
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

                {/* ── Date / Time ── */}
                <View style={s.section}>
                    <View style={s.dateTimeRow}>
                        <View style={[s.dateTimeCol, { flex: 1.4 }]}>
                            <Text style={s.fieldLabel}>
                                Booking Date <Text style={s.req}>*</Text>
                            </Text>
                            <TouchableOpacity
                                style={[
                                    s.inputWrap,
                                    s.datePickerBtn,
                                    !!fieldErrors.date && s.inputError,
                                ]}
                                onPress={() => setCalendarVisible(true)}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name="calendar-outline"
                                    size={16}
                                    color={Colors.primary}
                                />
                                <View style={s.datePickerContent}>
                                    <Text
                                        style={[
                                            s.datePickerText,
                                            !bookingDate && { color: Colors.charcoalLight },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {displayDate}
                                    </Text>
                                    {bookingDate && selectedDateIsWeekend && (
                                        <Text style={s.weekendPill}>Weekend</Text>
                                    )}
                                </View>
                                <Ionicons
                                    name="chevron-down"
                                    size={14}
                                    color={Colors.charcoalLight}
                                />
                            </TouchableOpacity>
                            {fieldErrors.date ? (
                                <Text style={s.inlineError}>{fieldErrors.date}</Text>
                            ) : null}
                        </View>

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

                {/* ── Your Details ── */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Your Details</Text>
                    <View style={s.twoCol}>
                        <View style={s.col}>
                            <Text style={s.fieldLabel}>
                                Full Name <Text style={s.req}>*</Text>
                            </Text>
                            <View style={[s.inputWrap, !!fieldErrors.fullName && s.inputError]}>
                                <TextInput
                                    style={s.input}
                                    value={fullName}
                                    onChangeText={v => {
                                        setFullName(v);
                                        clearError('fullName');
                                    }}
                                    placeholder="Your name"
                                    placeholderTextColor={Colors.charcoalLight}
                                />
                            </View>
                            {fieldErrors.fullName ? (
                                <Text style={s.inlineError}>{fieldErrors.fullName}</Text>
                            ) : null}
                        </View>
                        <View style={s.col}>
                            <Text style={s.fieldLabel}>
                                Email <Text style={s.req}>*</Text>
                            </Text>
                            <View style={[s.inputWrap, !!fieldErrors.email && s.inputError]}>
                                <TextInput
                                    style={s.input}
                                    value={email}
                                    onChangeText={v => {
                                        setEmail(v);
                                        clearError('email');
                                    }}
                                    placeholder="you@email.com"
                                    placeholderTextColor={Colors.charcoalLight}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                            {fieldErrors.email ? (
                                <Text style={s.inlineError}>{fieldErrors.email}</Text>
                            ) : null}
                        </View>
                    </View>
                    <View style={s.twoCol}>
                        <View style={s.col}>
                            <Text style={s.fieldLabel}>
                                Phone <Text style={s.req}>*</Text>
                            </Text>
                            <View style={[s.inputWrap, !!fieldErrors.phone && s.inputError]}>
                                <TextInput
                                    style={s.input}
                                    value={phone}
                                    onChangeText={v => {
                                        setPhone(v);
                                        clearError('phone');
                                    }}
                                    placeholder="10-digit mobile"
                                    placeholderTextColor={Colors.charcoalLight}
                                    keyboardType="phone-pad"
                                />
                            </View>
                            {fieldErrors.phone ? (
                                <Text style={s.inlineError}>{fieldErrors.phone}</Text>
                            ) : null}
                        </View>
                        <View style={s.col}>
                            <Text style={s.fieldLabel}>
                                Event Type <Text style={s.req}>*</Text>
                            </Text>
                            <TouchableOpacity
                                style={[s.inputWrap, !!fieldErrors.eventType && s.inputError]}
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
                            {fieldErrors.eventType ? (
                                <Text style={s.inlineError}>{fieldErrors.eventType}</Text>
                            ) : null}
                        </View>
                    </View>
                    <View style={s.twoCol}>
                        <View style={s.col}>
                            <Text style={s.fieldLabel}>
                                Guest Count <Text style={s.req}>*</Text>
                            </Text>
                            <View
                                style={[
                                    s.inputWrap,
                                    (!!fieldErrors.guestCount || guestOverCapacity) && s.inputError,
                                ]}
                            >
                                <TextInput
                                    style={s.input}
                                    value={guestCount}
                                    onChangeText={v => {
                                        setGuestCount(v);
                                        clearError('guestCount');
                                    }}
                                    placeholder="No. of guests"
                                    placeholderTextColor={Colors.charcoalLight}
                                    keyboardType="numeric"
                                />
                            </View>
                            {!!maxCapacity &&
                                guestCount.trim() !== '' &&
                                !isNaN(guestNum) &&
                                guestNum > 0 && (
                                    <View style={s.capacityBar}>
                                        <View style={s.capacityTrack}>
                                            <View
                                                style={[
                                                    s.capacityFill,
                                                    {
                                                        width: `${Math.min(
                                                            (guestNum / maxCapacity) * 100,
                                                            100,
                                                        )}%`,
                                                        backgroundColor: guestOverCapacity
                                                            ? Colors.danger
                                                            : Colors.primary,
                                                    },
                                                ]}
                                            />
                                        </View>
                                        <Text
                                            style={[
                                                s.capacityText,
                                                guestOverCapacity && { color: Colors.danger },
                                            ]}
                                        >
                                            {guestNum} / {maxCapacity}
                                        </Text>
                                    </View>
                                )}
                            {fieldErrors.guestCount ? (
                                <Text style={s.inlineError}>{fieldErrors.guestCount}</Text>
                            ) : maxCapacity ? (
                                <Text style={s.hintText}>Max capacity: {maxCapacity} guests</Text>
                            ) : null}
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

                {/* ── Selected Amenities ── */}
                {paidAmenities.length > 0 && (
                    <View style={s.amenitiesCard}>
                        <View style={s.amenitiesHeader}>
                            <Ionicons name="options-outline" size={17} color={Colors.charcoal} />
                            <Text style={s.amenitiesTitle}>Selected Amenities</Text>
                            <View style={s.amenitiesCountBadge}>
                                <Text style={s.amenitiesCountText}>{paidAmenities.length}</Text>
                            </View>
                        </View>
                        {paidAmenities.map((item, i) => (
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

                {/* ── Price Summary ── */}
                <View style={s.priceSummaryCard}>
                    <View style={s.priceSummaryHeader}>
                        <Ionicons name="receipt-outline" size={17} color={Colors.charcoal} />
                        <Text style={s.priceSummaryTitle}>Price Summary</Text>
                        <View
                            style={[
                                s.rateTypeBadge,
                                selectedDateIsWeekend
                                    ? s.rateTypeBadgeWeekend
                                    : s.rateTypeBadgeWeekday,
                            ]}
                        >
                            <Text
                                style={[
                                    s.rateTypeBadgeText,
                                    selectedDateIsWeekend
                                        ? s.rateTypeBadgeTextWeekend
                                        : s.rateTypeBadgeTextWeekday,
                                ]}
                            >
                                {selectedDateIsWeekend ? 'Weekend' : 'Weekday'}
                            </Text>
                        </View>
                    </View>
                    <View style={s.priceRow}>
                        <Text style={s.priceRowLabel}>
                            Venue Rental{selectedDuration ? ` (${selectedDuration.label})` : ''}
                        </Text>
                        <Text style={s.priceRowValue}>{fmt(basePrice)}</Text>
                    </View>
                    {incomingAmenitiesTotal > 0 && (
                        <View style={s.priceRow}>
                            <Text style={s.priceRowLabel}>Amenities & Services</Text>
                            <Text style={s.priceRowValue}>{fmt(incomingAmenitiesTotal)}</Text>
                        </View>
                    )}
                    <View style={[s.priceRow, s.subtotalRow]}>
                        <Text style={s.subtotalLabel}>Subtotal</Text>
                        <Text style={s.subtotalValue}>{fmt(subtotal)}</Text>
                    </View>
                    {venueCGSTAmount > 0 && (
                        <View style={s.priceRow}>
                            <Text style={s.priceRowLabel}>
                                Venue CGST ({platformSettings.venueCGST}%)
                            </Text>
                            <Text style={[s.priceRowValue, s.priceRowFee]}>
                                {fmtDec(venueCGSTAmount)}
                            </Text>
                        </View>
                    )}
                    {venueSGSTAmount > 0 && (
                        <View style={s.priceRow}>
                            <Text style={s.priceRowLabel}>
                                Venue SGST ({platformSettings.venueSGST}%)
                            </Text>
                            <Text style={[s.priceRowValue, s.priceRowFee]}>
                                {fmtDec(venueSGSTAmount)}
                            </Text>
                        </View>
                    )}
                    {venueGSTTotal > 0 && (
                        <View style={s.priceRow}>
                            <Text style={[s.priceRowLabel, { fontWeight: Typography.semiBold }]}>
                                Venue GST Total
                            </Text>
                            <Text
                                style={[
                                    s.priceRowValue,
                                    s.priceRowFee,
                                    { fontWeight: Typography.bold },
                                ]}
                            >
                                {fmtDec(venueGSTTotal)}
                            </Text>
                        </View>
                    )}
                    <View style={s.priceRow}>
                        <Text style={s.priceRowLabel}>{platformFeeLabelText}</Text>
                        <Text style={[s.priceRowValue, s.priceRowFee]}>{fmtDec(platformFee)}</Text>
                    </View>
                    {platformCGSTAmount > 0 && (
                        <View style={s.priceRow}>
                            <Text style={s.priceRowLabel}>
                                Platform CGST ({platformCGSTLabelPct}%)
                                {venue.customGST?.enabled ? ' · Custom' : ''}
                            </Text>
                            <Text style={[s.priceRowValue, s.priceRowFee]}>
                                {fmtDec(platformCGSTAmount)}
                            </Text>
                        </View>
                    )}
                    {platformSGSTAmount > 0 && (
                        <View style={s.priceRow}>
                            <Text style={s.priceRowLabel}>
                                Platform SGST ({platformSGSTLabelPct}%)
                                {venue.customGST?.enabled ? ' · Custom' : ''}
                            </Text>
                            <Text style={[s.priceRowValue, s.priceRowFee]}>
                                {fmtDec(platformSGSTAmount)}
                            </Text>
                        </View>
                    )}
                    {(platformCGSTAmount > 0 || platformSGSTAmount > 0) && (
                        <View style={s.priceRow}>
                            <Text style={[s.priceRowLabel, { fontWeight: Typography.semiBold }]}>
                                Platform Fee Total
                            </Text>
                            <Text
                                style={[
                                    s.priceRowValue,
                                    s.priceRowFee,
                                    { fontWeight: Typography.bold },
                                ]}
                            >
                                {fmtDec(platformFeeTotal)}
                            </Text>
                        </View>
                    )}
                    <View style={s.priceDivider} />
                    <View style={s.priceTotalRow}>
                        <Text style={s.priceTotalLabel}>Total Amount</Text>
                        <View style={s.priceTotalRight}>
                            <Text style={s.priceTotalValue}>{fmtDec(total)}</Text>
                        </View>
                    </View>
                </View>

                {/* ── Terms ── */}
                {/* FIX 4: termsList and termsLoading now come from react-query, not dead local state */}
                {!isTermsLoading && termsList.length > 0 && (
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

                {/* ── Agree checkbox ── */}
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

            {/* ── Footer ── */}
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

            {/* ── Calendar modal ── */}
            <CalendarModal
                visible={calendarVisible}
                selectedDate={bookingDate}
                onSelect={date => {
                    setBookingDate(date);
                    clearError('date');
                }}
                onClose={() => setCalendarVisible(false)}
            />

            {/* ── Time picker modal ── */}
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

            {/* ── Event type picker modal ── */}
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
                                        clearError('eventType');
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

            <QuotationModal
                visible={viewQuotation}
                onClose={() => setVeiwQuotation(false)}
                venue={venue}
                onConfirmBooking={() => setVeiwQuotation(false)}
                platformSettings={platformSettings}
                quotationData={dummyQuotation}
            />
        </View>
    );
}

// ─── Styles (unchanged) ───────────────────────────────────────────────────────
const s = StyleSheet.create({
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
    scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
    section: { marginBottom: Spacing.xl },
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: Spacing.md,
    },
    sectionLabel: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
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
    inlineError: {
        fontSize: Typography.xs,
        color: Colors.danger,
        marginTop: 4,
        fontWeight: Typography.medium,
    },
    dayTypePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full },
    dayTypePillWeekday: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    dayTypePillWeekend: {
        backgroundColor: Colors.primaryLight,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    dayTypePillText: { fontSize: Typography.xs, fontWeight: Typography.semiBold },
    dayTypePillTextWeekday: { color: Colors.charcoalMid },
    dayTypePillTextWeekend: { color: Colors.primaryDark },
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
    dateTimeRow: { flexDirection: 'row', gap: Spacing.sm },
    dateTimeCol: { flex: 1 },
    datePickerBtn: { height: 48, borderColor: Colors.border },
    datePickerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
    datePickerText: {
        fontSize: Typography.sm,
        color: Colors.charcoal,
        fontWeight: Typography.semiBold,
    },
    weekendPill: {
        fontSize: 9,
        fontWeight: Typography.bold,
        color: Colors.primaryDark,
        backgroundColor: Colors.primaryLight,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        borderRadius: Radii.full,
        paddingHorizontal: 5,
        paddingVertical: 1,
        overflow: 'hidden',
    },
    capacityBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    capacityTrack: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        overflow: 'hidden',
    },
    capacityFill: { height: '100%', borderRadius: 2 },
    capacityText: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        minWidth: 48,
        textAlign: 'right',
    },
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
    inputError: { borderColor: Colors.danger },
    inputDisabled: { backgroundColor: Colors.background },
    input: { flex: 1, fontSize: Typography.base, color: Colors.charcoal, padding: 0 },
    inputText: { paddingVertical: 0, lineHeight: 20 },
    textareaWrap: { height: 80, alignItems: 'flex-start', paddingVertical: 10 },
    textarea: { height: 60, textAlignVertical: 'top' },
    hintText: { fontSize: Typography.xs, color: Colors.charcoalLight, marginTop: 4 },
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
        flex: 1,
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    rateTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full },
    rateTypeBadgeWeekday: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    rateTypeBadgeWeekend: {
        backgroundColor: Colors.primaryDim,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    rateTypeBadgeText: { fontSize: Typography.xs, fontWeight: Typography.bold },
    rateTypeBadgeTextWeekday: { color: Colors.charcoalMid },
    rateTypeBadgeTextWeekend: { color: Colors.primaryDark },
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
    subtotalRow: {
        marginTop: Spacing.xs,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.primaryBorder,
        marginBottom: Spacing.sm,
    },
    subtotalLabel: {
        fontSize: Typography.base,
        color: Colors.charcoal,
        fontWeight: Typography.bold,
    },
    subtotalValue: {
        fontSize: Typography.base,
        color: Colors.charcoal,
        fontWeight: Typography.bold,
    },
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

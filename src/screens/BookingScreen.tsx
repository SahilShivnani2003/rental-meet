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
import { useAuthStore } from '../store/useAuthStore';
import { venueAPI } from '../service/apis/venues';
import { bookingAPI } from '../service/apis/booking';
import { useAlert } from '../context/AlertContext';
import { Venue, SelectedAmenityItem } from './venue-detail';
import { paymentAPI } from '../service/apis/paymentService';
import RazorpayCheckout from 'react-native-razorpay';

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

// ─── Other Helpers ────────────────────────────────────────────────────────────

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

// ─── CalendarModal ────────────────────────────────────────────────────────────
interface CalendarModalProps {
    visible: boolean;
    selectedDate: string; // YYYY-MM-DD
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

/** Returns YYYY-MM-DD string for a Date object (local timezone, no UTC shift). */
function toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// Add this helper function near the top with other helpers (around line 90)
function parseMaxCapacity(capacityStr: string | number | undefined): number | null {
    if (!capacityStr) return null;

    // If it's already a number, return it
    if (typeof capacityStr === 'number') return capacityStr;

    // If it's a string like "50-100", extract the maximum
    const str = String(capacityStr).trim();
    if (str.includes('-')) {
        const parts = str.split('-');
        const max = Number(parts[1]?.trim());
        return isNaN(max) ? null : max;
    }

    // If it's a simple number string like "100"
    const num = Number(str);
    return isNaN(num) ? null : num;
}

/** Build the 6×7 grid of Date|null cells for a given month. */
function buildMonthGrid(year: number, month: number): (Date | null)[] {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid: (Date | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
        grid.push(new Date(year, month, d));
    }
    // Fill trailing nulls to complete the last row
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
}
function CalendarModal({ visible, selectedDate, onSelect, onClose }: CalendarModalProps) {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // First bookable date = tomorrow
    const minDate = new Date(todayDate);
    minDate.setDate(minDate.getDate() + 1);

    const parsedSelected = selectedDate ? new Date(selectedDate + 'T00:00:00') : null;

    // Initialise calendar view to the month of the selected date, or next month if today/past
    const initialViewDate = parsedSelected && parsedSelected >= minDate ? parsedSelected : minDate;

    const [viewYear, setViewYear] = useState(initialViewDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(initialViewDate.getMonth());

    // Re-sync when modal opens
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

    // Disable "previous" arrow if already showing the month that contains minDate
    const canGoPrev =
        viewYear > minDate.getFullYear() ||
        (viewYear === minDate.getFullYear() && viewMonth > minDate.getMonth());

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={cal.backdrop} activeOpacity={1} onPress={onClose} />

            <View style={cal.sheet}>
                <View style={cal.handle} />

                {/* ── Month navigation ── */}
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

                {/* ── Day-of-week header ── */}
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

                {/* ── Date grid ── */}
                <View style={cal.grid}>
                    {grid.map((date, idx) => {
                        if (!date) {
                            return <View key={`empty-${idx}`} style={cal.cell} />;
                        }

                        const dateStr = toDateStr(date);
                        const isPast = date < minDate; // today AND earlier are disabled
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
                                {/* "Today" indicator dot */}
                                {isToday && !isSelected && <View style={cal.todayDot} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* ── Legend ── */}
                <View style={cal.legend}>
                    <View style={cal.legendItem}>
                        <View style={[cal.legendDot, { backgroundColor: Colors.primary }]} />
                        <Text style={cal.legendText}>Selected</Text>
                    </View>
                    <View style={cal.legendItem}>
                        <View
                            style={[
                                cal.legendDot,
                                {
                                    backgroundColor: Colors.primaryLight,
                                    borderWidth: 1,
                                    borderColor: Colors.primaryBorder,
                                },
                            ]}
                        />
                        <Text style={cal.legendText}>Weekend</Text>
                    </View>
                    <View style={cal.legendItem}>
                        <View style={[cal.legendDot, { backgroundColor: Colors.background }]} />
                        <Text style={cal.legendText}>Unavailable</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ─── Calendar Styles ──────────────────────────────────────────────────────────

const CELL_SIZE = Math.floor((W - Spacing.xl * 2 - 28) / 7); // 28 = sheet padding * 2

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
    dayHeader: {
        flexDirection: 'row',
        marginBottom: 6,
    },
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
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    cell: {
        width: CELL_SIZE,
        height: CELL_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: CELL_SIZE / 2,
        marginVertical: 2,
        position: 'relative',
    },
    cellSelected: {
        backgroundColor: Colors.primary,
        ...Shadows.primary,
    },
    cellWeekend: {
        backgroundColor: Colors.primaryLight,
    },
    cellDisabled: {
        opacity: 0.3,
    },
    cellText: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    cellTextSelected: {
        color: Colors.white,
        fontWeight: Typography.extraBold,
    },
    cellTextDisabled: {
        color: Colors.charcoalLight,
        fontWeight: Typography.regular,
    },
    cellTextWeekend: {
        color: Colors.primaryDark,
        fontWeight: Typography.bold,
    },
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
// ─── Screen ────────────────────────────────────────────────────────────────────

export default function BookingScreen({ navigation, route }: BookingScreenProps) {
    const params = route.params as {
        venue: Venue;
        selectedAmenities?: SelectedAmenityItem[];
        amenitiesTotal?: number;
        preselectedDurationHours?: number;
        preselectedDurationType?: 'perHour' | 'halfDay' | 'fullDay';
    };

    const venue = params?.venue;
    const allAmenities: SelectedAmenityItem[] = params?.selectedAmenities ?? [];
    const incomingAmenitiesTotal: number = params?.amenitiesTotal ?? 0;
    const paidAmenities = allAmenities.filter(i => i.category !== 'basic_included');

    const { user } = useAuthStore();
    const alert = useAlert();
    const [submitting, setSubmitting] = useState(false);

    // ── Modal visibility ──────────────────────────────────────────────────────
    const [timePickerVisible, setTimePickerVisible] = useState(false);
    const [eventPickerVisible, setEventPickerVisible] = useState(false);
    const [calendarVisible, setCalendarVisible] = useState(false);

    // ── Platform settings ─────────────────────────────────────────────────────
    const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
        gstRate: 18,
        platformFee: { feeType: 'percentage', feeValue: 5 },
        commissionRate: 0,
    });
    const [termsList, setTermsList] = useState<string[]>([]);
    const [termsLoading, setTermsLoading] = useState(true);

    useEffect(() => {
        fetchPlatformSettings();
        fetchTerms();
    }, []);

    const fetchPlatformSettings = async () => {
        try {
            const res = await venueAPI.platformSetting();
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
        } finally {
            setTermsLoading(false);
        }
    };

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

    // ── "today" string & earliest bookable date ───────────────────────────────
    const todayStr = toDateStr(new Date());
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = toDateStr(tomorrowDate);

    const wknd = isWeekend(tomorrowStr); // default to tomorrow for initial price display

    // ── Duration options ──────────────────────────────────────────────────────
    const durationOptions: DurationOption[] = useMemo(() => {
        const opts: DurationOption[] = [];
        const useEnabled = !!(
            pricing?.enabledOptions?.perHour ||
            pricing?.enabledOptions?.halfDay ||
            pricing?.enabledOptions?.fullDay
        );
        if (!useEnabled || pricing?.enabledOptions?.perHour) {
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
        if (!useEnabled || pricing?.enabledOptions?.halfDay) {
            const rate = wknd ? pricing.halfDay?.weekend : pricing.halfDay?.weekday;
            if (rate)
                opts.push({
                    key: 'halfDay',
                    label: 'Half Day',
                    hours: 4,
                    price: rate,
                    type: 'halfDay',
                });
        }
        if (!useEnabled || pricing?.enabledOptions?.fullDay) {
            const rate = wknd ? pricing.fullDay?.weekend : pricing.fullDay?.weekday;
            if (rate)
                opts.push({
                    key: 'fullDay',
                    label: 'Full Day',
                    hours: 8,
                    price: rate,
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
    }, [durationOptions, params?.preselectedDurationType, params?.preselectedDurationHours]);

    // ── Form state ────────────────────────────────────────────────────────────
    const [selectedDuration, setSelectedDuration] = useState<DurationOption | null>(
        defaultDuration,
    );
    const [bookingDate, setBookingDate] = useState(tomorrowStr); // default = tomorrow
    const [startTime, setStartTime] = useState(timeSlots[0] ?? '10:00 AM');
    const [fullName, setFullName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [eventType, setEventType] = useState(venueType?.[0] ?? '');
    const [guestCount, setGuestCount] = useState('');
    const [specialRequirements, setSpecialRequirements] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // ── Inline field errors ───────────────────────────────────────────────────
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const clearError = (field: string) =>
        setFieldErrors(prev => {
            const n = { ...prev };
            delete n[field];
            return n;
        });

    // ── Computed end time ─────────────────────────────────────────────────────
    const endTime = useMemo(() => {
        if (!selectedDuration || selectedDuration.hours === null) return '—';
        const idx = timeSlots.indexOf(startTime);
        if (idx === -1) return '—';
        const endIdx = idx + selectedDuration.hours * 2;
        return timeSlots[endIdx] ?? 'Closing';
    }, [selectedDuration, startTime, timeSlots]);

    // ── Price ─────────────────────────────────────────────────────────────────
    const selectedDateWknd = bookingDate ? isWeekend(bookingDate) : wknd;
    const basePrice = selectedDuration?.price ?? 0;
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
    const gstAmount = Math.round(subtotal * gstRate);
    const total = subtotal + platformFee + gstAmount;

    // ── Guest count validation helper ─────────────────────────────────────────
    const guestNum = Number(guestCount);
    const guestOverCapacity = !!capacity && guestNum > capacity;
    const guestBelowMin = guestCount.trim() !== '' && (isNaN(guestNum) || guestNum <= 0);

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = useCallback((): string | null => {
        const maxCapacity = parseMaxCapacity(capacity);
        const errors: Record<string, string> = {};
        debugger;
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
            errors.guestCount = `Maximum capacity is ${capacity} guests. Booking not allowed.`;
        }

        setFieldErrors(errors);
        const firstError = Object.values(errors)[0];
        return firstError ?? null;
    }, [
        selectedDuration,
        bookingDate,
        fullName,
        email,
        phone,
        eventType,
        guestCount,
        guestNum,
        capacity,
    ]);

    const handlePayment = async (bookingId: string) => {
        try {
            const order = await paymentAPI.createPayment({
                bookingId: bookingId,
                amount: total,
            });

            if (!order.success) {
                alert.error('Failed', 'Failed to create paymet order');
                return;
            }

            const options = {
                key: '',
                amount: order.order.amount,
                currency: order.order.currency,
                name: 'RentalMeet',
                description: `Booking Payment - ${venue.businessName}`,
                order_id: order.order.id,
                prefill: {
                    name: fullName,
                    email: email,
                    contact: phone,
                },
                theme: {
                    color: '#F59F0A',
                },
            };

            const RazorpayResponse = await RazorpayCheckout.open(options);

            if (!RazorpayResponse?.razorpay_payment_id) throw new Error('Payment not completed');

            const verifyPayment = await paymentAPI.verifyPayment({
                razorpay_order_id: RazorpayResponse.razorpay_order_id,
                razorpay_payment_id: RazorpayResponse.razorpay_payment_id,
                razorpay_signature: RazorpayResponse.razorpay_signature,
                bookingId: bookingId,
            });

            if (verifyPayment.success) {
                alert.success('Payment Successfull! Booking confirmed');
                navigation.popToTop?.() ?? navigation.goBack();
                return;
            } else {
                alert.error('Failed', 'Payment verification failed');
            }
        } catch (error) {
            console.error('');
            alert.error('Failed', 'Payment Failed');
        }
    };
    // ── Submit ────────────────────────────────────────────────────────────────
    const handleConfirmBooking = async () => {
        const err = validate();
        if (err) {
            (alert.error ?? alert.show)?.('Validation Error', err);
            return;
        }

        setSubmitting(true);
        try {
            const bookingData = {
                venue: venue._id ?? venue.id,
                bookingDate,
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
                    guestCount: guestNum,
                    specialRequirements: specialRequirements.trim(),
                },
            };

            const response = await bookingAPI.create(bookingData);
            if (response?.success) {
                debugger
                await handlePayment(response.data._id);
            } else {
                (alert.error ?? alert.show)?.(
                    'Booking Failed',
                    response?.message ?? 'Something went wrong. Please try again.',
                );
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

    const handleGenerateQuote = async () => {
        const err = validate();
        if (err) {
            (alert.error ?? alert.show)?.('Validation Error', err);
            return;
        }
        (alert.info ?? alert.show)?.('Coming Soon', 'Quotation generation will be available soon.');
    };

    // ── Formatted date for display ────────────────────────────────────────────
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
                    <Text style={s.sectionLabel}>
                        Select Duration <Text style={s.req}>*</Text>
                    </Text>
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
                        {/* ── Calendar date picker ── */}
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
                                    {bookingDate && isWeekend(bookingDate) && (
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

                        {/* End Time — read-only */}
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

                            {/* Capacity bar — shows once user starts typing */}
                            {!!capacity &&
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
                                                            (guestNum / capacity) * 100,
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
                                            {guestNum} / {capacity}
                                        </Text>
                                    </View>
                                )}

                            {fieldErrors.guestCount ? (
                                <Text style={s.inlineError}>{fieldErrors.guestCount}</Text>
                            ) : capacity ? (
                                <Text style={s.hintText}>Max capacity: {capacity} guests</Text>
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
                    </View>
                    <View style={s.priceRow}>
                        <Text style={s.priceRowLabel}>Base Price</Text>
                        <Text style={s.priceRowValue}>{fmt(basePrice)}</Text>
                    </View>
                    {incomingAmenitiesTotal > 0 && (
                        <>
                            <View style={s.priceRow}>
                                <Text style={s.priceRowLabel}>Amenities</Text>
                                <Text style={s.priceRowValue}>{fmt(incomingAmenitiesTotal)}</Text>
                            </View>
                            <View style={s.priceRow}>
                                <Text style={s.priceRowLabel}>Subtotal</Text>
                                <Text style={s.priceRowValue}>{fmt(subtotal)}</Text>
                            </View>
                        </>
                    )}
                    <View style={s.priceRow}>
                        <Text style={s.priceRowLabel}>
                            Platform Fee
                            {platformFeeRate > 0 ? ` (${Math.round(platformFeeRate * 100)}%)` : ''}
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
                                {selectedDateWknd ? 'Weekend rate' : 'Weekday rate'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── Terms ── */}
                {!termsLoading && termsList.length > 0 && (
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
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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

    // Inline error
    inlineError: {
        fontSize: Typography.xs,
        color: Colors.danger,
        marginTop: 4,
        fontWeight: Typography.medium,
    },

    // Duration
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

    // Date / time
    dateTimeRow: { flexDirection: 'row', gap: Spacing.sm },
    dateTimeCol: { flex: 1 },

    // ── Calendar date picker button ──
    datePickerBtn: {
        height: 48,
        borderColor: Colors.border,
    },
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

    // Capacity bar
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

    // Form
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

    // Amenities
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

    // Pickers
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

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radii, Shadows } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import LoadingDots from '@/components/UI/loading-dots';
import { useAlert } from '@/context/AlertContext';
import { ApiError } from '@/types/ApiError';
import { VendorService } from '@/features/otherService/types/VendorService';
import { useCreateServiceBooking, useServicePlatformSetting } from '../hooks/useVendorBooking';
import { ServiceBooking } from '../types/ServiceBooking';
import { useCreatePaymentOrder, useVerifyPayment } from '../hooks/usePayment';
import RazorpayCheckout from 'react-native-razorpay';
import { useAuthStore } from '@/store/useAuthStore';
import Config from 'react-native-config';
import TimePicker from '../components/TimePicker';
import ServiceQuotationModal, {
    ServiceBookingLite,
    ServicePricing,
} from '@/features/quotation/screens/ServiceQuotationModal';

const { width: W } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPrice = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const pct = (n: number) => `${n}%`;

const CAT_COLOR: Record<string, string> = {
    Catering: '#E67E22',
    'Makeup & Beauty': '#8E44AD',
    Photography: '#16A085',
    Entertainment: '#2980B9',
    'Decor & Floral': '#27AE60',
    Security: '#C0392B',
    Celebrity: '#F39C12',
    'Logistics & Support': '#17A589',
};

const EVENT_TYPES = [
    'Wedding',
    'Corporate Event',
    'Birthday Party',
    'Conference',
    'Product Launch',
    'Anniversary',
    'Social Gathering',
    'Other',
];

// ─── Calendar helpers ─────────────────────────────────────────────────────────
const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const isPastDate = (d: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const check = new Date(d);
    check.setHours(0, 0, 0, 0);
    return check < today;
};
const isToday = (y: number, m: number, day: number) => {
    const t = new Date();
    return t.getFullYear() === y && t.getMonth() === m && t.getDate() === day;
};

// ─── Mock coupons (replace with API data) ─────────────────────────────────────
const AVAILABLE_COUPONS = [
    { code: 'ADMIN20', discount: '20% off', description: 'Get 20% off on all services' },
    { code: 'FIRST10', discount: '10% off', description: 'First booking discount' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'serviceBooking'>;

export default function ServiceBookingScreen({ navigation, route }: Props) {
    const { service, selectedPackages } = route.params as {
        service: VendorService;
        selectedPackages?: {
            name: string;
            price: number;
            unit?: string;
            quantity: number;
            amount: number;
        }[];
    };

    const alert = useAlert();
    const catColor = CAT_COLOR[service.category] ?? Colors.primary;
    const { user } = useAuthStore();
    const { mutate: createBooking } = useCreateServiceBooking();
    const { data: platformSettingData, isLoading: settingsLoading } = useServicePlatformSetting();
    const { mutate: createPaymentOrder } = useCreatePaymentOrder();
    const { mutate: verifyPaymentMutate } = useVerifyPayment();

    const packages = service.packages ?? [];

    // Pre-fill serviceQuantities from selectedPackages passed by VendorDetailScreen
    const initialQuantities = useMemo(() => {
        if (!selectedPackages?.length) return {};
        const map: Record<number, number> = {};
        selectedPackages.forEach(sp => {
            const idx = packages.findIndex(p => (p.name ?? (p as any).serviceName) === sp.name);
            if (idx !== -1) map[idx] = sp.quantity;
        });
        return map;
    }, [selectedPackages, packages]);

    // ── Form state ────────────────────────────────────────────────────────────
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [startTime, setStartTime] = useState('');
    const [guestCount, setGuestCount] = useState('');
    const [eventType, setEventType] = useState('');
    const [specialReq, setSpecialReq] = useState('');
    const [calYear, setCalYear] = useState(new Date().getFullYear());
    const [calMonth, setCalMonth] = useState(new Date().getMonth());
    const [calendarOpen, setCalendarOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [couponCode, setCouponCode] = useState('');
    const [serviceQuantities, setServiceQuantities] =
        useState<Record<number, number>>(initialQuantities);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(24)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 340, useNativeDriver: true }),
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                speed: 16,
                bounciness: 5,
            }),
        ]).start();
    }, []);

    const [quotationOpen, setQuotationOpen] = useState(false);
    const [quotationBooking, setQuotationBooking] = useState<ServiceBookingLite | null>(null);

    const toggleCalendar = () => {
        setCalendarOpen(prev => !prev);
    };

    // ── Calendar ──────────────────────────────────────────────────────────────
    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
    const monthName = new Date(calYear, calMonth).toLocaleString('en-IN', {
        month: 'long',
        year: 'numeric',
    });

    const prevMonth = () => {
        if (calMonth === 0) {
            setCalMonth(11);
            setCalYear(y => y - 1);
        } else {
            setCalMonth(m => m - 1);
        }
    };

    const nextMonth = () => {
        if (calMonth === 11) {
            setCalMonth(0);
            setCalYear(y => y + 1);
        } else {
            setCalMonth(m => m + 1);
        }
    };

    const calCells = Array.from({ length: firstDayOfWeek + daysInMonth }, (_, i) =>
        i < firstDayOfWeek ? null : i - firstDayOfWeek + 1,
    );

    const isSelected = (day: number) =>
        selectedDate?.getFullYear() === calYear &&
        selectedDate?.getMonth() === calMonth &&
        selectedDate?.getDate() === day;

    // ── Price breakdown ───────────────────────────────────────────────────────
    const breakdown = useMemo(() => {
        let base = 0;

        if (Object.keys(serviceQuantities).length > 0) {
            base = Object.entries(serviceQuantities).reduce((sum, [idx, qty]) => {
                const pkg = packages[parseInt(idx)];
                const price = pkg?.price ?? (pkg as any)?.rate ?? 0;
                return sum + price * qty;
            }, 0);
        } else {
            base = service.startingPrice ?? 0;
        }

        const settings = platformSettingData;

        // FIX 2: serviceCategoryRates lookup uses service.category — correct.
        // But fallback chain must handle undefined platformSettingData gracefully.
        const catRate = settings?.serviceCategoryRates?.find(
            (r: any) => r.category === service.category,
        );

        const cgstPct = catRate?.cgst ?? settings?.serviceCGST ?? 9;
        const sgstPct = catRate?.sgst ?? settings?.serviceSGST ?? 9;
        const platFeePct = catRate?.platformFee ?? settings?.servicePlatformFee ?? 5;
        const platCgstPct = catRate?.platformCGST ?? settings?.platformCGST ?? 9;
        const platSgstPct = catRate?.platformSGST ?? settings?.platformSGST ?? 9;

        const serviceCGST = Math.round((base * cgstPct) / 100);
        const serviceSGST = Math.round((base * sgstPct) / 100);
        const platformFee = Math.round((base * platFeePct) / 100);
        const platformFeeGST = Math.round((platformFee * (platCgstPct + platSgstPct)) / 100);

        // FIX 3: Coupon discount was never subtracted from the total.
        // Look up the coupon and apply its discount if matched.
        let discountAmount = 0;
        if (couponCode) {
            // Derive discount from mock coupons; in production replace with API data.
            const matched = AVAILABLE_COUPONS.find(c => c.code === couponCode);
            if (matched) {
                const discountPct = parseInt(matched.discount); // e.g. "20% off" → 20
                if (!isNaN(discountPct)) {
                    discountAmount = Math.round((base * discountPct) / 100);
                }
            }
        }

        const total =
            base + serviceCGST + serviceSGST + platformFee + platformFeeGST - discountAmount;

        return {
            base,
            cgstPct,
            sgstPct,
            platFeePct,
            platCgstPct,
            platSgstPct,
            serviceCGST,
            serviceSGST,
            platformFee,
            platformFeeGST,
            discountAmount,
            total: Math.max(0, total), // never go below 0
        };
    }, [
        serviceQuantities,
        packages,
        service.startingPrice,
        service.category,
        platformSettingData,
        couponCode,
    ]);

    const toISODate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const quotationPricing: ServicePricing = useMemo(
        () => ({
            subtotal: breakdown.base,
            serviceCgst: breakdown.serviceCGST,
            serviceSgst: breakdown.serviceSGST,
            cgstPct: breakdown.cgstPct,
            sgstPct: breakdown.sgstPct,
            platformFee: breakdown.platformFee,
            platformFeePct: breakdown.platFeePct,
            platformFeeGst: breakdown.platformFeeGST,
            platformCgstPct: breakdown.platCgstPct,
            platformSgstPct: breakdown.platSgstPct,
            total: breakdown.total,
        }),
        [breakdown],
    );

    const quotationPackages = useMemo(
        () =>
            packages.map(pkg => ({
                name: pkg.name ?? (pkg as any).serviceName ?? '',
                price: pkg.price ?? (pkg as any).rate ?? 0,
                unit: pkg.unit ?? '',
            })),
        [packages],
    );

    const quotationSvc = useMemo(
        () => ({
            title: service.title,
            category: service.category,
            city: service.city,
            state: service.state,
            companyName: service.companyName,
            vendor: service.vendor as any,
        }),
        [service],
    );

    const quotationForm = useMemo(
        () => ({
            name: user?.name,
            company: user?.companyName,
            email: user?.email,
            phone: user?.phone,
            eventName: eventType,
            notes: specialReq || undefined,
        }),
        [user, eventType, specialReq],
    );

    const handleGetQuotation = () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) return;
        if (!service._id) {
            alert.error('Missing Data', 'Service ID is missing.');
            return;
        }
        setQuotationBooking({
            isTemporary: true,
            quotationNumber: `Q-${Date.now().toString().slice(-8)}`,
        });
        setQuotationOpen(true);
    };

    // Standalone — duplicates a little of handleBook's payload shape on purpose,
    // so handleBook itself stays untouched.
    const handleSaveQuotationAsBooking = (): Promise<ServiceBookingLite | null> =>
        new Promise(resolve => {
            const items: ServiceBooking['items'] = [];
            if (Object.keys(serviceQuantities).length > 0) {
                Object.entries(serviceQuantities).forEach(([idx, qty]) => {
                    const pkg = packages[parseInt(idx)];
                    items.push({
                        name:
                            pkg?.name ??
                            (pkg as any)?.serviceName ??
                            `Service ${parseInt(idx) + 1}`,
                        price: pkg?.price ?? (pkg as any)?.rate ?? 0,
                        unit: pkg?.unit,
                        quantity: qty,
                        amount: (pkg?.price ?? (pkg as any)?.rate ?? 0) * qty,
                    });
                });
            } else {
                items.push({
                    name: service.title,
                    price: service.startingPrice ?? 0,
                    quantity: 1,
                    amount: service.startingPrice ?? 0,
                });
            }

            const noteParts: string[] = [];
            if (guestCount) noteParts.push(`Guests: ${guestCount}`);
            if (startTime) noteParts.push(`Start Time: ${startTime}`);
            if (specialReq) noteParts.push(specialReq);

            const payload: ServiceBooking = {
                service: service._id,
                serviceId: service._id,
                vendor: service.vendor,
                eventDate: selectedDate!,
                customerInfo: {
                    name: user?.name,
                    email: user?.email,
                    phone: user?.phone,
                    company: user?.companyName,
                    eventName: eventType,
                    notes: noteParts.join(' | ') || undefined,
                },
                serviceSnapshot: {
                    title: service.title,
                    category: service.category,
                    companyName: service.companyName,
                    city: service.city,
                    state: service.state,
                },
                items,
                pricing: {
                    subtotal: breakdown.base,
                    serviceCGST: breakdown.serviceCGST,
                    serviceSGST: breakdown.serviceSGST,
                    cgstPct: breakdown.cgstPct,
                    sgstPct: breakdown.sgstPct,
                    platformFee: breakdown.platformFee,
                    platformFeePct: breakdown.platFeePct,
                    platformFeeGST: breakdown.platformFeeGST,
                    total: breakdown.total,
                },
                amount: breakdown.total,
                ...(couponCode && {
                    coupon: { code: couponCode, discountAmount: breakdown.discountAmount },
                }),
            };

            createBooking(payload, {
                onSuccess: (response: any) => {
                    if (response?.success && response.booking) {
                        resolve({
                            _id: response.booking._id,
                            bookingNumber: response.booking.bookingNumber,
                            quotationNumber:
                                response.booking.quotationNumber ?? response.booking.bookingNumber,
                            isTemporary: false,
                        });
                    } else {
                        resolve(null);
                    }
                },
                onError: () => resolve(null),
            });
        });

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = () => {
        const e: Record<string, string> = {};
        if (!selectedDate) e.date = 'Please select a booking date';
        if (!eventType) e.eventType = 'Please select an event type';
        return e;
    };

    // ── Quantity handlers ─────────────────────────────────────────────────────
    const incrementQuantity = (index: number) =>
        setServiceQuantities(prev => ({ ...prev, [index]: (prev[index] || 0) + 1 }));

    const decrementQuantity = (index: number) =>
        setServiceQuantities(prev => {
            const newQty = Math.max(0, (prev[index] || 0) - 1);
            if (newQty === 0) {
                const { [index]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [index]: newQty };
        });

    // FIX 4: handlePayment referenced breakdown.total via closure — this is
    const handlePayment = useCallback(
        (bookingId: string): Promise<void> =>
            new Promise((resolve, reject) => {
                debugger;
                createPaymentOrder(
                    { bookingId, amount: breakdown.total, bookingType: 'service' },
                    {
                        onSuccess: async (orderData: any) => {
                            if (!orderData?.success) {
                                reject(new Error('Failed to create payment order'));
                                return;
                            }
                            try {
                                const options = {
                                    key: Config.RAZORPAY_KEY_TEST,
                                    amount: orderData.order.amount,
                                    currency: orderData.order.currency ?? 'INR',
                                    name: 'RentalMeet',
                                    description: `Booking Payment - ${
                                        service.companyName ?? service.title
                                    }`,
                                    order_id: orderData.order.id,
                                    prefill: {
                                        name: user?.name,
                                        email: user?.email,
                                        contact: user?.phone,
                                    },
                                    theme: { color: catColor },
                                };
                                const razorpayResponse = await RazorpayCheckout.open(options);
                                if (!razorpayResponse?.razorpay_payment_id) {
                                    reject(new Error('Payment not completed'));
                                    return;
                                }
                                verifyPaymentMutate(
                                    {
                                        razorpay_order_id: razorpayResponse.razorpay_order_id,
                                        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                                        razorpay_signature: razorpayResponse.razorpay_signature,
                                        bookingId,
                                        paidAmount: breakdown.total,
                                        bookingType: 'service',
                                    },
                                    {
                                        onSuccess: (verifyData: any) => {
                                            if (verifyData?.success) {
                                                alert.success(
                                                    'Payment Successful',
                                                    'Booking confirmed!',
                                                );
                                                // FIX 5: navigation.popToTop() does not take
                                                // arguments. The optional-chain on popToTop was
                                                // masking a type error; use reset instead so the
                                                // user reliably lands on the root screen.
                                                navigation.reset
                                                    ? navigation.reset({
                                                          index: 0,
                                                          routes: [{ name: 'Home' as any }],
                                                      })
                                                    : navigation.goBack();
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
            alert,
            breakdown.total,
            navigation,
            catColor,
            service,
            user,
        ],
    );

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleBook = () => {
        debugger;
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) return;
        if (!service._id) {
            alert.error('Missing Data', 'Service ID is missing.');
            return;
        }

        const items: ServiceBooking['items'] = [];

        if (Object.keys(serviceQuantities).length > 0) {
            Object.entries(serviceQuantities).forEach(([idx, qty]) => {
                const pkg = packages[parseInt(idx)];
                items.push({
                    name: pkg?.name ?? (pkg as any)?.serviceName ?? `Service ${parseInt(idx) + 1}`,
                    price: pkg?.price ?? (pkg as any)?.rate ?? 0,
                    unit: pkg?.unit,
                    quantity: qty,
                    amount: (pkg?.price ?? (pkg as any)?.rate ?? 0) * qty,
                });
            });
        } else {
            items.push({
                name: service.title,
                price: service.startingPrice ?? 0,
                quantity: 1,
                amount: service.startingPrice ?? 0,
            });
        }

        const noteParts: string[] = [];
        if (guestCount) noteParts.push(`Guests: ${guestCount}`);
        if (startTime) noteParts.push(`Start Time: ${startTime}`);
        if (specialReq) noteParts.push(specialReq);

        const payload: ServiceBooking = {
            service: service._id,
            serviceId: service._id,
            vendor: service.vendor,
            eventDate: selectedDate!,
            customerInfo: {
                name: user?.name,
                email: user?.email,
                phone: user?.phone,
                company: user?.companyName,
                eventName: eventType,
                notes: noteParts.join(' | ') || undefined,
            },
            serviceSnapshot: {
                title: service.title,
                category: service.category,
                companyName: service.companyName,
                city: service.city,
                state: service.state,
            },
            items,
            pricing: {
                subtotal: breakdown.base,
                serviceCGST: breakdown.serviceCGST,
                serviceSGST: breakdown.serviceSGST,
                cgstPct: breakdown.cgstPct,
                sgstPct: breakdown.sgstPct,
                platformFee: breakdown.platformFee,
                platformFeePct: breakdown.platFeePct,
                platformFeeGST: breakdown.platformFeeGST,
                total: breakdown.total,
            },
            amount: breakdown.total,
            ...(couponCode && {
                coupon: {
                    code: couponCode,
                    discountAmount: breakdown.discountAmount,
                },
            }),
        };

        setLoading(true);
        createBooking(payload, {
            onSuccess: async (response: any) => {
                if (response?.success) {
                    try {
                        await handlePayment(response.booking._id);
                    } catch (payErr: any) {
                        alert.error(
                            'Payment Failed',
                            payErr?.message ?? 'Payment could not be processed.',
                        );
                    }
                } else {
                    alert.error('Booking Failed', response?.message ?? 'Something went wrong.');
                }
                setLoading(false);
            },
            onError: (err: ApiError) => {
                setLoading(false);
                alert.error('Booking Failed', err?.message || 'Something went wrong.');
            },
        });
    };

    // ── Derived ───────────────────────────────────────────────────────────────
    const hasItems = Object.keys(serviceQuantities).length > 0;
    const itemsTotal = Object.entries(serviceQuantities).reduce((sum, [idx, qty]) => {
        const pkg = packages[parseInt(idx)];
        return sum + (pkg?.price ?? (pkg as any)?.rate ?? 0) * qty;
    }, 0);

    const hasPackages = packages.length > 0;
    const steps = {
        dateTime: 1,
        services: 2, // only shown when hasPackages
        eventDetails: hasPackages ? 3 : 2,
        coupons: hasPackages ? 4 : 3,
        pricing: hasPackages ? 5 : 4,
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={s.root}>
                {/* Header */}
                <View style={s.header}>
                    <View style={[s.headerAccent, { backgroundColor: catColor }]} />
                    <View style={s.headerContent}>
                        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={s.headerEyebrow}>BOOK THIS SERVICE</Text>
                            <Text style={s.headerTitle} numberOfLines={1}>
                                {service.title}
                            </Text>
                        </View>
                    </View>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={s.scroll}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View
                        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
                    >
                        {/* Service summary card */}
                        <View style={s.summaryCard}>
                            <View style={[s.summaryIcon, { backgroundColor: catColor + '18' }]}>
                                <Ionicons
                                    name={getCategoryIcon(service.category)}
                                    size={22}
                                    color={catColor}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.summaryTitle} numberOfLines={1}>
                                    {service.title}
                                </Text>
                                <View style={s.categoryBadge}>
                                    <Ionicons
                                        name={getCategoryIcon(service.category)}
                                        size={11}
                                        color={catColor}
                                    />
                                    <Text style={[s.summaryCategory, { color: catColor }]}>
                                        {service.category}
                                    </Text>
                                </View>
                                {(service.city || service.state) && (
                                    <Text style={s.summaryLocation}>
                                        {[service.city, service.state].filter(Boolean).join(', ')}
                                    </Text>
                                )}
                                {service.companyName && (
                                    <Text style={s.companyName}>{service.companyName}</Text>
                                )}
                            </View>
                            {service.status === 'approved' && (
                                <View style={s.verifiedChip}>
                                    <Ionicons
                                        name="shield-checkmark"
                                        size={12}
                                        color={Colors.success}
                                    />
                                    <Text style={s.verifiedChipText}>Verified</Text>
                                </View>
                            )}
                        </View>

                        {/* Starting price */}
                        <View style={[s.priceBadge, { borderColor: catColor + '30' }]}>
                            <Text style={s.priceBadgeLabel}>Starting from</Text>
                            <Text style={[s.priceBadgeValue, { color: catColor }]}>
                                {fmtPrice(service.startingPrice ?? 0)}
                            </Text>
                            <Text style={s.priceBadgeSuffix}>onwards</Text>
                        </View>

                        {/* ── STEP 1: Date & Time with open/close toggle ── */}
                        <TouchableOpacity
                            style={s.sectionHeaderRow}
                            onPress={toggleCalendar}
                            activeOpacity={0.8}
                        >
                            <View style={[s.stepBadge, { backgroundColor: catColor }]}>
                                <Text style={s.stepNum}>{steps.dateTime}</Text>
                            </View>
                            <Ionicons name="calendar-outline" size={16} color={catColor} />
                            <Text style={s.sectionHeaderTitle}>Select Date & Time</Text>
                            <View style={{ flex: 1 }} />
                            {selectedDate && !calendarOpen && (
                                <Text
                                    style={[
                                        s.selectedDateChip,
                                        {
                                            color: catColor,
                                            borderColor: catColor + '40',
                                            backgroundColor: catColor + '12',
                                        },
                                    ]}
                                >
                                    {fmtDate(selectedDate)}
                                </Text>
                            )}
                            <Ionicons
                                name={calendarOpen ? 'chevron-up' : 'chevron-down'}
                                size={18}
                                color={Colors.charcoalLight}
                            />
                        </TouchableOpacity>

                        {!!errors.date && <ErrorMsg msg={errors.date} />}

                        {calendarOpen && (
                            <View style={s.card}>
                                {/* Month navigation */}
                                <View style={s.calNav}>
                                    <TouchableOpacity style={s.calNavBtn} onPress={prevMonth}>
                                        <Ionicons
                                            name="chevron-back"
                                            size={18}
                                            color={Colors.charcoal}
                                        />
                                    </TouchableOpacity>
                                    <Text style={s.calMonthLabel}>{monthName}</Text>
                                    <TouchableOpacity style={s.calNavBtn} onPress={nextMonth}>
                                        <Ionicons
                                            name="chevron-forward"
                                            size={18}
                                            color={Colors.charcoal}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* Day labels */}
                                <View style={s.calDayRow}>
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                                        (d, i) => (
                                            <Text
                                                key={i}
                                                style={[
                                                    s.calDayLabel,
                                                    (i === 0 || i === 6) && { color: catColor },
                                                ]}
                                            >
                                                {d.slice(0, 1)}
                                            </Text>
                                        ),
                                    )}
                                </View>

                                {/* Date grid */}
                                <View style={s.calGrid}>
                                    {calCells.map((day, idx) => {
                                        if (!day) return <View key={idx} style={s.calCell} />;
                                        const past = isPastDate(new Date(calYear, calMonth, day));
                                        const sel = isSelected(day);
                                        const tod = isToday(calYear, calMonth, day);
                                        const weekend = idx % 7 === 0 || idx % 7 === 6;
                                        return (
                                            <TouchableOpacity
                                                key={idx}
                                                style={[
                                                    s.calCell,
                                                    sel && { backgroundColor: catColor },
                                                    !sel &&
                                                        tod && {
                                                            borderWidth: 1.5,
                                                            borderColor: catColor,
                                                        },
                                                    !sel &&
                                                        !past &&
                                                        weekend && {
                                                            backgroundColor: catColor + '12',
                                                        },
                                                    past && s.calCellDisabled,
                                                ]}
                                                onPress={() => {
                                                    if (!past) {
                                                        setSelectedDate(
                                                            new Date(calYear, calMonth, day),
                                                        );
                                                        setErrors(p => ({ ...p, date: '' }));
                                                        // Auto-close calendar after selection
                                                        setTimeout(() => {
                                                            setCalendarOpen(false);
                                                        }, 300);
                                                    }
                                                }}
                                                disabled={past}
                                                activeOpacity={0.75}
                                            >
                                                <Text
                                                    style={[
                                                        s.calDayNum,
                                                        sel && {
                                                            color: Colors.white,
                                                            fontWeight: Typography.extraBold,
                                                        },
                                                        past && { color: Colors.border },
                                                        !sel &&
                                                            tod && {
                                                                color: catColor,
                                                                fontWeight: Typography.bold,
                                                            },
                                                    ]}
                                                >
                                                    {day}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {selectedDate && (
                                    <View
                                        style={[
                                            s.selectedDateStrip,
                                            {
                                                backgroundColor: catColor + '14',
                                                borderColor: catColor + '30',
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={15}
                                            color={catColor}
                                        />
                                        <Text style={[s.selectedDateText, { color: catColor }]}>
                                            Selected: {fmtDate(selectedDate)}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => setSelectedDate(null)}
                                            style={{ marginLeft: 'auto' }}
                                        >
                                            <Ionicons
                                                name="close-circle-outline"
                                                size={16}
                                                color={catColor}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Start Time */}
                                <Text style={[s.fieldLabel, { marginTop: Spacing.md }]}>
                                    Start Time
                                </Text>
                                {/* FIX 8: pointerEvents as a prop (deprecated string style approach) */}
                                <View
                                    pointerEvents={!selectedDate ? 'none' : 'auto'}
                                    style={!selectedDate ? { opacity: 0.45 } : undefined}
                                >
                                    <TimePicker
                                        value={startTime}
                                        onChange={setStartTime}
                                        color={catColor}
                                    />
                                </View>
                            </View>
                        )}

                        {/* ── STEP 2: Services & Rate List ── */}
                        {hasPackages && (
                            <>
                                <SectionHeader
                                    step={steps.services}
                                    title="Services & Rate List"
                                    color={catColor}
                                    icon="list-outline"
                                />
                                <View style={s.card}>
                                    {/* Table Header */}
                                    <View style={s.tableHeader}>
                                        <Text style={[s.tableHeaderText, { flex: 2.2 }]}>
                                            Service
                                        </Text>
                                        <Text style={[s.tableHeaderText, { flex: 1.2 }]}>Rate</Text>
                                        <Text
                                            style={[
                                                s.tableHeaderText,
                                                { flex: 1, textAlign: 'center' },
                                            ]}
                                        >
                                            Qty
                                        </Text>
                                        <Text
                                            style={[
                                                s.tableHeaderText,
                                                { flex: 1, textAlign: 'right' },
                                            ]}
                                        >
                                            Amount
                                        </Text>
                                    </View>

                                    {packages.map((pkg, i) => {
                                        const name =
                                            pkg.name ??
                                            (pkg as any).serviceName ??
                                            `Service ${i + 1}`;
                                        const price = pkg.price ?? (pkg as any).rate ?? 0;
                                        const unit = pkg.unit ?? '';
                                        const qty = serviceQuantities[i] || 0;
                                        const amount = price * qty;
                                        const isActive = qty > 0;

                                        return (
                                            <View
                                                key={i}
                                                style={[
                                                    s.tableRow,
                                                    isActive && {
                                                        backgroundColor: catColor + '06',
                                                    },
                                                ]}
                                            >
                                                <View style={{ flex: 2.2 }}>
                                                    <Text style={s.tableCellName} numberOfLines={2}>
                                                        {name}
                                                    </Text>
                                                    {!!unit && (
                                                        <Text style={s.tableCellUnit}>
                                                            per {unit}
                                                        </Text>
                                                    )}
                                                </View>
                                                <Text
                                                    style={[
                                                        s.tableCellPrice,
                                                        { flex: 1.2, color: catColor },
                                                    ]}
                                                >
                                                    {fmtPrice(price)}
                                                </Text>
                                                <View style={[s.qtyControl, { flex: 1 }]}>
                                                    <TouchableOpacity
                                                        style={[
                                                            s.qtyBtn,
                                                            qty === 0 && {
                                                                borderColor: Colors.border,
                                                            },
                                                        ]}
                                                        onPress={() => decrementQuantity(i)}
                                                        disabled={qty === 0}
                                                    >
                                                        <Ionicons
                                                            name="remove"
                                                            size={14}
                                                            color={
                                                                qty === 0 ? Colors.border : catColor
                                                            }
                                                        />
                                                    </TouchableOpacity>
                                                    <Text
                                                        style={[
                                                            s.qtyText,
                                                            isActive && {
                                                                color: catColor,
                                                                fontWeight: Typography.bold,
                                                            },
                                                        ]}
                                                    >
                                                        {qty}
                                                    </Text>
                                                    <TouchableOpacity
                                                        style={[
                                                            s.qtyBtn,
                                                            { borderColor: catColor },
                                                        ]}
                                                        onPress={() => incrementQuantity(i)}
                                                    >
                                                        <Ionicons
                                                            name="add"
                                                            size={14}
                                                            color={catColor}
                                                        />
                                                    </TouchableOpacity>
                                                </View>
                                                <Text
                                                    style={[
                                                        s.tableCellAmount,
                                                        {
                                                            flex: 1,
                                                            textAlign: 'right',
                                                            color: isActive
                                                                ? Colors.charcoal
                                                                : Colors.charcoalLight,
                                                        },
                                                    ]}
                                                >
                                                    {qty > 0 ? fmtPrice(amount) : '—'}
                                                </Text>
                                            </View>
                                        );
                                    })}

                                    {/* Items subtotal */}
                                    {hasItems && (
                                        <View
                                            style={[
                                                s.tableSubtotalRow,
                                                { borderTopColor: catColor + '30' },
                                            ]}
                                        >
                                            <Text style={s.tableSubtotalLabel}>
                                                Services Subtotal
                                            </Text>
                                            <Text
                                                style={[s.tableSubtotalValue, { color: catColor }]}
                                            >
                                                {fmtPrice(itemsTotal)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </>
                        )}

                        {/* ── STEP 3 (or 2): Event Details ── */}
                        <SectionHeader
                            step={steps.eventDetails}
                            title="Event Details"
                            color={catColor}
                            icon="information-circle-outline"
                        />
                        {!!errors.eventType && <ErrorMsg msg={errors.eventType} />}

                        <View style={s.card}>
                            <Text style={s.fieldLabel}>Event Type *</Text>
                            <View style={s.chipGrid}>
                                {EVENT_TYPES.map(et => {
                                    const active = eventType === et;
                                    return (
                                        <TouchableOpacity
                                            key={et}
                                            style={[
                                                s.chip,
                                                active && {
                                                    backgroundColor: catColor,
                                                    borderColor: catColor,
                                                },
                                            ]}
                                            onPress={() => {
                                                setEventType(et);
                                                setErrors(p => ({ ...p, eventType: '' }));
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <Text
                                                style={[
                                                    s.chipText,
                                                    active && { color: Colors.white },
                                                ]}
                                            >
                                                {et}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text style={[s.fieldLabel, { marginTop: Spacing.md }]}>
                                Expected Guest Count
                            </Text>
                            <View style={s.inputWrap}>
                                <Ionicons
                                    name="people-outline"
                                    size={16}
                                    color={Colors.charcoalLight}
                                />
                                <TextInput
                                    style={s.input}
                                    placeholder="e.g. 100"
                                    placeholderTextColor={Colors.charcoalLight}
                                    value={guestCount}
                                    onChangeText={t => setGuestCount(t.replace(/\D/g, ''))}
                                    keyboardType="numeric"
                                />
                            </View>

                            <Text style={[s.fieldLabel, { marginTop: Spacing.md }]}>
                                Special Requirements
                            </Text>
                            <View
                                style={[
                                    s.inputWrap,
                                    { height: 100, alignItems: 'flex-start', paddingTop: 12 },
                                ]}
                            >
                                <Ionicons
                                    name="create-outline"
                                    size={16}
                                    color={Colors.charcoalLight}
                                    style={{ marginTop: 1 }}
                                />
                                <TextInput
                                    style={[s.input, { height: 76 }]}
                                    placeholder="Any specific requirements or notes..."
                                    placeholderTextColor={Colors.charcoalLight}
                                    value={specialReq}
                                    onChangeText={setSpecialReq}
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>

                        {/* ── STEP 4 (or 3): Available Coupons ── */}
                        {AVAILABLE_COUPONS.length > 0 && (
                            <>
                                <SectionHeader
                                    step={steps.coupons}
                                    title="Available Coupons"
                                    color={Colors.success}
                                    icon="pricetag-outline"
                                />
                                <View style={s.couponsCard}>
                                    {AVAILABLE_COUPONS.map((c, i) => {
                                        const isApplied = couponCode === c.code;
                                        return (
                                            <View
                                                key={i}
                                                style={[
                                                    s.couponItem,
                                                    isApplied && {
                                                        borderColor: Colors.success,
                                                        backgroundColor: Colors.successLight,
                                                    },
                                                ]}
                                            >
                                                <View style={s.couponLeft}>
                                                    <View style={s.couponCodeBadge}>
                                                        <Text style={s.couponCodeText}>
                                                            {c.code}
                                                        </Text>
                                                    </View>
                                                    <View>
                                                        <Text style={s.couponDiscount}>
                                                            {c.discount}
                                                        </Text>
                                                        <Text
                                                            style={s.couponDesc}
                                                            numberOfLines={1}
                                                        >
                                                            {c.description}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <TouchableOpacity
                                                    style={[
                                                        s.copyBtn,
                                                        isApplied && {
                                                            borderColor: Colors.success,
                                                            backgroundColor: Colors.successLight,
                                                        },
                                                    ]}
                                                    onPress={() => {
                                                        if (isApplied) {
                                                            setCouponCode('');
                                                        } else {
                                                            setCouponCode(c.code);
                                                            alert.success(
                                                                'Applied!',
                                                                `Coupon ${c.code} applied`,
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <Text
                                                        style={[
                                                            s.copyBtnText,
                                                            isApplied && { color: Colors.success },
                                                        ]}
                                                    >
                                                        {isApplied ? 'Remove' : 'Apply'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })}
                                </View>
                            </>
                        )}

                        {/* ── STEP 5 (or 4): Pricing Summary ── */}
                        <SectionHeader
                            step={steps.pricing}
                            title="Pricing Summary"
                            color={catColor}
                            icon="receipt-outline"
                        />

                        <View style={s.card}>
                            {settingsLoading ? (
                                <View style={s.settingsLoader}>
                                    <ActivityIndicator size="small" color={catColor} />
                                    <Text style={s.settingsLoaderText}>Loading rates…</Text>
                                </View>
                            ) : (
                                <>
                                    <BreakdownRow
                                        label="Base Price:"
                                        value={fmtPrice(breakdown.base)}
                                    />
                                    <BreakdownRow
                                        label={`CGST (${pct(breakdown.cgstPct)}):`}
                                        value={fmtPrice(breakdown.serviceCGST)}
                                    />
                                    <BreakdownRow
                                        label={`SGST (${pct(breakdown.sgstPct)}):`}
                                        value={fmtPrice(breakdown.serviceSGST)}
                                    />
                                    <BreakdownRow
                                        label={`Platform Fee (${pct(breakdown.platFeePct)}):`}
                                        value={fmtPrice(breakdown.platformFee)}
                                    />
                                    <BreakdownRow
                                        label={`Platform GST (${pct(
                                            breakdown.platCgstPct + breakdown.platSgstPct,
                                        )}):`}
                                        value={fmtPrice(breakdown.platformFeeGST)}
                                    />
                                    {/* FIX 9: Show discount row only when a coupon is applied */}
                                    {breakdown.discountAmount > 0 && (
                                        <BreakdownRow
                                            label={`Discount (${couponCode}):`}
                                            value={`-${fmtPrice(breakdown.discountAmount)}`}
                                            valueStyle={{ color: Colors.success }}
                                        />
                                    )}
                                    <View style={s.breakdownDivider} />
                                    <View style={s.breakdownRow}>
                                        <Text style={[s.breakdownLabel, s.totalLabel]}>
                                            Estimated Total:
                                        </Text>
                                        <Text
                                            style={[
                                                s.breakdownValue,
                                                s.totalValue,
                                                { color: catColor },
                                            ]}
                                        >
                                            {fmtPrice(breakdown.total)}
                                        </Text>
                                    </View>

                                    {/* Coupon Code manual input */}
                                    <View style={[s.couponInputRow, { marginTop: Spacing.md }]}>
                                        <View style={[s.inputWrap, { flex: 1 }]}>
                                            <Ionicons
                                                name="ticket-outline"
                                                size={16}
                                                color={
                                                    couponCode
                                                        ? Colors.success
                                                        : Colors.charcoalLight
                                                }
                                            />
                                            <TextInput
                                                style={[
                                                    s.input,
                                                    couponCode && {
                                                        color: Colors.success,
                                                        fontWeight: Typography.bold,
                                                    },
                                                ]}
                                                placeholder="COUPON CODE"
                                                placeholderTextColor={Colors.charcoalLight}
                                                value={couponCode}
                                                onChangeText={setCouponCode}
                                                autoCapitalize="characters"
                                            />
                                            {!!couponCode && (
                                                <TouchableOpacity onPress={() => setCouponCode('')}>
                                                    <Ionicons
                                                        name="close-circle"
                                                        size={16}
                                                        color={Colors.charcoalLight}
                                                    />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        {/* FIX 10: Apply button now validates against known coupons
                                            and either applies or shows an error — the original code
                                            always showed "coming soon" which broke the coupon section. */}
                                        <TouchableOpacity
                                            style={[
                                                s.applyBtn,
                                                {
                                                    backgroundColor: catColor + '18',
                                                    borderColor: catColor + '40',
                                                    borderWidth: 1,
                                                },
                                            ]}
                                            onPress={() => {
                                                const trimmed = couponCode.trim();
                                                if (!trimmed) {
                                                    alert.info(
                                                        'Coupon',
                                                        'Please enter a coupon code',
                                                    );
                                                    return;
                                                }
                                                const matched = AVAILABLE_COUPONS.find(
                                                    c => c.code === trimmed,
                                                );
                                                if (matched) {
                                                    // setCouponCode already set via TextInput;
                                                    // breakdown recomputes automatically.
                                                    alert.success(
                                                        'Applied!',
                                                        `Coupon ${matched.code} applied — ${matched.discount}`,
                                                    );
                                                } else {
                                                    alert.error(
                                                        'Invalid Coupon',
                                                        'This coupon code is not valid.',
                                                    );
                                                    setCouponCode('');
                                                }
                                            }}
                                        >
                                            <Text style={[s.applyBtnText, { color: catColor }]}>
                                                Apply
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>

                        {/* ── Action Buttons ── */}
                        <View style={s.actionRow}>
                            <TouchableOpacity
                                style={[
                                    s.confirmBtn,
                                    { backgroundColor: !selectedDate ? Colors.border : catColor },
                                    (loading || settingsLoading) && { opacity: 0.7 },
                                ]}
                                onPress={handleBook}
                                disabled={loading || settingsLoading}
                                activeOpacity={0.88}
                            >
                                {loading ? (
                                    <LoadingDots />
                                ) : (
                                    <>
                                        <Ionicons
                                            name={
                                                selectedDate
                                                    ? 'calendar-outline'
                                                    : 'lock-closed-outline'
                                            }
                                            size={18}
                                            color={Colors.white}
                                        />
                                        <Text style={s.confirmText}>
                                            {selectedDate
                                                ? `Confirm & Pay ${fmtPrice(breakdown.total)}`
                                                : 'Select a Date First'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={s.shareBtn} activeOpacity={0.8}>
                                <Ionicons name="share-outline" size={18} color={catColor} />
                                <Text style={[s.shareBtnText, { color: catColor }]}>
                                    Share Service
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={s.shareBtn}
                                onPress={handleGetQuotation}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="document-text-outline" size={18} color={catColor} />
                                <Text style={[s.shareBtnText, { color: catColor }]}>
                                    Get Quotation
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ height: 40 }} />
                    </Animated.View>
                </ScrollView>
            </View>

            {quotationBooking && (
                <ServiceQuotationModal
                    visible={quotationOpen}
                    booking={quotationBooking}
                    svc={quotationSvc}
                    form={quotationForm}
                    selectedDate={selectedDate ? toISODate(selectedDate) : ''}
                    quantities={serviceQuantities}
                    packages={quotationPackages}
                    pricing={quotationPricing}
                    onSave={handleSaveQuotationAsBooking}
                    onClose={() => setQuotationOpen(false)}
                />
            )}
        </KeyboardAvoidingView>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getCategoryIcon(category: string): any {
    const icons: Record<string, string> = {
        Catering: 'restaurant',
        'Makeup & Beauty': 'sparkles',
        Photography: 'camera',
        Entertainment: 'musical-notes',
        'Decor & Floral': 'flower',
        Security: 'shield-checkmark',
        Celebrity: 'star',
        'Logistics & Support': 'car',
    };
    return (icons[category] || 'briefcase') as any;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionHeader({
    step,
    title,
    color,
    icon,
}: {
    step: number;
    title: string;
    color: string;
    icon: string;
}) {
    return (
        <View style={sh.root}>
            <View style={[sh.stepBadge, { backgroundColor: color }]}>
                <Text style={sh.stepNum}>{step}</Text>
            </View>
            <Ionicons name={icon as any} size={16} color={color} />
            <Text style={sh.title}>{title}</Text>
        </View>
    );
}

function ErrorMsg({ msg }: { msg: string }) {
    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                marginBottom: 6,
                marginLeft: 2,
            }}
        >
            <Ionicons name="alert-circle" size={13} color={Colors.danger} />
            <Text style={{ fontSize: 12, color: Colors.danger, fontWeight: Typography.semiBold }}>
                {msg}
            </Text>
        </View>
    );
}

// FIX 12: BreakdownRow did not accept an optional valueStyle prop — needed
// to render the discount row in green without duplicating the component.
function BreakdownRow({
    label,
    value,
    valueStyle,
}: {
    label: string;
    value: string;
    valueStyle?: object;
}) {
    return (
        <View style={s.breakdownRow}>
            <Text style={s.breakdownLabel}>{label}</Text>
            <Text style={[s.breakdownValue, valueStyle]}>{value}</Text>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const sh = StyleSheet.create({
    root: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: Spacing.sm,
        marginTop: Spacing.xl,
    },
    stepBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNum: { fontSize: 10, fontWeight: Typography.extraBold, color: Colors.white },
    title: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
    },
});

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },

    header: { backgroundColor: Colors.surface, paddingBottom: Spacing.lg, ...Shadows.header },
    headerAccent: { height: 4 },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: Radii.sm,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerEyebrow: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 1.5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },

    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        marginTop: Spacing.xl,
        ...Shadows.card,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    summaryIcon: {
        width: 50,
        height: 50,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    summaryTitle: { fontSize: 15, fontWeight: Typography.extraBold, color: Colors.charcoal },
    categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    summaryCategory: { fontSize: 11, fontWeight: Typography.semiBold },
    summaryLocation: { fontSize: 11, color: Colors.charcoalLight, marginTop: 3 },
    companyName: { fontSize: 11, color: Colors.charcoalLight, marginTop: 2 },
    verifiedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: Colors.successLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Radii.full,
    },
    verifiedChipText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.success },

    priceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        marginTop: Spacing.md,
        alignSelf: 'flex-start',
        borderWidth: 1,
    },
    priceBadgeLabel: { fontSize: 12, color: Colors.charcoalLight, fontWeight: Typography.medium },
    priceBadgeValue: { fontSize: 18, fontWeight: Typography.extraBold },
    priceBadgeSuffix: { fontSize: 12, color: Colors.charcoalLight, fontWeight: Typography.medium },

    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: Spacing.sm,
        marginTop: Spacing.xl,
        paddingHorizontal: 2,
    },
    stepBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNum: { fontSize: 10, fontWeight: Typography.extraBold, color: Colors.white },
    sectionHeaderTitle: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
    },
    selectedDateChip: {
        fontSize: 11,
        fontWeight: Typography.semiBold,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radii.full,
        borderWidth: 1,
        marginRight: 4,
    },

    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        ...Shadows.card,
        marginBottom: Spacing.sm,
    },

    calNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    calNavBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    calMonthLabel: { fontSize: 15, fontWeight: Typography.bold, color: Colors.charcoal },
    calDayRow: { flexDirection: 'row', marginBottom: 8 },
    calDayLabel: {
        flex: 1,
        textAlign: 'center',
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
    },
    calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    calCell: {
        width: `${100 / 7}%` as any,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Radii.sm,
        marginBottom: 2,
    },
    calCellDisabled: { opacity: 0.25 },
    calDayNum: { fontSize: 13, color: Colors.charcoal, fontWeight: Typography.medium },
    selectedDateStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        borderRadius: Radii.md,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        marginTop: 4,
    },
    selectedDateText: { fontSize: 13, fontWeight: Typography.bold },

    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 2,
        borderBottomColor: Colors.border,
        marginBottom: 4,
    },
    tableHeaderText: {
        fontSize: 10,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
        alignItems: 'center',
        borderRadius: Radii.sm,
    },
    tableCellName: { fontSize: 12, color: Colors.charcoal, fontWeight: Typography.semiBold },
    tableCellUnit: { fontSize: 10, color: Colors.charcoalLight, marginTop: 2 },
    tableCellPrice: { fontSize: 13, fontWeight: Typography.bold },
    tableCellAmount: { fontSize: 13, fontWeight: Typography.bold },
    qtyControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    qtyBtn: {
        width: 24,
        height: 24,
        borderRadius: 4,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyText: {
        fontSize: 13,
        fontWeight: Typography.medium,
        color: Colors.charcoal,
        minWidth: 16,
        textAlign: 'center',
    },
    tableSubtotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1.5,
    },
    tableSubtotalLabel: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    tableSubtotalValue: { fontSize: Typography.lg, fontWeight: Typography.extraBold },

    fieldLabel: {
        fontSize: 12,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
    },
    chipText: { fontSize: 12.5, color: Colors.charcoalMid, fontWeight: Typography.medium },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        paddingHorizontal: 14,
        height: 50,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    input: { flex: 1, fontSize: 14, color: Colors.charcoal },

    settingsLoader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: Spacing.md,
    },
    settingsLoaderText: { fontSize: 13, color: Colors.charcoalLight },

    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 7,
    },
    breakdownLabel: { fontSize: 13, color: Colors.charcoalLight, fontWeight: Typography.medium },
    breakdownValue: { fontSize: 13, color: Colors.charcoal, fontWeight: Typography.semiBold },
    totalLabel: { fontWeight: Typography.extraBold, color: Colors.charcoal, fontSize: 15 },
    totalValue: { fontWeight: Typography.extraBold, fontSize: 18 },
    breakdownDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
    couponInputRow: { flexDirection: 'row', gap: 10 },
    applyBtn: {
        paddingHorizontal: 20,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyBtnText: { fontSize: 14, fontWeight: Typography.bold },

    couponsCard: { gap: Spacing.sm, marginBottom: Spacing.sm },
    couponItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.card,
    },
    couponLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    couponCodeBadge: {
        backgroundColor: Colors.successLight,
        borderRadius: Radii.sm,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: Colors.success + '40',
        borderStyle: 'dashed',
    },
    couponCodeText: {
        fontSize: 12,
        fontWeight: Typography.extraBold,
        color: Colors.success,
        letterSpacing: 1,
    },
    couponDiscount: { fontSize: 13, fontWeight: Typography.bold, color: Colors.charcoal },
    couponDesc: { fontSize: 11, color: Colors.charcoalLight, marginTop: 1 },
    copyBtn: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: Radii.sm,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    copyBtnText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.charcoalMid },

    actionRow: { gap: Spacing.sm, marginTop: Spacing.lg },
    confirmBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderRadius: Radii.md,
        height: 58,
        ...Shadows.primary,
    },
    confirmText: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.2,
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: Radii.md,
        height: 48,
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    shareBtnText: { fontSize: 14, fontWeight: Typography.bold },
});

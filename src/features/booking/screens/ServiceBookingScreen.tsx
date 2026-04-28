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
const isPast = (d: Date) => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const check = new Date(d);
    check.setHours(0, 0, 0, 0);
    return check < t;
};

type Props = NativeStackScreenProps<RootStackParamList, 'serviceBooking'>;

export default function ServiceBookingScreen({ navigation, route }: Props) {
    const { service } = route.params as { service: VendorService };
    const alert = useAlert();
    const catColor = CAT_COLOR[service.category] ?? Colors.primary;
    const { user } = useAuthStore();
    const { mutate: createBooking } = useCreateServiceBooking();
    const { data: platformSettingData, isLoading: settingsLoading } = useServicePlatformSetting();
    const { mutate: createPaymentOrder } = useCreatePaymentOrder();
    const { mutate: verifyPaymentMutate } = useVerifyPayment();
    // ── Form state ────────────────────────────────────────────────────────────
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [startTime, setStartTime] = useState('');
    const [selectedPkg, setSelectedPkg] = useState<number | null>(null);
    const [guestCount, setGuestCount] = useState('');
    const [eventType, setEventType] = useState('');
    const [specialReq, setSpecialReq] = useState('');
    const [calYear, setCalYear] = useState(new Date().getFullYear());
    const [calMonth, setCalMonth] = useState(new Date().getMonth());
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [couponCode, setCouponCode] = useState('');

    // Quantity state for service items (from Services & Rate List)
    const [serviceQuantities, setServiceQuantities] = useState<Record<number, number>>({});

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

    // ── Calendar ──────────────────────────────────────────────────────────────
    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
    const monthName = new Date(calYear, calMonth).toLocaleString('en-IN', {
        month: 'long',
        year: 'numeric',
    });

    const prevMonth = () =>
        calMonth === 0 ? (setCalMonth(11), setCalYear(y => y - 1)) : setCalMonth(m => m - 1);
    const nextMonth = () =>
        calMonth === 11 ? (setCalMonth(0), setCalYear(y => y + 1)) : setCalMonth(m => m + 1);

    const calCells = Array.from({ length: firstDayOfWeek + daysInMonth }, (_, i) =>
        i < firstDayOfWeek ? null : i - firstDayOfWeek + 1,
    );

    const isSelected = (day: number) =>
        selectedDate?.getFullYear() === calYear &&
        selectedDate?.getMonth() === calMonth &&
        selectedDate?.getDate() === day;

    // ── Packages ──────────────────────────────────────────────────────────────
    const packages = service.packages ?? [];

    // ── Price breakdown using PlatformSettings ────────────────────────────────
    const breakdown = useMemo(() => {
        // Calculate base from selected package OR service items with quantities
        let base = 0;

        if (selectedPkg !== null) {
            // Package-based pricing
            const pkg = packages[selectedPkg];
            base = pkg?.price ?? (pkg as any)?.rate ?? 0;
        } else if (Object.keys(serviceQuantities).length > 0) {
            // Item-based pricing from Services & Rate List
            base = Object.entries(serviceQuantities).reduce((sum, [idx, qty]) => {
                const pkg = packages[parseInt(idx)];
                const price = pkg?.price ?? (pkg as any)?.rate ?? 0;
                return sum + price * qty;
            }, 0);
        } else {
            // Default to starting price
            base = service.startingPrice ?? 0;
        }

        const settings = platformSettingData;

        // Category-specific overrides (most specific)
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

        const total = base + serviceCGST + serviceSGST + platformFee + platformFeeGST;

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
            total,
        };
    }, [
        selectedPkg,
        serviceQuantities,
        packages,
        service.startingPrice,
        service.category,
        platformSettingData,
    ]);

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = () => {
        const e: Record<string, string> = {};
        if (!selectedDate) e.date = 'Please select a booking date';
        if (!eventType) e.eventType = 'Please select an event type';
        return e;
    };

    // ── Quantity handlers ─────────────────────────────────────────────────────
    const incrementQuantity = (index: number) => {
        setServiceQuantities(prev => ({
            ...prev,
            [index]: (prev[index] || 0) + 1,
        }));
    };

    const decrementQuantity = (index: number) => {
        setServiceQuantities(prev => {
            const newQty = Math.max(0, (prev[index] || 0) - 1);
            if (newQty === 0) {
                const { [index]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [index]: newQty };
        });
    };

    const handlePayment = useCallback(
        (bookingId: string): Promise<void> =>
            new Promise((resolve, reject) => {
                createPaymentOrder(
                    {
                        bookingId,
                        amount: breakdown.total,
                        bookingType: 'serivce',
                    },
                    {
                        onSuccess: async (orderData: any) => {
                            if (!orderData?.success) {
                                reject(new Error('Failed to create payment order'));
                                return;
                            }
                            try {
                                const options = {
                                    key: orderData.key ?? '',
                                    amount: orderData.order.amount,
                                    currency: orderData.order.currency ?? 'INR',
                                    name: 'RentalMeet',
                                    description: `Booking Payment - ${service.companyName}`,
                                    order_id: orderData.order.id,
                                    prefill: {
                                        name: user?.name,
                                        email: user?.email,
                                        contact: user?.phone,
                                    },
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
        [createPaymentOrder, verifyPaymentMutate, alert, breakdown, navigation],
    );
    // ── Submit ────────────────────────────────────────────────────────────────
    const handleBook = () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        if (!service._id) {
            alert.error('Missing Data', 'Service ID is missing.');
            return;
        }

        // Build items array from selected services
        const items: ServiceBooking['items'] = [];

        if (selectedPkg !== null) {
            // Single package selected
            const activePkg = packages[selectedPkg];
            const pkgName = activePkg?.name ?? (activePkg as any)?.serviceName ?? service.title;
            const pkgPrice =
                activePkg?.price ?? (activePkg as any)?.rate ?? service.startingPrice ?? 0;
            const pkgUnit = activePkg?.unit;

            items.push({
                name: pkgName,
                price: pkgPrice,
                unit: pkgUnit,
                quantity: 1,
                amount: pkgPrice,
            });
        } else if (Object.keys(serviceQuantities).length > 0) {
            // Multiple service items
            Object.entries(serviceQuantities).forEach(([idx, qty]) => {
                const pkg = packages[parseInt(idx)];
                const pkgName =
                    pkg?.name ?? (pkg as any)?.serviceName ?? `Service ${parseInt(idx) + 1}`;
                const pkgPrice = pkg?.price ?? (pkg as any)?.rate ?? 0;
                const pkgUnit = pkg?.unit;

                items.push({
                    name: pkgName,
                    price: pkgPrice,
                    unit: pkgUnit,
                    quantity: qty,
                    amount: pkgPrice * qty,
                });
            });
        } else {
            // Default single item
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

            // All fee / tax values come from platform settings via `breakdown`
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

            // Add coupon if entered
            ...(couponCode && {
                coupon: {
                    code: couponCode,
                },
            }),
        };

        setLoading(true);
        createBooking(payload, {
            onSuccess: async(response) => {
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
                setLoading(false);
                navigation.goBack();
            },
            onError: (err: ApiError) => {
                setLoading(false);
                alert.error('Booking Failed', err?.message || 'Something went wrong.');
            },
        });
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
                                <Ionicons name="restaurant-outline" size={22} color={catColor} />
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
                                        <Ionicons
                                            name="location-outline"
                                            size={11}
                                            color={Colors.charcoalLight}
                                        />{' '}
                                        {[service.city, service.state].filter(Boolean).join(', ')}
                                    </Text>
                                )}
                                {service.companyName && (
                                    <Text style={s.companyName}>
                                        <Ionicons
                                            name="business-outline"
                                            size={11}
                                            color={Colors.charcoalLight}
                                        />{' '}
                                        {service.companyName}
                                    </Text>
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

                        {/* Starting Price Badge */}
                        <View style={s.priceBadge}>
                            <Text style={s.priceBadgeLabel}>Starting from</Text>
                            <Text style={[s.priceBadgeValue, { color: catColor }]}>
                                {fmtPrice(service.startingPrice ?? 0)}
                            </Text>
                            <Text style={s.priceBadgeSuffix}>onwards</Text>
                        </View>

                        {/* ── Date & Time Selection ── */}
                        <SectionHeader
                            step={1}
                            title="Select Date & Time"
                            color={catColor}
                            icon="calendar-outline"
                        />
                        {!!errors.date && <ErrorMsg msg={errors.date} />}

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
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                    <Text key={i} style={s.calDayLabel}>
                                        {d}
                                    </Text>
                                ))}
                            </View>

                            {/* Date grid */}
                            <View style={s.calGrid}>
                                {calCells.map((day, idx) => {
                                    if (!day) return <View key={idx} style={s.calCell} />;
                                    const past = isPast(new Date(calYear, calMonth, day));
                                    const sel = isSelected(day);
                                    return (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[
                                                s.calCell,
                                                sel && { backgroundColor: catColor },
                                                past && s.calCellDisabled,
                                            ]}
                                            onPress={() => {
                                                if (!past) {
                                                    setSelectedDate(
                                                        new Date(calYear, calMonth, day),
                                                    );
                                                    setErrors(p => ({ ...p, date: '' }));
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
                                                    past && { color: Colors.charcoal },
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
                                    <Ionicons name="checkmark-circle" size={15} color={catColor} />
                                    <Text style={[s.selectedDateText, { color: catColor }]}>
                                        Selected: {fmtDate(selectedDate)}
                                    </Text>
                                </View>
                            )}

                            {/* Start Time */}
                            <Text style={[s.fieldLabel, { marginTop: Spacing.md }]}>
                                Start Time
                            </Text>
                            <View style={s.inputWrap}>
                                <Ionicons
                                    name="time-outline"
                                    size={16}
                                    color={Colors.charcoalLight}
                                />
                                <TextInput
                                    style={s.input}
                                    placeholder="Select date first"
                                    placeholderTextColor={Colors.charcoalLight}
                                    value={startTime}
                                    onChangeText={setStartTime}
                                    editable={!!selectedDate}
                                />
                            </View>
                        </View>

                        {/* ── Services & Rate List ── */}
                        {packages.length > 0 && (
                            <>
                                <SectionHeader
                                    step={2}
                                    title="Services & Rate List"
                                    color={catColor}
                                    icon="list-outline"
                                />
                                <View style={s.card}>
                                    {/* Table Header */}
                                    <View style={s.tableHeader}>
                                        <Text style={[s.tableHeaderText, { flex: 2 }]}>
                                            Service
                                        </Text>
                                        <Text style={[s.tableHeaderText, { flex: 1 }]}>Rate</Text>
                                        <Text style={[s.tableHeaderText, { flex: 1 }]}>Unit</Text>
                                        <Text style={[s.tableHeaderText, { flex: 1.2 }]}>Qty</Text>
                                        <Text
                                            style={[
                                                s.tableHeaderText,
                                                { flex: 1, textAlign: 'right' },
                                            ]}
                                        >
                                            Amount
                                        </Text>
                                    </View>

                                    {/* Table Rows */}
                                    {packages.map((pkg, i) => {
                                        const name =
                                            pkg.name ??
                                            (pkg as any).serviceName ??
                                            `Service ${i + 1}`;
                                        const price = pkg.price ?? (pkg as any).rate ?? 0;
                                        const unit = pkg.unit ?? 'Per Person';
                                        const qty = serviceQuantities[i] || 0;
                                        const amount = price * qty;

                                        return (
                                            <View key={i} style={s.tableRow}>
                                                <Text
                                                    style={[s.tableCellText, { flex: 2 }]}
                                                    numberOfLines={2}
                                                >
                                                    {name}
                                                </Text>
                                                <Text style={[s.tableCellPrice, { flex: 1 }]}>
                                                    {fmtPrice(price)}
                                                </Text>
                                                <Text
                                                    style={[
                                                        s.tableCellText,
                                                        { flex: 1, fontSize: 11 },
                                                    ]}
                                                >
                                                    {unit}
                                                </Text>
                                                <View style={[s.qtyControl, { flex: 1.2 }]}>
                                                    <TouchableOpacity
                                                        style={s.qtyBtn}
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
                                                    <Text style={s.qtyText}>{qty}</Text>
                                                    <TouchableOpacity
                                                        style={s.qtyBtn}
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
                                                        { flex: 1, textAlign: 'right' },
                                                    ]}
                                                >
                                                    {qty > 0 ? fmtPrice(amount) : '—'}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </>
                        )}

                        {/* ── Event Details ── */}
                        <SectionHeader
                            step={packages.length > 0 ? 3 : 2}
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

                        {/* ── Price Summary ── */}
                        <SectionHeader
                            step={packages.length > 0 ? 4 : 3}
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

                                    {/* Coupon Code */}
                                    <View style={s.couponRow}>
                                        <View style={[s.inputWrap, { flex: 1 }]}>
                                            <Ionicons
                                                name="ticket-outline"
                                                size={16}
                                                color={Colors.charcoalLight}
                                            />
                                            <TextInput
                                                style={s.input}
                                                placeholder="COUPON CODE"
                                                placeholderTextColor={Colors.charcoalLight}
                                                value={couponCode}
                                                onChangeText={setCouponCode}
                                                autoCapitalize="characters"
                                            />
                                        </View>
                                        <TouchableOpacity
                                            style={[
                                                s.applyBtn,
                                                { backgroundColor: catColor + '20' },
                                            ]}
                                            onPress={() => {
                                                // Handle coupon validation
                                                alert.info(
                                                    'Coupon',
                                                    'Coupon validation coming soon!',
                                                );
                                            }}
                                        >
                                            <Text style={[s.applyBtnText, { color: catColor }]}>
                                                Apply
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={s.minOrderNote}>Minimum order: ₹3,000</Text>
                                </>
                            )}
                        </View>

                        {/* ── Action Buttons ── */}
                        <View style={s.actionRow}>
                            <TouchableOpacity
                                style={[
                                    s.confirmBtn,
                                    { backgroundColor: catColor },
                                    loading && { opacity: 0.7 },
                                ]}
                                onPress={handleBook}
                                disabled={loading || settingsLoading}
                                activeOpacity={0.88}
                            >
                                {loading ? (
                                    <LoadingDots />
                                ) : (
                                    <Text style={s.confirmText}>Select a Date First</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={s.shareBtn} activeOpacity={0.8}>
                                <Ionicons name="share-outline" size={18} color={catColor} />
                                <Text style={[s.shareBtnText, { color: catColor }]}>
                                    Share Service
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Available Coupons */}
                        <View style={s.couponsCard}>
                            <View style={s.couponsHeader}>
                                <Ionicons name="pricetag" size={16} color={Colors.success} />
                                <Text style={s.couponsTitle}>Available Coupons</Text>
                            </View>
                            <View style={s.couponItem}>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.couponCode}>ADMIN20</Text>
                                    <Text style={s.couponDiscount}>20% off</Text>
                                </View>
                                <TouchableOpacity
                                    style={s.copyBtn}
                                    onPress={() => {
                                        setCouponCode('ADMIN20');
                                        alert.success('Copied!', 'Coupon code copied');
                                    }}
                                >
                                    <Text style={s.copyBtnText}>Copy</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{ height: 40 }} />
                    </Animated.View>
                </ScrollView>
            </View>
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

function BreakdownRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={s.breakdownRow}>
            <Text style={s.breakdownLabel}>{label}</Text>
            <Text style={s.breakdownValue}>{value}</Text>
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
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
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
        borderColor: Colors.border,
    },
    priceBadgeLabel: {
        fontSize: 12,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    priceBadgeValue: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
    },
    priceBadgeSuffix: {
        fontSize: 12,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
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
    calCellDisabled: { opacity: 0.3 },
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

    // Table styles
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 2,
        borderBottomColor: Colors.border,
        marginBottom: 8,
    },
    tableHeaderText: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border + '50',
        alignItems: 'center',
    },
    tableCellText: {
        fontSize: 12,
        color: Colors.charcoal,
        fontWeight: Typography.medium,
    },
    tableCellPrice: {
        fontSize: 13,
        color: '#E67E22',
        fontWeight: Typography.bold,
    },
    tableCellAmount: {
        fontSize: 13,
        color: Colors.charcoal,
        fontWeight: Typography.bold,
    },
    qtyControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
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
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        minWidth: 20,
        textAlign: 'center',
    },

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

    couponRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    applyBtn: {
        paddingHorizontal: 20,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyBtnText: {
        fontSize: 14,
        fontWeight: Typography.bold,
    },
    minOrderNote: {
        fontSize: 11,
        color: Colors.charcoalLight,
        marginTop: 8,
        textAlign: 'center',
    },

    actionRow: {
        gap: Spacing.sm,
        marginTop: Spacing.lg,
    },
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
    shareBtnText: {
        fontSize: 14,
        fontWeight: Typography.bold,
    },

    couponsCard: {
        backgroundColor: Colors.successLight,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        marginTop: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.success + '30',
    },
    couponsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: Spacing.md,
    },
    couponsTitle: {
        fontSize: 14,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    couponItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: Spacing.md,
    },
    couponCode: {
        fontSize: 14,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
    couponDiscount: {
        fontSize: 12,
        color: Colors.charcoalLight,
        marginTop: 2,
    },
    copyBtn: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: Radii.sm,
        borderWidth: 1.5,
        borderColor: Colors.success,
    },
    copyBtnText: {
        fontSize: 12,
        fontWeight: Typography.bold,
        color: Colors.success,
    },
});

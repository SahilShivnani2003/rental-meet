import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
    Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radii, Shadows } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import LoadingDots from '@/components/UI/loading-dots';
import { useAlert } from '@/context/AlertContext';
import { useCreateServiceBooking } from '@/features/services/hooks/useCreateServiceBooking';
import { ApiError } from '@/types/ApiError';
import { VendorService } from '@/features/otherService/types/VendorService';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { VendorTabParamList } from '@/navigations/tabNavigations/VendorTabNavigation';

const { width: W } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPrice = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

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

// Simple inline calendar helpers
const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const isPast = (d: Date) => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d < t;
};

type Props = NativeBottomTabScreenProps<VendorTabParamList, 'booking'>

export default function ServiceBookingScreen({ navigation, route }: Props) {
    const { service } = route.params as { service: VendorService };
    const alert = useAlert();
    const catColor = CAT_COLOR[service.category] ?? Colors.primary;

    const { mutate: createBooking } = useCreateServiceBooking();

    // ── Form state ────────────────────────────────────────────────────────────
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedPkg, setSelectedPkg] = useState<number | null>(null);
    const [guestCount, setGuestCount] = useState('');
    const [eventType, setEventType] = useState('');
    const [specialReq, setSpecialReq] = useState('');
    const [calYear, setCalYear] = useState(new Date().getFullYear());
    const [calMonth, setCalMonth] = useState(new Date().getMonth());
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

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

    // ── Package selection ─────────────────────────────────────────────────────
    const packages = service.packages ?? [];

    // ── Price breakdown ───────────────────────────────────────────────────────
    const breakdown = useMemo(() => {
        const base =
            selectedPkg !== null
                ? (packages[selectedPkg] as any)?.price ?? (packages[selectedPkg] as any)?.rate ?? 0
                : service.startingPrice ?? 0;
        const plat = Math.round(base * 0.05);
        const gst = Math.round(base * 0.18);
        return { base, plat, gst, total: base + plat + gst };
    }, [selectedPkg, service.startingPrice, packages]);

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = () => {
        const e: Record<string, string> = {};
        if (!selectedDate) e.date = 'Please select a booking date';
        if (!eventType) e.eventType = 'Please select an event type';
        return e;
    };

    const handleBook = () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        const payload = {
            serviceId: service._id,
            vendor: service.vendor,
            bookingDate: selectedDate!.toISOString(),
            selectedPackageIdx: selectedPkg ?? undefined,
            guestCount: guestCount ? parseInt(guestCount, 10) : undefined,
            eventType,
            specialRequirements: specialReq || undefined,
            amount: breakdown.total,
        };

        setLoading(true);
        createBooking(payload, {
            onSuccess: () => {
                setLoading(false);
                alert.success(
                    'Booking Requested!',
                    'The vendor will confirm your booking shortly.',
                );
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
                            <Text style={s.headerEyebrow}>BOOK SERVICE</Text>
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
                        {/* Service summary */}
                        <View style={s.summaryCard}>
                            <View style={[s.summaryIcon, { backgroundColor: catColor + '18' }]}>
                                <Ionicons name="business-outline" size={22} color={catColor} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.summaryTitle} numberOfLines={1}>
                                    {service.title}
                                </Text>
                                <Text style={s.summaryCategory}>{service.category}</Text>
                                {service.city || service.state ? (
                                    <Text style={s.summaryLocation}>
                                        <Ionicons
                                            name="location-outline"
                                            size={11}
                                            color={Colors.charcoalLight}
                                        />{' '}
                                        {[service.city, service.state].filter(Boolean).join(', ')}
                                    </Text>
                                ) : null}
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

                        {/* ── Step 1: Date ── */}
                        <SectionHeader
                            step={1}
                            title="Select Date"
                            color={catColor}
                            icon="calendar-outline"
                        />
                        {!!errors.date && <ErrorMsg msg={errors.date} />}

                        <View style={s.card}>
                            {/* Month nav */}
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
                            {/* Grid */}
                            <View style={s.calGrid}>
                                {calCells.map((day, idx) => {
                                    if (!day) return <View key={idx} style={s.calCell} />;
                                    const d = new Date(calYear, calMonth, day);
                                    const past = isPast(new Date(d));
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
                                                    past && { color: Colors.border },
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
                        </View>

                        {/* ── Step 2: Package ── */}
                        {packages.length > 0 && (
                            <>
                                <SectionHeader
                                    step={2}
                                    title="Select Package"
                                    color={catColor}
                                    icon="pricetag-outline"
                                />
                                {packages.map((pkg, i) => {
                                    const name =
                                        (pkg as any).name ??
                                        (pkg as any).serviceName ??
                                        `Package ${i + 1}`;
                                    const price = (pkg as any).price ?? (pkg as any).rate ?? 0;
                                    const unit = (pkg as any).unit;
                                    const active = selectedPkg === i;
                                    return (
                                        <TouchableOpacity
                                            key={i}
                                            style={[
                                                s.pkgCard,
                                                active && {
                                                    borderColor: catColor,
                                                    backgroundColor: catColor + '08',
                                                },
                                            ]}
                                            onPress={() => setSelectedPkg(active ? null : i)}
                                            activeOpacity={0.8}
                                        >
                                            <View
                                                style={[
                                                    s.pkgRadio,
                                                    active && { borderColor: catColor },
                                                ]}
                                            >
                                                {active && (
                                                    <View
                                                        style={[
                                                            s.pkgRadioDot,
                                                            { backgroundColor: catColor },
                                                        ]}
                                                    />
                                                )}
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text
                                                    style={[
                                                        s.pkgName,
                                                        active && { color: catColor },
                                                    ]}
                                                >
                                                    {name}
                                                </Text>
                                                {unit && <Text style={s.pkgUnit}>Per {unit}</Text>}
                                            </View>
                                            <Text style={[s.pkgPrice, { color: catColor }]}>
                                                {fmtPrice(price)}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </>
                        )}

                        {/* ── Step 3: Event details ── */}
                        <SectionHeader
                            step={packages.length > 0 ? 3 : 2}
                            title="Event Details"
                            color={catColor}
                            icon="information-circle-outline"
                        />
                        {!!errors.eventType && <ErrorMsg msg={errors.eventType} />}

                        <View style={s.card}>
                            {/* Event type chips */}
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

                            {/* Guest count */}
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

                            {/* Special requirements */}
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

                        {/* ── Price breakdown ── */}
                        <SectionHeader
                            step={packages.length > 0 ? 4 : 3}
                            title="Price Summary"
                            color={catColor}
                            icon="receipt-outline"
                        />

                        <View style={s.card}>
                            <View style={s.breakdownRow}>
                                <Text style={s.breakdownLabel}>Base Price</Text>
                                <Text style={s.breakdownValue}>{fmtPrice(breakdown.base)}</Text>
                            </View>
                            <View style={s.breakdownRow}>
                                <Text style={s.breakdownLabel}>Platform Fee (5%)</Text>
                                <Text style={s.breakdownValue}>{fmtPrice(breakdown.plat)}</Text>
                            </View>
                            <View style={s.breakdownRow}>
                                <Text style={s.breakdownLabel}>GST (18%)</Text>
                                <Text style={s.breakdownValue}>{fmtPrice(breakdown.gst)}</Text>
                            </View>
                            <View style={s.breakdownDivider} />
                            <View style={s.breakdownRow}>
                                <Text
                                    style={[
                                        s.breakdownLabel,
                                        {
                                            fontWeight: Typography.extraBold,
                                            color: Colors.charcoal,
                                            fontSize: 15,
                                        },
                                    ]}
                                >
                                    Total
                                </Text>
                                <Text
                                    style={[
                                        s.breakdownValue,
                                        {
                                            fontWeight: Typography.extraBold,
                                            color: catColor,
                                            fontSize: 18,
                                        },
                                    ]}
                                >
                                    {fmtPrice(breakdown.total)}
                                </Text>
                            </View>
                            <View style={s.noteRow}>
                                <Ionicons
                                    name="information-circle-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.noteText}>
                                    Payment will be collected after vendor confirmation.
                                </Text>
                            </View>
                        </View>

                        {/* Confirm */}
                        <TouchableOpacity
                            style={[
                                s.confirmBtn,
                                { backgroundColor: catColor },
                                loading && { opacity: 0.7 },
                            ]}
                            onPress={handleBook}
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
                                        color={Colors.white}
                                    />
                                    <Text style={s.confirmText}>Confirm Booking</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <View style={{ height: 40 }} />
                    </Animated.View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

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
    summaryCategory: { fontSize: 12, color: Colors.charcoalLight, marginTop: 1 },
    summaryLocation: { fontSize: 11, color: Colors.charcoalLight, marginTop: 2 },
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
        marginTop: 12,
    },
    selectedDateText: { fontSize: 13, fontWeight: Typography.bold },

    pkgCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
        borderWidth: 1.5,
        borderColor: Colors.border,
        ...Shadows.card,
    },
    pkgRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    pkgRadioDot: { width: 10, height: 10, borderRadius: 5 },
    pkgName: { fontSize: 14, fontWeight: Typography.bold, color: Colors.charcoal },
    pkgUnit: { fontSize: 11, color: Colors.charcoalLight, marginTop: 2 },
    pkgPrice: { fontSize: 16, fontWeight: Typography.extraBold },

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

    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    breakdownLabel: { fontSize: 13, color: Colors.charcoalLight, fontWeight: Typography.medium },
    breakdownValue: { fontSize: 14, color: Colors.charcoal, fontWeight: Typography.semiBold },
    breakdownDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 6 },
    noteRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    noteText: { flex: 1, fontSize: 11.5, color: Colors.charcoalLight, lineHeight: 16 },

    confirmBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderRadius: Radii.md,
        height: 58,
        marginTop: Spacing.xl,
        ...Shadows.primary,
    },
    confirmText: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.2,
    },
});

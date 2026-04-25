import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radii, Shadows } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import LoadingDots from '@/components/UI/loading-dots';
import { useAlert } from '@/context/AlertContext';
import { useSendQuotationRequest } from '@/features/services/hooks/useSendQuotationRequest';
import { ApiError } from '@/types/ApiError';
import { VendorService } from '@/features/otherService/types/VendorService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

const BUDGET_RANGES = [
    { label: 'Under ₹10K', value: '0-10000' },
    { label: '₹10K – ₹50K', value: '10000-50000' },
    { label: '₹50K – ₹1L', value: '50000-100000' },
    { label: '₹1L – ₹5L', value: '100000-500000' },
    { label: '₹5L+', value: '500000+' },
];

// Simple date helpers
const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const isPast = (d: Date) => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d < t;
};

type Props = NativeStackScreenProps<RootStackParamList, 'getQuotation'>;

export default function GetQuotationScreen({ navigation, route }: Props) {
    const { service } = route.params as { service: VendorService };
    const alert = useAlert();
    const catColor = CAT_COLOR[service.category] ?? Colors.primary;

    const { mutate: sendQuotation } = useSendQuotationRequest();

    // ── Form state ────────────────────────────────────────────────────────────
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [eventType, setEventType] = useState('');
    const [guestCount, setGuestCount] = useState('');
    const [budgetRange, setBudgetRange] = useState('');
    const [message, setMessage] = useState('');
    const [eventDate, setEventDate] = useState<Date | null>(null);
    const [calYear, setCalYear] = useState(new Date().getFullYear());
    const [calMonth, setCalMonth] = useState(new Date().getMonth());
    const [showCalendar, setShowCalendar] = useState(false);
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

    // ── Calendar helpers ──────────────────────────────────────────────────────
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
        eventDate?.getFullYear() === calYear &&
        eventDate?.getMonth() === calMonth &&
        eventDate?.getDate() === day;

    const fmtDate = (d: Date) =>
        d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const clearError = (key: string) => setErrors(prev => ({ ...prev, [key]: '' }));

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = () => {
        const e: Record<string, string> = {};
        if (!fullName.trim()) e.fullName = 'Your name is required';
        if (!email.trim()) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
        if (!phone.trim()) e.phone = 'Phone number is required';
        else if (phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid 10-digit number';
        if (!eventType) e.eventType = 'Please select an event type';
        if (!message.trim()) e.message = 'Please describe your requirements';
        return e;
    };

    const handleSubmit = () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        const payload = {
            serviceId: service._id,
            vendor: service.vendor,
            fullName,
            email,
            phone,
            eventType,
            eventDate: eventDate?.toISOString(),
            guestCount: guestCount ? parseInt(guestCount, 10) : undefined,
            budgetRange: budgetRange || undefined,
            message,
        };

        setLoading(true);
        sendQuotation(payload, {
            onSuccess: () => {
                setLoading(false);
                alert.success(
                    'Quotation Sent!',
                    'The vendor will get back to you shortly with a custom quote.',
                );
                navigation.goBack();
            },
            onError: (err: ApiError) => {
                setLoading(false);
                alert.error('Request Failed', err?.message || 'Something went wrong.');
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
                            <Text style={s.headerEyebrow}>GET QUOTATION</Text>
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
                        {/* Intro banner */}
                        <View
                            style={[
                                s.introBanner,
                                { backgroundColor: catColor + '14', borderColor: catColor + '30' },
                            ]}
                        >
                            <View style={[s.introIconCircle, { backgroundColor: catColor + '22' }]}>
                                <Ionicons name="document-text" size={22} color={catColor} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[s.introTitle, { color: catColor }]}>
                                    Request a Custom Quote
                                </Text>
                                <Text style={s.introSub}>
                                    Fill in your event details and get a personalised quotation from
                                    the vendor within 24 hours.
                                </Text>
                            </View>
                        </View>

                        {/* Service chip */}
                        <View style={s.serviceChip}>
                            <View style={[s.serviceChipDot, { backgroundColor: catColor }]} />
                            <Text style={s.serviceChipText}>
                                {service.category} · {service.title}
                            </Text>
                        </View>

                        {/* ── Section: Your Contact Info ── */}
                        <FormSection
                            title="Your Contact Info"
                            icon="person-outline"
                            color={catColor}
                        >
                            <FormField label="Full Name *" error={errors.fullName}>
                                <FieldInput
                                    icon="person-outline"
                                    placeholder="Sara Patel"
                                    value={fullName}
                                    onChangeText={t => {
                                        setFullName(t);
                                        clearError('fullName');
                                    }}
                                    autoCapitalize="words"
                                    error={!!errors.fullName}
                                />
                            </FormField>

                            <FormField label="Email Address *" error={errors.email}>
                                <FieldInput
                                    icon="mail-outline"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChangeText={t => {
                                        setEmail(t);
                                        clearError('email');
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    error={!!errors.email}
                                />
                            </FormField>

                            <FormField label="Phone Number *" error={errors.phone}>
                                <FieldInput
                                    icon="call-outline"
                                    placeholder="+91 98765 43210"
                                    value={phone}
                                    onChangeText={t => {
                                        setPhone(t.replace(/[^\d\s+\-()]/g, ''));
                                        clearError('phone');
                                    }}
                                    keyboardType="phone-pad"
                                    maxLength={13}
                                    error={!!errors.phone}
                                />
                            </FormField>
                        </FormSection>

                        {/* ── Section: Event Details ── */}
                        <FormSection title="Event Details" icon="calendar-outline" color={catColor}>
                            {/* Event type chips */}
                            <FormField label="Event Type *" error={errors.eventType}>
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
                                                    clearError('eventType');
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                {active && (
                                                    <Ionicons
                                                        name="checkmark"
                                                        size={11}
                                                        color={Colors.white}
                                                    />
                                                )}
                                                <Text
                                                    style={[
                                                        s.chipText,
                                                        active && {
                                                            color: Colors.white,
                                                            fontWeight: Typography.bold,
                                                        },
                                                    ]}
                                                >
                                                    {et}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </FormField>

                            {/* Event date */}
                            <FormField label="Event Date (Optional)">
                                <TouchableOpacity
                                    style={[
                                        s.datePickerBtn,
                                        showCalendar && { borderColor: catColor, borderWidth: 1.5 },
                                    ]}
                                    onPress={() => setShowCalendar(p => !p)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name="calendar-outline"
                                        size={16}
                                        color={eventDate ? catColor : Colors.charcoalLight}
                                    />
                                    <Text
                                        style={[
                                            s.datePickerText,
                                            eventDate && {
                                                color: Colors.charcoal,
                                                fontWeight: Typography.semiBold,
                                            },
                                        ]}
                                    >
                                        {eventDate ? fmtDate(eventDate) : 'Select event date'}
                                    </Text>
                                    {eventDate ? (
                                        <TouchableOpacity onPress={() => setEventDate(null)}>
                                            <Ionicons
                                                name="close-circle"
                                                size={16}
                                                color={Colors.charcoalLight}
                                            />
                                        </TouchableOpacity>
                                    ) : (
                                        <Ionicons
                                            name={showCalendar ? 'chevron-up' : 'chevron-down'}
                                            size={14}
                                            color={Colors.charcoalLight}
                                        />
                                    )}
                                </TouchableOpacity>

                                {/* Inline calendar */}
                                {showCalendar && (
                                    <View style={s.inlineCal}>
                                        <View style={s.calNav}>
                                            <TouchableOpacity
                                                style={s.calNavBtn}
                                                onPress={prevMonth}
                                            >
                                                <Ionicons
                                                    name="chevron-back"
                                                    size={16}
                                                    color={Colors.charcoal}
                                                />
                                            </TouchableOpacity>
                                            <Text style={s.calMonthLabel}>{monthName}</Text>
                                            <TouchableOpacity
                                                style={s.calNavBtn}
                                                onPress={nextMonth}
                                            >
                                                <Ionicons
                                                    name="chevron-forward"
                                                    size={16}
                                                    color={Colors.charcoal}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                        <View style={s.calDayRow}>
                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                                <Text key={i} style={s.calDayLabel}>
                                                    {d}
                                                </Text>
                                            ))}
                                        </View>
                                        <View style={s.calGrid}>
                                            {calCells.map((day, idx) => {
                                                if (!day)
                                                    return <View key={idx} style={s.calCell} />;
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
                                                                setEventDate(
                                                                    new Date(
                                                                        calYear,
                                                                        calMonth,
                                                                        day,
                                                                    ),
                                                                );
                                                                setShowCalendar(false);
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
                                                                    fontWeight:
                                                                        Typography.extraBold,
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
                                    </View>
                                )}
                            </FormField>

                            {/* Guest count */}
                            <FormField label="Expected Guest Count">
                                <FieldInput
                                    icon="people-outline"
                                    placeholder="e.g. 150"
                                    value={guestCount}
                                    onChangeText={t => setGuestCount(t.replace(/\D/g, ''))}
                                    keyboardType="numeric"
                                />
                            </FormField>
                        </FormSection>

                        {/* ── Section: Budget & Requirements ── */}
                        <FormSection
                            title="Budget & Requirements"
                            icon="cash-outline"
                            color={catColor}
                        >
                            {/* Budget range */}
                            <FormField label="Approximate Budget">
                                <View style={s.chipGrid}>
                                    {BUDGET_RANGES.map(br => {
                                        const active = budgetRange === br.value;
                                        return (
                                            <TouchableOpacity
                                                key={br.value}
                                                style={[
                                                    s.chip,
                                                    active && {
                                                        backgroundColor: catColor,
                                                        borderColor: catColor,
                                                    },
                                                ]}
                                                onPress={() =>
                                                    setBudgetRange(active ? '' : br.value)
                                                }
                                                activeOpacity={0.8}
                                            >
                                                <Text
                                                    style={[
                                                        s.chipText,
                                                        active && {
                                                            color: Colors.white,
                                                            fontWeight: Typography.bold,
                                                        },
                                                    ]}
                                                >
                                                    {br.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </FormField>

                            {/* Requirements message */}
                            <FormField label="Describe Your Requirements *" error={errors.message}>
                                <View
                                    style={[
                                        s.textAreaWrap,
                                        !!errors.message && { borderColor: Colors.danger },
                                    ]}
                                >
                                    <TextInput
                                        style={s.textArea}
                                        placeholder={`Tell the vendor exactly what you need for your ${
                                            eventType || 'event'
                                        }...\n\nE.g. menu preferences, number of courses, dietary restrictions, equipment needed, etc.`}
                                        placeholderTextColor={Colors.charcoalLight}
                                        value={message}
                                        onChangeText={t => {
                                            setMessage(t);
                                            clearError('message');
                                        }}
                                        multiline
                                        textAlignVertical="top"
                                    />
                                    <Text style={s.charCount}>{message.length} chars</Text>
                                </View>
                            </FormField>
                        </FormSection>

                        {/* What happens next */}
                        <View
                            style={[
                                s.nextStepsCard,
                                { borderColor: catColor + '30', backgroundColor: catColor + '08' },
                            ]}
                        >
                            <Text style={[s.nextStepsTitle, { color: catColor }]}>
                                What happens next?
                            </Text>
                            {[
                                {
                                    icon: 'send-outline',
                                    text: 'Your quotation request is sent to the vendor instantly.',
                                },
                                {
                                    icon: 'chatbubble-ellipses-outline',
                                    text: 'Vendor reviews and replies with a custom quote within 24h.',
                                },
                                {
                                    icon: 'checkmark-done-circle-outline',
                                    text: 'You review the quote and confirm your booking.',
                                },
                            ].map((step, i) => (
                                <View key={i} style={s.nextStep}>
                                    <View
                                        style={[
                                            s.nextStepIcon,
                                            { backgroundColor: catColor + '20' },
                                        ]}
                                    >
                                        <Ionicons
                                            name={step.icon as any}
                                            size={14}
                                            color={catColor}
                                        />
                                    </View>
                                    <Text style={s.nextStepText}>{step.text}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Submit */}
                        <TouchableOpacity
                            style={[
                                s.submitBtn,
                                { backgroundColor: catColor },
                                loading && { opacity: 0.7 },
                            ]}
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.88}
                        >
                            {loading ? (
                                <LoadingDots />
                            ) : (
                                <>
                                    <Ionicons name="paper-plane" size={18} color={Colors.white} />
                                    <Text style={s.submitText}>Send Quotation Request</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={s.privacyNote}>
                            Your contact details are shared only with this vendor and kept
                            confidential.
                        </Text>

                        <View style={{ height: 40 }} />
                    </Animated.View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FormSection({
    title,
    icon,
    color,
    children,
}: {
    title: string;
    icon: string;
    color: string;
    children: React.ReactNode;
}) {
    return (
        <View style={ss.root}>
            <View style={ss.header}>
                <View style={[ss.iconWrap, { backgroundColor: color + '18' }]}>
                    <Ionicons name={icon as any} size={16} color={color} />
                </View>
                <Text style={ss.title}>{title}</Text>
            </View>
            <View style={ss.card}>{children}</View>
        </View>
    );
}
const ss = StyleSheet.create({
    root: { marginBottom: Spacing.lg },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: Radii.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: { fontSize: 15, fontWeight: Typography.extraBold, color: Colors.charcoal },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        gap: Spacing.md,
        ...Shadows.card,
    },
});

function FormField({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <View style={ff.root}>
            <Text style={ff.label}>{label}</Text>
            {children}
            {!!error && (
                <View style={ff.errorRow}>
                    <Ionicons name="alert-circle" size={12} color={Colors.danger} />
                    <Text style={ff.errorText}>{error}</Text>
                </View>
            )}
        </View>
    );
}
const ff = StyleSheet.create({
    root: {},
    label: {
        fontSize: 12,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 0.7,
        marginBottom: 7,
    },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
    errorText: { fontSize: 11, color: Colors.danger, fontWeight: Typography.semiBold },
});

function FieldInput({ icon, error, ...props }: any) {
    return (
        <View style={[fi.wrap, !!error && { borderColor: Colors.danger }]}>
            <Ionicons name={icon} size={16} color={Colors.charcoalLight} />
            <TextInput style={fi.input} placeholderTextColor={Colors.charcoalLight} {...props} />
        </View>
    );
}
const fi = StyleSheet.create({
    wrap: {
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
});

// ─── Main styles ──────────────────────────────────────────────────────────────
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

    introBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        marginTop: Spacing.xl,
        marginBottom: Spacing.md,
    },
    introIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    introTitle: { fontSize: 14, fontWeight: Typography.extraBold, marginBottom: 4 },
    introSub: { fontSize: 12, color: Colors.charcoalMid, lineHeight: 18 },

    serviceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        alignSelf: 'flex-start',
        backgroundColor: Colors.surface,
        borderRadius: Radii.full,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.lg,
        ...Shadows.card,
    },
    serviceChipDot: { width: 8, height: 8, borderRadius: 4 },
    serviceChipText: { fontSize: 12, fontWeight: Typography.semiBold, color: Colors.charcoalMid },

    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
    },
    chipText: { fontSize: 12.5, color: Colors.charcoalMid, fontWeight: Typography.medium },

    datePickerBtn: {
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
    datePickerText: { flex: 1, fontSize: 14, color: Colors.charcoalLight },

    inlineCal: {
        backgroundColor: Colors.background,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        marginTop: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    calNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    calNavBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    calMonthLabel: { fontSize: 14, fontWeight: Typography.bold, color: Colors.charcoal },
    calDayRow: { flexDirection: 'row', marginBottom: 6 },
    calDayLabel: {
        flex: 1,
        textAlign: 'center',
        fontSize: 10.5,
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
    calDayNum: { fontSize: 12.5, color: Colors.charcoal, fontWeight: Typography.medium },

    textAreaWrap: {
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 8,
        borderWidth: 1.5,
        borderColor: Colors.border,
        minHeight: 130,
    },
    textArea: { fontSize: 14, color: Colors.charcoal, lineHeight: 22, minHeight: 100 },
    charCount: { fontSize: 11, color: Colors.charcoalLight, textAlign: 'right', marginTop: 4 },

    nextStepsCard: {
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        marginBottom: Spacing.lg,
        gap: 12,
    },
    nextStepsTitle: { fontSize: 14, fontWeight: Typography.extraBold, marginBottom: 4 },
    nextStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    nextStepIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 1,
    },
    nextStepText: { flex: 1, fontSize: 13, color: Colors.charcoalMid, lineHeight: 20 },

    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderRadius: Radii.md,
        height: 58,
        ...Shadows.primary,
    },
    submitText: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.2,
    },
    privacyNote: {
        textAlign: 'center',
        fontSize: 11.5,
        color: Colors.charcoalLight,
        marginTop: Spacing.md,
        lineHeight: 17,
        paddingHorizontal: Spacing.xl,
    },
});

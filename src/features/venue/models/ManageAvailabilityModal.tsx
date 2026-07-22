import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    ScrollView,
    Animated,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/theme/theme';
import { useBlockedDates } from '@/features/booking/hooks/useGetBlockedDates';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModalAction = {
    ctaLabel: string;
    onPress: () => void;
};

export type ModalFormField =
    | {
          type: 'text';
          placeholder: string;
          value: string;
          onChangeText: (text: string) => void;
      }
    | {
          type: 'date';
          placeholder: string;
          value: Date | null;
          onChange: (date: Date | null) => void;
          minimumDate?: Date;
          maximumDate?: Date;
      }
    | {
          type: 'date-range';
          placeholderStart: string;
          placeholderEnd: string;
          startDate: Date | null;
          endDate: Date | null;
          onStartChange: (date: Date | null) => void;
          onEndChange: (date: Date | null) => void;
          minimumDate?: Date;
      };

export type ModalSection = {
    icon: string;
    title: string;
    subtitle?: string;
    variant: 'danger' | 'primary' | 'info' | 'warning';
    action?: ModalAction;
    form?: {
        fields: ModalFormField[];
        submitLabel: string;
        onSubmit: () => void;
        submitDisabled?: boolean;
    };
};

interface ManageAvailabilityModalProps {
    venueSku: string;
    visible: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    sections: ModalSection[];
}

// ─── Variant config ───────────────────────────────────────────────────────────
const VARIANT: Record<
    string,
    { bg: string; iconBg: string; color: string; ctaBg: string; ctaColor: string; border: string }
> = {
    danger: {
        bg: '#FFF4EC',
        iconBg: '#FFE4CC',
        color: '#D95F00',
        ctaBg: '#E8600A',
        ctaColor: '#fff',
        border: '#FFD4A8',
    },
    warning: {
        bg: Colors.warningLight,
        iconBg: '#FDE4A0',
        color: Colors.warning,
        ctaBg: Colors.warning,
        ctaColor: '#fff',
        border: Colors.primaryBorder,
    },
    primary: {
        bg: Colors.primaryLight,
        iconBg: '#FDE8B0',
        color: Colors.primary,
        ctaBg: Colors.primary,
        ctaColor: Colors.charcoal,
        border: Colors.primaryBorder,
    },
    info: {
        bg: Colors.infoLight,
        iconBg: '#BFDBFE',
        color: Colors.info,
        ctaBg: '#93C5FD',
        ctaColor: Colors.info,
        border: '#BFDBFE',
    },
};

// ─── Date formatter ───────────────────────────────────────────────────────────
const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Date field (handles iOS inline + Android modal) ──────────────────────────
function DateField({
    placeholder,
    value,
    onChange,
    minimumDate,
    maximumDate,
    accentColor,
}: {
    placeholder: string;
    value: Date | null;
    onChange: (date: Date | null) => void;
    minimumDate?: Date;
    maximumDate?: Date;
    accentColor: string;
}) {
    const [show, setShow] = useState(false);

    const handleChange = useCallback(
        (_event: DateTimePickerEvent, selected?: Date) => {
            if (Platform.OS === 'android') setShow(false);
            if (selected) onChange(selected);
        },
        [onChange],
    );

    return (
        <View>
            {/* Tappable input row */}
            <TouchableOpacity
                style={ms.inputWrap}
                onPress={() => setShow(s => !s)}
                activeOpacity={0.75}
            >
                <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={value ? Colors.charcoalMid : Colors.charcoalLight}
                    style={ms.inputIcon}
                />
                <Text style={[ms.inputText, !value && ms.inputPlaceholder]}>
                    {value ? fmtDate(value) : placeholder}
                </Text>
                <Ionicons
                    name={show ? 'chevron-up' : 'chevron-down'}
                    size={13}
                    color={Colors.charcoalLight}
                />
            </TouchableOpacity>

            {/* iOS — inline picker expands below the row */}
            {Platform.OS === 'ios' && show && (
                <View style={ms.iosPickerWrap}>
                    <DateTimePicker
                        mode="date"
                        display="inline"
                        value={value ?? new Date()}
                        onChange={handleChange}
                        minimumDate={minimumDate}
                        maximumDate={maximumDate}
                        accentColor={accentColor}
                        themeVariant="light"
                        style={ms.iosPicker}
                    />
                </View>
            )}

            {/* Android — system modal */}
            {Platform.OS === 'android' && show && (
                <DateTimePicker
                    mode="date"
                    display="default"
                    value={value ?? new Date()}
                    onChange={handleChange}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                />
            )}
        </View>
    );
}

// ─── Date-range field ─────────────────────────────────────────────────────────
function DateRangeField({
    placeholderStart,
    placeholderEnd,
    startDate,
    endDate,
    onStartChange,
    onEndChange,
    minimumDate,
    accentColor,
}: {
    placeholderStart: string;
    placeholderEnd: string;
    startDate: Date | null;
    endDate: Date | null;
    onStartChange: (d: Date | null) => void;
    onEndChange: (d: Date | null) => void;
    minimumDate?: Date;
    accentColor: string;
}) {
    return (
        <View style={ms.dateRangeWrap}>
            <View style={ms.dateRangeField}>
                <Text style={ms.dateRangeLabel}>From</Text>
                <DateField
                    placeholder={placeholderStart}
                    value={startDate}
                    onChange={onStartChange}
                    minimumDate={minimumDate ?? new Date()}
                    maximumDate={endDate ?? undefined}
                    accentColor={accentColor}
                />
            </View>
            <View style={ms.dateRangeDivider} />
            <View style={ms.dateRangeField}>
                <Text style={ms.dateRangeLabel}>To</Text>
                <DateField
                    placeholder={placeholderEnd}
                    value={endDate}
                    onChange={onEndChange}
                    minimumDate={startDate ?? minimumDate ?? new Date()}
                    accentColor={accentColor}
                />
            </View>
        </View>
    );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function ModalSectionCard({ section }: { section: ModalSection }) {
    const v = VARIANT[section.variant] ?? VARIANT.primary;

    const renderField = (field: ModalFormField, i: number) => {
        if (field.type === 'text') {
            return (
                <View key={i} style={ms.inputWrap}>
                    <TextInput
                        style={ms.inputText}
                        placeholder={field.placeholder}
                        placeholderTextColor={Colors.charcoalLight}
                        value={field.value}
                        onChangeText={field.onChangeText}
                    />
                </View>
            );
        }

        if (field.type === 'date') {
            return (
                <DateField
                    key={i}
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={field.onChange}
                    minimumDate={field.minimumDate}
                    maximumDate={field.maximumDate}
                    accentColor={v.color}
                />
            );
        }

        if (field.type === 'date-range') {
            return (
                <DateRangeField
                    key={i}
                    placeholderStart={field.placeholderStart}
                    placeholderEnd={field.placeholderEnd}
                    startDate={field.startDate}
                    endDate={field.endDate}
                    onStartChange={field.onStartChange}
                    onEndChange={field.onEndChange}
                    minimumDate={field.minimumDate}
                    accentColor={v.color}
                />
            );
        }
    };

    return (
        <View style={[ms.sectionCard, { backgroundColor: v.bg, borderColor: v.border }]}>
            {/* Header row */}
            <View style={ms.sectionHeader}>
                <View style={[ms.sectionIconWrap, { backgroundColor: v.iconBg }]}>
                    <Ionicons name={section.icon as any} size={18} color={v.color} />
                </View>
                <View style={ms.sectionHeaderText}>
                    <Text style={[ms.sectionTitle, { color: v.color }]}>{section.title}</Text>
                    {section.subtitle ? (
                        <Text style={ms.sectionSubtitle}>{section.subtitle}</Text>
                    ) : null}
                </View>
                {section.action && (
                    <TouchableOpacity
                        style={[ms.ctaBtn, { backgroundColor: v.ctaBg }]}
                        onPress={section.action.onPress}
                        activeOpacity={0.85}
                    >
                        <Text style={[ms.ctaBtnText, { color: v.ctaColor }]}>
                            {section.action.ctaLabel}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Form */}
            {section.form && (
                <View style={ms.formWrap}>
                    {section.form.fields.map((field, i) => renderField(field, i))}
                    <TouchableOpacity
                        style={[
                            ms.submitBtn,
                            { backgroundColor: v.ctaBg },
                            section.form.submitDisabled && ms.submitBtnDisabled,
                        ]}
                        onPress={section.form.onSubmit}
                        disabled={section.form.submitDisabled}
                        activeOpacity={0.85}
                    >
                        <Text style={[ms.submitBtnText, { color: v.ctaColor }]}>
                            {section.form.submitLabel}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function ManageAvailabilityModal({
    visible,
    onClose,
    title,
    subtitle,
    sections,
    venueSku,
}: ManageAvailabilityModalProps) {
    const translateY = useRef(new Animated.Value(400)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const { data: blockedDateData } = useBlockedDates(venueSku);
    const blockedDates = React.useMemo(
        () =>
            [...(blockedDateData?.dates ?? [])].sort(
                (a, b) => new Date(a).getTime() - new Date(b).getTime(),
            ),
        [blockedDateData],
    );
    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 220,
                    useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    speed: 18,
                    bounciness: 5,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 180,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 400,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={ms.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View style={[ms.backdrop, { opacity: backdropOpacity }]} />
                </TouchableWithoutFeedback>

                <Animated.View style={[ms.sheet, { transform: [{ translateY }] }]}>
                    {/* Handle */}
                    <View style={ms.handle} />

                    {/* Header */}
                    <View style={ms.header}>
                        <View style={ms.headerLeft}>
                            <View style={ms.headerIconWrap}>
                                <Ionicons
                                    name="calendar-outline"
                                    size={18}
                                    color={Colors.primary}
                                />
                            </View>
                            <View>
                                <Text style={ms.title}>{title}</Text>
                                {subtitle ? <Text style={ms.subtitle}>{subtitle}</Text> : null}
                            </View>
                        </View>
                        <TouchableOpacity
                            style={ms.closeBtn}
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={18} color={Colors.charcoalMid} />
                        </TouchableOpacity>
                    </View>

                    <View style={ms.divider} />

                    {/* Body */}
                    <ScrollView
                        contentContainerStyle={ms.body}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {sections.map((section, i) => (
                            <ModalSectionCard key={i} section={section} />
                        ))}

                        {blockedDates.length > 0 && (
                            <View style={ms.blockedCard}>
                                <View style={ms.blockedHeader}>
                                    <View style={ms.blockedHeaderLeft}>
                                        <Ionicons
                                            name="lock-closed-outline"
                                            size={14}
                                            color={Colors.charcoalMid}
                                        />
                                        <Text style={ms.blockedTitle}>
                                            Blocked Dates ({blockedDates.length})
                                        </Text>
                                    </View>
                                </View>
                                <View style={ms.blockedChipRow}>
                                    {blockedDates.map(d => (
                                        <View key={d} style={ms.blockedChip}>
                                            <Ionicons
                                                name="calendar-outline"
                                                size={11}
                                                color={Colors.charcoalMid}
                                            />
                                            <Text style={ms.blockedChipText}>
                                                {fmtDate(new Date(d))}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ms = StyleSheet.create({
    flex: { flex: 1, justifyContent: 'flex-end' },

    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },

    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        maxHeight: '90%',
        ...Shadows.floating,
    },

    handle: {
        alignSelf: 'center',
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        marginTop: 10,
        marginBottom: 4,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    headerIconWrap: {
        width: 38,
        height: 38,
        borderRadius: Radii.md,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    title: {
        fontSize: Typography.md,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        marginTop: 1,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: Radii.full,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },

    divider: {
        height: 1,
        backgroundColor: Colors.divider,
        marginHorizontal: Spacing.xl,
    },

    body: {
        padding: Spacing.xl,
        gap: Spacing.md,
    },

    // Section card
    sectionCard: {
        borderRadius: Radii.lg,
        borderWidth: 1.5,
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    sectionIconWrap: {
        width: 38,
        height: 38,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    sectionHeaderText: { flex: 1 },
    sectionTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.extraBold,
        letterSpacing: -0.2,
    },
    sectionSubtitle: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        marginTop: 2,
        lineHeight: 16,
    },
    ctaBtn: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: Radii.md,
        flexShrink: 0,
    },
    ctaBtnText: {
        fontSize: Typography.base,
        fontWeight: Typography.extraBold,
    },

    // Form
    formWrap: { gap: Spacing.sm, marginTop: Spacing.xs },

    // Shared input row
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        paddingHorizontal: Spacing.md,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
        gap: Spacing.xs,
    },
    inputIcon: { flexShrink: 0 },
    inputText: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.charcoal,
        fontWeight: Typography.medium,
        padding: 0,
    },
    inputPlaceholder: { color: Colors.charcoalLight },

    // iOS inline picker
    iosPickerWrap: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        marginTop: Spacing.xs,
        overflow: 'hidden',
    },
    iosPicker: {
        height: 320,
    },

    // Date range
    dateRangeWrap: { gap: Spacing.sm },
    dateRangeField: { gap: 4 },
    dateRangeLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        marginLeft: 4,
    },
    dateRangeDivider: {
        height: 1,
        backgroundColor: Colors.divider,
        marginVertical: Spacing.xs,
    },

    // Submit
    submitBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: Radii.md,
        marginTop: Spacing.xs,
    },
    submitBtnDisabled: { opacity: 0.45 },
    submitBtnText: {
        fontSize: Typography.base,
        fontWeight: Typography.extraBold,
        letterSpacing: 0.2,
    },
    blockedCard: {
        backgroundColor: Colors.background,
        borderRadius: Radii.lg,
        borderWidth: 1.5,
        borderColor: Colors.border,
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    blockedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    blockedHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    blockedTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
    },
    blockedChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
    },
    blockedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: Radii.full,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    blockedChipText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
});

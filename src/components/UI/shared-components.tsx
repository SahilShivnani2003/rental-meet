import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme/theme';

// ── Step header banner ────────────────────────────────────────────────────────
interface StepHeaderProps {
    title: string;
    current: number;
    total?: number;
}
export function StepHeader({ title, current, total = 7 }: StepHeaderProps) {
    return (
        <View style={sh.wrap}>
            <View>
                <Text style={sh.title}>{title}</Text>
                <Text style={sh.sub}>Fill in all required details to continue</Text>
            </View>
            <View style={sh.badge}>
                <Text style={sh.badgeText}>
                    {current} / {total}
                </Text>
            </View>
        </View>
    );
}

// ── Section card ──────────────────────────────────────────────────────────────
interface SectionCardProps {
    children: React.ReactNode;
    accentColor?: string;
    style?: object;
}
export function SectionCard({ children, accentColor = Colors.primary, style }: SectionCardProps) {
    return (
        <View style={[sc.card, style]}>
            <View style={[sc.accent, { backgroundColor: accentColor }]} />
            <View style={sc.body}>{children}</View>
        </View>
    );
}

// ── Section title ─────────────────────────────────────────────────────────────
interface SectionTitleProps {
    icon: string;
    title: string;
    subtitle?: string;
    iconColor?: string;
    bgColor?: string;
}
export function SectionTitle({
    icon,
    title,
    subtitle,
    iconColor = Colors.primary,
    bgColor = Colors.primaryLight,
}: SectionTitleProps) {
    return (
        <View style={st.row}>
            <View style={[st.iconWrap, { backgroundColor: bgColor }]}>
                <Ionicons name={icon as any} size={18} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={st.title}>{title}</Text>
                {subtitle && <Text style={st.sub}>{subtitle}</Text>}
            </View>
        </View>
    );
}

// ── Inline picker row ─────────────────────────────────────────────────────────
interface PickerRowProps {
    value: string;
    options: string[];
    open: boolean;
    onToggle: () => void;
    onSelect: (v: string) => void;
}
export function PickerRow({ value, options, open, onToggle, onSelect }: PickerRowProps) {
    const isPlaceholder = value === options[0];
    return (
        <>
            <TouchableOpacity style={pr.picker} onPress={onToggle} activeOpacity={0.8}>
                <Text style={[pr.pickerText, isPlaceholder && pr.placeholder]}>{value}</Text>
                <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={15}
                    color={Colors.charcoalLight}
                />
            </TouchableOpacity>
            {open && (
                <View style={pr.list}>
                    {options.slice(1).map(opt => (
                        <TouchableOpacity
                            key={opt}
                            style={[pr.item, value === opt && pr.itemActive]}
                            onPress={() => onSelect(opt)}
                        >
                            <Text style={[pr.itemText, value === opt && pr.itemTextActive]}>
                                {opt}
                            </Text>
                            {value === opt && (
                                <Ionicons name="checkmark" size={14} color={Colors.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </>
    );
}

// ── File upload button ────────────────────────────────────────────────────────
export function FileUploadBtn({ label, onPress }: { label: string; onPress: () => void }) {
    return (
        <TouchableOpacity style={fu.btn} onPress={onPress} activeOpacity={0.8}>
            <Ionicons name="cloud-upload-outline" size={15} color={Colors.primary} />
            <Text style={fu.text}>{label}</Text>
        </TouchableOpacity>
    );
}

// ── Nav buttons ───────────────────────────────────────────────────────────────
interface NavProps {
    onPrev?: () => void;
    onNext: () => void;
    nextLabel?: string;
    showPrev?: boolean;
}
export function NavButtons({ onPrev, onNext, nextLabel = 'Next Step', showPrev = true }: NavProps) {
    return (
        <View style={nb.row}>
            {showPrev && onPrev ? (
                <TouchableOpacity style={nb.prevBtn} onPress={onPrev} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={15} color={Colors.primary} />
                    <Text style={nb.prevText}>Previous</Text>
                </TouchableOpacity>
            ) : (
                <View />
            )}
            <TouchableOpacity style={nb.nextBtn} onPress={onNext} activeOpacity={0.85}>
                <Text style={nb.nextText}>{nextLabel}</Text>
                <Ionicons name="chevron-forward" size={15} color={Colors.charcoal} />
            </TouchableOpacity>
        </View>
    );
}

// ── Textarea (multiline — Field component is single-line only) ────────────────
import { TextInput, TextInputProps } from 'react-native';
interface TextareaProps extends TextInputProps {
    label: string;
}
export function Textarea({ label, style, ...props }: TextareaProps) {
    return (
        <View style={ta.wrap}>
            <Text style={ta.label}>{label}</Text>
            <TextInput
                style={[ta.input, style]}
                placeholderTextColor={Colors.charcoalLight}
                multiline
                textAlignVertical="top"
                {...props}
            />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const sh = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        padding: Spacing.lg,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
    },
    title: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
    },
    sub: { fontSize: Typography.sm, color: Colors.charcoalLight, marginTop: 2 },
    badge: {
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: 5,
    },
    badgeText: { fontSize: Typography.base, fontWeight: Typography.extraBold, color: Colors.white },
});

const sc = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        overflow: 'hidden',
        ...Shadows.card,
    },
    accent: { height: 4 },
    body: { padding: Spacing.lg },
});

const st = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: Radii.sm,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 1,
    },
    title: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.charcoal },
    sub: { fontSize: Typography.sm, color: Colors.charcoalLight, marginTop: 2 },
});

const pr = StyleSheet.create({
    picker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
        backgroundColor: Colors.surface,
        height: 54,
    },
    pickerText: { fontSize: Typography.md, color: Colors.charcoal },
    placeholder: { color: Colors.charcoalLight },
    list: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        marginTop: 4,
        backgroundColor: Colors.surface,
        overflow: 'hidden',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    itemActive: { backgroundColor: Colors.primaryLight },
    itemText: { fontSize: Typography.md, color: Colors.charcoal },
    itemTextActive: { color: Colors.primary, fontWeight: Typography.semiBold },
});

const fu = StyleSheet.create({
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        borderStyle: 'dashed',
        borderRadius: Radii.sm,
        paddingVertical: 13,
        backgroundColor: Colors.primaryLight,
        marginTop: Spacing.xs,
    },
    text: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.primary },
});

const nb = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.xl,
    },
    prevBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.xl,
        paddingVertical: 11,
    },
    prevText: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.primary },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.xl,
        paddingVertical: 12,
        ...Shadows.primary,
    },
    nextText: { fontSize: Typography.md, fontWeight: Typography.extraBold, color: Colors.charcoal },
});

const ta = StyleSheet.create({
    wrap: { marginBottom: Spacing.md },
    label: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 7,
    },
    input: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        fontSize: 15,
        color: Colors.charcoal,
        backgroundColor: Colors.background,
        minHeight: 100,
    },
});

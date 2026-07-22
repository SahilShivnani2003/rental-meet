import { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/theme/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

/** Local YYYY-MM-DD — never use toISOString() here, it shifts by timezone */
function toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function buildMonthGrid(year: number, month: number): (Date | null)[] {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid: (Date | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(new Date(year, month, d));
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
}

// ─── CalendarModal ────────────────────────────────────────────────────────────

interface CalendarModalProps {
    visible: boolean;
    selectedDate: string;
    onSelect: (date: string) => void;
    onClose: () => void;
}

export default function CalendarModal({
    visible,
    selectedDate,
    onSelect,
    onClose,
}: CalendarModalProps) {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const CELL_SIZE = 40;

const cal = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        paddingHorizontal: Spacing.xl,
        paddingTop: 12,
        paddingBottom: Spacing.xl,
        ...Shadows.floating,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginBottom: Spacing.lg,
    },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    navBtn: {
        width: 34,
        height: 34,
        borderRadius: Radii.sm,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navBtnDisabled: { opacity: 0.4 },
    monthLabel: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
    },
    dayHeader: {
        flexDirection: 'row',
        marginBottom: Spacing.xs,
    },
    dayName: {
        flex: 1,
        textAlign: 'center',
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        textTransform: 'uppercase',
    },
    dayNameWeekend: { color: Colors.primary },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    cell: {
        width: `${100 / 7}%`,
        height: CELL_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 2,
    },
    cellSelected: {
        backgroundColor: Colors.primary,
        borderRadius: Radii.md,
    },
    cellWeekend: {
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.md,
    },
    cellDisabled: { opacity: 0.3 },
    cellText: {
        fontSize: 14,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    cellTextSelected: { color: Colors.white },
    cellTextDisabled: { color: Colors.charcoalLight },
    cellTextWeekend: { color: Colors.primary },
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
        gap: Spacing.md,
        marginTop: Spacing.lg,
        justifyContent: 'center',
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 11, color: Colors.charcoalLight, fontWeight: Typography.medium },
});

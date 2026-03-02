import { useRef, useEffect } from 'react';
import { Animated, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StatusConfig, Colors, Radii, Shadows, Spacing, Typography } from '../../theme/theme';

export default function BookingCard({
    booking,
    userType,
    onStatusUpdate,
    index,
}: {
    booking: any;
    userType: string;
    onStatusUpdate: (id: string, status: string) => void;
    index: number;
}) {
    const scaleAnim = useRef(new Animated.Value(0.96)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                delay: index * 60,
                useNativeDriver: true,
                speed: 18,
                bounciness: 6,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                delay: index * 60,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const cfg = StatusConfig[booking.status] ?? {
        color: Colors.charcoalLight,
        bg: Colors.border,
        icon: 'ellipse',
        label: booking.status,
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    const formatTime = (d: string) =>
        new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const hours = Math.round(
        (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / 3_600_000,
    );

    return (
        <Animated.View
            style={[styles.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}
        >
            <View style={[styles.cardAccentBar, { backgroundColor: cfg.color }]} />
            <View style={styles.cardBody}>
                {/* Top row */}
                <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardVenueName} numberOfLines={1}>
                            {booking.venueName}
                        </Text>
                        <Text style={styles.cardDate}>{formatDate(booking.startDate)}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                        <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                        <Text style={[styles.statusPillText, { color: cfg.color }]}>
                            {cfg.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Chips */}
                <View style={styles.chipsRow}>
                    <View style={styles.chip}>
                        <Ionicons name="time-outline" size={13} color={Colors.charcoalLight} />
                        <Text style={styles.chipText}>
                            {formatTime(booking.startDate)} – {formatTime(booking.endDate)}
                        </Text>
                    </View>
                    <View style={styles.chip}>
                        <Ionicons name="hourglass-outline" size={13} color={Colors.charcoalLight} />
                        <Text style={styles.chipText}>{hours}h</Text>
                    </View>
                    <View style={[styles.chip, styles.amountChip]}>
                        <Text style={styles.amountText}>${booking.totalAmount}</Text>
                    </View>
                </View>

                {/* Notes */}
                {booking.notes && (
                    <View style={styles.notesBox}>
                        <View style={styles.notesIconRow}>
                            <Ionicons
                                name="document-text-outline"
                                size={13}
                                color={Colors.primary}
                            />
                            <Text style={styles.notesLabel}>Note</Text>
                        </View>
                        <Text style={styles.notesText}>{booking.notes}</Text>
                    </View>
                )}

                {/* Owner actions */}
                {userType === 'owner' && booking.status === 'pending' && (
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnConfirm]}
                            onPress={() => onStatusUpdate(booking.id, 'confirmed')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="checkmark" size={15} color={Colors.white} />
                            <Text style={styles.actionBtnText}>Confirm</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnReject]}
                            onPress={() => onStatusUpdate(booking.id, 'cancelled')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="close" size={15} color={Colors.danger} />
                            <Text style={[styles.actionBtnText, { color: Colors.danger }]}>
                                Reject
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Client actions */}
                {userType === 'client' && booking.status === 'pending' && (
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnReject, { flex: 1 }]}
                            onPress={() => onStatusUpdate(booking.id, 'cancelled')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="close" size={15} color={Colors.danger} />
                            <Text style={[styles.actionBtnText, { color: Colors.danger }]}>
                                Cancel Booking
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        marginBottom: 14,
        flexDirection: 'row',
        overflow: 'hidden',
        ...Shadows.card,
    },
    cardAccentBar: { width: 4, borderTopLeftRadius: Radii.xl, borderBottomLeftRadius: Radii.xl },
    cardBody: { flex: 1, padding: Spacing.lg },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: Spacing.md },
    cardVenueName: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        marginBottom: 3,
    },
    cardDate: { fontSize: 12, color: Colors.charcoalLight, fontWeight: Typography.medium },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radii.full,
    },
    statusPillText: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        letterSpacing: Typography.normal,
    },
    divider: { height: 1, backgroundColor: Colors.divider, marginBottom: Spacing.md },

    // Chips
    chipsRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.md },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.background,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: Radii.sm,
    },
    chipText: { fontSize: 12, color: Colors.charcoalMid, fontWeight: Typography.semiBold },
    amountChip: { backgroundColor: Colors.primaryLight, marginLeft: 'auto' },
    amountText: {
        fontSize: Typography.md,
        fontWeight: Typography.extraBold,
        color: Colors.primaryDark,
    },

    // Notes
    notesBox: {
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
    },
    notesIconRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
    notesLabel: {
        fontSize: 10,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    notesText: { fontSize: Typography.base, color: Colors.charcoalMid, lineHeight: 19 },

    // Actions
    actionsRow: { flexDirection: 'row', gap: 10, marginTop: Spacing.xxs },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 11,
        borderRadius: Radii.md,
        gap: 6,
    },
    actionBtnConfirm: { backgroundColor: Colors.success },
    actionBtnReject: {
        backgroundColor: Colors.dangerLight,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    actionBtnText: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.white,
        letterSpacing: Typography.normal,
    },
});

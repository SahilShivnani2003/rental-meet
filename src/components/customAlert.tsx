import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors } from '@/theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface AlertButton {
    label: string;
    onPress: () => void;
    style?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export interface CustomAlertProps {
    visible: boolean;
    type?: AlertType;
    title: string;
    message?: string;
    buttons?: AlertButton[];
    onDismiss?: () => void;
    dismissable?: boolean;
}

// ─── Type config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
    AlertType,
    {
        icon: string;
        iconColor: string;
        iconBg: string;
        accentColor: string;
        cardBg: string;
    }
> = {
    success: {
        icon: 'checkmark-circle',
        iconColor: '#16A34A',
        iconBg: '#DCFCE7',
        accentColor: '#16A34A',
        cardBg: '#F6FEF9', // ultra-light green wash
    },
    error: {
        icon: 'close-circle',
        iconColor: '#DC2626',
        iconBg: '#FEE2E2',
        accentColor: '#DC2626',
        cardBg: '#FFF7F7', // ultra-light red wash
    },
    warning: {
        icon: 'warning',
        iconColor: '#D97706',
        iconBg: '#FEF3C7',
        accentColor: '#D97706',
        cardBg: '#FFFCF5', // ultra-light amber wash
    },
    info: {
        icon: 'information-circle',
        iconColor: Colors.primary,
        iconBg: '#FFF0EB',
        accentColor: Colors.primary,
        cardBg: '#FFF8F5', // ultra-light orange wash
    },
    confirm: {
        icon: 'help-circle',
        iconColor: '#1A1A1A',
        iconBg: '#F5F4F0',
        accentColor: '#1A1A1A',
        cardBg: '#FCFCFA', // ultra-light neutral
    },
};

const BUTTON_STYLES: Record<string, object> = {
    primary: {
        bg: Colors.primary,
        text: '#FFFFFF',
        border: 'transparent',
        shadow:Colors.primaryLight,
    },
    secondary: {
        bg: '#1A1A1A',
        text: '#FFFFFF',
        border: 'transparent',
        shadow: '#1A1A1A',
    },
    danger: {
        bg: '#FEE2E2',
        text: '#DC2626',
        border: '#FECACA',
        shadow: 'transparent',
    },
    ghost: {
        bg: '#F5F4F0',
        text: '#706e6e',
        border: '#cececc',
        shadow: 'transparent',
    },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function CustomAlert({
    visible,
    type = 'info',
    title,
    message,
    buttons = [{ label: 'OK', onPress: () => {}, style: 'primary' }],
    onDismiss,
    dismissable = true,
}: CustomAlertProps) {
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const cardScale = useRef(new Animated.Value(0.82)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const cardY = useRef(new Animated.Value(24)).current;
    const iconScale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Backdrop in
            Animated.timing(backdropOpacity, {
                toValue: 1,
                duration: 220,
                useNativeDriver: true,
            }).start();
            // Card spring in
            Animated.parallel([
                Animated.spring(cardScale, {
                    toValue: 1,
                    useNativeDriver: true,
                    speed: 20,
                    bounciness: 10,
                }),
                Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.spring(cardY, {
                    toValue: 0,
                    useNativeDriver: true,
                    speed: 20,
                    bounciness: 8,
                }),
            ]).start();
            // Icon pop in with delay
            Animated.sequence([
                Animated.delay(120),
                Animated.spring(iconScale, {
                    toValue: 1,
                    useNativeDriver: true,
                    speed: 18,
                    bounciness: 16,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 180,
                    useNativeDriver: true,
                }),
                Animated.timing(cardOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
                Animated.timing(cardScale, { toValue: 0.9, duration: 150, useNativeDriver: true }),
            ]).start(() => {
                cardScale.setValue(0.82);
                cardY.setValue(24);
                iconScale.setValue(0);
            });
        }
    }, [visible]);

    const cfg = TYPE_CONFIG[type];

    return (
        <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
            {/* ── Backdrop ── */}
            <Animated.View
                style={[styles.backdrop, { opacity: backdropOpacity }]}
                onTouchEnd={dismissable ? onDismiss : undefined}
            />

            {/* ── Card ── */}
            <View style={styles.centerer} pointerEvents="box-none">
                <Animated.View
                    style={[
                        styles.card,
                        {
                            opacity: cardOpacity,
                            transform: [{ scale: cardScale }, { translateY: cardY }],
                            backgroundColor: cfg.cardBg,
                        },
                    ]}
                >
                    {/* Top accent bar */}
                    <View style={[styles.topAccent, { backgroundColor: cfg.accentColor }]} />

                    {/* Icon */}
                    <Animated.View
                        style={[
                            styles.iconWrap,
                            { backgroundColor: cfg.iconBg, transform: [{ scale: iconScale }] },
                        ]}
                    >
                        <Ionicons name={cfg.icon as any} size={34} color={cfg.iconColor} />
                    </Animated.View>

                    {/* Text */}
                    <Text style={styles.title}>{title}</Text>
                    {message ? <Text style={styles.message}>{message}</Text> : null}

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Buttons */}
                    <View style={[styles.buttonsRow, buttons.length === 1 && styles.buttonsSingle]}>
                        {buttons.map((btn, i) => {
                            const bStyle = BUTTON_STYLES[btn.style ?? 'primary'] as any;
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[
                                        styles.btn,
                                        buttons.length === 1 && styles.btnFull,
                                        {
                                            backgroundColor: bStyle.bg,
                                            borderColor: bStyle.border,
                                            borderWidth: bStyle.border !== 'transparent' ? 1.5 : 0,
                                            shadowColor: bStyle.shadow,
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity:
                                                bStyle.shadow !== 'transparent' ? 0.3 : 0,
                                            shadowRadius: 8,
                                            elevation: bStyle.shadow !== 'transparent' ? 4 : 0,
                                        },
                                    ]}
                                    onPress={btn.onPress}
                                    activeOpacity={0.82}
                                >
                                    <Text style={[styles.btnText, { color: bStyle.text }]}>
                                        {btn.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(15, 15, 15, 0.55)',
    },
    centerer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    card: {
        width: '100%',
        borderRadius: 28,
        alignItems: 'center',
        paddingBottom: 24,
        overflow: 'hidden',
        shadowColor: '#1A1A1A',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.18,
        shadowRadius: 40,
        elevation: 20,
    },
    topAccent: {
        width: '100%',
        height: 5,
        marginBottom: 28,
    },
    iconWrap: {
        width: 72,
        height: 72,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    title: {
        fontSize: 19,
        fontWeight: '800',
        color: '#1A1A1A',
        textAlign: 'center',
        letterSpacing: -0.3,
        paddingHorizontal: 24,
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 21,
        paddingHorizontal: 24,
        fontWeight: '400',
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#F5F4F0',
        marginTop: 24,
        marginBottom: 20,
    },
    buttonsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 10,
        width: '100%',
    },
    buttonsSingle: {
        justifyContent: 'center',
    },
    btn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnFull: {
        flex: 1,
    },
    btnText: {
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
});

// ─── Usage Example ────────────────────────────────────────────────────────────
// Place this in any screen to preview all alert types

import { useState } from 'react';

export function AlertDemo() {
    const [alert, setAlert] = useState<{
        visible: boolean;
        type: AlertType;
        title: string;
        message: string;
        buttons: AlertButton[];
    }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
        buttons: [],
    });

    const show = (type: AlertType, title: string, message: string, buttons: AlertButton[]) =>
        setAlert({ visible: true, type, title, message, buttons });

    const hide = () => setAlert(prev => ({ ...prev, visible: false }));

    return (
        <View style={demoStyles.container}>
            <View style={demoStyles.header}>
                <View style={demoStyles.headerAccent} />
                <View style={demoStyles.headerContent}>
                    <Text style={demoStyles.eyebrow}>COMPONENTS</Text>
                    <Text style={demoStyles.heading}>Custom Alert</Text>
                </View>
            </View>

            <View style={demoStyles.grid}>
                {/* Success */}
                <TouchableOpacity
                    style={[demoStyles.tile, { backgroundColor: '#DCFCE7' }]}
                    onPress={() =>
                        show(
                            'success',
                            'Booking Confirmed!',
                            'Your venue has been successfully booked for March 15th.',
                            [
                                { label: 'View Booking', onPress: hide, style: 'secondary' },
                                { label: 'Done', onPress: hide, style: 'primary' },
                            ],
                        )
                    }
                >
                    <Ionicons name="checkmark-circle" size={28} color="#16A34A" />
                    <Text style={[demoStyles.tileLabel, { color: '#16A34A' }]}>Success</Text>
                </TouchableOpacity>

                {/* Error */}
                <TouchableOpacity
                    style={[demoStyles.tile, { backgroundColor: '#FEE2E2' }]}
                    onPress={() =>
                        show(
                            'error',
                            'Payment Failed',
                            'We could not process your payment. Please check your card details and try again.',
                            [
                                { label: 'Try Again', onPress: hide, style: 'primary' },
                                { label: 'Cancel', onPress: hide, style: 'ghost' },
                            ],
                        )
                    }
                >
                    <Ionicons name="close-circle" size={28} color="#DC2626" />
                    <Text style={[demoStyles.tileLabel, { color: '#DC2626' }]}>Error</Text>
                </TouchableOpacity>

                {/* Warning */}
                <TouchableOpacity
                    style={[demoStyles.tile, { backgroundColor: '#FEF3C7' }]}
                    onPress={() =>
                        show(
                            'warning',
                            'Almost Full!',
                            'This venue only has 2 slots remaining this weekend. Book quickly!',
                            [
                                { label: 'Book Now', onPress: hide, style: 'primary' },
                                { label: 'Later', onPress: hide, style: 'ghost' },
                            ],
                        )
                    }
                >
                    <Ionicons name="warning" size={28} color="#D97706" />
                    <Text style={[demoStyles.tileLabel, { color: '#D97706' }]}>Warning</Text>
                </TouchableOpacity>

                {/* Info */}
                <TouchableOpacity
                    style={[demoStyles.tile, { backgroundColor: '#FFF0EB' }]}
                    onPress={() =>
                        show(
                            'info',
                            'New Feature',
                            'You can now save venues to your favorites list and book them instantly.',
                            [{ label: 'Got it', onPress: hide, style: 'primary' }],
                        )
                    }
                >
                    <Ionicons name="information-circle" size={28} color="#FF6B35" />
                    <Text style={[demoStyles.tileLabel, { color: '#FF6B35' }]}>Info</Text>
                </TouchableOpacity>

                {/* Confirm */}
                <TouchableOpacity
                    style={[demoStyles.tile, demoStyles.tileWide, { backgroundColor: '#F5F4F0' }]}
                    onPress={() =>
                        show(
                            'confirm',
                            'Cancel Booking?',
                            'Are you sure you want to cancel this booking? This action cannot be undone.',
                            [
                                { label: 'Keep Booking', onPress: hide, style: 'secondary' },
                                { label: 'Cancel Booking', onPress: hide, style: 'danger' },
                            ],
                        )
                    }
                >
                    <Ionicons name="help-circle" size={28} color="#1A1A1A" />
                    <Text style={[demoStyles.tileLabel, { color: '#1A1A1A' }]}>Confirm</Text>
                </TouchableOpacity>
            </View>

            <CustomAlert
                visible={alert.visible}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                buttons={alert.buttons}
                onDismiss={hide}
            />
        </View>
    );
}

const demoStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F4F0' },
    header: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingBottom: 20,
        marginBottom: 24,
        shadowColor: '#1A1A1A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
        elevation: 6,
    },
    headerAccent: { height: 4, backgroundColor: '#FF6B35' },
    headerContent: { paddingHorizontal: 20, paddingTop: 20 },
    eyebrow: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FF6B35',
        letterSpacing: 2.5,
        marginBottom: 4,
    },
    heading: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 12,
    },
    tile: {
        width: (SCREEN_WIDTH - 44) / 2,
        paddingVertical: 22,
        borderRadius: 20,
        alignItems: 'center',
        gap: 8,
        shadowColor: '#1A1A1A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    tileWide: { width: '100%' },
    tileLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
});

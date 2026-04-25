import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Field from '@/components/UI/InputField';
import LoadingDots from '@/components/UI/loading-dots';
import PasswordStrength from '@/components/UI/password-strength-bar';
import { useAlert } from '@/context/AlertContext';
import { Colors, Spacing, Radii, Shadows, Typography } from '@/theme/theme';
import { ApiError } from '@/types/ApiError';

interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    mutate: (
        data: ChangePasswordPayload,
        callbacks: { onSuccess: () => void; onError: (e: ApiError) => void },
    ) => void;
}

export default function ChangePasswordModal({ visible, onClose, mutate }: Props) {
    const alert = useAlert();
    const slideAnim = useRef(new Animated.Value(600)).current;

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (visible) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setErrors({});
            slideAnim.setValue(600);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                speed: 18,
                bounciness: 4,
            }).start();
        }
    }, [visible]);

    const clearError = (key: string) => setErrors(prev => ({ ...prev, [key]: '' }));

    const validate = () => {
        const e: Record<string, string> = {};
        if (!currentPassword) e.currentPassword = 'Current password is required';
        if (!newPassword) e.newPassword = 'New password is required';
        else if (newPassword.length < 6) e.newPassword = 'Must be at least 6 characters';
        if (!confirmPassword) e.confirmPassword = 'Please confirm your new password';
        else if (newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match';
        if (currentPassword && newPassword && currentPassword === newPassword)
            e.newPassword = 'New password must differ from current password';
        return e;
    };

    const handleChange = () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        setLoading(true);
        mutate(
            { currentPassword, newPassword },
            {
                onSuccess: () => {
                    setLoading(false);
                    alert.success(
                        'Password Changed',
                        'Your password has been updated successfully.',
                    );
                    onClose();
                },
                onError: (error: ApiError) => {
                    setLoading(false);
                    alert.error('Failed', error?.message || 'Something went wrong.');
                },
            },
        );
    };

    const handleClose = () => {
        Animated.timing(slideAnim, { toValue: 600, duration: 220, useNativeDriver: true }).start(
            onClose,
        );
    };

    // Password rule hints
    const hints = [
        { ok: newPassword.length >= 8, text: 'Min 8 characters' },
        { ok: /[A-Z]/.test(newPassword), text: 'Uppercase letter' },
        { ok: /[0-9]/.test(newPassword), text: 'Number included' },
        { ok: /[^a-zA-Z0-9]/.test(newPassword), text: 'Special character' },
    ];

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <View style={s.overlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFillObject}
                    activeOpacity={1}
                    onPress={handleClose}
                />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={s.kavWrapper}
                >
                    <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
                        <View style={s.handle} />

                        {/* Header */}
                        <View style={s.header}>
                            <View style={s.headerIcon}>
                                <Ionicons name="lock-closed" size={20} color={Colors.warning} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.headerTitle}>Change Password</Text>
                                <Text style={s.headerSub}>Keep your account secure</Text>
                            </View>
                            <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
                                <Ionicons name="close" size={20} color={Colors.charcoal} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={s.body}
                            keyboardShouldPersistTaps="handled"
                        >
                            <Field
                                label="Current Password"
                                placeholder="Enter your current password"
                                icon="lock-closed-outline"
                                value={currentPassword}
                                onChangeText={t => {
                                    setCurrentPassword(t);
                                    clearError('currentPassword');
                                }}
                                error={errors.currentPassword}
                                secureTextEntry={!showCurrent}
                                trailingIcon={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                                onTrailingPress={() => setShowCurrent(!showCurrent)}
                            />

                            <View style={s.divider} />

                            <Field
                                label="New Password"
                                placeholder="Minimum 6 characters"
                                icon="lock-open-outline"
                                value={newPassword}
                                onChangeText={t => {
                                    setNewPassword(t);
                                    clearError('newPassword');
                                }}
                                error={errors.newPassword}
                                secureTextEntry={!showNew}
                                trailingIcon={showNew ? 'eye-off-outline' : 'eye-outline'}
                                onTrailingPress={() => setShowNew(!showNew)}
                            />

                            {/* Password strength + hints */}
                            <PasswordStrength password={newPassword} />

                            {newPassword.length > 0 && (
                                <View style={s.hintsGrid}>
                                    {hints.map((h, i) => (
                                        <View key={i} style={s.hintItem}>
                                            <Ionicons
                                                name={h.ok ? 'checkmark-circle' : 'ellipse-outline'}
                                                size={13}
                                                color={h.ok ? Colors.success : Colors.charcoalLight}
                                            />
                                            <Text style={[s.hintText, h.ok && s.hintTextOk]}>
                                                {h.text}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <Field
                                label="Confirm New Password"
                                placeholder="Re-enter your new password"
                                icon="shield-checkmark-outline"
                                value={confirmPassword}
                                onChangeText={t => {
                                    setConfirmPassword(t);
                                    clearError('confirmPassword');
                                }}
                                error={errors.confirmPassword}
                                secureTextEntry={!showConfirm}
                                trailingIcon={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                                onTrailingPress={() => setShowConfirm(!showConfirm)}
                            />

                            {/* Match indicator */}
                            {confirmPassword.length > 0 && (
                                <View style={s.matchRow}>
                                    <Ionicons
                                        name={
                                            newPassword === confirmPassword
                                                ? 'checkmark-circle'
                                                : 'close-circle'
                                        }
                                        size={14}
                                        color={
                                            newPassword === confirmPassword
                                                ? Colors.success
                                                : Colors.danger
                                        }
                                    />
                                    <Text
                                        style={[
                                            s.matchText,
                                            {
                                                color:
                                                    newPassword === confirmPassword
                                                        ? Colors.success
                                                        : Colors.danger,
                                            },
                                        ]}
                                    >
                                        {newPassword === confirmPassword
                                            ? 'Passwords match'
                                            : 'Passwords do not match'}
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[s.saveBtn, loading && { opacity: 0.7 }]}
                                onPress={handleChange}
                                disabled={loading}
                                activeOpacity={0.88}
                            >
                                {loading ? (
                                    <LoadingDots />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="lock-closed"
                                            size={17}
                                            color={Colors.charcoal}
                                        />
                                        <Text style={s.saveBtnText}>Update Password</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </Animated.View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    kavWrapper: { justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        paddingTop: 12,
        maxHeight: '88%',
        ...Shadows.floating,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: Radii.sm,
        backgroundColor: Colors.warningLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    headerSub: { fontSize: 12, color: Colors.charcoalLight, marginTop: 2 },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: Radii.sm,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: { padding: Spacing.xl, paddingBottom: 40 },
    divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
    hintsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: Spacing.md,
        marginTop: -Spacing.sm,
    },
    hintItem: { flexDirection: 'row', alignItems: 'center', gap: 4, width: '47%' },
    hintText: { fontSize: 11, color: Colors.charcoalLight, fontWeight: Typography.medium },
    hintTextOk: { color: Colors.success, fontWeight: Typography.semiBold },
    matchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: -Spacing.sm,
        marginBottom: Spacing.md,
    },
    matchText: { fontSize: 12, fontWeight: Typography.semiBold },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        borderRadius: Radii.md,
        height: 54,
        marginTop: Spacing.xl,
        ...Shadows.primary,
    },
    saveBtnText: { fontSize: 15, fontWeight: Typography.extraBold, color: Colors.charcoal },
});

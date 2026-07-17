import { Colors, Radii, Spacing, Typography } from "@/theme/theme";
import { View, Image, Text, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { PickedFile } from "../screens/RegisterScreen";

// ── KYC doc upload card sub-component (step 2) ───────────────────────────────
export interface KycDocCardProps {
    label: string;
    icon: string;
    file: PickedFile | null;
    onPick: () => void;
    onRemove: () => void;
    error?: string;
    preferCamera?: boolean;
}

export function KycDocCard({ label, icon, file, onPick, onRemove, error, preferCamera }: KycDocCardProps) {
    return (
        <View>
            {file ? (
                <View style={[kc.card, kc.cardFilled]}>
                    <Image source={{ uri: file.uri }} style={kc.preview} resizeMode="cover" />
                    <View style={kc.filledOverlay}>
                        <View style={kc.fileInfo}>
                            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                            <Text style={kc.fileName} numberOfLines={1}>
                                {file.name}
                            </Text>
                        </View>
                        <TouchableOpacity style={kc.removeBtn} onPress={onRemove}>
                            <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                            <Text style={kc.removeBtnText}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <TouchableOpacity
                    style={[kc.card, !!error && kc.cardError]}
                    onPress={onPick}
                    activeOpacity={0.8}
                >
                    <View style={kc.iconWrap}>
                        <Ionicons
                            name={icon as any}
                            size={26}
                            color={error ? Colors.danger : Colors.info}
                        />
                    </View>
                    <Text style={[kc.label, !!error && { color: Colors.danger }]}>{label}</Text>
                    <Text style={kc.sub}>
                        {preferCamera
                            ? 'Tap to take a photo or choose from gallery'
                            : 'Tap to choose from gallery or camera'}
                    </Text>
                    <View style={[kc.uploadBtn, !!error && kc.uploadBtnError]}>
                        <Ionicons
                            name="cloud-upload-outline"
                            size={13}
                            color={error ? Colors.danger : Colors.info}
                        />
                        <Text style={[kc.uploadBtnText, !!error && { color: Colors.danger }]}>
                            Upload
                        </Text>
                    </View>
                </TouchableOpacity>
            )}
            {!!error && (
                <View style={kc.errorRow}>
                    <Ionicons name="alert-circle" size={12} color={Colors.danger} />
                    <Text style={kc.errorText}>{error}</Text>
                </View>
            )}
        </View>
    );
}

const kc = StyleSheet.create({
    card: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        borderRadius: Radii.lg,
        overflow: 'hidden',
        alignItems: 'center',
        padding: Spacing.lg,
        backgroundColor: Colors.background,
        marginBottom: 4,
    },
    cardFilled: { padding: 0, borderStyle: 'solid', borderColor: Colors.primaryBorder },
    cardError: { borderColor: Colors.danger, backgroundColor: '#FFF5F5' },
    preview: { width: '100%', height: 140 },
    filledOverlay: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        backgroundColor: Colors.surface,
    },
    fileInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    fileName: { fontSize: 13, fontWeight: Typography.medium, color: Colors.charcoal, flex: 1 },
    removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    removeBtnText: { fontSize: 12, color: Colors.danger, fontWeight: Typography.bold },
    iconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.infoLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    label: { fontSize: 13, fontWeight: Typography.bold, color: Colors.charcoal, marginBottom: 4 },
    sub: {
        fontSize: 11,
        color: Colors.charcoalLight,
        textAlign: 'center',
        lineHeight: 16,
        marginBottom: Spacing.sm,
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.info,
        backgroundColor: Colors.infoLight,
    },
    uploadBtnError: { borderColor: Colors.danger, backgroundColor: '#FEE2E2' },
    uploadBtnText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.info },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
    errorText: { fontSize: 11, color: Colors.danger, fontWeight: Typography.semiBold },
});

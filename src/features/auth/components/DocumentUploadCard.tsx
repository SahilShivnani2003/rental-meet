import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radii, Spacing, Typography } from '@/theme/theme';

interface DocumentUploadCardProps {
    title: string;
    required?: boolean;
    optionalLabel?: boolean;
    uri: string;
    onChange: (uri: string) => void;
    error?: string;
}

export default function DocumentUploadCard({
    title,
    required,
    optionalLabel,
    uri,
    onChange,
    error,
}: DocumentUploadCardProps) {
    const handlePick = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
                selectionLimit: 1,
            });
            if (result.didCancel) return;
            if (result.errorCode) {
                Alert.alert('Upload failed', result.errorMessage ?? 'Could not open the gallery.');
                return;
            }
            const asset = result.assets?.[0];
            if (asset?.uri) onChange(asset.uri);
        } catch {
            Alert.alert('Upload failed', 'Something went wrong while picking the file.');
        }
    };

    return (
        <View style={[styles.card, !!error && styles.cardError]}>
            <Text style={styles.title}>
                {title}
                {required && <Text style={styles.required}> *</Text>}
                {optionalLabel && <Text style={styles.optional}> (Optional)</Text>}
            </Text>

            {uri ? (
                <View style={styles.previewWrap}>
                    <Image source={{ uri }} style={styles.preview} />
                    <TouchableOpacity style={styles.changeBtn} onPress={handlePick} activeOpacity={0.8}>
                        <Ionicons name="refresh" size={13} color={Colors.primaryDark} />
                        <Text style={styles.changeText}>Change</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={styles.uploadBtn} onPress={handlePick} activeOpacity={0.8}>
                    <Ionicons name="cloud-upload-outline" size={16} color={Colors.primaryDark} />
                    <Text style={styles.uploadText}>Upload {title.split(' (')[0]}</Text>
                </TouchableOpacity>
            )}

            {!!error && (
                <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={12} color={Colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        minWidth: '46%',
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        padding: Spacing.md,
        alignItems: 'center',
        gap: Spacing.sm,
    },
    cardError: { borderColor: Colors.danger },
    title: {
        fontSize: 12,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        textAlign: 'center',
    },
    required: { color: Colors.danger },
    optional: { color: Colors.charcoalLight, fontWeight: Typography.regular },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        borderRadius: Radii.full,
        paddingVertical: 9,
        paddingHorizontal: Spacing.md,
    },
    uploadText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.primaryDark },
    previewWrap: { alignItems: 'center', gap: Spacing.xs, width: '100%' },
    preview: {
        width: '100%',
        height: 80,
        borderRadius: Radii.sm,
        backgroundColor: Colors.border,
    },
    changeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    changeText: { fontSize: 11, fontWeight: Typography.bold, color: Colors.primaryDark },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    errorText: { fontSize: 10.5, color: Colors.danger, fontWeight: Typography.semiBold, textAlign: 'center' },
});

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radii, Typography } from '@/theme/theme';
import { VendorService } from '@features/otherService/types/VendorService';

type Props = {
    data: Partial<VendorService>;
    onChange: (key: keyof VendorService, value: any) => void;
};

function UploadBox({
    label,
    value,
    onUpload,
    onRemove,
    small,
}: {
    label?: string;
    value?: string;
    onUpload: () => void;
    onRemove?: () => void;
    small?: boolean;
}) {
    if (value) {
        return (
            <TouchableOpacity
                style={[s.uploadBox, small && s.uploadBoxSmall, s.uploadBoxFilled]}
                onPress={onUpload}
                activeOpacity={0.8}
            >
                <Image
                    source={{ uri: value }}
                    style={[s.uploadPreview, small && s.uploadPreviewSmall]}
                />
                {onRemove && (
                    <TouchableOpacity style={s.removeImgBtn} onPress={onRemove} activeOpacity={0.7}>
                        <Ionicons name="close-circle" size={20} color={Colors.danger} />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[s.uploadBox, small && s.uploadBoxSmall]}
            onPress={onUpload}
            activeOpacity={0.8}
        >
            <Ionicons
                name="cloud-upload-outline"
                size={small ? 18 : 24}
                color={Colors.charcoalLight}
            />
            {!small && <Text style={s.uploadText}>Click to upload</Text>}
            {!small && <Text style={s.uploadSubtext}>JPG, PNG, PDF (max 10MB)</Text>}
            {small && <Text style={s.uploadIndexText}>{label}</Text>}
        </TouchableOpacity>
    );
}

export default function Step5Portfolio({ data, onChange }: Props) {
    const images = data.images || [];
    const videoLinks = data.videoLinks || ['', '', ''];
    const workLinks = data.previousWorkLinks || ['', '', ''];

    const updateVideo = (idx: number, val: string) => {
        const updated = [...videoLinks];
        updated[idx] = val;
        onChange('videoLinks', updated);
    };

    const updateWork = (idx: number, val: string) => {
        const updated = [...workLinks];
        updated[idx] = val;
        onChange('previousWorkLinks', updated);
    };

    const handleImageUpload = (idx: number) => {
        // In real app: launch image picker
        console.log('Upload image slot', idx);
    };

    const handleFeaturedUpload = () => {
        console.log('Upload featured image');
    };

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.container}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={s.sectionTitle}>Portfolio & Gallery</Text>

            {/* Featured Photo */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>
                    Featured Photo (max 1) <Text style={s.required}>*</Text>
                </Text>
                <UploadBox
                    value={data.featuredImage}
                    onUpload={handleFeaturedUpload}
                    onRemove={() => onChange('featuredImage', '')}
                />
            </View>

            {/* Service Photos */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>Service Photos (max 5)</Text>
                <View style={s.photoGrid}>
                    {[0, 1, 2, 3, 4].map(i => (
                        <UploadBox
                            key={i}
                            label={`${i + 1}`}
                            value={images[i]}
                            onUpload={() => handleImageUpload(i)}
                            onRemove={
                                images[i]
                                    ? () => {
                                          const updated = [...images];
                                          updated.splice(i, 1);
                                          onChange('images', updated);
                                      }
                                    : undefined
                            }
                            small
                        />
                    ))}
                </View>
            </View>

            {/* Video Links */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>Video Links (max 3 — YouTube/Facebook/Instagram)</Text>
                {[0, 1, 2].map(i => (
                    <TextInput
                        key={i}
                        style={[s.input, i < 2 && s.inputGap]}
                        placeholder={`Video link ${i + 1}`}
                        placeholderTextColor={Colors.charcoalLight}
                        keyboardType="url"
                        autoCapitalize="none"
                        value={videoLinks[i] || ''}
                        onChangeText={v => updateVideo(i, v)}
                    />
                ))}
            </View>

            {/* Previous Event Links */}
            <View style={s.fieldWrap}>
                <Text style={s.label}>Previous Event Links (max 3)</Text>
                {[0, 1, 2].map(i => (
                    <TextInput
                        key={i}
                        style={[s.input, i < 2 && s.inputGap]}
                        placeholder={`Work link ${i + 1}`}
                        placeholderTextColor={Colors.charcoalLight}
                        keyboardType="url"
                        autoCapitalize="none"
                        value={workLinks[i] || ''}
                        onChangeText={v => updateWork(i, v)}
                    />
                ))}
            </View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { paddingBottom: Spacing.xl },
    sectionTitle: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        marginBottom: Spacing.xl,
    },
    fieldWrap: { marginBottom: Spacing.xl },
    label: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
        marginBottom: Spacing.sm,
    },
    required: { color: Colors.danger },

    uploadBox: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xxl,
        backgroundColor: Colors.surface,
        gap: Spacing.xs,
    },
    uploadBoxSmall: {
        paddingVertical: Spacing.md,
        flex: 1,
        gap: 4,
    },
    uploadBoxFilled: {
        borderStyle: 'solid',
        padding: 0,
        overflow: 'hidden',
    },
    uploadPreview: {
        width: '100%',
        height: 160,
        borderRadius: Radii.sm,
        backgroundColor: Colors.border,
    },
    uploadPreviewSmall: { height: 72 },
    removeImgBtn: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: Colors.surface,
        borderRadius: 12,
    },

    uploadText: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    uploadSubtext: {
        fontSize: 10,
        color: Colors.charcoalLight,
    },
    uploadIndexText: {
        fontSize: 10,
        color: Colors.charcoalLight,
        fontWeight: Typography.bold,
    },

    photoGrid: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },

    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        fontSize: Typography.base,
        color: Colors.charcoal,
        backgroundColor: Colors.surface,
    },
    inputGap: { marginBottom: Spacing.sm },
});

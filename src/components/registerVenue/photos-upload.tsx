import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme/theme';
import { StepHeader, SectionCard, NavButtons } from '../UI/shared-components';

const PHOTO_SECTIONS = [
    { key: 'featured', label: 'Featured Photo', required: true },
    { key: 'exterior', label: 'Exterior/Entrance', required: true },
    { key: 'interior', label: 'Interior Space', required: true },
    { key: 'amenities', label: 'Amenities', required: true },
    { key: 'additional', label: 'Additional Areas', required: false },
];

const REQUIREMENTS = [
    'Minimum 5 photos, Maximum 20 photos',
    'Format: JPG, PNG only',
    'Max file size: 5MB per photo',
    'Recommended resolution: 1200×800 pixels or higher',
    'Clear, well-lit photos showing venue features',
];

interface Props {
    onPrev: () => void;
    onNext: () => void;
}

export default function Step5Photos({ onPrev, onNext }: Props) {
    const [counts, setCounts] = useState<Record<string, number>>({});

    const handleUpload = (key: string) => {
        // In production: launch image picker here
        setCounts(p => ({ ...p, [key]: (p[key] || 0) + 1 }));
    };

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
        >
            <StepHeader title="Step 5: Photos" current={5} />

            {/* Info banner */}
            <View style={s.banner}>
                <View style={s.bannerIcon}>
                    <Ionicons name="images-outline" size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={s.bannerTitle}>Photo Gallery</Text>
                    <Text style={s.bannerSub}>
                        Upload high-quality photos of your venue. Photos are uploaded directly to
                        cloud storage.
                    </Text>
                </View>
            </View>

            {/* Upload rows */}
            <SectionCard>
                {PHOTO_SECTIONS.map((sec, idx) => {
                    const count = counts[sec.key] || 0;
                    const isDone = count > 0;
                    return (
                        <View
                            key={sec.key}
                            style={[s.photoRow, idx < PHOTO_SECTIONS.length - 1 && s.photoBorder]}
                        >
                            <View style={s.photoLeft}>
                                <View style={[s.photoIconWrap, isDone && s.photoIconWrapDone]}>
                                    <Ionicons
                                        name={isDone ? 'checkmark' : 'image-outline'}
                                        size={16}
                                        color={isDone ? Colors.success : Colors.charcoalLight}
                                    />
                                </View>
                                <View>
                                    <Text style={s.photoLabel}>
                                        {sec.label}
                                        {sec.required && <Text style={s.req}> *</Text>}
                                    </Text>
                                    <Text style={[s.photoCount, isDone && s.photoCountDone]}>
                                        {count} photo{count !== 1 ? 's' : ''} uploaded
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[s.uploadBtn, isDone && s.uploadBtnDone]}
                                onPress={() => handleUpload(sec.key)}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name="cloud-upload-outline"
                                    size={14}
                                    color={isDone ? Colors.success : Colors.primary}
                                />
                                <Text style={[s.uploadText, isDone && s.uploadTextDone]}>
                                    {isDone ? 'Add More' : 'Upload'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </SectionCard>

            {/* Requirements box */}
            <View style={s.reqBox}>
                <View style={s.reqTitleRow}>
                    <Ionicons
                        name="information-circle-outline"
                        size={15}
                        color={Colors.charcoalLight}
                    />
                    <Text style={s.reqTitle}>Photo Requirements:</Text>
                </View>
                {REQUIREMENTS.map((r, i) => (
                    <View key={i} style={s.reqRow}>
                        <Text style={s.bullet}>•</Text>
                        <Text style={s.reqText}>{r}</Text>
                    </View>
                ))}
            </View>

            <NavButtons onPrev={onPrev} onNext={onNext} nextLabel="Skip & Continue" />
        </ScrollView>
    );
}

const s = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        padding: Spacing.md,
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderLeftWidth: 4,
        borderColor: Colors.primaryBorder,
        borderLeftColor: Colors.primary,
    },
    bannerIcon: {
        width: 34,
        height: 34,
        borderRadius: Radii.sm,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerTitle: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    bannerSub: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        marginTop: 2,
        lineHeight: 17,
    },

    // Photo rows
    photoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.lg,
        gap: Spacing.md,
    },
    photoBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    photoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        flex: 1,
    },
    photoIconWrap: {
        width: 38,
        height: 38,
        borderRadius: Radii.sm,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    photoIconWrapDone: {
        backgroundColor: Colors.successLight,
        borderColor: Colors.success,
    },
    photoLabel: {
        fontSize: Typography.md,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    req: { color: Colors.danger },
    photoCount: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        marginTop: 2,
    },
    photoCountDone: { color: Colors.success },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    uploadBtnDone: { borderColor: Colors.success },
    uploadText: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },
    uploadTextDone: { color: Colors.success },

    // Requirements
    reqBox: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        padding: Spacing.md,
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    reqTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    reqTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
    },
    reqRow: {
        flexDirection: 'row',
        gap: Spacing.xs,
        marginBottom: 4,
    },
    bullet: { fontSize: Typography.base, color: Colors.charcoalLight },
    reqText: {
        flex: 1,
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        lineHeight: 18,
    },
});

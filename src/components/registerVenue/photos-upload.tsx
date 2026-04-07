import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    Pressable,
    Platform,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
    launchCamera,
    launchImageLibrary,
    ImagePickerResponse,
    Asset,
} from 'react-native-image-picker';
import { Colors, Typography, Spacing, Radii } from '../../theme/theme';
import { StepHeader, SectionCard, NavButtons } from '../UI/shared-components';
import { imageAPI } from '../../service/apis/images';
import { VenueFormData } from '../../types/Venue';

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
    data: VenueFormData['photos'];
    onChange: (data: VenueFormData['photos']) => void;
    onPrev: () => void;
    onNext: () => void;
}

export default function Step5Photos({ data, onChange, onPrev, onNext }: Props) {
    const [pickerTarget, setPickerTarget] = useState<string | null>(null);
    const pickerTargetRef = useRef<string | null>(null);
    const [uploading, setUploading] = useState<Record<string, boolean>>({});

    // Derived count per section from shared data
    const counts = PHOTO_SECTIONS.reduce<Record<string, number>>((acc, sec) => {
        acc[sec.key] = data.uploadedImages.filter(i => i.sectionKey === sec.key).length;
        return acc;
    }, {});

    const handleUpload = (key: string) => {
        pickerTargetRef.current = key;
        setPickerTarget(key);
    };
    const closeSheet = () => setPickerTarget(null);

    const onPickerResult = async (response: ImagePickerResponse) => {
        const key = pickerTargetRef.current!;
        closeSheet();
        if (response.didCancel || response.errorCode || !response.assets?.length) return;

        setUploading(p => ({ ...p, [key]: true }));
        let newImages = [...data.uploadedImages];

        for (const asset of response.assets) {
            try {
                if (!asset.base64) {
                    console.warn('No base64 on asset');
                    continue;
                }
                const base64DataUri = `data:${asset.type ?? 'image/jpeg'};base64,${asset.base64}`;
                const res = await imageAPI.uploadImage({ file: base64DataUri, folder: 'venues' });
                if (res?.success)
                    newImages = [
                        ...newImages,
                        { url: res.url, publicId: res.publicId, sectionKey: key },
                    ];
            } catch (e: any) {
                console.error('IMAGE UPLOAD ERROR:', e);
            }
        }

        onChange({ uploadedImages: newImages });
        setUploading(p => ({ ...p, [key]: false }));
    };

    const handleTakePhoto = () =>
        launchCamera(
            { mediaType: 'photo', saveToPhotos: true, quality: 0.8, includeBase64: true },
            onPickerResult,
        );
    const handleChooseGallery = () =>
        launchImageLibrary(
            { mediaType: 'photo', selectionLimit: 10, quality: 0.8, includeBase64: true },
            onPickerResult,
        );

    return (
        <>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                <StepHeader title="Step 5: Photos" current={5} />
                <View style={s.banner}>
                    <View style={s.bannerIcon}>
                        <Ionicons name="images-outline" size={18} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.bannerTitle}>Photo Gallery</Text>
                        <Text style={s.bannerSub}>
                            Upload high-quality photos of your venue. Photos are uploaded directly
                            to cloud storage.
                        </Text>
                    </View>
                </View>

                <SectionCard>
                    {PHOTO_SECTIONS.map((sec, idx) => {
                        const count = counts[sec.key] || 0;
                        const isDone = count > 0;
                        const isUploading = uploading[sec.key] ?? false;
                        return (
                            <View
                                key={sec.key}
                                style={[
                                    s.photoRow,
                                    idx < PHOTO_SECTIONS.length - 1 && s.photoBorder,
                                ]}
                            >
                                <View style={s.photoLeft}>
                                    <View style={[s.photoIconWrap, isDone && s.photoIconWrapDone]}>
                                        {isUploading ? (
                                            <ActivityIndicator
                                                size="small"
                                                color={Colors.primary}
                                            />
                                        ) : (
                                            <Ionicons
                                                name={isDone ? 'checkmark' : 'image-outline'}
                                                size={16}
                                                color={
                                                    isDone ? Colors.success : Colors.charcoalLight
                                                }
                                            />
                                        )}
                                    </View>
                                    <View>
                                        <Text style={s.photoLabel}>
                                            {sec.label}
                                            {sec.required && <Text style={s.req}> *</Text>}
                                        </Text>
                                        <Text style={[s.photoCount, isDone && s.photoCountDone]}>
                                            {isUploading
                                                ? 'Uploading…'
                                                : `${count} photo${
                                                      count !== 1 ? 's' : ''
                                                  } uploaded`}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        s.uploadBtn,
                                        isDone && s.uploadBtnDone,
                                        isUploading && s.uploadBtnDisabled,
                                    ]}
                                    onPress={() => !isUploading && handleUpload(sec.key)}
                                    activeOpacity={0.8}
                                    disabled={isUploading}
                                >
                                    <Ionicons
                                        name="cloud-upload-outline"
                                        size={14}
                                        color={
                                            isUploading
                                                ? Colors.charcoalLight
                                                : isDone
                                                ? Colors.success
                                                : Colors.primary
                                        }
                                    />
                                    <Text
                                        style={[
                                            s.uploadText,
                                            isDone && s.uploadTextDone,
                                            isUploading && s.uploadTextDisabled,
                                        ]}
                                    >
                                        {isUploading
                                            ? 'Uploading…'
                                            : isDone
                                            ? 'Add More'
                                            : 'Upload'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </SectionCard>

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

            <Modal
                visible={pickerTarget !== null}
                transparent
                animationType="slide"
                onRequestClose={closeSheet}
                statusBarTranslucent
            >
                <Pressable style={s.backdrop} onPress={closeSheet} />
                <View style={s.sheet}>
                    <View style={s.handle} />
                    <Text style={s.sheetTitle}>Add Photo</Text>
                    <Text style={s.sheetSub}>
                        Choose how you'd like to add a photo for this section.
                    </Text>

                    <TouchableOpacity
                        style={s.sheetOption}
                        onPress={handleTakePhoto}
                        activeOpacity={0.75}
                    >
                        <View style={[s.sheetIconWrap, { backgroundColor: Colors.primaryLight }]}>
                            <Ionicons name="camera-outline" size={22} color={Colors.primary} />
                        </View>
                        <View style={s.sheetOptionText}>
                            <Text style={s.sheetOptionTitle}>Take Photo</Text>
                            <Text style={s.sheetOptionSub}>Use your camera to capture now</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={Colors.charcoalLight} />
                    </TouchableOpacity>
                    <View style={s.sheetDivider} />
                    <TouchableOpacity
                        style={s.sheetOption}
                        onPress={handleChooseGallery}
                        activeOpacity={0.75}
                    >
                        <View style={[s.sheetIconWrap, { backgroundColor: '#EDE9FE' }]}>
                            <Ionicons name="images-outline" size={22} color="#7C3AED" />
                        </View>
                        <View style={s.sheetOptionText}>
                            <Text style={s.sheetOptionTitle}>Choose from Gallery</Text>
                            <Text style={s.sheetOptionSub}>Pick existing photos from device</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={Colors.charcoalLight} />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.cancelBtn} onPress={closeSheet} activeOpacity={0.8}>
                        <Text style={s.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </>
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
    bannerTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.charcoal },
    bannerSub: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        marginTop: 2,
        lineHeight: 17,
    },
    photoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.lg,
        gap: Spacing.md,
    },
    photoBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    photoLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
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
    photoIconWrapDone: { backgroundColor: Colors.successLight, borderColor: Colors.success },
    photoLabel: {
        fontSize: Typography.md,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    req: { color: Colors.danger },
    photoCount: { fontSize: Typography.sm, color: Colors.charcoalLight, marginTop: 2 },
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
    uploadBtnDisabled: { borderColor: Colors.border },
    uploadText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.primary },
    uploadTextDone: { color: Colors.success },
    uploadTextDisabled: { color: Colors.charcoalLight },
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
    reqTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.charcoalMid },
    reqRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: 4 },
    bullet: { fontSize: Typography.base, color: Colors.charcoalLight },
    reqText: { flex: 1, fontSize: Typography.sm, color: Colors.charcoalLight, lineHeight: 18 },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: {
        backgroundColor: Colors.surface ?? '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        paddingTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 16,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border ?? '#E5E7EB',
        alignSelf: 'center',
        marginBottom: Spacing.lg,
    },
    sheetTitle: {
        fontSize: Typography.lg ?? 18,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginBottom: 4,
    },
    sheetSub: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        marginBottom: Spacing.lg,
        lineHeight: 18,
    },
    sheetOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.md,
    },
    sheetIconWrap: {
        width: 48,
        height: 48,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sheetOptionText: { flex: 1 },
    sheetOptionTitle: {
        fontSize: Typography.md,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    sheetOptionSub: { fontSize: Typography.sm, color: Colors.charcoalLight, marginTop: 2 },
    sheetDivider: { height: 1, backgroundColor: Colors.border ?? '#F3F4F6', marginVertical: 2 },
    cancelBtn: {
        marginTop: Spacing.md,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        backgroundColor: Colors.background ?? '#F9FAFB',
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border ?? '#E5E7EB',
    },
    cancelText: {
        fontSize: Typography.md,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid ?? Colors.charcoalLight,
    },
});

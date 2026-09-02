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
    Image,
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
    launchCamera,
    launchImageLibrary,
    ImagePickerResponse,
    Asset,
} from 'react-native-image-picker';
import { Colors, Typography, Spacing, Radii } from '../../../theme/theme';
import { StepHeader, SectionCard, NavButtons } from '../../../components/UI/shared-components';
import { VenueFormData, UploadedImage } from '../types/VenueFormData';
import { useUploadImage } from '../hooks/useUpload';
import { useAlert } from '@/context/AlertContext';

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

const MIN_TOTAL_PHOTOS = 5;
const MAX_TOTAL_PHOTOS = 20;

interface Props {
    data: VenueFormData['photos'];
    onChange: (data: VenueFormData['photos']) => void;
    onPrev: () => void;
    onNext: () => void;
}

export default function Step5Photos({ data, onChange, onPrev, onNext }: Props) {
    const alert = useAlert();
    const { mutateAsync: uploadImageAsync } = useUploadImage();
    const [pickerTarget, setPickerTarget] = useState<string | null>(null);
    const pickerTargetRef = useRef<string | null>(null);
    const [uploading, setUploading] = useState<Record<string, boolean>>({});
    const [removing, setRemoving] = useState<Record<string, boolean>>({});
    // Tracks whether the user has attempted to continue, so we only show
    // inline "required" errors after a submit attempt (not on first render).
    const [attemptedNext, setAttemptedNext] = useState(false);

    // Derived count per section from shared data
    const counts = PHOTO_SECTIONS.reduce<Record<string, number>>((acc, sec) => {
        acc[sec.key] = data.uploadedImages.filter(i => i.sectionKey === sec.key).length;
        return acc;
    }, {});

    const totalCount = data.uploadedImages.length;

    // Sections that are required but currently have zero photos.
    const missingRequiredSections = PHOTO_SECTIONS.filter(
        sec => sec.required && (counts[sec.key] || 0) === 0,
    );

    const imagesFor = (key: string) => data.uploadedImages.filter(i => i.sectionKey === key);

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
                const res = await uploadImageAsync({ file: base64DataUri, folder: 'venues' });
                if (res?.success)
                    newImages = [
                        ...newImages,
                        { url: res.url, publicId: res.publicId, sectionKey: key },
                    ];
            } catch (e: any) {
                console.error('IMAGE UPLOAD ERROR:', e);
                if(e?.status === 413) {
                    alert.error('Upload failed',' Image too large. Please select a smaller image (max 5MB).');
                } else {
                    alert.error('Upload failed', e?.message || 'Error uploading image. Please try again.');
                }
            }
        }

        onChange({ uploadedImages: newImages });
        setUploading(p => ({ ...p, [key]: false }));
    };

    const handleTakePhoto = () =>
        launchCamera(
            { mediaType: 'photo', saveToPhotos: true, quality: 0.4, includeBase64: true },
            onPickerResult,
        );
    const handleChooseGallery = () =>
        launchImageLibrary(
            { mediaType: 'photo', selectionLimit: 10, quality: 0.4, includeBase64: true },
            onPickerResult,
        );

    // ── Remove an uploaded photo ─────────────────────────────────────────────
    const confirmRemove = (image: UploadedImage) => {
        alert.show({
            title: 'Remove Photo',
            message: 'Are you sure you want to remove this photo?',
            buttons: [
                {label: 'Cancel', style: 'ghost', onPress: () => {alert.dismiss()}},
                {label: 'Remove', style: 'danger', onPress: () => {
                    removeImage(image);
                    alert.dismiss();
                }},
            ]
        })

    };

    const removeImage = async (image: UploadedImage) => {
        setRemoving(p => ({ ...p, [image.publicId]: true }));
        try {
            onChange({
                uploadedImages: data.uploadedImages.filter(i => i.publicId !== image.publicId),
            });
        } catch (e: any) {
            console.error('IMAGE REMOVE ERROR:', e);
        } finally {
            setRemoving(p => ({ ...p, [image.publicId]: false }));
        }
    };

    // ── Validation ────────────────────────────────────────────────────────
    // Returns a user-facing error message, or null if everything is valid.
    const validate = (): string | null => {
        if (missingRequiredSections.length > 0) {
            const labels = missingRequiredSections.map(s => s.label).join(', ');
            return `Please add at least one photo for: ${labels}.`;
        }
        if (totalCount < MIN_TOTAL_PHOTOS) {
            return `Please upload at least ${MIN_TOTAL_PHOTOS} photos in total (you have ${totalCount}).`;
        }
        if (totalCount > MAX_TOTAL_PHOTOS) {
            return `You can upload a maximum of ${MAX_TOTAL_PHOTOS} photos in total (you have ${totalCount}).`;
        }
        return null;
    };

    const handleNext = () => {
        setAttemptedNext(true);
        const error = validate();
        if (error) {
            alert.error('Missing required photos', error);
            return;
        }
        onNext();
    };

    return (
        <>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {/* <StepHeader title="Step 5: Photos" current={5} /> */}
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
                        const sectionImages = imagesFor(sec.key);
                        const showError = attemptedNext && sec.required && !isDone;
                        return (
                            <View
                                key={sec.key}
                                style={[
                                    s.photoRow,
                                    idx < PHOTO_SECTIONS.length - 1 && s.photoBorder,
                                ]}
                            >
                                <View style={s.photoTopRow}>
                                    <View style={s.photoLeft}>
                                        <View
                                            style={[
                                                s.photoIconWrap,
                                                isDone && s.photoIconWrapDone,
                                                showError && s.photoIconWrapError,
                                            ]}
                                        >
                                            {isUploading ? (
                                                <ActivityIndicator
                                                    size="small"
                                                    color={Colors.primary}
                                                />
                                            ) : (
                                                <Ionicons
                                                    name={
                                                        isDone
                                                            ? 'checkmark'
                                                            : showError
                                                            ? 'alert-circle-outline'
                                                            : 'image-outline'
                                                    }
                                                    size={16}
                                                    color={
                                                        isDone
                                                            ? Colors.success
                                                            : showError
                                                            ? Colors.danger
                                                            : Colors.charcoalLight
                                                    }
                                                />
                                            )}
                                        </View>
                                        <View>
                                            <Text style={s.photoLabel}>
                                                {sec.label}
                                                {sec.required && <Text style={s.req}> *</Text>}
                                            </Text>
                                            <Text
                                                style={[
                                                    s.photoCount,
                                                    isDone && s.photoCountDone,
                                                    showError && s.photoCountError,
                                                ]}
                                            >
                                                {isUploading
                                                    ? 'Uploading…'
                                                    : showError
                                                    ? 'Required — add at least 1 photo'
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
                                            showError && s.uploadBtnError,
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
                                                    : showError
                                                    ? Colors.danger
                                                    : Colors.primary
                                            }
                                        />
                                        <Text
                                            style={[
                                                s.uploadText,
                                                isDone && s.uploadTextDone,
                                                isUploading && s.uploadTextDisabled,
                                                showError && s.uploadTextError,
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

                                {/* ── Thumbnails with remove option ── */}
                                {sectionImages.length > 0 && (
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={s.thumbRow}
                                        contentContainerStyle={{ gap: Spacing.sm }}
                                    >
                                        {sectionImages.map(img => {
                                            const isRemoving = removing[img.publicId] ?? false;
                                            return (
                                                <View key={img.publicId} style={s.thumbWrap}>
                                                    <Image
                                                        source={{ uri: img.url }}
                                                        style={s.thumbImage}
                                                        resizeMode="cover"
                                                    />
                                                    {isRemoving ? (
                                                        <View style={s.thumbOverlay}>
                                                            <ActivityIndicator
                                                                size="small"
                                                                color={Colors.white}
                                                            />
                                                        </View>
                                                    ) : (
                                                        <TouchableOpacity
                                                            style={s.thumbRemoveBtn}
                                                            onPress={() => confirmRemove(img)}
                                                            hitSlop={{
                                                                top: 6,
                                                                bottom: 6,
                                                                left: 6,
                                                                right: 6,
                                                            }}
                                                            activeOpacity={0.8}
                                                        >
                                                            <Ionicons
                                                                name="close"
                                                                size={12}
                                                                color={Colors.white}
                                                            />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </ScrollView>
                                )}
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

                {/* Overall total-count error, shown separately from per-section errors */}
                {attemptedNext &&
                    missingRequiredSections.length === 0 &&
                    (totalCount < MIN_TOTAL_PHOTOS || totalCount > MAX_TOTAL_PHOTOS) && (
                        <View style={s.totalErrorBox}>
                            <Ionicons name="alert-circle-outline" size={15} color={Colors.danger} />
                            <Text style={s.totalErrorText}>
                                {totalCount < MIN_TOTAL_PHOTOS
                                    ? `Upload at least ${MIN_TOTAL_PHOTOS} photos in total (you have ${totalCount}).`
                                    : `Maximum of ${MAX_TOTAL_PHOTOS} photos allowed (you have ${totalCount}).`}
                            </Text>
                        </View>
                    )}

                <NavButtons onPrev={onPrev} onNext={handleNext} nextLabel="Continue" />
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
        paddingVertical: Spacing.lg,
    },
    photoBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    photoTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.md,
    },
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
    photoIconWrapError: { backgroundColor: Colors.dangerLight ?? '#FEE2E2', borderColor: Colors.danger },
    photoLabel: {
        fontSize: Typography.md,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    req: { color: Colors.danger },
    photoCount: { fontSize: Typography.sm, color: Colors.charcoalLight, marginTop: 2 },
    photoCountDone: { color: Colors.success },
    photoCountError: { color: Colors.danger, fontWeight: Typography.semiBold },
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
    uploadBtnError: { borderColor: Colors.danger },
    uploadText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.primary },
    uploadTextDone: { color: Colors.success },
    uploadTextDisabled: { color: Colors.charcoalLight },
    uploadTextError: { color: Colors.danger },

    // ── Thumbnails ──
    thumbRow: { marginTop: Spacing.md },
    thumbWrap: {
        width: 72,
        height: 72,
        borderRadius: Radii.sm,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
    },
    thumbImage: { width: '100%', height: '100%' },
    thumbRemoveBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumbOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },

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

    totalErrorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        padding: Spacing.md,
        backgroundColor: Colors.dangerLight ?? '#FEE2E2',
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.danger,
    },
    totalErrorText: { flex: 1, fontSize: Typography.sm, color: Colors.danger },

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
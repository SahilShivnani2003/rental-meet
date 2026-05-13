import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    Image,
    Modal,
    Animated,
    Platform,
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radii, Typography } from '@/theme/theme';
import { VendorService } from '@features/otherService/types/VendorService';

// ─── Install these packages ────────────────────────────────────────────────
// npm install react-native-image-picker @react-native-documents/picker
// npx pod-install (iOS)
// Add permissions to AndroidManifest.xml and Info.plist as shown in comments below.
//
// AndroidManifest.xml:
//   <uses-permission android:name="android.permission.CAMERA" />
//   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
//   <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" /> (API 33+)
//
// Info.plist:
//   NSCameraUsageDescription
//   NSPhotoLibraryUsageDescription
// ──────────────────────────────────────────────────────────────────────────
import {
    launchCamera,
    launchImageLibrary,
    ImagePickerResponse,
    Asset,
} from 'react-native-image-picker';
import {
    pick as pickDoc,
    types as DocTypes,
    isErrorWithCode,
    errorCodes,
} from '@react-native-documents/picker';

// ─── Types ─────────────────────────────────────────────────────────────────

type PickerTarget = 'featured' | { slot: number };

type PickerAction = 'camera' | 'gallery' | 'file';

type Props = {
    data: Partial<VendorService>;
    onChange: (key: keyof VendorService, value: any) => void;
};

// ─── Media Source Action Sheet ─────────────────────────────────────────────

const ACTIONS: { id: PickerAction; icon: string; label: string; sub: string }[] = [
    { id: 'camera', icon: 'camera-outline', label: 'Camera', sub: 'Take a new photo' },
    { id: 'gallery', icon: 'images-outline', label: 'Photo Library', sub: 'Choose from gallery' },
    { id: 'file', icon: 'document-text-outline', label: 'Files', sub: 'PDF, DOC, JPG…' },
];

function MediaPickerSheet({
    visible,
    onClose,
    onSelect,
}: {
    visible: boolean;
    onClose: () => void;
    onSelect: (action: PickerAction) => void;
}) {
    const slideAnim = useRef(new Animated.Value(300)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                damping: 18,
                stiffness: 160,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 300,
                duration: 220,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <TouchableOpacity style={sheet.backdrop} activeOpacity={1} onPress={onClose} />

            <Animated.View style={[sheet.container, { transform: [{ translateY: slideAnim }] }]}>
                {/* Handle bar */}
                <View style={sheet.handle} />

                <Text style={sheet.title}>Add Media</Text>
                <Text style={sheet.subtitle}>Choose how you'd like to upload</Text>

                <View style={sheet.grid}>
                    {ACTIONS.map(action => (
                        <TouchableOpacity
                            key={action.id}
                            style={sheet.actionCard}
                            onPress={() => {
                                onClose();
                                setTimeout(() => onSelect(action.id), 300);
                            }}
                            activeOpacity={0.75}
                        >
                            <View style={sheet.iconCircle}>
                                <Ionicons
                                    name={action.icon}
                                    size={26}
                                    color={Colors.primary ?? '#6C63FF'}
                                />
                            </View>
                            <Text style={sheet.actionLabel}>{action.label}</Text>
                            <Text style={sheet.actionSub}>{action.sub}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={sheet.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                    <Text style={sheet.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </Animated.View>
        </Modal>
    );
}

// ─── Upload Box ────────────────────────────────────────────────────────────

function UploadBox({
    label,
    value,
    onPress,
    onRemove,
    small,
    isDocument,
}: {
    label?: string;
    value?: string;
    onPress: () => void;
    onRemove?: () => void;
    small?: boolean;
    isDocument?: boolean;
}) {
    const isDoc =
        isDocument ||
        (value && !value.startsWith('http') && !value.startsWith('file') && value.includes('.'));

    if (value) {
        return (
            <TouchableOpacity
                style={[s.uploadBox, small && s.uploadBoxSmall, s.uploadBoxFilled]}
                onPress={onPress}
                activeOpacity={0.8}
            >
                {isDoc ? (
                    <View style={s.docPreview}>
                        <Ionicons
                            name="document-text"
                            size={small ? 22 : 36}
                            color={Colors.primary ?? '#6C63FF'}
                        />
                        <Text style={[s.docName, small && s.docNameSmall]} numberOfLines={2}>
                            {value.split('/').pop()}
                        </Text>
                    </View>
                ) : (
                    <Image
                        source={{ uri: value }}
                        style={[s.uploadPreview, small && s.uploadPreviewSmall]}
                        resizeMode="cover"
                    />
                )}
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
            onPress={onPress}
            activeOpacity={0.8}
        >
            {small ? (
                <>
                    <Ionicons name="add-circle-outline" size={20} color={Colors.charcoalLight} />
                    <Text style={s.uploadIndexText}>{label}</Text>
                </>
            ) : (
                <>
                    <View style={s.uploadIconWrap}>
                        <Ionicons
                            name="cloud-upload-outline"
                            size={30}
                            color={Colors.primary ?? '#6C63FF'}
                        />
                    </View>
                    <Text style={s.uploadText}>Tap to upload</Text>
                    <View style={s.uploadBadges}>
                        {['Camera', 'Gallery', 'Files'].map(b => (
                            <View key={b} style={s.badge}>
                                <Text style={s.badgeText}>{b}</Text>
                            </View>
                        ))}
                    </View>
                    <Text style={s.uploadSubtext}>JPG, PNG, PDF (max 10 MB)</Text>
                </>
            )}
        </TouchableOpacity>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function Step5Portfolio({ data, onChange }: Props) {
    const images = data.images || [];
    const videoLinks = data.videoLinks || ['', '', ''];
    const workLinks = data.previousWorkLinks || ['', '', ''];

    const [sheetVisible, setSheetVisible] = useState(false);
    const currentTarget = useRef<PickerTarget | null>(null);

    // ── Open sheet ────────────────────────────────────────────────────────
    const openSheet = (target: PickerTarget) => {
        currentTarget.current = target;
        setSheetVisible(true);
    };

    // ── Handle media pick ─────────────────────────────────────────────────
    const handlePickerAction = async (action: PickerAction) => {
        try {
            if (action === 'camera') {
                await pickFromCamera();
            } else if (action === 'gallery') {
                await pickFromGallery();
            } else {
                await pickDocument();
            }
        } catch (err: any) {
            if (!isErrorWithCode(err)) {
                Alert.alert('Upload failed', err?.message ?? 'Something went wrong.');
            }
        }
    };

    const commitUri = (uri: string) => {
        const target = currentTarget.current;
        if (!target) return;

        if (target === 'featured') {
            onChange('featuredImage', uri);
        } else {
            const updated = [...images];
            updated[target.slot] = uri;
            onChange('images', updated);
        }
    };

    const pickFromCamera = async () => {
        const response: ImagePickerResponse = await launchCamera({
            mediaType: 'photo',
            quality: 0.8,
            saveToPhotos: false,
        });
        const asset: Asset | undefined = response.assets?.[0];
        if (asset?.uri) commitUri(asset.uri);
    };

    const pickFromGallery = async () => {
        const response: ImagePickerResponse = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
            selectionLimit: 1,
        });
        const asset: Asset | undefined = response.assets?.[0];
        if (asset?.uri) commitUri(asset.uri);
    };

    const pickDocument = async () => {
        const results = await pickDoc({
            allowMultiSelection: false,
            type: [DocTypes.images, DocTypes.pdf],
        });
        const uri = results[0]?.uri;
        if (uri) commitUri(uri);
    };

    // ── Helpers ────────────────────────────────────────────────────────────
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

    const removeImage = (i: number) => {
        const updated = [...images];
        updated.splice(i, 1);
        onChange('images', updated);
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.container}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={s.headerRow}>
                    <View style={s.headerIcon}>
                        <Ionicons name="images" size={18} color="#fff" />
                    </View>
                    <View>
                        <Text style={s.sectionTitle}>Portfolio & Gallery</Text>
                        <Text style={s.sectionSub}>Showcase your best work</Text>
                    </View>
                </View>

                {/* ── Featured Photo ────────────────────────────────────── */}
                <View style={s.fieldWrap}>
                    <View style={s.labelRow}>
                        <Text style={s.label}>Featured Photo</Text>
                        <View style={s.requiredBadge}>
                            <Text style={s.requiredBadgeText}>Required</Text>
                        </View>
                    </View>
                    <Text style={s.fieldHint}>This is the first image clients will see.</Text>
                    <UploadBox
                        value={data.featuredImage}
                        onPress={() => openSheet('featured')}
                        onRemove={
                            data.featuredImage ? () => onChange('featuredImage', '') : undefined
                        }
                    />
                </View>

                {/* ── Service Photos ─────────────────────────────────────── */}
                <View style={s.fieldWrap}>
                    <View style={s.labelRow}>
                        <Text style={s.label}>Service Photos</Text>
                        <Text style={s.countBadge}>{images.length}/5</Text>
                    </View>
                    <Text style={s.fieldHint}>Up to 5 photos showing your service in action.</Text>
                    <View style={s.photoGrid}>
                        {[0, 1, 2, 3, 4].map(i => (
                            <UploadBox
                                key={i}
                                label={`${i + 1}`}
                                value={images[i]}
                                onPress={() => openSheet({ slot: i })}
                                onRemove={images[i] ? () => removeImage(i) : undefined}
                                small
                            />
                        ))}
                    </View>
                </View>

                {/* ── Video Links ───────────────────────────────────────── */}
                <View style={s.fieldWrap}>
                    <View style={s.labelRow}>
                        <Text style={s.label}>Video Links</Text>
                        <Text style={s.optionalTag}>Optional</Text>
                    </View>
                    <Text style={s.fieldHint}>YouTube, Facebook, or Instagram (max 3)</Text>
                    {[0, 1, 2].map(i => (
                        <View key={i} style={[s.inputWrap, i < 2 && s.inputGap]}>
                            <Ionicons
                                name="play-circle-outline"
                                size={18}
                                color={Colors.charcoalLight}
                                style={s.inputIcon}
                            />
                            <TextInput
                                style={s.input}
                                placeholder={`Video link ${i + 1}`}
                                placeholderTextColor={Colors.charcoalLight}
                                keyboardType="url"
                                autoCapitalize="none"
                                value={videoLinks[i] || ''}
                                onChangeText={v => updateVideo(i, v)}
                            />
                        </View>
                    ))}
                </View>

                {/* ── Previous Event Links ─────────────────────────────── */}
                <View style={s.fieldWrap}>
                    <View style={s.labelRow}>
                        <Text style={s.label}>Previous Event Links</Text>
                        <Text style={s.optionalTag}>Optional</Text>
                    </View>
                    <Text style={s.fieldHint}>
                        Links to past events or project showcases (max 3)
                    </Text>
                    {[0, 1, 2].map(i => (
                        <View key={i} style={[s.inputWrap, i < 2 && s.inputGap]}>
                            <Ionicons
                                name="link-outline"
                                size={18}
                                color={Colors.charcoalLight}
                                style={s.inputIcon}
                            />
                            <TextInput
                                style={s.input}
                                placeholder={`Work link ${i + 1}`}
                                placeholderTextColor={Colors.charcoalLight}
                                keyboardType="url"
                                autoCapitalize="none"
                                value={workLinks[i] || ''}
                                onChangeText={v => updateWork(i, v)}
                            />
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* ── Media Picker Bottom Sheet ─────────────────────────────── */}
            <MediaPickerSheet
                visible={sheetVisible}
                onClose={() => setSheetVisible(false)}
                onSelect={handlePickerAction}
            />
        </>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const PRIMARY = '#6C63FF';

const s = StyleSheet.create({
    container: { paddingBottom: Spacing.xl },

    // Header
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    sectionSub: {
        fontSize: Typography.xs ?? 11,
        color: Colors.charcoalLight,
        marginTop: 1,
    },

    // Field
    fieldWrap: { marginBottom: Spacing.xl },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: 3,
    },
    label: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    fieldHint: {
        fontSize: 11,
        color: Colors.charcoalLight,
        marginBottom: Spacing.sm,
    },
    requiredBadge: {
        backgroundColor: '#FFF0F0',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    requiredBadgeText: { fontSize: 10, color: Colors.danger, fontWeight: '600' },
    countBadge: {
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    optionalTag: { fontSize: 11, color: Colors.charcoalLight },

    // Upload box (large)
    uploadBox: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.md ?? 12,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xxl,
        backgroundColor: Colors.surface,
        gap: Spacing.xs,
        minHeight: 140,
    },
    uploadBoxSmall: {
        paddingVertical: Spacing.md,
        flex: 1,
        minHeight: 80,
        gap: 4,
    },
    uploadBoxFilled: {
        borderStyle: 'solid',
        padding: 0,
        overflow: 'hidden',
        minHeight: undefined,
    },
    uploadIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: `${PRIMARY}12`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    uploadPreview: {
        width: '100%',
        height: 160,
        backgroundColor: Colors.border,
    },
    uploadPreviewSmall: { height: 72, width: '100%' },
    removeImgBtn: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: Colors.surface,
        borderRadius: 12,
    },
    uploadText: {
        fontSize: Typography.sm,
        color: Colors.charcoal,
        fontWeight: Typography.semiBold,
    },
    uploadBadges: {
        flexDirection: 'row',
        gap: 5,
        marginTop: 2,
    },
    badge: {
        backgroundColor: `${PRIMARY}12`,
        borderRadius: 4,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    badgeText: { fontSize: 10, color: PRIMARY, fontWeight: '600' },
    uploadSubtext: { fontSize: 10, color: Colors.charcoalLight, marginTop: 2 },
    uploadIndexText: { fontSize: 10, color: Colors.charcoalLight, fontWeight: Typography.bold },

    // Doc preview
    docPreview: {
        alignItems: 'center',
        gap: 4,
        padding: Spacing.md,
    },
    docName: { fontSize: 11, color: Colors.charcoalMid, textAlign: 'center' },
    docNameSmall: { fontSize: 9 },

    // Photo grid
    photoGrid: { flexDirection: 'row', gap: Spacing.sm },

    // Input
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.md,
    },
    inputIcon: { marginRight: Spacing.sm },
    input: {
        flex: 1,
        paddingVertical: Spacing.md,
        fontSize: Typography.base,
        color: Colors.charcoal,
    },
    inputGap: { marginBottom: Spacing.sm },
});

// ─── Bottom Sheet Styles ───────────────────────────────────────────────────

const sheet = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.xl,
        paddingTop: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 20,
    },
    handle: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E0E0E0',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.charcoal,
        letterSpacing: -0.3,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 13,
        color: Colors.charcoalLight,
        textAlign: 'center',
        marginTop: 4,
        marginBottom: Spacing.xl,
    },
    grid: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    actionCard: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 14,
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 4,
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: `${PRIMARY}12`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    actionLabel: {
        fontSize: Typography.sm,
        fontWeight: '600',
        color: Colors.charcoal,
        textAlign: 'center',
    },
    actionSub: {
        fontSize: 10,
        color: Colors.charcoalLight,
        textAlign: 'center',
    },
    cancelBtn: {
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderRadius: Radii.sm,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cancelText: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.charcoalMid,
    },
});

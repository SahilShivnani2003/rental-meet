import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    ScrollView,
    Image,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
    launchImageLibrary,
    launchCamera,
    ImagePickerResponse,
    Asset,
} from 'react-native-image-picker';
import LoadingDots from '@/components/UI/loading-dots';
import { useAlert } from '@/context/AlertContext';
import { Colors, Spacing, Radii, Shadows, Typography } from '@/theme/theme';
import { ApiError } from '@/types/ApiError';
import { User } from '../types/User';

type IdProofType = 'Aadhaar' | 'PAN' | 'Passport' | 'Voter ID' | 'Driving License';

const ID_PROOF_TYPES: IdProofType[] = ['Aadhaar', 'PAN', 'Passport', 'Voter ID', 'Driving License'];

interface KycPayload {
    idProofType: IdProofType;
    idProof: string; // base64 or URI — depends on your API
    idProofBack?: string;
    selfie?: string;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    mutate: (
        data: any,
        callbacks: { onSuccess: () => void; onError: (e: ApiError) => void },
    ) => void;
    existingKyc?: User['kyc'];
}

type DocSlot = 'front' | 'back' | 'selfie';

interface PickedFile {
    uri: string;
    name: string;
    type: string;
}

export default function KycUploadModal({ visible, onClose, mutate, existingKyc }: Props) {
    const alert = useAlert();
    const slideAnim = useRef(new Animated.Value(600)).current;

    const [idProofType, setIdProofType] = useState<IdProofType>('Aadhaar');
    const [frontFile, setFrontFile] = useState<PickedFile | null>(null);
    const [backFile, setBackFile] = useState<PickedFile | null>(null);
    const [selfieFile, setSelfieFile] = useState<PickedFile | null>(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const isVerified = !!existingKyc?.verifiedAt;

    useEffect(() => {
        if (visible) {
            setFrontFile(null);
            setBackFile(null);
            setSelfieFile(null);
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

    const handleClose = () => {
        Animated.timing(slideAnim, { toValue: 600, duration: 220, useNativeDriver: true }).start(
            onClose,
        );
    };

    // ── Image picking ─────────────────────────────────────────────────────────
    const pickImage = (slot: DocSlot) => {
        const setter =
            slot === 'front' ? setFrontFile : slot === 'back' ? setBackFile : setSelfieFile;

        launchImageLibrary(
            { mediaType: 'photo', quality: 0.8, includeBase64: false },
            (response: ImagePickerResponse) => {
                if (response.didCancel || response.errorCode) return;
                const asset: Asset | undefined = response.assets?.[0];
                if (!asset?.uri) return;
                setter({
                    uri: asset.uri,
                    name: asset.fileName ?? `${slot}_${Date.now()}.jpg`,
                    type: asset.type ?? 'image/jpeg',
                });
                setErrors(prev => ({ ...prev, [slot]: '' }));
            },
        );
    };

    const openCamera = (slot: DocSlot) => {
        const setter =
            slot === 'front' ? setFrontFile : slot === 'back' ? setBackFile : setSelfieFile;

        launchCamera(
            { mediaType: 'photo', quality: 0.8, saveToPhotos: false },
            (response: ImagePickerResponse) => {
                if (response.didCancel || response.errorCode) return;
                const asset: Asset | undefined = response.assets?.[0];
                if (!asset?.uri) return;
                setter({
                    uri: asset.uri,
                    name: asset.fileName ?? `${slot}_${Date.now()}.jpg`,
                    type: asset.type ?? 'image/jpeg',
                });
                setErrors(prev => ({ ...prev, [slot]: '' }));
            },
        );
    };

    const showPickerOptions = (slot: DocSlot) => {
        alert.show({
            type: 'confirm',
            title: 'Choose Source',
            message: 'Select from gallery or take a new photo',
            buttons: [
                {
                    label: 'Gallery',
                    onPress: () => {
                        alert.dismiss();
                        pickImage(slot);
                    },
                    style: 'ghost',
                },
                {
                    label: 'Camera',
                    onPress: () => {
                        alert.dismiss();
                        openCamera(slot);
                    },
                },
            ],
        });
    };

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = () => {
        const e: Record<string, string> = {};
        if (!frontFile) e.front = 'Front side of ID is required';
        // Back not required for PAN — it has no back
        if (idProofType !== 'PAN' && !backFile) e.back = 'Back side of ID is required';
        if (!selfieFile) e.selfie = 'Selfie is required';
        return e;
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        const formData = new FormData();
        formData.append('idProofType', idProofType);
        formData.append('idProof', {
            uri: frontFile!.uri,
            name: frontFile!.name,
            type: frontFile!.type,
        } as any);
        if (backFile) {
            formData.append('idProofBack', {
                uri: backFile.uri,
                name: backFile.name,
                type: backFile.type,
            } as any);
        }
        formData.append('selfie', {
            uri: selfieFile!.uri,
            name: selfieFile!.name,
            type: selfieFile!.type,
        } as any);

        setLoading(true);
        mutate(formData, {
            onSuccess: () => {
                setLoading(false);
                alert.success(
                    'KYC Submitted',
                    'Your documents are under review. Verification usually takes 24–48 hours.',
                );
                onClose();
            },
            onError: (error: ApiError) => {
                setLoading(false);
                alert.error('Upload Failed', error?.message || 'Something went wrong.');
            },
        });
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <View style={s.overlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFillObject}
                    activeOpacity={1}
                    onPress={handleClose}
                />
                <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
                    <View style={s.handle} />

                    {/* Header */}
                    <View style={s.header}>
                        <View style={s.headerIcon}>
                            <Ionicons name="document-text" size={20} color={Colors.info} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.headerTitle}>KYC Verification</Text>
                            <Text style={s.headerSub}>
                                {isVerified
                                    ? 'Your KYC is already verified'
                                    : 'Upload your identity documents'}
                            </Text>
                        </View>
                        <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
                            <Ionicons name="close" size={20} color={Colors.charcoal} />
                        </TouchableOpacity>
                    </View>

                    {/* Already verified banner */}
                    {isVerified && (
                        <View style={s.verifiedBanner}>
                            <Ionicons name="shield-checkmark" size={18} color={Colors.success} />
                            <Text style={s.verifiedText}>
                                KYC verified — you can re-upload to update your documents
                            </Text>
                        </View>
                    )}

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={s.body}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* ID Proof type selector */}
                        <Text style={s.sectionLabel}>SELECT ID TYPE</Text>
                        <View style={s.typeRow}>
                            {ID_PROOF_TYPES.map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[s.typeChip, idProofType === type && s.typeChipActive]}
                                    onPress={() => {
                                        setIdProofType(type);
                                        setBackFile(null);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            s.typeChipText,
                                            idProofType === type && s.typeChipTextActive,
                                        ]}
                                    >
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Front */}
                        <Text style={[s.sectionLabel, { marginTop: Spacing.lg }]}>
                            ID PROOF — FRONT SIDE
                        </Text>
                        <DocUploadCard
                            label={`${idProofType} — Front`}
                            icon="id-card-outline"
                            file={frontFile}
                            onPick={() => showPickerOptions('front')}
                            onRemove={() => setFrontFile(null)}
                            error={errors.front}
                        />

                        {/* Back — hidden for PAN */}
                        {idProofType !== 'PAN' && (
                            <>
                                <Text style={[s.sectionLabel, { marginTop: Spacing.lg }]}>
                                    ID PROOF — BACK SIDE
                                </Text>
                                <DocUploadCard
                                    label={`${idProofType} — Back`}
                                    icon="id-card-outline"
                                    file={backFile}
                                    onPick={() => showPickerOptions('back')}
                                    onRemove={() => setBackFile(null)}
                                    error={errors.back}
                                />
                            </>
                        )}

                        {/* Selfie */}
                        <Text style={[s.sectionLabel, { marginTop: Spacing.lg }]}>SELFIE</Text>
                        <Text style={s.selfieHint}>
                            Hold your ID next to your face for a live selfie.
                        </Text>
                        <DocUploadCard
                            label="Selfie with ID"
                            icon="camera-outline"
                            file={selfieFile}
                            onPick={() => showPickerOptions('selfie')}
                            onRemove={() => setSelfieFile(null)}
                            error={errors.selfie}
                            preferCamera
                        />

                        {/* Info note */}
                        <View style={s.infoCard}>
                            <Ionicons
                                name="information-circle-outline"
                                size={16}
                                color={Colors.info}
                            />
                            <Text style={s.infoText}>
                                Documents are encrypted and stored securely. Verification takes
                                24–48 hours.
                            </Text>
                        </View>

                        {/* Submit */}
                        <TouchableOpacity
                            style={[s.submitBtn, loading && { opacity: 0.7 }]}
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.88}
                        >
                            {loading ? (
                                <LoadingDots />
                            ) : (
                                <>
                                    <Ionicons
                                        name="cloud-upload"
                                        size={18}
                                        color={Colors.charcoal}
                                    />
                                    <Text style={s.submitBtnText}>Submit for Verification</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
}

// ── Doc upload card sub-component ─────────────────────────────────────────────
interface DocCardProps {
    label: string;
    icon: string;
    file: PickedFile | null;
    onPick: () => void;
    onRemove: () => void;
    error?: string;
    preferCamera?: boolean;
}

function DocUploadCard({ label, icon, file, onPick, onRemove, error, preferCamera }: DocCardProps) {
    return (
        <View>
            {file ? (
                <View style={[dc.card, dc.cardFilled]}>
                    <Image source={{ uri: file.uri }} style={dc.preview} resizeMode="cover" />
                    <View style={dc.filledOverlay}>
                        <View style={dc.fileInfo}>
                            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                            <Text style={dc.fileName} numberOfLines={1}>
                                {file.name}
                            </Text>
                        </View>
                        <TouchableOpacity style={dc.removeBtn} onPress={onRemove}>
                            <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                            <Text style={dc.removeBtnText}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <TouchableOpacity
                    style={[dc.card, !!error && dc.cardError]}
                    onPress={onPick}
                    activeOpacity={0.8}
                >
                    <View style={dc.iconWrap}>
                        <Ionicons
                            name={icon as any}
                            size={28}
                            color={error ? Colors.danger : Colors.info}
                        />
                    </View>
                    <Text style={[dc.label, !!error && { color: Colors.danger }]}>{label}</Text>
                    <Text style={dc.sub}>
                        {preferCamera
                            ? 'Tap to take a photo or choose from gallery'
                            : 'Tap to choose from gallery or camera'}
                    </Text>
                    <View style={dc.uploadBtnWrap}>
                        <View style={[dc.uploadBtn, !!error && dc.uploadBtnError]}>
                            <Ionicons
                                name="cloud-upload-outline"
                                size={14}
                                color={error ? Colors.danger : Colors.info}
                            />
                            <Text style={[dc.uploadBtnText, !!error && { color: Colors.danger }]}>
                                Upload
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            )}
            {!!error && (
                <View style={dc.errorRow}>
                    <Ionicons name="alert-circle" size={12} color={Colors.danger} />
                    <Text style={dc.errorText}>{error}</Text>
                </View>
            )}
        </View>
    );
}

const dc = StyleSheet.create({
    card: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        borderRadius: Radii.lg,
        overflow: 'hidden',
        alignItems: 'center',
        padding: Spacing.xl,
        backgroundColor: Colors.background,
        marginBottom: 4,
    },
    cardFilled: { padding: 0, borderStyle: 'solid', borderColor: Colors.primaryBorder },
    cardError: { borderColor: Colors.danger, backgroundColor: '#FFF5F5' },
    preview: { width: '100%', height: 160 },
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
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.infoLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    label: { fontSize: 14, fontWeight: Typography.bold, color: Colors.charcoal, marginBottom: 4 },
    sub: {
        fontSize: 11.5,
        color: Colors.charcoalLight,
        textAlign: 'center',
        lineHeight: 17,
        marginBottom: Spacing.md,
    },
    uploadBtnWrap: {},
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.info,
        backgroundColor: Colors.infoLight,
    },
    uploadBtnError: { borderColor: Colors.danger, backgroundColor: '#FEE2E2' },
    uploadBtnText: { fontSize: 13, fontWeight: Typography.bold, color: Colors.info },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
    errorText: { fontSize: 11, color: Colors.danger, fontWeight: Typography.semiBold },
});

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        paddingTop: 12,
        maxHeight: '92%',
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
        backgroundColor: Colors.infoLight,
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
    verifiedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.successLight,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.success + '33',
    },
    verifiedText: {
        flex: 1,
        fontSize: 12,
        color: Colors.success,
        fontWeight: Typography.medium,
        lineHeight: 17,
    },
    body: { padding: Spacing.xl, paddingBottom: 40 },
    sectionLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 1.8,
        marginBottom: Spacing.sm,
    },
    selfieHint: {
        fontSize: 12,
        color: Colors.charcoalLight,
        marginTop: -Spacing.xs,
        marginBottom: Spacing.sm,
        lineHeight: 17,
    },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
    typeChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
    },
    typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    typeChipText: { fontSize: 12.5, color: Colors.charcoalLight, fontWeight: Typography.semiBold },
    typeChipTextActive: { color: Colors.charcoal, fontWeight: Typography.bold },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: Colors.infoLight,
        padding: Spacing.md,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.info + '33',
        marginTop: Spacing.lg,
    },
    infoText: { flex: 1, fontSize: 12, color: Colors.info, lineHeight: 18 },
    submitBtn: {
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
    submitBtnText: { fontSize: 15, fontWeight: Typography.extraBold, color: Colors.charcoal },
});

import React, { useState, useCallback, useRef } from 'react';
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
import { pick, types, DocumentPickerResponse, errorCodes } from '@react-native-documents/picker';
import { Colors, Typography, Spacing, Radii } from '../../../theme/theme';
import Field from '../../../components/UI/InputField';
import {
    StepHeader,
    SectionCard,
    SectionTitle,
    NavButtons,
    PickerRow,
    FileUploadBtn,
} from '../../../components/UI/shared-components';
import { useAuthStore } from '../../../store/useAuthStore';
import { VenueFormData } from '../types/VenueFormData';
import { useUploadDocument, useUploadImage } from '../hooks/useUpload';

const ROLES = ['Select role', 'Owner', 'Manager', 'Partner', 'Director'];
const BUSINESS_PROOF_TYPES = [
    'Select type',
    'Business Regd. Certificate',
    'Trade License',
    'Certificate of Incorporation',
    'Partnership Deed',
    'Udyog Aadhar',
    'Other',
];
const ACCOUNT_TYPES = ['Select type', 'Savings', 'Current', 'Overdraft'];

type TargetMode = 'photo' | 'selfie' | 'document';
interface SheetTarget {
    key: string;
    mode: TargetMode;
    label: string;
}

/** Shape returned by both upload mutations on success */
interface UploadResult {
    success: boolean;
    url: string;
    publicId: string;
}

const IMAGE_TYPES = [types.images];
const DOC_TYPES = [
    types.pdf,
    types.doc,
    types.docx,
    types.xls,
    types.xlsx,
    types.plainText,
    types.ppt,
    types.pptx,
];
const ALL_FILE_TYPES = [...IMAGE_TYPES, ...DOC_TYPES] as string[];

function truncateName(name: string | null | undefined): string {
    if (!name) return 'File selected';
    return name.length > 28 ? name.slice(0, 25) + '…' : name;
}

// ─── UploadBtn — module-level component (never define inside parent) ───────────
interface UploadBtnProps {
    uploadKey: string;
    mode: TargetMode;
    label: string;
    btnLabel?: string;
    uploads: Record<string, string>;
    uploading: Record<string, boolean>;
    onOpen: (key: string, mode: TargetMode, label: string) => void;
}

function UploadBtn({
    uploadKey,
    mode,
    label,
    btnLabel,
    uploads,
    uploading,
    onOpen,
}: UploadBtnProps) {
    const uploaded = uploads[uploadKey];
    const isUploading = uploading[uploadKey] ?? false;
    return (
        <FileUploadBtn
            label={
                isUploading
                    ? 'Uploading…'
                    : uploaded
                    ? truncateName(uploaded)
                    : btnLabel ?? 'Choose File'
            }
            done={!!uploaded && !isUploading}
            disabled={isUploading}
            rightElement={
                isUploading ? <ActivityIndicator size="small" color={Colors.primary} /> : undefined
            }
            onPress={() => !isUploading && onOpen(uploadKey, mode, label)}
        />
    );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface Props {
    data: VenueFormData['documents'];
    onChange: (data: VenueFormData['documents']) => void;
    onPrev: () => void;
    onNext: () => void;
}

export default function Step6Documents({ data, onChange, onPrev, onNext }: Props) {
    const { mutateAsync: uploadImageAsync } = useUploadImage();
    const { mutateAsync: uploadDocumentAsync } = useUploadDocument();

    const { user } = useAuthStore();
    const set = (patch: Partial<VenueFormData['documents']>) => onChange({ ...data, ...patch });

    // Prefill from logged-in user on first mount only
    React.useEffect(() => {
        if (!data.fullName && user?.name) {
            set({ fullName: user.name, email: user.email, mobile: user.phone });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [roleOpen, setRoleOpen] = useState(false);
    const [bpOpen, setBpOpen] = useState(false);
    const [atOpen, setAtOpen] = useState(false);
    const [uploading, setUploading] = useState<Record<string, boolean>>({});
    const [sheetTarget, setSheetTarget] = useState<SheetTarget | null>(null);
    const sheetTargetRef = useRef<SheetTarget | null>(null);

    // Always-current refs so async callbacks never close over stale values
    const dataRef = useRef(data);
    const onChangeRef = useRef(onChange);
    React.useEffect(() => {
        dataRef.current = data;
    }, [data]);
    React.useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const setLatest = useCallback((patch: Partial<VenueFormData['documents']>) => {
        onChangeRef.current({ ...dataRef.current, ...patch });
    }, []);

    const openSheet = (key: string, mode: TargetMode, label: string) => {
        const target = { key, mode, label };
        sheetTargetRef.current = target;
        setSheetTarget(target);
    };
    const closeSheet = () => setSheetTarget(null);

    // ── Core upload ───────────────────────────────────────────────────────────
    const uploadFile = useCallback(
        async (key: string, fileData: string, displayName: string) => {
            setUploading(p => ({ ...p, [key]: true }));
            // Optimistically show the filename while upload is in progress
            setLatest({ uploads: { ...dataRef.current.uploads, [key]: displayName } });

            try {
                const isImage = fileData.startsWith('data:image');

                const response: UploadResult = isImage
                    ? await uploadImageAsync({ file: fileData, folder: 'documents' })
                    : await uploadDocumentAsync({ file: fileData, folder: 'documents' });

                if (response?.success) {
                    const newDocs = [
                        ...dataRef.current.uploadedDocs.filter(d => d.uploadKey !== key),
                        { url: response.url, publicId: response.publicId, uploadKey: key },
                    ];
                    setLatest({
                        uploads: { ...dataRef.current.uploads, [key]: displayName },
                        uploadedDocs: newDocs,
                    });
                } else {
                    // API returned success:false — roll back the optimistic filename
                    setLatest({ uploads: { ...dataRef.current.uploads, [key]: '' } });
                }
            } catch (e: any) {
                console.error('DOCUMENT UPLOAD ERROR:', e);
                // Roll back optimistic filename on any error
                setLatest({ uploads: { ...dataRef.current.uploads, [key]: '' } });
            } finally {
                setUploading(p => ({ ...p, [key]: false }));
            }
        },
        [setLatest, uploadImageAsync, uploadDocumentAsync],
    );

    // ── Image picker result handler ───────────────────────────────────────────
    const onImagePickerResult = useCallback(
        async (res: ImagePickerResponse) => {
            closeSheet();
            const key = sheetTargetRef.current?.key;
            if (!key || res.didCancel || res.errorCode || !res.assets?.[0]) return;
            const asset: Asset = res.assets[0];
            if (!asset.base64) {
                console.warn('No base64 data — ensure includeBase64: true is set');
                return;
            }
            await uploadFile(
                key,
                `data:${asset.type ?? 'image/jpeg'};base64,${asset.base64}`,
                asset.fileName ?? 'photo.jpg',
            );
        },
        [uploadFile],
    );

    const handleCamera = useCallback(
        () =>
            launchCamera(
                { mediaType: 'photo', saveToPhotos: false, quality: 0.8, includeBase64: true },
                onImagePickerResult,
            ),
        [onImagePickerResult],
    );

    const handleGalleryImage = useCallback(
        () =>
            launchImageLibrary(
                { mediaType: 'photo', selectionLimit: 1, quality: 0.8, includeBase64: true },
                onImagePickerResult,
            ),
        [onImagePickerResult],
    );

    const handleFilePicker = useCallback(
        async (imageOnly = false) => {
            const key = sheetTargetRef.current?.key;
            closeSheet();
            if (!key) return;
            try {
                const [res]: DocumentPickerResponse[] = await pick({
                    type: imageOnly ? IMAGE_TYPES : ALL_FILE_TYPES,
                    allowMultiSelection: false,
                    presentationStyle: 'pageSheet',
                });
                if (!res) return;
                const fileResponse = await fetch(res.uri);
                const blob = await fileResponse.blob();
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
                await uploadFile(key, base64, res.name ?? 'document');
            } catch (e: any) {
                if (e?.code !== errorCodes.OPERATION_CANCELED) console.warn(e);
            }
        },
        [uploadFile],
    );

    // ── Sheet option list ─────────────────────────────────────────────────────
    const renderSheetOptions = () => {
        if (!sheetTarget) return null;
        const { mode } = sheetTarget;
        const options: {
            icon: string;
            iconBg: string;
            iconColor: string;
            title: string;
            sub: string;
            onPress: () => void;
        }[] = [];

        if (mode === 'photo' || mode === 'selfie') {
            options.push({
                icon: 'camera-outline',
                iconBg: Colors.primaryLight,
                iconColor: Colors.primary,
                title: 'Take Photo',
                sub: 'Use your camera to capture now',
                onPress: handleCamera,
            });
            options.push({
                icon: 'images-outline',
                iconBg: '#EDE9FE',
                iconColor: '#7C3AED',
                title: 'Choose from Gallery',
                sub: 'Pick an existing image from device',
                onPress: handleGalleryImage,
            });
        }
        if (mode === 'document') {
            options.push({
                icon: 'images-outline',
                iconBg: '#EDE9FE',
                iconColor: '#7C3AED',
                title: 'Choose Image',
                sub: 'JPG or PNG from your gallery',
                onPress: handleGalleryImage,
            });
        }
        if (mode === 'photo' || mode === 'document') {
            options.push({
                icon: 'document-attach-outline',
                iconBg: Colors.warningLight ?? '#FEF3C7',
                iconColor: Colors.warning ?? '#D97706',
                title: 'Browse Files',
                sub:
                    mode === 'document'
                        ? 'PDF, Word, Excel, PPT and more'
                        : 'PDF or image from storage',
                onPress: () => handleFilePicker(mode !== 'document'),
            });
        }
        return options;
    };

    // ── Toggle GST ────────────────────────────────────────────────────────────
    const toggleGST = () => {
        const next = !data.hasGST;
        set({
            hasGST: next,
            gstNumber: next ? data.gstNumber : '',
            uploads: next ? data.uploads : { ...data.uploads, gst_doc: '' },
            uploadedDocs: next
                ? data.uploadedDocs
                : data.uploadedDocs.filter(d => d.uploadKey !== 'gst_doc'),
        });
    };

    // Shared props passed to every UploadBtn
    const uploadBtnShared = { uploads: data.uploads, uploading, onOpen: openSheet };

    return (
        <>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                <StepHeader title="Step 6: Documents" current={6} />

                {/* ── Owner Details ── */}
                <SectionCard accentColor={Colors.primary}>
                    <SectionTitle icon="person-outline" title="Owner Details" />
                    <View style={s.row}>
                        <View style={{ flex: 1 }}>
                            <Field
                                label="Full Name"
                                placeholder="John Doe"
                                icon="person-outline"
                                value={data.fullName}
                                onChangeText={v => set({ fullName: v })}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Field
                                label="Email Address"
                                placeholder="john@example.com"
                                icon="mail-outline"
                                value={data.email}
                                onChangeText={v => set({ email: v })}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>
                    <View style={s.row}>
                        <View style={{ flex: 1 }}>
                            <Field
                                label="Mobile Number"
                                placeholder="9876543210"
                                icon="call-outline"
                                value={data.mobile}
                                onChangeText={v => set({ mobile: v })}
                                keyboardType="phone-pad"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Field
                                label="Alternate Number"
                                placeholder="9876543210"
                                icon="call-outline"
                                value={data.altMobile}
                                onChangeText={v => set({ altMobile: v })}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>
                    <Text style={s.pickerLabel}>
                        YOUR ROLE <Text style={s.req}>*</Text>
                    </Text>
                    <PickerRow
                        value={data.role}
                        options={ROLES}
                        open={roleOpen}
                        onToggle={() => setRoleOpen(!roleOpen)}
                        onSelect={v => {
                            set({ role: v });
                            setRoleOpen(false);
                        }}
                    />

                    <View style={s.gstDivider} />

                    <TouchableOpacity style={s.gstCheckRow} onPress={toggleGST} activeOpacity={0.8}>
                        <View style={[s.gstCheckbox, data.hasGST && s.gstCheckboxActive]}>
                            {data.hasGST && (
                                <Ionicons name="checkmark" size={13} color={Colors.white} />
                            )}
                        </View>
                        <View style={s.gstCheckContent}>
                            <Text style={[s.gstCheckTitle, data.hasGST && s.gstCheckTitleActive]}>
                                I have a GST Registration
                            </Text>
                            <Text style={s.gstCheckSub}>
                                Required for GST-registered businesses
                            </Text>
                        </View>
                        <View style={[s.gstBadge, data.hasGST && s.gstBadgeActive]}>
                            <Text style={[s.gstBadgeText, data.hasGST && s.gstBadgeTextActive]}>
                                {data.hasGST ? 'GST Registered' : 'Optional'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {data.hasGST && (
                        <View style={s.gstExpanded}>
                            <Field
                                label="GST Number"
                                placeholder="22AAAAA0000A1Z5"
                                icon="receipt-outline"
                                value={data.gstNumber}
                                onChangeText={v => set({ gstNumber: v.toUpperCase() })}
                                autoCapitalize="characters"
                                maxLength={15}
                            />
                            <Text style={s.uploadLabel}>
                                UPLOAD GST CERTIFICATE <Text style={s.req}>*</Text>
                            </Text>
                            <UploadBtn
                                uploadKey="gst_doc"
                                mode="document"
                                label="GST Certificate"
                                btnLabel="Upload GST Certificate"
                                {...uploadBtnShared}
                            />
                            <View style={s.gstNote}>
                                <Ionicons
                                    name="information-circle-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.gstNoteText}>
                                    Upload your GST registration certificate (PDF, JPG or PNG)
                                </Text>
                            </View>
                        </View>
                    )}
                </SectionCard>

                {/* ── ID Proof ── */}
                <SectionCard accentColor={Colors.info}>
                    <SectionTitle
                        icon="card-outline"
                        title="ID Proof"
                        iconColor={Colors.info}
                        bgColor={Colors.infoLight}
                    />
                    <Text style={s.subLabel}>Select ID Type</Text>
                    <View style={s.radioRow}>
                        {(['aadhaar', 'pan'] as const).map(type => (
                            <TouchableOpacity
                                key={type}
                                style={s.radioItem}
                                onPress={() => set({ idType: type })}
                                activeOpacity={0.8}
                            >
                                <View
                                    style={[
                                        s.radioCircle,
                                        data.idType === type && s.radioCircleActive,
                                    ]}
                                >
                                    {data.idType === type && <View style={s.radioInner} />}
                                </View>
                                <Text style={s.radioText}>
                                    {type === 'aadhaar' ? 'Aadhaar' : 'PAN Card'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={s.row}>
                        <View style={{ flex: 1 }}>
                            <Field
                                label={data.idType === 'aadhaar' ? 'Aadhaar Number' : 'PAN Number'}
                                placeholder={
                                    data.idType === 'aadhaar' ? 'XXXX XXXX XXXX' : 'ABCDE1234F'
                                }
                                icon="card-outline"
                                value={data.idNumber}
                                onChangeText={v => set({ idNumber: v })}
                                autoCapitalize={data.idType === 'pan' ? 'characters' : 'none'}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.uploadLabel}>
                                UPLOAD FRONT <Text style={s.req}>*</Text>
                            </Text>
                            <UploadBtn
                                uploadKey="id_front"
                                mode="photo"
                                label="ID Front"
                                {...uploadBtnShared}
                            />
                        </View>
                    </View>
                    <Text style={[s.uploadLabel, { marginTop: Spacing.sm }]}>
                        UPLOAD BACK <Text style={s.req}>*</Text>
                    </Text>
                    <UploadBtn
                        uploadKey="id_back"
                        mode="photo"
                        label="ID Back"
                        {...uploadBtnShared}
                    />
                </SectionCard>

                {/* ── Selfie ── */}
                <SectionCard accentColor={Colors.success}>
                    <SectionTitle
                        icon="camera-outline"
                        title="Selfie Upload"
                        subtitle="Upload a clear photo of yourself"
                        iconColor={Colors.success}
                        bgColor={Colors.successLight}
                    />
                    <UploadBtn
                        uploadKey="selfie"
                        mode="selfie"
                        label="Selfie"
                        btnLabel="Take / Upload Selfie"
                        {...uploadBtnShared}
                    />
                </SectionCard>

                {/* ── Business Documentation ── */}
                <SectionCard accentColor={Colors.warning}>
                    <SectionTitle
                        icon="briefcase-outline"
                        title="Business Documentation"
                        iconColor={Colors.warning}
                        bgColor={Colors.warningLight}
                    />
                    <Text style={s.pickerLabel}>
                        BUSINESS PROOF TYPE <Text style={s.req}>*</Text>
                    </Text>
                    <PickerRow
                        value={data.bizProofType}
                        options={BUSINESS_PROOF_TYPES}
                        open={bpOpen}
                        onToggle={() => setBpOpen(!bpOpen)}
                        onSelect={v => {
                            set({ bizProofType: v });
                            setBpOpen(false);
                        }}
                    />
                    <View style={s.formatBadgeRow}>
                        {['PDF', 'Word', 'Excel', 'PPT', 'JPG', 'PNG'].map(fmt => (
                            <View key={fmt} style={s.formatBadge}>
                                <Text style={s.formatBadgeText}>{fmt}</Text>
                            </View>
                        ))}
                    </View>
                    <Text style={[s.uploadLabel, { marginTop: Spacing.sm }]}>
                        UPLOAD DOCUMENT <Text style={s.req}>*</Text>
                    </Text>
                    <UploadBtn
                        uploadKey="biz_doc"
                        mode="document"
                        label="Business Document"
                        {...uploadBtnShared}
                    />
                </SectionCard>

                {/* ── Bank Details ── */}
                <SectionCard accentColor={Colors.primaryDark}>
                    <SectionTitle
                        icon="card-outline"
                        title="Bank Details for Payouts"
                        iconColor={Colors.primaryDark}
                        bgColor={Colors.primaryLight}
                    />
                    <View style={s.row}>
                        <View style={{ flex: 1 }}>
                            <Field
                                label="Account Holder Name"
                                placeholder="Full Name"
                                icon="person-outline"
                                value={data.accountHolder}
                                onChangeText={v => set({ accountHolder: v })}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Field
                                label="Account Number"
                                placeholder="Account Number"
                                icon="keypad-outline"
                                value={data.accountNumber}
                                onChangeText={v => set({ accountNumber: v })}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                    <View style={s.row}>
                        <View style={{ flex: 1 }}>
                            <Field
                                label="IFSC Code"
                                placeholder="SBIN0001234"
                                icon="barcode-outline"
                                value={data.ifsc}
                                onChangeText={v => set({ ifsc: v })}
                                autoCapitalize="characters"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Field
                                label="Bank Name"
                                placeholder="State Bank of India"
                                icon="business-outline"
                                value={data.bankName}
                                onChangeText={v => set({ bankName: v })}
                            />
                        </View>
                    </View>
                    <View style={s.row}>
                        <View style={{ flex: 1 }}>
                            <Field
                                label="Branch Name"
                                placeholder="Branch Name"
                                icon="location-outline"
                                value={data.branchName}
                                onChangeText={v => set({ branchName: v })}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.pickerLabel}>
                                ACCOUNT TYPE <Text style={s.req}>*</Text>
                            </Text>
                            <PickerRow
                                value={data.accountType}
                                options={ACCOUNT_TYPES}
                                open={atOpen}
                                onToggle={() => setAtOpen(!atOpen)}
                                onSelect={v => {
                                    set({ accountType: v });
                                    setAtOpen(false);
                                }}
                            />
                        </View>
                    </View>
                    <View style={s.secureNote}>
                        <Ionicons name="lock-closed" size={12} color={Colors.primary} />
                        <Text style={s.secureText}>
                            Your bank details will be encrypted and stored securely
                        </Text>
                    </View>
                </SectionCard>

                <NavButtons onPrev={onPrev} onNext={onNext} />
            </ScrollView>

            {/* ── Bottom sheet ── */}
            <Modal
                visible={sheetTarget !== null}
                transparent
                animationType="slide"
                onRequestClose={closeSheet}
                statusBarTranslucent
            >
                <Pressable style={s.backdrop} onPress={closeSheet} />
                <View style={s.sheet}>
                    <View style={s.handle} />
                    <Text style={s.sheetTitle}>{sheetTarget?.label ?? 'Upload File'}</Text>
                    <Text style={s.sheetSub}>
                        {sheetTarget?.mode === 'selfie'
                            ? 'Take a selfie or pick one from your gallery.'
                            : sheetTarget?.mode === 'document'
                            ? 'Choose an image or browse for PDF, Word, Excel, PPT files.'
                            : 'Capture a photo, pick from gallery, or browse a file.'}
                    </Text>
                    {renderSheetOptions()?.map((opt, i, arr) => (
                        <React.Fragment key={opt.title}>
                            <TouchableOpacity
                                style={s.sheetOption}
                                onPress={opt.onPress}
                                activeOpacity={0.75}
                            >
                                <View style={[s.sheetIconWrap, { backgroundColor: opt.iconBg }]}>
                                    <Ionicons name={opt.icon} size={22} color={opt.iconColor} />
                                </View>
                                <View style={s.sheetOptionText}>
                                    <Text style={s.sheetOptionTitle}>{opt.title}</Text>
                                    <Text style={s.sheetOptionSub}>{opt.sub}</Text>
                                </View>
                                <Ionicons
                                    name="chevron-forward"
                                    size={16}
                                    color={Colors.charcoalLight}
                                />
                            </TouchableOpacity>
                            {i < arr.length - 1 && <View style={s.sheetDivider} />}
                        </React.Fragment>
                    ))}
                    <TouchableOpacity style={s.cancelBtn} onPress={closeSheet} activeOpacity={0.8}>
                        <Text style={s.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </>
    );
}

const s = StyleSheet.create({
    row: { flexDirection: 'row', gap: Spacing.sm },
    gstDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
    gstCheckRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.sm,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
    },
    gstCheckbox: {
        width: 22,
        height: 22,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
        flexShrink: 0,
    },
    gstCheckboxActive: { backgroundColor: Colors.success, borderColor: Colors.success },
    gstCheckContent: { flex: 1 },
    gstCheckTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    gstCheckTitleActive: { color: Colors.success },
    gstCheckSub: { fontSize: Typography.xs, color: Colors.charcoalLight, marginTop: 1 },
    gstBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radii.full,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    gstBadgeActive: { backgroundColor: Colors.successLight, borderColor: Colors.success },
    gstBadgeText: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    gstBadgeTextActive: { color: Colors.success, fontWeight: Typography.semiBold },
    gstExpanded: {
        marginTop: Spacing.sm,
        padding: Spacing.md,
        backgroundColor: Colors.successLight,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.success,
        gap: Spacing.xs,
    },
    gstNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.xs,
        marginTop: Spacing.xs,
    },
    gstNoteText: { flex: 1, fontSize: Typography.xs, color: Colors.charcoalLight, lineHeight: 16 },
    subLabel: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
        marginBottom: Spacing.sm,
    },
    radioRow: { flexDirection: 'row', gap: Spacing.xl, marginBottom: Spacing.md },
    radioItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioCircleActive: { borderColor: Colors.primary },
    radioInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.primary },
    radioText: {
        fontSize: Typography.base,
        fontWeight: Typography.medium,
        color: Colors.charcoalMid,
    },
    pickerLabel: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 7,
    },
    uploadLabel: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    req: { color: Colors.primary },
    secureNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.md,
        padding: Spacing.sm,
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.sm,
    },
    secureText: { fontSize: Typography.xs, color: Colors.charcoalLight, flex: 1 },
    formatBadgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        marginTop: Spacing.sm,
    },
    formatBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        backgroundColor: Colors.warningLight ?? '#FEF3C7',
        borderRadius: Radii.sm ?? 4,
        borderWidth: 1,
        borderColor: Colors.warning ?? '#D97706',
    },
    formatBadgeText: {
        fontSize: Typography.xs ?? 11,
        fontWeight: Typography.semiBold,
        color: Colors.warning ?? '#D97706',
    },
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
    sheetDivider: {
        height: 1,
        backgroundColor: Colors.border ?? '#F3F4F6',
        marginVertical: 2,
    },
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

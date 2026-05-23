import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    Animated,
    Platform,
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radii, Typography } from '@/theme/theme';
import { VendorService } from '@features/otherService/types/VendorService';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';
import {
    pick as pickDoc,
    types as DocTypes,
    isErrorWithCode,
    errorCodes,
} from '@react-native-documents/picker';

// ─── Types ─────────────────────────────────────────────────────────────────

type Props = {
    data: Partial<VendorService>;
    onChange: (key: keyof VendorService, value: any) => void;
};

type DocField = {
    key: string;
    label: string;
    icon: string;
    required?: boolean;
    highlight?: boolean;
    hint?: string;
};

type PickerAction = 'camera' | 'gallery' | 'file';
type PickerTarget = { section: 'biz' | 'owner'; key: string };

// ─── Doc Definitions ───────────────────────────────────────────────────────

const BUSINESS_DOCS: DocField[] = [
    {
        key: 'registrationCertificate',
        label: 'Registration Certificate',
        icon: 'business-outline',
        required: true,
        hint: 'Company / firm reg. cert.',
    },
    {
        key: 'msme',
        label: 'MSME Certificate',
        icon: 'ribbon-outline',
        hint: 'If registered under MSME',
    },
    { key: 'gst', label: 'GST Certificate', icon: 'receipt-outline', hint: 'GST registration doc' },
    { key: 'pan', label: 'PAN Card (Business)', icon: 'card-outline', hint: 'Business entity PAN' },
    {
        key: 'tradeLicense',
        label: 'Trade License',
        icon: 'storefront-outline',
        hint: 'Local municipal licence',
    },
    {
        key: 'fssai',
        label: 'FSSAI License',
        icon: 'restaurant-outline',
        hint: 'Required for catering',
    },
];

const OWNER_DOCS: DocField[] = [
    {
        key: 'aadhaarFront',
        label: 'Aadhaar — Front',
        icon: 'person-outline',
        required: true,
        hint: 'Clear photo of front side',
    },
    {
        key: 'aadhaarBack',
        label: 'Aadhaar — Back',
        icon: 'person-outline',
        required: true,
        highlight: true,
        hint: 'Clear photo of back side',
    },
    { key: 'pan', label: 'PAN Card', icon: 'card-outline', hint: 'Owner personal PAN' },
    {
        key: 'selfie',
        label: 'Selfie / Photo',
        icon: 'camera-outline',
        required: true,
        hint: 'Clear face photo',
    },
];

// ─── Bottom Sheet ──────────────────────────────────────────────────────────

const SHEET_ACTIONS: { id: PickerAction; icon: string; label: string; sub: string }[] = [
    { id: 'camera', icon: 'camera-outline', label: 'Camera', sub: 'Take a new photo' },
    { id: 'gallery', icon: 'images-outline', label: 'Gallery', sub: 'Choose from photos' },
    { id: 'file', icon: 'document-text-outline', label: 'Files', sub: 'PDF, JPG, PNG…' },
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
    const slideAnim = useRef(new Animated.Value(320)).current;

    React.useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: visible ? 0 : 320,
            useNativeDriver: true,
            damping: 18,
            stiffness: 160,
        }).start();
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
                <View style={sheet.handle} />
                <Text style={sheet.title}>Upload Document</Text>
                <Text style={sheet.subtitle}>Select a source</Text>

                <View style={sheet.grid}>
                    {SHEET_ACTIONS.map(a => (
                        <TouchableOpacity
                            key={a.id}
                            style={sheet.card}
                            onPress={() => {
                                onClose();
                                setTimeout(() => onSelect(a.id), 300);
                            }}
                            activeOpacity={0.75}
                        >
                            <View style={sheet.cardIcon}>
                                <Ionicons name={a.icon} size={26} color={PRIMARY} />
                            </View>
                            <Text style={sheet.cardLabel}>{a.label}</Text>
                            <Text style={sheet.cardSub}>{a.sub}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={sheet.cancel} onPress={onClose} activeOpacity={0.7}>
                    <Text style={sheet.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </Animated.View>
        </Modal>
    );
}

// ─── Doc Upload Box ────────────────────────────────────────────────────────

function DocUploadBox({
    field,
    value,
    onUpload,
    onView,
    onReplace,
}: {
    field: DocField;
    value?: string;
    onUpload: () => void;
    onView?: () => void;
    onReplace?: () => void;
}) {
    const isPdf = value?.toLowerCase().endsWith('.pdf');
    const fileName = value ? value.split('/').pop() ?? 'Document' : '';

    if (value) {
        return (
            <View style={[s.docBox, s.docBoxFilled]}>
                {/* Top area */}
                <View style={s.filledTop}>
                    <View style={s.filledIconWrap}>
                        <Ionicons
                            name={isPdf ? 'document-text' : 'image'}
                            size={22}
                            color={SUCCESS}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.filledLabel} numberOfLines={1}>
                            {fileName}
                        </Text>
                        <View style={s.filledPill}>
                            <Ionicons name="checkmark-circle" size={11} color={SUCCESS} />
                            <Text style={s.filledPillText}>Uploaded</Text>
                        </View>
                    </View>
                </View>

                {/* Action row */}
                <View style={s.filledActions}>
                    {onView && (
                        <TouchableOpacity style={s.actionBtn} onPress={onView} activeOpacity={0.7}>
                            <Ionicons name="eye-outline" size={13} color={PRIMARY} />
                            <Text style={s.actionBtnText}>View</Text>
                        </TouchableOpacity>
                    )}
                    {onReplace && (
                        <TouchableOpacity
                            style={[s.actionBtn, s.actionBtnAlt]}
                            onPress={onReplace}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="refresh-outline" size={13} color={Colors.charcoalMid} />
                            <Text style={[s.actionBtnText, { color: Colors.charcoalMid }]}>
                                Replace
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    return (
        <TouchableOpacity
            style={[s.docBox, field.highlight && s.docBoxHighlight]}
            onPress={onUpload}
            activeOpacity={0.8}
        >
            <View style={[s.emptyIconWrap, field.highlight && s.emptyIconWrapHighlight]}>
                <Ionicons
                    name={field.icon}
                    size={22}
                    color={field.highlight ? PRIMARY : Colors.charcoalLight}
                />
            </View>
            <Text style={[s.emptyUploadText, field.highlight && s.emptyUploadTextHighlight]}>
                Tap to upload
            </Text>
            {field.hint && <Text style={s.emptyHint}>{field.hint}</Text>}
        </TouchableOpacity>
    );
}

// ─── Section Header ────────────────────────────────────────────────────────

function SectionHeader({
    icon,
    title,
    sub,
    color,
}: {
    icon: string;
    title: string;
    sub: string;
    color: string;
}) {
    return (
        <View style={s.sectionHeader}>
            <View style={[s.sectionIconWrap, { backgroundColor: color }]}>
                <Ionicons name={icon} size={16} color="#fff" />
            </View>
            <View>
                <Text style={s.sectionTitle}>{title}</Text>
                <Text style={s.sectionSub}>{sub}</Text>
            </View>
        </View>
    );
}

// ─── Progress Bar ──────────────────────────────────────────────────────────

function UploadProgress({ docs, fields }: { docs: Record<string, any>; fields: DocField[] }) {
    const required = fields.filter(f => f.required);
    const uploaded = required.filter(f => !!docs[f.key]);
    const pct = required.length ? (uploaded.length / required.length) * 100 : 100;

    return (
        <View style={s.progressWrap}>
            <View style={s.progressRow}>
                <Text style={s.progressLabel}>
                    {uploaded.length}/{required.length} required docs
                </Text>
                <Text style={s.progressPct}>{Math.round(pct)}%</Text>
            </View>
            <View style={s.progressTrack}>
                <Animated.View style={[s.progressFill, { width: `${pct}%` as any }]} />
            </View>
        </View>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function Step6Documents({ data, onChange }: Props) {
    const bizDocs = (data.businessDocs as Record<string, string>) || {};
    const ownerDocs = (data.ownerDocs as Record<string, string>) || {};

    const [sheetVisible, setSheetVisible] = useState(false);
    const currentTarget = useRef<PickerTarget | null>(null);

    const openSheet = (target: PickerTarget) => {
        currentTarget.current = target;
        setSheetVisible(true);
    };

    const commitUri = (uri: string) => {
        const t = currentTarget.current;
        if (!t) return;
        if (t.section === 'biz') {
            onChange('businessDocs', { ...bizDocs, [t.key]: uri });
        } else {
            onChange('ownerDocs', { ...ownerDocs, [t.key]: uri });
        }
    };

    const handlePickerAction = async (action: PickerAction) => {
        try {
            if (action === 'camera') {
                const res = await launchCamera({ mediaType: 'photo', quality: 0.8 });
                const asset: Asset | undefined = res.assets?.[0];
                if (asset?.uri) commitUri(asset.uri);
            } else if (action === 'gallery') {
                const res = await launchImageLibrary({
                    mediaType: 'photo',
                    quality: 0.8,
                    selectionLimit: 1,
                });
                const asset: Asset | undefined = res.assets?.[0];
                if (asset?.uri) commitUri(asset.uri);
            } else {
                const results = await pickDoc({
                    allowMultiSelection: false,
                    type: [DocTypes.images, DocTypes.pdf],
                });
                const uri = results[0]?.uri;
                if (uri) commitUri(uri);
            }
        } catch (err: any) {
            if (!isErrorWithCode(err)) {
                Alert.alert('Upload failed', err?.message ?? 'Something went wrong.');
            }
        }
    };

    const allDocs = { ...bizDocs, ...ownerDocs };
    const allFields = [...BUSINESS_DOCS, ...OWNER_DOCS];
    const totalRequired = allFields.filter(f => f.required).length;
    const totalUploaded = allFields.filter(f => f.required && !!allDocs[f.key]).length;
    const overallPct = Math.round((totalUploaded / totalRequired) * 100);

    return (
        <>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.container}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Overall progress banner ─────────────────────────── */}
                <View style={s.banner}>
                    <View style={s.bannerLeft}>
                        <Text style={s.bannerTitle}>Document Verification</Text>
                        <Text style={s.bannerSub}>
                            {totalUploaded} of {totalRequired} required documents uploaded
                        </Text>
                    </View>
                    <View style={s.bannerCircle}>
                        <Text style={s.bannerPct}>{overallPct}%</Text>
                    </View>
                </View>

                {/* ── Business Docs ───────────────────────────────────── */}
                <SectionHeader
                    icon="business-outline"
                    title="Business Documents"
                    sub="Company registration & compliance"
                    color={PRIMARY}
                />

                <UploadProgress docs={bizDocs} fields={BUSINESS_DOCS} />

                <View style={s.grid}>
                    {BUSINESS_DOCS.map(doc => (
                        <View key={doc.key} style={s.gridItem}>
                            <View style={s.docLabelRow}>
                                <Text style={s.docLabel} numberOfLines={1}>
                                    {doc.label}
                                </Text>
                                {doc.required ? (
                                    <View style={s.reqBadge}>
                                        <Text style={s.reqBadgeText}>Required</Text>
                                    </View>
                                ) : (
                                    <Text style={s.optTag}>Optional</Text>
                                )}
                            </View>
                            <DocUploadBox
                                field={doc}
                                value={bizDocs[doc.key]}
                                onUpload={() => openSheet({ section: 'biz', key: doc.key })}
                                onView={
                                    bizDocs[doc.key]
                                        ? () => console.log('View', doc.key)
                                        : undefined
                                }
                                onReplace={
                                    bizDocs[doc.key]
                                        ? () => openSheet({ section: 'biz', key: doc.key })
                                        : undefined
                                }
                            />
                        </View>
                    ))}
                </View>

                {/* ── Owner Docs ──────────────────────────────────────── */}
                <SectionHeader
                    icon="person-circle-outline"
                    title="Owner / Manager"
                    sub="KYC & identity verification"
                    color="#E67E22"
                />

                <UploadProgress docs={ownerDocs} fields={OWNER_DOCS} />

                <View style={s.grid}>
                    {OWNER_DOCS.map(doc => (
                        <View key={doc.key} style={s.gridItem}>
                            <View style={s.docLabelRow}>
                                <Text style={s.docLabel} numberOfLines={1}>
                                    {doc.label}
                                </Text>
                                {doc.required ? (
                                    <View style={s.reqBadge}>
                                        <Text style={s.reqBadgeText}>Required</Text>
                                    </View>
                                ) : (
                                    <Text style={s.optTag}>Optional</Text>
                                )}
                            </View>
                            <DocUploadBox
                                field={doc}
                                value={ownerDocs[doc.key]}
                                onUpload={() => openSheet({ section: 'owner', key: doc.key })}
                                onView={
                                    ownerDocs[doc.key]
                                        ? () => console.log('View', doc.key)
                                        : undefined
                                }
                                onReplace={
                                    ownerDocs[doc.key]
                                        ? () => openSheet({ section: 'owner', key: doc.key })
                                        : undefined
                                }
                            />
                        </View>
                    ))}
                </View>

                {/* ── Info note ───────────────────────────────────────── */}
                <View style={s.infoNote}>
                    <Ionicons name="shield-checkmark-outline" size={16} color={PRIMARY} />
                    <Text style={s.infoNoteText}>
                        All documents are securely stored and used only for verification. Max file
                        size: 10 MB per document.
                    </Text>
                </View>
            </ScrollView>

            <MediaPickerSheet
                visible={sheetVisible}
                onClose={() => setSheetVisible(false)}
                onSelect={handlePickerAction}
            />
        </>
    );
}

// ─── Constants ─────────────────────────────────────────────────────────────

const PRIMARY = '#6C63FF';
const SUCCESS = '#22C55E';

// ─── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    container: { paddingBottom: Spacing.xl },

    // Banner
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: `${PRIMARY}10`,
        borderRadius: Radii.md ?? 12,
        borderWidth: 1,
        borderColor: `${PRIMARY}25`,
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    bannerLeft: { flex: 1, gap: 3 },
    bannerTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    bannerSub: { fontSize: 12, color: Colors.charcoalLight },
    bannerCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerPct: { fontSize: 14, fontWeight: '700', color: '#fff' },

    // Section header
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.sm,
        marginTop: Spacing.xs,
    },
    sectionIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
    },
    sectionSub: { fontSize: 11, color: Colors.charcoalLight, marginTop: 1 },

    // Progress
    progressWrap: { marginBottom: Spacing.lg },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    progressLabel: { fontSize: 11, color: Colors.charcoalLight },
    progressPct: { fontSize: 11, color: PRIMARY, fontWeight: '600' },
    progressTrack: {
        height: 4,
        borderRadius: 2,
        backgroundColor: `${PRIMARY}18`,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
        backgroundColor: PRIMARY,
    },

    // Grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
    gridItem: { width: '47.5%' },

    // Doc label row
    docLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.xs,
        gap: 4,
    },
    docLabel: {
        flex: 1,
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    reqBadge: {
        backgroundColor: '#FFF0F0',
        borderRadius: 4,
        paddingHorizontal: 5,
        paddingVertical: 1,
    },
    reqBadgeText: { fontSize: 9, color: Colors.danger, fontWeight: '700' },
    optTag: { fontSize: 9, color: Colors.charcoalLight },

    // Doc box (empty)
    docBox: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        borderRadius: Radii.sm,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.sm,
        backgroundColor: Colors.surface,
        gap: 5,
        minHeight: 100,
    },
    docBoxHighlight: {
        borderColor: PRIMARY,
        backgroundColor: `${PRIMARY}08`,
    },
    emptyIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${Colors.charcoalLight}15`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyIconWrapHighlight: {
        backgroundColor: `${PRIMARY}15`,
    },
    emptyUploadText: {
        fontSize: Typography.xs ?? 12,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    emptyUploadTextHighlight: { color: PRIMARY, fontWeight: Typography.semiBold },
    emptyHint: {
        fontSize: 9,
        color: Colors.charcoalLight,
        textAlign: 'center',
    },

    // Doc box (filled)
    docBoxFilled: {
        borderStyle: 'solid',
        borderColor: `${SUCCESS}55`,
        backgroundColor: `${SUCCESS}0C`,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        padding: 0,
        overflow: 'hidden',
        gap: 0,
    },
    filledTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        flex: 1,
        width: '100%',
    },
    filledIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: `${SUCCESS}18`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filledLabel: {
        fontSize: 11,
        color: Colors.charcoal,
        fontWeight: Typography.medium,
        marginBottom: 3,
    },
    filledPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: `${SUCCESS}18`,
        borderRadius: 4,
        paddingHorizontal: 5,
        paddingVertical: 1,
        alignSelf: 'flex-start',
    },
    filledPillText: { fontSize: 9, color: SUCCESS, fontWeight: '700' },
    filledActions: {
        flexDirection: 'row',
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: `${SUCCESS}30`,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        borderRightWidth: 1,
        borderRightColor: `${SUCCESS}30`,
    },
    actionBtnAlt: { borderRightWidth: 0 },
    actionBtnText: { fontSize: 11, color: PRIMARY, fontWeight: '600' },

    // Info note
    infoNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        backgroundColor: `${PRIMARY}08`,
        borderRadius: Radii.sm,
        padding: Spacing.md,
        marginTop: Spacing.sm,
    },
    infoNoteText: {
        flex: 1,
        fontSize: 11,
        color: Colors.charcoalLight,
        lineHeight: 16,
    },
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
        shadowOpacity: 0.1,
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
    grid: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
    card: {
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
    cardIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: `${PRIMARY}12`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    cardLabel: {
        fontSize: Typography.sm,
        fontWeight: '600',
        color: Colors.charcoal,
        textAlign: 'center',
    },
    cardSub: { fontSize: 10, color: Colors.charcoalLight, textAlign: 'center' },
    cancel: {
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

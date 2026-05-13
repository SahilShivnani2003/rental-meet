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
import Field from '@/components/UI/InputField';
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

type PickerAction = 'camera' | 'gallery' | 'file';

const ACCOUNT_TYPES = [
    { value: 'savings', label: 'Savings', icon: 'wallet-outline' },
    { value: 'current', label: 'Current', icon: 'business-outline' },
] as const;

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
                <Text style={sheet.title}>Upload Proof</Text>
                <Text style={sheet.subtitle}>Cheque leaf, passbook, or bank statement</Text>

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

// ─── Bank Proof Upload Box ─────────────────────────────────────────────────

function ProofUploadBox({
    value,
    onUpload,
    onView,
    onReplace,
}: {
    value?: string;
    onUpload: () => void;
    onView?: () => void;
    onReplace?: () => void;
}) {
    if (value) {
        const fileName = value.split('/').pop() ?? 'Document';
        const isPdf = value.toLowerCase().endsWith('.pdf');

        return (
            <View style={p.filledBox}>
                <View style={p.filledTop}>
                    <View style={p.filledIconCircle}>
                        <Ionicons
                            name={isPdf ? 'document-text' : 'image'}
                            size={24}
                            color={SUCCESS}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={p.filledName} numberOfLines={1}>
                            {fileName}
                        </Text>
                        <View style={p.uploadedPill}>
                            <Ionicons name="checkmark-circle" size={11} color={SUCCESS} />
                            <Text style={p.uploadedPillText}>Uploaded successfully</Text>
                        </View>
                    </View>
                </View>
                <View style={p.filledActions}>
                    {onView && (
                        <TouchableOpacity style={p.actionBtn} onPress={onView} activeOpacity={0.7}>
                            <Ionicons name="eye-outline" size={14} color={PRIMARY} />
                            <Text style={p.actionBtnText}>View</Text>
                        </TouchableOpacity>
                    )}
                    {onReplace && (
                        <TouchableOpacity
                            style={[p.actionBtn, p.actionBtnAlt]}
                            onPress={onReplace}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="refresh-outline" size={14} color={Colors.charcoalMid} />
                            <Text style={[p.actionBtnText, { color: Colors.charcoalMid }]}>
                                Replace
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    return (
        <TouchableOpacity style={p.emptyBox} onPress={onUpload} activeOpacity={0.8}>
            <View style={p.emptyIconWrap}>
                <Ionicons name="cloud-upload-outline" size={28} color={PRIMARY} />
            </View>
            <Text style={p.emptyTitle}>Tap to upload</Text>
            <View style={p.badgeRow}>
                {['Camera', 'Gallery', 'Files'].map(b => (
                    <View key={b} style={p.badge}>
                        <Text style={p.badgeText}>{b}</Text>
                    </View>
                ))}
            </View>
            <Text style={p.emptySubtext}>Cheque leaf · Passbook · Statement (max 10 MB)</Text>
        </TouchableOpacity>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function Step7Bank({ data, onChange }: Props) {
    const bank = (data.bankDetails as Record<string, any>) || {};

    const update = (field: string, value: any) =>
        onChange('bankDetails', { ...bank, [field]: value });

    const [sheetVisible, setSheetVisible] = useState(false);

    // ── Picker handlers ──────────────────────────────────────────────────
    const handlePickerAction = async (action: PickerAction) => {
        try {
            if (action === 'camera') {
                const res = await launchCamera({ mediaType: 'photo', quality: 0.8 });
                const asset: Asset | undefined = res.assets?.[0];
                if (asset?.uri) update('proof', asset.uri);
            } else if (action === 'gallery') {
                const res = await launchImageLibrary({
                    mediaType: 'photo',
                    quality: 0.8,
                    selectionLimit: 1,
                });
                const asset: Asset | undefined = res.assets?.[0];
                if (asset?.uri) update('proof', asset.uri);
            } else {
                const results = await pickDoc({
                    allowMultiSelection: false,
                    type: [DocTypes.images, DocTypes.pdf],
                });
                const uri = results[0]?.uri;
                if (uri) update('proof', uri);
            }
        } catch (err: any) {
            if (!isErrorWithCode(err)) {
                Alert.alert('Upload failed', err?.message ?? 'Something went wrong.');
            }
        }
    };

    // ── Completion check ─────────────────────────────────────────────────
    const requiredFilled = [
        bank.accountHolderName,
        bank.accountNumber,
        bank.ifsc,
        bank.bankName,
        bank.accountType,
        bank.proof,
    ].filter(Boolean).length;
    const totalRequired = 6;
    const pct = Math.round((requiredFilled / totalRequired) * 100);

    return (
        <>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.container}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Header ──────────────────────────────────────────── */}
                <View style={s.headerRow}>
                    <View style={s.headerIcon}>
                        <Ionicons name="card" size={18} color="#fff" />
                    </View>
                    <View>
                        <Text style={s.sectionTitle}>Bank Details for Payouts</Text>
                        <Text style={s.sectionSub}>Your earnings will be transferred here</Text>
                    </View>
                </View>

                {/* ── Progress bar ─────────────────────────────────────── */}
                <View style={s.progressWrap}>
                    <View style={s.progressRow}>
                        <Text style={s.progressLabel}>
                            {requiredFilled}/{totalRequired} required fields
                        </Text>
                        <Text style={s.progressPct}>{pct}%</Text>
                    </View>
                    <View style={s.progressTrack}>
                        <View style={[s.progressFill, { width: `${pct}%` as any }]} />
                    </View>
                </View>

                {/* ── Account Holder Name ──────────────────────────────── */}
                <Field
                    label="Account Holder Name *"
                    placeholder="Name as on bank account"
                    icon="person-outline"
                    value={bank.accountHolderName || ''}
                    onChangeText={v => update('accountHolderName', v)}
                    autoCapitalize="words"
                />

                {/* ── Account Number ───────────────────────────────────── */}
                <Field
                    label="Account Number *"
                    placeholder="Enter account number"
                    icon="keypad-outline"
                    keyboardType="numeric"
                    value={bank.accountNumber || ''}
                    onChangeText={v => update('accountNumber', v)}
                    secureTextEntry={false}
                />

                {/* ── IFSC + Bank Name ─────────────────────────────────── */}
                <View style={s.rowWrap}>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="IFSC Code *"
                            placeholder="e.g. SBIN0001234"
                            icon="barcode-outline"
                            autoCapitalize="characters"
                            value={bank.ifsc || ''}
                            onChangeText={v => update('ifsc', v.toUpperCase())}
                        />
                        {bank.ifsc?.length === 11 && (
                            <View style={s.ifscHint}>
                                <Ionicons
                                    name="information-circle-outline"
                                    size={12}
                                    color={PRIMARY}
                                />
                                <Text style={s.ifscHintText}>11 characters — looks good</Text>
                            </View>
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="Bank Name *"
                            placeholder="e.g. State Bank"
                            icon="business-outline"
                            value={bank.bankName || ''}
                            onChangeText={v => update('bankName', v)}
                        />
                    </View>
                </View>

                {/* ── Branch Name ──────────────────────────────────────── */}
                <Field
                    label="Branch Name"
                    placeholder="Optional — e.g. Connaught Place"
                    icon="location-outline"
                    value={bank.branchName || ''}
                    onChangeText={v => update('branchName', v)}
                />

                {/* ── Account Type ─────────────────────────────────────── */}
                <View style={s.fieldWrap}>
                    <Text style={s.label}>
                        Account Type <Text style={s.required}>*</Text>
                    </Text>
                    <View style={s.accountTypeRow}>
                        {ACCOUNT_TYPES.map(type => {
                            const active = bank.accountType === type.value;
                            return (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[s.typeCard, active && s.typeCardActive]}
                                    onPress={() => update('accountType', type.value)}
                                    activeOpacity={0.75}
                                >
                                    <View style={[s.typeIconWrap, active && s.typeIconWrapActive]}>
                                        <Ionicons
                                            name={type.icon}
                                            size={20}
                                            color={active ? PRIMARY : Colors.charcoalLight}
                                        />
                                    </View>
                                    <Text style={[s.typeLabel, active && s.typeLabelActive]}>
                                        {type.label}
                                    </Text>
                                    <View style={[s.radioOuter, active && s.radioOuterActive]}>
                                        {active && <View style={s.radioInner} />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* ── Divider ──────────────────────────────────────────── */}
                <View style={s.divider}>
                    <View style={s.dividerLine} />
                    <Text style={s.dividerText}>Optional</Text>
                    <View style={s.dividerLine} />
                </View>

                {/* ── UPI ──────────────────────────────────────────────── */}
                <Field
                    label="UPI ID"
                    placeholder="yourname@upi"
                    icon="logo-upi"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={bank.upiId || ''}
                    onChangeText={v => update('upiId', v)}
                />

                {/* ── Bank Proof ───────────────────────────────────────── */}
                <View style={s.fieldWrap}>
                    <View style={s.labelRow}>
                        <Text style={s.label}>
                            Bank A/C Proof <Text style={s.required}>*</Text>
                        </Text>
                        <View style={s.reqBadge}>
                            <Text style={s.reqBadgeText}>Required</Text>
                        </View>
                    </View>
                    <Text style={s.fieldHint}>
                        Cancelled cheque leaf, passbook first page, or bank statement
                    </Text>
                    <ProofUploadBox
                        value={bank.proof}
                        onUpload={() => setSheetVisible(true)}
                        onView={bank.proof ? () => console.log('View proof') : undefined}
                        onReplace={bank.proof ? () => setSheetVisible(true) : undefined}
                    />
                </View>

                {/* ── Security note ─────────────────────────────────────── */}
                <View style={s.securityNote}>
                    <Ionicons name="lock-closed-outline" size={15} color={PRIMARY} />
                    <Text style={s.securityNoteText}>
                        Your bank details are encrypted and used solely for processing payouts. We
                        never share them with third parties.
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

    // Header
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
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
        fontSize: 11,
        color: Colors.charcoalLight,
        marginTop: 2,
    },

    // Progress
    progressWrap: { marginBottom: Spacing.xl },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    progressLabel: { fontSize: 11, color: Colors.charcoalLight },
    progressPct: { fontSize: 11, color: PRIMARY, fontWeight: '600' },
    progressTrack: {
        height: 4,
        borderRadius: 2,
        backgroundColor: `${PRIMARY}18`,
        overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 2, backgroundColor: PRIMARY },

    // Layout helpers
    rowWrap: { flexDirection: 'row', gap: Spacing.md },
    fieldWrap: { marginBottom: Spacing.lg },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: 3,
    },
    label: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
    },
    required: { color: Colors.danger },
    fieldHint: { fontSize: 11, color: Colors.charcoalLight, marginBottom: Spacing.sm },
    reqBadge: {
        backgroundColor: '#FFF0F0',
        borderRadius: 4,
        paddingHorizontal: 5,
        paddingVertical: 1,
    },
    reqBadgeText: { fontSize: 9, color: Colors.danger, fontWeight: '700' },

    // IFSC hint
    ifscHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: -Spacing.sm,
        marginBottom: Spacing.sm,
    },
    ifscHintText: { fontSize: 10, color: PRIMARY },

    // Account type cards
    accountTypeRow: { flexDirection: 'row', gap: Spacing.md },
    typeCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.sm,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    typeCardActive: {
        borderColor: PRIMARY,
        backgroundColor: `${PRIMARY}08`,
    },
    typeIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: `${Colors.charcoalLight}15`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeIconWrapActive: { backgroundColor: `${PRIMARY}15` },
    typeLabel: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    typeLabelActive: { color: Colors.charcoal, fontWeight: Typography.semiBold },
    radioOuter: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterActive: { borderColor: PRIMARY },
    radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY },

    // Divider
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginVertical: Spacing.lg,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
    dividerText: { fontSize: 11, color: Colors.charcoalLight, fontWeight: '500' },

    // Security note
    securityNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        backgroundColor: `${PRIMARY}08`,
        borderRadius: Radii.sm,
        padding: Spacing.md,
        marginTop: Spacing.sm,
    },
    securityNoteText: {
        flex: 1,
        fontSize: 11,
        color: Colors.charcoalLight,
        lineHeight: 16,
    },
});

// ─── Proof Upload Styles ───────────────────────────────────────────────────

const p = StyleSheet.create({
    emptyBox: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        borderRadius: Radii.md ?? 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xxl,
        backgroundColor: Colors.surface,
        gap: 6,
    },
    emptyIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: `${PRIMARY}12`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    emptyTitle: {
        fontSize: Typography.sm,
        color: Colors.charcoal,
        fontWeight: Typography.semiBold,
    },
    badgeRow: { flexDirection: 'row', gap: 6 },
    badge: {
        backgroundColor: `${PRIMARY}12`,
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    badgeText: { fontSize: 10, color: PRIMARY, fontWeight: '600' },
    emptySubtext: { fontSize: 10, color: Colors.charcoalLight, marginTop: 2 },

    filledBox: {
        borderWidth: 1.5,
        borderColor: `${SUCCESS}55`,
        borderRadius: Radii.md ?? 12,
        backgroundColor: `${SUCCESS}0C`,
        overflow: 'hidden',
    },
    filledTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
    },
    filledIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: `${SUCCESS}18`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filledName: {
        fontSize: Typography.sm,
        color: Colors.charcoal,
        fontWeight: Typography.medium,
        marginBottom: 4,
    },
    uploadedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: `${SUCCESS}18`,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignSelf: 'flex-start',
    },
    uploadedPillText: { fontSize: 9, color: SUCCESS, fontWeight: '700' },
    filledActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: `${SUCCESS}30`,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 10,
        borderRightWidth: 1,
        borderRightColor: `${SUCCESS}30`,
    },
    actionBtnAlt: { borderRightWidth: 0 },
    actionBtnText: { fontSize: 12, color: PRIMARY, fontWeight: '600' },
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

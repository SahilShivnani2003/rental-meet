import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    FlatList,
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Clipboard from '@react-native-clipboard/clipboard';

import { Colors, Typography, Spacing, Radii, Shadows } from '@theme/theme';
import {
    useGetAmbassadorProfile,
    useUpdateAmbassadorProfile,
} from '../hooks/useAmbassador';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { AmbassadorTabParamList } from '@/navigations/tabNavigations/AmbassadorTabNavigation';

// ── Types ─────────────────────────────────────────────────────────────────────
type ProfileForm = {
    fullName: string;
    dob: string;
    gender: string;
    alternateNumber: string;
    email: string;
    aadhaarNumber: string;
    profileType: string;

    currentAddress: string;
    coverageArea: string;
    city: string;
    state: string;
    pinCode: string;

    occupation: string;
    companyName: string;

    upiId: string;
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
};

const EMPTY_FORM: ProfileForm = {
    fullName: '',
    dob: '',
    gender: '',
    alternateNumber: '',
    email: '',
    aadhaarNumber: '',
    profileType: '',
    currentAddress: '',
    coverageArea: '',
    city: '',
    state: '',
    pinCode: '',
    occupation: '',
    companyName: '',
    upiId: '',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
};

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const PROFILE_TYPE_OPTIONS = ['Venue Explorer (Part-Time)', 'Full-Time Ambassador', 'Agency Partner'];

// ── Small building blocks ────────────────────────────────────────────────────

const SectionHeader = ({
    index,
    title,
    progress,
    optional,
}: {
    index: number;
    title: string;
    progress?: string;
    optional?: boolean;
}) => (
    <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
            <View style={styles.sectionIndexBadge}>
                <Text style={styles.sectionIndexBadgeText}>{index}</Text>
            </View>
            <Text style={styles.sectionHeaderTitle}>
                PART {index}: {title}
                {optional ? ' (OPTIONAL)' : ''}
            </Text>
        </View>
        {progress ? <Text style={styles.sectionHeaderProgress}>{progress}</Text> : null}
    </View>
);

const Field = ({
    label,
    required,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    editable = true,
    flex = 1,
}: {
    label: string;
    required?: boolean;
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
    editable?: boolean;
    flex?: number;
}) => (
    <View style={[styles.field, { flexGrow: flex, flexBasis: 0 }]}>
        <Text style={styles.fieldLabel}>
            {label}
            {required ? <Text style={styles.requiredStar}> *</Text> : null}
        </Text>
        <TextInput
            style={[styles.fieldInput, !editable && styles.fieldInputDisabled]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={Colors.charcoalLight}
            keyboardType={keyboardType}
            editable={editable}
        />
    </View>
);

const Dropdown = ({
    label,
    required,
    value,
    options,
    onSelect,
    flex = 1,
}: {
    label: string;
    required?: boolean;
    value: string;
    options: string[];
    onSelect: (v: string) => void;
    flex?: number;
}) => {
    const [open, setOpen] = React.useState(false);

    return (
        <View style={[styles.field, { flexGrow: flex, flexBasis: 0 }]}>
            <Text style={styles.fieldLabel}>
                {label}
                {required ? <Text style={styles.requiredStar}> *</Text> : null}
            </Text>
            <TouchableOpacity
                style={styles.dropdownField}
                onPress={() => setOpen(true)}
                activeOpacity={0.7}
            >
                <Text
                    style={[
                        styles.dropdownValue,
                        !value && styles.dropdownPlaceholder,
                    ]}
                    numberOfLines={1}
                >
                    {value || 'Select'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={Colors.charcoalLight} />
            </TouchableOpacity>

            <Modal visible={open} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setOpen(false)}
                >
                    <View style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>{label}</Text>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalOption}
                                    onPress={() => {
                                        onSelect(item);
                                        setOpen(false);
                                    }}
                                >
                                    <Text style={styles.modalOptionText}>{item}</Text>
                                    {item === value && (
                                        <Ionicons
                                            name="checkmark"
                                            size={16}
                                            color={Colors.primary}
                                        />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const StatusPill = ({
    icon,
    label,
    verified,
}: {
    icon: string;
    label: string;
    verified: boolean;
}) => (
    <View
        style={[
            styles.statusPill,
            { backgroundColor: verified ? Colors.successLight : Colors.background },
            { borderColor: verified ? Colors.success : Colors.border },
        ]}
    >
        <Ionicons
            name={icon}
            size={18}
            color={verified ? Colors.success : Colors.charcoalLight}
        />
        <Text
            style={[
                styles.statusPillLabel,
                { color: verified ? Colors.success : Colors.charcoalMid },
            ]}
        >
            {label}
        </Text>
        <Text style={styles.statusPillSub}>
            {verified ? 'Verified' : 'Pending'}
        </Text>
    </View>
);

// ── Screen ────────────────────────────────────────────────────────────────────
type AmbassadorProfileScreenProps = NativeBottomTabScreenProps<AmbassadorTabParamList, 'profile'>
export default function AmbassadorProfileScreen({navigation}: AmbassadorProfileScreenProps) {
    const { data: profile, isLoading } = useGetAmbassadorProfile();
    const updateProfile = useUpdateAmbassadorProfile();

    const [editing, setEditing] = React.useState(false);
    const [form, setForm] = React.useState<ProfileForm>(EMPTY_FORM);

    React.useEffect(() => {
        if (profile) {
            setForm((prev) => ({ ...prev, ...profile }));
        }
    }, [profile]);

    const set = (key: keyof ProfileForm) => (value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const referralLink =
        profile?.referralLink ??
        `https://meetambassador.app/invite/${profile?.referralCode ?? ''}`;

    const handleCopyLink = () => {
        Clipboard.setString(referralLink);
        Alert.alert('Copied', 'Referral link copied to clipboard.');
    };

    const handleShareWhatsApp = () => {
        const message = `Join Meet as an Ambassador Partner using my referral link: ${referralLink}`;
        const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
        Linking.canOpenURL(url).then((supported) => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert('WhatsApp not installed', 'Please install WhatsApp to share.');
            }
        });
    };

    const handleSave = () => {
        updateProfile.mutate(form as any, {
            onSuccess: () => {
                setEditing(false);
                Alert.alert('Saved', 'Your profile changes have been saved.');
            },
            onError: () => {
                Alert.alert('Error', 'Could not save profile changes. Please try again.');
            },
        });
    };

    const aadhaarVerified = !!profile?.aadhaarVerified;
    const bankVerified = !!profile?.bankVerified;
    const addressVerified = !!profile?.addressVerified;
    const profileComplete = !!profile?.profileComplete;

    const initials = (form.fullName || 'A P')
        .split(' ')
        .map((s) => s[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Dark profile header */}
            <View style={styles.profileHeader}>
                <View style={styles.profileHeaderTop}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                        <Text style={styles.profileName}>
                            {form.fullName || 'Ambassador'}
                        </Text>
                        <View style={styles.badgeRow}>
                            <View style={styles.partnerBadge}>
                                <Text style={styles.partnerBadgeText}>
                                    AMBASSADOR PARTNER
                                </Text>
                            </View>
                            {profileComplete && (
                                <View style={styles.verifiedBadge}>
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={12}
                                        color={Colors.success}
                                    />
                                    <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.statsBox}>
                        <View style={styles.statsRow}>
                            <Ionicons name="logo-bitcoin" size={14} color={Colors.primary} />
                            <Text style={styles.statsValue}>
                                {profile?.pointsBalance ?? 0}
                            </Text>
                        </View>
                        <View style={styles.statsRow}>
                            <Ionicons name="people" size={14} color={Colors.primary} />
                            <Text style={styles.statsValue}>
                                {profile?.referralCount ?? 0}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Referral link */}
            <View style={styles.referralCard}>
                <View style={styles.referralTitleRow}>
                    <Ionicons name="link" size={14} color={Colors.primary} />
                    <Text style={styles.referralTitle}>Your Ambassador Referral Link</Text>
                </View>
                <Text style={styles.referralSubtitle}>
                    Share this link with friends and earn rewards when they sign up and
                    become a partner.
                </Text>

                <View style={styles.referralRow}>
                    <View style={styles.referralInputBox}>
                        <Text style={styles.referralInputText} numberOfLines={1}>
                            {referralLink}
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
                        <Ionicons name="copy-outline" size={14} color={Colors.charcoal} />
                        <Text style={styles.copyButtonText}>Copy Link</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.whatsappButton}
                        onPress={handleShareWhatsApp}
                    >
                        <Ionicons name="logo-whatsapp" size={14} color={Colors.white} />
                        <Text style={styles.whatsappButtonText}>Share on WhatsApp</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Details header */}
            <View style={styles.detailsHeaderRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.detailsTitle}>Ambassador Details & Bank Settings</Text>
                    <Text style={styles.detailsSubtitle}>
                        Keep your personal, address, and payout information up to date.
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setEditing((v) => !v)}
                >
                    <Ionicons name="create-outline" size={14} color={Colors.white} />
                    <Text style={styles.editButtonText}>
                        {editing ? 'Editing' : 'Edit Profile'}
                    </Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <ActivityIndicator
                    color={Colors.primary}
                    style={{ marginVertical: Spacing.xl }}
                />
            ) : (
                <View style={styles.formCard}>
                    {/* Part 1 */}
                    <SectionHeader index={1} title="PERSONAL INFORMATION" progress="5 / 5" />
                    <View style={styles.fieldRow}>
                        <Field
                            label="Full Name (As per Govt. ID)"
                            required
                            value={form.fullName}
                            onChangeText={set('fullName')}
                            editable={editing}
                        />
                        <Field
                            label="Date of Birth"
                            required
                            value={form.dob}
                            onChangeText={set('dob')}
                            placeholder="DD/MM/YYYY"
                            editable={editing}
                        />
                    </View>
                    <View style={styles.fieldRow}>
                        <Dropdown
                            label="Gender"
                            required
                            value={form.gender}
                            options={GENDER_OPTIONS}
                            onSelect={set('gender')}
                        />
                        <Field
                            label="Alternate Number (WhatsApp)"
                            required
                            value={form.alternateNumber}
                            onChangeText={set('alternateNumber')}
                            keyboardType="phone-pad"
                            editable={editing}
                        />
                    </View>
                    <View style={styles.fieldRow}>
                        <Field
                            label="Email Address"
                            required
                            value={form.email}
                            onChangeText={set('email')}
                            keyboardType="email-address"
                            editable={editing}
                        />
                        <Field
                            label="Aadhaar / Voter ID Number"
                            required
                            value={form.aadhaarNumber}
                            onChangeText={set('aadhaarNumber')}
                            editable={editing}
                        />
                    </View>
                    <View style={styles.fieldRow}>
                        <Dropdown
                            label="Profile Type"
                            required
                            value={form.profileType}
                            options={PROFILE_TYPE_OPTIONS}
                            onSelect={set('profileType')}
                        />
                        <View style={{ flexGrow: 1, flexBasis: 0 }} />
                    </View>

                    <View style={styles.divider} />

                    {/* Part 2 */}
                    <SectionHeader index={2} title="ADDRESS & COVERAGE AREA" />
                    <View style={styles.fieldRow}>
                        <Field
                            label="Current Address"
                            required
                            value={form.currentAddress}
                            onChangeText={set('currentAddress')}
                            editable={editing}
                            flex={2}
                        />
                        <Field
                            label="Ambassador Coverage Area"
                            required
                            value={form.coverageArea}
                            onChangeText={set('coverageArea')}
                            editable={editing}
                        />
                    </View>
                    <View style={styles.fieldRow}>
                        <Field
                            label="City"
                            required
                            value={form.city}
                            onChangeText={set('city')}
                            editable={editing}
                        />
                        <Field
                            label="State"
                            required
                            value={form.state}
                            onChangeText={set('state')}
                            editable={editing}
                        />
                        <Field
                            label="Pin Code"
                            required
                            value={form.pinCode}
                            onChangeText={set('pinCode')}
                            keyboardType="numeric"
                            editable={editing}
                        />
                    </View>

                    <View style={styles.divider} />

                    {/* Part 3 */}
                    <SectionHeader index={3} title="PROFESSIONAL INFO" />
                    <View style={styles.fieldRow}>
                        <Field
                            label="Current Occupation"
                            value={form.occupation}
                            onChangeText={set('occupation')}
                            editable={editing}
                        />
                        <Field
                            label="Company Name"
                            value={form.companyName}
                            onChangeText={set('companyName')}
                            editable={editing}
                        />
                    </View>

                    <View style={styles.divider} />

                    {/* Part 4 */}
                    <SectionHeader index={4} title="BANK & UPI DETAILS" optional />
                    <View style={styles.fieldRow}>
                        <Field
                            label="UPI ID (Recommended)"
                            value={form.upiId}
                            onChangeText={set('upiId')}
                            editable={editing}
                        />
                        <Field
                            label="Account Holder Name"
                            value={form.accountHolderName}
                            onChangeText={set('accountHolderName')}
                            editable={editing}
                        />
                    </View>
                    <View style={styles.fieldRow}>
                        <Field
                            label="Bank Name"
                            value={form.bankName}
                            onChangeText={set('bankName')}
                            editable={editing}
                        />
                        <Field
                            label="Account Number"
                            value={form.accountNumber}
                            onChangeText={set('accountNumber')}
                            keyboardType="numeric"
                            editable={editing}
                        />
                        <Field
                            label="IFSC Code"
                            value={form.ifscCode}
                            onChangeText={set('ifscCode')}
                            editable={editing}
                        />
                    </View>

                    <View style={styles.divider} />

                    {/* Part 5 */}
                    <SectionHeader index={5} title="STEP REQUIREMENTS & STATUS" />
                    <View style={styles.statusGrid}>
                        <StatusPill
                            icon="finger-print-outline"
                            label="Aadhaar Verified"
                            verified={aadhaarVerified}
                        />
                        <StatusPill
                            icon="card-outline"
                            label="Bank Verified"
                            verified={bankVerified}
                        />
                        <StatusPill
                            icon="location-outline"
                            label="Address"
                            verified={addressVerified}
                        />
                        <StatusPill
                            icon="person-circle-outline"
                            label="Profile Complete"
                            verified={profileComplete}
                        />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            (!editing || updateProfile.isPending) &&
                                styles.saveButtonDisabled,
                        ]}
                        onPress={handleSave}
                        disabled={!editing || updateProfile.isPending}
                    >
                        {updateProfile.isPending ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                            <>
                                <Ionicons
                                    name="save-outline"
                                    size={14}
                                    color={Colors.white}
                                />
                                <Text style={styles.saveButtonText}>
                                    Save Profile Changes
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xxl,
        gap: Spacing.lg,
    },

    // Profile header
    profileHeader: {
        backgroundColor: Colors.tabBar,
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        ...Shadows.header,
    },
    profileHeaderTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: Radii.full,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: Colors.white,
        fontWeight: Typography.bold,
        fontSize: Typography.md,
    },
    profileName: {
        color: Colors.white,
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.xxs,
    },
    partnerBadge: {
        backgroundColor: Colors.primaryDim,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
    },
    partnerBadgeText: {
        fontSize: 9,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: Typography.normal,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(22,163,74,0.15)',
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
    },
    verifiedBadgeText: {
        fontSize: 9,
        fontWeight: Typography.bold,
        color: Colors.success,
        letterSpacing: Typography.normal,
    },
    statsBox: {
        gap: Spacing.xxs,
        alignItems: 'flex-end',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statsValue: {
        color: Colors.white,
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
    },

    // Referral link
    referralCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        gap: Spacing.xxs,
        ...Shadows.card,
    },
    referralTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xxs,
    },
    referralTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    referralSubtitle: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        marginBottom: Spacing.sm,
    },
    referralRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        alignItems: 'center',
    },
    referralInputBox: {
        flexGrow: 1,
        flexBasis: '100%',
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    referralInputText: {
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xxs,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    copyButtonText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    whatsappButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xxs,
        backgroundColor: '#25D366',
        borderRadius: Radii.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    whatsappButtonText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.white,
    },

    // Details header
    detailsHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    detailsTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
    detailsSubtitle: {
        marginTop: 2,
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xxs,
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        ...Shadows.primary,
    },
    editButtonText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.white,
    },

    // Form
    formCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        gap: Spacing.sm,
        ...Shadows.card,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    sectionIndexBadge: {
        width: 18,
        height: 18,
        borderRadius: Radii.full,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionIndexBadgeText: {
        fontSize: 10,
        fontWeight: Typography.bold,
        color: Colors.primaryDark,
    },
    sectionHeaderTitle: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: Typography.normal,
    },
    sectionHeaderProgress: {
        fontSize: Typography.xs,
        fontWeight: Typography.semiBold,
        color: Colors.primary,
    },

    fieldRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
        marginBottom: Spacing.sm,
    },
    field: {
        minWidth: 140,
        gap: 4,
    },
    fieldLabel: {
        fontSize: Typography.xs,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    requiredStar: {
        color: Colors.danger,
    },
    fieldInput: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs,
        fontSize: Typography.sm,
        color: Colors.charcoal,
        backgroundColor: Colors.surface,
    },
    fieldInputDisabled: {
        backgroundColor: Colors.background,
        color: Colors.charcoalMid,
    },

    dropdownField: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.surface,
    },
    dropdownValue: {
        fontSize: Typography.sm,
        color: Colors.charcoal,
        flex: 1,
    },
    dropdownPlaceholder: {
        color: Colors.charcoalLight,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.lg,
        borderTopRightRadius: Radii.lg,
        padding: Spacing.lg,
        maxHeight: '50%',
    },
    modalTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginBottom: Spacing.sm,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    modalOptionText: {
        fontSize: Typography.base,
        color: Colors.charcoal,
    },

    divider: {
        height: 1,
        backgroundColor: Colors.divider,
        marginVertical: Spacing.sm,
    },

    statusGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    statusPill: {
        flexGrow: 1,
        flexBasis: '46%',
        borderWidth: 1,
        borderRadius: Radii.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    statusPillLabel: {
        flex: 1,
        fontSize: Typography.xs,
        fontWeight: Typography.semiBold,
    },
    statusPillSub: {
        fontSize: 9,
        color: Colors.charcoalLight,
    },

    saveButton: {
        flexDirection: 'row',
        alignSelf: 'flex-end',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        ...Shadows.primary,
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        color: Colors.white,
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
    },
});
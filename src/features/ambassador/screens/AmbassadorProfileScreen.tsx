import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
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
    Animated,
    RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Clipboard from '@react-native-clipboard/clipboard';

import { Colors, Typography, Spacing, Radii, Shadows } from '@theme/theme';
import { useGetAmbassadorProfile, useUpdateAmbassadorProfile } from '../hooks/useAmbassador';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { AmbassadorTabParamList } from '@/navigations/tabNavigations/AmbassadorTabNavigation';
import useEntrance from '@/hooks/useEntrance';
import { useAuthStore } from '@/store/useAuthStore';
import { useAlert } from '@/context/AlertContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';
import { AmbassadorProfile, UpdateAmbassadorProfilePayload } from '../types/AmbassadorProfile';

// ── Types ─────────────────────────────────────────────────────────────────────
// Flat, editable form. Each field is sourced from a nested path on
// AmbassadorProfile (see profileToForm) and written back to the matching
// nested path on save (see formToUpdatePayload).
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
const PROFILE_TYPE_OPTIONS = [
    'Venue Explorer (Part-Time)',
    'Full-Time Ambassador',
    'Agency Partner',
];

// Maps the nested API profile → the flat form the inputs edit.
function profileToForm(profile?: AmbassadorProfile): ProfileForm {
    if (!profile) return EMPTY_FORM;
    const { personalInfo, addressDetails, professionalDetails, bankDetails } = profile;
    return {
        fullName: personalInfo?.fullName ?? '',
        dob: personalInfo?.dateOfBirth ?? '',
        gender: personalInfo?.gender ?? '',
        alternateNumber: personalInfo?.whatsAppNumber || personalInfo?.mobileNumber || '',
        email: personalInfo?.email ?? '',
        aadhaarNumber: personalInfo?.aadhaarNumber ?? '',
        profileType: profile.profileType ?? '',
        currentAddress: addressDetails?.currentAddress ?? '',
        coverageArea: addressDetails?.areaCoverage ?? '',
        city: addressDetails?.city ?? '',
        state: addressDetails?.state ?? '',
        pinCode: addressDetails?.pincode ?? '',
        occupation: professionalDetails?.currentOccupation ?? '',
        companyName: professionalDetails?.companyName ?? '',
        upiId: bankDetails?.upiId ?? '',
        accountHolderName: bankDetails?.accountHolderName ?? '',
        bankName: bankDetails?.bankName ?? '',
        accountNumber: bankDetails?.accountNumber ?? '',
        ifscCode: bankDetails?.ifscCode ?? '',
    };
}

// Maps the flat form back into the nested shape the update endpoint expects.
function formToUpdatePayload(form: ProfileForm): UpdateAmbassadorProfilePayload {
    return {
        personalInfo: {
            fullName: form.fullName,
            dateOfBirth: form.dob,
            gender: form.gender,
            whatsAppNumber: form.alternateNumber,
            email: form.email,
            aadhaarNumber: form.aadhaarNumber,
        },
        profileType: form.profileType,
        addressDetails: {
            currentAddress: form.currentAddress,
            areaCoverage: form.coverageArea,
            city: form.city,
            state: form.state,
            pincode: form.pinCode,
        },
        professionalDetails: {
            currentOccupation: form.occupation,
            companyName: form.companyName,
        },
        bankDetails: {
            upiId: form.upiId,
            accountHolderName: form.accountHolderName,
            bankName: form.bankName,
            accountNumber: form.accountNumber,
            ifscCode: form.ifscCode,
        },
    };
}

const STATUS_COLORS: Record<string, { fg: string; bg: string }> = {
    approved: { fg: Colors.success, bg: 'rgba(22,163,74,0.15)' },
    pending: { fg: '#B45309', bg: 'rgba(217,119,6,0.15)' },
    rejected: { fg: Colors.danger, bg: 'rgba(220,38,38,0.12)' },
};

// ── Pressable scale wrapper ──────────────────────────────────────────────────
function Pressy({
    onPress,
    style,
    children,
    disabled,
}: {
    onPress?: () => void;
    style?: any;
    children: React.ReactNode;
    disabled?: boolean;
}) {
    const scale = useRef(new Animated.Value(1)).current;
    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                style={style}
                onPress={onPress}
                disabled={disabled}
                activeOpacity={1}
                onPressIn={() =>
                    Animated.spring(scale, {
                        toValue: 0.97,
                        useNativeDriver: true,
                        speed: 30,
                    }).start()
                }
                onPressOut={() =>
                    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22 }).start()
                }
            >
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
}

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
    editable = true,
}: {
    label: string;
    required?: boolean;
    value: string;
    options: string[];
    onSelect: (v: string) => void;
    flex?: number;
    editable?: boolean;
}) => {
    const [open, setOpen] = useState(false);

    return (
        <View style={[styles.field, { flexGrow: flex, flexBasis: 0 }]}>
            <Text style={styles.fieldLabel}>
                {label}
                {required ? <Text style={styles.requiredStar}> *</Text> : null}
            </Text>
            <TouchableOpacity
                style={[styles.dropdownField, !editable && styles.fieldInputDisabled]}
                onPress={() => editable && setOpen(true)}
                activeOpacity={editable ? 0.7 : 1}
                disabled={!editable}
            >
                <Text
                    style={[styles.dropdownValue, !value && styles.dropdownPlaceholder]}
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
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>{label}</Text>
                        <FlatList
                            data={options}
                            keyExtractor={item => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalOption}
                                    onPress={() => {
                                        onSelect(item);
                                        setOpen(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.modalOptionText,
                                            item === value && styles.modalOptionTextActive,
                                        ]}
                                    >
                                        {item}
                                    </Text>
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
            {
                backgroundColor: verified ? Colors.successLight : Colors.background,
                borderColor: verified ? Colors.success : Colors.border,
            },
        ]}
    >
        <View
            style={[
                styles.statusPillIconWrap,
                { backgroundColor: verified ? 'rgba(22,163,74,0.15)' : Colors.border },
            ]}
        >
            <Ionicons
                name={icon}
                size={15}
                color={verified ? Colors.success : Colors.charcoalLight}
            />
        </View>
        <View style={{ flex: 1 }}>
            <Text
                style={[
                    styles.statusPillLabel,
                    { color: verified ? Colors.success : Colors.charcoalMid },
                ]}
                numberOfLines={1}
            >
                {label}
            </Text>
            <Text style={styles.statusPillSub}>{verified ? 'Done' : 'Pending'}</Text>
        </View>
    </View>
);

const AccountRow = ({
    icon,
    iconWrapStyle,
    iconColor,
    label,
    labelStyle,
    subtitle,
    onPress,
    disabled,
    trailing,
}: {
    icon: string;
    iconWrapStyle?: any;
    iconColor: string;
    label: string;
    labelStyle?: any;
    subtitle?: string;
    onPress?: () => void;
    disabled?: boolean;
    trailing?: React.ReactNode;
}) => (
    <Pressy style={styles.accountRow} onPress={onPress} disabled={disabled}>
        <View style={[styles.accountRowIconWrap, iconWrapStyle]}>
            <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={[styles.accountRowLabel, labelStyle]}>{label}</Text>
            {subtitle ? <Text style={styles.accountRowSubtitle}>{subtitle}</Text> : null}
        </View>
        {trailing ?? <Ionicons name="chevron-forward" size={16} color={Colors.charcoalLight} />}
    </Pressy>
);

// ── Screen ────────────────────────────────────────────────────────────────────
type AmbassadorProfileScreenProps = NativeBottomTabScreenProps<AmbassadorTabParamList, 'profile'>;
export default function AmbassadorProfileScreen({ navigation }: AmbassadorProfileScreenProps) {
    const alert = useAlert();
    const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    const { data: profileData, isLoading, isRefetching, refetch } = useGetAmbassadorProfile();
    const [profile, setProfile] = useState<AmbassadorProfile>();
    const updateProfile = useUpdateAmbassadorProfile();
    const { logOut } = useAuthStore();

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);

    // 1. Sync the fetched profile into local state whenever the query resolves/updates.
    useEffect(() => {
        if (profileData?.profile) {
            setProfile(profileData.profile);
        }
    }, [profileData]);

    // 2. Whenever `profile` actually changes, sync it into the editable form.
    //    Kept separate from the effect above so the mapping always reads the
    //    freshly-set `profile`, not a stale value from before setProfile ran.
    useEffect(() => {
        setForm(profileToForm(profile));
    }, [profile]);

    const headerFade = useRef(new Animated.Value(0)).current;
    const heroSlide = useRef(new Animated.Value(-16)).current;
    const { fade: cardFade, slide: cardSlide } = useEntrance(150);
    const { fade: referralFade, slide: referralSlide } = useEntrance(280);
    const { fade: formFade, slide: formSlide } = useEntrance(420);
    const { fade: accountFade, slide: accountSlide } = useEntrance(560);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(heroSlide, {
                toValue: 0,
                useNativeDriver: true,
                speed: 16,
                bounciness: 6,
            }),
        ]).start();
    }, []);

    const set = (key: keyof ProfileForm) => (value: string) =>
        setForm(prev => ({ ...prev, [key]: value }));

    // Referral code lives at profile.ambassadorId (and mirrored in
    // profile.referralInfo.referralCode / user.referralCode) — all three
    // are the same value in the API response, so fall through in that order.
    const referralCode =
        profile?.ambassadorId ||
        profile?.referralInfo?.referralCode ||
        profileData?.user?.referralCode ||
        '';
    const referralLink = `https://meetambassador.app/invite/${referralCode}`;

    const handleCopyLink = () => {
        Clipboard.setString(referralLink);
        Alert.alert('Copied', 'Referral link copied to clipboard.');
    };

    const handleShareWhatsApp = () => {
        const message = `Join Meet as an Ambassador Partner using my referral link: ${referralLink}`;
        const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert('WhatsApp not installed', 'Please install WhatsApp to share.');
            }
        });
    };

    const handleSave = () => {
        const payload = formToUpdatePayload(form);
        updateProfile.mutate(payload as any, {
            onSuccess: () => {
                setEditing(false);
                alert.success('Saved', 'Your profile changes have been saved.')
            },
            onError: () => {
                alert.error('Error','Could not save profile changes. Please try again.')
            },
        });
    };

    const handleLogout = useCallback(() => {
        alert.show({
            type: 'confirm',
            title: 'Log Out',
            message: 'Are you sure you want to log out?',
            buttons: [
                { label: 'Cancel', onPress: alert.dismiss, style: 'ghost' },
                {
                    label: 'Log Out',
                    onPress: async () => {
                        rootNav.reset({ index: 0, routes: [{ name: 'login' }] });
                        await logOut();
                        alert.dismiss();
                    },
                },
            ],
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Derived status / stats from the real API fields ─────────────────────
    const applicationStatus = profile?.applicationStatus ?? 'pending';
    const isApproved = applicationStatus === 'approved';
    const statusColor = STATUS_COLORS[applicationStatus] ?? STATUS_COLORS.pending;

    const aadhaarUploaded = !!profile?.documents?.aadhaarFront;
    const bankDetailsAdded = !!profile?.bankDetails?.accountNumber;
    const addressAdded = !!profile?.addressDetails?.currentAddress;

    const walletBalance = profile?.walletBalance ?? 0;
    const venuesApproved = profile?.totalVenuesApproved ?? 0;

    const initials = useMemo(
        () =>
            (form.fullName || 'A P')
                .split(' ')
                .map(s => s[0])
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase(),
        [form.fullName],
    );

    return (
        <View style={styles.screen}>
            {/* ── Header ────────────────────────────────────────────────────── */}
            <Animated.View
                style={[
                    styles.header,
                    { opacity: headerFade, transform: [{ translateY: heroSlide }] },
                ]}
            >
                <View style={styles.headerAccentBar} />
                <View style={styles.headerContent}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerEyebrow}>AMBASSADOR PORTAL</Text>
                        <Text style={styles.headerTitle}>My Profile</Text>
                    </View>
                    <Pressy style={styles.editButton} onPress={() => setEditing(v => !v)}>
                        <Ionicons
                            name={editing ? 'checkmark-circle-outline' : 'create-outline'}
                            size={15}
                            color={Colors.white}
                        />
                        <Text style={styles.editButtonText}>
                            {editing ? 'Editing' : 'Edit Profile'}
                        </Text>
                    </Pressy>
                </View>
            </Animated.View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentPadding}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={()=> refetch()}
                    />
                }
            >
                {/* ── Profile hero card ─────────────────────────────────────── */}
                <Animated.View
                    style={[
                        styles.heroCard,
                        { opacity: cardFade, transform: [{ translateY: cardSlide }] },
                    ]}
                >
                    <View style={styles.heroBanner} />
                    <View style={styles.heroContent}>
                        <View style={styles.avatarRing}>
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarText}>{initials}</Text>
                            </View>
                        </View>

                        <Text style={styles.profileName}>{form.fullName || 'Ambassador'}</Text>
                        <Text style={styles.profileMeta}>
                            {profile?.ambassadorId ?? ''}
                            {profile?.assignedLevel ? `  ·  ${profile.assignedLevel}` : ''}
                        </Text>

                        <View style={styles.badgeRow}>
                            <View style={styles.partnerBadge}>
                                <Text style={styles.partnerBadgeText}>
                                    {(profile?.badge || 'AMBASSADOR PARTNER').toUpperCase()}
                                </Text>
                            </View>
                            <View
                                style={[styles.verifiedBadge, { backgroundColor: statusColor.bg }]}
                            >
                                <Ionicons
                                    name={isApproved ? 'checkmark-circle' : 'time-outline'}
                                    size={11}
                                    color={statusColor.fg}
                                />
                                <Text style={[styles.verifiedBadgeText, { color: statusColor.fg }]}>
                                    {applicationStatus.toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.statsRow}>
                            <View style={styles.statChip}>
                                <Ionicons name="wallet-outline" size={13} color={Colors.primary} />
                                <Text style={styles.statChipValue}>₹{walletBalance}</Text>
                                <Text style={styles.statChipLabel}>Wallet</Text>
                            </View>
                            <View style={styles.statChip}>
                                <Ionicons
                                    name="business-outline"
                                    size={13}
                                    color={Colors.primary}
                                />
                                <Text style={styles.statChipValue}>{venuesApproved}</Text>
                                <Text style={styles.statChipLabel}>Venues Approved</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* ── Referral link ─────────────────────────────────────────── */}
                <Animated.View
                    style={[
                        styles.referralCard,
                        { opacity: referralFade, transform: [{ translateY: referralSlide }] },
                    ]}
                >
                    <View style={styles.referralTitleRow}>
                        <View style={styles.referralIconWrap}>
                            <Ionicons name="link" size={14} color={Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.referralTitle}>Your Ambassador Referral Link</Text>
                            <Text style={styles.referralSubtitle}>
                                Share this link and earn rewards when friends sign up as a partner.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.referralInputBox}>
                        <Text style={styles.referralInputText} numberOfLines={1}>
                            {referralLink}
                        </Text>
                    </View>

                    <View style={styles.referralBtnRow}>
                        <Pressy style={styles.copyButton} onPress={handleCopyLink}>
                            <Ionicons name="copy-outline" size={14} color={Colors.charcoal} />
                            <Text style={styles.copyButtonText}>Copy Link</Text>
                        </Pressy>

                        <Pressy style={styles.whatsappButton} onPress={handleShareWhatsApp}>
                            <Ionicons name="logo-whatsapp" size={14} color={Colors.white} />
                            <Text style={styles.whatsappButtonText}>Share on WhatsApp</Text>
                        </Pressy>
                    </View>
                </Animated.View>

                {/* ── Details section label ─────────────────────────────────── */}
                <Animated.View
                    style={{ opacity: formFade, transform: [{ translateY: formSlide }] }}
                >
                    <View style={styles.sectionLabelRow}>
                        <Text style={styles.menuSectionLabel}>DETAILS & BANK SETTINGS</Text>
                        <Text style={styles.resultsCount}>Keep this information up to date</Text>
                    </View>

                    {isLoading ? (
                        <ActivityIndicator
                            color={Colors.primary}
                            style={{ marginVertical: Spacing.xl }}
                        />
                    ) : (
                        <View style={styles.formCard}>
                            {/* Part 1 */}
                            <SectionHeader
                                index={1}
                                title="PERSONAL INFORMATION"
                                progress="5 / 5"
                            />
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
                                    editable={editing}
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
                                    editable={editing}
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
                                    label="Aadhaar Uploaded"
                                    verified={aadhaarUploaded}
                                />
                                <StatusPill
                                    icon="card-outline"
                                    label="Bank Details"
                                    verified={bankDetailsAdded}
                                />
                                <StatusPill
                                    icon="location-outline"
                                    label="Address"
                                    verified={addressAdded}
                                />
                                <StatusPill
                                    icon="person-circle-outline"
                                    label="Application Approved"
                                    verified={isApproved}
                                />
                            </View>

                            <Pressy
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
                            </Pressy>
                        </View>
                    )}
                </Animated.View>

                {/* ── Account ───────────────────────────────────────────────── */}
                <Animated.View
                    style={{ opacity: accountFade, transform: [{ translateY: accountSlide }] }}
                >
                    <View style={styles.sectionLabelRow}>
                        <Text style={styles.menuSectionLabel}>ACCOUNT</Text>
                    </View>

                    <View style={styles.accountCard}>
                        <AccountRow
                            icon="log-out-outline"
                            iconWrapStyle={styles.accountRowIconWrapDanger}
                            iconColor={Colors.danger}
                            label="Log Out"
                            labelStyle={styles.accountRowLabelDanger}
                            subtitle="You'll need to sign in again to access your account"
                            onPress={handleLogout}
                        />
                    </View>

                    <Text style={styles.footerText}>Meet Ambassador Portal</Text>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        paddingBottom: Spacing.lg,
        ...Shadows.header,
        zIndex: 10,
    },
    headerAccentBar: { height: 4, backgroundColor: Colors.primary },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
    },
    headerEyebrow: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: Typography.wider,
        marginBottom: Spacing.xxs,
    },
    headerTitle: {
        fontSize: Typography.xxl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xxs,
        backgroundColor: Colors.primary,
        borderRadius: Radii.md,
        paddingHorizontal: Spacing.md,
        height: 38,
        marginTop: 2,
        ...Shadows.primary,
    },
    editButtonText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.white,
    },
    content: { flex: 1 },
    contentPadding: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: 120,
        gap: Spacing.lg,
    },
    heroCard: {
        backgroundColor: Colors.surface,
        borderRadius: 24,
        ...Shadows.card,
    },
    heroBanner: {
        height: 64,
        backgroundColor: Colors.tabBar,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    heroContent: {
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        marginTop: -38,
    },
    avatarRing: {
        width: 84,
        height: 84,
        borderRadius: 42,
        borderWidth: 3,
        borderColor: Colors.surface,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
        ...Shadows.card,
    },
    avatarCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: Colors.white,
        fontWeight: Typography.bold,
        fontSize: Typography.lg,
    },
    profileName: {
        fontSize: 19,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        marginBottom: 2,
    },
    profileMeta: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        marginBottom: Spacing.xs,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.md,
    },
    partnerBadge: {
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
    },
    partnerBadgeText: {
        fontSize: 9,
        fontWeight: Typography.bold,
        color: Colors.primaryDark,
        letterSpacing: Typography.normal,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
    },
    verifiedBadgeText: {
        fontSize: 9,
        fontWeight: Typography.bold,
        letterSpacing: Typography.normal,
    },
    statsRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    statChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
    },
    statChipValue: {
        fontSize: Typography.sm,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
    statChipLabel: {
        fontSize: 10,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    referralCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        gap: Spacing.sm,
        ...Shadows.card,
    },
    referralTitleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    referralIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    referralTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginBottom: 2,
    },
    referralSubtitle: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        lineHeight: 16,
    },
    referralInputBox: {
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
    referralBtnRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
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
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.xxs,
    },
    menuSectionLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 2,
    },
    resultsCount: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
    },
    formCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
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
        borderTopLeftRadius: Radii.xl,
        borderTopRightRadius: Radii.xl,
        padding: Spacing.lg,
        maxHeight: '50%',
    },
    modalHandle: {
        alignSelf: 'center',
        width: 36,
        height: 4,
        borderRadius: Radii.full,
        backgroundColor: Colors.border,
        marginBottom: Spacing.sm,
    },
    modalTitle: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 1.5,
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
    modalOptionTextActive: {
        color: Colors.primaryDark,
        fontWeight: Typography.semiBold,
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
    statusPillIconWrap: {
        width: 28,
        height: 28,
        borderRadius: Radii.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusPillLabel: {
        fontSize: Typography.xs,
        fontWeight: Typography.semiBold,
    },
    statusPillSub: {
        fontSize: 9,
        color: Colors.charcoalLight,
        marginTop: 1,
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
    accountCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.card,
        overflow: 'hidden',
    },
    accountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    accountRowIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    accountRowIconWrapDanger: {
        backgroundColor: 'rgba(220,38,38,0.08)',
    },
    accountRowLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    accountRowLabelDanger: {
        color: Colors.danger,
    },
    accountRowSubtitle: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        marginTop: 1,
    },
    footerText: {
        textAlign: 'center',
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        marginTop: Spacing.lg,
    },
});

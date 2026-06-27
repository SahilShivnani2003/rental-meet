import React, { useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
    RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { useAlert } from '@/context/AlertContext';
import { useAuthStore } from '@/store/useAuthStore';
import { Spacing, Colors, Radii, Shadows, Typography } from '@/theme/theme';
import { VendorTabParamList } from '@/navigations/tabNavigations/VendorTabNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';
import { useGetVendorProfile } from '@/features/vendor/hooks/useVendorService';
import { VendorProfile } from '@/features/vendor/types/VendorProfile';
import { useUploadImage } from '../hooks/useUploadImage';
import { useDeactivateAccount } from '../hooks/useDeactivateAccount';
import { useDeleteAccount } from '../hooks/useDeletAccount';

const { width: W } = Dimensions.get('window');

// ─── Static Data ──────────────────────────────────────────────────────────────

// ─── Section Header ───────────────────────────────────────────────────────────
type SectionHeaderProps = {
    icon: string;
    title: string;
    onEdit?: () => void;
};

function SectionHeader({ icon, title, onEdit }: SectionHeaderProps) {
    return (
        <View style={s.sectionHeader}>
            <View style={s.sectionHeaderLeft}>
                <View style={s.sectionIconWrap}>
                    <Ionicons name={icon as any} size={16} color={Colors.primary} />
                </View>
                <Text style={s.sectionTitle}>{title}</Text>
            </View>
            {onEdit && (
                <TouchableOpacity onPress={onEdit} activeOpacity={0.7}>
                    <Ionicons name="create-outline" size={18} color={Colors.primary} />
                </TouchableOpacity>
            )}
        </View>
    );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
type InfoRowProps = {
    icon?: string;
    label: string;
    value: string;
    last?: boolean;
};

function InfoRow({ icon, label, value, last }: InfoRowProps) {
    return (
        <>
            <View style={s.infoRow}>
                {icon && (
                    <View style={s.infoIcon}>
                        <Ionicons name={icon as any} size={14} color={Colors.charcoalLight} />
                    </View>
                )}
                <View style={s.infoContent}>
                    <Text style={s.infoLabel}>{label}</Text>
                    <Text style={s.infoValue}>{value}</Text>
                </View>
            </View>
            {!last && <View style={s.infoDivider} />}
        </>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
type Props = NativeBottomTabScreenProps<VendorTabParamList, 'profile'>;

export default function VendorProfileScreen({ navigation }: Props) {
    const { logOut } = useAuthStore();
    const alert = useAlert();
    const { data, isLoading, refetch, isRefetching } = useGetVendorProfile();
    const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    // TODO: replace with real hook
    const profile: VendorProfile = data?.profile ?? {};
    const { mutate: uploadProfilePhoto } = useUploadImage();
    const { mutate: deactivateAccount } = useDeactivateAccount();
    const { mutate: deleteAccount } = useDeleteAccount();
    const handleRefresh = useCallback(() => {
        refetch();
    }, []);

    // ── Animations ────────────────────────────────────────────────────────────
    const headerFade = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-14)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerFade, { toValue: 1, duration: 380, useNativeDriver: true }),
            Animated.spring(headerSlide, {
                toValue: 0,
                speed: 16,
                bounciness: 4,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleEdit = useCallback((section: string) => {
        alert.info('Edit', `Edit ${section} coming soon`);
    }, []);

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
    }, []);

    const statusInfo = {
        approved: {
            color: Colors.success,
            bg: Colors.successLight,
            label: 'Profile Approved',
            icon: 'checkmark-circle',
        },
        pending: {
            color: Colors.warning,
            bg: Colors.warningLight,
            label: 'Approval Pending',
            icon: 'time',
        },
        rejected: {
            color: Colors.danger,
            bg: Colors.dangerLight,
            label: 'Profile Rejected',
            icon: 'close-circle',
        },
        incomplete: {
            color: Colors.charcoalLight,
            bg: Colors.border,
            label: 'Profile Incomplete',
            icon: 'alert-circle',
        },
    };

    const currentStatus = statusInfo[profile?.status || 'incomplete'];
    const role = profile?.basicInfo?.role
        ? profile.basicInfo.role.charAt(0).toUpperCase() + profile.basicInfo.role.slice(1)
        : ' ';
    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <View style={s.root}>
            {/* Header */}
            <Animated.View
                style={[
                    s.header,
                    { opacity: headerFade, transform: [{ translateY: headerSlide }] },
                ]}
            >
                <View style={s.headerAccent} />
                <View style={s.headerContent}>
                    <View>
                        <Text style={s.headerEyebrow}>MY PROFILE</Text>
                        <Text style={s.headerTitle}>Vendor Information</Text>
                    </View>
                    <TouchableOpacity
                        style={s.settingsBtn}
                        onPress={() => alert.info('Settings', 'Settings coming soon')}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="settings-outline" size={20} color={Colors.charcoalMid} />
                    </TouchableOpacity>
                </View>

                {/* Profile card */}
                <View style={s.profileCard}>
                    <View style={s.avatarCircle}>
                        <Text style={s.avatarText}>
                            {profile.basicInfo?.fullName?.slice(0, 2).toUpperCase() ?? 'VN'}
                        </Text>
                    </View>
                    <View style={s.profileInfo}>
                        <Text style={s.profileName}>{profile.basicInfo?.fullName ?? 'Vendor'}</Text>
                        <Text style={s.profileBrand}>{profile.businessInfo?.brandName ?? '—'}</Text>
                        <View style={[s.statusBadge, { backgroundColor: currentStatus.bg }]}>
                            <Ionicons
                                name={currentStatus.icon as any}
                                size={11}
                                color={currentStatus.color}
                            />
                            <Text style={[s.statusText, { color: currentStatus.color }]}>
                                {currentStatus.label}
                            </Text>
                        </View>
                    </View>
                </View>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scroll}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={handleRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
            >
                {/* Basic Info */}
                <View style={s.section}>
                    <SectionHeader
                        icon="person-outline"
                        title="Basic Information"
                        onEdit={() => handleEdit('Basic Info')}
                    />
                    <InfoRow
                        icon="call-outline"
                        label="Primary Mobile"
                        value={profile.basicInfo?.primaryMobile ?? '—'}
                    />
                    <InfoRow
                        icon="call-outline"
                        label="Secondary Mobile"
                        value={profile.basicInfo?.secondaryMobile ?? '—'}
                    />
                    <InfoRow icon="briefcase-outline" label="Role" value={role} last />
                </View>

                {/* Business Info */}
                <View style={s.section}>
                    <SectionHeader
                        icon="business-outline"
                        title="Business Information"
                        onEdit={() => handleEdit('Business Info')}
                    />
                    <InfoRow
                        icon="storefront-outline"
                        label="Company Name"
                        value={profile.businessInfo?.companyName ?? '—'}
                    />
                    <InfoRow
                        icon="pricetag-outline"
                        label="Category"
                        value={profile.businessInfo?.category ?? '—'}
                    />
                    <InfoRow
                        icon="star-outline"
                        label="Experience"
                        value={`${profile.businessInfo?.experienceYears ?? 0}+ years`}
                    />
                    <InfoRow
                        icon="chatbubble-outline"
                        label="Description"
                        value={profile.businessInfo?.description ?? '—'}
                        last
                    />
                </View>

                {/* Address */}
                <View style={s.section}>
                    <SectionHeader
                        icon="location-outline"
                        title="Address & Serviceable Areas"
                        onEdit={() => handleEdit('Address')}
                    />
                    <InfoRow
                        icon="home-outline"
                        label="Office Address"
                        value={profile.address?.officeAddress ?? '—'}
                    />
                    <InfoRow
                        icon="map-outline"
                        label="Location"
                        value={`${profile.address?.area ? profile.address.area + ', ' : ''}${
                            profile.address?.city ?? '—'
                        }, ${profile.address?.state ?? '—'} - ${profile.address?.pincode ?? '—'}`}
                    />
                    <InfoRow
                        icon="navigate-outline"
                        label="Serviceable Areas"
                        value={profile.address?.serviceableAreas?.join(', ') ?? '—'}
                        last
                    />
                </View>

                {/* Online Presence */}
                <View style={s.section}>
                    <SectionHeader
                        icon="globe-outline"
                        title="Online Presence"
                        onEdit={() => handleEdit('Online Presence')}
                    />
                    <InfoRow
                        icon="link-outline"
                        label="Website"
                        value={profile.online?.website ?? '—'}
                    />
                    <InfoRow
                        icon="logo-instagram"
                        label="Instagram"
                        value={profile.online?.instagram ?? '—'}
                    />
                    <InfoRow
                        icon="logo-facebook"
                        label="Facebook"
                        value={profile.online?.facebook ?? '—'}
                        last
                    />
                </View>

                {/* Bank Details */}
                <View style={s.section}>
                    <SectionHeader
                        icon="card-outline"
                        title="Bank Details"
                        onEdit={() => handleEdit('Bank Details')}
                    />
                    <InfoRow
                        icon="person-outline"
                        label="Account Holder"
                        value={profile.bankDetails?.accountHolderName ?? '—'}
                    />
                    <InfoRow
                        icon="wallet-outline"
                        label="Account Number"
                        value={
                            profile.bankDetails?.accountNumber
                                ? `****${profile.bankDetails.accountNumber.slice(-4)}`
                                : '—'
                        }
                    />
                    <InfoRow
                        icon="git-branch-outline"
                        label="IFSC Code"
                        value={profile.bankDetails?.ifsc ?? '—'}
                    />
                    <InfoRow
                        icon="business-outline"
                        label="Bank Name"
                        value={profile.bankDetails?.bankName ?? '—'}
                    />
                    <InfoRow
                        icon="qr-code-outline"
                        label="UPI ID"
                        value={profile.bankDetails?.upiId ?? '—'}
                        last
                    />
                </View>

                {/* Quick Actions */}
                <View style={s.section}>
                    <SectionHeader icon="flash-outline" title="Quick Actions" />
                    <View style={s.quickActions}>
                        <TouchableOpacity
                            style={s.actionBtn}
                            onPress={() => alert.info('Documents', 'View documents coming soon')}
                            activeOpacity={0.8}
                        >
                            <View style={[s.actionIcon, { backgroundColor: Colors.infoLight }]}>
                                <Ionicons
                                    name="document-text-outline"
                                    size={20}
                                    color={Colors.info}
                                />
                            </View>
                            <Text style={s.actionText}>View Documents</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={s.actionBtn}
                            onPress={() =>
                                alert.info('Availability', 'Manage availability coming soon')
                            }
                            activeOpacity={0.8}
                        >
                            <View style={[s.actionIcon, { backgroundColor: Colors.successLight }]}>
                                <Ionicons
                                    name="calendar-outline"
                                    size={20}
                                    color={Colors.success}
                                />
                            </View>
                            <Text style={s.actionText}>Manage Availability</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {/* Logout */}
                <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                    <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
                    <Text style={s.logoutText}>Logout</Text>
                </TouchableOpacity>

                <View style={{ height: 24 }} />
            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },

    header: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        paddingBottom: Spacing.xl,
        ...Shadows.header,
    },
    headerAccent: { height: 4, backgroundColor: Colors.primary },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing.xl,
        paddingTop: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg,
        marginBottom: Spacing.xl,
    },
    headerEyebrow: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: Typography.wider,
        marginBottom: 3,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.4,
    },
    settingsBtn: {
        width: 42,
        height: 42,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },

    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        paddingHorizontal: Spacing.xl,
    },
    avatarCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: Colors.primaryLight,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: Typography.extraBold,
        color: Colors.surface,
    },
    profileInfo: { flex: 1 },
    profileName: {
        fontSize: 20,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.4,
        marginBottom: 2,
    },
    profileBrand: {
        fontSize: 13,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        marginBottom: Spacing.sm,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radii.full,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 10,
        fontWeight: Typography.bold,
        letterSpacing: 0.3,
    },

    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 100 },

    section: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadows.card,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    sectionIconWrap: {
        width: 32,
        height: 32,
        borderRadius: Radii.md,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
    },
    infoIcon: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -2,
    },
    infoContent: { flex: 1 },
    infoLabel: {
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        marginBottom: 3,
    },
    infoValue: {
        fontSize: 13,
        color: Colors.charcoal,
        fontWeight: Typography.semiBold,
        lineHeight: 18,
    },
    infoDivider: {
        height: 1,
        backgroundColor: Colors.divider,
        marginLeft: 40,
    },

    quickActions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    actionBtn: {
        flex: 1,
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        fontSize: 11,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
        textAlign: 'center',
    },

    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: Spacing.lg,
        borderRadius: Radii.md,
        backgroundColor: Colors.dangerLight,
        borderWidth: 1,
        borderColor: Colors.danger + '30',
    },
    logoutText: {
        fontSize: 14,
        fontWeight: Typography.bold,
        color: Colors.danger,
    },
});

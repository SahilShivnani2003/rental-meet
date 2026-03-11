import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Animated,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme/theme';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { ClientTabParamList } from '../../navigations/tabNavigations/ClientTabNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigations/RootNavigation';
import { useAlert } from '../../context/AlertContext';
import DeviceInfo from 'react-native-device-info';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Shared row type ───────────────────────────────────────────────────────────
interface FeatureRow {
    id: string;
    icon: string;
    iconColor: string;
    iconBg: string;
    title: string;
    subtitle: string;
}
interface openPreference  {
        id:string;
        icon:string;
        iconColor:string;
        iconBg:string;
        title:string;
        subtitle: string;
        onPress:()=>void;

    }

// ── Locked feature rows ───────────────────────────────────────────────────────
const LOCKED_ACCOUNT: FeatureRow[] = [
    {
        id: 'edit-profile',
        icon: 'person-circle-outline',
        iconColor: Colors.primary,
        iconBg: Colors.primaryLight,
        title: 'Edit Profile',
        subtitle: 'Update your personal info',
    },
    {
        id: 'payment',
        icon: 'card-outline',
        iconColor: Colors.info,
        iconBg: Colors.infoLight,
        title: 'Payment Methods',
        subtitle: 'Cards & billing info',
    },
];

const LOCKED_PREFERENCES: FeatureRow[] = [
    {
        id: 'notifications',
        icon: 'notifications-outline',
        iconColor: Colors.warning,
        iconBg: Colors.warningLight,
        title: 'Notifications',
        subtitle: 'Alerts & reminders',
    },
];

// ── Entrance animation hook ───────────────────────────────────────────────────
function useEntrance(delay: number) {
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(20)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, { toValue: 1, delay, duration: 320, useNativeDriver: true }),
            Animated.spring(slide, {
                toValue: 0,
                delay,
                useNativeDriver: true,
                speed: 18,
                bounciness: 7,
            }),
        ]).start();
    }, []);
    return { fade, slide };
}

// ── Locked feature row ────────────────────────────────────────────────────────
function LockedRow({ item, onPress }: { item: FeatureRow; onPress: () => void }) {
    const scale = useRef(new Animated.Value(1)).current;
    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                style={styles.menuItem}
                onPress={onPress}
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
                activeOpacity={1}
            >
                <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIconWrap, { backgroundColor: item.iconBg }]}>
                        <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
                    </View>
                    <View style={{ flex: 1, opacity: 0.45 }}>
                        <Text style={styles.menuItemTitle}>{item.title}</Text>
                        <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                    </View>
                </View>
                {/* Lock badge */}
                <View style={styles.lockChip}>
                    <Ionicons name="lock-closed" size={11} color={Colors.charcoalLight} />
                    <Text style={styles.lockChipText}>Sign in</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── Open feature row ──────────────────────────────────────────────────────────
function OpenRow({ item }: { item: openPreference }) {
    const scale = useRef(new Animated.Value(1)).current;
    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                style={styles.menuItem}
                onPress={item.onPress}
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
                activeOpacity={1}
            >
                <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIconWrap, { backgroundColor: item.iconBg }]}>
                        <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.menuItemTitle}>{item.title}</Text>
                        <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                    </View>
                </View>
                <View style={styles.menuChevronWrap}>
                    <Ionicons name="chevron-forward" size={16} color={Colors.border} />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── Screen ────────────────────────────────────────────────────────────────────
type GuestProfileProps = NativeBottomTabScreenProps<ClientTabParamList, 'profile'>;

export default function GuestProfile({ navigation }: GuestProfileProps) {
    const alert = useAlert();
    const version = DeviceInfo.getVersion();
    const headerFade = useRef(new Animated.Value(0)).current;
    const heroSlide = useRef(new Animated.Value(-16)).current;
    const { fade: ctaFade, slide: ctaSlide } = useEntrance(300);
    const { fade: menuFade, slide: menuSlide } = useEntrance(480);

    
    const OPEN_PREFERENCES = [
        {
            id: 'help',
            icon: 'help-circle-outline',
            iconColor: Colors.charcoalLight,
            iconBg: Colors.border,
            title: 'Help & Support',
            subtitle: 'support@rentalmeet.com',
            onPress: () => alert.info('Help', 'Contact us at support@rentalmeet.com'),
        },
        {
            id: 'about',
            icon: 'information-circle-outline',
            iconColor: Colors.charcoalLight,
            iconBg: Colors.border,
            title: 'About RentalMeet',
            subtitle: `Version ${version}`,
            onPress: () =>
                alert.info(
                    'Rental Meet',
                    `App Version ${version} \n\n Book your perfect space ease`,
                ),
        },
    ];

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

    const goToLogin = () =>
        navigation.getParent<NativeStackNavigationProp<RootStackParamList>>().navigate('login');
    const goToRegister = () =>
        navigation
            .getParent<NativeStackNavigationProp<RootStackParamList>>()
            .navigate('registerType');
    const promptSignIn = () =>
        Alert.alert(
            'Sign In Required',
            'Create a free account or sign in to access this feature.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign In', onPress: goToLogin },
            ],
        );

    return (
        <View style={styles.container}>
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <Animated.View
                style={[
                    styles.header,
                    { opacity: headerFade, transform: [{ translateY: heroSlide }] },
                ]}
            >
                <View style={styles.headerAccentBar} />
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerEyebrow}>ACCOUNT</Text>
                        <Text style={styles.headerTitle}>Profile</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.iconBtn} onPress={promptSignIn}>
                            <Ionicons
                                name="chatbubble-outline"
                                size={19}
                                color={Colors.charcoalMid}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn} onPress={promptSignIn}>
                            <Ionicons
                                name="notifications-outline"
                                size={19}
                                color={Colors.charcoalMid}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingsBtn} onPress={promptSignIn}>
                            <Ionicons name="settings-outline" size={19} color={Colors.charcoal} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentPadding}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Guest avatar card ──────────────────────────────────────────── */}
                <Animated.View style={[styles.profileCard, { opacity: headerFade }]}>
                    <View style={styles.profileBanner} />
                    <View style={styles.profileContent}>
                        {/* Avatar placeholder */}
                        <View style={styles.avatarWrapper}>
                            <View style={styles.avatarRing}>
                                <View style={styles.avatar}>
                                    <Ionicons
                                        name="person"
                                        size={38}
                                        color="rgba(255,255,255,0.55)"
                                    />
                                </View>
                            </View>
                        </View>

                        <Text style={styles.userName}>Guest User</Text>
                        <Text style={styles.userEmail}>You're browsing as a guest</Text>

                        {/* Guest badge */}
                        <View style={styles.guestBadge}>
                            <Ionicons name="eye-outline" size={11} color={Colors.charcoalLight} />
                            <Text style={styles.guestBadgeText}>GUEST MODE</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* ── Sign In / Register CTA ────────────────────────────────────── */}
                <Animated.View
                    style={[
                        styles.authCard,
                        { opacity: ctaFade, transform: [{ translateY: ctaSlide }] },
                    ]}
                >
                    <View style={styles.authCardLeft}>
                        <View style={styles.authIconWrap}>
                            <Ionicons name="sparkles" size={22} color={Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.authCardTitle}>Unlock everything</Text>
                            <Text style={styles.authCardSub}>
                                Save venues, track bookings & get personalised picks
                            </Text>
                        </View>
                    </View>

                    <View style={styles.authBtnRow}>
                        <TouchableOpacity
                            style={styles.signInBtn}
                            onPress={goToLogin}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.signInBtnText}>Sign In</Text>
                            <Ionicons name="arrow-forward" size={15} color={Colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.registerBtn}
                            onPress={goToRegister}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.registerBtnText}>Create Account</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* ── Perks list ────────────────────────────────────────────────── */}
                <Animated.View
                    style={[
                        styles.perksCard,
                        { opacity: ctaFade, transform: [{ translateY: ctaSlide }] },
                    ]}
                >
                    {[
                        { icon: 'heart', color: '#E11D48', text: 'Save your favourite venues' },
                        {
                            icon: 'calendar',
                            color: Colors.primary,
                            text: 'Manage & track bookings',
                        },
                        {
                            icon: 'notifications',
                            color: Colors.warning,
                            text: 'Get real-time alerts',
                        },
                        { icon: 'card', color: Colors.info, text: 'Secure payment methods' },
                        { icon: 'star', color: '#F59E0B', text: 'Earn rewards on every book' },
                    ].map((perk, i) => (
                        <View key={i} style={[styles.perkRow, i > 0 && styles.perkDivider]}>
                            <View
                                style={[
                                    styles.perkIconWrap,
                                    { backgroundColor: `${perk.color}18` },
                                ]}
                            >
                                <Ionicons name={perk.icon as any} size={15} color={perk.color} />
                            </View>
                            <Text style={styles.perkText}>{perk.text}</Text>
                            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                        </View>
                    ))}
                </Animated.View>

                {/* ── Locked account section ────────────────────────────────────── */}
                <Animated.View
                    style={[{ opacity: menuFade, transform: [{ translateY: menuSlide }] }]}
                >
                    <Text style={styles.menuSectionLabel}>ACCOUNT</Text>
                    <View style={styles.menuSectionCard}>
                        {LOCKED_ACCOUNT.map((item, i) => (
                            <View key={item.id}>
                                <LockedRow item={item} onPress={promptSignIn} />
                                {i < LOCKED_ACCOUNT.length - 1 && (
                                    <View style={styles.menuDivider} />
                                )}
                            </View>
                        ))}
                    </View>
                </Animated.View>

                {/* ── Preferences (mixed locked + open) ────────────────────────── */}
                <Animated.View
                    style={[
                        styles.menuSection,
                        { opacity: menuFade, transform: [{ translateY: menuSlide }] },
                    ]}
                >
                    <Text style={styles.menuSectionLabel}>PREFERENCES</Text>
                    <View style={styles.menuSectionCard}>
                        <LockedRow item={LOCKED_PREFERENCES[0]} onPress={promptSignIn} />
                        <View style={styles.menuDivider} />
                        {OPEN_PREFERENCES.map((item, i) => (
                            <View key={item.id}>
                                <OpenRow item={item} />
                                {i < OPEN_PREFERENCES.length - 1 && (
                                    <View style={styles.menuDivider} />
                                )}
                            </View>
                        ))}
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    // ── Header ──
    header: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        paddingBottom: Spacing.xl,
        ...Shadows.header,
        zIndex: 10,
    },
    headerAccentBar: { height: 4, backgroundColor: Colors.primary },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
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
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsBtn: {
        width: 46,
        height: 46,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Content ──
    content: { flex: 1 },
    contentPadding: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: 120,
    },

    // ── Profile card ──
    profileCard: {
        backgroundColor: Colors.surface,
        borderRadius: 24,
        marginBottom: Spacing.xl,
        ...Shadows.card,
    },
    profileBanner: {
        height: 72,
        backgroundColor: Colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomLeftRadius: 48,
        borderBottomRightRadius: 48,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    profileContent: {
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: 24,
        marginTop: -44,
    },
    avatarWrapper: { position: 'relative', marginBottom: 14 },
    avatarRing: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 2,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        padding: 3,
        backgroundColor: Colors.surface,
    },
    avatar: {
        flex: 1,
        borderRadius: 44,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userName: {
        fontSize: 22,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        fontWeight: Typography.regular,
        marginBottom: 12,
    },
    guestBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.background,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    guestBadgeText: {
        fontSize: 9,
        fontWeight: Typography.extraBold,
        color: Colors.charcoalLight,
        letterSpacing: 1.5,
    },

    // ── Auth CTA card ──
    authCard: {
        backgroundColor: Colors.charcoal,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        gap: Spacing.md,
        ...Shadows.floating,
    },
    authCardLeft: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
    authIconWrap: {
        width: 44,
        height: 44,
        borderRadius: Radii.md,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    authCardTitle: {
        fontSize: 17,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: -0.3,
        marginBottom: 4,
    },
    authCardSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.55)',
        lineHeight: 18,
    },
    authBtnRow: { flexDirection: 'row', gap: Spacing.sm },
    signInBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        height: 46,
        backgroundColor: Colors.primary,
        borderRadius: Radii.md,
    },
    signInBtnText: {
        fontSize: 14,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.3,
    },
    registerBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 46,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    registerBtnText: {
        fontSize: 14,
        fontWeight: Typography.bold,
        color: 'rgba(255,255,255,0.75)',
    },

    // ── Perks ──
    perksCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
        ...Shadows.card,
    },
    perkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: 13,
    },
    perkDivider: {
        borderTopWidth: 1,
        borderTopColor: Colors.background,
    },
    perkIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    perkText: {
        flex: 1,
        fontSize: 13.5,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },

    // ── Menu ──
    menuSection: { marginBottom: Spacing.lg },
    menuSectionLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 2,
        marginBottom: Spacing.sm,
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.xxs,
    },
    menuSectionCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: 14,
    },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
    menuIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuItemTitle: {
        fontSize: 15,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginBottom: 2,
    },
    menuItemSubtitle: {
        fontSize: 12,
        color: Colors.charcoalLight,
        fontWeight: Typography.regular,
    },
    menuChevronWrap: {
        width: 28,
        height: 28,
        borderRadius: Spacing.sm,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuDivider: { height: 1, backgroundColor: Colors.background, marginLeft: 72 },

    // ── Lock chip ──
    lockChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: Radii.full,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    lockChipText: {
        fontSize: 10,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 0.3,
    },

    // ── Browse banner ──
    browseBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.charcoal,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        gap: Spacing.md,
        marginBottom: Spacing.lg,
        marginTop: Spacing.sm,
        ...Shadows.floating,
    },
    ctaBannerTitle: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: -0.3,
        marginBottom: 3,
    },
    ctaBannerSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.55)',
        lineHeight: 17,
    },
    ctaBannerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.lg,
        paddingVertical: 11,
        borderRadius: Radii.full,
    },
    ctaBannerBtnText: {
        fontSize: 13,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.3,
    },

    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: Colors.border,
        fontWeight: Typography.regular,
    },
});

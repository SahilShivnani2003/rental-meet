import { Colors, Shadows, Spacing, Radii, Typography } from '@/theme/theme';
import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    RefreshControl,
    Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useGetAmbassadorDashboard } from '../hooks/useAmbassador';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { AmbassadorTabParamList } from '@/navigations/tabNavigations/AmbassadorTabNavigation';
import { useAuthStore } from '@/store/useAuthStore';
import {
    createNativeStackNavigator,
    NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';

// react-native-vector-icons doesn't ship a `glyphMap` type like @expo/vector-icons,
// so icon names are typed as plain strings here.
type IconName = string;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Extra accent colors layered on top of the theme so different sections read
// as distinct "zones" (ID/status chips, the streak banner, bonus pills)
// instead of everything sharing one orange tone.
const ACCENTS = {
    navyDark: '#0F1230',
    navyMid: '#1E1B4B',
    purple: '#6D5BD0',
    purpleLight: '#EDE9FE',
    purpleDark: '#4C3B96',
    teal: '#0EA5A5',
    tealLight: '#CCFBF1',
    tealDark: '#0F766E',
    amber: '#F5A623',
    amberLight: '#FDECC8',
    amberDark: '#8A5A00',
    slate: '#475569',
    slateLight: '#E2E8F0',
    slateDark: '#1E293B',
};

// Sections that fade/slide/scale in on load, in render order: hero card,
// streak banner, tier card, challenge card, stat grid, list cards.
const SECTION_COUNT = 6;

// ── Small building blocks ─────────────────────────────────────────────────────

type ChipTone = 'light' | 'dark' | 'primary' | 'amber' | 'teal' | 'purple' | 'slate';

const Chip: React.FC<{
    icon?: IconName;
    label: string;
    tone?: ChipTone;
}> = ({ icon, label, tone = 'light' }) => {
    const toneStyles: Record<ChipTone, { bg: string; fg: string; border?: string }> = {
        light: { bg: Colors.background, fg: Colors.charcoalMid },
        dark: { bg: Colors.tabBar, fg: Colors.primaryLight },
        primary: { bg: Colors.primaryLight, fg: Colors.primaryDark, border: Colors.primary },
        amber: { bg: ACCENTS.amberLight, fg: ACCENTS.amberDark, border: ACCENTS.amber },
        teal: { bg: ACCENTS.tealLight, fg: ACCENTS.tealDark },
        purple: { bg: ACCENTS.purpleLight, fg: ACCENTS.purpleDark },
        slate: { bg: ACCENTS.slateLight, fg: ACCENTS.slateDark },
    };
    const t = toneStyles[tone];

    return (
        <View
            style={[
                styles.chip,
                { backgroundColor: t.bg },
                !!t.border && { borderWidth: 1, borderColor: t.border },
            ]}
        >
            {icon && <Ionicons name={icon} size={11} color={t.fg} style={{ marginRight: 4 }} />}
            <Text style={[styles.chipText, { color: t.fg }]} numberOfLines={1}>
                {label}
            </Text>
        </View>
    );
};

// Faint diagonal stripe texture dropped behind gradient cards for depth.
// Purely decorative, non-interactive, and sits under all other content.
const StripeTexture: React.FC = () => (
    <View style={styles.stripeWrap} pointerEvents="none">
        {[0, 1, 2, 3, 4, 5].map(i => (
            <View key={i} style={[styles.stripe, { left: i * 44 - 40 }]} />
        ))}
    </View>
);

// Animated progress bar — the fill eases in to its target width instead of
// snapping, and can carry an optional trailing percentage label.
const ProgressBar: React.FC<{
    percent: number;
    trackColor?: string;
    fillColor?: string;
    labelColor?: string;
    showLabel?: boolean;
}> = ({
    percent,
    trackColor = 'rgba(255,255,255,0.25)',
    fillColor = Colors.white,
    labelColor = Colors.white,
    showLabel = false,
}) => {
    const widthAnim = useRef(new Animated.Value(0)).current;
    const clamped = Math.min(100, Math.max(0, percent || 0));

    useEffect(() => {
        const anim = Animated.timing(widthAnim, {
            toValue: clamped,
            duration: 700,
            useNativeDriver: false,
        });
        anim.start();
        return () => anim.stop();
    }, [clamped]);

    const width = widthAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    return (
        <View>
            <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
                <Animated.View
                    style={[styles.progressFill, { width, backgroundColor: fillColor }]}
                />
            </View>
            {showLabel && (
                <Text style={[styles.progressLabel, { color: labelColor }]}>
                    {Math.round(clamped)}% complete
                </Text>
            )}
        </View>
    );
};

// Circular "liquid fill" badge — a ring that fills bottom-up to represent a
// fraction, with the fraction printed in the middle. No SVG dependency.
const LiquidBadge: React.FC<{ percent: number; label: string; size?: number }> = ({
    percent,
    label,
    size = 60,
}) => {
    const fillAnim = useRef(new Animated.Value(0)).current;
    const clamped = Math.min(100, Math.max(0, percent || 0));

    useEffect(() => {
        const anim = Animated.timing(fillAnim, {
            toValue: clamped,
            duration: 800,
            useNativeDriver: false,
        });
        anim.start();
        return () => anim.stop();
    }, [clamped]);

    const height = fillAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

    return (
        <View style={[styles.liquidBadge, { width: size, height: size, borderRadius: size / 2 }]}>
            <Animated.View style={[styles.liquidFill, { height }]} />
            <View style={styles.liquidLabelWrap}>
                <Text style={styles.liquidLabelText}>{label}</Text>
            </View>
        </View>
    );
};

// Gentle breathing scale loop — used sparingly to draw the eye to the one
// thing on screen the ambassador should act on today (the bonus pill).
const Pulse: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => {
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.06, duration: 900, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, []);

    return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
};

const StatCard: React.FC<{
    icon: IconName;
    label: string;
    value: string;
    footnote?: string;
    accent?: string;
}> = ({ icon, label, value, footnote, accent = Colors.primary }) => (
    <View style={[styles.statCard, Shadows.card]}>
        <View style={[styles.statAccentBar, { backgroundColor: accent }]} />
        <View style={[styles.statIconWrap, { backgroundColor: `${accent}1F` }]}>
            <Ionicons name={icon} size={17} color={accent} />
        </View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {!!footnote && (
            <Text style={styles.statFootnote} numberOfLines={2}>
                {footnote}
            </Text>
        )}
    </View>
);

const EmptyState: React.FC<{
    icon: IconName;
    title: string;
    subtitle: string;
    ctaLabel?: string;
    onPress?: () => void;
}> = ({ icon, title, subtitle, ctaLabel, onPress }) => (
    <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
            <Ionicons name={icon} size={22} color={Colors.charcoalLight} />
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySubtitle}>{subtitle}</Text>
        {!!ctaLabel && (
            <TouchableOpacity
                style={styles.emptyCta}
                onPress={onPress}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={ctaLabel}
            >
                <Ionicons name="add" size={14} color={Colors.white} />
                <Text style={styles.emptyCtaText}>{ctaLabel}</Text>
            </TouchableOpacity>
        )}
    </View>
);

// Row for a single recently-listed venue.
const VenueRow: React.FC<{ venue: any }> = ({ venue }) => {
    const status = (venue?.status ?? 'pending').toLowerCase();
    const statusColor =
        status === 'approved'
            ? Colors.success
            : status === 'rejected'
            ? Colors.danger ?? '#D64545'
            : Colors.info;

    const locationText =
        [venue?.location?.address, venue?.location?.city].filter(Boolean).join(', ') ||
        venue?.location?.city ||
        '';

    return (
        <View style={styles.rowItem}>
            <View style={styles.rowIconWrap}>
                <Ionicons name="business-outline" size={15} color={Colors.charcoalMid} />
            </View>
            <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                    {venue?.businessName ?? venue?.name ?? 'Untitled venue'}
                </Text>
                <Text style={styles.rowSubtitle} numberOfLines={1}>
                    {locationText}
                </Text>
            </View>
            <View style={[styles.rowStatusPill, { backgroundColor: `${statusColor}1F` }]}>
                <Text style={[styles.rowStatusText, { color: statusColor }]}>
                    {venue?.status ?? 'Pending'}
                </Text>
            </View>
        </View>
    );
};

// Row for a single recent reward/credit transaction.
const RewardRow: React.FC<{ reward: any }> = ({ reward }) => (
    <View style={styles.rowItem}>
        <View style={styles.rowIconWrap}>
            <Ionicons name="cash-outline" size={15} color={Colors.success} />
        </View>
        <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle} numberOfLines={1}>
                {reward?.description ?? reward?.title ?? 'Reward credited'}
            </Text>
            <Text style={styles.rowSubtitle} numberOfLines={1}>
                {reward?.date ?? reward?.createdAt ?? ''}
            </Text>
        </View>
        <Text style={styles.rowAmountText}>+₹{reward?.amount ?? 0}</Text>
    </View>
);

// ── Main screen ────────────────────────────────────────────────────────────────
type AmbassadorDashboardScreenProps = NativeBottomTabScreenProps<
    AmbassadorTabParamList,
    'dashboard'
>;

const AmbassadorDashboardScreen = ({ navigation }: AmbassadorDashboardScreenProps) => {
    const { user } = useAuthStore();
    const { data, isLoading, isError, refetch } = useGetAmbassadorDashboard();
    const [refreshing, setRefreshing] = useState(false);
    const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

    // ── Animations ────────────────────────────────────────────────────────────
    const sectionAnims = useRef(
        Array.from({ length: SECTION_COUNT }, () => new Animated.Value(0)),
    ).current;
    const refreshSpin = useRef(new Animated.Value(0)).current;
    // Only replay the entrance stagger once per "identity" of the ambassador's
    // data (e.g. first load), not on every background refetch that returns a
    // new object reference with the same underlying values.
    const hasAnimatedRef = useRef(false);

    useEffect(() => {
        if (!isLoading && data?.data && !hasAnimatedRef.current) {
            hasAnimatedRef.current = true;
            sectionAnims.forEach(a => a.setValue(0));
            Animated.stagger(
                100,
                sectionAnims.map(a =>
                    Animated.spring(a, {
                        toValue: 1,
                        useNativeDriver: true,
                        speed: 14,
                        bounciness: 6,
                    }),
                ),
            ).start();
        }
    }, [isLoading, data?.data]);

    useEffect(() => {
        if (refreshing) {
            refreshSpin.setValue(0);
            Animated.loop(
                Animated.timing(refreshSpin, { toValue: 1, duration: 700, useNativeDriver: true }),
            ).start();
        } else {
            refreshSpin.stopAnimation();
            refreshSpin.setValue(0);
        }
    }, [refreshing]);

    const spinDeg = refreshSpin.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const sectionStyle = (i: number) => ({
        opacity: sectionAnims[i],
        transform: [
            {
                translateY: sectionAnims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [22, 0],
                }),
            },
            {
                scale: sectionAnims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.97, 1],
                }),
            },
        ],
    });

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await refetch();
        } finally {
            setRefreshing(false);
        }
    };

    // Navigation helpers — adjust route names to match your actual
    // AmbassadorTabParamList / parent stack navigator.
    const goToOnboardVenue = () => rootNav.navigate('addVenue');
    const goToAllVenues = () => navigation.navigate('venues');
    const goToLedger = () => navigation.navigate('statics');
    const goToChallengeHistory = () => navigation.navigate('statics');

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <View style={styles.arcTop} />
                <ActivityIndicator color={Colors.primary} size="large" />
                <Text style={styles.loadingText}>Loading your dashboard…</Text>
            </View>
        );
    }

    if (isError || !data?.data) {
        return (
            <View style={styles.centered}>
                <View style={styles.arcTop} />
                <View style={styles.errorIconWrap}>
                    <Ionicons name="alert-circle-outline" size={26} color={Colors.charcoalLight} />
                </View>
                <Text style={styles.emptyTitle}>Couldn't load your dashboard</Text>
                <Text style={styles.emptySubtitle}>Check your connection and try again.</Text>
                <TouchableOpacity
                    style={styles.emptyCta}
                    onPress={() => refetch()}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Retry"
                >
                    <Ionicons name="refresh" size={14} color={Colors.white} />
                    <Text style={styles.emptyCtaText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { profile, stats, progress, challenges, profitShareStatus, recentVenues, recentRewards } =
        data.data;

    const initials = (user?.name || 'AM')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 2)
        .toUpperCase();

    // Prefer the ambassador's actual name if the API returns one; fall back
    // to a generic greeting rather than a hardcoded placeholder name.
    const displayName = user?.name;

    const todayVerified = challenges.todayVerifiedCount || 0;
    const todayPercent = (todayVerified / Math.max(1, challenges.dailyTarget)) * 100;

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={Colors.primary}
                    colors={[Colors.primary]}
                />
            }
        >
            <View style={styles.arcTop} />
            <View style={styles.arcAccent} />

            {/* ── Hero identity card ────────────────────────────────────────── */}
            <Animated.View style={[styles.heroCard, Shadows.header, sectionStyle(0)]}>
                <View style={styles.heroTopRow}>
                    <View style={styles.heroIdentity}>
                        <View style={styles.avatarRing}>
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarInitials}>{initials}</Text>
                            </View>
                        </View>
                        <View style={styles.heroIdentityText}>
                            <Text style={styles.heroName}>Welcome back, {displayName}!</Text>
                            <Text style={styles.heroSub} numberOfLines={2}>
                                RentalMeet Official Ambassador Portal · Direct Venue Acquisition
                                &amp; Profit Sharing
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.refreshBtn}
                        onPress={onRefresh}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Refresh dashboard"
                    >
                        <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
                            <Ionicons name="refresh" size={16} color={Colors.charcoalMid} />
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                <View style={styles.heroChipsRow}>
                    <Chip
                        icon="pricetag-outline"
                        label={`ID: ${profile.ambassadorId}`}
                        tone="amber"
                    />
                    <Chip label={profile.badge} tone="slate" />
                    <Chip
                        icon="trophy-outline"
                        label={`${profile.assignedLevel} · ₹${profile.listingRate}/Venue`}
                        tone="teal"
                    />
                    <Chip
                        icon="lock-closed-outline"
                        label={
                            profitShareStatus.profitShareUnlocked
                                ? '25% Share · Active'
                                : '25% Share (7-Day Streak Required)'
                        }
                        tone="purple"
                    />
                </View>

                <TouchableOpacity
                    style={styles.onboardBtn}
                    activeOpacity={0.9}
                    onPress={goToOnboardVenue}
                    accessibilityRole="button"
                    accessibilityLabel="Onboard a new venue"
                >
                    <Ionicons name="add-circle" size={17} color={Colors.white} />
                    <Text style={styles.onboardBtnText}>Onboard a New Venue</Text>
                    <Ionicons
                        name="arrow-forward"
                        size={15}
                        color={Colors.white}
                        style={{ marginLeft: 2 }}
                    />
                </TouchableOpacity>
            </Animated.View>

            {/* ── Streak / profit share banner ─────────────────────────────── */}
            <Animated.View style={sectionStyle(1)}>
                <LinearGradient
                    colors={[ACCENTS.navyMid, ACCENTS.navyDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.streakBanner, Shadows.primary]}
                >
                    <StripeTexture />
                    <Ionicons
                        name="flame"
                        size={110}
                        color="rgba(255,255,255,0.08)"
                        style={styles.streakWatermark}
                    />

                    <View style={styles.streakBadge}>
                        <Ionicons name="flame" size={11} color={ACCENTS.purpleDark} />
                        <Text style={styles.streakBadgeText}>
                            7-DAY STREAK TARGET ({profitShareStatus.totalVenuesTarget} VENUES TOTAL)
                        </Text>
                    </View>

                    <Text style={styles.streakTitle}>
                        Roz {profitShareStatus.dailyTarget} Venues x 7 Days Streak = Total{' '}
                        {profitShareStatus.totalVenuesTarget} Venues{'\n'}To Unlock 25% Profit Share
                        for 1 Year
                    </Text>
                    <Text style={styles.streakSubtitle}>
                        Lagatar 7 din roz {profitShareStatus.dailyTarget}-
                        {profitShareStatus.dailyTarget + 1} venues list karein (Total{' '}
                        {profitShareStatus.totalVenuesTarget} venues). Streak complete hote hi 25%
                        Booking Share 1 Year ke liye unlock ho jayega.
                    </Text>

                    <View style={styles.streakStatsRow}>
                        <View style={styles.streakStatBox}>
                            <Text style={styles.streakStatLabel}>7-Day Streak Progress</Text>
                            <Text style={[styles.streakStatBigValue, { color: ACCENTS.amber }]}>
                                {profitShareStatus.streakDaysCompleted}
                                <Text
                                    style={[styles.streakStatSlash, { color: ACCENTS.amberLight }]}
                                >
                                    /{profitShareStatus.streakTarget}
                                </Text>
                            </Text>
                            <ProgressBar
                                percent={profitShareStatus.streakProgressPercentage}
                                fillColor={ACCENTS.amber}
                            />
                        </View>
                        <View style={styles.streakStatBox}>
                            <Text style={styles.streakStatLabel}>Venues Progress</Text>
                            <Text style={[styles.streakStatBigValue, { color: ACCENTS.teal }]}>
                                {profitShareStatus.totalStreakVenues}
                                <Text
                                    style={[styles.streakStatSlash, { color: ACCENTS.tealLight }]}
                                >
                                    /{profitShareStatus.totalVenuesTarget}
                                </Text>
                            </Text>
                            <ProgressBar
                                percent={profitShareStatus.venuesProgressPercentage}
                                fillColor={ACCENTS.teal}
                            />
                        </View>
                    </View>
                </LinearGradient>
            </Animated.View>

            {/* ── Tier level + verified venues card ────────────────────────── */}
            <Animated.View style={sectionStyle(2)}>
                <LinearGradient
                    colors={[Colors.primaryDark, Colors.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.4 }}
                    style={[styles.tierCard, Shadows.primary]}
                >
                    <StripeTexture />
                    <Ionicons
                        name="trophy"
                        size={100}
                        color="rgba(255,255,255,0.10)"
                        style={styles.tierWatermark}
                    />
                    <View style={styles.tierTopRow}>
                        <View style={styles.tierIconBadge}>
                            <Ionicons name="ribbon" size={16} color={Colors.white} />
                        </View>
                        <Text style={styles.tierTag}>CURRENT TIER LEVEL</Text>
                        <View style={styles.tierBadgePill}>
                            <Text style={styles.tierBadgePillText}>{progress.tierTitle}</Text>
                        </View>
                    </View>
                    <Text style={styles.tierBigNumber}>
                        {stats.approvedCount} Verified Venues Approved
                    </Text>
                    <Text style={styles.tierSub}>
                        List thirty extra venues within {profitShareStatus.streakTarget} days to
                        level up and boost your payout rate
                    </Text>
                    <Text style={styles.tierProgressLabel}>Progress to Next Tier</Text>
                    <ProgressBar
                        percent={progress.progressPercentage}
                        trackColor="rgba(255,255,255,0.28)"
                        fillColor={Colors.white}
                        showLabel
                        labelColor={Colors.primaryHighLight}
                    />
                </LinearGradient>
            </Animated.View>

            {/* ── Daily challenge card ──────────────────────────────────────── */}
            <Animated.View style={[styles.challengeCard, Shadows.card, sectionStyle(3)]}>
                <View style={styles.challengeAccentBar} />
                <View style={styles.challengeBody}>
                    <View style={styles.challengeHeaderRow}>
                        <LiquidBadge
                            percent={todayPercent}
                            label={`${todayVerified}/${challenges.dailyTarget}`}
                        />
                        <View style={styles.challengeHeaderText}>
                            <Text style={styles.challengeTitle}>
                                Daily {challenges.dailyTarget} Venues Challenge
                            </Text>
                            <Text style={styles.challengeSubtitle}>
                                Earn +₹{challenges.dailyBonusRate} Bonus per Venue Today
                            </Text>
                        </View>
                        <Pulse style={styles.bonusPillWrap}>
                            <View
                                style={[styles.bonusPill, { backgroundColor: ACCENTS.amberLight }]}
                            >
                                <Ionicons name="flash" size={11} color={ACCENTS.amberDark} />
                                <Text style={[styles.bonusPillText, { color: ACCENTS.amberDark }]}>
                                    +₹{challenges.dailyBonusRate} Bonus
                                </Text>
                            </View>
                        </Pulse>
                    </View>

                    <View style={styles.challengeProgressRow}>
                        <Text style={styles.challengeProgressLabel}>Today's Verified Count</Text>
                        <Text style={styles.challengeProgressValue}>
                            {todayVerified}/{challenges.dailyTarget}
                        </Text>
                    </View>
                    <ProgressBar
                        percent={todayPercent}
                        trackColor={Colors.border}
                        fillColor={Colors.primary}
                    />

                    <View style={styles.challengeFooterRow}>
                        <Text style={styles.challengeFooterLeft}>
                            Daily Bonus Earned{' '}
                            <Text style={styles.challengeFooterValue}>
                                ₹{challenges.dailyBonusEarned}
                            </Text>
                        </Text>
                        <TouchableOpacity
                            style={styles.linkRow}
                            onPress={goToChallengeHistory}
                            accessibilityRole="button"
                            accessibilityLabel="View weekly and monthly challenge history"
                        >
                            <Text style={styles.linkText}>Weekly &amp; Monthly</Text>
                            <Ionicons name="chevron-forward" size={13} color={Colors.primaryDark} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>

            {/* ── Stat cards grid ───────────────────────────────────────────── */}
            <Animated.View style={[styles.statsGrid, sectionStyle(4)]}>
                <StatCard
                    icon="wallet-outline"
                    label="Wallet Balance"
                    value={`₹${profile.walletBalance}`}
                    footnote="Withdraw on UPI/Bank"
                    accent={ACCENTS.teal}
                />
                <StatCard
                    icon="list-outline"
                    label="Total Listed"
                    value={`${stats.totalSubmitted}`}
                    footnote={`${stats.approvedCount} Approved · ${stats.pendingCount} Pending`}
                    accent={ACCENTS.purple}
                />
                <StatCard
                    icon="flash-outline"
                    label="Instant Listing Earnings"
                    value={`₹${stats.instantListingEarnings}`}
                    footnote="From approved venue listings"
                    accent={Colors.success}
                />
                <StatCard
                    icon="pie-chart-outline"
                    label="25% Booking Share"
                    value={`₹${stats.bookingShareEarnings}`}
                    footnote={
                        profitShareStatus.profitShareUnlocked
                            ? `Active · ${profitShareStatus.daysRemaining} days left`
                            : `Requires 7-Day Streak to unlock (${profitShareStatus.streakDaysCompleted}/7 days)`
                    }
                    accent={ACCENTS.amberDark}
                />
            </Animated.View>

            {/* ── Recent venues + recent credits ───────────────────────────── */}
            <Animated.View style={sectionStyle(5)}>
                <View style={[styles.listCard, Shadows.card]}>
                    <View style={styles.listCardHeader}>
                        <View style={styles.listCardTitleRow}>
                            <View
                                style={[
                                    styles.listCardIconWrap,
                                    { backgroundColor: ACCENTS.tealLight },
                                ]}
                            >
                                <Ionicons name="business" size={13} color={ACCENTS.tealDark} />
                            </View>
                            <Text style={styles.listCardTitle}>Recent Venues Listed</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.linkRow}
                            onPress={goToAllVenues}
                            accessibilityRole="button"
                            accessibilityLabel="View all listed venues"
                        >
                            <Text style={styles.linkText}>View All ({recentVenues.length})</Text>
                            <Ionicons name="chevron-forward" size={13} color={Colors.primaryDark} />
                        </TouchableOpacity>
                    </View>

                    {recentVenues.length === 0 ? (
                        <EmptyState
                            icon="business-outline"
                            title="No venues listed yet"
                            subtitle="Start listing nearby hotels, banquets, or meeting rooms"
                            ctaLabel="List First Venue"
                            onPress={goToOnboardVenue}
                        />
                    ) : (
                        <View style={styles.rowGroup}>
                            {recentVenues.slice(0, 5).map((venue: any, idx: number) => (
                                <VenueRow key={venue?._id ?? idx} venue={venue} />
                            ))}
                        </View>
                    )}
                </View>

                <View style={[styles.listCard, Shadows.card, { marginTop: Spacing.md }]}>
                    <View style={styles.listCardHeader}>
                        <View style={styles.listCardTitleRow}>
                            <View
                                style={[
                                    styles.listCardIconWrap,
                                    { backgroundColor: ACCENTS.amberLight },
                                ]}
                            >
                                <Ionicons name="cash" size={13} color={ACCENTS.amberDark} />
                            </View>
                            <Text style={styles.listCardTitle}>Recent Credits</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.linkRow}
                            onPress={goToLedger}
                            accessibilityRole="button"
                            accessibilityLabel="Open full ledger"
                        >
                            <Text style={styles.linkText}>Ledger</Text>
                            <Ionicons name="chevron-forward" size={13} color={Colors.primaryDark} />
                        </TouchableOpacity>
                    </View>

                    {recentRewards.length === 0 ? (
                        <EmptyState
                            icon="cash-outline"
                            title="No reward transactions yet"
                            subtitle="Rewards appear instantly when venues get approved"
                        />
                    ) : (
                        <View style={styles.rowGroup}>
                            {recentRewards.slice(0, 5).map((reward: any, idx: number) => (
                                <RewardRow key={reward?.id ?? idx} reward={reward} />
                            ))}
                        </View>
                    )}
                </View>
            </Animated.View>
        </ScrollView>
    );
};

export default AmbassadorDashboardScreen;

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.background,
        marginBottom: Spacing.xxl * 3,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.xl,
    },
    loadingText: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        marginTop: Spacing.xs,
    },
    errorIconWrap: {
        width: 52,
        height: 52,
        borderRadius: Radii.full,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xs,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    content: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xxl * 2,
        gap: Spacing.md,
        marginBottom: Spacing.xxl,
    },

    // Decorative background blobs, consistent with the rest of the app.
    arcTop: {
        position: 'absolute',
        top: -SCREEN_WIDTH * 0.55,
        left: -SCREEN_WIDTH * 0.3,
        width: SCREEN_WIDTH * 1.1,
        height: SCREEN_WIDTH * 1.1,
        borderRadius: SCREEN_WIDTH * 0.55,
        backgroundColor: Colors.primaryLight,
        opacity: 0.35,
    },
    arcAccent: {
        position: 'absolute',
        top: SCREEN_WIDTH * 0.15,
        right: -SCREEN_WIDTH * 0.35,
        width: SCREEN_WIDTH * 0.7,
        height: SCREEN_WIDTH * 0.7,
        borderRadius: SCREEN_WIDTH * 0.35,
        backgroundColor: Colors.primary,
        opacity: 0.06,
    },

    // Diagonal stripe texture (used inside gradient cards)
    stripeWrap: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    stripe: {
        position: 'absolute',
        top: -60,
        width: 26,
        height: '220%',
        backgroundColor: 'rgba(255,255,255,0.06)',
        transform: [{ rotate: '20deg' }],
    },

    // Hero card
    heroCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xxl,
        padding: Spacing.lg,
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    heroIdentity: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: Spacing.sm,
    },
    avatarRing: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
    },
    avatarCircle: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitials: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.primaryDark,
        letterSpacing: 0.3,
    },
    heroIdentityText: { marginLeft: Spacing.md, flexShrink: 1 },
    heroEyebrow: {
        fontSize: 10,
        fontWeight: Typography.bold,
        color: Colors.primaryDark,
        letterSpacing: 1.4,
        marginBottom: 2,
    },
    heroName: {
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
    },
    heroSub: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        marginTop: 2,
    },
    heroChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        marginBottom: Spacing.md,
    },

    refreshBtn: {
        width: 36,
        height: 36,
        borderRadius: Radii.full,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },

    onboardBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: Colors.charcoal,
        paddingVertical: Spacing.sm + 2,
        borderRadius: Radii.md,
        ...Shadows.floating,
    },
    onboardBtnText: {
        color: Colors.white,
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
    },

    // Streak banner
    streakBanner: {
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        overflow: 'hidden',
    },
    streakWatermark: {
        position: 'absolute',
        top: -20,
        right: -20,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
        backgroundColor: ACCENTS.purpleLight,
        paddingVertical: 4,
        paddingHorizontal: Spacing.sm,
        borderRadius: Radii.full,
        marginBottom: Spacing.sm,
    },
    streakBadgeText: {
        fontSize: 9,
        fontWeight: Typography.bold,
        color: ACCENTS.purpleDark,
        letterSpacing: Typography.normal,
    },
    streakTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        marginBottom: Spacing.xs,
        lineHeight: 22,
    },
    streakSubtitle: {
        fontSize: Typography.sm,
        color: Colors.primaryHighLight,
        lineHeight: 17,
        marginBottom: Spacing.md,
    },
    streakStatsRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    streakStatBox: {
        flex: 1,
        backgroundColor: 'rgba(30,27,20,0.28)',
        borderRadius: Radii.md,
        padding: Spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
    },
    streakStatLabel: {
        fontSize: Typography.xs,
        color: Colors.primaryHighLight,
        marginBottom: 2,
    },
    streakStatBigValue: {
        fontSize: 22,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        marginBottom: Spacing.xs,
    },
    streakStatSlash: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.primaryHighLight,
    },

    // Progress bar
    progressTrack: {
        height: 6,
        borderRadius: Radii.full,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: Radii.full,
    },
    progressLabel: {
        fontSize: 10,
        fontWeight: Typography.semiBold,
        marginTop: 4,
        textAlign: 'right',
    },

    // Liquid badge
    liquidBadge: {
        overflow: 'hidden',
        backgroundColor: ACCENTS.tealLight,
        borderWidth: 2,
        borderColor: ACCENTS.teal,
        alignItems: 'center',
        justifyContent: 'center',
    },
    liquidFill: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: ACCENTS.teal,
        opacity: 0.55,
    },
    liquidLabelWrap: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    liquidLabelText: {
        fontSize: 12,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },

    // Tier card
    tierCard: {
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        overflow: 'hidden',
    },
    tierWatermark: {
        position: 'absolute',
        bottom: -18,
        right: -14,
    },
    tierTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    tierIconBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.22)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    tierTag: {
        flex: 1,
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.primaryHighLight,
        letterSpacing: Typography.wide,
    },
    tierBadgePill: {
        backgroundColor: 'rgba(255,255,255,0.22)',
        paddingVertical: 3,
        paddingHorizontal: Spacing.sm,
        borderRadius: Radii.full,
    },
    tierBadgePillText: {
        fontSize: Typography.xs,
        color: Colors.white,
        fontWeight: Typography.semiBold,
    },
    tierBigNumber: {
        fontSize: Typography.xxl,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        marginBottom: 6,
    },
    tierSub: {
        fontSize: Typography.sm,
        color: Colors.primaryHighLight,
        marginBottom: Spacing.md,
        lineHeight: 17,
    },
    tierProgressLabel: {
        fontSize: Typography.xs,
        color: Colors.primaryHighLight,
        marginBottom: 6,
    },

    // Challenge card
    challengeCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    challengeAccentBar: {
        width: 5,
        backgroundColor: Colors.primary,
    },
    challengeBody: {
        flex: 1,
        padding: Spacing.lg,
    },
    challengeHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    challengeHeaderText: { flex: 1 },
    challengeTitle: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    challengeSubtitle: {
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
        marginTop: 2,
    },
    bonusPillWrap: { flexShrink: 0 },
    bonusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: ACCENTS.amberLight,
        paddingVertical: 5,
        paddingHorizontal: Spacing.sm,
        borderRadius: Radii.full,
    },
    bonusPillText: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.primaryDark,
    },
    challengeProgressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    challengeProgressLabel: {
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
    },
    challengeProgressValue: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    challengeFooterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing.md,
    },
    challengeFooterLeft: {
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
    },
    challengeFooterValue: {
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    linkText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.primaryDark,
    },

    // Stats grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        justifyContent: 'space-between',
    },
    statCard: {
        width: '48.5%',
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        overflow: 'hidden',
    },
    statAccentBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
    },
    statIconWrap: {
        width: 32,
        height: 32,
        borderRadius: Radii.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
        marginTop: Spacing.xs,
    },
    statLabel: {
        fontSize: Typography.xs,
        color: Colors.charcoalMid,
        marginBottom: 3,
    },
    statValue: {
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        marginBottom: 3,
    },
    statFootnote: {
        fontSize: 10,
        color: Colors.charcoalLight,
    },

    // List cards / empty states
    listCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
    },
    listCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    listCardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    listCardIconWrap: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listCardTitle: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },

    // Recently-listed venue / reward rows
    rowGroup: {
        gap: Spacing.sm,
    },
    rowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    rowIconWrap: {
        width: 30,
        height: 30,
        borderRadius: Radii.sm,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowTextWrap: { flex: 1 },
    rowTitle: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    rowSubtitle: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        marginTop: 1,
    },
    rowStatusPill: {
        paddingVertical: 3,
        paddingHorizontal: Spacing.sm,
        borderRadius: Radii.full,
    },
    rowStatusText: {
        fontSize: 10,
        fontWeight: Typography.semiBold,
    },
    rowAmountText: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.success,
    },

    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    emptyIconWrap: {
        width: 48,
        height: 48,
        borderRadius: Radii.full,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        borderStyle: 'dashed',
    },
    emptyTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
        marginBottom: 3,
    },
    emptySubtitle: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        textAlign: 'center',
        marginBottom: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    emptyCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.full,
    },
    emptyCtaText: {
        color: Colors.white,
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
    },

    // Chip (referenced by the Chip component above)
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: Spacing.sm,
        borderRadius: Radii.full,
    },
    chipPrimaryBorder: {
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    chipText: {
        fontSize: Typography.xs,
        fontWeight: Typography.semiBold,
    },
});

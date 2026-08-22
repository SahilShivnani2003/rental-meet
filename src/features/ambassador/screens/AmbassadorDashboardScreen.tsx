import { Colors, Shadows, Spacing, Radii, Typography } from '@/theme/theme';
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useGetAmbassadorDashboard } from '../hooks/useAmbassador';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { AmbassadorTabParamList } from '@/navigations/tabNavigations/AmbassadorTabNavigation';

// react-native-vector-icons doesn't ship a `glyphMap` type like @expo/vector-icons,
// so icon names are typed as plain strings here.
type IconName = string;

// ── Small building blocks ─────────────────────────────────────────────────────

const Chip: React.FC<{
    icon?: IconName;
    label: string;
    tone?: 'light' | 'dark' | 'primary';
}> = ({ icon, label, tone = 'light' }) => {
    const toneStyles = {
        light: { bg: Colors.background, fg: Colors.charcoalMid },
        dark: { bg: Colors.tabBar, fg: Colors.primaryLight },
        primary: { bg: Colors.primaryLight, fg: Colors.primaryDark },
    }[tone];

    return (
        <View style={[styles.chip, { backgroundColor: toneStyles.bg }]}>
            {icon && <Ionicons name={icon} size={11} color={toneStyles.fg} style={{ marginRight: 4 }} />}
            <Text style={[styles.chipText, { color: toneStyles.fg }]} numberOfLines={1}>
                {label}
            </Text>
        </View>
    );
};

const ProgressBar: React.FC<{ percent: number; trackColor?: string; fillColor?: string }> = ({
    percent,
    trackColor = 'rgba(255,255,255,0.25)',
    fillColor = Colors.white,
}) => (
    <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
        <View
            style={[
                styles.progressFill,
                { width: `${Math.min(100, Math.max(0, percent))}%`, backgroundColor: fillColor },
            ]}
        />
    </View>
);

const StatCard: React.FC<{
    icon: IconName;
    label: string;
    value: string;
    footnote?: string;
    accent?: string;
}> = ({ icon, label, value, footnote, accent = Colors.primary }) => (
    <View style={[styles.statCard, Shadows.card]}>
        <View style={[styles.statIconWrap, { backgroundColor: `${accent}1F` }]}>
            <Ionicons name={icon} size={16} color={accent} />
        </View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {!!footnote && <Text style={styles.statFootnote}>{footnote}</Text>}
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
            <TouchableOpacity style={styles.emptyCta} onPress={onPress} activeOpacity={0.85}>
                <Ionicons name="add" size={14} color={Colors.white} />
                <Text style={styles.emptyCtaText}>{ctaLabel}</Text>
            </TouchableOpacity>
        )}
    </View>
);

// ── Main screen ────────────────────────────────────────────────────────────────
type AmbassadorDashboardScreenProps = NativeBottomTabScreenProps<AmbassadorTabParamList, 'dashboard'>
const AmbassadorDashboardScreen  = ({navigation}: AmbassadorDashboardScreenProps) => {
    const { data, isLoading, isError, refetch } = useGetAmbassadorDashboard();

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={Colors.primary} size="large" />
            </View>
        );
    }

    if (isError || !data?.data) {
        return (
            <View style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={28} color={Colors.charcoalLight} />
                <Text style={styles.emptySubtitle}>Couldn't load your dashboard.</Text>
                <TouchableOpacity style={styles.emptyCta} onPress={() => refetch()}>
                    <Text style={styles.emptyCtaText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { profile, stats, progress, challenges, profitShareStatus, recentVenues, recentRewards } =
        data.data;

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* ── Top identity row ──────────────────────────────────────────── */}
            <View style={styles.topRow}>
                <View style={styles.topChipsRow}>
                    <Chip icon="finger-print-outline" label={profile.ambassadorId} />
                    <Chip icon="ribbon-outline" label={profile.badge} tone="primary" />
                    <Chip
                        icon="trophy-outline"
                        label={`${profile.assignedLevel}/₹${profile.listingRate}/Venue`}
                    />
                    <Chip icon="pie-chart-outline" label="25% Share (7-Day Streak Required)" />
                </View>
                <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()}>
                    <Ionicons name="refresh" size={16} color={Colors.charcoalMid} />
                </TouchableOpacity>
            </View>

            {/* ── Greeting + wallet CTA ─────────────────────────────────────── */}
            <View style={styles.greetingRow}>
                <Text style={styles.greetingText}>Welcome back, Sahil!</Text>
                <TouchableOpacity style={styles.onboardBtn} activeOpacity={0.9}>
                    <Ionicons name="add-circle" size={16} color={Colors.white} />
                    <Text style={styles.onboardBtnText}>Onboard Venue</Text>
                </TouchableOpacity>
            </View>

            {/* ── Streak / profit share banner ─────────────────────────────── */}
            <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.streakBanner, Shadows.primary]}
            >
                <View style={styles.streakBadge}>
                    <Ionicons name="flame" size={11} color={Colors.primaryDark} />
                    <Text style={styles.streakBadgeText}>7-DAY STREAK TARGET (35 VENUES TOTAL)</Text>
                </View>

                <Text style={styles.streakTitle}>
                    Roz {profitShareStatus.dailyTarget} Venues x 7 Days Streak = Total{' '}
                    {profitShareStatus.totalVenuesTarget} Venues{'\n'}To Unlock 25% Profit Share for 1 Year
                </Text>
                <Text style={styles.streakSubtitle}>
                    Lagatar 7 din roz {profitShareStatus.dailyTarget}-{profitShareStatus.dailyTarget + 1}{' '}
                    venues list karein (Total {profitShareStatus.totalVenuesTarget} venues). Streak complete
                    hote hi 25% Booking Share 1 Year ke liye unlock ho jayega.
                </Text>

                <View style={styles.streakStatsRow}>
                    <View style={styles.streakStatBox}>
                        <Text style={styles.streakStatLabel}>7-Day Streak Progress</Text>
                        <Text style={styles.streakStatValue}>
                            {profitShareStatus.streakDaysCompleted}/{profitShareStatus.streakTarget}
                        </Text>
                        <ProgressBar percent={profitShareStatus.streakProgressPercentage} />
                    </View>
                    <View style={styles.streakStatBox}>
                        <Text style={styles.streakStatLabel}>Venues Progress</Text>
                        <Text style={styles.streakStatValue}>
                            {profitShareStatus.totalStreakVenues}/{profitShareStatus.totalVenuesTarget}
                        </Text>
                        <ProgressBar percent={profitShareStatus.venuesProgressPercentage} />
                    </View>
                </View>
            </LinearGradient>

            {/* ── Tier level + verified venues card ────────────────────────── */}
            <LinearGradient
                colors={[Colors.primaryDark, Colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.4 }}
                style={[styles.tierCard, Shadows.primary]}
            >
                <View style={styles.tierTopRow}>
                    <Text style={styles.tierTag}>CURRENT TIER LEVEL</Text>
                    <View style={styles.tierBadgePill}>
                        <Text style={styles.tierBadgePillText}>{progress.tierTitle}</Text>
                    </View>
                </View>
                <Text style={styles.tierBigNumber}>{stats.approvedCount} Verified Venues Approved</Text>
                <Text style={styles.tierSub}>
                    List thirty extra venues within {profitShareStatus.streakTarget} days to level up and
                    boost your payout rate
                </Text>
                <Text style={styles.tierProgressLabel}>Progress to Next Tier</Text>
                <ProgressBar
                    percent={progress.progressPercentage}
                    trackColor="rgba(255,255,255,0.28)"
                    fillColor={Colors.white}
                />
            </LinearGradient>

            {/* ── Daily challenge card ──────────────────────────────────────── */}
            <View style={[styles.challengeCard, Shadows.card]}>
                <View style={styles.challengeHeaderRow}>
                    <View>
                        <Text style={styles.challengeTitle}>Daily {challenges.dailyTarget} Venues Challenge</Text>
                        <Text style={styles.challengeSubtitle}>Earn +₹{challenges.dailyBonusRate} Bonus per Venue Today</Text>
                    </View>
                    <View style={styles.bonusPill}>
                        <Text style={styles.bonusPillText}>+₹{challenges.dailyBonusRate} Bonus</Text>
                    </View>
                </View>

                <View style={styles.challengeProgressRow}>
                    <Text style={styles.challengeProgressLabel}>Today's Verified Count</Text>
                    <Text style={styles.challengeProgressValue}>
                        {challenges.todayVerifiedCount}/{challenges.dailyTarget}
                    </Text>
                </View>
                <ProgressBar
                    percent={(challenges.todayVerifiedCount / Math.max(1, challenges.dailyTarget)) * 100}
                    trackColor={Colors.border}
                    fillColor={Colors.primary}
                />

                <View style={styles.challengeFooterRow}>
                    <Text style={styles.challengeFooterLeft}>
                        Daily Bonus Earned <Text style={styles.challengeFooterValue}>₹{challenges.dailyBonusEarned}</Text>
                    </Text>
                    <TouchableOpacity style={styles.linkRow}>
                        <Text style={styles.linkText}>View Weekly &amp; Monthly Breaks</Text>
                        <Ionicons name="chevron-forward" size={13} color={Colors.primaryDark} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Stat cards grid ───────────────────────────────────────────── */}
            <View style={styles.statsGrid}>
                <StatCard
                    icon="wallet-outline"
                    label="Wallet Balance"
                    value={`₹${stats.totalEarnings}`}
                    footnote="Withdraw on UPI/Bank"
                />
                <StatCard
                    icon="list-outline"
                    label="Total Listed"
                    value={`${stats.totalSubmitted}`}
                    footnote={`${stats.approvedCount} Approved · ${stats.pendingCount} Pending`}
                    accent={Colors.info}
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
                    accent={Colors.primaryDark}
                />
            </View>

            {/* ── Recent venues + recent credits ───────────────────────────── */}
            <View style={[styles.listCard, Shadows.card]}>
                <View style={styles.listCardHeader}>
                    <Text style={styles.listCardTitle}>Recent Venues Listed</Text>
                    <TouchableOpacity style={styles.linkRow}>
                        <Text style={styles.linkText}>View All (0)</Text>
                        <Ionicons name="chevron-forward" size={13} color={Colors.primaryDark} />
                    </TouchableOpacity>
                </View>

                {recentVenues.length === 0 ? (
                    <EmptyState
                        icon="business-outline"
                        title="No venues listed yet"
                        subtitle="Start listing nearby hotels, banquets, or meeting rooms"
                        ctaLabel="List First Venue"
                    />
                ) : null}
            </View>

            <View style={[styles.listCard, Shadows.card]}>
                <View style={styles.listCardHeader}>
                    <Text style={styles.listCardTitle}>Recent Credits</Text>
                    <TouchableOpacity style={styles.linkRow}>
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
                ) : null}
            </View>
        </ScrollView>
    );
};

export default AmbassadorDashboardScreen;

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.background,
    },
    content: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xxl * 2,
        gap: Spacing.md,
    },

    // Top row
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    topChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        flex: 1,
        marginRight: Spacing.sm,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: Spacing.sm,
        borderRadius: Radii.full,
    },
    chipText: {
        fontSize: Typography.xs,
        fontWeight: Typography.medium,
    },
    refreshBtn: {
        width: 32,
        height: 32,
        borderRadius: Radii.full,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },

    // Greeting
    greetingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    greetingText: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
    },
    onboardBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.charcoal,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.full,
    },
    onboardBtnText: {
        color: Colors.white,
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
    },

    // Streak banner
    streakBanner: {
        borderRadius: Radii.xl,
        padding: Spacing.lg,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
        backgroundColor: Colors.primaryHighLight,
        paddingVertical: 4,
        paddingHorizontal: Spacing.sm,
        borderRadius: Radii.full,
        marginBottom: Spacing.sm,
    },
    streakBadgeText: {
        fontSize: 9,
        fontWeight: Typography.bold,
        color: Colors.primaryDark,
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
    },
    streakStatLabel: {
        fontSize: Typography.xs,
        color: Colors.primaryHighLight,
        marginBottom: 2,
    },
    streakStatValue: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.white,
        marginBottom: Spacing.xs,
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

    // Tier card
    tierCard: {
        borderRadius: Radii.xl,
        padding: Spacing.lg,
    },
    tierTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    tierTag: {
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
        padding: Spacing.lg,
    },
    challengeHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
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
    bonusPill: {
        backgroundColor: Colors.primaryLight,
        paddingVertical: 4,
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
    },
    statIconWrap: {
        width: 28,
        height: 28,
        borderRadius: Radii.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
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
    listCardTitle: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
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
});
import { Colors, Spacing, Radii, Shadows, Typography } from '@/theme/theme';
import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useGetAmbassadorDashboard, useGetAmbassadorEarnings, useGetAmbassadorPayouts, useRequestAmbassadorPayouts } from '../hooks/useAmbassador';


// ── Types ─────────────────────────────────────────────────────────────────────
type LedgerTab = 'ledger' | 'settlements';

// ── Small building blocks ────────────────────────────────────────────────────

const ProgressBar = ({ progress }: { progress: number }) => (
    <View style={styles.progressTrack}>
        <View
            style={[styles.progressFill, { width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }]}
        />
    </View>
);

const MiniStat = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.miniStat}>
        <Text style={styles.miniStatLabel}>{label}</Text>
        <Text style={styles.miniStatValue}>{value}</Text>
    </View>
);

const StatCard = ({
    title,
    icon,
    iconColor,
    value,
    caption,
    highlighted,
    locked,
}: {
    title: string;
    icon: string;
    iconColor: string;
    value: string;
    caption?: string;
    highlighted?: boolean;
    locked?: boolean;
}) => (
    <View style={[styles.statCard, highlighted && styles.statCardHighlighted]}>
        <View style={styles.statCardHeader}>
            <Text
                style={[styles.statCardTitle, highlighted && styles.statCardTitleHighlighted]}
                numberOfLines={1}
            >
                {title}
            </Text>
            <View style={styles.statCardHeaderRight}>
                {locked && (
                    <View style={styles.lockedPill}>
                        <Ionicons name="lock-closed" size={10} color={Colors.charcoalWarm} />
                        <Text style={styles.lockedPillText}>Locked</Text>
                    </View>
                )}
                <Ionicons name={icon} size={16} color={highlighted ? Colors.white : iconColor} />
            </View>
        </View>

        <Text style={[styles.statCardValue, highlighted && styles.statCardValueHighlighted]}>
            {value}
        </Text>

        {caption ? (
            <Text
                style={[styles.statCardCaption, highlighted && styles.statCardCaptionHighlighted]}
            >
                {caption}
            </Text>
        ) : null}
    </View>
);

// ── Screen ────────────────────────────────────────────────────────────────────

export default function EarningsWalletScreen() {
    const { data: dashboard, isLoading, refetch, isRefetching } = useGetAmbassadorDashboard();
    const { data: earnings } = useGetAmbassadorEarnings();
    const { data: payouts } = useGetAmbassadorPayouts();
    const requestPayout = useRequestAmbassadorPayouts();

    const [activeTab, setActiveTab] = React.useState<LedgerTab>('ledger');

    const availableBalance = dashboard?.availableBalance ?? 0;
    const listingRewards = earnings?.listingRewards ?? 0;
    const streakChallengeEarnings = earnings?.streakChallengeEarnings ?? 0;
    const bookingShareEarnings = earnings?.bookingShareEarnings ?? 0;
    const bookingShareLocked = !dashboard?.streak?.isThirtyFiveComplete;

    const todaysVenues = dashboard?.streak?.todaysVenues ?? 0;
    const streakTotalVenues = dashboard?.streak?.totalVenues ?? 0;
    const streakDaysComplete = dashboard?.streak?.daysComplete ?? 0;

    const ledgerEntries = earnings?.transactions ?? [];
    const settlementEntries = payouts ?? [];

    const visibleEntries = activeTab === 'ledger' ? ledgerEntries : settlementEntries;

    const handleRequestPayout = () => {
        requestPayout.mutate({ amount: availableBalance } as any);
    };

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>
                        Earnings & <Text style={styles.headerTitleAccent}>Wallet</Text>
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        View your listing rewards, 25% recurring booking shares, and withdrawal
                        settlements.
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => refetch()}
                    disabled={isRefetching}
                >
                    {isRefetching ? (
                        <ActivityIndicator size="small" color={Colors.charcoal} />
                    ) : (
                        <Ionicons name="refresh" size={18} color={Colors.charcoal} />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.payoutButton}
                    onPress={handleRequestPayout}
                    disabled={requestPayout.isPending || availableBalance <= 0}
                >
                    <Ionicons name="arrow-up-outline" size={14} color={Colors.white} />
                    <Text style={styles.payoutButtonText}>Request Payout</Text>
                </TouchableOpacity>
            </View>

            {/* Streak target banner */}
            <View style={styles.streakBanner}>
                <View style={styles.streakBannerTop}>
                    <View style={styles.streakBadge}>
                        <Text style={styles.streakBadgeText}>
                            🔥 7-DAY STREAK TARGET: 5 VENUES/DAY (35 VENUES TOTAL)
                        </Text>
                    </View>

                    <View style={styles.streakSidePanel}>
                        <View style={styles.streakSideHeaderRow}>
                            <Text style={styles.streakSideHeader}>7-Day Streak (5 Venues/Day)</Text>
                            <Text style={styles.streakSideHeaderValue}>
                                {streakDaysComplete} / 7 Days
                            </Text>
                        </View>
                        <ProgressBar progress={streakDaysComplete / 7} />

                        <View style={styles.streakSideMiniRow}>
                            <MiniStat label="Today's Venues" value={`${todaysVenues} / 5`} />
                            <MiniStat
                                label="Streak Total Venues"
                                value={`${streakTotalVenues} / 35`}
                            />
                        </View>
                    </View>
                </View>

                <Text style={styles.streakBannerHeadline}>
                    Roz 5 Venues × 7 Days Streak = Total 35 Venues to Unlock 25%{'\n'}
                    Profit Share for 1 Year
                </Text>
                <Text style={styles.streakBannerBody}>
                    Lagatar 7 din roz 5-5 verified venues list karein (Total 35 venues). 7-Day
                    streak complete hote hi 1 Year (365 Days) ke liye 25% Recurring Booking Profit
                    Share + ₹1,000 Cash Bonus instant unlock ho jayega!
                </Text>
            </View>

            {/* Stat cards */}
            <View style={styles.statGrid}>
                <StatCard
                    title="AVAILABLE BALANCE"
                    icon="wallet-outline"
                    iconColor={Colors.white}
                    value={`₹${availableBalance}`}
                    caption="Instant withdrawal to UPI or Bank"
                    highlighted
                />
                <StatCard
                    title="Listing Rewards"
                    icon="ribbon-outline"
                    iconColor={Colors.primary}
                    value={`₹${listingRewards}`}
                    caption="Earned from approved venue listings"
                />
                <StatCard
                    title="Streak & Challenges"
                    icon="flash-outline"
                    iconColor={Colors.info}
                    value={`₹${streakChallengeEarnings}`}
                    caption="Daily, weekly & monthly streak bonuses"
                />
                <StatCard
                    title="25% Booking Shares"
                    icon="trending-up-outline"
                    iconColor="#7C3AED"
                    value={`₹${bookingShareEarnings}`}
                    caption={`Complete 7-Day Streak to unlock 1-Year 25% Share (${streakDaysComplete}/7 Days)`}
                    locked={bookingShareLocked}
                />
            </View>

            {/* Ledger / settlements */}
            <View style={styles.ledgerCard}>
                <View style={styles.ledgerTabs}>
                    <TouchableOpacity
                        style={[styles.ledgerTab, activeTab === 'ledger' && styles.ledgerTabActive]}
                        onPress={() => setActiveTab('ledger')}
                    >
                        <Text
                            style={[
                                styles.ledgerTabText,
                                activeTab === 'ledger' && styles.ledgerTabTextActive,
                            ]}
                        >
                            Reward Credits Ledger
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.ledgerTab,
                            styles.ledgerTabOutline,
                            activeTab === 'settlements' && styles.ledgerTabActiveOutline,
                        ]}
                        onPress={() => setActiveTab('settlements')}
                    >
                        <Text
                            style={[
                                styles.ledgerTabTextMuted,
                                activeTab === 'settlements' && styles.ledgerTabTextActiveMuted,
                            ]}
                        >
                            Withdrawal Settlements ({settlementEntries.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.ledgerDivider} />

                {isLoading ? (
                    <ActivityIndicator
                        color={Colors.primary}
                        style={{ marginVertical: Spacing.xl }}
                    />
                ) : visibleEntries.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>
                            {activeTab === 'ledger'
                                ? 'No reward transactions recorded yet.'
                                : 'No withdrawal settlements recorded yet.'}
                        </Text>
                    </View>
                ) : (
                    visibleEntries.map((entry: any, idx: number) => (
                        <View key={entry.id ?? idx} style={styles.ledgerRow}>
                            <Text style={styles.ledgerRowTitle}>
                                {entry.title ?? entry.description ?? 'Transaction'}
                            </Text>
                            <Text style={styles.ledgerRowAmount}>₹{entry.amount ?? 0}</Text>
                        </View>
                    ))
                )}
            </View>
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        ...Shadows.card,
    },
    headerTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
    headerTitleAccent: {
        color: Colors.primary,
    },
    headerSubtitle: {
        marginTop: Spacing.xxs,
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
    },
    iconButton: {
        width: 34,
        height: 34,
        borderRadius: Radii.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    payoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xxs,
        backgroundColor: Colors.success,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radii.full,
    },
    payoutButtonText: {
        color: Colors.white,
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
    },

    streakBanner: {
        backgroundColor: Colors.primaryLight,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        gap: Spacing.sm,
    },
    streakBannerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: Spacing.md,
        flexWrap: 'wrap',
    },
    streakBadge: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.primaryHighLight,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xxs,
        maxWidth: '55%',
    },
    streakBadgeText: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.primaryDark,
        letterSpacing: Typography.normal,
    },
    streakSidePanel: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        padding: Spacing.md,
        minWidth: 220,
        flexGrow: 1,
        gap: Spacing.xs,
        ...Shadows.card,
    },
    streakSideHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    streakSideHeader: {
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    streakSideHeaderValue: {
        fontSize: Typography.sm,
        color: Colors.primaryDark,
        fontWeight: Typography.bold,
    },
    streakSideMiniRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.xs,
    },
    miniStat: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: Radii.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingVertical: Spacing.xs,
        alignItems: 'center',
    },
    miniStatLabel: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
    },
    miniStatValue: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginTop: 2,
    },
    progressTrack: {
        height: 6,
        borderRadius: Radii.full,
        backgroundColor: Colors.border,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: Radii.full,
        backgroundColor: Colors.primary,
    },
    streakBannerHeadline: {
        fontSize: Typography.md,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        lineHeight: 20,
    },
    streakBannerBody: {
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
        lineHeight: 18,
    },

    statGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    statCard: {
        flexGrow: 1,
        flexBasis: '46%',
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.md,
        ...Shadows.card,
    },
    statCardHighlighted: {
        backgroundColor: Colors.success,
        borderColor: Colors.success,
        flexBasis: '100%',
    },
    statCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statCardHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    statCardTitle: {
        fontSize: Typography.xs,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
        letterSpacing: Typography.normal,
        textTransform: 'uppercase',
    },
    statCardTitleHighlighted: {
        color: 'rgba(255,255,255,0.85)',
    },
    lockedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: Colors.warningLight,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.xs,
        paddingVertical: 2,
    },
    lockedPillText: {
        fontSize: 9,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalWarm,
    },
    statCardValue: {
        fontSize: Typography.xxl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        marginTop: Spacing.xs,
    },
    statCardValueHighlighted: {
        color: Colors.white,
    },
    statCardCaption: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        marginTop: Spacing.xxs,
    },
    statCardCaptionHighlighted: {
        color: 'rgba(255,255,255,0.85)',
    },

    ledgerCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        ...Shadows.card,
    },
    ledgerTabs: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    ledgerTab: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radii.full,
        backgroundColor: Colors.primary,
    },
    ledgerTabOutline: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    ledgerTabActive: {
        backgroundColor: Colors.primary,
    },
    ledgerTabActiveOutline: {
        backgroundColor: Colors.primaryLight,
        borderColor: Colors.primaryBorder,
    },
    ledgerTabText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.white,
    },
    ledgerTabTextActive: {
        color: Colors.white,
    },
    ledgerTabTextMuted: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    ledgerTabTextActiveMuted: {
        color: Colors.primaryDark,
    },
    ledgerDivider: {
        height: 1,
        backgroundColor: Colors.divider,
        marginVertical: Spacing.md,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    emptyStateText: {
        fontSize: Typography.sm,
        color: Colors.info,
    },
    ledgerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    ledgerRowTitle: {
        fontSize: Typography.base,
        color: Colors.charcoal,
    },
    ledgerRowAmount: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.success,
    },
});

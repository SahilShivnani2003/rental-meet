import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { Colors, Typography, Spacing, Radii, Shadows } from '@theme/theme';
import { useGetLeaderboard } from '../hooks/useAmbassador';

type LeaderboardRow = {
    id: string;
    rank: number;
    name: string;
    location: string;
    badge: string;
    verifiedVenues: number;
};

type AwardTier = {
    icon: string;
    label: string;
    value: string;
    valueColor: string;
};

const FALLBACK_AWARD_TIERS: AwardTier[] = [
    { icon: '🏆', label: '1ST PRIZE', value: '₹25,000 Cash', valueColor: Colors.primaryDark },
    { icon: '🥈', label: '2ND PRIZE', value: '₹15,000 Cash', valueColor: Colors.info },
    { icon: '🥉', label: '3RD PRIZE', value: '₹10,000 Cash', valueColor: '#B45309' },
    {
        icon: '⭐',
        label: 'CITY LEGEND',
        value: 'Special Certificate',
        valueColor: Colors.primaryDark,
    },
];
// ── Building blocks ───────────────────────────────────────────────────────────

const AwardCard = ({ award }: { award: { icon: string; position: string; reward: string } }) => (
    <View style={styles.awardCard}>
        <Text style={styles.awardEmoji}>{award.icon}</Text>
        <Text style={styles.awardTitle}>{award.position}</Text>
        <Text style={[styles.awardValue, { color: Colors.primaryDark }]}>{award.reward}</Text>
    </View>
);

const RANK_STYLES: Record<number, { bg: string; fg: string; icon: string }> = {
    1: { bg: '#FEF3C7', fg: '#92400E', icon: '🏆' },
    2: { bg: '#E5E7EB', fg: '#374151', icon: '🥈' },
    3: { bg: '#FDE7D3', fg: '#9A3412', icon: '🥉' },
};

const BADGE_ICONS: Record<string, string> = {
    'Bronze Explorer': '🥉',
    'Silver Explorer': '🥈',
    'Gold Explorer': '🥇',
};

const initials = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(p => p[0]?.toUpperCase())
        .join('');

const TableRow = ({ row }: { row: LeaderboardRow }) => {
    const rankStyle = RANK_STYLES[row.rank];
    const badgeIcon = BADGE_ICONS[row.badge] ?? '🥉';

    return (
        <View style={styles.row}>
            <View
                style={[
                    styles.rankBadge,
                    rankStyle ? { backgroundColor: rankStyle.bg } : styles.rankBadgeDefault,
                ]}
            >
                {rankStyle ? (
                    <Text style={styles.rankBadgeIcon}>{rankStyle.icon}</Text>
                ) : (
                    <Text style={styles.rankBadgeNumber}>{row.rank}</Text>
                )}
            </View>

            <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{initials(row.name)}</Text>
            </View>

            <View style={styles.rowMain}>
                <Text style={styles.rowName} numberOfLines={1}>
                    {row.name}
                </Text>
                <View style={styles.rowMetaRow}>
                    {!!row.location && (
                        <Text style={styles.rowLocation} numberOfLines={1}>
                            📍 {row.location}
                        </Text>
                    )}
                    <View style={styles.badgePill}>
                        <Text style={styles.badgePillText}>
                            {badgeIcon} {row.badge}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.venuesChip}>
                <Text style={styles.venuesChipValue}>{row.verifiedVenues}</Text>
                <Text style={styles.venuesChipLabel}>Venues</Text>
            </View>
        </View>
    );
};

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AmbassadorLeaderboardScreen() {
    const { data, isLoading } = useGetLeaderboard();

    const rows: LeaderboardRow[] = (data?.leaderboard ?? []).map((item: any, idx: number) => ({
        id: item._id,
        rank: idx + 1,
        name: item?.user?.name ?? 'Ambassador',
        location: [item?.user?.city, item?.user?.state].filter(Boolean).join(', '),
        badge: item?.badge ?? 'Bronze Explorer',
        verifiedVenues: item?.totalVenuesApproved ?? 0,
    }));

    const awards = data?.monthlyAwards ?? [];
    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <LinearGradient
                colors={[Colors.primary, '#EA7B1E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerPill}>
                    <Text style={styles.headerPillText}>🏆 ALL-INDIA RANKINGS</Text>
                </View>
                <Text style={styles.headerTitle}>
                    <Text style={styles.headerTitleAccent}>Ambassador</Text> Leaderboard & Awards
                </Text>
                <Text style={styles.headerSubtitle}>
                    Compete with Venue Acquisition Partners across 250+ Indian cities and win
                    monthly cash prizes!
                </Text>
            </LinearGradient>

            {/* Monthly star awards */}
            <View>
                <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitleIcon}>⚙️</Text>
                    <Text style={styles.sectionTitle}>Monthly Star Awards</Text>
                </View>

                <View style={styles.awardsGrid}>
                    {awards.length > 0
                        ? awards.map((award: any, idx: number) => (
                              <AwardCard key={award.position ?? idx} award={award} />
                          ))
                        : FALLBACK_AWARD_TIERS.map(tier => (
                              <View key={tier.label} style={styles.awardCard}>
                                  <Text style={styles.awardEmoji}>{tier.icon}</Text>
                                  <Text style={styles.awardLabel}>{tier.label}</Text>
                                  <Text style={[styles.awardValue, { color: tier.valueColor }]}>
                                      {tier.value}
                                  </Text>
                              </View>
                          ))}
                </View>
            </View>

            {/* Rankings table */}
            <View style={styles.tableCard}>
                <Text style={styles.tableTitle}>Pan-India Rankings</Text>

                {isLoading ? (
                    <ActivityIndicator
                        color={Colors.primary}
                        style={{ marginVertical: Spacing.xl }}
                    />
                ) : rows.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>
                            No ranked ambassadors yet — be the first to list a venue!
                        </Text>
                    </View>
                ) : (
                    <View style={{ gap: Spacing.xs }}>
                        {rows.map(row => (
                            <TableRow key={row.id} row={row} />
                        ))}
                    </View>
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

    header: {
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        ...Shadows.header,
    },
    headerPill: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        marginBottom: Spacing.xs,
    },
    headerPillText: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.white,
        letterSpacing: Typography.wide,
    },
    headerTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.white,
    },
    headerTitleAccent: {
        color: Colors.charcoal,
    },
    headerSubtitle: {
        marginTop: Spacing.xxs,
        fontSize: Typography.sm,
        color: 'rgba(255,255,255,0.9)',
    },

    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xxs,
        marginBottom: Spacing.sm,
    },
    sectionTitleIcon: {
        fontSize: Typography.base,
    },
    sectionTitle: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },

    awardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    awardCard: {
        flexGrow: 1,
        flexBasis: '46%',
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        alignItems: 'center',
        gap: 2,
        ...Shadows.card,
    },
    awardEmoji: {
        fontSize: 26,
        marginBottom: Spacing.xxs,
    },
    awardLabel: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: Typography.normal,
    },
    awardTitle: {
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
        textAlign: 'center',
        marginTop: 2,
    },
    awardValue: {
        fontSize: Typography.md,
        fontWeight: Typography.extraBold,
        marginTop: Spacing.xxs,
        textAlign: 'center',
    },

    tableCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        ...Shadows.card,
    },
    tableTitle: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginBottom: Spacing.sm,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        paddingBottom: Spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    tableHeaderCell: {
        fontSize: Typography.xs,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalLight,
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    colRank: { flexBasis: '14%' },
    colName: { flexBasis: '28%' },
    colLocation: { flexBasis: '16%' },
    colBadge: { flexBasis: '22%' },
    colVenues: { flexBasis: '20%' },
    tableCellRank: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    tableCellName: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    tableCellLocation: {
        fontSize: Typography.sm,
        color: Colors.primary,
    },
    tableCellVenues: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.primary,
        textAlign: 'right',
    },

    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    emptyStateText: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: Radii.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankBadgeDefault: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    rankBadgeIcon: {
        fontSize: 16,
    },
    rankBadgeNumber: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
    },
    avatarCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitials: {
        fontSize: Typography.sm,
        fontWeight: Typography.extraBold,
        color: Colors.primaryDark,
    },
    rowMain: {
        flex: 1,
        minWidth: 0,
    },
    rowName: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    rowMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        marginTop: 3,
    },
    rowLocation: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
    },
    badgePill: {
        backgroundColor: Colors.primaryLight,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.xs,
        paddingVertical: 1,
    },
    badgePillText: {
        fontSize: 10,
        fontWeight: Typography.semiBold,
        color: Colors.primaryDark,
    },
    venuesChip: {
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingVertical: 4,
        paddingHorizontal: Spacing.sm,
        minWidth: 56,
    },
    venuesChipValue: {
        fontSize: Typography.base,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
    },
    venuesChipLabel: {
        fontSize: 9,
        color: Colors.charcoalLight,
    },
});

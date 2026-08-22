import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { Colors, Typography, Spacing, Radii, Shadows } from '@theme/theme';
import { useGetLeaderboard } from '../hooks/useAmbassador';

// ── Types ─────────────────────────────────────────────────────────────────────
type AwardTier = {
    emoji: string;
    label: string;
    title: string;
    value: string;
    valueColor: string;
};

type LeaderboardRow = {
    id?: string;
    rank: number;
    name: string;
    location: string;
    badge: string;
    verifiedVenues: number;
};

const AWARD_TIERS: AwardTier[] = [
    {
        emoji: '👑',
        label: '1ST PRIZE',
        title: 'Star Performer of the Month',
        value: '₹25,000 Cash',
        valueColor: Colors.primaryDark,
    },
    {
        emoji: '🥈',
        label: '2ND PRIZE',
        title: 'Silver Performer Award',
        value: '₹15,000 Cash',
        valueColor: Colors.info,
    },
    {
        emoji: '🥉',
        label: '3RD PRIZE',
        title: 'Bronze Performer Award',
        value: '₹10,000 Cash',
        valueColor: '#B45309',
    },
    {
        emoji: '⭐',
        label: 'CITY LEGEND',
        title: 'Top City Partner Honor',
        value: 'Special Certificate',
        valueColor: Colors.primaryDark,
    },
];

// ── Building blocks ───────────────────────────────────────────────────────────

const AwardCard = ({ tier }: { tier: AwardTier }) => (
    <View style={styles.awardCard}>
        <Text style={styles.awardEmoji}>{tier.emoji}</Text>
        <Text style={styles.awardLabel}>{tier.label}</Text>
        <Text style={styles.awardTitle}>{tier.title}</Text>
        <Text style={[styles.awardValue, { color: tier.valueColor }]}>{tier.value}</Text>
    </View>
);

const rankEmoji = (rank: number) => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏅';
};

const TableRow = ({ row }: { row: LeaderboardRow }) => (
    <View style={styles.tableRow}>
        <View style={styles.colRank}>
            <Text style={styles.tableCellRank}>
                {rankEmoji(row.rank)} #{row.rank}
            </Text>
        </View>
        <View style={styles.colName}>
            <Text style={styles.tableCellName}>{row.name}</Text>
        </View>
        <View style={styles.colLocation}>
            <Text style={styles.tableCellLocation}>{row.location}</Text>
        </View>
        <View style={styles.colBadge}>
            <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>🥉 {row.badge}</Text>
            </View>
        </View>
        <View style={styles.colVenues}>
            <Text style={styles.tableCellVenues}>{row.verifiedVenues} Venues</Text>
        </View>
    </View>
);

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AmbassadorLeaderboardScreen() {
    const { data, isLoading } = useGetLeaderboard();

    const rows: LeaderboardRow[] = data?.rankings ?? [];

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
                    {AWARD_TIERS.map(tier => (
                        <AwardCard key={tier.label} tier={tier} />
                    ))}
                </View>
            </View>

            {/* Rankings table */}
            <View style={styles.tableCard}>
                <Text style={styles.tableTitle}>Pan-India Rankings</Text>

                <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableHeaderCell, styles.colRank]}>Rank</Text>
                    <Text style={[styles.tableHeaderCell, styles.colName]}>Ambassador</Text>
                    <Text style={[styles.tableHeaderCell, styles.colLocation]}>Location</Text>
                    <Text style={[styles.tableHeaderCell, styles.colBadge]}>Level / Badge</Text>
                    <Text
                        style={[styles.tableHeaderCell, styles.colVenues, { textAlign: 'right' }]}
                    >
                        Verified Venues
                    </Text>
                </View>

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
                    rows.map((row, idx) => <TableRow key={row.id ?? idx} row={row} />)
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
    badgePill: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.primaryLight,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.xs,
        paddingVertical: 2,
    },
    badgePillText: {
        fontSize: Typography.xs,
        fontWeight: Typography.semiBold,
        color: Colors.primaryDark,
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
});

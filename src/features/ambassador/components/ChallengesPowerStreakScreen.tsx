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
import LinearGradient from 'react-native-linear-gradient';

import { Colors, Typography, Spacing, Radii, Shadows } from '@theme/theme';
import { useGetAmbassadorDashboard } from '../hooks/useAmbassador';

// ── Types ─────────────────────────────────────────────────────────────────────
type BreakdownRow = { label: string; value: string; color?: string };

// ── Building blocks ───────────────────────────────────────────────────────────

const ProgressBar = ({ progress }: { progress: number }) => (
    <View style={styles.progressTrack}>
        <View
            style={[styles.progressFill, { width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }]}
        />
    </View>
);

const ChallengeCard = ({
    icon,
    iconBg,
    iconColor,
    badgeLabel,
    badgeColor,
    badgeBg,
    title,
    description,
    progressLabel,
    progressValue,
    progress,
    bonusLabel,
    bonusValue,
    bonusBg,
    bonusColor,
    rows,
    totalLabel,
    totalValue,
    footnote,
}: {
    icon: string;
    iconBg: string;
    iconColor: string;
    badgeLabel: string;
    badgeColor: string;
    badgeBg: string;
    title: string;
    description: string;
    progressLabel?: string;
    progressValue?: string;
    progress?: number;
    bonusLabel: string;
    bonusValue: string;
    bonusBg: string;
    bonusColor: string;
    rows: BreakdownRow[];
    totalLabel: string;
    totalValue: string;
    footnote: string;
}) => (
    <View style={styles.challengeCard}>
        <View style={styles.challengeCardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={18} color={iconColor} />
            </View>
            <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
            </View>
        </View>

        <Text style={styles.challengeTitle}>{title}</Text>
        <Text style={styles.challengeDescription}>{description}</Text>

        {progress !== undefined ? (
            <View style={styles.progressBlock}>
                <View style={styles.progressBlockHeaderRow}>
                    <Text style={styles.progressBlockLabel}>{progressLabel}</Text>
                </View>
                <ProgressBar progress={progress} />
                <Text style={styles.progressBlockValue}>{progressValue}</Text>
            </View>
        ) : (
            <View style={[styles.bonusBox, { backgroundColor: bonusBg }]}>
                <Text style={[styles.bonusLabel, { color: bonusColor }]}>{bonusLabel}</Text>
                <Text style={[styles.bonusValue, { color: bonusColor }]}>{bonusValue}</Text>
            </View>
        )}

        <View style={styles.rowsBlock}>
            {rows.map((row, idx) => (
                <View key={idx} style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{row.label}</Text>
                    <Text style={[styles.breakdownValue, row.color ? { color: row.color } : null]}>
                        {row.value}
                    </Text>
                </View>
            ))}
        </View>

        <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{totalLabel}</Text>
            <Text style={styles.totalValue}>{totalValue}</Text>
        </View>

        <Text style={styles.footnote}>{footnote}</Text>
    </View>
);

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ChallengesPowerStreaksScreen() {
    const { data: dashboard, isLoading } = useGetAmbassadorDashboard();

    const todaysVenues = dashboard?.streak?.todaysVenues ?? 0;
    const remainingToday = Math.max(5 - todaysVenues, 0);

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <LinearGradient
                colors={['#4338CA', '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={{ flex: 1 }}>
                    <View style={styles.headerPill}>
                        <Text style={styles.headerPillText}>🔥 HIGH PERFORMANCE PROGRAM</Text>
                    </View>
                    <Text style={styles.headerTitle}>
                        Challenges & <Text style={styles.headerTitleAccent}>Power Streaks</Text>
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        Complete daily, weekly, and monthly venue listing goals to unlock massive
                        achievement bonuses!
                    </Text>
                </View>

                <TouchableOpacity style={styles.listVenueButton}>
                    <Ionicons name="add-circle-outline" size={16} color={Colors.charcoal} />
                    <Text style={styles.listVenueButtonText}>List Venue Now</Text>
                </TouchableOpacity>
            </LinearGradient>

            {isLoading ? (
                <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.xl }} />
            ) : (
                <View style={styles.cardsGrid}>
                    <ChallengeCard
                        icon="flash"
                        iconBg={Colors.primaryLight}
                        iconColor={Colors.primary}
                        badgeLabel="Daily Goal"
                        badgeColor={Colors.warning}
                        badgeBg={Colors.warningLight}
                        title="Daily 5-Venues Challenge"
                        description="Get 5 verified venue listings approved in 1 single day."
                        progressLabel="Today's Progress"
                        progressValue={`${todaysVenues} / 5 Venues`}
                        progress={todaysVenues / 5}
                        bonusLabel=""
                        bonusValue=""
                        bonusBg={Colors.primaryLight}
                        bonusColor={Colors.primaryDark}
                        rows={[
                            { label: 'Standard Reward:', value: '5 × ₹100 = ₹500' },
                            {
                                label: 'Challenge Bonus:',
                                value: '5 × ₹50 = +₹250',
                                color: Colors.primaryDark,
                            },
                        ]}
                        totalLabel="Total Daily Potential:"
                        totalValue="₹750 / day"
                        footnote={
                            remainingToday > 0
                                ? `${remainingToday} more venues needed today for +₹250 bonus.`
                                : 'Daily target complete — bonus unlocked!'
                        }
                    />

                    <ChallengeCard
                        icon="disc-outline"
                        iconBg={Colors.infoLight}
                        iconColor={Colors.info}
                        badgeLabel="Weekly Streak"
                        badgeColor={Colors.info}
                        badgeBg={Colors.infoLight}
                        title="7-Day Power Streak"
                        description="List 5 venues daily for 7 consecutive days (35 total venues)."
                        bonusLabel="Fixed Weekly Bonus"
                        bonusValue="+₹1,000 Cash Bonus"
                        bonusBg={Colors.infoHighLight}
                        bonusColor={Colors.info}
                        rows={[
                            { label: 'Standard Reward:', value: '35 × ₹100 = ₹3,500' },
                            {
                                label: 'Daily Streak Bonus:',
                                value: '35 × ₹50 = +₹1,750',
                                color: Colors.primaryDark,
                            },
                            {
                                label: 'Weekly Fixed Bonus:',
                                value: '+₹1,000',
                                color: Colors.info,
                            },
                        ]}
                        totalLabel="Total Weekly Potential:"
                        totalValue="₹6,250 / week"
                        footnote="Streak resets weekly every Monday at 00:00 AM IST."
                    />

                    <ChallengeCard
                        icon="trophy"
                        iconBg="#F3E8FF"
                        iconColor="#7C3AED"
                        badgeLabel="Monthly Trophy"
                        badgeColor="#7C3AED"
                        badgeBg="#F3E8FF"
                        title="30-Day Venue Champion"
                        description="List 150 verified venues within a calendar month."
                        bonusLabel="Fixed Monthly Bonus"
                        bonusValue="+₹5,000 Cash Bonus"
                        bonusBg="#F5F3FF"
                        bonusColor="#7C3AED"
                        rows={[
                            { label: 'Standard Reward:', value: '150 × ₹100 = ₹15,000' },
                            {
                                label: 'Daily Challenge Bonus:',
                                value: '150 × ₹50 = +₹7,500',
                                color: Colors.primaryDark,
                            },
                            {
                                label: 'Monthly Fixed Bonus:',
                                value: '+₹5,000',
                                color: '#7C3AED',
                            },
                        ]}
                        totalLabel="Total Monthly Potential:"
                        totalValue="₹27,500 / month"
                        footnote="Automatically upgrades badge to Gold Master!"
                    />
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
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        gap: Spacing.md,
        ...Shadows.header,
    },
    headerPill: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.16)',
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
        color: Colors.primary,
    },
    headerSubtitle: {
        marginTop: Spacing.xxs,
        fontSize: Typography.sm,
        color: 'rgba(255,255,255,0.85)',
    },
    listVenueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xxs,
        backgroundColor: Colors.white,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radii.full,
    },
    listVenueButtonText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },

    cardsGrid: {
        gap: Spacing.lg,
    },
    challengeCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        gap: Spacing.xs,
        ...Shadows.card,
    },
    challengeCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    iconCircle: {
        width: 34,
        height: 34,
        borderRadius: Radii.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radii.full,
    },
    badgeText: {
        fontSize: Typography.xs,
        fontWeight: Typography.semiBold,
    },
    challengeTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginTop: Spacing.xs,
    },
    challengeDescription: {
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
        marginBottom: Spacing.xs,
    },

    progressBlock: {
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.md,
        gap: Spacing.xs,
    },
    progressBlockHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressBlockLabel: {
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
        textTransform: 'uppercase',
        letterSpacing: Typography.normal,
    },
    progressBlockValue: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
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

    bonusBox: {
        borderRadius: Radii.md,
        padding: Spacing.md,
        gap: 2,
    },
    bonusLabel: {
        fontSize: Typography.xs,
        textTransform: 'uppercase',
        letterSpacing: Typography.normal,
        fontWeight: Typography.semiBold,
    },
    bonusValue: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
    },

    rowsBlock: {
        marginTop: Spacing.sm,
        gap: Spacing.xxs,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    breakdownLabel: {
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
    },
    breakdownValue: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },

    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.sm,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
    },
    totalLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    totalValue: {
        fontSize: Typography.md,
        fontWeight: Typography.extraBold,
        color: Colors.success,
    },
    footnote: {
        marginTop: Spacing.xxs,
        fontSize: Typography.xs,
        color: Colors.charcoalLight,
    },
});

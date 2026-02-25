import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOCK_OWNER = { name: 'Alex Johnson', role: 'OWNER PARTNER', initials: 'AJ' };

const STATS = [
  { id: 'venues',   label: 'Total Venues',   value: 0,  icon: 'business-outline',        color: Colors.primary,  bg: Colors.primaryLight, prefix: '' },
  { id: 'approved', label: 'Approved',        value: 0,  icon: 'checkmark-circle-outline', color: Colors.success,  bg: Colors.successLight, prefix: '' },
  { id: 'bookings', label: 'Total Bookings',  value: 0,  icon: 'calendar-outline',         color: Colors.info,     bg: Colors.infoLight,    prefix: '' },
  { id: 'earnings', label: 'Total Earnings',  value: 0,  icon: 'cash-outline',             color: '#7C3AED',       bg: '#EDE9FE',           prefix: '₹' },
];

// ─── Animated number counter ──────────────────────────────────────────────────
function AnimatedStat({ value }: { value: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value, duration: 800, useNativeDriver: false }).start();
  }, [value]);
  return (
    <Animated.Text style={styles.statValueNum}>
      {anim.interpolate({ inputRange: [0, Math.max(value, 1)], outputRange: ['0', String(value)] })}
    </Animated.Text>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ stat, index }: { stat: typeof STATS[0]; index: number }) {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, delay: 200 + index * 90, duration: 320, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay: 200 + index * 90, useNativeDriver: true, speed: 16, bounciness: 8 }),
    ]).start();
  }, []);

  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 22 }).start();

  return (
    <Animated.View style={[styles.statCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
      <TouchableOpacity onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1} style={styles.statCardInner}>
        {/* Decorative arc */}
        <View style={[styles.statArc, { backgroundColor: stat.bg }]} />
        <View style={[styles.statIconWrap, { backgroundColor: stat.bg }]}>
          <Ionicons name={stat.icon as any} size={20} color={stat.color} />
        </View>
        <Text style={[styles.statValueNum, { color: stat.color }]}>{stat.prefix}{stat.value}</Text>
        <Text style={styles.statLabel}>{stat.label}</Text>
        {/* Bottom accent line */}
        <View style={[styles.statAccentLine, { backgroundColor: stat.color }]} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, onViewAll }: { title: string; onViewAll: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionAccentBar} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <TouchableOpacity style={styles.viewAllBtn} onPress={onViewAll}>
        <Text style={styles.viewAllText}>View All</Text>
        <Ionicons name="arrow-forward" size={13} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ icon, title, subtitle, ctaLabel, onCta }: {
  icon: string; title: string; subtitle: string; ctaLabel?: string; onCta?: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulse = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.08, useNativeDriver: true, speed: 20, bounciness: 10 }),
      Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 20 }),
    ]).start();
  };

  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name={icon as any} size={40} color={Colors.primaryBorder} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
      {ctaLabel && (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => { pulse(); onCta?.(); }} activeOpacity={0.85}>
            <Ionicons name="add" size={16} color={Colors.white} />
            <Text style={styles.ctaBtnText}>{ctaLabel}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Quick insight row ────────────────────────────────────────────────────────
function InsightRow({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={styles.insightRow}>
      <View style={[styles.insightIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon as any} size={15} color={color} />
      </View>
      <Text style={styles.insightLabel}>{label}</Text>
      <Text style={[styles.insightValue, { color }]}>{value}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function OwnerDashboardScreen() {
  const navigation = useNavigation<any>();
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const headerFade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade,  { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 5 }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>

      {/* ── Branded header ── */}
      <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
        {/* Amber accent bar */}
        <View style={styles.headerAccentBar} />

        <View style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerEyebrow}>WELCOME BACK!</Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => Alert.alert('Notifications')}>
              <Ionicons name="notifications-outline" size={20} color={Colors.charcoal} />
              {/* Amber unread dot */}
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{MOCK_OWNER.initials}</Text>
            </View>
          </View>
        </View>

        {/* Owner role chip */}
        <View style={styles.ownerChip}>
          <View style={styles.ownerChipDot} />
          <Text style={styles.ownerChipText}>{MOCK_OWNER.role}</Text>
        </View>
      </Animated.View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding} showsVerticalScrollIndicator={false}>

        {/* ── Stats 2×2 grid ── */}
        <View style={styles.statsGrid}>
          {STATS.map((stat, i) => <StatCard key={stat.id} stat={stat} index={i} />)}
        </View>

        {/* ── Performance insights card ── */}
        <View style={styles.insightsCard}>
          <View style={styles.insightsHeader}>
            <Ionicons name="trending-up-outline" size={18} color={Colors.primary} />
            <Text style={styles.insightsTitle}>This Month</Text>
          </View>
          <InsightRow icon="eye-outline"      label="Profile Views"    value="—"   color={Colors.info}    />
          <View style={styles.insightDivider} />
          <InsightRow icon="star-outline"     label="Avg. Rating"      value="—"   color={Colors.primary} />
          <View style={styles.insightDivider} />
          <InsightRow icon="people-outline"   label="Repeat Clients"   value="—"   color={Colors.success} />
        </View>

        {/* ── My Venues ── */}
        <View style={styles.section}>
          <SectionHeader title="My Venues" onViewAll={() => Alert.alert('My Venues')} />
          <EmptyState
            icon="business-outline"
            title="No venues yet"
            subtitle="Start by adding your first venue and reach thousands of clients."
            ctaLabel="Add Your First Venue"
            onCta={() => Alert.alert('Add Venue')}
          />
        </View>

        {/* ── Recent Bookings ── */}
        <View style={[styles.section, { marginBottom: 110 }]}>
          <SectionHeader title="Recent Bookings" onViewAll={() => Alert.alert('Bookings')} />
          <EmptyState
            icon="calendar-outline"
            title="No bookings yet"
            subtitle="Bookings will appear here once customers book your venues."
          />
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const STAT_W = (SCREEN_WIDTH - 32 - Spacing.lg * 3) / 2;

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },

  // ── Header ──
  header:         { backgroundColor: Colors.surface, borderBottomLeftRadius: Radii.xxl, borderBottomRightRadius: Radii.xxl, paddingBottom: Spacing.lg, ...Shadows.header },
  headerAccentBar:{ height: 4, backgroundColor: Colors.primary, borderTopLeftRadius: Radii.xxl, borderTopRightRadius: Radii.xxl },
  headerContent:  { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  headerEyebrow:  { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primary, letterSpacing: Typography.wider, marginBottom: Spacing.xxs },
  headerTitle:    { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: Colors.charcoal, letterSpacing: Typography.tight },
  headerRight:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerIconBtn:  { width: 44, height: 44, borderRadius: Radii.md, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  notifDot:       { position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, borderWidth: 1.5, borderColor: Colors.surface },
  avatar:         { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { fontSize: 14, fontWeight: Typography.extraBold, color: Colors.white, letterSpacing: 0.5 },
  ownerChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: Spacing.xl, marginTop: Spacing.sm, alignSelf: 'flex-start', backgroundColor: Colors.primaryLight, paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.primaryBorder },
  ownerChipDot:   { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.primary },
  ownerChipText:  { fontSize: 10, fontWeight: Typography.extraBold, color: Colors.primaryDark, letterSpacing: 1.5 },

  // ── Content ──
  content:        { flex: 1 },
  contentPadding: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },

  // ── Stats ──
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg },
  statCard:       { width: STAT_W, backgroundColor: Colors.surface, borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.card },
  statCardInner:  { padding: Spacing.lg, position: 'relative' },
  statArc:        { position: 'absolute', top: -28, right: -28, width: 80, height: 80, borderRadius: 40, opacity: 0.4 },
  statIconWrap:   { width: 44, height: 44, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  statValueNum:   { fontSize: 30, fontWeight: Typography.extraBold, letterSpacing: -1.5, marginBottom: 2 },
  statLabel:      { fontSize: 11, color: Colors.charcoalLight, fontWeight: Typography.semiBold, letterSpacing: 0.2 },
  statAccentLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderBottomLeftRadius: Radii.xl, borderBottomRightRadius: Radii.xl },

  // ── Insights ──
  insightsCard:   { backgroundColor: Colors.surface, borderRadius: Radii.xl, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.card },
  insightsHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  insightsTitle:  { fontSize: 15, fontWeight: Typography.extraBold, color: Colors.charcoal, letterSpacing: -0.2 },
  insightRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 10 },
  insightIcon:    { width: 32, height: 32, borderRadius: Spacing.sm, alignItems: 'center', justifyContent: 'center' },
  insightLabel:   { flex: 1, fontSize: 13, color: Colors.charcoalMid, fontWeight: Typography.medium },
  insightValue:   { fontSize: 14, fontWeight: Typography.extraBold },
  insightDivider: { height: 1, backgroundColor: Colors.divider },

  // ── Section card ──
  section:        { backgroundColor: Colors.surface, borderRadius: Radii.xl, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.card },
  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sectionTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionAccentBar:{ width: 4, height: 20, backgroundColor: Colors.primary, borderRadius: 2 },
  sectionTitle:   { fontSize: 17, fontWeight: Typography.extraBold, color: Colors.charcoal, letterSpacing: -0.3 },
  viewAllBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText:    { fontSize: 13, fontWeight: Typography.bold, color: Colors.primary },

  // ── Empty state ──
  emptyWrap:      { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyIconCircle:{ width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  emptyTitle:     { fontSize: 16, fontWeight: Typography.bold, color: Colors.charcoal, letterSpacing: -0.2 },
  emptySubtitle:  { fontSize: 13, color: Colors.charcoalLight, textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 },
  ctaBtn:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: 13, borderRadius: Radii.full, marginTop: Spacing.sm, ...Shadows.primary },
  ctaBtnText:     { fontSize: 14, fontWeight: Typography.extraBold, color: Colors.white, letterSpacing: 0.2 },
});
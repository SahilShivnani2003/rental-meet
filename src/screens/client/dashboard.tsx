import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOCK_CLIENT = {
  name: 'Sara',
  fullName: 'Sara Patel',
  role: 'PREMIUM MEMBER',
  initials: 'SP',
};

const STATS = [
  { id: 'total', label: 'Total', value: 12, icon: 'calendar', color: Colors.info, bg: Colors.infoLight },
  { id: 'upcoming', label: 'Upcoming', value: 3, icon: 'time', color: Colors.primary, bg: Colors.primaryLight },
  { id: 'done', label: 'Completed', value: 8, icon: 'checkmark-circle', color: Colors.success, bg: Colors.successLight },
  { id: 'cancel', label: 'Cancelled', value: 1, icon: 'close-circle', color: Colors.danger, bg: Colors.dangerLight },
];

const RECENT_BOOKINGS = [
  { id: '1', venue: 'The Grand Hall', date: 'Mar 20, 2026', time: '10:00 AM – 2:00 PM', amount: 450, status: 'confirmed' },
  { id: '2', venue: 'Studio Loft', date: 'Mar 25, 2026', time: '2:00 PM – 6:00 PM', amount: 175, status: 'pending' },
  { id: '3', venue: 'Rooftop Lounge', date: 'Feb 10, 2026', time: '6:00 PM – 10:00 PM', amount: 300, status: 'completed' },
];

const STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
  confirmed: { color: Colors.success, bg: Colors.successLight, label: 'Confirmed' },
  pending: { color: Colors.warning, bg: Colors.warningLight, label: 'Pending' },
  completed: { color: Colors.info, bg: Colors.infoLight, label: 'Completed' },
  cancelled: { color: Colors.danger, bg: Colors.dangerLight, label: 'Cancelled' },
};

// ─── Animated entrance helper ─────────────────────────────────────────────────
function useEntrance(delay: number) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, delay, duration: 320, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, delay, useNativeDriver: true, speed: 18, bounciness: 7 }),
    ]).start();
  }, []);
  return { fade, slide };
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ stat, index }: { stat: typeof STATS[0]; index: number }) {
  const { fade, slide } = useEntrance(280 + index * 70);
  return (
    <Animated.View style={[styles.statCard, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <View style={[styles.statIconWrap, { backgroundColor: stat.bg }]}>
        <Ionicons name={stat.icon as any} size={18} color={stat.color} />
      </View>
      <Text style={[styles.statNum, { color: stat.color }]}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </Animated.View>
  );
}

// ─── Booking row ──────────────────────────────────────────────────────────────
function BookingRow({ item, index }: { item: typeof RECENT_BOOKINGS[0]; index: number }) {
  const { fade, slide } = useEntrance(500 + index * 80);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const st = STATUS_MAP[item.status] ?? STATUS_MAP.pending;

  return (
    <Animated.View style={[{ opacity: fade, transform: [{ translateY: slide }] }]}>
      <TouchableOpacity
        style={styles.bookingRow}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 22 }).start()}
        activeOpacity={1}
      >
        {/* Status accent */}
        <View style={[styles.bookingAccent, { backgroundColor: st.color }]} />

        <View style={styles.bookingBody}>
          <View style={styles.bookingTop}>
            <Text style={styles.bookingVenue} numberOfLines={1}>{item.venue}</Text>
            <View style={[styles.statusChip, { backgroundColor: st.bg }]}>
              <Text style={[styles.statusChipText, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>
          <View style={styles.bookingMeta}>
            <View style={styles.bookingMetaItem}>
              <Ionicons name="calendar-outline" size={12} color={Colors.charcoalLight} />
              <Text style={styles.bookingMetaText}>{item.date}</Text>
            </View>
            <View style={styles.bookingMetaItem}>
              <Ionicons name="time-outline" size={12} color={Colors.charcoalLight} />
              <Text style={styles.bookingMetaText}>{item.time}</Text>
            </View>
          </View>
          <Text style={styles.bookingAmount}>${item.amount}</Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color={Colors.border} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ClientDashboardScreen() {
  const navigation = useNavigation<any>();
  const headerFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(heroSlide, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 6 }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: heroSlide }] }]}>
          <View style={styles.headerAccentBar} />
          <View style={styles.headerContent}>
            {/* Left: greeting */}
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>CUSTOMER PORTAL</Text>
              <Text style={styles.greeting}>
                Hello, <Text style={styles.greetingName}>{MOCK_CLIENT.name}</Text> 👋
              </Text>
              {/* Member badge */}
              <View style={styles.memberBadge}>
                <View style={styles.memberDot} />
                <Text style={styles.memberText}>{MOCK_CLIENT.role}</Text>
              </View>
            </View>

            {/* Right: icons + avatar */}
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('messages')}>
                <Ionicons name="chatbubble-outline" size={19} color={Colors.charcoalMid} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="notifications-outline" size={19} color={Colors.charcoalMid} />
                <View style={styles.notifDot} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('profile')}>
                <Text style={styles.avatarText}>{MOCK_CLIENT.initials}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* ── Stats row ──────────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          {STATS.map((s, i) => <StatCard key={s.id} stat={s} index={i} />)}
        </View>

        {/* ── Browse venues CTA banner ───────────────────────────────────────── */}
        <Animated.View style={[styles.ctaBanner, { opacity: headerFade }]}>
          <View style={styles.ctaBannerLeft}>
            <Ionicons name="location" size={18} color={Colors.primary} style={{ marginBottom: 4 }} />
            <Text style={styles.ctaBannerTitle}>Find your next space</Text>
            <Text style={styles.ctaBannerSub}>Hundreds of premium venues near you</Text>
          </View>
          <TouchableOpacity style={styles.ctaBannerBtn} onPress={() => navigation.navigate('home')} activeOpacity={0.85}>
            <Ionicons name="search" size={16} color={Colors.white} />
            <Text style={styles.ctaBannerBtnText}>Browse</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Quick actions row ──────────────────────────────────────────────── */}
        <Animated.View style={[styles.quickSection, { opacity: headerFade }]}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickRow}>

            <TouchableOpacity style={[styles.quickTile, { backgroundColor: Colors.charcoal }]} onPress={() => navigation.navigate('bookings')} activeOpacity={0.85}>
              <View style={[styles.quickTileIcon, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <Ionicons name="calendar" size={20} color={Colors.white} />
              </View>
              <Text style={styles.quickTileLabel}>My Bookings</Text>
              <Text style={styles.quickTileSub}>View & manage</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickTile, { backgroundColor: Colors.primary }]} onPress={() => navigation.navigate('home')} activeOpacity={0.85}>
              <View style={[styles.quickTileIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="search" size={20} color={Colors.white} />
              </View>
              <Text style={styles.quickTileLabel}>Browse Venues</Text>
              <Text style={styles.quickTileSub}>Find a space</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickTile, { backgroundColor: '#E11D48' }]} onPress={() => navigation.navigate('favorites')} activeOpacity={0.85}>
              <View style={[styles.quickTileIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <Ionicons name="heart" size={20} color={Colors.white} />
              </View>
              <Text style={styles.quickTileLabel}>Saved</Text>
              <Text style={styles.quickTileSub}>Your favourites</Text>
            </TouchableOpacity>

          </View>
        </Animated.View>

        {/* ── Recent Bookings ────────────────────────────────────────────────── */}
        <Animated.View style={[styles.section, { opacity: headerFade }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Recent Bookings</Text>
            </View>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('bookings')}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="arrow-forward" size={13} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Booking rows */}
          <View style={styles.bookingList}>
            {RECENT_BOOKINGS.map((b, i) => (
              <View key={b.id}>
                <BookingRow item={b} index={i} />
                {i < RECENT_BOOKINGS.length - 1 && <View style={styles.bookingDivider} />}
              </View>
            ))}
          </View>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const STAT_W = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 3) / 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 110 },

  // ── Header ──
  header: { backgroundColor: Colors.surface, borderBottomLeftRadius: Radii.xxl, borderBottomRightRadius: Radii.xxl, paddingBottom: Spacing.xl, ...Shadows.header },
  headerAccentBar: { height: 4, backgroundColor: Colors.primary },
  headerContent: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  eyebrow: { fontSize: 9, fontWeight: Typography.bold, color: Colors.primary, letterSpacing: 2.5, marginBottom: 4 },
  greeting: { fontSize: 22, fontWeight: Typography.extraBold, color: Colors.charcoal, letterSpacing: -0.4, marginBottom: Spacing.sm },
  greetingName: { color: Colors.primary },
  memberBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.primaryBorder },
  memberDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  memberText: { fontSize: 9, fontWeight: Typography.extraBold, color: Colors.primaryDark, letterSpacing: 1.2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  iconBtn: { width: 38, height: 38, borderRadius: Radii.md, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.primary, borderWidth: 1.5, borderColor: Colors.surface },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.charcoal, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  avatarText: { fontSize: 13, fontWeight: Typography.extraBold, color: Colors.white, letterSpacing: 0.5 },

  // ── Stats ──
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: { width: STAT_W, backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: 10, alignItems: 'center', gap: 4, ...Shadows.card },
  statIconWrap: { width: 34, height: 34, borderRadius: Spacing.md, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statNum: { fontSize: 20, fontWeight: Typography.extraBold, letterSpacing: -1 },
  statLabel: { fontSize: 9.5, color: Colors.charcoalLight, fontWeight: Typography.semiBold, textAlign: 'center' },

  // ── CTA banner ──
  ctaBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.lg, backgroundColor: Colors.charcoal, borderRadius: Radii.xl, padding: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.lg, ...Shadows.floating },
  ctaBannerLeft: { flex: 1 },
  ctaBannerTitle: { fontSize: 16, fontWeight: Typography.extraBold, color: Colors.white, letterSpacing: -0.3, marginBottom: 3 },
  ctaBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 17 },
  ctaBannerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: 11, borderRadius: Radii.full, ...Shadows.primary },
  ctaBannerBtnText: { fontSize: 13, fontWeight: Typography.extraBold, color: Colors.white, letterSpacing: 0.3 },

  // ── Quick actions ──
  quickSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  quickRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  quickTile: { flex: 1, borderRadius: Radii.xl, padding: Spacing.md, minHeight: 120, justifyContent: 'flex-end', ...Shadows.card },
  quickTileIcon: { width: 40, height: 40, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', marginBottom: 'auto', marginTop: 0 },
  quickTileLabel: { fontSize: 12, fontWeight: Typography.extraBold, color: Colors.white, letterSpacing: -0.2, marginTop: Spacing.md, marginBottom: 2 },
  quickTileSub: { fontSize: 9.5, color: 'rgba(255,255,255,0.68)', fontWeight: Typography.medium },

  // ── Section ──
  section: { backgroundColor: Colors.surface, borderRadius: Radii.xl, marginHorizontal: Spacing.lg, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.card },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionAccent: { width: 4, height: 20, backgroundColor: Colors.primary, borderRadius: 2 },
  sectionTitle: { fontSize: 17, fontWeight: Typography.extraBold, color: Colors.charcoal, letterSpacing: -0.3, marginBottom: Spacing.sm },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  viewAllText: { fontSize: 13, fontWeight: Typography.bold, color: Colors.primary },

  // ── Booking rows ──
  bookingList: { gap: 0 },
  bookingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.sm },
  bookingAccent: { width: 3, height: 56, borderRadius: 2 },
  bookingBody: { flex: 1 },
  bookingTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  bookingVenue: { fontSize: 14, fontWeight: Typography.bold, color: Colors.charcoal, flex: 1, marginRight: Spacing.sm },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full },
  statusChipText: { fontSize: 10, fontWeight: Typography.bold, letterSpacing: 0.3 },
  bookingMeta: { flexDirection: 'row', gap: Spacing.md, marginBottom: 4 },
  bookingMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bookingMetaText: { fontSize: 11, color: Colors.charcoalLight, fontWeight: Typography.medium },
  bookingAmount: { fontSize: 15, fontWeight: Typography.extraBold, color: Colors.primary },
  bookingDivider: { height: 1, backgroundColor: Colors.background, marginLeft: 15 },
});
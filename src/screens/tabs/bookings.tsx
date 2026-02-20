import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows, StatusConfig } from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Data ─────────────────────────────────────────────────────────────────────
const STATIC_BOOKINGS = [
  { id: '1', venueName: 'The Grand Hall', status: 'confirmed', startDate: '2026-03-15T10:00:00', endDate: '2026-03-15T14:00:00', totalAmount: 450, notes: 'Please set up chairs in a U-shape configuration.' },
  { id: '2', venueName: 'Rooftop Lounge', status: 'pending', startDate: '2026-03-20T18:00:00', endDate: '2026-03-20T22:00:00', totalAmount: 300, notes: null },
  { id: '3', venueName: 'Downtown Conference Center', status: 'completed', startDate: '2026-02-10T09:00:00', endDate: '2026-02-10T17:00:00', totalAmount: 800, notes: 'Annual team offsite.' },
  { id: '4', venueName: 'Lakeside Pavilion', status: 'cancelled', startDate: '2026-02-28T12:00:00', endDate: '2026-02-28T16:00:00', totalAmount: 200, notes: null },
  { id: '5', venueName: 'Studio Loft', status: 'pending', startDate: '2026-03-25T14:00:00', endDate: '2026-03-25T18:00:00', totalAmount: 175, notes: 'Photography session — need blackout curtains.' },
];

const MOCK_USER = { userType: 'owner' };
const TABS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

// ─── Booking card ──────────────────────────────────────────────────────────────
function BookingCard({
  booking, userType, onStatusUpdate, index,
}: {
  booking: any; userType: string; onStatusUpdate: (id: string, status: string) => void; index: number;
}) {
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, delay: index * 60, useNativeDriver: true, speed: 18, bounciness: 6 }),
      Animated.timing(opacityAnim, { toValue: 1, delay: index * 60, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const cfg = StatusConfig[booking.status] ?? { color: Colors.charcoalLight, bg: Colors.border, icon: 'ellipse', label: booking.status };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const hours = Math.round((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / 3_600_000);

  return (
    <Animated.View style={[styles.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.cardAccentBar, { backgroundColor: cfg.color }]} />
      <View style={styles.cardBody}>
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardVenueName} numberOfLines={1}>{booking.venueName}</Text>
            <Text style={styles.cardDate}>{formatDate(booking.startDate)}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
            <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Chips */}
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Ionicons name="time-outline" size={13} color={Colors.charcoalLight} />
            <Text style={styles.chipText}>{formatTime(booking.startDate)} – {formatTime(booking.endDate)}</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="hourglass-outline" size={13} color={Colors.charcoalLight} />
            <Text style={styles.chipText}>{hours}h</Text>
          </View>
          <View style={[styles.chip, styles.amountChip]}>
            <Text style={styles.amountText}>${booking.totalAmount}</Text>
          </View>
        </View>

        {/* Notes */}
        {booking.notes && (
          <View style={styles.notesBox}>
            <View style={styles.notesIconRow}>
              <Ionicons name="document-text-outline" size={13} color={Colors.primary} />
              <Text style={styles.notesLabel}>Note</Text>
            </View>
            <Text style={styles.notesText}>{booking.notes}</Text>
          </View>
        )}

        {/* Owner actions */}
        {userType === 'owner' && booking.status === 'pending' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnConfirm]} onPress={() => onStatusUpdate(booking.id, 'confirmed')} activeOpacity={0.8}>
              <Ionicons name="checkmark" size={15} color={Colors.white} />
              <Text style={styles.actionBtnText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnReject]} onPress={() => onStatusUpdate(booking.id, 'cancelled')} activeOpacity={0.8}>
              <Ionicons name="close" size={15} color={Colors.danger} />
              <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Client actions */}
        {userType === 'client' && booking.status === 'pending' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnReject, { flex: 1 }]} onPress={() => onStatusUpdate(booking.id, 'cancelled')} activeOpacity={0.8}>
              <Ionicons name="close" size={15} color={Colors.danger} />
              <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Cancel Booking</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function BookingsScreen() {
  const user = MOCK_USER;
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setBookings(STATIC_BOOKINGS);
    } catch {
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    Alert.alert('Updated', `Booking marked as ${status}.`);
  };

  const filtered = bookings.filter((b) => activeTab === 'all' || b.status === activeTab);
  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'all' ? bookings.length : bookings.filter((b) => b.status === t).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerAccentBar} />
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerEyebrow}>OVERVIEW</Text>
            <Text style={styles.headerTitle}>My Bookings</Text>
          </View>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeNum}>{bookings.length}</Text>
            <Text style={styles.totalBadgeLabel}>Total</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryStrip}>
          {Object.entries(StatusConfig).map(([key, cfg]) => (
            <View key={key} style={[styles.summaryChip, { backgroundColor: cfg.bg }]}>
              <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
              <Text style={[styles.summaryChipText, { color: cfg.color }]}>{counts[key] ?? 0} {cfg.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* ── Filter tabs ── */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            const cfg = StatusConfig[tab];
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.75}
              >
                {cfg && <View style={[styles.tabDot, { backgroundColor: isActive ? Colors.white : cfg.color }]} />}
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab === 'all' ? 'All' : StatusConfig[tab]?.label ?? tab}
                </Text>
                {counts[tab] > 0 && (
                  <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                    <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>{counts[tab]}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPadding}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} tintColor={Colors.primary} />}
      >
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>Loading bookings...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="calendar-outline" size={40} color={Colors.primaryBorder} />
            </View>
            <Text style={styles.emptyTitle}>No bookings here</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'all' ? 'Your bookings will appear here.' : `No ${activeTab} bookings found.`}
            </Text>
          </View>
        ) : (
          filtered.map((booking, index) => (
            <BookingCard key={booking.id} booking={booking} userType={user.userType} onStatusUpdate={handleStatusUpdate} index={index} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: { backgroundColor: Colors.surface, borderBottomLeftRadius: Radii.xxl, borderBottomRightRadius: Radii.xxl, ...Shadows.header, paddingBottom: Spacing.lg },
  headerAccentBar: { height: 4, backgroundColor: Colors.primary },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  headerEyebrow: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primary, letterSpacing: Typography.wider, marginBottom: Spacing.xxs },
  headerTitle: { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: Colors.charcoal, letterSpacing: Typography.tight },
  totalBadge: { backgroundColor: Colors.primaryLight, borderRadius: Radii.lg, paddingHorizontal: Spacing.lg, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.primaryBorder },
  totalBadgeNum: { fontSize: 22, fontWeight: Typography.extraBold, color: Colors.primary, lineHeight: 26 },
  totalBadgeLabel: { fontSize: 10, fontWeight: Typography.bold, color: Colors.primaryDark, letterSpacing: 0.5, textTransform: 'uppercase' },
  summaryStrip: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  summaryChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radii.full },
  summaryChipText: { fontSize: Typography.sm, fontWeight: Typography.bold, letterSpacing: Typography.normal },

  // Filter tabs
  tabsWrapper: { paddingVertical: 14 },
  tabsContainer: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: Spacing.sm, borderRadius: Radii.full, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, gap: Spacing.xs },
  tabActive: { backgroundColor: Colors.charcoal, borderColor: Colors.charcoal },
  tabDot: { width: 6, height: 6, borderRadius: 3 },
  tabText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.charcoalMid, letterSpacing: Typography.normal },
  tabTextActive: { color: Colors.white },
  tabCount: { backgroundColor: Colors.border, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: 'center' },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabCountText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.charcoalLight },
  tabCountTextActive: { color: Colors.white },

  // Content
  content: { flex: 1 },
  contentPadding: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: 110 },

  // Card
  card: { backgroundColor: Colors.surface, borderRadius: Radii.xl, marginBottom: 14, flexDirection: 'row', overflow: 'hidden', ...Shadows.card },
  cardAccentBar: { width: 4, borderTopLeftRadius: Radii.xl, borderBottomLeftRadius: Radii.xl },
  cardBody: { flex: 1, padding: Spacing.lg },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: Spacing.md },
  cardVenueName: { fontSize: Typography.lg, fontWeight: Typography.extraBold, color: Colors.charcoal, letterSpacing: -0.3, marginBottom: 3 },
  cardDate: { fontSize: 12, color: Colors.charcoalLight, fontWeight: Typography.medium },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radii.full },
  statusPillText: { fontSize: Typography.sm, fontWeight: Typography.bold, letterSpacing: Typography.normal },

  // Divider
  divider: { height: 1, backgroundColor: Colors.divider, marginBottom: Spacing.md },

  // Chips
  chipsRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.background, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radii.sm },
  chipText: { fontSize: 12, color: Colors.charcoalMid, fontWeight: Typography.semiBold },
  amountChip: { backgroundColor: Colors.primaryLight, marginLeft: 'auto' },
  amountText: { fontSize: Typography.md, fontWeight: Typography.extraBold, color: Colors.primaryDark },

  // Notes
  notesBox: { backgroundColor: Colors.background, borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  notesIconRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  notesLabel: { fontSize: 10, fontWeight: Typography.bold, color: Colors.primary, letterSpacing: 0.8, textTransform: 'uppercase' },
  notesText: { fontSize: Typography.base, color: Colors.charcoalMid, lineHeight: 19 },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: Spacing.xxs },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: Radii.md, gap: 6 },
  actionBtnConfirm: { backgroundColor: Colors.success },
  actionBtnReject: { backgroundColor: Colors.dangerLight, borderWidth: 1, borderColor: '#FECACA' },
  actionBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.white, letterSpacing: Typography.normal },

  // Loader / Empty
  loaderWrap: { alignItems: 'center', paddingTop: 64, gap: 12 },
  loaderText: { fontSize: Typography.md, color: Colors.charcoalLight, fontWeight: Typography.medium },
  emptyWrap: { alignItems: 'center', paddingTop: 72, gap: 12 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xxs },
  emptyTitle: { fontSize: 18, fontWeight: Typography.extraBold, color: Colors.charcoal, letterSpacing: -0.3 },
  emptySubtitle: { fontSize: Typography.md, color: Colors.charcoalLight, textAlign: 'center', paddingHorizontal: 32 },
});
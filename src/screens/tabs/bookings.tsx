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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Data ────────────────────────────────────────────────────────────────────
const STATIC_BOOKINGS = [
  {
    id: '1',
    venueName: 'The Grand Hall',
    status: 'confirmed',
    startDate: '2026-03-15T10:00:00',
    endDate: '2026-03-15T14:00:00',
    totalAmount: 450,
    notes: 'Please set up chairs in a U-shape configuration.',
  },
  {
    id: '2',
    venueName: 'Rooftop Lounge',
    status: 'pending',
    startDate: '2026-03-20T18:00:00',
    endDate: '2026-03-20T22:00:00',
    totalAmount: 300,
    notes: null,
  },
  {
    id: '3',
    venueName: 'Downtown Conference Center',
    status: 'completed',
    startDate: '2026-02-10T09:00:00',
    endDate: '2026-02-10T17:00:00',
    totalAmount: 800,
    notes: 'Annual team offsite.',
  },
  {
    id: '4',
    venueName: 'Lakeside Pavilion',
    status: 'cancelled',
    startDate: '2026-02-28T12:00:00',
    endDate: '2026-02-28T16:00:00',
    totalAmount: 200,
    notes: null,
  },
  {
    id: '5',
    venueName: 'Studio Loft',
    status: 'pending',
    startDate: '2026-03-25T14:00:00',
    endDate: '2026-03-25T18:00:00',
    totalAmount: 175,
    notes: 'Photography session — need blackout curtains.',
  },
];

const MOCK_USER = { userType: 'owner' };

const TABS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  confirmed: { color: '#16A34A', bg: '#DCFCE7', icon: 'checkmark-circle',    label: 'Confirmed' },
  pending:   { color: '#D97706', bg: '#FEF3C7', icon: 'time',                label: 'Pending'   },
  cancelled: { color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle',        label: 'Cancelled' },
  completed: { color: '#2563EB', bg: '#DBEAFE', icon: 'checkmark-done-circle', label: 'Completed' },
};

// ─── Animated booking card ────────────────────────────────────────────────────
function BookingCard({
  booking,
  userType,
  onStatusUpdate,
  index,
}: {
  booking: any;
  userType: string;
  onStatusUpdate: (id: string, status: string) => void;
  index: number;
}) {
  const scaleAnim   = useRef(new Animated.Value(0.96)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 60,
        useNativeDriver: true,
        speed: 18,
        bounciness: 6,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        delay: index * 60,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const cfg = STATUS_CONFIG[booking.status] ?? { color: '#999', bg: '#F3F4F6', icon: 'ellipse', label: booking.status };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const hours = Math.round(
    (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / 3_600_000
  );

  return (
    <Animated.View
      style={[
        styles.card,
        { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* Left accent bar */}
      <View style={[styles.cardAccentBar, { backgroundColor: cfg.color }]} />

      <View style={styles.cardBody}>
        {/* ── Top row ── */}
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardVenueName} numberOfLines={1}>{booking.venueName}</Text>
            <Text style={styles.cardDate}>{formatDate(booking.startDate)}</Text>
          </View>

          {/* Status pill */}
          <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
            <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── Detail chips row ── */}
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Ionicons name="time-outline" size={13} color="#888" />
            <Text style={styles.chipText}>
              {formatTime(booking.startDate)} – {formatTime(booking.endDate)}
            </Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="hourglass-outline" size={13} color="#888" />
            <Text style={styles.chipText}>{hours}h</Text>
          </View>
          <View style={[styles.chip, styles.amountChip]}>
            <Text style={styles.amountText}>${booking.totalAmount}</Text>
          </View>
        </View>

        {/* ── Notes ── */}
        {booking.notes && (
          <View style={styles.notesBox}>
            <View style={styles.notesIconRow}>
              <Ionicons name="document-text-outline" size={13} color="#FF6B35" />
              <Text style={styles.notesLabel}>Note</Text>
            </View>
            <Text style={styles.notesText}>{booking.notes}</Text>
          </View>
        )}

        {/* ── Owner actions (pending) ── */}
        {userType === 'owner' && booking.status === 'pending' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnConfirm]}
              onPress={() => onStatusUpdate(booking.id, 'confirmed')}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={15} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnReject]}
              onPress={() => onStatusUpdate(booking.id, 'cancelled')}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={15} color="#DC2626" />
              <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Client actions (pending) ── */}
        {userType === 'client' && booking.status === 'pending' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnReject, { flex: 1 }]}
              onPress={() => onStatusUpdate(booking.id, 'cancelled')}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={15} color="#DC2626" />
              <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Cancel Booking</Text>
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
  const [bookings, setBookings]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
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

  const onRefresh = () => { setRefreshing(true); fetchBookings(); };

  const handleStatusUpdate = async (id: string, status: string) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    Alert.alert('Updated', `Booking marked as ${status}.`);
  };

  const filtered = bookings.filter((b) => activeTab === 'all' || b.status === activeTab);

  // Summary counts
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

        {/* ── Summary strip ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryStrip}
        >
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <View key={key} style={[styles.summaryChip, { backgroundColor: cfg.bg }]}>
              <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
              <Text style={[styles.summaryChipText, { color: cfg.color }]}>
                {counts[key] ?? 0} {cfg.label}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* ── Filter tabs ── */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            const cfg = STATUS_CONFIG[tab];
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.75}
              >
                {cfg && (
                  <View style={[styles.tabDot, { backgroundColor: isActive ? '#FFFFFF' : cfg.color }]} />
                )}
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab === 'all' ? 'All' : STATUS_CONFIG[tab]?.label ?? tab}
                </Text>
                {counts[tab] > 0 && (
                  <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                    <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                      {counts[tab]}
                    </Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loaderText}>Loading bookings...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="calendar-outline" size={40} color="#D0D0D0" />
            </View>
            <Text style={styles.emptyTitle}>No bookings here</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'all' ? 'Your bookings will appear here.' : `No ${activeTab} bookings found.`}
            </Text>
          </View>
        ) : (
          filtered.map((booking, index) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              userType={user.userType}
              onStatusUpdate={handleStatusUpdate}
              index={index}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F0',
  },

  // ── Header ──
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 6,
    paddingBottom: 16,
  },
  headerAccentBar: {
    height: 4,
    backgroundColor: '#FF6B35',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B35',
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  totalBadge: {
    backgroundColor: '#FFF0EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFD6C2',
  },
  totalBadgeNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FF6B35',
    lineHeight: 26,
  },
  totalBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6B35',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summaryStrip: {
    paddingHorizontal: 20,
    gap: 8,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  summaryChipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Filter tabs ──
  tabsWrapper: {
    paddingVertical: 14,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDECE8',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabCount: {
    backgroundColor: '#F0EEE8',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  tabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
  },
  tabCountTextActive: {
    color: '#FFFFFF',
  },

  // ── Content ──
  content: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
  },

  // ── Card ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  cardAccentBar: {
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  cardBody: {
    flex: 1,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  cardVenueName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  cardDate: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: '#F0EEE8',
    marginBottom: 12,
  },

  // ── Chips ──
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F5F4F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  chipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  amountChip: {
    backgroundColor: '#FFF0EB',
    marginLeft: 'auto',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF6B35',
  },

  // ── Notes ──
  notesBox: {
    backgroundColor: '#F5F4F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  notesIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6B35',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
  },

  // ── Actions ──
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnConfirm: {
    backgroundColor: '#16A34A',
  },
  actionBtnReject: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // ── Loader / Empty ──
  loaderWrap: {
    alignItems: 'center',
    paddingTop: 64,
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 72,
    gap: 12,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F5F4F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#AAA',
    fontWeight: '400',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
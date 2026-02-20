import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme/theme';

const CONVERSATIONS = [
  { id: '1', name: 'John Doe',    initials: 'JD', role: 'Venue Enquiry',      lastMessage: 'Is the venue available on Friday?',       time: '2h ago', unread: 2, online: true  },
  { id: '2', name: 'Jane Smith',  initials: 'JS', role: 'Booking Confirmed',   lastMessage: 'Thank you for the booking confirmation!',   time: '5h ago', unread: 0, online: true  },
  { id: '3', name: 'Mark Rivera', initials: 'MR', role: 'Pricing Query',       lastMessage: 'Can we negotiate the weekend rate?',        time: '1d ago', unread: 0, online: false },
  { id: '4', name: 'Sara Patel',  initials: 'SP', role: 'Venue Enquiry',       lastMessage: 'Does the hall have AV equipment?',          time: '2d ago', unread: 1, online: false },
];

// Avatar palette — brand amber + charcoal + semantic colors
const AVATAR_COLORS = [Colors.primary, Colors.charcoal, Colors.primaryDark, Colors.info];

// ─── Animated conversation row ────────────────────────────────────────────────
function ConversationRow({
  item, index, colorIndex,
}: {
  item: typeof CONVERSATIONS[0]; index: number; colorIndex: number;
}) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, delay: index * 65, duration: 280, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay: index * 65, useNativeDriver: true, speed: 20, bounciness: 4 }),
    ]).start();
  }, []);

  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 22 }).start();

  const avatarColor = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.row, item.unread > 0 && styles.rowUnread]}
        onPress={() => console.log(`Open conversation ${item.id}`)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {/* Avatar + online dot */}
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarInitials}>{item.initials}</Text>
          </View>
          {item.online && <View style={styles.onlineDot} />}
        </View>

        {/* Content */}
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={[styles.rowName, item.unread > 0 && styles.rowNameUnread]}>{item.name}</Text>
            <Text style={styles.rowTime}>{item.time}</Text>
          </View>
          <View style={styles.rowBottom}>
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>{item.role}</Text>
            </View>
          </View>
          <Text style={[styles.rowMessage, item.unread > 0 && styles.rowMessageUnread]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>

        {/* Unread badge / read tick */}
        {item.unread > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread}</Text>
          </View>
        ) : (
          <Ionicons name="checkmark-done" size={16} color={Colors.border} style={{ marginLeft: 8 }} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function MessagesScreen() {
  const [conversations] = useState(CONVERSATIONS);
  const [search, setSearch]   = useState('');

  const filtered = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerAccentBar} />
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerEyebrow}>INBOX</Text>
            <Text style={styles.headerTitle}>Messages</Text>
          </View>
          {/* Unread badge — consistent with Bookings & Favorites totalBadge */}
          {totalUnread > 0 && (
            <View style={styles.unreadTotalBadge}>
              <Text style={styles.unreadTotalNum}>{totalUnread}</Text>
              <Text style={styles.unreadTotalLabel}>Unread</Text>
            </View>
          )}
        </View>

        {/* Search row */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color={Colors.charcoalLight} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages..."
              placeholderTextColor={Colors.charcoalLight}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={Colors.border} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.composeBtn}>
            <Ionicons name="create-outline" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── List ── */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="chatbubbles-outline" size={44} color={Colors.primaryBorder} />
            </View>
            <Text style={styles.emptyTitle}>{search ? 'No results found' : 'No messages yet'}</Text>
            <Text style={styles.emptySubtitle}>
              {search ? `Nothing matched "${search}"` : 'Your conversations will appear here'}
            </Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {filtered.map((item, index) => (
              <View key={item.id}>
                <ConversationRow item={item} index={index} colorIndex={index} />
                {index < filtered.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header:             { backgroundColor: Colors.surface, borderBottomLeftRadius: Radii.xxl, borderBottomRightRadius: Radii.xxl, paddingBottom: Spacing.xl, ...Shadows.header },
  headerAccentBar:    { height: 4, backgroundColor: Colors.primary },
  headerContent:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  headerEyebrow:      { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primary, letterSpacing: Typography.wider, marginBottom: Spacing.xxs },
  headerTitle:        { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: Colors.charcoal, letterSpacing: Typography.tight },

  // Unread total badge — same structure as Bookings totalBadge & Favorites countBadge
  unreadTotalBadge:   { backgroundColor: Colors.primaryLight, borderRadius: Radii.lg, paddingHorizontal: Spacing.lg, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.primaryBorder },
  unreadTotalNum:     { fontSize: 22, fontWeight: Typography.extraBold, color: Colors.primary, lineHeight: 26 },
  unreadTotalLabel:   { fontSize: 10, fontWeight: Typography.bold, color: Colors.primaryDark, letterSpacing: 0.5, textTransform: 'uppercase' },

  // Search row
  searchRow:          { flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: 10, alignItems: 'center' },
  searchContainer:    { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: Radii.md, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: Colors.border },
  searchInput:        { flex: 1, fontSize: Typography.md, color: Colors.charcoal },
  composeBtn:         { width: 46, height: 46, borderRadius: Radii.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.primary },

  // Content
  content:            { flex: 1 },
  contentPadding:     { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: 110 },

  // List card
  listCard:           { backgroundColor: Colors.surface, borderRadius: Radii.xl, ...Shadows.card },
  rowDivider:         { height: 1, backgroundColor: Colors.background, marginLeft: 80 },

  // Row
  row:                { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 14, borderRadius: Radii.xl },
  rowUnread:          { backgroundColor: '#FEFBF3' }, // warm amber tint for unread rows

  // Avatar
  avatarWrapper:      { position: 'relative', marginRight: 14 },
  avatar:             { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarInitials:     { fontSize: 16, fontWeight: Typography.extraBold, color: Colors.white, letterSpacing: 0.5 },
  onlineDot:          { position: 'absolute', bottom: 2, right: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success, borderWidth: 2, borderColor: Colors.surface },

  // Row content
  rowContent:         { flex: 1 },
  rowTop:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xxs },
  rowName:            { fontSize: 15, fontWeight: Typography.semiBold, color: Colors.charcoalMid, letterSpacing: 0.1 },
  rowNameUnread:      { fontWeight: Typography.extraBold, color: Colors.charcoal },
  rowTime:            { fontSize: Typography.sm, color: Colors.border, fontWeight: Typography.medium },
  rowBottom:          { flexDirection: 'row', marginBottom: Spacing.xxs },

  // Role chip — warm background from theme
  roleChip:           { backgroundColor: Colors.background, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Spacing.sm },
  roleChipText:       { fontSize: 10, fontWeight: Typography.semiBold, color: Colors.charcoalLight, letterSpacing: 0.3 },
  rowMessage:         { fontSize: Typography.base, color: Colors.border, fontWeight: Typography.regular },
  rowMessageUnread:   { color: Colors.charcoalMid, fontWeight: Typography.semiBold },

  // Unread badge — amber primary
  unreadBadge:        { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 10, shadowColor: Colors.primaryDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 3 },
  unreadText:         { fontSize: Typography.sm, color: Colors.white, fontWeight: Typography.extraBold },

  // Empty state
  emptyWrap:          { alignItems: 'center', paddingTop: 72, gap: 12 },
  emptyIconWrap:      { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xxs },
  emptyTitle:         { fontSize: Typography.xl, fontWeight: Typography.extraBold, color: Colors.charcoal, letterSpacing: -0.3 },
  emptySubtitle:      { fontSize: Typography.md, color: Colors.charcoalLight, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
});
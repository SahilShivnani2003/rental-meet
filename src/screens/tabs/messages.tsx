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

const CONVERSATIONS = [
  {
    id: '1',
    name: 'John Doe',
    initials: 'JD',
    role: 'Venue Enquiry',
    lastMessage: 'Is the venue available on Friday?',
    time: '2h ago',
    unread: 2,
    online: true,
  },
  {
    id: '2',
    name: 'Jane Smith',
    initials: 'JS',
    role: 'Booking Confirmed',
    lastMessage: 'Thank you for the booking confirmation!',
    time: '5h ago',
    unread: 0,
    online: true,
  },
  {
    id: '3',
    name: 'Mark Rivera',
    initials: 'MR',
    role: 'Pricing Query',
    lastMessage: 'Can we negotiate the weekend rate?',
    time: '1d ago',
    unread: 0,
    online: false,
  },
  {
    id: '4',
    name: 'Sara Patel',
    initials: 'SP',
    role: 'Venue Enquiry',
    lastMessage: 'Does the hall have AV equipment?',
    time: '2d ago',
    unread: 1,
    online: false,
  },
];

// Avatar colors cycling through warm palette
const AVATAR_COLORS = ['#FF6B35', '#1A1A1A', '#D97706', '#2563EB'];

// ─── Animated conversation row ────────────────────────────────────────────────
function ConversationRow({
  item,
  index,
  colorIndex,
}: {
  item: typeof CONVERSATIONS[0];
  index: number;
  colorIndex: number;
}) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        delay: index * 65,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay: index * 65,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }),
    ]).start();
  }, []);

  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 22 }).start();

  const avatarColor = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        style={[styles.row, item.unread > 0 && styles.rowUnread]}
        onPress={() => console.log(`Open conversation ${item.id}`)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {/* Avatar with online dot */}
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarInitials}>{item.initials}</Text>
          </View>
          {item.online && <View style={styles.onlineDot} />}
        </View>

        {/* Content */}
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={[styles.rowName, item.unread > 0 && styles.rowNameUnread]}>
              {item.name}
            </Text>
            <Text style={styles.rowTime}>{item.time}</Text>
          </View>
          <View style={styles.rowBottom}>
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>{item.role}</Text>
            </View>
          </View>
          <Text
            style={[styles.rowMessage, item.unread > 0 && styles.rowMessageUnread]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>

        {/* Unread badge */}
        {item.unread > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread}</Text>
          </View>
        ) : (
          <Ionicons name="checkmark-done" size={16} color="#C0C0C0" style={{ marginLeft: 8 }} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function MessagesScreen() {
  const [conversations] = useState(CONVERSATIONS);
  const [search, setSearch] = useState('');

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
          {totalUnread > 0 && (
            <View style={styles.unreadTotalBadge}>
              <Text style={styles.unreadTotalNum}>{totalUnread}</Text>
              <Text style={styles.unreadTotalLabel}>Unread</Text>
            </View>
          )}
        </View>

        {/* Search bar inside header */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color="#AAA" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages..."
              placeholderTextColor="#BBB"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color="#CCC" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.composeBtn}>
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── List ── */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPadding}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="chatbubbles-outline" size={44} color="#D0D0D0" />
            </View>
            <Text style={styles.emptyTitle}>
              {search ? 'No results found' : 'No messages yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {search
                ? `Nothing matched "${search}"`
                : 'Your conversations will appear here'}
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
  container: { flex: 1, backgroundColor: '#F5F4F0' },

  // ── Header ──
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 20,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 6,
  },
  headerAccentBar: { height: 4, backgroundColor: '#FF6B35' },
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
  unreadTotalBadge: {
    backgroundColor: '#FFF0EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFD6C2',
  },
  unreadTotalNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FF6B35',
    lineHeight: 26,
  },
  unreadTotalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6B35',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── Search ──
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F4F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#EDECE8',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },
  composeBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },

  // ── Content ──
  content: { flex: 1 },
  contentPadding: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 110 },

  // ── List card ──
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F5F4F0',
    marginLeft: 80,
  },

  // ── Row ──
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
  },
  rowUnread: {
    backgroundColor: '#FFFBF9',
  },

  // ── Avatar ──
  avatarWrapper: { position: 'relative', marginRight: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // ── Row content ──
  rowContent: { flex: 1 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    letterSpacing: 0.1,
  },
  rowNameUnread: {
    fontWeight: '800',
    color: '#1A1A1A',
  },
  rowTime: {
    fontSize: 11,
    color: '#C0C0C0',
    fontWeight: '500',
  },
  rowBottom: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  roleChip: {
    backgroundColor: '#F5F4F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.3,
  },
  rowMessage: {
    fontSize: 13,
    color: '#B0B0B0',
    fontWeight: '400',
  },
  rowMessageUnread: {
    color: '#555',
    fontWeight: '600',
  },

  // ── Unread badge ──
  unreadBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // ── Empty ──
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 72,
    gap: 12,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F5F4F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
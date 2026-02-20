import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const MOCK_USER = {
  name: 'Alex Johnson',
  email: 'alex.johnson@email.com',
  userType: 'owner',
};

const USER_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  client: { label: 'Client', icon: 'person', color: '#2563EB', bg: '#DBEAFE' },
  owner: { label: 'Space Owner', icon: 'business', color: '#FF6B35', bg: '#FFF0EB' },
  vendor: { label: 'Service Vendor', icon: 'construct', color: '#16A34A', bg: '#DCFCE7' },
};

function MenuItem({ item }: { item: any }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity style={styles.menuItem} onPress={item.onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
        <View style={styles.menuItemLeft}>
          <View style={[styles.menuIconWrap, { backgroundColor: item.iconBg ?? '#FFF0EB' }]}>
            <Ionicons name={item.icon} size={20} color={item.iconColor ?? '#FF6B35'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuItemTitle}>{item.title}</Text>
            {item.subtitle ? <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text> : null}
          </View>
        </View>
        <View style={styles.menuChevronWrap}>
          <Ionicons name="chevron-forward" size={16} color="#CCC" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function MenuSection({ title, items }: { title: string; items: any[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.sectionCard}>
        {items.map((item, i) => (
          <View key={item.id}>
            <MenuItem item={item} />
            {i < items.length - 1 && <View style={styles.menuDivider} />}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const user = MOCK_USER;
  const typeCfg = USER_TYPE_CONFIG[user.userType] ?? USER_TYPE_CONFIG.client;
  const initials = user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => console.log('Logout') },
    ], { cancelable: true });
  };

  const accountItems = [
    user.userType === 'owner' && {
      id: 'my-venues', icon: 'business-outline', iconColor: '#FF6B35', iconBg: '#FFF0EB',
      title: 'My Venues', subtitle: 'Manage your listed spaces',
      onPress: () => console.log('Navigate to /my-venues'),
    },
    user.userType === 'vendor' && {
      id: 'my-services', icon: 'construct-outline', iconColor: '#16A34A', iconBg: '#DCFCE7',
      title: 'My Services', subtitle: 'Manage your offered services',
      onPress: () => console.log('Navigate to /my-services'),
    },
    {
      id: 'edit-profile', icon: 'person-circle-outline', iconColor: '#FF6B35', iconBg: '#FFF0EB',
      title: 'Edit Profile', subtitle: 'Update your personal info',
      onPress: () => Alert.alert('Coming Soon', 'Edit profile is coming soon.'),
    },
    {
      id: 'payment', icon: 'card-outline', iconColor: '#2563EB', iconBg: '#DBEAFE',
      title: 'Payment Methods', subtitle: 'Cards & billing info',
      onPress: () => Alert.alert('Coming Soon', 'Payment methods coming soon.'),
    },
  ].filter(Boolean) as any[];

  const preferenceItems = [
    {
      id: 'notifications', icon: 'notifications-outline', iconColor: '#D97706', iconBg: '#FEF3C7',
      title: 'Notifications', subtitle: 'Alerts & reminders',
      onPress: () => Alert.alert('Coming Soon', 'Notifications coming soon.'),
    },
    {
      id: 'help', icon: 'help-circle-outline', iconColor: '#6B7280', iconBg: '#F3F4F6',
      title: 'Help & Support', subtitle: 'support@rentalmeet.com',
      onPress: () => Alert.alert('Help', 'Contact us at support@rentalmeet.com'),
    },
    {
      id: 'about', icon: 'information-circle-outline', iconColor: '#6B7280', iconBg: '#F3F4F6',
      title: 'About RentalMeet', subtitle: 'Version 1.0.0',
      onPress: () => Alert.alert('RentalMeet', 'Version 1.0.0\n\nBook your perfect space with ease.'),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerAccentBar} />
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerEyebrow}>ACCOUNT</Text>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={20} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding} showsVerticalScrollIndicator={false}>

        {/* ── Profile card: banner + content as normal-flow children, NO overflow hidden ── */}
        <View style={styles.profileCard}>
          {/* Orange banner — normal flow element */}
          <View style={styles.profileBanner} />

          {/* Content pulled up with negative marginTop to overlap banner */}
          <View style={styles.profileContent}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarRing}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.cameraBtn}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>

            <View style={[styles.typeBadge, { backgroundColor: typeCfg.bg }]}>
              <Ionicons name={typeCfg.icon as any} size={13} color={typeCfg.color} />
              <Text style={[styles.typeBadgeText, { color: typeCfg.color }]}>{typeCfg.label}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>12</Text>
                <Text style={styles.statLabel}>Bookings</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>5</Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>4.9</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </View>
        </View>

        <MenuSection title="ACCOUNT" items={accountItems} />
        <MenuSection title="PREFERENCES" items={preferenceItems} />

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <View style={styles.logoutIconWrap}>
            <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          </View>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>RentalMeet v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F4F0' },

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
  },
  headerEyebrow: { fontSize: 11, fontWeight: '700', color: '#FF6B35', letterSpacing: 2.5, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },
  settingsBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#F5F4F0', alignItems: 'center', justifyContent: 'center' },

  content: { flex: 1 },
  contentPadding: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 120 },

  // ── Profile card — NO overflow: 'hidden' ──
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  profileBanner: {
    height: 72,
    backgroundColor: '#FFF0EB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
  },
  profileContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
    marginTop: -44,
  },

  avatarWrapper: { position: 'relative', marginBottom: 14 },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#FF6B35',
    padding: 3,
    backgroundColor: '#FFFFFF',
  },
  avatar: { flex: 1, borderRadius: 44, backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 },
  cameraBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  userName: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.3, marginBottom: 4 },
  userEmail: { fontSize: 13, color: '#999', fontWeight: '400', marginBottom: 12 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginBottom: 20 },
  typeBadgeText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },

  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F4F0', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8, width: '100%' },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statNum: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.3 },
  statLabel: { fontSize: 11, color: '#999', fontWeight: '500' },
  statDivider: { width: 1, height: 32, backgroundColor: '#E5E3DF' },

  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#B0ADA8', letterSpacing: 2, marginBottom: 8, paddingHorizontal: 4 },
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 20, shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  menuIconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  menuItemTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  menuItemSubtitle: { fontSize: 12, color: '#AAA', fontWeight: '400' },
  menuChevronWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#F5F4F0', alignItems: 'center', justifyContent: 'center' },
  menuDivider: { height: 1, backgroundColor: '#F5F4F0', marginLeft: 72 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 20, paddingVertical: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#FEE2E2', shadowColor: '#DC2626', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  logoutIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#DC2626', letterSpacing: 0.2 },
  versionText: { textAlign: 'center', fontSize: 12, color: '#CCC', fontWeight: '400' },
});
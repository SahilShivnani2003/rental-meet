import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 2;

const ALL_VENUES = [
  { id: '1', name: 'The Grand Hall',             city: 'New York',      pricePerHour: 150, rating: 4.8, category: 'Banquet Hall',    featured: true,  images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400'] },
  { id: '2', name: 'Rooftop Lounge',             city: 'Los Angeles',   pricePerHour: 120, rating: 4.5, category: 'Party Hall',      featured: true,  images: ['https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400'] },
  { id: '3', name: 'Downtown Conference Center', city: 'Chicago',       pricePerHour: 200, rating: 4.7, category: 'Conference Room', featured: false, images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=400'] },
  { id: '4', name: 'Lakeside Pavilion',          city: 'Austin',        pricePerHour: 90,  rating: 4.3, category: 'Wedding Venue',   featured: true,  images: ['https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400'] },
  { id: '5', name: 'Studio Loft',               city: 'San Francisco', pricePerHour: 175, rating: 4.6, category: 'Meeting Room',    featured: false, images: ['https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400'] },
  { id: '6', name: 'Skyline Ballroom',           city: 'Miami',         pricePerHour: 250, rating: 4.9, category: 'Banquet Hall',    featured: false, images: ['https://images.unsplash.com/photo-1561912774-79769a0a0a7a?w=400'] },
  { id: '7', name: 'The Ivy Garden',             city: 'Nashville',     pricePerHour: 110, rating: 4.4, category: 'Wedding Venue',   featured: false, images: ['https://images.unsplash.com/photo-1510076857177-7470076d4098?w=400'] },
  { id: '8', name: 'Tech Hub Meeting Rooms',     city: 'Seattle',       pricePerHour: 80,  rating: 4.2, category: 'Meeting Room',    featured: false, images: ['https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400'] },
];

const MOCK_USER = { name: 'Alex', userType: 'owner' };

const categories = [
  { id: 'all',             name: 'All',        icon: 'apps-outline'       },
  { id: 'Conference Room', name: 'Conference', icon: 'business-outline'   },
  { id: 'Banquet Hall',    name: 'Banquet',    icon: 'restaurant-outline' },
  { id: 'Wedding Venue',   name: 'Wedding',    icon: 'rose-outline'       },
  { id: 'Party Hall',      name: 'Party',      icon: 'balloon-outline'    },
  { id: 'Meeting Room',    name: 'Meeting',    icon: 'people-outline'     },
];

// ── Venue grid card ───────────────────────────────────────────────────────────
function VenueCard({ venue }: { venue: any }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = (v: number) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View style={[styles.venueCard, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => press(0.96)}
        onPressOut={() => press(1)}
        onPress={() => console.log(`venue ${venue.id}`)}
      >
        <View style={styles.venueImageWrapper}>
          <Image source={{ uri: venue.images[0] }} style={styles.venueImage} />
          <View style={styles.pricePill}>
            <Text style={styles.priceText}>${venue.pricePerHour}</Text>
            <Text style={styles.priceUnit}>/hr</Text>
          </View>
        </View>
        <View style={styles.venueInfo}>
          <Text style={styles.venueName} numberOfLines={1}>{venue.name}</Text>
          <View style={styles.venueFooter}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={11} color={Colors.primary} />
              <Text style={styles.venueLocation} numberOfLines={1}>{venue.city}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={11} color={Colors.primary} />
              <Text style={styles.rating}>{venue.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Featured horizontal card ──────────────────────────────────────────────────
function FeaturedCard({ venue }: { venue: any }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = (v: number) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View style={[styles.featuredCard, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => press(0.97)}
        onPressOut={() => press(1)}
        onPress={() => console.log(`venue ${venue.id}`)}
      >
        <Image source={{ uri: venue.images[0] }} style={styles.featuredImage} />
        <View style={styles.featuredGradient} />
        <View style={styles.categoryChip}>
          <Text style={styles.categoryChipText}>{venue.category}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={11} color={Colors.primary} />
          <Text style={styles.ratingBadgeText}>{venue.rating.toFixed(1)}</Text>
        </View>
        <View style={styles.featuredOverlay}>
          <Text style={styles.featuredName} numberOfLines={1}>{venue.name}</Text>
          <View style={styles.featuredMeta}>
            <View style={styles.locationRowWhite}>
              <Ionicons name="location" size={12} color={Colors.primary} />
              <Text style={styles.featuredCity}>{venue.city}</Text>
            </View>
            <Text style={styles.featuredPrice}>${venue.pricePerHour}/hr</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const user = MOCK_USER;
  const [venues, setVenues]             = useState<any[]>([]);
  const [featuredVenues, setFeatured]   = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [searchQuery, setSearch]        = useState('');
  const [selectedCategory, setCategory] = useState('all');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchVenues();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [selectedCategory]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const filtered = selectedCategory === 'all'
        ? ALL_VENUES
        : ALL_VENUES.filter((v) => v.category === selectedCategory);
      setVenues(filtered);
      setFeatured(ALL_VENUES.filter((v) => v.featured));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredVenues = venues.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerAccentBar} />
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greetingLabel}>GOOD DAY,</Text>
            <Text style={styles.greeting}>{user.name} 👋</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={22} color={Colors.charcoal} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Book your premium meeting venues.</Text>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={Colors.charcoalLight} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search venues, cities..."
            placeholderTextColor={Colors.charcoalLight}
            value={searchQuery}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchVenues(); }}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ── Categories ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
          style={{ marginBottom: Spacing.sm }}
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryButton, isActive && styles.categoryButtonActive]}
                onPress={() => setCategory(cat.id)}
              >
                <View style={[styles.categoryIconWrap, isActive && styles.categoryIconWrapActive]}>
                  <Ionicons name={cat.icon as any} size={18} color={isActive ? Colors.white : Colors.primary} />
                </View>
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Featured ── */}
        {featuredVenues.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Featured</Text>
              </View>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={styles.seeAll}>See All</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredContainer}>
              {featuredVenues.map((v) => <FeaturedCard key={v.id} venue={v} />)}
            </ScrollView>
          </View>
        )}

        {/* ── All Venues ── */}
        <View style={[styles.section, { paddingBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>All Venues</Text>
            </View>
            <Text style={styles.venueCount}>{filteredVenues.length} spaces</Text>
          </View>

          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loaderText}>Finding spaces...</Text>
            </View>
          ) : filteredVenues.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={Colors.primaryBorder} />
              <Text style={styles.emptyText}>No venues found</Text>
            </View>
          ) : (
            <Animated.View style={[styles.venuesGrid, { opacity: fadeAnim }]}>
              {filteredVenues.map((v) => <VenueCard key={v.id} venue={v} />)}
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* ── FAB ── */}
      {user.userType === 'owner' && (
        <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
          <View style={styles.fabInner}>
            <Ionicons name="add" size={26} color={Colors.white} />
          </View>
          <Text style={styles.fabLabel}>Add Venue</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:             { flex: 1, backgroundColor: Colors.background },

  // Header
  header:                { backgroundColor: Colors.surface, paddingBottom: Spacing.xl, borderBottomLeftRadius: Radii.xxl, borderBottomRightRadius: Radii.xxl, ...Shadows.header },
  headerAccentBar:       { height: 4, backgroundColor: Colors.primary },
  headerContent:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  greetingLabel:         { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primary, letterSpacing: Typography.wider, marginBottom: Spacing.xxs },
  greeting:              { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: Colors.charcoal, letterSpacing: Typography.tight },
  headerSubtitle:        { fontSize: Typography.md, color: Colors.charcoalLight, paddingHorizontal: Spacing.xl, marginTop: Spacing.xs },
  notificationButton:    { width: 46, height: 46, borderRadius: Radii.md, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  notifDot:              { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, borderWidth: 1.5, borderColor: Colors.background },

  // Search
  searchWrapper:         { flexDirection: 'row', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, gap: Spacing.md, alignItems: 'center' },
  searchContainer:       { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, borderRadius: Radii.md, height: 50, ...Shadows.card },
  searchInput:           { flex: 1, fontSize: 15, color: Colors.charcoal },
  filterButton:          { width: 50, height: 50, borderRadius: Radii.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.primary },

  // Categories
  categoriesContainer:   { paddingHorizontal: Spacing.xl, gap: 10, paddingVertical: Spacing.xxs },
  categoryButton:        { flexDirection: 'row', alignItems: 'center', paddingRight: 14, paddingLeft: 6, paddingVertical: 6, borderRadius: Radii.full, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, gap: Spacing.sm },
  categoryButtonActive:  { backgroundColor: Colors.charcoal, borderColor: Colors.charcoal },
  categoryIconWrap:      { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  categoryIconWrapActive:{ backgroundColor: Colors.primary },
  categoryText:          { fontSize: Typography.base, color: Colors.charcoalMid, fontWeight: Typography.semiBold, letterSpacing: Typography.normal },
  categoryTextActive:    { color: Colors.white },

  // Sections
  content:               { flex: 1 },
  section:               { marginBottom: Spacing.sm },
  sectionHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, marginBottom: 14, marginTop: Spacing.xl },
  sectionTitleRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionAccent:         { width: 4, height: 22, backgroundColor: Colors.primary, borderRadius: 2 },
  sectionTitle:          { fontSize: Typography.xl, fontWeight: Typography.extraBold, color: Colors.charcoal, letterSpacing: -0.3 },
  seeAllButton:          { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAll:                { fontSize: Typography.base, color: Colors.primary, fontWeight: Typography.bold },
  venueCount:            { fontSize: Typography.base, color: Colors.charcoalLight, fontWeight: Typography.medium },

  // Featured cards
  featuredContainer:     { paddingHorizontal: Spacing.xl, gap: 14 },
  featuredCard:          { width: 270, height: 220, borderRadius: Radii.xl, overflow: 'hidden', backgroundColor: Colors.charcoal, ...Shadows.floating },
  featuredImage:         { width: '100%', height: '100%', resizeMode: 'cover' },
  featuredGradient:      { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, backgroundColor: 'rgba(20,16,10,0.74)' },
  categoryChip:          { position: 'absolute', top: 14, left: 14, backgroundColor: 'rgba(245,166,35,0.22)', borderWidth: 1, borderColor: 'rgba(245,166,35,0.55)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.full },
  categoryChipText:      { fontSize: Typography.sm, color: Colors.white, fontWeight: Typography.semiBold, letterSpacing: 0.5 },
  ratingBadge:           { position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radii.full, gap: 3 },
  ratingBadgeText:       { fontSize: 12, color: Colors.charcoal, fontWeight: Typography.bold },
  featuredOverlay:       { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg },
  featuredName:          { fontSize: 18, fontWeight: Typography.extraBold, color: Colors.white, marginBottom: 6, letterSpacing: -0.3 },
  featuredMeta:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationRowWhite:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featuredCity:          { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: Typography.medium },
  featuredPrice:         { fontSize: 15, color: Colors.primary, fontWeight: Typography.extraBold },

  // Venue grid cards
  venuesGrid:            { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, gap: 14 },
  venueCard:             { width: CARD_WIDTH, backgroundColor: Colors.surface, borderRadius: Radii.lg, overflow: 'hidden', ...Shadows.card },
  venueImageWrapper:     { position: 'relative' },
  venueImage:            { width: '100%', height: 130, resizeMode: 'cover' },
  pricePill:             { position: 'absolute', bottom: -14, right: 10, flexDirection: 'row', alignItems: 'baseline', backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radii.full, ...Shadows.primary },
  priceText:             { fontSize: Typography.md, fontWeight: Typography.extraBold, color: Colors.white },
  priceUnit:             { fontSize: 10, fontWeight: Typography.semiBold, color: 'rgba(255,255,255,0.82)', marginLeft: 1 },
  venueInfo:             { paddingHorizontal: 12, paddingTop: 20, paddingBottom: 12 },
  venueName:             { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.charcoal, marginBottom: Spacing.sm, letterSpacing: -0.2 },
  venueFooter:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locationRow:           { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  venueLocation:         { fontSize: Typography.sm, color: Colors.charcoalLight, fontWeight: Typography.medium, flex: 1 },
  ratingContainer:       { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.primaryLight, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  rating:                { fontSize: Typography.sm, color: Colors.primaryDark, fontWeight: Typography.bold },

  // Loader / Empty
  loaderWrap:            { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loaderText:            { fontSize: Typography.md, color: Colors.charcoalLight, fontWeight: Typography.medium },
  emptyState:            { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText:             { fontSize: 16, color: Colors.charcoalLight, fontWeight: Typography.semiBold },

  // FAB
  fab:                   { position: 'absolute', right: Spacing.xl, bottom: Spacing.xxl, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, borderRadius: Radii.full, paddingLeft: 6, paddingRight: 18, paddingVertical: 6, shadowColor: Colors.primaryDark, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 10 },
  fabInner:              { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  fabLabel:              { fontSize: 15, fontWeight: Typography.extraBold, color: Colors.white, letterSpacing: 0.3 },
});
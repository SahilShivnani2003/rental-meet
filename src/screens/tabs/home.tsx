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

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 2;

const ALL_VENUES = [
  {
    id: '1',
    name: 'The Grand Hall',
    city: 'New York',
    pricePerHour: 150,
    rating: 4.8,
    category: 'Banquet Hall',
    featured: true,
    images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400'],
  },
  {
    id: '2',
    name: 'Rooftop Lounge',
    city: 'Los Angeles',
    pricePerHour: 120,
    rating: 4.5,
    category: 'Party Hall',
    featured: true,
    images: ['https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400'],
  },
  {
    id: '3',
    name: 'Downtown Conference Center',
    city: 'Chicago',
    pricePerHour: 200,
    rating: 4.7,
    category: 'Conference Room',
    featured: false,
    images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=400'],
  },
  {
    id: '4',
    name: 'Lakeside Pavilion',
    city: 'Austin',
    pricePerHour: 90,
    rating: 4.3,
    category: 'Wedding Venue',
    featured: true,
    images: ['https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400'],
  },
  {
    id: '5',
    name: 'Studio Loft',
    city: 'San Francisco',
    pricePerHour: 175,
    rating: 4.6,
    category: 'Meeting Room',
    featured: false,
    images: ['https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400'],
  },
  {
    id: '6',
    name: 'Skyline Ballroom',
    city: 'Miami',
    pricePerHour: 250,
    rating: 4.9,
    category: 'Banquet Hall',
    featured: false,
    images: ['https://images.unsplash.com/photo-1561912774-79769a0a0a7a?w=400'],
  },
  {
    id: '7',
    name: 'The Ivy Garden',
    city: 'Nashville',
    pricePerHour: 110,
    rating: 4.4,
    category: 'Wedding Venue',
    featured: false,
    images: ['https://images.unsplash.com/photo-1510076857177-7470076d4098?w=400'],
  },
  {
    id: '8',
    name: 'Tech Hub Meeting Rooms',
    city: 'Seattle',
    pricePerHour: 80,
    rating: 4.2,
    category: 'Meeting Room',
    featured: false,
    images: ['https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400'],
  },
];

const MOCK_USER = {
  name: 'Alex',
  userType: 'owner',
};

const categories = [
  { id: 'all', name: 'All', icon: 'apps-outline' },
  { id: 'Conference Room', name: 'Conference', icon: 'business-outline' },
  { id: 'Banquet Hall', name: 'Banquet', icon: 'restaurant-outline' },
  { id: 'Wedding Venue', name: 'Wedding', icon: 'rose-outline' },
  { id: 'Party Hall', name: 'Party', icon: 'balloon-outline' },
  { id: 'Meeting Room', name: 'Meeting', icon: 'people-outline' },
];

// Animated venue card with press feedback
function VenueCard({ venue, index }: { venue: any; index: number }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  return (
    <Animated.View style={[styles.venueCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => console.log(`Navigate to venue ${venue.id}`)}
      >
        <View style={styles.venueImageWrapper}>
          <Image
            source={{ uri: venue.images[0] || 'https://via.placeholder.com/300' }}
            style={styles.venueImage}
          />
          {/* Price tag overlapping image */}
          <View style={styles.pricePill}>
            <Text style={styles.priceText}>${venue.pricePerHour}</Text>
            <Text style={styles.priceUnit}>/hr</Text>
          </View>
        </View>
        <View style={styles.venueInfo}>
          <Text style={styles.venueName} numberOfLines={1}>
            {venue.name}
          </Text>
          <View style={styles.venueFooter}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={11} color="#FF6B35" />
              <Text style={styles.venueLocation} numberOfLines={1}>
                {venue.city}
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={11} color="#FF6B35" />
              <Text style={styles.rating}>{venue.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Featured card with full-bleed image and text overlay
function FeaturedCard({ venue }: { venue: any }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  return (
    <Animated.View style={[styles.featuredCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => console.log(`Navigate to venue ${venue.id}`)}
      >
        <Image
          source={{ uri: venue.images[0] || 'https://via.placeholder.com/400' }}
          style={styles.featuredImage}
        />
        {/* Dark gradient overlay at bottom */}
        <View style={styles.featuredGradient} />

        {/* Category chip top-left */}
        <View style={styles.categoryChip}>
          <Text style={styles.categoryChipText}>{venue.category}</Text>
        </View>

        {/* Rating badge top-right */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={11} color="#FF6B35" />
          <Text style={styles.ratingBadgeText}>{venue.rating.toFixed(1)}</Text>
        </View>

        {/* Text overlay at bottom */}
        <View style={styles.featuredOverlay}>
          <Text style={styles.featuredName} numberOfLines={1}>
            {venue.name}
          </Text>
          <View style={styles.featuredMeta}>
            <View style={styles.locationRowWhite}>
              <Ionicons name="location" size={12} color="#FF6B35" />
              <Text style={styles.featuredCity}>{venue.city}</Text>
            </View>
            <Text style={styles.featuredPrice}>${venue.pricePerHour}/hr</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const user = MOCK_USER;
  const [venues, setVenues] = useState<any[]>([]);
  const [featuredVenues, setFeaturedVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fade-in on mount
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchVenues();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [selectedCategory]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const filtered =
        selectedCategory === 'all'
          ? ALL_VENUES
          : ALL_VENUES.filter((v) => v.category === selectedCategory);
      setVenues(filtered);
      setFeaturedVenues(ALL_VENUES.filter((v) => v.featured));
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVenues();
  };

  const filteredVenues = venues.filter((venue: any) =>
    venue.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerAccentBar} />
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greetingLabel}>GOOD DAY,</Text>
            <Text style={styles.greeting}>{user?.name} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => console.log('Navigate to messages')}
          >
            <Ionicons name="notifications-outline" size={22} color="#1A1A1A" />
            {/* Notification dot */}
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Discover & book your perfect space.</Text>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search venues, cities..."
            placeholderTextColor="#AAA"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── Categories ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
          style={styles.categoriesScroll}
        >
          {categories.map((category) => {
            const isActive = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryButton, isActive && styles.categoryButtonActive]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <View style={[styles.categoryIconWrap, isActive && styles.categoryIconWrapActive]}>
                  <Ionicons
                    name={category.icon as any}
                    size={18}
                    color={isActive ? '#FFFFFF' : '#FF6B35'}
                  />
                </View>
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Featured Venues ── */}
        {featuredVenues.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Featured</Text>
              </View>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={styles.seeAll}>See All</Text>
                <Ionicons name="arrow-forward" size={14} color="#FF6B35" />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredContainer}
            >
              {featuredVenues.map((venue: any) => (
                <FeaturedCard key={venue.id} venue={venue} />
              ))}
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
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.loaderText}>Finding spaces...</Text>
            </View>
          ) : filteredVenues.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#E0E0E0" />
              <Text style={styles.emptyText}>No venues found</Text>
            </View>
          ) : (
            <Animated.View style={[styles.venuesGrid, { opacity: fadeAnim }]}>
              {filteredVenues.map((venue, index) => (
                <VenueCard key={venue.id} venue={venue} index={index} />
              ))}
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* ── FAB for Owners ── */}
      {user?.userType === 'owner' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => console.log('Navigate to add-venue')}
          activeOpacity={0.85}
        >
          <View style={styles.fabInner}>
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </View>
          <Text style={styles.fabLabel}>Add Venue</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F0',
  },

  // ── Header ──
  header: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 6,
  },
  headerAccentBar: {
    height: 4,
    backgroundColor: '#FF6B35',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  greetingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B35',
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    fontWeight: '400',
    paddingHorizontal: 20,
    marginTop: 6,
    letterSpacing: 0.2,
  },
  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F5F4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
    borderWidth: 1.5,
    borderColor: '#F5F4F0',
  },

  // ── Search ──
  searchWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    borderRadius: 14,
    height: 50,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '400',
  },
  filterButton: {
    width: 50,
    height: 50,
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

  // ── Categories ──
  categoriesScroll: {
    marginBottom: 8,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 10,
    paddingVertical: 4,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
    paddingLeft: 6,
    paddingVertical: 6,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDECE8',
    gap: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  categoryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconWrapActive: {
    backgroundColor: '#FF6B35',
  },
  categoryText: {
    fontSize: 13,
    color: '#444',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },

  // ── Section layout ──
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionAccent: {
    width: 4,
    height: 22,
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAll: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  venueCount: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },

  // ── Featured Cards ──
  featuredContainer: {
    paddingHorizontal: 20,
    gap: 14,
  },
  featuredCard: {
    width: 270,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(15, 15, 15, 0.72)',
  },
  categoryChip: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryChipText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 3,
  },
  ratingBadgeText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '700',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationRowWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredCity: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  featuredPrice: {
    fontSize: 15,
    color: '#FF6B35',
    fontWeight: '800',
  },

  // ── Venue Grid Cards ──
  venuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 14,
  },
  venueCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  venueImageWrapper: {
    position: 'relative',
  },
  venueImage: {
    width: '100%',
    height: 130,
    resizeMode: 'cover',
  },
  pricePill: {
    position: 'absolute',
    bottom: -14,
    right: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  priceUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 1,
  },
  venueInfo: {
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 12,
  },
  venueName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  venueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  venueLocation: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF0EB',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rating: {
    fontSize: 11,
    color: '#FF6B35',
    fontWeight: '700',
  },

  // ── Loader / Empty ──
  loaderWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#BBB',
    fontWeight: '600',
  },

  // ── FAB ──
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 28,
    paddingLeft: 6,
    paddingRight: 18,
    paddingVertical: 6,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  fabInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  fabLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
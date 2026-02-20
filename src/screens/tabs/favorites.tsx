import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATIC_FAVORITES = [
  {
    id: '1',
    name: 'The Grand Hall',
    city: 'New York',
    pricePerHour: 150,
    rating: 4.8,
    category: 'Banquet Hall',
    images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400'],
  },
  {
    id: '2',
    name: 'Rooftop Lounge',
    city: 'Los Angeles',
    pricePerHour: 120,
    rating: 4.5,
    category: 'Party Hall',
    images: ['https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400'],
  },
  {
    id: '3',
    name: 'Downtown Conference Center',
    city: 'Chicago',
    pricePerHour: 200,
    rating: 4.7,
    category: 'Conference Room',
    images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=400'],
  },
  {
    id: '4',
    name: 'Lakeside Pavilion',
    city: 'Austin',
    pricePerHour: 90,
    rating: 4.3,
    category: 'Wedding Venue',
    images: ['https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400'],
  },
  {
    id: '5',
    name: 'Studio Loft',
    city: 'San Francisco',
    pricePerHour: 175,
    rating: 4.6,
    category: 'Meeting Room',
    images: ['https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400'],
  },
];

// ─── Animated card ─────────────────────────────────────────────────────────
function FavoriteCard({
  venue,
  index,
  onRemove,
  onPress,
}: {
  venue: any;
  index: number;
  onRemove: (id: string) => void;
  onPress: (id: string) => void;
}) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        delay: index * 70,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 70,
        useNativeDriver: true,
        speed: 18,
        bounciness: 6,
      }),
    ]).start();
  }, []);

  const handleHeartPress = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 30, bounciness: 12 }),
      Animated.spring(heartScale, { toValue: 1,   useNativeDriver: true, speed: 20 }),
    ]).start(() => onRemove(venue.id));
  };

  return (
    <Animated.View
      style={[
        styles.card,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* Full-bleed image */}
      <TouchableOpacity activeOpacity={0.92} onPress={() => onPress(venue.id)}>
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: venue.images[0] || 'https://via.placeholder.com/400' }}
            style={styles.venueImage}
          />
          {/* Gradient overlay */}
          <View style={styles.imageGradient} />

          {/* Category chip */}
          <View style={styles.categoryChip}>
            <Text style={styles.categoryChipText}>{venue.category}</Text>
          </View>

          {/* Heart button */}
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={handleHeartPress}
            activeOpacity={0.8}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons name="heart" size={20} color="#FF6B35" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Card info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardInfoLeft}>
          <Text style={styles.venueName} numberOfLines={1}>{venue.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={12} color="#FF6B35" />
            <Text style={styles.venueCity}>{venue.city}</Text>
          </View>
        </View>

        <View style={styles.cardInfoRight}>
          {/* Rating */}
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={11} color="#FF6B35" />
            <Text style={styles.ratingText}>{venue.rating.toFixed(1)}</Text>
          </View>
          {/* Price */}
          <Text style={styles.priceText}>${venue.pricePerHour}<Text style={styles.priceUnit}>/hr</Text></Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────
export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchFavorites(); }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setFavorites(STATIC_FAVORITES);
    } catch {
      console.error('Error fetching favorites');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchFavorites(); };

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    Alert.alert('Removed', 'Venue removed from favorites.');
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerAccentBar} />
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerEyebrow}>COLLECTION</Text>
            <Text style={styles.headerTitle}>My Favorites</Text>
          </View>
          {/* Count badge */}
          {favorites.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeNum}>{favorites.length}</Text>
              <Text style={styles.countBadgeLabel}>Saved</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPadding}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loaderText}>Loading favorites...</Text>
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="heart-outline" size={44} color="#D0D0D0" />
            </View>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the heart on any venue to save it here
            </Text>
          </View>
        ) : (
          favorites.map((venue, index) => (
            <FavoriteCard
              key={venue.id}
              venue={venue}
              index={index}
              onRemove={removeFavorite}
              onPress={(id) => console.log(`Navigate to venue ${id}`)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
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
    paddingBottom: 20,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 6,
  },
  headerAccentBar: {
    height: 4,
    backgroundColor: '#FF6B35',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
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
  countBadge: {
    backgroundColor: '#FFF0EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFD6C2',
  },
  countBadgeNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FF6B35',
    lineHeight: 26,
  },
  countBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6B35',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── Content ──
  content: { flex: 1 },
  contentPadding: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 110,
  },

  // ── Card ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 190,
  },
  venueImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(15,15,15,0.35)',
  },
  categoryChip: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryChipText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardInfoLeft: { flex: 1, gap: 4 },
  venueName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venueCity: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  cardInfoRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B35',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF6B35',
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFB08A',
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
    paddingTop: 80,
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
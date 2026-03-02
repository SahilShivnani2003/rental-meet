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
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATIC_FAVORITES = [
  { id: '1', name: 'The Grand Hall',             city: 'New York',      pricePerHour: 150, rating: 4.8, category: 'Banquet Hall',    images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400'] },
  { id: '2', name: 'Rooftop Lounge',             city: 'Los Angeles',   pricePerHour: 120, rating: 4.5, category: 'Party Hall',      images: ['https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400'] },
  { id: '3', name: 'Downtown Conference Center', city: 'Chicago',       pricePerHour: 200, rating: 4.7, category: 'Conference Room', images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=400'] },
  { id: '4', name: 'Lakeside Pavilion',          city: 'Austin',        pricePerHour: 90,  rating: 4.3, category: 'Wedding Venue',   images: ['https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400'] },
  { id: '5', name: 'Studio Loft',               city: 'San Francisco', pricePerHour: 175, rating: 4.6, category: 'Meeting Room',    images: ['https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400'] },
];

// ─── Animated card ────────────────────────────────────────────────────────────
function FavoriteCard({
  venue, index, onRemove, onPress,
}: {
  venue: any; index: number; onRemove: (id: string) => void; onPress: (id: string) => void;
}) {
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(0.94)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, delay: index * 70, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, delay: index * 70, useNativeDriver: true, speed: 18, bounciness: 6 }),
    ]).start();
  }, []);

  const handleHeartPress = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 30, bounciness: 12 }),
      Animated.spring(heartScale, { toValue: 1,   useNativeDriver: true, speed: 20 }),
    ]).start(() => onRemove(venue.id));
  };

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      {/* Full-bleed image */}
      <TouchableOpacity activeOpacity={0.92} onPress={() => onPress(venue.id)}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: venue.images[0] }} style={styles.venueImage} />

          {/* Gradient overlay */}
          <View style={styles.imageGradient} />

          {/* Category chip — amber-tinted glass */}
          <View style={styles.categoryChip}>
            <Text style={styles.categoryChipText}>{venue.category}</Text>
          </View>

          {/* Heart remove button */}
          <TouchableOpacity style={styles.heartBtn} onPress={handleHeartPress} activeOpacity={0.8}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons name="heart" size={20} color={Colors.primary} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Card info row */}
      <View style={styles.cardInfo}>
        <View style={styles.cardInfoLeft}>
          <Text style={styles.venueName} numberOfLines={1}>{venue.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={12} color={Colors.primary} />
            <Text style={styles.venueCity}>{venue.city}</Text>
          </View>
        </View>

        <View style={styles.cardInfoRight}>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={11} color={Colors.primary} />
            <Text style={styles.ratingText}>{venue.rating.toFixed(1)}</Text>
          </View>
          <Text style={styles.priceText}>
            ${venue.pricePerHour}
            <Text style={styles.priceUnit}>/hr</Text>
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function FavoritesScreen() {
  const [favorites, setFavorites]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
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
          {favorites.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeNum}>{favorites.length}</Text>
              <Text style={styles.countBadgeLabel}>Saved</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPadding}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFavorites(); }} tintColor={Colors.primary} />
        }
      >
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>Loading favorites...</Text>
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="heart-outline" size={44} color={Colors.primaryBorder} />
            </View>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>Tap the heart on any venue to save it here</Text>
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header:           { backgroundColor: Colors.surface, borderBottomLeftRadius: Radii.xxl, borderBottomRightRadius: Radii.xxl, paddingBottom: Spacing.xl, ...Shadows.header },
  headerAccentBar:  { height: 4, backgroundColor: Colors.primary },
  headerContent:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  headerEyebrow:    { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primary, letterSpacing: Typography.wider, marginBottom: Spacing.xxs },
  headerTitle:      { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: Colors.charcoal, letterSpacing: Typography.tight },

  // Count badge — matches totalBadge in BookingsScreen
  countBadge:       { backgroundColor: Colors.primaryLight, borderRadius: Radii.lg, paddingHorizontal: Spacing.lg, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.primaryBorder },
  countBadgeNum:    { fontSize: 22, fontWeight: Typography.extraBold, color: Colors.primary, lineHeight: 26 },
  countBadgeLabel:  { fontSize: 10, fontWeight: Typography.bold, color: Colors.primaryDark, letterSpacing: 0.5, textTransform: 'uppercase' },

  // Content
  content:          { flex: 1 },
  contentPadding:   { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: 110 },

  // Card
  card:             { backgroundColor: Colors.surface, borderRadius: Radii.xl, marginBottom: Spacing.lg, overflow: 'hidden', ...Shadows.card },
  imageWrapper:     { position: 'relative', width: '100%', height: 190 },
  venueImage:       { width: '100%', height: '100%', resizeMode: 'cover' },
  imageGradient:    { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(15,15,15,0.35)' },

  // Category chip — amber-tinted glass style
  categoryChip:     { position: 'absolute', top: 14, left: 14, backgroundColor: 'rgba(245,166,35,0.22)', borderWidth: 1, borderColor: 'rgba(245,166,35,0.45)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.full },
  categoryChipText: { fontSize: Typography.sm, color: Colors.white, fontWeight: Typography.semiBold, letterSpacing: 0.4 },

  // Heart button
  heartBtn:         { position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },

  // Card info
  cardInfo:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: 14 },
  cardInfoLeft:     { flex: 1, gap: 4 },
  venueName:        { fontSize: Typography.lg, fontWeight: Typography.extraBold, color: Colors.charcoal, letterSpacing: -0.3 },
  locationRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  venueCity:        { fontSize: 12, color: Colors.charcoalLight, fontWeight: Typography.medium },
  cardInfoRight:    { alignItems: 'flex-end', gap: 6 },

  // Rating pill
  ratingPill:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: 10 },
  ratingText:       { fontSize: 12, fontWeight: Typography.bold, color: Colors.primaryDark },

  // Price
  priceText:        { fontSize: 18, fontWeight: Typography.extraBold, color: Colors.primary },
  priceUnit:        { fontSize: 12, fontWeight: Typography.medium, color: Colors.primaryBorder },

  // Loader / Empty
  loaderWrap:       { alignItems: 'center', paddingTop: 64, gap: 12 },
  loaderText:       { fontSize: Typography.md, color: Colors.charcoalLight, fontWeight: Typography.medium },
  emptyWrap:        { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIconWrap:    { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xxs },
  emptyTitle:       { fontSize: Typography.xl, fontWeight: Typography.extraBold, color: Colors.charcoal, letterSpacing: -0.3 },
  emptySubtitle:    { fontSize: Typography.md, color: Colors.charcoalLight, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
});
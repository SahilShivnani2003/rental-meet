import { useRef } from 'react';
import {
    Animated,
    TouchableOpacity,
    View,
    Image,
    Text,
    StyleSheet,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radii, Typography } from '../../theme/theme';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 2;
const IMAGE_HEIGHT = 145;

export default function VenueCard({ venue }: { venue: any }) {
    const navigation = useNavigation<any>();
    const scale = useRef(new Animated.Value(1)).current;

    const press = (toValue: number) =>
        Animated.spring(scale, {
            toValue,
            useNativeDriver: true,
            speed: 32,
            bounciness: 3,
        }).start();

    // ── Derived values ────────────────────────────────────────────────────────
    const pricePerHour = venue.pricing?.perHour?.weekday ?? 0;
    const rating = typeof venue.rating === 'number' ? venue.rating : 0;
    const hasRating = rating > 0;
    const reviewCount = venue.reviewCount ?? 0;
    const capacity = venue.capacity ?? '';
    const isNew = !hasRating;

    const venueType: string =
        Array.isArray(venue.venueType) && venue.venueType.length > 0 ? venue.venueType[0] : '';

    const imageUrl: string | null =
        venue.images?.find((img: any) => img.isFeatured)?.url ?? venue.images?.[0]?.url ?? null;

    const parking: string = venue.location?.parkingAvailability ?? '';
    const hasParking = parking && parking !== 'None';

    const city = venue.location?.city ?? venue.city ?? '';
    const area = venue.location?.area ?? '';
    const locationLabel = area ? `${city}, ${area}` : city;

    // ── Coupon ────────────────────────────────────────────────────────────────
    // Shows the first active coupon if present
    const firstCoupon = venue.activeCoupons?.[0] ?? null;
    const hasCoupon = !!firstCoupon;
    const couponLabel = firstCoupon
        ? firstCoupon.code
            ? `${firstCoupon.code} · ${firstCoupon.discountValue}${
                  firstCoupon.discountType === 'percentage' ? '%' : '₹'
              } off`
            : `Save ${firstCoupon.discountValue}${
                  firstCoupon.discountType === 'percentage' ? '%' : '₹'
              }`
        : '';

    return (
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={() => press(0.96)}
                onPressOut={() => press(1)}
                onPress={() => navigation.navigate('venueDetail', { venue })}
            >
                {/* ══════════════ IMAGE ZONE (overflow:hidden) ══════════════ */}
                <View style={styles.imageWrapper}>
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.image} />
                    ) : (
                        <View style={styles.imageFallback}>
                            <Ionicons name="business-outline" size={28} color="#C8BFB0" />
                        </View>
                    )}

                    {/* Bottom scrim — swap this View for LinearGradient for best look */}
                    <View style={styles.scrim} />

                    {/* Venue type — frosted glass, top-left */}
                    {venueType ? (
                        <View style={styles.typeTag}>
                            <Text style={styles.typeTagText} numberOfLines={1}>
                                {venueType}
                            </Text>
                        </View>
                    ) : null}

                    {/* NEW badge — top-right */}
                    {isNew && (
                        <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>NEW</Text>
                        </View>
                    )}

                    {/* Capacity chip — bottom-left over scrim */}
                    {!!capacity && (
                        <View style={styles.capChip}>
                            <Ionicons name="people" size={9} color="rgba(255,255,255,0.88)" />
                            <Text style={styles.capText}>{capacity}</Text>
                        </View>
                    )}
                </View>

                {/* ══════════════ PRICE ROW (OUTSIDE overflow:hidden) ════════
                    Lives between image and info so it's never clipped.
                    Negative marginTop pulls it up to overlap the image bottom.
                ═══════════════════════════════════════════════════════════════ */}
                <View style={styles.priceRow}>
                    {/* Coupon badge — only shown if venue has active coupons */}
                    {hasCoupon && (
                        <View style={styles.couponPill}>
                            <Ionicons name="pricetag" size={10} color="#fff" />
                            <Text style={styles.couponText} numberOfLines={1}>
                                {couponLabel}
                            </Text>
                        </View>
                    )}

                    {/* Price pill — always visible, right-aligned */}
                    <View style={styles.pricePill}>
                        <Text style={styles.priceSymbol}>₹</Text>
                        <Text style={styles.priceValue}>
                            {pricePerHour > 0 ? pricePerHour.toLocaleString('en-IN') : '—'}
                        </Text>
                        <Text style={styles.priceUnit}>/hr</Text>
                    </View>
                </View>

                {/* ══════════════ INFO ZONE ══════════════════════════════════ */}
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                        {venue.businessName}
                    </Text>

                    <View style={styles.locationRow}>
                        <View style={styles.locationDot} />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {locationLabel || '—'}
                        </Text>
                    </View>

                    <View style={styles.rule} />

                    <View style={styles.footer}>
                        {/* Rating */}
                        <View style={[styles.ratingPill, isNew && styles.ratingPillNew]}>
                            <Ionicons
                                name={hasRating ? 'star' : 'star-outline'}
                                size={10}
                                color={hasRating ? Colors.primary : Colors.charcoalLight}
                            />
                            <Text style={[styles.ratingValue, isNew && styles.ratingValueNew]}>
                                {hasRating ? rating.toFixed(1) : 'New'}
                            </Text>
                            {hasRating && reviewCount > 0 && (
                                <Text style={styles.reviewCount}>({reviewCount})</Text>
                            )}
                        </View>

                        {/* Parking */}
                        {hasParking && (
                            <View style={styles.parkBadge}>
                                <Ionicons name="car-outline" size={10} color={Colors.primaryDark} />
                                <Text style={styles.parkText}>
                                    {parking === 'Free' ? 'Free P' : 'P'}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        // No overflow:'hidden' on the card itself — price row must not be clipped
        shadowColor: '#2C2C2C',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.09,
        shadowRadius: 18,
        elevation: 5,
        borderWidth: 0.75,
        borderColor: 'rgba(245,166,35,0.13)',
    },

    imageWrapper: {
        height: IMAGE_HEIGHT,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        overflow: 'hidden', // ← clipping stays inside image only
        backgroundColor: '#EDE8DF',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageFallback: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0EBE2',
    },

    // Replace with <LinearGradient colors={['transparent','rgba(0,0,0,0.52)']}> for true fade
    scrim: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 70,
        backgroundColor: 'rgba(0,0,0,0.22)',
    },

    typeTag: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 0.6,
        borderColor: 'rgba(255,255,255,0.38)',
        paddingHorizontal: 8,
        paddingVertical: 3.5,
        borderRadius: 20,
        maxWidth: CARD_WIDTH * 0.68,
    },
    typeTagText: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.95)',
        letterSpacing: 0.25,
    },

    newBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: Colors.primary,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 20,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 3,
    },
    newBadgeText: {
        fontSize: 8.5,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 1.1,
    },

    capChip: {
        position: 'absolute',
        bottom: 9,
        left: 9,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(0,0,0,0.44)',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 20,
    },
    capText: {
        fontSize: 9.5,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.92)',
    },

    // ── Price row — sits BELOW image, outside overflow:hidden ────────────────
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
        paddingHorizontal: 10,
        marginTop: -14, // pulls pills up to overlap image bottom edge
        marginBottom: 6,
        zIndex: 10,
    },

    pricePill: {
        flexDirection: 'row',
        alignItems: 'baseline',
        backgroundColor: Colors.primary,
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 2.5,
        borderColor: '#FFFFFF',
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.42,
        shadowRadius: 7,
        elevation: 5,
    },
    priceSymbol: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.82)',
    },
    priceValue: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
    priceUnit: {
        fontSize: 9,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.72)',
        marginLeft: 1,
    },

    // Green coupon pill — appears to the left of price when coupon exists
    couponPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#0F6E56', // teal-green — distinct from amber price
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 2.5,
        borderColor: '#FFFFFF',
        shadowColor: '#0F6E56',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 4,
        maxWidth: CARD_WIDTH * 0.56, // prevent coupon from crushing price pill
    },
    couponText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },

    // ── Info zone ─────────────────────────────────────────────────────────────
    info: {
        paddingHorizontal: 11,
        paddingTop: 2,
        paddingBottom: 12,
    },

    name: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#2C2C2C',
        letterSpacing: -0.3,
        marginBottom: 4,
    },

    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    locationDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: Colors.primary,
        flexShrink: 0,
    },
    locationText: {
        fontSize: 10.5,
        fontWeight: '500',
        color: '#8A8A8A',
        flex: 1,
    },

    rule: {
        height: 0.75,
        backgroundColor: 'rgba(245,166,35,0.18)',
        marginVertical: 8,
        marginHorizontal: -2,
    },

    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    ratingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#FEF3DC',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
    },
    ratingPillNew: {
        backgroundColor: '#F7F6F2',
    },
    ratingValue: {
        fontSize: 11,
        fontWeight: '700',
        color: '#D98E0E',
    },
    ratingValueNew: {
        color: '#8A8A8A',
        fontWeight: '600',
    },
    reviewCount: {
        fontSize: 9.5,
        color: '#8A8A8A',
        fontWeight: '500',
    },

    parkBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(245,166,35,0.10)',
        borderWidth: 0.75,
        borderColor: 'rgba(245,166,35,0.28)',
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius: 20,
    },
    parkText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#D98E0E',
    },
});

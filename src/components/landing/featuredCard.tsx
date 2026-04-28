import {
    Animated,
    TouchableOpacity,
    View,
    Text,
    StyleSheet,
    Dimensions,
    Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Spacing, Colors, Radii, Shadows, Typography } from '../../theme/theme';
import { useRef } from 'react';
import useEntrance from '../../hooks/useEntrance';
import { Venue } from '@/features/venue/types/Venue';

const { width: W } = Dimensions.get('window');

const CARD_H = 240;
const THUMB_W = 82;

function usePressScale(to = 0.98) {
    const scale = useRef(new Animated.Value(1)).current;
    const onIn = () =>
        Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 30 }).start();
    const onOut = () =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22 }).start();
    return { scale, onIn, onOut };
}

function getRatingLabel(rating: number) {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Average';
    return 'New';
}

interface Props {
    v: Venue;
    index: number;
    onPress: (venue: Venue) => void;
    onBook?: (venue: Venue) => void;
}

export default function FeaturedCard({ v, index, onPress, onBook }: Props) {
    const { fade, slide } = useEntrance(160 + index * 70);
    const { scale, onIn, onOut } = usePressScale();

    // ── Images ───────────────────────────────────────────────────────────────
    const allImages = v.images ?? [];
    const featured = allImages.find(img => img.isFeatured)?.url ?? allImages[0]?.url ?? null;
    const thumbs = allImages.filter(img => img.url !== featured).slice(0, 3);
    const extraCount = allImages.length - 1 - thumbs.length; // images beyond shown thumbs

    // ── Price ────────────────────────────────────────────────────────────────
    const price =
        v.pricing?.perHour?.weekday ??
        v.pricing?.halfDay?.weekday ??
        v.pricing?.fullDay?.weekday ??
        null;
    const priceUnit = v.pricing?.enabledOptions?.perHour
        ? '/hr'
        : v.pricing?.enabledOptions?.halfDay
        ? '/half day'
        : '/day';

    // ── Amenities ────────────────────────────────────────────────────────────
    const amenityChips = (v.amenities?.basic ?? [])
        .filter(a => a.available && a.name)
        .slice(0, 2)
        .map(a => a.name!);
    const amenityExtra =
        (v.amenities?.basic?.filter(a => a.available)?.length ?? 0) - amenityChips.length;

    const hasRating = (v.rating ?? 0) > 0;
    const isVerified = v.status === 'approved';
    const location = [v.location?.area, v.location?.city].filter(Boolean).join(', ');

    return (
        <Animated.View style={[fc.wrapper, { opacity: fade, transform: [{ translateY: slide }] }]}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={() => onPress(v)}
                onPressIn={onIn}
                onPressOut={onOut}
            >
                <Animated.View style={[fc.card, { transform: [{ scale }] }]}>
                    {/* ── Left: Featured image ── */}
                    <View style={fc.featuredWrap}>
                        {featured ? (
                            <Image
                                source={{ uri: featured }}
                                style={fc.featuredImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[fc.featuredImage, fc.imageFallback]}>
                                <Ionicons
                                    name="business-outline"
                                    size={32}
                                    color={Colors.charcoalLight}
                                />
                            </View>
                        )}
                        {isVerified && (
                            <View style={fc.verifiedBadge}>
                                <Ionicons name="shield-checkmark" size={9} color="#fff" />
                            </View>
                        )}
                    </View>

                    {/* ── Right: Info ── */}
                    <View style={fc.info}>
                        {/* Name */}
                        <Text style={fc.name} numberOfLines={1}>
                            {v.businessName}
                        </Text>

                        {/* Location */}
                        <View style={fc.row}>
                            <Ionicons name="location" size={12} color={Colors.primary} />
                            <Text style={fc.locationText} numberOfLines={1}>
                                {location}
                            </Text>
                        </View>

                        {/* Rating */}
                        <View style={[fc.row, { marginTop: 3 }]}>
                            {hasRating ? (
                                <View style={fc.ratingBadge}>
                                    <Text style={fc.ratingNum}>{v.rating!.toFixed(0)}</Text>
                                    <Ionicons name="star" size={9} color="#fff" />
                                </View>
                            ) : null}
                            {(v.reviewCount ?? 0) > 0 && (
                                <Text style={fc.reviewCount}>({v.reviewCount} Ratings)</Text>
                            )}
                            {hasRating && (
                                <Text style={fc.ratingLabel}>· {getRatingLabel(v.rating!)}</Text>
                            )}
                            {!hasRating && (
                                <View style={fc.newBadge}>
                                    <Text style={fc.newBadgeText}>NEW</Text>
                                </View>
                            )}
                        </View>

                        {/* Capacity + Amenity chips */}
                        <View style={[fc.row, { marginTop: 3, flexWrap: 'wrap', gap: 6 }]}>
                            {v.capacity ? (
                                <View style={fc.chip}>
                                    <Ionicons
                                        name="people-outline"
                                        size={11}
                                        color={Colors.charcoalLight}
                                    />
                                    <Text style={fc.chipText}>{v.capacity}</Text>
                                </View>
                            ) : null}
                            {amenityChips.map(a => (
                                <Text key={a} style={fc.amenityText}>
                                    {a}
                                </Text>
                            ))}
                            {amenityExtra > 0 && (
                                <Text style={fc.amenityMore}>+{amenityExtra} more</Text>
                            )}
                        </View>

                        {/* Divider */}
                        <View style={fc.divider} />

                        {/* Price */}
                        <View style={fc.row}>
                            {price ? (
                                <>
                                    <Text style={fc.priceAmount}>
                                        ₹{price.toLocaleString('en-IN')}
                                    </Text>
                                    <Text style={fc.priceOnwards}> onwards</Text>
                                </>
                            ) : (
                                <Text style={fc.priceNego}>Price on request</Text>
                            )}
                        </View>

                        {/* Coupon tag */}
                        {(v?.activeCouponCount ?? 0) > 0 &&
                            v?.activeCoupons?.length > 0 &&
                            v.activeCoupons.map((c: any, i: any) => (
                                <View key={c.code ?? i} style={fc.couponRow}>
                                    <Ionicons name="pricetag" size={10} color={Colors.success} />
                                    <Text style={fc.couponText}>
                                        {c.code} ·{' '}
                                        {c.discountType === 'percentage'
                                            ? `${c.discountValue}%${
                                                  c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''
                                              }`
                                            : `₹${c.discountValue}`}{' '}
                                        off
                                    </Text>
                                </View>
                            ))}

                        {/* Actions */}
                        <View style={fc.actions}>
                            <TouchableOpacity
                                style={fc.btnOutline}
                                onPress={() => onPress(v)}
                                activeOpacity={0.8}
                            >
                                <Text style={fc.btnOutlineText}>View Details</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={fc.btnBook}
                                onPress={() => onBook?.(v) ?? onPress(v)}
                                activeOpacity={0.85}
                            >
                                <Text style={fc.btnBookText}>Book Now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const fc = StyleSheet.create({
    wrapper: {
        marginBottom: Spacing.md,
    },
    card: {
        height: CARD_H,
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.card,
    },

    // ── Featured image ───────────────────────────────────────────────────────
    featuredWrap: {
        width: W * 0.32,
        position: 'relative',
    },
    featuredImage: {
        width: '100%',
        height: '100%',
    },
    imageFallback: {
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifiedBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.success,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Thumbnails ───────────────────────────────────────────────────────────
    thumbCol: {
        width: THUMB_W,
        gap: 2,
    },
    thumbWrap: {
        flex: 1,
        position: 'relative',
    },
    thumb: {
        width: '100%',
        height: '100%',
    },
    thumbEmpty: {
        backgroundColor: Colors.background,
    },
    thumbOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.52)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumbOverlayText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: Typography.extraBold,
    },

    // ── Info panel ───────────────────────────────────────────────────────────
    info: {
        flex: 1,
        paddingHorizontal: 10,
        paddingVertical: 10,
        gap: 3,
    },
    name: {
        fontSize: 14,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        fontSize: 11.5,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        flex: 1,
    },

    // Rating
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: Colors.success,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: Radii.sm,
    },
    ratingNum: {
        fontSize: 11,
        fontWeight: Typography.extraBold,
        color: '#fff',
    },
    reviewCount: {
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    ratingLabel: {
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    newBadge: {
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: Radii.sm,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    newBadgeText: {
        fontSize: 9,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
        letterSpacing: 0.5,
    },

    // Capacity / amenity chips
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    chipText: {
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    amenityText: {
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    amenityMore: {
        fontSize: 11,
        color: Colors.primary,
        fontWeight: Typography.bold,
    },

    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 4,
    },

    // Price
    priceAmount: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.5,
    },
    priceOnwards: {
        fontSize: 11.5,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        alignSelf: 'flex-end',
        marginBottom: 2,
    },
    priceNego: {
        fontSize: 13,
        color: Colors.charcoalLight,
        fontStyle: 'italic',
    },

    // Coupon
    couponRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    couponText: {
        fontSize: 10,
        color: Colors.success,
        fontWeight: Typography.semiBold,
    },

    // Buttons
    actions: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 4,
    },
    btnOutline: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 7,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    btnOutlineText: {
        fontSize: 11.5,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    btnBook: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 7,
        borderRadius: Radii.md,
        backgroundColor: Colors.success,
        ...Shadows.card,
    },
    btnBookText: {
        fontSize: 11.5,
        fontWeight: Typography.extraBold,
        color: '#fff',
    },
});

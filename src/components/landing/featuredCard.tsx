import { Animated, TouchableOpacity, View, Text, StyleSheet, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Spacing, Colors, Radii, Shadows, Typography } from '../../theme/theme';
import { useRef } from 'react';
import useEntrance from '../../hooks/useEntrance';

const { width: W } = Dimensions.get('window');

// ── Venue type → accent color map ─────────────────────────────────────────────
const TYPE_ACCENT: Record<string, string> = {
    'Meeting Hall': Colors.primary,
    'Conference Hall': '#4A90E2',
    'Banquet Hall': '#E24A7A',
    'Function Hall': '#9B59B6',
    'Marriage Garden': '#27AE60',
    'Farm House': '#E67E22',
};

function usePressScale(to = 0.96) {
    const scale = useRef(new Animated.Value(1)).current;
    const onIn = () =>
        Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 30 }).start();
    const onOut = () =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22 }).start();
    return { scale, onIn, onOut };
}

// ── Props: accepts real venue object from API ─────────────────────────────────
interface Props {
    v: {
        _id: string;
        businessName: string;
        venueType: string[];
        capacity: string;
        rating: number;
        totalBookings: number;
        pricing: {
            perHour: { weekday: number; weekend: number };
        };
        images: Array<{ url: string; isFeatured: boolean }>;
        location: { city: string; area: string };
        status: string;
    };
    index: number;
    onPress: (venue: any) => void;
}

export default function FeaturedCard({ v, index, onPress }: Props) {
    const { fade, slide } = useEntrance(200 + index * 80);
    const { scale, onIn, onOut } = usePressScale();

    // ── Derived values ────────────────────────────────────────────────────────
    const primaryType = v.venueType?.[0] ?? 'Venue';
    const accent = TYPE_ACCENT[primaryType] ?? Colors.primary;
    const pricePerHour = v.pricing?.perHour?.weekday ?? 0;
    const hasRating = v.rating > 0;
    const isVerified = v.status === 'approved';

    return (
        <Animated.View
            style={{
                opacity: fade,
                transform: [{ translateY: slide }],
                marginRight: Spacing.md,
            }}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={() => onPress(v)}
                onPressIn={onIn}
                onPressOut={onOut}
            >
                <Animated.View style={[fc.card, { transform: [{ scale }] }]}>
                    {/* ── Coloured top section ── */}
                    <View style={[fc.top, { backgroundColor: Colors.charcoal }]}>
                        {/* Left accent bar in venue-type color */}
                        <View style={[fc.accentBar, { backgroundColor: accent }]} />

                        {/* Decorative orb */}
                        <View style={[fc.orb, { backgroundColor: accent + '22' }]} />

                        {/* Verified / Top badge */}
                        {isVerified && (
                            <View style={fc.badge}>
                                <Ionicons name="shield-checkmark" size={9} color={Colors.primary} />
                                <Text style={fc.badgeText}>VERIFIED</Text>
                            </View>
                        )}

                        {/* Type chip + Rating */}
                        <View style={fc.topBottom}>
                            <View style={[fc.typeChip, { borderColor: accent + '55' }]}>
                                <Text style={fc.typeText}>{primaryType}</Text>
                            </View>
                            <View style={fc.ratingChip}>
                                <Ionicons name="star" size={10} color={Colors.primary} />
                                <Text style={fc.ratingText}>
                                    {hasRating ? v.rating.toFixed(1) : 'New'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ── Body ── */}
                    <View style={fc.body}>
                        {/* Name */}
                        <Text style={fc.name} numberOfLines={1}>
                            {v.businessName}
                        </Text>

                        {/* Location */}
                        <View style={fc.metaRow}>
                            <Ionicons name="location-outline" size={12} color={Colors.primary} />
                            <Text style={fc.metaText} numberOfLines={1}>
                                {v.location?.area}, {v.location?.city}
                            </Text>
                        </View>

                        {/* Capacity */}
                        <View style={fc.metaRow}>
                            <Ionicons
                                name="people-outline"
                                size={12}
                                color={Colors.charcoalLight}
                            />
                            <Text style={fc.metaText}>Up to {v.capacity} guests</Text>
                        </View>

                        {/* Price + CTA */}
                        <View style={fc.footer}>
                            <View>
                                <Text style={fc.priceCaption}>from</Text>
                                <Text style={fc.price}>
                                    ₹{pricePerHour.toLocaleString()}
                                    <Text style={fc.priceUnit}>/hr</Text>
                                </Text>
                            </View>
                            <TouchableOpacity style={fc.cta} onPress={() => onPress(v)}>
                                <Text style={fc.ctaText}>View</Text>
                                <Ionicons name="arrow-forward" size={12} color={Colors.white} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const fc = StyleSheet.create({
    card: {
        width: W * 0.62,
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        overflow: 'hidden',
        ...Shadows.card,
    },
    top: {
        height: 140,
        padding: Spacing.md,
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
    orb: {
        position: 'absolute',
        top: -30,
        right: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: Radii.full,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: 0.6,
    },
    topBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    typeChip: {
        backgroundColor: 'rgba(255,255,255,0.10)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
    },
    typeText: {
        fontSize: 10,
        fontWeight: Typography.semiBold,
        color: 'rgba(255,255,255,0.80)',
    },
    ratingChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: Colors.surface,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Radii.full,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    body: { padding: Spacing.md },
    name: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        marginBottom: 5,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 4,
    },
    metaText: {
        fontSize: 11.5,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing.sm,
    },
    priceCaption: { fontSize: 9.5, color: Colors.charcoalLight },
    price: {
        fontSize: 17,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
        letterSpacing: -0.4,
    },
    priceUnit: {
        fontSize: 11,
        fontWeight: Typography.medium,
        color: Colors.charcoalLight,
    },
    cta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.charcoal,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: Radii.full,
    },
    ctaText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.white },
});

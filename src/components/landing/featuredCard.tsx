import { Animated, TouchableOpacity, View, Text, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Spacing, Colors, Radii, Shadows, Typography } from '../../theme/theme';
import { useRef } from 'react';
import useEntrance from '../../hooks/useEntrance';

const { width: W } = Dimensions.get('window');

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

interface Props {
    v: any;
    index: number;
    onPress: (venue: any) => void;
}

export default function FeaturedCard({ v, index, onPress }: Props) {
    const { fade, slide } = useEntrance(200 + index * 80);
    const { scale, onIn, onOut } = usePressScale();
    debugger
    const primaryType = v.venueType?.[0] ?? 'Venue';
    const accent = TYPE_ACCENT[primaryType] ?? Colors.primary;
    const pricePerHour = v.pricing?.perHour?.weekday ?? 0;
    const hasRating = v.rating > 0;
    const isVerified = v.status === 'approved';

    // ── Pick featured image, fallback to first image ──────────────────────────
    const bgImage =
        v.images?.find((img:any) => img.isFeatured)?.url ??
        v.images?.[0]?.url ??
        null;

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
                    {/* ── Image top section ── */}
                    <ImageBackground
                        source={bgImage ? { uri: bgImage } : undefined}
                        style={fc.top}
                        imageStyle={fc.topImage}
                        // Fallback bg if no image
                        defaultSource={undefined}
                    >
                        {/* Dark gradient scrim so text stays readable */}
                        <View style={fc.scrim} />

                        {/* Left accent bar */}
                        <View style={[fc.accentBar, { backgroundColor: accent }]} />

                        {/* Verified badge */}
                        {isVerified && (
                            <View style={fc.badge}>
                                <Ionicons name="shield-checkmark" size={9} color={Colors.primary} />
                                <Text style={fc.badgeText}>VERIFIED</Text>
                            </View>
                        )}

                        {/* Type chip + Rating */}
                        <View style={fc.topBottom}>
                            <View style={[fc.typeChip, { borderColor: accent + '99' }]}>
                                <Text style={fc.typeText}>{primaryType}</Text>
                            </View>
                            <View style={fc.ratingChip}>
                                <Ionicons name="star" size={10} color={Colors.primary} />
                                <Text style={fc.ratingText}>
                                    {hasRating ? v.rating.toFixed(1) : 'New'}
                                </Text>
                            </View>
                        </View>
                    </ImageBackground>

                    {/* ── Body ── */}
                    <View style={fc.body}>
                        <Text style={fc.name} numberOfLines={1}>
                            {v.businessName}
                        </Text>

                        <View style={fc.metaRow}>
                            <Ionicons name="location-outline" size={12} color={Colors.primary} />
                            <Text style={fc.metaText} numberOfLines={1}>
                                {v.location?.area}, {v.location?.city}
                            </Text>
                        </View>

                        <View style={fc.metaRow}>
                            <Ionicons name="people-outline" size={12} color={Colors.charcoalLight} />
                            <Text style={fc.metaText}>Up to {v.capacity} guests</Text>
                        </View>

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
        backgroundColor: Colors.charcoal, // fallback if no image
    },
    topImage: {
        resizeMode: 'cover',
    },
    // Dark scrim over the image so text/badges remain legible
    scrim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.38)',
    },
    accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
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
        backgroundColor: 'rgba(0,0,0,0.40)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Radii.full,
        borderWidth: 1,
    },
    typeText: {
        fontSize: 10,
        fontWeight: Typography.semiBold,
        color: 'rgba(255,255,255,0.90)',
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
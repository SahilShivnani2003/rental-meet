import {
    Animated,
    TouchableOpacity,
    View,
    Text,
    StyleSheet,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FEATURED } from '../../Data/landingData';
import { Spacing, Colors, Radii, Shadows, Typography } from '../../theme/theme';
import { useRef } from 'react';
import useEntrance from '../../hooks/useEntrance';

const { width: W, height: H } = Dimensions.get('window');

function usePressScale(to = 0.96) {
    const scale = useRef(new Animated.Value(1)).current;
    const onIn = () =>
        Animated.spring(scale, {
            toValue: to,
            useNativeDriver: true,
            speed: 30,
        }).start();
    const onOut = () =>
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 22,
        }).start();
    return { scale, onIn, onOut };
}

export default function FeaturedCard({
    v,
    index,
    onPress,
}: {
    v: (typeof FEATURED)[0];
    index: number;
    onPress: () => void;
}) {
    const { fade, slide } = useEntrance(200 + index * 80);
    const { scale, onIn, onOut } = usePressScale();

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
                onPress={onPress}
                onPressIn={onIn}
                onPressOut={onOut}
            >
                <Animated.View style={[fc.card, { transform: [{ scale }] }]}>
                    {/* Coloured top section */}
                    <View
                        style={[fc.top, { backgroundColor: Colors.charcoal }]}
                    >
                        {/* Accent bar */}
                        <View
                            style={[
                                fc.accentBar,
                                { backgroundColor: v.accent },
                            ]}
                        />
                        {/* Decorative orb */}
                        <View
                            style={[
                                fc.orb,
                                { backgroundColor: v.accent + '22' },
                            ]}
                        />
                        {/* Badge */}
                        {v.badge && (
                            <View style={fc.badge}>
                                <Ionicons
                                    name="star"
                                    size={9}
                                    color={Colors.primary}
                                />
                                <Text style={fc.badgeText}>{v.badge}</Text>
                            </View>
                        )}
                        {/* Type + Rating */}
                        <View style={fc.topBottom}>
                            <View style={fc.typeChip}>
                                <Text style={fc.typeText}>{v.type}</Text>
                            </View>
                            <View style={fc.ratingChip}>
                                <Ionicons
                                    name="star"
                                    size={10}
                                    color={Colors.primary}
                                />
                                <Text style={fc.ratingText}>{v.rating}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Body */}
                    <View style={fc.body}>
                        <Text style={fc.name} numberOfLines={1}>
                            {v.name}
                        </Text>
                        <View style={fc.metaRow}>
                            <Ionicons
                                name="people-outline"
                                size={12}
                                color={Colors.charcoalLight}
                            />
                            <Text style={fc.metaText}>
                                Up to {v.capacity} guests
                            </Text>
                        </View>
                        <View style={fc.footer}>
                            <View>
                                <Text style={fc.priceCaption}>from</Text>
                                <Text style={fc.price}>
                                    {v.price}
                                    <Text style={fc.priceUnit}>/hr</Text>
                                </Text>
                            </View>
                            <TouchableOpacity style={fc.cta} onPress={onPress}>
                                <Text style={fc.ctaText}>Book</Text>
                                <Ionicons
                                    name="arrow-forward"
                                    size={12}
                                    color={Colors.white}
                                />
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
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Radii.full,
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
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: Spacing.md,
    },
    metaText: {
        fontSize: 11.5,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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

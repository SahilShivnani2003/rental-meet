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
import { Colors, Radii, Shadows, Spacing, Typography } from '../../theme/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 2;

export default function VenueCard({ venue }: { venue: any }) {
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
                    <Image source={{ uri: venue.images[0]?.url }} style={styles.venueImage} />
                    <View style={styles.pricePill}>
                        <Text style={styles.priceText}>${venue.pricePerHour}</Text>
                        <Text style={styles.priceUnit}>/hr</Text>
                    </View>
                </View>
                <View style={styles.venueInfo}>
                    <Text style={styles.venueName} numberOfLines={1}>
                        {venue.businessName}
                    </Text>
                    <View style={styles.venueFooter}>
                        <View style={styles.locationRow}>
                            <Ionicons name="location" size={11} color={Colors.primary} />
                            <Text style={styles.venueLocation} numberOfLines={1}>
                                {venue.city}
                            </Text>
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

const styles = StyleSheet.create({    
    venueCard: {
        width: CARD_WIDTH,
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        overflow: 'hidden',
        ...Shadows.card,
    },
    venueImageWrapper: { position: 'relative' },
    venueImage: { width: '100%', height: 130, resizeMode: 'cover' },
    pricePill: {
        position: 'absolute',
        bottom: -14,
        right: 10,
        flexDirection: 'row',
        alignItems: 'baseline',
        backgroundColor: Colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radii.full,
        ...Shadows.primary,
    },
    priceText: { fontSize: Typography.md, fontWeight: Typography.extraBold, color: Colors.white },
    priceUnit: {
        fontSize: 10,
        fontWeight: Typography.semiBold,
        color: 'rgba(255,255,255,0.82)',
        marginLeft: 1,
    },
    venueInfo: { paddingHorizontal: 12, paddingTop: 20, paddingBottom: 12 },
    venueName: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginBottom: Spacing.sm,
        letterSpacing: -0.2,
    },
    venueFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
    venueLocation: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        flex: 1,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 10,
    },
    rating: { fontSize: Typography.sm, color: Colors.primaryDark, fontWeight: Typography.bold },
});

import { useRef, useEffect } from "react";
import { Animated, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Colors, Radii, Shadows, Spacing, Typography } from "../../theme/theme";
import { ROLES } from "../../types/Role";

export function RoleCard({
    role,
    index,
    onSelect,
}: {
    role: typeof ROLES[0];
    index: number;
    onSelect: (id: string) => void;
}) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                delay: 300 + index * 110,
                duration: 350,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                delay: 300 + index * 110,
                useNativeDriver: true,
                speed: 16,
                bounciness: 7,
            }),
        ]).start();
    }, []);

    const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
    const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 22 }).start();

    return (
        <Animated.View
            style={[
                styles.cardWrap,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
            ]}
        >
            {/* Most popular badge — Space Owner only */}
            {role.featured && (
                <View style={styles.featuredBadge}>
                    <Ionicons name="star" size={10} color={Colors.white} />
                    <Text style={styles.featuredBadgeText}>Most Popular</Text>
                </View>
            )}

            <TouchableOpacity
                style={styles.card}
                onPress={() => onSelect(role.id)}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={1}
            >
                {/* Colored left accent bar */}
                <View style={[styles.cardAccent, { backgroundColor: role.color }]} />

                <View style={styles.cardInner}>
                    {/* Icon + title row */}
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconWrap, { backgroundColor: role.bg }]}>
                            <Ionicons name={role.icon as any} size={26} color={role.color} />
                        </View>
                        <View style={styles.cardTitles}>
                            <Text style={styles.cardTitle}>{role.title}</Text>
                            <Text style={[styles.cardSubtitle, { color: role.color }]}>
                                {role.subtitle}
                            </Text>
                        </View>
                        <View style={[styles.arrowWrap, { backgroundColor: role.bg }]}>
                            <Ionicons name="arrow-forward" size={16} color={role.color} />
                        </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.cardDescription}>{role.description}</Text>

                    {/* Perks */}
                    <View style={styles.perksWrap}>
                        {role.perks.map((perk) => (
                            <View key={perk} style={styles.perkRow}>
                                <View style={[styles.perkDot, { backgroundColor: role.color }]} />
                                <Text style={styles.perkText}>{perk}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    cardWrap: {
        marginBottom: Spacing.md
    },
    featuredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-end',
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: Radii.full,
        marginBottom: -1,
        marginRight: 4, ...Shadows.primary
    },
    featuredBadgeText: {
        fontSize: 10,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.8,
        textTransform: 'uppercase'
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        flexDirection: 'row',
        overflow: 'hidden', ...Shadows.card
    },
    cardAccent: {
        width: 5
    },
    cardInner: {
        flex: 1,
        padding: Spacing.lg,
        gap: Spacing.sm
    },

    // Card header
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md
    },
    iconWrap: {
        width: 54,
        height: 54,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cardTitles: {
        flex: 1
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3
    },
    cardSubtitle: {
        fontSize: 12,
        fontWeight: Typography.bold,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        marginTop: 2
    },
    arrowWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cardDescription: {
        fontSize: 13,
        color: Colors.charcoalLight,
        lineHeight: 20
    },
    perksWrap: {
        gap: 6,
        paddingTop: Spacing.xxs
    },
    perkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm
    },
    perkDot: {
        width: 6,
        height: 6,
        borderRadius: 3
    },
    perkText: {
        fontSize: 12,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium
    },
})
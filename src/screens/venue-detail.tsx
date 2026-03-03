import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Animated,
    FlatList,
    Linking,
    StatusBar,
    Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigations/RootNavigation';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme/theme';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.42;

// ── Venue type — exported so RootNavigator & other files can import it ────────
export interface Venue {
    _id: string;
    businessName: string;
    venueType: string[];
    description: string;
    capacity: string;
    areaSqft: number;
    rating: number;
    reviewCount: number;
    totalBookings: number;
    location: {
        address: string;
        landmark: string;
        city: string;
        area: string;
        pincode: string;
        googleMapLink: string;
        parkingAvailability: string;
        nearestBusAuto: string;
        nearestMetroTrain: string;
    };
    pricing: {
        perHour: { weekday: number; weekend: number };
        halfDay: { weekday: number; weekend: number };
        fullDay: { weekday: number; weekend: number };
        extraHourRate: { weekday: number; weekend: number };
    };
    availability: {
        openingTime: string;
        closingTime: string;
        availableDays: string[];
        advanceBookingRule: string;
    };
    amenities: {
        kitchenAccess: { available: boolean; type: string; charges: number };
        diningArea: { available: boolean; type: string; charges: number };
        basic: Array<{ name: string; available: boolean; type: string; rate: number }>;
        beverages: Array<{ name: string; available: boolean; ratePerUnit: number; brand: string }>;
        refreshmentFood: Array<{
            name: string;
            available: boolean;
            ratePerPlate: number;
            items: string;
        }>;
        lunchThalis: Array<{
            type: string;
            available: boolean;
            ratePerPlate: number;
            itemNames: string;
        }>;
        additional: Array<{ name: string; available: boolean; type: string; charges: number }>;
    };
    images: Array<{ url: string; category: string; isFeatured: boolean }>;
    ownerInfo: { fullName: string; email: string; mobile: string; role: string };
    status: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'venueDetail'>;

const DAY_ABBR: Record<string, string> = {
    Monday: 'M',
    Tuesday: 'T',
    Wednesday: 'W',
    Thursday: 'T',
    Friday: 'F',
    Saturday: 'S',
    Sunday: 'S',
};
const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function SectionHeader({ title, icon }: { title: string; icon: string }) {
    return (
        <View style={shStyles.row}>
            <View style={shStyles.iconWrap}>
                <Ionicons name={icon as any} size={16} color={Colors.primary} />
            </View>
            <Text style={shStyles.title}>{title}</Text>
        </View>
    );
}
const shStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: Colors.primaryDim,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
});

function PriceRow({
    label,
    weekday,
    weekend,
}: {
    label: string;
    weekday: number;
    weekend: number;
}) {
    return (
        <View style={prStyles.row}>
            <Text style={prStyles.label}>{label}</Text>
            <View style={prStyles.right}>
                <View style={prStyles.pill}>
                    <Text style={prStyles.pillLabel}>Weekday</Text>
                    <Text style={prStyles.amount}>₹{weekday.toLocaleString()}</Text>
                </View>
                {weekend !== weekday && (
                    <View style={[prStyles.pill, prStyles.weekendPill]}>
                        <Text style={[prStyles.pillLabel, { color: Colors.charcoalLight }]}>
                            Weekend
                        </Text>
                        <Text style={[prStyles.amount, { color: Colors.charcoal }]}>
                            ₹{weekend.toLocaleString()}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}
const prStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    label: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    right: { flexDirection: 'row', gap: 8 },
    pill: {
        alignItems: 'flex-end',
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radii.sm,
    },
    weekendPill: { backgroundColor: Colors.background },
    pillLabel: {
        fontSize: 9,
        fontWeight: Typography.bold,
        color: Colors.primaryDark,
        letterSpacing: 0.5,
    },
    amount: {
        fontSize: Typography.base,
        fontWeight: Typography.extraBold,
        color: Colors.primaryDark,
    },
});

function AmenityChip({ name, type, rate }: { name: string; type: string; rate?: number }) {
    const isPaid = type === 'Paid';
    return (
        <View style={[acStyles.chip, isPaid && acStyles.chipPaid]}>
            <Ionicons
                name={isPaid ? 'card-outline' : 'checkmark-circle'}
                size={11}
                color={isPaid ? Colors.primary : Colors.success}
            />
            <Text style={[acStyles.name, isPaid && acStyles.namePaid]}>{name}</Text>
            {isPaid && rate && rate > 0 && <Text style={acStyles.rate}>₹{rate}</Text>}
        </View>
    );
}
const acStyles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: Radii.full,
        backgroundColor: Colors.successLight,
        marginBottom: 8,
    },
    chipPaid: { backgroundColor: Colors.primaryDim },
    name: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: Colors.success },
    namePaid: { color: Colors.primaryDark },
    rate: {
        fontSize: 9,
        fontWeight: Typography.bold,
        color: Colors.primary,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 6,
    },
});

function ThaliCard({ thali }: { thali: any }) {
    return (
        <View style={tcStyles.card}>
            <View style={tcStyles.header}>
                <Text style={tcStyles.type}>{thali.type}</Text>
                <Text style={tcStyles.price}>₹{thali.ratePerPlate}</Text>
            </View>
            <Text style={tcStyles.items} numberOfLines={2}>
                {thali.itemNames}
            </Text>
        </View>
    );
}
const tcStyles = StyleSheet.create({
    card: {
        width: 180,
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        padding: 14,
        marginRight: 10,
        borderWidth: 1.5,
        borderColor: Colors.border,
        ...Shadows.card,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    type: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        flex: 1,
    },
    price: { fontSize: Typography.md, fontWeight: Typography.extraBold, color: Colors.primary },
    items: { fontSize: Typography.sm, color: Colors.charcoalLight, lineHeight: 16 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function VenueDetailScreen({ route, navigation }: Props) {
    const { venue } = route.params;
    const scrollY = useRef(new Animated.Value(0)).current;
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'overview' | 'amenities' | 'food'>('overview');

    const { pricing, availability, amenities, location } = venue;

    const heroTranslate = scrollY.interpolate({
        inputRange: [0, HERO_HEIGHT],
        outputRange: [0, -HERO_HEIGHT * 0.3],
        extrapolate: 'clamp',
    });
    const headerOpacity = scrollY.interpolate({
        inputRange: [HERO_HEIGHT - 80, HERO_HEIGHT - 40],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });
    const heroOverlayOpacity = scrollY.interpolate({
        inputRange: [0, HERO_HEIGHT * 0.5],
        outputRange: [0.35, 0.7],
        extrapolate: 'clamp',
    });

    const formatTime = (t: string) => {
        const [h, m] = t.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${hour % 12 || 12}:${m} ${ampm}`;
    };

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Sticky header */}
            <Animated.View style={[s.stickyHeader, { opacity: headerOpacity }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.stickyBack}>
                    <Ionicons name="chevron-back" size={22} color={Colors.charcoal} />
                </TouchableOpacity>
                <Text style={s.stickyTitle} numberOfLines={1}>
                    {venue.businessName}
                </Text>
                <View style={{ width: 40 }} />
            </Animated.View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                    useNativeDriver: true,
                })}
                scrollEventThrottle={16}
            >
                {/* Hero carousel */}
                <View style={s.heroContainer}>
                    <Animated.View
                        style={[s.heroInner, { transform: [{ translateY: heroTranslate }] }]}
                    >
                        <FlatList
                            data={venue.images}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={e =>
                                setActiveImageIndex(
                                    Math.round(e.nativeEvent.contentOffset.x / width),
                                )
                            }
                            keyExtractor={(_, i) => String(i)}
                            renderItem={({ item }) => (
                                <Image source={{ uri: item.url }} style={s.heroImage} />
                            )}
                        />
                        <Animated.View style={[s.heroOverlay, { opacity: heroOverlayOpacity }]} />
                    </Animated.View>
                    <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={22} color={Colors.white} />
                    </TouchableOpacity>
                    <View style={s.imageCounter}>
                        <Ionicons name="images-outline" size={12} color={Colors.white} />
                        <Text style={s.imageCountText}>
                            {activeImageIndex + 1}/{venue.images.length}
                        </Text>
                    </View>
                    <View style={s.dotsRow}>
                        {venue.images.slice(0, 6).map((_, i) => (
                            <View key={i} style={[s.dot, i === activeImageIndex && s.dotActive]} />
                        ))}
                    </View>
                    {venue.status === 'approved' && (
                        <View style={s.verifiedBadge}>
                            <Ionicons name="shield-checkmark" size={12} color={Colors.white} />
                            <Text style={s.verifiedText}>Verified</Text>
                        </View>
                    )}
                </View>

                {/* Content card */}
                <View style={s.contentCard}>
                    {/* Title block */}
                    <View style={s.titleBlock}>
                        <View style={s.titleRow}>
                            <Text style={s.venueName}>{venue.businessName}</Text>
                            <View style={s.ratingBadge}>
                                <Ionicons name="star" size={13} color={Colors.primary} />
                                <Text style={s.ratingText}>
                                    {venue.rating > 0 ? venue.rating.toFixed(1) : 'New'}
                                </Text>
                            </View>
                        </View>
                        <View style={s.typeTags}>
                            {venue.venueType.map(t => (
                                <View key={t} style={s.typeTag}>
                                    <Text style={s.typeTagText}>{t}</Text>
                                </View>
                            ))}
                        </View>
                        <View style={s.statsRow}>
                            <View style={s.statItem}>
                                <Ionicons name="people-outline" size={15} color={Colors.primary} />
                                <Text style={s.statValue}>{venue.capacity}</Text>
                                <Text style={s.statLabel}>Capacity</Text>
                            </View>
                            <View style={s.statDivider} />
                            <View style={s.statItem}>
                                <Ionicons name="grid-outline" size={15} color={Colors.primary} />
                                <Text style={s.statValue}>{venue.areaSqft.toLocaleString()}</Text>
                                <Text style={s.statLabel}>Sq. Ft.</Text>
                            </View>
                            <View style={s.statDivider} />
                            <View style={s.statItem}>
                                <Ionicons
                                    name="bookmark-outline"
                                    size={15}
                                    color={Colors.primary}
                                />
                                <Text style={s.statValue}>{venue.totalBookings}</Text>
                                <Text style={s.statLabel}>Bookings</Text>
                            </View>
                            <View style={s.statDivider} />
                            <View style={s.statItem}>
                                <Ionicons name="star-outline" size={15} color={Colors.primary} />
                                <Text style={s.statValue}>{venue.reviewCount}</Text>
                                <Text style={s.statLabel}>Reviews</Text>
                            </View>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={s.tabRow}>
                        {(['overview', 'amenities', 'food'] as const).map(tab => (
                            <TouchableOpacity
                                key={tab}
                                style={[s.tab, activeTab === tab && s.tabActive]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Overview */}
                    {activeTab === 'overview' && (
                        <View style={s.tabContent}>
                            <View style={s.section}>
                                <SectionHeader title="About" icon="information-circle-outline" />
                                <Text style={s.description}>{venue.description}</Text>
                            </View>
                            <View style={s.section}>
                                <SectionHeader title="Location" icon="location-outline" />
                                <View style={s.locationCard}>
                                    <View style={s.locationMain}>
                                        <Text style={s.locationAddress}>{location.address}</Text>
                                        {!!location.landmark && (
                                            <Text style={s.locationLandmark}>
                                                {location.landmark}
                                            </Text>
                                        )}
                                        <Text style={s.locationCity}>
                                            {location.area}, {location.city} – {location.pincode}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={s.mapButton}
                                        onPress={() => Linking.openURL(location.googleMapLink)}
                                    >
                                        <Ionicons name="navigate" size={16} color={Colors.white} />
                                        <Text style={s.mapButtonText}>Maps</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={s.transitRow}>
                                    {[
                                        {
                                            icon: 'bus-outline',
                                            label: 'Bus / Auto',
                                            value: `${location.nearestBusAuto}m`,
                                        },
                                        {
                                            icon: 'train-outline',
                                            label: 'Metro / Rail',
                                            value: location.nearestMetroTrain,
                                        },
                                        {
                                            icon: 'car-outline',
                                            label: 'Parking',
                                            value: location.parkingAvailability,
                                        },
                                    ].map(tr => (
                                        <View key={tr.label} style={s.transitItem}>
                                            <View style={s.transitIcon}>
                                                <Ionicons
                                                    name={tr.icon as any}
                                                    size={14}
                                                    color={Colors.primary}
                                                />
                                            </View>
                                            <View>
                                                <Text style={s.transitLabel}>{tr.label}</Text>
                                                <Text style={s.transitValue}>{tr.value}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                            <View style={s.section}>
                                <SectionHeader title="Pricing" icon="pricetag-outline" />
                                <PriceRow
                                    label="Per Hour"
                                    weekday={pricing.perHour.weekday}
                                    weekend={pricing.perHour.weekend}
                                />
                                <PriceRow
                                    label="Half Day (4 hrs)"
                                    weekday={pricing.halfDay.weekday}
                                    weekend={pricing.halfDay.weekend}
                                />
                                <PriceRow
                                    label="Full Day (8 hrs)"
                                    weekday={pricing.fullDay.weekday}
                                    weekend={pricing.fullDay.weekend}
                                />
                                {pricing.extraHourRate.weekday > 0 && (
                                    <PriceRow
                                        label="Extra Hour"
                                        weekday={pricing.extraHourRate.weekday}
                                        weekend={pricing.extraHourRate.weekend}
                                    />
                                )}
                            </View>
                            <View style={s.section}>
                                <SectionHeader title="Availability" icon="calendar-outline" />
                                <View style={s.timeRow}>
                                    <View style={s.timeBox}>
                                        <Text style={s.timeLabel}>Opens</Text>
                                        <Text style={s.timeValue}>
                                            {formatTime(availability.openingTime)}
                                        </Text>
                                    </View>
                                    <View style={s.timeDash}>
                                        <View style={s.timeLine} />
                                        <Ionicons
                                            name="time-outline"
                                            size={18}
                                            color={Colors.primary}
                                        />
                                        <View style={s.timeLine} />
                                    </View>
                                    <View style={s.timeBox}>
                                        <Text style={s.timeLabel}>Closes</Text>
                                        <Text style={s.timeValue}>
                                            {formatTime(availability.closingTime)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={s.daysRow}>
                                    {ALL_DAYS.map(day => {
                                        const active = availability.availableDays.includes(day);
                                        return (
                                            <View
                                                key={day}
                                                style={[s.dayCircle, active && s.dayCircleActive]}
                                            >
                                                <Text
                                                    style={[s.dayAbbr, active && s.dayAbbrActive]}
                                                >
                                                    {DAY_ABBR[day]}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                                <View style={s.bookingRule}>
                                    <Ionicons
                                        name="alert-circle-outline"
                                        size={14}
                                        color={Colors.primary}
                                    />
                                    <Text style={s.bookingRuleText}>
                                        {availability.advanceBookingRule}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Amenities */}
                    {activeTab === 'amenities' && (
                        <View style={s.tabContent}>
                            <View style={s.section}>
                                <SectionHeader title="Facilities" icon="home-outline" />
                                <View style={s.facilityRow}>
                                    {[
                                        {
                                            icon: 'restaurant-outline',
                                            label: 'Kitchen',
                                            data: amenities.kitchenAccess,
                                        },
                                        {
                                            icon: 'cafe-outline',
                                            label: 'Dining',
                                            data: amenities.diningArea,
                                        },
                                    ].map(f => (
                                        <View
                                            key={f.label}
                                            style={[
                                                s.facilityCard,
                                                f.data.available && s.facilityCardActive,
                                            ]}
                                        >
                                            <Ionicons
                                                name={f.icon as any}
                                                size={22}
                                                color={
                                                    f.data.available
                                                        ? Colors.primary
                                                        : Colors.charcoalLight
                                                }
                                            />
                                            <Text style={s.facilityName}>{f.label}</Text>
                                            <Text
                                                style={[
                                                    s.facilityStatus,
                                                    !f.data.available && {
                                                        color: Colors.charcoalLight,
                                                    },
                                                ]}
                                            >
                                                {f.data.available
                                                    ? f.data.type === 'Paid'
                                                        ? `₹${f.data.charges}`
                                                        : 'Included'
                                                    : 'N/A'}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                            <View style={s.section}>
                                <SectionHeader
                                    title="Basic Amenities"
                                    icon="checkmark-done-outline"
                                />
                                <View style={s.chipsWrap}>
                                    {amenities.basic.map((item, i) => (
                                        <AmenityChip
                                            key={i}
                                            name={item.name}
                                            type={item.type}
                                            rate={item.rate}
                                        />
                                    ))}
                                </View>
                            </View>
                            {amenities.additional.length > 0 && (
                                <View style={s.section}>
                                    <SectionHeader
                                        title="Additional Services"
                                        icon="sparkles-outline"
                                    />
                                    <View style={s.chipsWrap}>
                                        {amenities.additional.map((item, i) => (
                                            <AmenityChip
                                                key={i}
                                                name={item.name}
                                                type={item.type}
                                                rate={item.charges}
                                            />
                                        ))}
                                    </View>
                                </View>
                            )}
                            {amenities.beverages.length > 0 && (
                                <View style={s.section}>
                                    <SectionHeader title="Beverages" icon="water-outline" />
                                    <View style={s.beverageGrid}>
                                        {amenities.beverages.map((b, i) => (
                                            <View key={i} style={s.beverageItem}>
                                                <Text style={s.beverageName}>{b.name}</Text>
                                                {!!b.brand && (
                                                    <Text style={s.beverageBrand}>{b.brand}</Text>
                                                )}
                                                <Text style={s.beveragePrice}>
                                                    ₹{b.ratePerUnit}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Food */}
                    {activeTab === 'food' && (
                        <View style={s.tabContent}>
                            {amenities.lunchThalis.length > 0 && (
                                <View style={s.section}>
                                    <SectionHeader title="Lunch Thalis" icon="nutrition-outline" />
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {amenities.lunchThalis.map((t, i) => (
                                            <ThaliCard key={i} thali={t} />
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                            {amenities.refreshmentFood.length > 0 && (
                                <View style={s.section}>
                                    <SectionHeader
                                        title="Refreshment Packs"
                                        icon="fast-food-outline"
                                    />
                                    {amenities.refreshmentFood.map((food, i) => (
                                        <View key={i} style={s.foodItem}>
                                            <View style={s.foodLeft}>
                                                <Text style={s.foodName}>{food.name}</Text>
                                                <Text style={s.foodItems}>{food.items}</Text>
                                            </View>
                                            <View style={s.foodPricePill}>
                                                <Text style={s.foodPriceLabel}>per plate</Text>
                                                <Text style={s.foodPrice}>
                                                    ₹{food.ratePerPlate}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    <View style={{ height: 110 }} />
                </View>
            </Animated.ScrollView>

            {/* CTA bar */}
            <View style={s.ctaBar}>
                <View>
                    <Text style={s.ctaPriceLabel}>Starting from</Text>
                    <View style={s.ctaPriceRow}>
                        <Text style={s.ctaPrice}>₹{pricing.perHour.weekday.toLocaleString()}</Text>
                        <Text style={s.ctaPriceUnit}>/hr</Text>
                    </View>
                </View>
                <TouchableOpacity style={s.ctaButton} activeOpacity={0.85}>
                    <Ionicons
                        name="calendar"
                        size={18}
                        color={Colors.white}
                        style={{ marginRight: 8 }}
                    />
                    <Text style={s.ctaButtonText}>Book Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 54 : 42,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
        ...Shadows.header,
    },
    stickyBack: {
        width: 40,
        height: 40,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stickyTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: Spacing.md,
    },
    heroContainer: { height: HERO_HEIGHT, overflow: 'hidden' },
    heroInner: { width, height: HERO_HEIGHT + 60 },
    heroImage: { width, height: HERO_HEIGHT + 60, resizeMode: 'cover' },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.black },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 54 : 42,
        left: Spacing.lg,
        width: 40,
        height: 40,
        borderRadius: Radii.md,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageCounter: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 54 : 42,
        right: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(0,0,0,0.45)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: Radii.full,
    },
    imageCountText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.white },
    dotsRow: {
        position: 'absolute',
        bottom: 16,
        alignSelf: 'center',
        flexDirection: 'row',
        gap: 5,
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
    dotActive: { width: 18, backgroundColor: Colors.primary },
    verifiedBadge: {
        position: 'absolute',
        bottom: 20,
        left: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.success,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radii.full,
    },
    verifiedText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.white },
    contentCard: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        marginTop: -Radii.xxl,
        paddingTop: Spacing.xl,
        minHeight: height,
    },
    titleBlock: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    venueName: {
        flex: 1,
        fontSize: Typography.xxl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
        marginRight: Spacing.md,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: Radii.sm,
    },
    ratingText: {
        fontSize: Typography.base,
        fontWeight: Typography.extraBold,
        color: Colors.primaryDark,
    },
    typeTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.lg },
    typeTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: Colors.surface,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
    },
    typeTagText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.primary,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        ...Shadows.card,
    },
    statItem: { flex: 1, alignItems: 'center', gap: 3 },
    statValue: {
        fontSize: Typography.md,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
    statLabel: {
        fontSize: 9,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalLight,
        letterSpacing: 0.3,
    },
    statDivider: { width: 1, backgroundColor: Colors.divider, marginVertical: 4 },
    tabRow: {
        flexDirection: 'row',
        marginHorizontal: Spacing.xl,
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: 4,
        marginBottom: Spacing.lg,
        ...Shadows.card,
    },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radii.md },
    tabActive: { backgroundColor: Colors.primary },
    tabText: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalLight,
    },
    tabTextActive: { color: Colors.white },
    tabContent: { paddingHorizontal: Spacing.xl },
    section: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadows.card,
    },
    description: {
        fontSize: Typography.md,
        color: Colors.charcoalMid,
        lineHeight: 22,
        letterSpacing: 0.1,
    },
    locationCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    locationMain: { flex: 1 },
    locationAddress: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
        marginBottom: 4,
    },
    locationLandmark: { fontSize: Typography.sm, color: Colors.charcoalLight, marginBottom: 2 },
    locationCity: { fontSize: Typography.sm, color: Colors.charcoalLight },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: Radii.md,
        ...Shadows.primary,
    },
    mapButtonText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.white },
    transitRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
    },
    transitItem: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    transitIcon: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: Colors.primaryDim,
        alignItems: 'center',
        justifyContent: 'center',
    },
    transitLabel: { fontSize: 9, color: Colors.charcoalLight, fontWeight: Typography.medium },
    transitValue: { fontSize: Typography.sm, color: Colors.charcoal, fontWeight: Typography.bold },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
        gap: Spacing.md,
    },
    timeBox: {
        alignItems: 'center',
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: Radii.md,
        minWidth: 100,
    },
    timeLabel: {
        fontSize: 9,
        fontWeight: Typography.bold,
        color: Colors.primaryDark,
        letterSpacing: 1,
    },
    timeValue: {
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.primaryDark,
    },
    timeDash: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timeLine: { width: 16, height: 1.5, backgroundColor: Colors.primaryBorder },
    daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
    dayCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    dayCircleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    dayAbbr: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.charcoalLight },
    dayAbbrActive: { color: Colors.white },
    bookingRule: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primaryDim,
        padding: Spacing.sm,
        borderRadius: Radii.md,
    },
    bookingRuleText: {
        fontSize: Typography.sm,
        color: Colors.primaryDark,
        fontWeight: Typography.medium,
    },
    facilityRow: { flexDirection: 'row', gap: 10 },
    facilityCard: {
        flex: 1,
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: Colors.border,
        gap: 4,
    },
    facilityCardActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primaryBorder },
    facilityName: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.charcoal },
    facilityStatus: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.primary,
    },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    beverageGrid: { gap: 8 },
    beverageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    beverageName: {
        flex: 1,
        fontSize: Typography.base,
        fontWeight: Typography.medium,
        color: Colors.charcoal,
    },
    beverageBrand: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        marginRight: Spacing.sm,
    },
    beveragePrice: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },
    foodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    foodLeft: { flex: 1 },
    foodName: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        marginBottom: 3,
    },
    foodItems: { fontSize: Typography.sm, color: Colors.charcoalLight },
    foodPricePill: {
        alignItems: 'flex-end',
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: Radii.sm,
    },
    foodPriceLabel: {
        fontSize: 9,
        fontWeight: Typography.bold,
        color: Colors.primaryDark,
        letterSpacing: 0.3,
    },
    foodPrice: {
        fontSize: Typography.md,
        fontWeight: Typography.extraBold,
        color: Colors.primaryDark,
    },
    ctaBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        ...Shadows.floating,
    },
    ctaPriceLabel: {
        fontSize: 10,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalLight,
        letterSpacing: 0.5,
    },
    ctaPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
    ctaPrice: {
        fontSize: Typography.xxl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
    ctaPriceUnit: {
        fontSize: Typography.base,
        fontWeight: Typography.medium,
        color: Colors.charcoalLight,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: Radii.full,
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    ctaButtonText: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.2,
    },
});

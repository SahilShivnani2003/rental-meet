import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    TextInput,
    StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme/theme';

const { width: W, height: H } = Dimensions.get('window');

// ─── Data ─────────────────────────────────────────────────────────────────────
const MOCK_USER = { initials: 'AJ', name: 'Alex' };

const KEY_STATS = [
    { value: '500+', label: 'Venues' },
    { value: '10K+', label: 'Bookings' },
    { value: '4.9', label: 'Rating' },
    { value: '24/7', label: 'Support' },
];

const CATEGORIES = [
    { icon: 'business-outline', label: 'Banquet', count: 12 },
    { icon: 'desktop-outline', label: 'Meeting', count: 28 },
    { icon: 'mic-outline', label: 'Auditorium', count: 7 },
    { icon: 'briefcase-outline', label: 'Board Room', count: 19 },
    { icon: 'sunny-outline', label: 'Outdoor', count: 5 },
    { icon: 'camera-outline', label: 'Studio', count: 9 },
];

const FEATURED = [
    {
        id: '1',
        name: 'BNSS Meeting Hall',
        type: 'Meeting Room',
        capacity: '500–600',
        price: 'Rs.1,000',
        rating: 4.5,
        accent: Colors.info,
        badge: 'Featured',
    },
    {
        id: '2',
        name: 'Luxury Grand Palace',
        type: 'Banquet Hall',
        capacity: '500–600',
        price: 'Rs.4,500',
        rating: 4.8,
        accent: Colors.success,
        badge: 'Top Rated',
    },
    {
        id: '3',
        name: 'Rooftop Lounge',
        type: 'Event Space',
        capacity: '100–200',
        price: 'Rs.2,000',
        rating: 4.3,
        accent: Colors.primary,
        badge: null,
    },
];

const AMENITIES = [
    { icon: 'wifi-outline', label: 'High-Speed WiFi' },
    { icon: 'tv-outline', label: 'HD Projection' },
    { icon: 'restaurant-outline', label: 'Gourmet Catering' },
    { icon: 'shield-checkmark-outline', label: '24/7 Security' },
    { icon: 'car-outline', label: 'Ample Parking' },
    { icon: 'headset-outline', label: 'Tech Support' },
    { icon: 'snow-outline', label: 'Climate Control' },
    { icon: 'cafe-outline', label: 'Refreshments' },
];

const PACKAGES = [
    {
        label: '1 Hour',
        price: 'Rs.1,000',
        subtext: 'up to Rs.5,000',
        icon: 'time-outline',
        featured: false,
    },
    {
        label: '2 Hours',
        price: 'Rs.1,800',
        subtext: 'up to Rs.9,000',
        icon: 'time-outline',
        featured: false,
    },
    {
        label: '4 Hours',
        price: 'Rs.3,000',
        subtext: 'up to Rs.15,000',
        icon: 'hourglass-outline',
        featured: true,
    },
    {
        label: 'Full Day',
        price: 'Rs.6,000',
        subtext: 'up to Rs.30,000',
        icon: 'calendar-outline',
        featured: false,
    },
];

const TESTIMONIALS = [
    {
        initials: 'RK',
        name: 'Rajesh Kumar',
        role: 'CEO, Tech Corp',
        stars: 5,
        text: 'RentalMeet transformed how we organize meetings. Premium spaces, seamless experience.',
    },
    {
        initials: 'SS',
        name: 'Sneha Sharma',
        role: 'Event Director, Bloom',
        stars: 5,
        text: 'Unmatched attention to detail and premium facilities. Highly recommend for any event!',
    },
    {
        initials: 'AP',
        name: 'Amit Patel',
        role: 'Founder, Startup Hub',
        stars: 5,
        text: 'Finding quality spaces was always a challenge until RentalMeet. Truly professional.',
    },
];

// ─── Entrance animation hook ──────────────────────────────────────────────────
function useEntrance(delay = 0) {
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(24)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, {
                toValue: 1,
                delay,
                duration: 360,
                useNativeDriver: true,
            }),
            Animated.spring(slide, {
                toValue: 0,
                delay,
                useNativeDriver: true,
                speed: 14,
                bounciness: 5,
            }),
        ]).start();
    }, []);
    return { fade, slide };
}

// ─── Press scale helper ───────────────────────────────────────────────────────
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

// ─── Featured venue card ──────────────────────────────────────────────────────
function FeaturedCard({
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

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LandingScreen() {
    const navigation = useNavigation<any>();
    const [search, setSearch] = useState('');

    const { fade: heroFade, slide: heroSlide } = useEntrance(0);
    const { fade: bodyFade } = useEntrance(180);
    const heroScale = useRef(new Animated.Value(1.06)).current;

    useEffect(() => {
        StatusBar.setBarStyle('light-content');
        Animated.spring(heroScale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 5,
            bounciness: 2,
        }).start();
    }, []);

    const goToVenues = () => navigation.navigate('venues');
    const goToProfile = () => navigation.navigate('profile');

    return (
        <View style={s.root}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scroll}
            >
                <View style={s.hero}>
                    {/* Dark background */}
                    <Animated.View
                        style={[
                            StyleSheet.absoluteFill,
                            { transform: [{ scale: heroScale }] },
                        ]}
                    >
                        <View style={s.heroBg} />
                        {/* Subtle amber diagonal lines */}
                        <View style={s.diag1} />
                        <View style={s.diag2} />
                        {/* Bottom amber glow */}
                        <View style={s.heroGlow} />
                    </Animated.View>

                    {/* ── Navbar ── */}
                    <Animated.View style={[s.navbar, { opacity: heroFade }]}>
                        {/* Brand */}
                        <View style={s.brand}>
                            <View style={s.brandDot}>
                                <Ionicons
                                    name="location"
                                    size={12}
                                    color={Colors.charcoal}
                                />
                            </View>
                            <Text style={s.brandName}>
                                <Text style={{ color: Colors.primary }}>
                                    Rental
                                </Text>
                                <Text style={{ color: Colors.white }}>
                                    Meet
                                </Text>
                            </Text>
                        </View>

                        {/* Nav icons */}
                        <View style={s.navIcons}>
                            {/* Messages */}
                            <TouchableOpacity
                                style={s.navIconBtn}
                                onPress={() => navigation.navigate('messages')}
                            >
                                <Ionicons
                                    name="chatbubble-outline"
                                    size={18}
                                    color={Colors.white}
                                />
                            </TouchableOpacity>

                            {/* Notifications */}
                            <TouchableOpacity style={s.navIconBtn}>
                                <Ionicons
                                    name="notifications-outline"
                                    size={18}
                                    color={Colors.white}
                                />
                                <View style={s.notifDot} />
                            </TouchableOpacity>

                            {/* Profile */}
                            <TouchableOpacity
                                style={s.profilePill}
                                onPress={goToProfile}
                                activeOpacity={0.85}
                            >
                                <View style={s.profileAvatar}>
                                    <Text style={s.profileInitials}>
                                        {MOCK_USER.initials}
                                    </Text>
                                </View>
                                <Text style={s.profileName}>
                                    {MOCK_USER.name}
                                </Text>
                                <Ionicons
                                    name="chevron-down"
                                    size={11}
                                    color="rgba(255,255,255,0.6)"
                                />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* ── Hero copy ── */}
                    <Animated.View
                        style={[
                            s.heroBody,
                            {
                                opacity: heroFade,
                                transform: [{ translateY: heroSlide }],
                            },
                        ]}
                    >
                        {/* Location pill */}
                        <View style={s.locationPill}>
                            <Ionicons
                                name="location"
                                size={11}
                                color={Colors.primary}
                            />
                            <Text style={s.locationPillText}>
                                BHOPAL, MADHYA PRADESH
                            </Text>
                        </View>

                        <Text style={s.heroTitle}>
                            Book Your{'\n'}Perfect Space
                        </Text>
                        <Text style={s.heroHighlight}>with RentalMeet</Text>
                        <Text style={s.heroSub}>
                            Premium venues for 1000+ guests.{'\n'}Hourly
                            bookings, world-class hospitality.
                        </Text>

                        {/* CTA row */}
                        <View style={s.heroCtaRow}>
                            <TouchableOpacity
                                style={s.ctaPrimary}
                                onPress={goToVenues}
                                activeOpacity={0.88}
                            >
                                <Text style={s.ctaPrimaryText}>
                                    Browse Venues
                                </Text>
                                <Ionicons
                                    name="arrow-forward"
                                    size={15}
                                    color={Colors.charcoal}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={s.ctaGhost}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name="play-circle-outline"
                                    size={18}
                                    color={Colors.white}
                                />
                                <Text style={s.ctaGhostText}>How it works</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* ── Stats strip (overlaps hero / search card) ── */}
                    <Animated.View
                        style={[s.statsStrip, { opacity: heroFade }]}
                    >
                        {KEY_STATS.map((st, i) => (
                            <View
                                key={i}
                                style={[
                                    s.statItem,
                                    i < KEY_STATS.length - 1 && s.statBorder,
                                ]}
                            >
                                <Text style={s.statValue}>{st.value}</Text>
                                <Text style={s.statLabel}>{st.label}</Text>
                            </View>
                        ))}
                    </Animated.View>
                </View>

                {/* SEARCH CARD */}
                <Animated.View style={[s.searchCard, { opacity: bodyFade }]}>
                    {/* Amber accent top bar */}
                    <View style={s.searchAccent} />

                    <View style={s.searchBody}>
                        <Text style={s.searchHeading}>Find Your Venue</Text>

                        {/* Input */}
                        <View style={s.searchInputWrap}>
                            <Ionicons
                                name="search-outline"
                                size={17}
                                color={Colors.charcoalLight}
                            />
                            <TextInput
                                style={s.searchInput}
                                placeholder="Search by name, type or city..."
                                placeholderTextColor={Colors.charcoalLight}
                                value={search}
                                onChangeText={setSearch}
                                onSubmitEditing={goToVenues}
                                returnKeyType="search"
                            />
                            {search.length > 0 && (
                                <TouchableOpacity onPress={() => setSearch('')}>
                                    <Ionicons
                                        name="close-circle"
                                        size={16}
                                        color={Colors.charcoalLight}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Filter chips */}
                        <View style={s.filterRow}>
                            {[
                                { icon: 'location-outline', label: 'Bhopal' },
                                { icon: 'people-outline', label: 'Capacity' },
                                { icon: 'calendar-outline', label: 'Date' },
                            ].map(f => (
                                <TouchableOpacity
                                    key={f.label}
                                    style={s.filterChip}
                                    activeOpacity={0.75}
                                >
                                    <Ionicons
                                        name={f.icon as any}
                                        size={13}
                                        color={Colors.primary}
                                    />
                                    <Text style={s.filterChipText}>
                                        {f.label}
                                    </Text>
                                    <Ionicons
                                        name="chevron-down"
                                        size={11}
                                        color={Colors.charcoalLight}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Search button */}
                        <TouchableOpacity
                            style={s.searchBtn}
                            onPress={goToVenues}
                            activeOpacity={0.88}
                        >
                            <Ionicons
                                name="search"
                                size={16}
                                color={Colors.charcoal}
                            />
                            <Text style={s.searchBtnText}>Search Venues</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* CATEGORIES*/}
                <Animated.View style={[s.section, { opacity: bodyFade }]}>
                    <View style={s.sectionHeader}>
                        <View style={s.sectionTitleRow}>
                            <View style={s.accentBar} />
                            <Text style={s.sectionTitle}>
                                Browse by Category
                            </Text>
                        </View>
                        <TouchableOpacity onPress={goToVenues}>
                            <Text style={s.seeAll}>See all →</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 2-row grid of 3 */}
                    <View style={s.catGrid}>
                        {CATEGORIES.map((cat, i) => (
                            <TouchableOpacity
                                key={i}
                                style={s.catCard}
                                onPress={goToVenues}
                                activeOpacity={0.8}
                            >
                                <View style={s.catIconWrap}>
                                    <Ionicons
                                        name={cat.icon as any}
                                        size={22}
                                        color={Colors.primary}
                                    />
                                </View>
                                <Text style={s.catLabel}>{cat.label}</Text>
                                <Text style={s.catCount}>{cat.count}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                {/*FEATURED VENUES */}
                <View style={[s.section, s.surfaceSection]}>
                    {/* Section heading */}
                    <View style={s.sectionHeader}>
                        <View style={s.sectionTitleRow}>
                            <View style={s.accentBar} />
                            <Text style={s.sectionTitle}>Featured Venues</Text>
                        </View>
                        <TouchableOpacity onPress={goToVenues}>
                            <Text style={s.seeAll}>See all →</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={s.sectionSub}>
                        Handpicked premium spaces for your events
                    </Text>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={s.hScroll}
                    >
                        {FEATURED.map((v, i) => (
                            <FeaturedCard
                                key={v.id}
                                v={v}
                                index={i}
                                onPress={goToVenues}
                            />
                        ))}
                    </ScrollView>

                    <TouchableOpacity
                        style={s.viewAllBtn}
                        onPress={goToVenues}
                        activeOpacity={0.85}
                    >
                        <Text style={s.viewAllBtnText}>View All Venues</Text>
                        <Ionicons
                            name="arrow-forward"
                            size={14}
                            color={Colors.white}
                        />
                    </TouchableOpacity>
                </View>

                {/*AMENITIES*/}
                <View style={s.section}>
                    <View style={s.centeredHead}>
                        <Text style={s.eyebrow}>FACILITIES</Text>
                        <Text style={s.centeredTitle}>
                            Unparalleled Amenities
                        </Text>
                        <Text style={s.centeredSub}>
                            Every space comes equipped to ensure your meeting
                            runs flawlessly.
                        </Text>
                    </View>

                    <View style={s.amenGrid}>
                        {AMENITIES.map((a, i) => (
                            <View key={i} style={s.amenCard}>
                                <View style={s.amenIconWrap}>
                                    <Ionicons
                                        name={a.icon as any}
                                        size={20}
                                        color={Colors.primary}
                                    />
                                </View>
                                <Text style={s.amenLabel}>{a.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/*PRICING PACKAGES*/}
                <View style={[s.section, s.surfaceSection]}>
                    <View style={s.centeredHead}>
                        <Text style={s.eyebrow}>PRICING</Text>
                        <Text style={s.centeredTitle}>Flexible Packages</Text>
                        <Text style={s.centeredSub}>
                            Choose a duration that fits your schedule.
                        </Text>
                    </View>

                    <View style={s.pkgList}>
                        {PACKAGES.map((p, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[
                                    s.pkgRow,
                                    p.featured && s.pkgRowFeatured,
                                ]}
                                onPress={goToVenues}
                                activeOpacity={0.88}
                            >
                                {/* Left: icon + label */}
                                <View
                                    style={[
                                        s.pkgIconWrap,
                                        p.featured && s.pkgIconFeatured,
                                    ]}
                                >
                                    <Ionicons
                                        name={p.icon as any}
                                        size={18}
                                        color={
                                            p.featured
                                                ? Colors.white
                                                : Colors.primary
                                        }
                                    />
                                </View>
                                <View style={s.pkgMid}>
                                    <View style={s.pkgLabelRow}>
                                        <Text
                                            style={[
                                                s.pkgLabel,
                                                p.featured && s.textWhite,
                                            ]}
                                        >
                                            {p.label}
                                        </Text>
                                        {p.featured && (
                                            <View style={s.popularBadge}>
                                                <Text
                                                    style={s.popularBadgeText}
                                                >
                                                    Popular
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text
                                        style={[
                                            s.pkgSubtext,
                                            p.featured && s.pkgSubtextFeatured,
                                        ]}
                                    >
                                        {p.subtext}
                                    </Text>
                                </View>
                                {/* Right: price + chevron */}
                                <View style={s.pkgRight}>
                                    <Text
                                        style={[
                                            s.pkgPrice,
                                            p.featured && s.textWhite,
                                        ]}
                                    >
                                        {p.price}
                                    </Text>
                                    <Text
                                        style={[
                                            s.pkgPriceUnit,
                                            p.featured && {
                                                color: 'rgba(255,255,255,0.65)',
                                            },
                                        ]}
                                    >
                                        /hr
                                    </Text>
                                </View>
                                <Ionicons
                                    name="chevron-forward"
                                    size={15}
                                    color={
                                        p.featured
                                            ? 'rgba(255,255,255,0.5)'
                                            : Colors.border
                                    }
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* TESTIMONIALS*/}
                <View style={s.section}>
                    <View style={s.centeredHead}>
                        <Text style={s.eyebrow}>TESTIMONIALS</Text>
                        <Text style={s.centeredTitle}>What Clients Say</Text>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={s.hScroll}
                    >
                        {TESTIMONIALS.map((t, i) => (
                            <View key={i} style={s.testiCard}>
                                {/* Top: avatar + info */}
                                <View style={s.testiTop}>
                                    <View style={s.testiAvatar}>
                                        <Text style={s.testiAvatarText}>
                                            {t.initials}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.testiName}>
                                            {t.name}
                                        </Text>
                                        <Text style={s.testiRole}>
                                            {t.role}
                                        </Text>
                                    </View>
                                    <View style={s.testiStars}>
                                        {[1, 2, 3, 4, 5].map(j => (
                                            <Ionicons
                                                key={j}
                                                name="star"
                                                size={11}
                                                color={Colors.primary}
                                            />
                                        ))}
                                    </View>
                                </View>
                                {/* Divider */}
                                <View style={s.testiDivider} />
                                {/* Quote */}
                                <Text style={s.quoteMark}>"</Text>
                                <Text style={s.testiText}>{t.text}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* BOTTOM CTA BANNER */}
                <View style={s.ctaBannerWrap}>
                    <View style={s.ctaBanner}>
                        {/* Decorative orbs */}
                        <View style={s.orb1} />
                        <View style={s.orb2} />

                        <View style={s.ctaInner}>
                            <View style={s.ctaIconCircle}>
                                <Ionicons
                                    name="business"
                                    size={28}
                                    color={Colors.primary}
                                />
                            </View>

                            <Text style={s.ctaTitle}>
                                Ready to Book{'\n'}Your Venue?
                            </Text>
                            <Text style={s.ctaSub}>
                                Browse our collection and find the perfect space
                                for your next event.
                            </Text>

                            <View style={s.ctaBtnRow}>
                                <TouchableOpacity
                                    style={s.ctaMainBtn}
                                    onPress={goToVenues}
                                    activeOpacity={0.85}
                                >
                                    <Text style={s.ctaMainBtnText}>
                                        Browse All Venues
                                    </Text>
                                    <View style={s.ctaBtnArrow}>
                                        <Ionicons
                                            name="arrow-forward"
                                            size={14}
                                            color={Colors.primary}
                                        />
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* Inline profile link */}
                            <TouchableOpacity
                                style={s.ctaProfileLink}
                                onPress={goToProfile}
                                activeOpacity={0.8}
                            >
                                <View style={s.ctaProfileAvatar}>
                                    <Text style={s.ctaProfileInitials}>
                                        {MOCK_USER.initials}
                                    </Text>
                                </View>
                                <Text style={s.ctaProfileText}>
                                    View your profile
                                </Text>
                                <Ionicons
                                    name="arrow-forward"
                                    size={13}
                                    color={Colors.primary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CAT_W = (W - Spacing.lg * 2 - Spacing.sm * 2) / 3;
const AMEN_W = (W - Spacing.lg * 2 - Spacing.sm) / 2;

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingBottom: 120 },

    // ── Hero ────────────────────────────────────────────────────────────────────
    hero: {
        height: H * 0.6,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },

    heroBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#1A1208',
    },
    diag1: {
        position: 'absolute',
        top: '28%',
        left: -60,
        width: W * 1.5,
        height: 1.5,
        backgroundColor: 'rgba(245,166,35,0.13)',
        transform: [{ rotate: '-9deg' }],
    },
    diag2: {
        position: 'absolute',
        top: '48%',
        left: -60,
        width: W * 1.5,
        height: 1,
        backgroundColor: 'rgba(245,166,35,0.07)',
        transform: [{ rotate: '-9deg' }],
    },
    heroGlow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
        backgroundColor: 'rgba(245,166,35,0.05)',
    },

    // Navbar
    navbar: {
        position: 'absolute',
        top: 52,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    brand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    brandDot: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandName: {
        fontSize: 20,
        fontWeight: Typography.extraBold,
        letterSpacing: -0.4,
    },
    navIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    navIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    notifDot: {
        position: 'absolute',
        top: 7,
        right: 7,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.danger,
        borderWidth: 1.5,
        borderColor: '#1A1208',
    },

    // Profile pill
    profilePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.10)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
        paddingLeft: 4,
        paddingRight: 10,
        paddingVertical: 4,
        borderRadius: Radii.full,
    },
    profileAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInitials: {
        fontSize: 10,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
    profileName: {
        fontSize: 12,
        fontWeight: Typography.bold,
        color: Colors.white,
    },

    // Hero body
    heroBody: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 80,
    },
    locationPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(245,166,35,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(245,166,35,0.28)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radii.full,
        marginBottom: 14,
    },
    locationPillText: {
        fontSize: 9,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: 2,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        lineHeight: 38,
        letterSpacing: -0.8,
    },
    heroHighlight: {
        fontSize: 32,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
        lineHeight: 42,
        letterSpacing: -0.8,
        marginBottom: 12,
    },
    heroSub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.50)',
        lineHeight: 20,
        marginBottom: 24,
    },
    heroCtaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    ctaPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 13,
        borderRadius: Radii.full,
        ...Shadows.primary,
    },
    ctaPrimaryText: {
        fontSize: 13.5,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: 0.2,
    },
    ctaGhost: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ctaGhostText: {
        fontSize: 12.5,
        fontWeight: Typography.medium,
        color: 'rgba(255,255,255,0.60)',
    },

    // Stats strip (floats at bottom of hero)
    statsStrip: {
        position: 'absolute',
        bottom: 0,
        left: Spacing.lg,
        right: Spacing.lg,
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xl,
        borderTopRightRadius: Radii.xl,
        paddingVertical: 14,
        ...Shadows.card,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statBorder: { borderRightWidth: 1, borderRightColor: Colors.border },
    statValue: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: 10,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        marginTop: 2,
    },

    // ── Search card ──────────────────────────────────────────────────────────────
    searchCard: {
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.lg,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        marginBottom: Spacing.xl,
        ...Shadows.floating,
    },
    searchAccent: {
        height: 4,
        backgroundColor: Colors.primary,
        borderRadius: 2,
        marginHorizontal: Spacing.xl,
        marginTop: Spacing.md,
    },
    searchBody: { padding: Spacing.xl, paddingTop: Spacing.md },
    searchHeading: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        marginBottom: Spacing.md,
        letterSpacing: -0.3,
    },
    searchInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        paddingHorizontal: 14,
        height: 50,
        borderWidth: 1.5,
        borderColor: Colors.border,
        marginBottom: Spacing.sm,
    },
    searchInput: { flex: 1, fontSize: 14, color: Colors.charcoal },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
    filterChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.md,
        paddingHorizontal: 8,
        height: 38,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    filterChipText: {
        flex: 1,
        fontSize: 10.5,
        color: Colors.primaryDark,
        fontWeight: Typography.semiBold,
    },
    searchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        borderRadius: Radii.md,
        height: 50,
        ...Shadows.primary,
    },
    searchBtnText: {
        fontSize: 14.5,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },

    // ── Generic section ──────────────────────────────────────────────────────────
    section: { paddingHorizontal: Spacing.lg, paddingVertical: 26 },
    surfaceSection: { backgroundColor: Colors.surface },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    accentBar: {
        width: 4,
        height: 22,
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.4,
    },
    sectionSub: {
        fontSize: 12.5,
        color: Colors.charcoalLight,
        marginBottom: Spacing.lg,
        marginLeft: 14,
    },
    seeAll: {
        fontSize: 13,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },
    hScroll: { paddingBottom: 4 },

    // Centered heading (for sections without row layout)
    centeredHead: { alignItems: 'center', marginBottom: 20 },
    eyebrow: {
        fontSize: 9.5,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: 2.5,
        marginBottom: 6,
    },
    centeredTitle: {
        fontSize: 20,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    centeredSub: {
        fontSize: 12.5,
        color: Colors.charcoalLight,
        textAlign: 'center',
        lineHeight: 19,
        paddingHorizontal: Spacing.xl,
    },

    // ── Categories ───────────────────────────────────────────────────────────────
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    catCard: {
        width: CAT_W,
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        padding: Spacing.md,
        alignItems: 'center',
        gap: Spacing.sm,
        ...Shadows.card,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    catIconWrap: {
        width: 50,
        height: 50,
        borderRadius: Radii.lg,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
    },
    catLabel: {
        fontSize: 11.5,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        textAlign: 'center',
    },
    catCount: {
        fontSize: 10.5,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },

    // View all
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.charcoal,
        borderRadius: Radii.full,
        paddingVertical: 14,
        marginTop: Spacing.lg,
    },
    viewAllBtnText: {
        fontSize: 14,
        fontWeight: Typography.extraBold,
        color: Colors.white,
    },

    // ── Amenities ────────────────────────────────────────────────────────────────
    amenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    amenCard: {
        width: AMEN_W,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: 12,
        ...Shadows.card,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    amenIconWrap: {
        width: 40,
        height: 40,
        borderRadius: Radii.md,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    amenLabel: {
        flex: 1,
        fontSize: 12,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        lineHeight: 16,
    },

    // ── Packages (list layout) ────────────────────────────────────────────────────
    pkgList: { gap: Spacing.sm },
    pkgRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: Colors.background,
        borderRadius: Radii.xl,
        padding: Spacing.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    pkgRowFeatured: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    pkgIconWrap: {
        width: 44,
        height: 44,
        borderRadius: Radii.md,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pkgIconFeatured: { backgroundColor: 'rgba(255,255,255,0.25)' },
    pkgMid: { flex: 1 },
    pkgLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 3,
    },
    pkgLabel: {
        fontSize: 15,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    popularBadge: {
        backgroundColor: Colors.charcoal,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: Radii.full,
    },
    popularBadgeText: {
        fontSize: 8.5,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: 0.4,
    },
    pkgSubtext: {
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    pkgSubtextFeatured: { color: 'rgba(255,255,255,0.65)' },
    pkgRight: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 1,
        marginRight: Spacing.xs,
    },
    pkgPrice: {
        fontSize: 17,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
        letterSpacing: -0.4,
    },
    pkgPriceUnit: {
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    textWhite: { color: Colors.white },

    // ── Testimonials ─────────────────────────────────────────────────────────────
    testiCard: {
        width: W * 0.76,
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        marginRight: 12,
        ...Shadows.card,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    testiTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    testiAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.charcoal,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    testiAvatarText: {
        fontSize: 13,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
    },
    testiName: {
        fontSize: 13,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    testiRole: { fontSize: 10.5, color: Colors.charcoalLight, marginTop: 2 },
    testiStars: { flexDirection: 'row', gap: 2 },
    testiDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginBottom: 10,
    },
    quoteMark: {
        fontSize: 36,
        lineHeight: 32,
        color: Colors.primaryBorder,
        fontWeight: Typography.extraBold,
        marginBottom: 4,
    },
    testiText: { fontSize: 12.5, color: Colors.charcoalMid, lineHeight: 19 },

    // ── CTA banner ───────────────────────────────────────────────────────────────
    ctaBannerWrap: { paddingHorizontal: Spacing.lg },
    ctaBanner: {
        backgroundColor: Colors.charcoal,
        borderRadius: Radii.xxl,
        overflow: 'hidden',
        ...Shadows.floating,
    },
    orb1: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(245,166,35,0.09)',
    },
    orb2: {
        position: 'absolute',
        bottom: -40,
        left: -40,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(245,166,35,0.06)',
    },
    ctaInner: { padding: 28, alignItems: 'center' },
    ctaIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(245,166,35,0.14)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(245,166,35,0.24)',
    },
    ctaTitle: {
        fontSize: 23,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        textAlign: 'center',
        letterSpacing: -0.5,
        lineHeight: 31,
        marginBottom: 10,
    },
    ctaSub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.50)',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 22,
        paddingHorizontal: Spacing.sm,
    },
    ctaBtnRow: { width: '100%', marginBottom: Spacing.lg },
    ctaMainBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: Radii.full,
        ...Shadows.primary,
    },
    ctaMainBtnText: {
        fontSize: 14.5,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: 0.2,
    },
    ctaBtnArrow: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.charcoal,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaProfileLink: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    ctaProfileAvatar: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(245,166,35,0.20)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(245,166,35,0.30)',
    },
    ctaProfileInitials: {
        fontSize: 9,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
    },
    ctaProfileText: {
        fontSize: 12.5,
        fontWeight: Typography.semiBold,
        color: 'rgba(255,255,255,0.65)',
    },
});
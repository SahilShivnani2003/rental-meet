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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme/theme';

const { width: W } = Dimensions.get('window');

// ─── Data ─────────────────────────────────────────────────────────────────────
const SERVICES = [
    // ── Catering ──────────────────────────────────────────────────────────────
    {
        id: 'c1',
        category: 'Catering',
        categoryIcon: 'restaurant-outline',
        categoryColor: '#E67E22',
        name: 'Royal Feast Catering',
        tagline: 'Multi-cuisine corporate & wedding menus',
        icon: 'restaurant',
        rating: 4.8,
        reviews: 124,
        priceLabel: 'from Rs.350/plate',
        tags: ['Multi-Cuisine', 'Veg & Non-Veg', 'Live Counters'],
        badge: 'Top Rated',
    },
    {
        id: 'c2',
        category: 'Catering',
        categoryIcon: 'restaurant-outline',
        categoryColor: '#E67E22',
        name: 'Gourmet Kitchen',
        tagline: 'Continental & Indian fine dining experience',
        icon: 'fast-food',
        rating: 4.6,
        reviews: 89,
        priceLabel: 'from Rs.500/plate',
        tags: ['Continental', 'Fine Dining', 'Custom Menu'],
        badge: null,
    },
    {
        id: 'c3',
        category: 'Catering',
        categoryIcon: 'restaurant-outline',
        categoryColor: '#E67E22',
        name: 'Spice Route Events',
        tagline: 'Traditional Indian & street food stations',
        icon: 'flame',
        rating: 4.4,
        reviews: 67,
        priceLabel: 'from Rs.220/plate',
        tags: ['Indian', 'Street Food', 'Budget Friendly'],
        badge: null,
    },

    // ── Security ──────────────────────────────────────────────────────────────
    {
        id: 's1',
        category: 'Security',
        categoryIcon: 'shield-checkmark-outline',
        categoryColor: '#2980B9',
        name: 'GuardPro Security',
        tagline: 'Trained officers for corporate & social events',
        icon: 'shield-checkmark',
        rating: 4.7,
        reviews: 98,
        priceLabel: 'from Rs.800/officer/day',
        tags: ['Armed', 'Unarmed', 'Crowd Control'],
        badge: 'Verified',
    },
    {
        id: 's2',
        category: 'Security',
        categoryIcon: 'shield-checkmark-outline',
        categoryColor: '#2980B9',
        name: 'SafeZone Services',
        tagline: 'CCTV monitoring & access control setup',
        icon: 'eye',
        rating: 4.5,
        reviews: 53,
        priceLabel: 'from Rs.5,000/event',
        tags: ['CCTV', 'Access Control', 'Surveillance'],
        badge: null,
    },
    {
        id: 's3',
        category: 'Security',
        categoryIcon: 'shield-checkmark-outline',
        categoryColor: '#2980B9',
        name: 'VIP Escort Security',
        tagline: 'Executive protection & VIP management',
        icon: 'person-circle',
        rating: 4.9,
        reviews: 41,
        priceLabel: 'from Rs.2,500/officer',
        tags: ['VIP', 'Executive', 'High-Profile'],
        badge: null,
    },

    // ── Makeup & Beauty ───────────────────────────────────────────────────────
    {
        id: 'b1',
        category: 'Makeup & Beauty',
        categoryIcon: 'sparkles-outline',
        categoryColor: '#8E44AD',
        name: 'Glam Studio by Priya',
        tagline: 'Bridal, party & editorial makeup artistry',
        icon: 'color-palette',
        rating: 4.9,
        reviews: 212,
        priceLabel: 'from Rs.3,500/session',
        tags: ['Bridal', 'Party Makeup', 'HD Makeup'],
        badge: 'Top Rated',
    },
    {
        id: 'b2',
        category: 'Makeup & Beauty',
        categoryIcon: 'sparkles-outline',
        categoryColor: '#8E44AD',
        name: 'Aura Beauty Lounge',
        tagline: 'Hair styling, skincare & full makeovers',
        icon: 'sparkles',
        rating: 4.6,
        reviews: 143,
        priceLabel: 'from Rs.2,000/session',
        tags: ['Hair Styling', 'Skin Care', 'Makeover'],
        badge: null,
    },
    {
        id: 'b3',
        category: 'Makeup & Beauty',
        categoryIcon: 'sparkles-outline',
        categoryColor: '#8E44AD',
        name: 'The Beauty Crew',
        tagline: 'Team of 4 artists for large events',
        icon: 'people',
        rating: 4.7,
        reviews: 76,
        priceLabel: 'from Rs.1,200/person',
        tags: ['Group Bookings', 'On-Location', 'Airbrush'],
        badge: null,
    },

    // ── Photography & Video ───────────────────────────────────────────────────
    {
        id: 'p1',
        category: 'Photography & Video',
        categoryIcon: 'camera-outline',
        categoryColor: '#16A085',
        name: 'Lens & Light Studio',
        tagline: 'Cinematic event films & photography',
        icon: 'videocam',
        rating: 4.9,
        reviews: 187,
        priceLabel: 'from Rs.15,000/event',
        tags: ['Cinematic', '4K Video', 'Drone'],
        badge: 'Featured',
    },
    {
        id: 'p2',
        category: 'Photography & Video',
        categoryIcon: 'camera-outline',
        categoryColor: '#16A085',
        name: 'Snapshot Events',
        tagline: 'Corporate & product photography',
        icon: 'camera',
        rating: 4.5,
        reviews: 94,
        priceLabel: 'from Rs.8,000/event',
        tags: ['Corporate', 'Product', 'Headshots'],
        badge: null,
    },
    {
        id: 'p3',
        category: 'Photography & Video',
        categoryIcon: 'camera-outline',
        categoryColor: '#16A085',
        name: 'Reel Moments',
        tagline: 'Wedding films & same day highlight reels',
        icon: 'film',
        rating: 4.8,
        reviews: 135,
        priceLabel: 'from Rs.20,000/wedding',
        tags: ['Wedding', 'Highlight Reel', 'Same Day Edit'],
        badge: null,
    },
];

// Group services by category for section rendering
const GROUPED = SERVICES.reduce((acc, sv) => {
    if (!acc[sv.category]) acc[sv.category] = [];
    acc[sv.category].push(sv);
    return acc;
}, {} as Record<string, typeof SERVICES>);

const CATEGORY_ORDER = ['Catering', 'Security', 'Makeup & Beauty', 'Photography & Video'];

// ─── Entrance animation hook ──────────────────────────────────────────────────
function useEntrance(delay = 0) {
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(20)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, { toValue: 1, delay, duration: 340, useNativeDriver: true }),
            Animated.spring(slide, {
                toValue: 0,
                delay,
                useNativeDriver: true,
                speed: 16,
                bounciness: 6,
            }),
        ]).start();
    }, []);
    return { fade, slide };
}

// ─── Service card ─────────────────────────────────────────────────────────────
function ServiceCard({ service, index }: { service: (typeof SERVICES)[0]; index: number }) {
    const { fade, slide } = useEntrance(100 + index * 55);
    const scale = useRef(new Animated.Value(1)).current;
    const press = (v: number) =>
        Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 30 }).start();

    return (
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={() => press(0.97)}
                onPressOut={() => press(1)}
                onPress={() => console.log('service', service.id)}
            >
                <Animated.View style={[sc.card, { transform: [{ scale }] }]}>
                    {/* Coloured left accent bar */}
                    <View style={[sc.accentBar, { backgroundColor: service.categoryColor }]} />

                    <View style={sc.inner}>
                        {/* Icon */}
                        <View
                            style={[sc.iconWrap, { backgroundColor: service.categoryColor + '18' }]}
                        >
                            <Ionicons
                                name={service.icon as any}
                                size={26}
                                color={service.categoryColor}
                            />
                        </View>

                        {/* Content */}
                        <View style={sc.content}>
                            {/* Name + badge */}
                            <View style={sc.nameRow}>
                                <Text style={sc.name} numberOfLines={1}>
                                    {service.name}
                                </Text>
                                {service.badge && (
                                    <View
                                        style={[
                                            sc.badge,
                                            {
                                                backgroundColor: service.categoryColor + '18',
                                                borderColor: service.categoryColor + '40',
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[sc.badgeText, { color: service.categoryColor }]}
                                        >
                                            {service.badge}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <Text style={sc.tagline} numberOfLines={1}>
                                {service.tagline}
                            </Text>

                            {/* Tags */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={{ marginBottom: 10 }}
                            >
                                <View style={sc.tagRow}>
                                    {service.tags.map((t, i) => (
                                        <View key={i} style={sc.tag}>
                                            <Text style={sc.tagText}>{t}</Text>
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>

                            {/* Footer */}
                            <View style={sc.footer}>
                                <View style={sc.ratingRow}>
                                    <Ionicons name="star" size={12} color={Colors.primary} />
                                    <Text style={sc.ratingNum}>{service.rating}</Text>
                                    <Text style={sc.reviews}>({service.reviews} reviews)</Text>
                                </View>
                                <View style={sc.priceRow}>
                                    <Text style={[sc.price, { color: service.categoryColor }]}>
                                        {service.priceLabel}
                                    </Text>
                                    <Ionicons
                                        name="chevron-forward"
                                        size={14}
                                        color={Colors.border}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const sc = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        marginBottom: Spacing.md,
        overflow: 'hidden',
        flexDirection: 'row',
        ...Shadows.card,
    },
    accentBar: { width: 4 },
    inner: { flex: 1, flexDirection: 'row', padding: Spacing.md, gap: Spacing.md },
    iconWrap: {
        width: 54,
        height: 54,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    content: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 },
    name: {
        flex: 1,
        fontSize: 15,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
    },
    badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radii.full, borderWidth: 1 },
    badgeText: { fontSize: 9, fontWeight: Typography.bold, letterSpacing: 0.4 },
    tagline: { fontSize: 11.5, color: Colors.charcoalLight, marginBottom: 8 },
    tagRow: { flexDirection: 'row', gap: 5 },
    tag: {
        backgroundColor: Colors.background,
        borderRadius: Radii.full,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tagText: { fontSize: 9.5, fontWeight: Typography.semiBold, color: Colors.charcoalMid },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingNum: { fontSize: 12, fontWeight: Typography.bold, color: Colors.charcoal },
    reviews: { fontSize: 11, color: Colors.charcoalLight },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    price: { fontSize: 12, fontWeight: Typography.bold },
});

// ─── Category section header ──────────────────────────────────────────────────
function CategoryHeader({
    label,
    icon,
    color,
    count,
}: {
    label: string;
    icon: string;
    color: string;
    count: number;
}) {
    return (
        <View style={ch.root}>
            <View
                style={[ch.iconWrap, { backgroundColor: color + '18', borderColor: color + '40' }]}
            >
                <Ionicons name={icon as any} size={18} color={color} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={ch.label}>{label}</Text>
                <Text style={ch.count}>{count} services available</Text>
            </View>
            <View style={[ch.countBadge, { backgroundColor: color + '18' }]}>
                <Text style={[ch.countBadgeText, { color }]}>{count}</Text>
            </View>
        </View>
    );
}
const ch = StyleSheet.create({
    root: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.md,
        marginTop: Spacing.xl,
    },
    iconWrap: {
        width: 46,
        height: 46,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        flexShrink: 0,
    },
    label: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    count: { fontSize: 11, color: Colors.charcoalLight, marginTop: 1 },
    countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.full },
    countBadgeText: { fontSize: 14, fontWeight: Typography.extraBold },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function OtherServicesScreen() {
    const navigation = useNavigation<any>();
    const [search, setSearch] = useState('');

    const { fade: headerFade, slide: headerSlide } = useEntrance(0);
    const { fade: bodyFade } = useEntrance(160);

    const filteredGroups = CATEGORY_ORDER.reduce((acc, cat) => {
        const items = (GROUPED[cat] || []).filter(sv => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                sv.name.toLowerCase().includes(q) ||
                sv.tagline.toLowerCase().includes(q) ||
                sv.tags.some(t => t.toLowerCase().includes(q))
            );
        });
        if (items.length > 0) acc.push({ cat, items });
        return acc;
    }, [] as { cat: string; items: typeof SERVICES }[]);

    const totalVisible = filteredGroups.reduce((n, g) => n + g.items.length, 0);

    return (
        <View style={s.root}>
            {/* ── Header ─────────────────────────────────────────────────────────── */}
            <Animated.View
                style={[
                    s.header,
                    { opacity: headerFade, transform: [{ translateY: headerSlide }] },
                ]}
            >
                <View style={s.headerAccentBar} />
                <View style={s.headerContent}>
                    <View>
                        <Text style={s.headerEyebrow}>SERVICES</Text>
                        <Text style={s.headerTitle}>Other Services</Text>
                    </View>
                </View>
                <Text style={s.headerSub}>
                    Catering, security, beauty & photography for your event.
                </Text>

                {/* Search bar */}
                <View style={s.searchWrap}>
                    <View style={s.searchBar}>
                        <Ionicons name="search" size={17} color={Colors.charcoalLight} />
                        <TextInput
                            style={s.searchInput}
                            placeholder="Search services, vendors..."
                            placeholderTextColor={Colors.charcoalLight}
                            value={search}
                            onChangeText={setSearch}
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
                    <TouchableOpacity style={s.filterBtn}>
                        <Ionicons name="options" size={18} color={Colors.white} />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scroll}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Summary strip ───────────────────────────────────────────────── */}
                <Animated.View style={[s.summaryStrip, { opacity: bodyFade }]}>
                    {[
                        { label: 'Categories', value: '4' },
                        { label: 'Vendors', value: '12' },
                        { label: 'Avg Rating', value: '4.7' },
                        { label: 'Verified', value: '100%' },
                    ].map((st, i) => (
                        <View key={i} style={[s.statItem, i < 3 && s.statBorder]}>
                            <Text style={s.statValue}>{st.value}</Text>
                            <Text style={s.statLabel}>{st.label}</Text>
                        </View>
                    ))}
                </Animated.View>

                {/* ── Services list with section headers ──────────────────────────── */}
                <Animated.View style={[s.listWrap, { opacity: bodyFade }]}>
                    {/* Result count when searching */}
                    {search.length > 0 && (
                        <View style={s.searchResult}>
                            <Ionicons name="search" size={14} color={Colors.charcoalLight} />
                            <Text style={s.searchResultText}>
                                {totalVisible} result{totalVisible !== 1 ? 's' : ''} for "{search}"
                            </Text>
                        </View>
                    )}

                    {filteredGroups.length === 0 ? (
                        <View style={s.emptyState}>
                            <Ionicons
                                name="search-outline"
                                size={48}
                                color={Colors.primaryBorder}
                            />
                            <Text style={s.emptyTitle}>No services found</Text>
                            <Text style={s.emptySub}>Try a different keyword</Text>
                        </View>
                    ) : (
                        filteredGroups.map(({ cat, items }) => {
                            const first = items[0];
                            return (
                                <View key={cat}>
                                    {/* Section divider line (not for first section) */}
                                    <CategoryHeader
                                        label={cat}
                                        icon={first.categoryIcon}
                                        color={first.categoryColor}
                                        count={items.length}
                                    />
                                    {items.map((sv, i) => (
                                        <ServiceCard key={sv.id} service={sv} index={i} />
                                    ))}
                                </View>
                            );
                        })
                    )}
                </Animated.View>

                {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
                <View style={s.ctaWrap}>
                    <View style={s.ctaBanner}>
                        <View style={s.ctaOrb1} />
                        <View style={s.ctaOrb2} />
                        <View style={s.ctaInner}>
                            <View style={s.ctaIconCircle}>
                                <Ionicons name="sparkles" size={26} color={Colors.primary} />
                            </View>
                            <Text style={s.ctaTitle}>Can't find what{'\n'}you need?</Text>
                            <Text style={s.ctaSub}>
                                Tell us your requirements and we'll connect you with the right
                                vendor.
                            </Text>
                            <TouchableOpacity style={s.ctaBtn} activeOpacity={0.88}>
                                <Ionicons
                                    name="chatbubble-ellipses"
                                    size={16}
                                    color={Colors.charcoal}
                                />
                                <Text style={s.ctaBtnText}>Request a Custom Service</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingBottom: 120 },

    // ── Header ──────────────────────────────────────────────────────────────────
    header: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        paddingBottom: Spacing.xl,
        ...Shadows.header,
        zIndex: 10,
    },
    headerAccentBar: { height: 4, backgroundColor: Colors.primary },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
    },
    headerEyebrow: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: Typography.wider,
        marginBottom: Spacing.xxs,
    },
    headerTitle: {
        fontSize: Typography.xxl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
    },
    headerSub: {
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        paddingHorizontal: Spacing.xl,
        marginTop: Spacing.xs,
        marginBottom: Spacing.lg,
    },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    iconBtn: {
        width: 42,
        height: 42,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notifDot: {
        position: 'absolute',
        top: 9,
        right: 9,
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: Colors.primary,
        borderWidth: 1.5,
        borderColor: Colors.surface,
    },
    searchWrap: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.md,
        alignItems: 'center',
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        paddingHorizontal: 14,
        height: 50,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    searchInput: { flex: 1, fontSize: 14, color: Colors.charcoal },
    filterBtn: {
        width: 50,
        height: 50,
        borderRadius: Radii.md,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.primary,
    },

    // ── Summary strip ────────────────────────────────────────────────────────────
    summaryStrip: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.xl,
        borderRadius: Radii.xl,
        paddingVertical: 14,
        ...Shadows.card,
        marginBottom: Spacing.sm,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statBorder: { borderRightWidth: 1, borderRightColor: Colors.border },
    statValue: {
        fontSize: 17,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.4,
    },
    statLabel: {
        fontSize: 10,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        marginTop: 2,
    },

    // ── List ─────────────────────────────────────────────────────────────────────
    listWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
    searchResult: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: Spacing.md,
        marginTop: Spacing.sm,
    },
    searchResultText: { fontSize: 13, color: Colors.charcoalLight, fontWeight: Typography.medium },

    // ── Empty state ──────────────────────────────────────────────────────────────
    emptyState: { alignItems: 'center', paddingVertical: 70, gap: 10 },
    emptyTitle: { fontSize: 16, fontWeight: Typography.semiBold, color: Colors.charcoal },
    emptySub: { fontSize: 13, color: Colors.charcoalLight },

    // ── CTA banner ───────────────────────────────────────────────────────────────
    ctaWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
    ctaBanner: {
        backgroundColor: Colors.charcoal,
        borderRadius: Radii.xxl,
        overflow: 'hidden',
        ...Shadows.floating,
    },
    ctaOrb1: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(245,166,35,0.09)',
    },
    ctaOrb2: {
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(245,166,35,0.06)',
    },
    ctaInner: { padding: 28, alignItems: 'center' },
    ctaIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(245,166,35,0.14)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(245,166,35,0.24)',
    },
    ctaTitle: {
        fontSize: 22,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        textAlign: 'center',
        letterSpacing: -0.4,
        lineHeight: 30,
        marginBottom: 10,
    },
    ctaSub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.50)',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 22,
    },
    ctaBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingHorizontal: 22,
        paddingVertical: 14,
        borderRadius: Radii.full,
        ...Shadows.primary,
    },
    ctaBtnText: {
        fontSize: 14,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: 0.2,
    },
});

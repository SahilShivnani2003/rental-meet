import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    TextInput,
    Image,
    Modal,
    FlatList,
    RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';
import { Colors, Radii, Spacing, Shadows, Typography } from '@/theme/theme';
import { useGetVendorServices } from '../hooks/useGetVendorServices';
import { VendorService } from '../types/VendorService';

const { width: W } = Dimensions.get('window');

// ─── Category config ──────────────────────────────────────────────────────────
type CategoryMeta = { key: string; label: string; icon: string; color: string; bg: string };

const CATEGORIES: CategoryMeta[] = [
    {
        key: 'all',
        label: 'All Services',
        icon: 'grid-outline',
        color: Colors.primary,
        bg: Colors.primaryLight,
    },
    {
        key: 'Catering',
        label: 'Catering',
        icon: 'restaurant-outline',
        color: '#E67E22',
        bg: '#FEF3E2',
    },
    {
        key: 'Makeup & Beauty',
        label: 'Makeup & Beauty',
        icon: 'sparkles-outline',
        color: '#8E44AD',
        bg: '#F5EEF8',
    },
    {
        key: 'Photography',
        label: 'Photography',
        icon: 'camera-outline',
        color: '#16A085',
        bg: '#E8F8F5',
    },
    {
        key: 'Entertainment',
        label: 'Entertainment',
        icon: 'musical-notes-outline',
        color: '#2980B9',
        bg: '#EBF5FB',
    },
    {
        key: 'Decor & Floral',
        label: 'Decor & Floral',
        icon: 'flower-outline',
        color: '#27AE60',
        bg: '#EAFAF1',
    },
    {
        key: 'Security',
        label: 'Security',
        icon: 'shield-checkmark-outline',
        color: '#C0392B',
        bg: '#FDEDEC',
    },
    { key: 'Celebrity', label: 'Celebrity', icon: 'star-outline', color: '#F39C12', bg: '#FEF9E7' },
    {
        key: 'Logistics & Support',
        label: 'Logistics',
        icon: 'car-outline',
        color: '#17A589',
        bg: '#E8F8F5',
    },
];

const fmtPrice = (n?: number) =>
    n ? '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : null;

// ─── Entrance hook ────────────────────────────────────────────────────────────
function useEntrance(delay = 0) {
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(20)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, { toValue: 1, delay, duration: 320, useNativeDriver: true }),
            Animated.spring(slide, {
                toValue: 0,
                delay,
                useNativeDriver: true,
                speed: 16,
                bounciness: 5,
            }),
        ]).start();
    }, []);
    return { fade, slide };
}

// ─── Category tile ────────────────────────────────────────────────────────────
function CategoryTile({
    cat,
    selected,
    onPress,
}: {
    cat: CategoryMeta;
    selected: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[ct.tile, selected && { backgroundColor: cat.color, borderColor: cat.color }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View
                style={[
                    ct.iconWrap,
                    { backgroundColor: selected ? 'rgba(255,255,255,0.22)' : cat.bg },
                ]}
            >
                <Ionicons
                    name={cat.icon as any}
                    size={22}
                    color={selected ? Colors.white : cat.color}
                />
            </View>
            <Text
                style={[ct.label, { color: selected ? Colors.white : Colors.charcoal }]}
                numberOfLines={2}
            >
                {cat.label}
            </Text>
        </TouchableOpacity>
    );
}

const ct = StyleSheet.create({
    tile: {
        width: 86,
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderRadius: Radii.xl,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
        marginRight: Spacing.sm,
        gap: 8,
        ...Shadows.card,
    },
    iconWrap: {
        width: 46,
        height: 46,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: { fontSize: 10.5, fontWeight: Typography.bold, textAlign: 'center', lineHeight: 14 },
});

// ─── Service card ─────────────────────────────────────────────────────────────
function ServiceCard({
    service,
    catMeta,
    onViewProfile,
    onBookNow,
    onGetQuotation,
}: {
    service: VendorService;
    catMeta: CategoryMeta;
    onViewProfile: () => void;
    onBookNow: () => void;
    onGetQuotation: () => void;
}) {
    const isVerified = service.status === 'approved';
    const location = [service.city, service.state].filter(Boolean).join(', ');
    const displayName = service.brandName ?? service.companyName ?? 'Vendor';

    return (
        <View style={sv.card}>
            {/* Image */}
            <View style={sv.imageWrap}>
                {service.featuredImage ? (
                    <Image
                        source={{ uri: service.featuredImage }}
                        style={sv.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[sv.imagePlaceholder, { backgroundColor: catMeta.bg }]}>
                        <Ionicons name={catMeta.icon as any} size={36} color={catMeta.color} />
                    </View>
                )}
                {/* Category badge on image */}
                <View style={[sv.categoryBadge, { backgroundColor: catMeta.color + 'EE' }]}>
                    <Ionicons name={catMeta.icon as any} size={10} color={Colors.white} />
                    <Text style={sv.categoryBadgeText}>{service.category}</Text>
                </View>
            </View>

            {/* Content */}
            <View style={sv.content}>
                {/* Title */}
                <Text style={sv.title} numberOfLines={2}>
                    {service.title}
                </Text>

                {/* Location */}
                {location ? (
                    <View style={sv.locationRow}>
                        <Ionicons name="location-outline" size={12} color={Colors.charcoalLight} />
                        <Text style={sv.locationText}>{location}</Text>
                    </View>
                ) : null}

                {/* Verified + company */}
                <View style={sv.verifiedRow}>
                    {isVerified && (
                        <>
                            <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
                            <Text style={sv.verifiedText}>Verified Vendor</Text>
                            {(service.companyName || service.brandName) && (
                                <Text style={sv.verifiedSep}>·</Text>
                            )}
                        </>
                    )}
                    {(service.companyName || service.brandName) && (
                        <Text style={sv.companyText} numberOfLines={1}>
                            {service.brandName ?? service.companyName}
                        </Text>
                    )}
                </View>

                {/* Description */}
                {service.description ? (
                    <Text style={sv.description} numberOfLines={2}>
                        {service.description}
                    </Text>
                ) : null}

                {/* Price */}
                <View style={sv.priceRow}>
                    {service.startingPrice ? (
                        <>
                            <Text style={sv.priceAmount}>{fmtPrice(service.startingPrice)}</Text>
                            <Text style={sv.priceOnwards}> onwards</Text>
                        </>
                    ) : (
                        <Text style={sv.priceNegotiable}>Price on request</Text>
                    )}
                </View>
                {service.startingPrice ? (
                    <Text style={sv.directBooking}>Direct booking available</Text>
                ) : null}

                {/* Action buttons */}
                <View style={sv.actions}>
                    <TouchableOpacity
                        style={sv.btnOutline}
                        onPress={onViewProfile}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="person-outline" size={13} color={Colors.charcoal} />
                        <Text style={sv.btnOutlineText}>View Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={sv.btnPrimary}
                        onPress={onBookNow}
                        activeOpacity={0.85}
                    >
                        <Text style={sv.btnPrimaryText}>Book Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={sv.btnQuote}
                        onPress={onGetQuotation}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="document-text-outline" size={13} color={Colors.white} />
                        <Text style={sv.btnQuoteText}>Get Quotation</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const sv = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        marginBottom: Spacing.lg,
        overflow: 'hidden',
        ...Shadows.card,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    imageWrap: { position: 'relative', width: '100%', height: 180 },
    image: { width: '100%', height: '100%' },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: Radii.full,
    },
    categoryBadgeText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.white },
    content: { padding: Spacing.md, gap: 5 },
    title: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        lineHeight: 22,
    },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    locationText: { fontSize: 11.5, color: Colors.charcoalLight, fontWeight: Typography.medium },
    verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
    verifiedText: { fontSize: 11.5, color: Colors.success, fontWeight: Typography.semiBold },
    verifiedSep: { fontSize: 11.5, color: Colors.charcoalLight },
    companyText: { fontSize: 11.5, color: Colors.charcoalLight, flex: 1 },
    description: { fontSize: 12.5, color: Colors.charcoalMid, lineHeight: 18, marginTop: 2 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
    priceAmount: {
        fontSize: 20,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.5,
    },
    priceOnwards: { fontSize: 12, color: Colors.charcoalLight, fontWeight: Typography.medium },
    priceNegotiable: {
        fontSize: 14,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        fontStyle: 'italic',
    },
    directBooking: { fontSize: 10.5, color: Colors.charcoalLight, marginTop: 1 },
    actions: { flexDirection: 'row', gap: 6, marginTop: Spacing.sm, flexWrap: 'wrap' },
    btnOutline: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    btnOutlineText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.charcoal },
    btnPrimary: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: Radii.md,
        backgroundColor: Colors.success,
        ...Shadows.card,
    },
    btnPrimaryText: { fontSize: 12, fontWeight: Typography.extraBold, color: Colors.white },
    btnQuote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: Radii.md,
        backgroundColor: Colors.primary,
        ...Shadows.primary,
    },
    btnQuoteText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.charcoal },
});

// ─── Filter sheet ─────────────────────────────────────────────────────────────
function FilterSheet({
    visible,
    onClose,
    search,
    setSearch,
    city,
    setCity,
    selectedCat,
    setSelectedCat,
    onReset,
}: {
    visible: boolean;
    onClose: () => void;
    search: string;
    setSearch: (v: string) => void;
    city: string;
    setCity: (v: string) => void;
    selectedCat: string;
    setSelectedCat: (v: string) => void;
    onReset: () => void;
}) {
    const slideAnim = useRef(new Animated.Value(600)).current;

    useEffect(() => {
        if (visible) {
            slideAnim.setValue(600);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                speed: 18,
                bounciness: 4,
            }).start();
        }
    }, [visible]);

    const handleClose = () => {
        Animated.timing(slideAnim, { toValue: 600, duration: 220, useNativeDriver: true }).start(
            onClose,
        );
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <View style={fs.overlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFillObject}
                    activeOpacity={1}
                    onPress={handleClose}
                />
                <Animated.View style={[fs.sheet, { transform: [{ translateY: slideAnim }] }]}>
                    <View style={fs.handle} />
                    <View style={fs.header}>
                        <View style={fs.headerLeft}>
                            <Ionicons name="options-outline" size={18} color={Colors.charcoal} />
                            <Text style={fs.headerTitle}>Filters</Text>
                        </View>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={20} color={Colors.charcoal} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={fs.body}
                    >
                        {/* Search */}
                        <Text style={fs.label}>Search</Text>
                        <View style={fs.inputWrap}>
                            <Ionicons
                                name="search-outline"
                                size={16}
                                color={Colors.charcoalLight}
                            />
                            <TextInput
                                style={fs.input}
                                placeholder="Search vendors..."
                                placeholderTextColor={Colors.charcoalLight}
                                value={search}
                                onChangeText={setSearch}
                            />
                            {search.length > 0 && (
                                <TouchableOpacity onPress={() => setSearch('')}>
                                    <Ionicons
                                        name="close-circle"
                                        size={15}
                                        color={Colors.charcoalLight}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* City */}
                        <Text style={[fs.label, { marginTop: Spacing.lg }]}>City</Text>
                        <View style={fs.inputWrap}>
                            <Ionicons
                                name="location-outline"
                                size={16}
                                color={Colors.charcoalLight}
                            />
                            <TextInput
                                style={fs.input}
                                placeholder="e.g. Bhopal, Mumbai..."
                                placeholderTextColor={Colors.charcoalLight}
                                value={city}
                                onChangeText={setCity}
                            />
                        </View>

                        {/* Service category */}
                        <Text style={[fs.label, { marginTop: Spacing.lg }]}>Service Category</Text>
                        {CATEGORIES.map(cat => {
                            const active = selectedCat === cat.key;
                            return (
                                <TouchableOpacity
                                    key={cat.key}
                                    style={[
                                        fs.catRow,
                                        active && {
                                            backgroundColor: cat.bg,
                                            borderColor: cat.color + '55',
                                        },
                                    ]}
                                    onPress={() => setSelectedCat(cat.key)}
                                    activeOpacity={0.8}
                                >
                                    <View
                                        style={[
                                            fs.catIcon,
                                            {
                                                backgroundColor: active
                                                    ? cat.color + '22'
                                                    : Colors.background,
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name={cat.icon as any}
                                            size={16}
                                            color={cat.color}
                                        />
                                    </View>
                                    <Text
                                        style={[
                                            fs.catLabel,
                                            active && {
                                                color: cat.color,
                                                fontWeight: Typography.bold,
                                            },
                                        ]}
                                    >
                                        {cat.label}
                                    </Text>
                                    {active && (
                                        <Ionicons name="checkmark" size={16} color={cat.color} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}

                        {/* Reset */}
                        <TouchableOpacity
                            style={fs.resetBtn}
                            onPress={() => {
                                onReset();
                                handleClose();
                            }}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="close-circle-outline"
                                size={16}
                                color={Colors.charcoalLight}
                            />
                            <Text style={fs.resetText}>Reset Filters</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const fs = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        paddingTop: 12,
        maxHeight: '88%',
        ...Shadows.floating,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginBottom: 14,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 17, fontWeight: Typography.extraBold, color: Colors.charcoal },
    body: { padding: Spacing.xl, paddingBottom: 40 },
    label: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 1.6,
        marginBottom: Spacing.sm,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        paddingHorizontal: 14,
        height: 48,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    input: { flex: 1, fontSize: 14, color: Colors.charcoal },
    catRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: Radii.md,
        marginBottom: 6,
        borderWidth: 1.5,
        borderColor: 'transparent',
        backgroundColor: Colors.background,
    },
    catIcon: {
        width: 32,
        height: 32,
        borderRadius: Radii.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    catLabel: { flex: 1, fontSize: 14, color: Colors.charcoalMid, fontWeight: Typography.medium },
    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: Spacing.xl,
        paddingVertical: 14,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    resetText: { fontSize: 14, fontWeight: Typography.semiBold, color: Colors.charcoalLight },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function OtherServicesScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // ── API ───────────────────────────────────────────────────────────────────
    const { data: servicesData, isLoading, isRefetching, refetch } = useGetVendorServices();

    const allServices: VendorService[] = servicesData?.services ?? [];

    // ── Filter state ──────────────────────────────────────────────────────────
    const [selectedCat, setSelectedCat] = useState('all');
    const [search, setSearch] = useState('');
    const [city, setCity] = useState('');
    const [filterVisible, setFilterVisible] = useState(false);

    const handleReset = useCallback(() => {
        setSelectedCat('all');
        setSearch('');
        setCity('');
    }, []);

    // ── Active filter count for badge ─────────────────────────────────────────
    const activeFilterCount = [selectedCat !== 'all', search.length > 0, city.length > 0].filter(
        Boolean,
    ).length;

    // ── Filtered list ─────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        return allServices.filter(sv => {
            if (selectedCat !== 'all' && sv.category !== selectedCat) return false;
            if (
                city &&
                !sv.city?.toLowerCase().includes(city.toLowerCase()) &&
                !sv.state?.toLowerCase().includes(city.toLowerCase())
            )
                return false;
            if (search) {
                const q = search.toLowerCase();
                const inTitle = sv.title?.toLowerCase().includes(q);
                const inDesc = sv.description?.toLowerCase().includes(q);
                const inTags = sv.tags?.some(t => t.toLowerCase().includes(q));
                const inCat = sv.category?.toLowerCase().includes(q);
                const inCo =
                    sv.companyName?.toLowerCase().includes(q) ||
                    sv.brandName?.toLowerCase().includes(q);
                if (!inTitle && !inDesc && !inTags && !inCat && !inCo) return false;
            }
            return true;
        });
    }, [allServices, selectedCat, search, city]);

    // ── Cat meta lookup ───────────────────────────────────────────────────────
    const getCatMeta = useCallback(
        (category: string): CategoryMeta =>
            CATEGORIES.find(c => c.key === category) ?? CATEGORIES[0],
        [],
    );

    // ── Navigation ────────────────────────────────────────────────────────────
    const goToProfile = useCallback(
        (sv: VendorService) => navigation.navigate('vendorDetail', { service: sv }),
        [navigation],
    );
    const goToBooking = useCallback(
        (sv: VendorService) => navigation.navigate('serviceBooking', { service: sv }),
        [navigation],
    );
    const goToQuotation = useCallback(
        (sv: VendorService) => navigation.navigate('getServiceQuotation', { service: sv }),
        [navigation],
    );

    // ── Header animation ──────────────────────────────────────────────────────
    const { fade: headerFade, slide: headerSlide } = useEntrance(0);
    const { fade: bodyFade } = useEntrance(160);

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <View style={s.root}>
            {/* ── Header ── */}
            <Animated.View
                style={[
                    s.header,
                    { opacity: headerFade, transform: [{ translateY: headerSlide }] },
                ]}
            >
                <View style={s.headerAccentBar} />
                <View style={s.headerContent}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.headerEyebrow}>PREMIUM SERVICES</Text>
                        <Text style={s.headerTitle}>Browse All Services</Text>
                        <Text style={s.headerSub}>
                            From catering to celebrity appearances — find verified vendors for every
                            aspect of your event.
                        </Text>
                    </View>
                </View>

                {/* Search row */}
                <View style={s.searchRow}>
                    <View style={s.searchBar}>
                        <Ionicons name="search" size={17} color={Colors.charcoalLight} />
                        <TextInput
                            style={s.searchInput}
                            placeholder="Search vendors, services..."
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
                    <TouchableOpacity
                        style={[s.filterBtn, activeFilterCount > 0 && s.filterBtnActive]}
                        onPress={() => setFilterVisible(true)}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="options" size={18} color={Colors.white} />
                        {activeFilterCount > 0 && (
                            <View style={s.filterBadge}>
                                <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scroll}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
            >
                {/* ── Category tiles ── */}
                <Animated.View style={{ opacity: bodyFade }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={s.catScroll}
                    >
                        {CATEGORIES.map(cat => (
                            <CategoryTile
                                key={cat.key}
                                cat={cat}
                                selected={selectedCat === cat.key}
                                onPress={() => setSelectedCat(cat.key)}
                            />
                        ))}
                    </ScrollView>
                </Animated.View>

                {/* ── Showing count ── */}
                <Animated.View style={[s.countRow, { opacity: bodyFade }]}>
                    <Text style={s.countText}>
                        Showing <Text style={s.countBold}>{filtered.length}</Text>{' '}
                        {filtered.length === 1 ? 'vendor' : 'vendors'}
                        {selectedCat !== 'all'
                            ? ` in ${CATEGORIES.find(c => c.key === selectedCat)?.label}`
                            : ''}
                    </Text>
                    {activeFilterCount > 0 && (
                        <TouchableOpacity onPress={handleReset}>
                            <Text style={s.clearText}>Clear filters</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>

                {/* ── Service cards ── */}
                <Animated.View style={[s.listWrap, { opacity: bodyFade }]}>
                    {isLoading ? (
                        // Skeleton placeholders
                        Array.from({ length: 3 }).map((_, i) => (
                            <View key={i} style={sk.card}>
                                <View style={sk.image} />
                                <View style={sk.body}>
                                    <View style={sk.line} />
                                    <View style={[sk.line, { width: '60%' }]} />
                                    <View style={[sk.line, { width: '40%', marginTop: 8 }]} />
                                </View>
                            </View>
                        ))
                    ) : filtered.length === 0 ? (
                        <View style={s.emptyState}>
                            <View style={s.emptyIconWrap}>
                                <Ionicons
                                    name="search-outline"
                                    size={36}
                                    color={Colors.primaryBorder}
                                />
                            </View>
                            <Text style={s.emptyTitle}>No services found</Text>
                            <Text style={s.emptySub}>
                                {search || city
                                    ? 'Try adjusting your search or filters'
                                    : 'No vendors are listed in this category yet'}
                            </Text>
                            {activeFilterCount > 0 && (
                                <TouchableOpacity style={s.emptyResetBtn} onPress={handleReset}>
                                    <Text style={s.emptyResetText}>Reset Filters</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        filtered.map(sv => (
                            <ServiceCard
                                key={sv._id}
                                service={sv}
                                catMeta={getCatMeta(sv.category)}
                                onViewProfile={() => goToProfile(sv)}
                                onBookNow={() => goToBooking(sv)}
                                onGetQuotation={() => goToQuotation(sv)}
                            />
                        ))
                    )}
                </Animated.View>
            </ScrollView>

            {/* ── Filter bottom sheet ── */}
            <FilterSheet
                visible={filterVisible}
                onClose={() => setFilterVisible(false)}
                search={search}
                setSearch={setSearch}
                city={city}
                setCity={setCity}
                selectedCat={selectedCat}
                setSelectedCat={setSelectedCat}
                onReset={handleReset}
            />
        </View>
    );
}

// ─── Skeleton styles ──────────────────────────────────────────────────────────
const sk = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        marginBottom: Spacing.lg,
        overflow: 'hidden',
        ...Shadows.card,
    },
    image: { width: '100%', height: 180, backgroundColor: Colors.border },
    body: { padding: Spacing.md, gap: 10 },
    line: { height: 14, borderRadius: 7, backgroundColor: Colors.border, width: '80%' },
});

// ─── Main styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingBottom: 120 },

    // Header
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
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.sm,
        minHeight: 120
    },
    headerTitle: {
        fontSize: 30, // was 26
        fontWeight: Typography.extraBold,  
        color: Colors.charcoal,
        letterSpacing: -0.8, // was -0.6
        lineHeight: 36, // was 32
        marginBottom: 4, // was 6
    },
    headerEyebrow: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight, // ← was Colors.primary, now muted so it reads as a sub-label
        letterSpacing: Typography.wider,
        marginBottom: 6,
    },
    headerSub: { fontSize: 13, color: Colors.charcoalLight, lineHeight: 20 },
    searchRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.md,
        alignItems: 'center',
        marginTop: Spacing.sm,
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
        backgroundColor: Colors.charcoal,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.card,
    },
    filterBtnActive: { backgroundColor: Colors.primary },
    filterBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: Colors.danger,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Colors.surface,
    },
    filterBadgeText: { fontSize: 9, fontWeight: Typography.extraBold, color: Colors.white },

    // Category scroll
    catScroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md },

    // Count row
    countRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    countText: { fontSize: 13, color: Colors.charcoalLight, fontWeight: Typography.medium },
    countBold: { fontWeight: Typography.bold, color: Colors.charcoal },
    clearText: { fontSize: 13, fontWeight: Typography.bold, color: Colors.primary },

    // List
    listWrap: { paddingHorizontal: Spacing.lg },

    // Empty
    emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.sm },
    emptyIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        marginBottom: Spacing.sm,
    },
    emptyTitle: { fontSize: 16, fontWeight: Typography.bold, color: Colors.charcoal },
    emptySub: {
        fontSize: 13,
        color: Colors.charcoalLight,
        textAlign: 'center',
        lineHeight: 19,
        paddingHorizontal: Spacing.xl,
    },
    emptyResetBtn: {
        marginTop: Spacing.md,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.primary,
    },
    emptyResetText: { fontSize: 13, fontWeight: Typography.bold, color: Colors.primary },

    // CTA
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

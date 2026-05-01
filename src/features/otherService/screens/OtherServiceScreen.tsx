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
import useEntrance from '@/hooks/useEntrance';
import { ServiceCard } from '../components/ServiceCard';
import { CATEGORIES, CategoryMeta } from '../data/Category';
import { CategoryTile } from '../components/CategoryTile';
import { FilterSheet } from '../components/FilterSheet';
import { useAuthStore } from '@/store/useAuthStore';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { VendorTabParamList } from '@/navigations/tabNavigations/VendorTabNavigation';
import { ClientTabParamList } from '@/navigations/tabNavigations/ClientTabNavigation';
import { useAlert } from '@/context/AlertContext';

const { width: W } = Dimensions.get('window');

type otherServiceScreenProps = NativeBottomTabScreenProps<ClientTabParamList, 'otherService'>;
// ─── Screen ───────────────────────────────────────────────────────────────────
export default function OtherServicesScreen({ navigation }: otherServiceScreenProps) {
    const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    const { isAuthenticated } = useAuthStore();
    const alert = useAlert();
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
        (sv: VendorService) => rootNav.navigate('vendorDetail', { service: sv }),
        [navigation],
    );
    const goToBooking = useCallback(
        (sv: VendorService) => {
            if (isAuthenticated) {
                rootNav.navigate('serviceBooking', { service: sv });
            } else {
                alert.show({
                    type: 'confirm',
                    title: 'Login Required',
                    message: 'For booking login is required',
                    buttons: [
                        {
                            label: 'Login',
                            onPress: () => rootNav.navigate('login'),
                            style: 'primary',
                        },
                        {
                            label: 'Cancel',
                            onPress: alert.dismiss,
                            style: 'ghost',
                        },
                    ],
                });
            }
        },
        [isAuthenticated, rootNav, navigation, alert],
    );
    const goToQuotation = useCallback(
        (sv: VendorService) => {
            if (isAuthenticated) {
                rootNav.navigate('getServiceQuotation', { service: sv });
            } else {
                alert.show({
                    type: 'confirm',
                    title: 'Login Required',
                    message: 'For booking login is required',
                    buttons: [
                        {
                            label: 'Login',
                            onPress: () => rootNav.navigate('login'),
                            style: 'primary',
                        },
                        {
                            label: 'Cancel',
                            onPress: alert.dismiss,
                            style: 'ghost',
                        },
                    ],
                });
            }
        },
        [navigation, isAuthenticated, rootNav, alert],
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
                {/* ── Category chips (2-row wrap) ── */}
                {/* ── Category chips (2-row wrap) ── */}
                <Animated.View style={[s.catWrap, { opacity: bodyFade }]}>
                    {CATEGORIES.map(cat => {
                        const isActive = selectedCat === cat.key;
                        return (
                            <TouchableOpacity
                                key={cat.key}
                                style={[
                                    s.chip,
                                    isActive && {
                                        backgroundColor: cat.color,
                                        borderColor: cat.color,
                                    },
                                ]}
                                onPress={() => setSelectedCat(cat.key)}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name={cat.icon as any}
                                    size={14}
                                    color={isActive ? Colors.white : cat.color}
                                />
                                <Text style={[s.chipText, isActive && s.chipTextActive]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
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
        minHeight: 120,
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

    // Category chips
    catWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.md,
        gap: Spacing.sm,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: Radii.full,
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    chipText: {
        fontSize: 12,
        fontWeight: Typography.medium,
        color: Colors.charcoalLight,
    },
    chipTextActive: {
        color: Colors.white,
        fontWeight: Typography.bold,
    },
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

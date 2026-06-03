import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    TextInput,
    FlatList,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';
import { Colors, Radii, Spacing, Shadows, Typography } from '@/theme/theme';
import { useGetVendorServices } from '../hooks/useGetVendorServices';
import { VendorService } from '../types/VendorService';
import useEntrance from '@/hooks/useEntrance';
import { ServiceCard } from '../components/ServiceCard';
import { CATEGORIES, CategoryMeta } from '../data/Category';
import { FilterSheet } from '../components/FilterSheet';
import { useAuthStore } from '@/store/useAuthStore';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { ClientTabParamList } from '@/navigations/tabNavigations/ClientTabNavigation';
import { useAlert } from '@/context/AlertContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue'; // ★ add this (see below)

const { width: W } = Dimensions.get('window');

type otherServiceScreenProps = NativeBottomTabScreenProps<ClientTabParamList, 'otherService'>;

export default function OtherServicesScreen({ navigation }: otherServiceScreenProps) {
    const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    const { isAuthenticated } = useAuthStore();
    const alert = useAlert();

    // ── Filter state ──────────────────────────────────────────────────────────
    const [selectedCat, setSelectedCat] = useState('all');
    const [search, setSearch] = useState('');
    const [city, setCity] = useState('');
    const [filterVisible, setFilterVisible] = useState(false);

    // ★ Debounce text inputs so we don't fire a request on every keystroke
    const debouncedSearch = useDebouncedValue(search, 400);
    const debouncedCity = useDebouncedValue(city, 400);

    const handleReset = useCallback(() => {
        setSelectedCat('all');
        setSearch('');
        setCity('');
    }, []);

    const activeFilterCount = [selectedCat !== 'all', search.length > 0, city.length > 0].filter(
        Boolean,
    ).length;

    // ★ Build query params from filter state — server does the filtering now
    const queryParams = useMemo(
        () => ({
            ...(selectedCat !== 'all' && { category: selectedCat }),
            ...(debouncedSearch && { search: debouncedSearch }),
            ...(debouncedCity && { city: debouncedCity }),
        }),
        [selectedCat, debouncedSearch, debouncedCity],
    );

    // ★ useInfiniteQuery
    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        refetch,
        isRefetching,
    } = useGetVendorServices(queryParams);

    // ★ Flatten pages into a single list
    const allServices: VendorService[] = useMemo(
        () => data?.pages.flatMap(p => p.services ?? []) ?? [],
        [data],
    );

    // ★ Total count reported by the API (first page usually carries it)
    const totalCount: number =
        data?.pages[0]?.total ?? data?.pages[0]?.totalCount ?? allServices.length;

    // ── Cat meta lookup ───────────────────────────────────────────────────────
    const getCatMeta = useCallback(
        (category: string): CategoryMeta =>
            CATEGORIES.find(c => c.key === category) ?? CATEGORIES[0],
        [],
    );

    // ── Navigation ────────────────────────────────────────────────────────────
    const goToProfile = useCallback(
        (sv: VendorService) => rootNav.navigate('vendorDetail', { service: sv }),
        [rootNav],
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
                        { label: 'Cancel', onPress: alert.dismiss, style: 'ghost' },
                    ],
                });
            }
        },
        [isAuthenticated, rootNav, alert],
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
                        { label: 'Cancel', onPress: alert.dismiss, style: 'ghost' },
                    ],
                });
            }
        },
        [isAuthenticated, rootNav, alert],
    );

    // ── Header animation ──────────────────────────────────────────────────────
    const { fade: headerFade, slide: headerSlide } = useEntrance(0);
    const { fade: bodyFade } = useEntrance(160);

    // ★ FlatList callbacks
    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const renderItem = useCallback(
        ({ item: sv }: { item: VendorService }) => (
            <ServiceCard
                key={sv._id}
                service={sv}
                catMeta={getCatMeta(sv.category)}
                onViewProfile={() => goToProfile(sv)}
                onBookNow={() => goToBooking(sv)}
                onGetQuotation={() => goToQuotation(sv)}
            />
        ),
        [getCatMeta, goToProfile, goToBooking, goToQuotation],
    );

    const keyExtractor = useCallback(
        (sv: VendorService, index: number) => sv._id ?? index.toString(),
        [],
    );

    // ★ Header rendered once above the list
    // Replace the plain `const ListHeader = (...)` block with:

    const ListHeader = useMemo(
        () => (
            <Animated.View style={{ opacity: bodyFade }}>
                {/* Category chips */}
                <View style={s.catWrap}>
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
                </View>

                {/* Count row */}
                <View style={s.countRow}>
                    <Text style={s.countText}>
                        Showing <Text style={s.countBold}>{totalCount}</Text>{' '}
                        {totalCount === 1 ? 'vendor' : 'vendors'}
                        {selectedCat !== 'all'
                            ? ` in ${CATEGORIES.find(c => c.key === selectedCat)?.label}`
                            : ''}
                    </Text>
                    {activeFilterCount > 0 && (
                        <TouchableOpacity onPress={handleReset}>
                            <Text style={s.clearText}>Clear filters</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Skeleton while loading first page */}
                {isLoading &&
                    Array.from({ length: 3 }).map((_, i) => (
                        <View key={i} style={sk.card}>
                            <View style={sk.image} />
                            <View style={sk.body}>
                                <View style={sk.line} />
                                <View style={[sk.line, { width: '60%' }]} />
                                <View style={[sk.line, { width: '40%', marginTop: 8 }]} />
                            </View>
                        </View>
                    ))}
            </Animated.View>
        ),
        [selectedCat, totalCount, activeFilterCount, isLoading, bodyFade],
    );

    // ★ Footer: spinner while fetching next page
    const ListFooter = isFetchingNextPage ? (
        <View style={s.footerLoader}>
            <ActivityIndicator size="small" color={Colors.primary} />
        </View>
    ) : null;

    // ★ Empty state
    const ListEmpty = !isLoading ? (
        <View style={s.emptyState}>
            <View style={s.emptyIconWrap}>
                <Ionicons name="search-outline" size={36} color={Colors.primaryBorder} />
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
    ) : null;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <View style={s.root}>
            {/* ── Sticky header ── */}
            <Animated.View
                style={[
                    s.header,
                    { opacity: headerFade, transform: [{ translateY: headerSlide }] },
                ]}
            >
                <View style={s.headerAccentBar} />
                <View style={s.headerContent}>
                    <Text style={s.headerEyebrow}>PREMIUM SERVICES</Text>
                    <Text style={s.headerTitle}>Browse All Services</Text>
                    <Text style={s.headerSub}>
                        From catering to celebrity appearances — find verified vendors for every
                        aspect of your event.
                    </Text>
                </View>

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

            {/* ★ FlatList replaces ScrollView */}
            <FlatList
                data={allServices}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                ListHeaderComponent={ListHeader}
                ListFooterComponent={ListFooter}
                ListEmptyComponent={ListEmpty}
                contentContainerStyle={s.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.4} // ★ trigger 40% before list end
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
            />

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
    scroll: { paddingBottom: 120, paddingHorizontal: Spacing.lg },

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
        fontSize: 30,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.8,
        lineHeight: 36,
        marginBottom: 4,
    },
    headerEyebrow: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
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

    catWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
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
    chipText: { fontSize: 12, fontWeight: Typography.medium, color: Colors.charcoalLight },
    chipTextActive: { color: Colors.white, fontWeight: Typography.bold },

    countRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    countText: { fontSize: 13, color: Colors.charcoalLight, fontWeight: Typography.medium },
    countBold: { fontWeight: Typography.bold, color: Colors.charcoal },
    clearText: { fontSize: 13, fontWeight: Typography.bold, color: Colors.primary },

    footerLoader: { paddingVertical: 20, alignItems: 'center' }, // ★

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
});

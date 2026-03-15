import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme/theme';
import VenueCard from '../../components/venues/venueCard';
import { venueAPI } from '../../service/apis/venues';
import { useAuthStore } from '../../store/auth-store';
import { OwnerTabParamList } from '../../navigations/tabNavigations/OwnerTabNavigation';
import { ClientTabParamList } from '../../navigations/tabNavigations/ClientTabNavigation';
import { tabParamList } from '../../navigations/tabNavigations/TabNavigation';
import { RootStackParamList } from '../../navigations/RootNavigation';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAlert } from '../../context/AlertContext';
import FilterModal, { FilterState, DEFAULT_FILTERS } from '../models/FilterModal';

// ── Types ─────────────────────────────────────────────────────────────────────
type VenueType = {
    _id: string;
    name: string;
    description: string;
    icon: string;
    isActive: boolean;
    order: number;
};

const ALL_CATEGORY: VenueType = {
    _id: 'all',
    name: 'All',
    icon: '🏠',
    description: '',
    isActive: true,
    order: 0,
};

type appParamList = OwnerTabParamList & ClientTabParamList & tabParamList;
type venueProps = NativeStackScreenProps<appParamList, 'venues'>;

// ── Screen ────────────────────────────────────────────────────────────────────
export default function VenuesScreen({ navigation }: venueProps) {
    const alert = useAlert();
    const { user } = useAuthStore();

    const [venues, setVenues] = useState<any[]>([]);
    const [categories, setCategories] = useState<VenueType[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // ── Search (local — triggers server call on submit/debounce) ──────────────
    const [searchQuery, setSearch] = useState('');

    // ── Category chip (drives venueType param) ────────────────────────────────
    const [selectedCategory, setCategory] = useState('all');

    // ── Modal filter state — maps 1:1 to API query params ────────────────────
    const [filterVisible, setFilterVisible] = useState(false);
    const [activeFilters, setActiveFilters] = useState<FilterState>(DEFAULT_FILTERS);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Debounce ref for search input
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Active filter badge count ─────────────────────────────────────────────
    const activeFilterCount = Object.entries(activeFilters).filter(([, v]) => v !== '').length;

    // ── Fetch on mount ────────────────────────────────────────────────────────
    useEffect(() => {
        fetchCategories();
        fetchVenues();
    }, []);

    // ── Re-fetch when category chip changes ───────────────────────────────────
    useEffect(() => {
        fetchVenues();
    }, [selectedCategory]);

    // ── Build query params from all active filters + search + category ────────
    const buildParams = useCallback(() => {
        const params: Record<string, string> = {};

        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (selectedCategory !== 'all') params.venueType = selectedCategory;

        // Modal filters — only add if non-empty
        if (activeFilters.city) params.city = activeFilters.city;
        if (activeFilters.venueType) params.venueType = activeFilters.venueType;
        if (activeFilters.capacity) params.capacity = activeFilters.capacity;
        if (activeFilters.minPrice) params.minPrice = activeFilters.minPrice;
        if (activeFilters.maxPrice) params.maxPrice = activeFilters.maxPrice;

        return params;
    }, [searchQuery, selectedCategory, activeFilters]);

    // ── API call ──────────────────────────────────────────────────────────────
    const fetchVenues = async (overrideSearch?: string) => {
        try {
            setLoading(true);
            fadeAnim.setValue(0);

            const params: Record<string, string> = {};
            const sq = overrideSearch ?? searchQuery;

            if (sq.trim()) params.search = sq.trim();
            if (selectedCategory !== 'all') params.venueType = selectedCategory;
            if (activeFilters.city) params.city = activeFilters.city;
            // Modal venueType overrides chip if both set
            if (activeFilters.venueType) params.venueType = activeFilters.venueType;
            if (activeFilters.capacity) params.capacity = activeFilters.capacity;
            if (activeFilters.minPrice) params.minPrice = activeFilters.minPrice;
            if (activeFilters.maxPrice) params.maxPrice = activeFilters.maxPrice;

            const response = await venueAPI.getVenues(params);

            if (!response?.venues) {
                console.error('FETCHING VENUES ERROR:', response?.message);
                setVenues([]);
                return;
            }

            setVenues(response.venues);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await venueAPI.venueTypes();
            if (response?.success) {
                setCategories([ALL_CATEGORY, ...response.venueTypes]);
            } else {
                setCategories([ALL_CATEGORY]);
            }
        } catch (error: any) {
            console.error('FETCH CATEGORIES ERROR:', error);
            setCategories([ALL_CATEGORY]);
        }
    };

    // ── Search: debounce 500ms then call server ───────────────────────────────
    const handleSearchChange = (text: string) => {
        setSearch(text);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            fetchVenues(text);
        }, 500);
    };

    const handleSearchSubmit = () => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        fetchVenues(searchQuery);
    };

    // ── Apply filters from modal ──────────────────────────────────────────────
    const handleApplyFilters = (filters: FilterState) => {
        setActiveFilters(filters);
        // Fetch with new filters immediately (useEffect won't fire since
        // activeFilters reference changes but we need a manual call here)
        const params: Record<string, string> = {};
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (selectedCategory !== 'all') params.venueType = selectedCategory;
        if (filters.city) params.city = filters.city;
        if (filters.venueType) params.venueType = filters.venueType;
        if (filters.capacity) params.capacity = filters.capacity;
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;

        (async () => {
            try {
                setLoading(true);
                fadeAnim.setValue(0);
                const response = await venueAPI.getVenues(params);
                setVenues(response?.venues ?? []);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }).start();
            } finally {
                setLoading(false);
            }
        })();
    };

    const handleClearFilters = () => {
        setActiveFilters(DEFAULT_FILTERS);
        setSearch('');
        setCategory('all');
        // Fetch with no params
        (async () => {
            try {
                setLoading(true);
                fadeAnim.setValue(0);
                const response = await venueAPI.getVenues({});
                setVenues(response?.venues ?? []);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }).start();
            } finally {
                setLoading(false);
            }
        })();
    };

    const handleAddVenue = () => {
        navigation.navigate('addVenue')
    };

    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <View style={styles.headerAccentBar} />
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greetingLabel}>DISCOVER</Text>
                        <Text style={styles.greeting}>{user.role === 'owner' ? 'My Venues' : 'Venues'}</Text>
                    </View>
                    {user?.role === 'owner' && (
                        <TouchableOpacity
                            style={styles.addVenueButton}
                            activeOpacity={0.85}
                            onPress={handleAddVenue}
                        >
                            <Ionicons name="add" size={18} color={Colors.white} />
                            <Text style={styles.addVenueLabel}>Add Venue</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.headerSubtitle}>Book your premium meeting venues.</Text>
            </View>

            {/* ── Search + Filter button ── */}
            <View style={styles.searchWrapper}>
                <View style={styles.searchContainer}>
                    <Ionicons
                        name="search"
                        size={18}
                        color={Colors.charcoalLight}
                        style={{ marginRight: 10 }}
                    />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search venues, cities..."
                        placeholderTextColor={Colors.charcoalLight}
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                        onSubmitEditing={handleSearchSubmit}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                setSearch('');
                                fetchVenues('');
                            }}
                        >
                            <Ionicons name="close-circle" size={16} color={Colors.charcoalLight} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filter button */}
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        activeFilterCount > 0 && styles.filterButtonActive,
                    ]}
                    onPress={() => setFilterVisible(true)}
                    activeOpacity={0.85}
                >
                    <Ionicons
                        name="options"
                        size={18}
                        color={activeFilterCount > 0 ? Colors.charcoal : Colors.white}
                    />
                    {activeFilterCount > 0 && (
                        <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchVenues();
                        }}
                        tintColor={Colors.primary}
                    />
                }
            >
                {/* ── Category chips from API ── */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesContainer}
                    style={{ marginBottom: Spacing.sm }}
                >
                    {categories.map(cat => {
                        const isActive =
                            cat._id === 'all'
                                ? selectedCategory === 'all'
                                : selectedCategory === cat.name;
                        return (
                            <TouchableOpacity
                                key={cat._id}
                                style={[
                                    styles.categoryButton,
                                    isActive && styles.categoryButtonActive,
                                ]}
                                onPress={() => setCategory(cat._id === 'all' ? 'all' : cat.name)}
                            >
                                <View
                                    style={[
                                        styles.categoryIconWrap,
                                        isActive && styles.categoryIconWrapActive,
                                    ]}
                                >
                                    <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                                </View>
                                <Text
                                    style={[
                                        styles.categoryText,
                                        isActive && styles.categoryTextActive,
                                    ]}
                                >
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* ── Active filter summary strip ── */}
                {(activeFilterCount > 0 || searchQuery) && (
                    <View style={styles.activeFilterStrip}>
                        <Ionicons name="funnel" size={13} color={Colors.primaryDark} />
                        <Text style={styles.activeFilterText} numberOfLines={1}>
                            {[
                                searchQuery && `"${searchQuery}"`,
                                activeFilters.city && activeFilters.city,
                                activeFilters.venueType && activeFilters.venueType,
                                activeFilters.capacity && `Cap: ${activeFilters.capacity}`,
                                (activeFilters.minPrice || activeFilters.maxPrice) &&
                                    `₹${activeFilters.minPrice || '0'} – ₹${
                                        activeFilters.maxPrice || '∞'
                                    }`,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </Text>
                        <TouchableOpacity onPress={handleClearFilters}>
                            <Text style={styles.clearLink}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── Venue list ── */}
                <View style={[styles.section, { paddingBottom: 100 }]}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <View style={styles.sectionAccent} />
                            <Text style={styles.sectionTitle}>All Venues</Text>
                        </View>
                        <Text style={styles.venueCount}>{venues.length} spaces</Text>
                    </View>

                    {loading ? (
                        <View style={styles.loaderWrap}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={styles.loaderText}>Finding spaces...</Text>
                        </View>
                    ) : venues.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons
                                name="search-outline"
                                size={48}
                                color={Colors.primaryBorder}
                            />
                            <Text style={styles.emptyText}>No venues found</Text>
                            {(activeFilterCount > 0 || searchQuery) && (
                                <TouchableOpacity onPress={handleClearFilters}>
                                    <Text style={styles.clearFiltersLink}>Clear all filters</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <Animated.View style={[styles.venuesGrid, { opacity: fadeAnim }]}>
                            {venues.map(v => (
                                <VenueCard key={v._id} venue={v} />
                            ))}
                        </Animated.View>
                    )}
                </View>
            </ScrollView>

            {/* ── FAB (owner only) ── */}
            {user?.role === 'owner' && (
                <TouchableOpacity style={styles.fab} onPress={handleAddVenue} activeOpacity={0.85}>
                    <View style={styles.fabInner}>
                        <Ionicons name="add" size={26} color={Colors.white} />
                    </View>
                    <Text style={styles.fabLabel}>Add Venue</Text>
                </TouchableOpacity>
            )}

            {/* ── Filter modal ── */}
            <FilterModal
                visible={filterVisible}
                onClose={() => setFilterVisible(false)}
                onApply={handleApplyFilters}
                initialFilters={activeFilters}
            />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    // Header
    header: {
        backgroundColor: Colors.surface,
        paddingBottom: Spacing.xl,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        ...Shadows.header,
    },
    headerAccentBar: { height: 4, backgroundColor: Colors.primary },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
    },
    greetingLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: Typography.wider,
        marginBottom: Spacing.xxs,
    },
    greeting: {
        fontSize: Typography.xxl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
    },
    headerSubtitle: {
        fontSize: Typography.md,
        color: Colors.charcoalLight,
        paddingHorizontal: Spacing.xl,
        marginTop: Spacing.xs,
    },
    addVenueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        paddingLeft: 8,
        paddingRight: 14,
        paddingVertical: 8,
        gap: Spacing.xs,
        ...Shadows.primary,
    },
    addVenueLabel: {
        fontSize: Typography.base,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.3,
    },

    // Search
    searchWrapper: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
        gap: Spacing.md,
        alignItems: 'center',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.md,
        height: 50,
        ...Shadows.card,
    },
    searchInput: { flex: 1, fontSize: 15, color: Colors.charcoal },
    filterButton: {
        width: 50,
        height: 50,
        borderRadius: Radii.md,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.primary,
    },
    filterButtonActive: { backgroundColor: Colors.charcoal },
    filterBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: Colors.background,
    },
    filterBadgeText: {
        fontSize: 9,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },

    // Categories
    categoriesContainer: {
        paddingHorizontal: Spacing.xl,
        gap: 10,
        paddingVertical: Spacing.xxs,
    },
    categoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 14,
        paddingLeft: 6,
        paddingVertical: 6,
        borderRadius: Radii.full,
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.border,
        gap: Spacing.sm,
    },
    categoryButtonActive: { backgroundColor: Colors.charcoal, borderColor: Colors.charcoal },
    categoryIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryIconWrapActive: { backgroundColor: Colors.primary },
    categoryEmoji: { fontSize: 16 },
    categoryText: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.semiBold,
        letterSpacing: Typography.normal,
    },
    categoryTextActive: { color: Colors.white },

    // Active filter summary strip
    activeFilterStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.sm,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    activeFilterText: {
        flex: 1,
        fontSize: Typography.sm,
        color: Colors.primaryDark,
        fontWeight: Typography.medium,
    },
    clearLink: {
        fontSize: Typography.sm,
        color: Colors.primaryDark,
        fontWeight: Typography.bold,
    },

    // Content
    content: { flex: 1 },
    section: { marginBottom: Spacing.sm },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        marginBottom: 14,
        marginTop: Spacing.xl,
    },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sectionAccent: { width: 4, height: 22, backgroundColor: Colors.primary, borderRadius: 2 },
    sectionTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    venueCount: {
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    venuesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.lg,
        gap: 14,
    },

    // Loader / Empty
    loaderWrap: { alignItems: 'center', paddingVertical: 48, gap: 12 },
    loaderText: {
        fontSize: Typography.md,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
    emptyText: { fontSize: 16, color: Colors.charcoalLight, fontWeight: Typography.semiBold },
    clearFiltersLink: {
        fontSize: Typography.base,
        color: Colors.primary,
        fontWeight: Typography.bold,
        textDecorationLine: 'underline',
    },

    // FAB
    fab: {
        position: 'absolute',
        right: Spacing.xl,
        bottom: Spacing.xxl,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        paddingLeft: 6,
        paddingRight: 18,
        paddingVertical: 6,
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
        elevation: 10,
    },
    fabInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.28)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    fabLabel: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.3,
    },
});

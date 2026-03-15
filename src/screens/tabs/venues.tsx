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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import FilterModal, { FilterState, DEFAULT_FILTERS } from '../models/FilterModal';
import { ownerAPI } from '../../service/apis/owner';

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

// ── Owner stat card ───────────────────────────────────────────────────────────
type OwnerStatConfig = {
    label: string;
    value: number;
    color: string;
    bg: string;
    borderColor: string;
};

function OwnerStatCard({
    stat,
    active,
    onPress,
}: {
    stat: OwnerStatConfig;
    active: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[
                styles.ownerStatCard,
                { borderColor: active ? stat.color : Colors.border },
                active && { backgroundColor: stat.bg },
            ]}
            onPress={onPress}
            activeOpacity={0.75}
        >
            <Text style={[styles.ownerStatValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.ownerStatLabel}>{stat.label}</Text>
        </TouchableOpacity>
    );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function VenuesScreen({ navigation }: venueProps) {
    const { user } = useAuthStore();
    const isOwner = user?.role === 'owner';

    const [venues, setVenues] = useState<any[]>([]);
    const [categories, setCategories] = useState<VenueType[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [searchQuery, setSearch] = useState('');
    const [selectedCategory, setCategory] = useState('all');
    const [filterVisible, setFilterVisible] = useState(false);
    const [activeFilters, setActiveFilters] = useState<FilterState>(DEFAULT_FILTERS);

    // Owner filter: 'all' | 'approved' | 'pending' | 'rejected'
    const [ownerFilter, setOwnerFilter] = useState<string>('all');

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activeFilterCount = Object.entries(activeFilters).filter(([, v]) => v !== '').length;

    // ── Counts derived from current venues list ────────────────────────────
    const ownerStats: OwnerStatConfig[] = [
        {
            label: 'All Venues',
            value: venues.length,
            color: Colors.primary,
            bg: Colors.primaryLight,
            borderColor: Colors.primary,
        },
        {
            label: 'Approved',
            value: venues.filter(v => v.status === 'approved').length,
            color: Colors.success,
            bg: Colors.successLight,
            borderColor: Colors.success,
        },
        {
            label: 'Pending',
            value: venues.filter(v => v.status === 'pending').length,
            color: Colors.warning,
            bg: Colors.warningLight,
            borderColor: Colors.warning,
        },
        {
            label: 'Rejected',
            value: venues.filter(v => v.status === 'rejected').length,
            color: Colors.danger,
            bg: Colors.dangerLight,
            borderColor: Colors.danger,
        },
    ];

    const ownerFilterKeys = ['all', 'approved', 'pending', 'rejected'];

    // Filtered venues for owner stat tabs
    const displayedVenues =
        isOwner && ownerFilter !== 'all' ? venues.filter(v => v.status === ownerFilter) : venues;

    useEffect(() => {
        if (!isOwner) fetchCategories();
        fetchVenues();
    }, []);

    useEffect(() => {
        fetchVenues();
    }, [selectedCategory]);

    const fetchVenues = async (overrideSearch?: string) => {
        try {
            setLoading(true);
            fadeAnim.setValue(0);

            const params: Record<string, string> = {};
            const sq = overrideSearch ?? searchQuery;

            if (sq.trim()) params.search = sq.trim();
            if (!isOwner) {
                if (selectedCategory !== 'all') params.venueType = selectedCategory;
                if (activeFilters.city) params.city = activeFilters.city;
                if (activeFilters.venueType) params.venueType = activeFilters.venueType;
                if (activeFilters.capacity) params.capacity = activeFilters.capacity;
                if (activeFilters.minPrice) params.minPrice = activeFilters.minPrice;
                if (activeFilters.maxPrice) params.maxPrice = activeFilters.maxPrice;
            }

            const response = isOwner ? ownerAPI.getVenues() :  await venueAPI.getVenues(params);
            setVenues(response?.venues ?? []);

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
        } catch {
            setCategories([ALL_CATEGORY]);
        }
    };

    const handleSearchChange = (text: string) => {
        setSearch(text);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchVenues(text), 500);
    };

    const handleSearchSubmit = () => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        fetchVenues(searchQuery);
    };

    const handleApplyFilters = (filters: FilterState) => {
        setActiveFilters(filters);
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
        setOwnerFilter('all');
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

    const handleAddVenue = () => navigation.navigate('addVenue');

    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <View style={styles.headerAccentBar} />
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greetingLabel}>{isOwner ? 'MANAGE' : 'DISCOVER'}</Text>
                        <Text style={styles.greeting}>{isOwner ? 'My Venues' : 'Venues'}</Text>
                    </View>
                    {isOwner && (
                        <TouchableOpacity
                            style={styles.addVenueButton}
                            onPress={handleAddVenue}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="add" size={18} color={Colors.charcoal} />
                            <Text style={styles.addVenueLabel}>Add Venue</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.headerSubtitle}>
                    {isOwner
                        ? `${venues.length} venue${venues.length !== 1 ? 's' : ''} found`
                        : 'Book your premium meeting venues.'}
                </Text>
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
                {isOwner ? (
                    /* ══════════════════════════════════════════════════════
                       OWNER VIEW — stat cards + search + venue list
                    ══════════════════════════════════════════════════════ */
                    <>
                        {/* Stat cards row */}
                        <View style={styles.ownerStatsRow}>
                            {ownerStats.map((stat, i) => (
                                <OwnerStatCard
                                    key={stat.label}
                                    stat={stat}
                                    active={ownerFilter === ownerFilterKeys[i]}
                                    onPress={() => setOwnerFilter(ownerFilterKeys[i])}
                                />
                            ))}
                        </View>

                        {/* Search */}
                        <View style={styles.ownerSearchWrap}>
                            <View style={styles.searchContainer}>
                                <Ionicons
                                    name="search"
                                    size={18}
                                    color={Colors.charcoalLight}
                                    style={{ marginRight: 10 }}
                                />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search by name or city..."
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
                                        <Ionicons
                                            name="close-circle"
                                            size={16}
                                            color={Colors.charcoalLight}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Venue list */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleRow}>
                                    <View style={styles.sectionAccent} />
                                    <Text style={styles.sectionTitle}>
                                        {ownerFilter === 'all'
                                            ? 'All Venues'
                                            : ownerFilter === 'approved'
                                            ? 'Approved Venues'
                                            : ownerFilter === 'pending'
                                            ? 'Pending Review'
                                            : 'Rejected Venues'}
                                    </Text>
                                </View>
                                <Text style={styles.venueCount}>
                                    {displayedVenues.length} spaces
                                </Text>
                            </View>

                            {loading ? (
                                <View style={styles.loaderWrap}>
                                    <ActivityIndicator size="large" color={Colors.primary} />
                                    <Text style={styles.loaderText}>Loading venues...</Text>
                                </View>
                            ) : displayedVenues.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <View style={styles.emptyIconWrap}>
                                        <Ionicons
                                            name="business-outline"
                                            size={32}
                                            color={Colors.primaryBorder}
                                        />
                                    </View>
                                    <Text style={styles.emptyTitle}>No venues found</Text>
                                    <Text style={styles.emptySubtitle}>
                                        {ownerFilter === 'all'
                                            ? 'Start by adding your first venue.'
                                            : `No ${ownerFilter} venues yet.`}
                                    </Text>
                                    {ownerFilter === 'all' && (
                                        <TouchableOpacity
                                            style={styles.emptyAddBtn}
                                            onPress={handleAddVenue}
                                            activeOpacity={0.85}
                                        >
                                            <Ionicons
                                                name="add"
                                                size={16}
                                                color={Colors.charcoal}
                                            />
                                            <Text style={styles.emptyAddBtnText}>
                                                Add Your First Venue
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ) : (
                                <Animated.View style={[styles.venuesGrid, { opacity: fadeAnim }]}>
                                    {displayedVenues.map(v => (
                                        <VenueCard key={v._id} venue={v} />
                                    ))}
                                </Animated.View>
                            )}
                        </View>
                        <View style={{ height: 100 }} />
                    </>
                ) : (
                    /* ══════════════════════════════════════════════════════
                       CLIENT VIEW — search + filter + categories + venues
                    ══════════════════════════════════════════════════════ */
                    <>
                        {/* Search + Filter */}
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
                                        <Ionicons
                                            name="close-circle"
                                            size={16}
                                            color={Colors.charcoalLight}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
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
                                        <Text style={styles.filterBadgeText}>
                                            {activeFilterCount}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Category chips */}
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
                                        onPress={() =>
                                            setCategory(cat._id === 'all' ? 'all' : cat.name)
                                        }
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

                        {/* Active filter strip */}
                        {(activeFilterCount > 0 || searchQuery) && (
                            <View style={styles.activeFilterStrip}>
                                <Ionicons name="funnel" size={13} color={Colors.primaryDark} />
                                <Text style={styles.activeFilterText} numberOfLines={1}>
                                    {[
                                        searchQuery && `"${searchQuery}"`,
                                        activeFilters.city,
                                        activeFilters.venueType,
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

                        {/* Venue list */}
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
                                    <Text style={styles.emptyTitle}>No venues found</Text>
                                    {(activeFilterCount > 0 || searchQuery) && (
                                        <TouchableOpacity onPress={handleClearFilters}>
                                            <Text style={styles.clearFiltersLink}>
                                                Clear all filters
                                            </Text>
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
                    </>
                )}
            </ScrollView>

            {/* ── Filter modal (client only) ── */}
            {!isOwner && (
                <FilterModal
                    visible={filterVisible}
                    onClose={() => setFilterVisible(false)}
                    onApply={handleApplyFilters}
                    initialFilters={activeFilters}
                />
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    // ── Header ──
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
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
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
        color: Colors.charcoal,
        letterSpacing: 0.3,
    },

    content: { flex: 1 },

    // ── Owner: stat cards ──
    ownerStatsRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    ownerStatCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
        alignItems: 'center',
        borderWidth: 1.5,
        ...Shadows.card,
    },
    ownerStatValue: {
        fontSize: 22,
        fontWeight: Typography.extraBold,
        letterSpacing: -0.5,
        marginBottom: 3,
    },
    ownerStatLabel: {
        fontSize: 10,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalLight,
        textAlign: 'center',
    },

    // ── Owner: search ──
    ownerSearchWrap: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },

    // ── Client: search + filter ──
    searchWrapper: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
        gap: Spacing.md,
        alignItems: 'center',
    },

    // Shared search container
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

    // Filter button (client)
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
    filterBadgeText: { fontSize: 9, fontWeight: Typography.extraBold, color: Colors.charcoal },

    // Category chips
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

    // Active filter strip
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
    clearLink: { fontSize: Typography.sm, color: Colors.primaryDark, fontWeight: Typography.bold },

    // Section
    section: { marginBottom: Spacing.sm },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        marginBottom: 14,
        marginTop: Spacing.lg,
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

    // Loader
    loaderWrap: { alignItems: 'center', paddingVertical: 48, gap: 12 },
    loaderText: {
        fontSize: Typography.md,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 10,
        paddingHorizontal: Spacing.xl,
    },
    emptyIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xs,
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
    },
    emptyTitle: { fontSize: 16, fontWeight: Typography.bold, color: Colors.charcoal },
    emptySubtitle: {
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        textAlign: 'center',
        lineHeight: 20,
    },
    emptyAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: 11,
        borderRadius: Radii.full,
        marginTop: Spacing.sm,
        ...Shadows.primary,
    },
    emptyAddBtnText: {
        fontSize: Typography.base,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
    clearFiltersLink: {
        fontSize: Typography.base,
        color: Colors.primary,
        fontWeight: Typography.bold,
        textDecorationLine: 'underline',
    },
});

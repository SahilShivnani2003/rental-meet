import React, { useState, useRef, useCallback, useEffect } from 'react';
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
    Modal,
    FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import VenueCard from '@/components/venues/venueCard';
import { ClientTabParamList } from '@/navigations/tabNavigations/ClientTabNavigation';
import { OwnerTabParamList } from '@/navigations/tabNavigations/OwnerTabNavigation';
import { tabParamList } from '@/navigations/tabNavigations/TabNavigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors, Spacing, Radii, Shadows, Typography } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import { useGetVenueType } from '@/features/venueType/hooks/useGetVenueType';
import { useGetAllVenue } from '../hooks/useGetAllVenue';
import { useGetOwnerVenue } from '../hooks/useGetOwnerVenue';
import { VenueType } from '@/features/venueType/types/VenueType';


const ALL_CATEGORY: VenueType = {
    _id: 'all',
    name: 'All',
    code: 'all',
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

// ── Dropdown Modal ────────────────────────────────────────────────────────────
interface DropdownModalProps {
    visible: boolean;
    title: string;
    options: { label: string; value: string }[];
    selectedValue: string;
    onSelect: (value: string) => void;
    onClose: () => void;
    searchable?: boolean;
}

function DropdownModal({
    visible,
    title,
    options,
    selectedValue,
    onSelect,
    onClose,
    searchable = false,
}: DropdownModalProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredOptions = searchable
        ? options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : options;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={styles.dropdownBackdrop} activeOpacity={1} onPress={onClose} />
            <View style={styles.dropdownSheet}>
                <View style={styles.dropdownHandle} />
                <Text style={styles.dropdownTitle}>{title}</Text>

                {searchable && (
                    <View style={styles.dropdownSearchWrap}>
                        <Ionicons
                            name="search"
                            size={16}
                            color={Colors.charcoalLight}
                            style={{ marginRight: 8 }}
                        />
                        <TextInput
                            style={styles.dropdownSearchInput}
                            placeholder="Search..."
                            placeholderTextColor={Colors.charcoalLight}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons
                                    name="close-circle"
                                    size={16}
                                    color={Colors.charcoalLight}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <FlatList
                    data={filteredOptions}
                    keyExtractor={item => item.value}
                    showsVerticalScrollIndicator={false}
                    style={{ maxHeight: 400 }}
                    renderItem={({ item }) => {
                        const isActive = item.value === selectedValue;
                        return (
                            <TouchableOpacity
                                style={[
                                    styles.dropdownOption,
                                    isActive && styles.dropdownOptionActive,
                                ]}
                                onPress={() => {
                                    onSelect(item.value);
                                    onClose();
                                }}
                            >
                                <Text
                                    style={[
                                        styles.dropdownOptionText,
                                        isActive && styles.dropdownOptionTextActive,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                                {isActive && (
                                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                                )}
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </Modal>
    );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function VenuesScreen({ navigation }: venueProps) {
    const { user } = useAuthStore();
    const isOwner = user?.role === 'owner';

    // ── Filter state ──────────────────────────────────────────────────────────
    const [searchQuery, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedVenueType, setSelectedVenueType] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedCapacity, setSelectedCapacity] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const [ownerFilter, setOwnerFilter] = useState<string>('all');

    // Dropdown modal visibility
    const [venueTypeModalVisible, setVenueTypeModalVisible] = useState(false);
    const [cityModalVisible, setCityModalVisible] = useState(false);
    const [capacityModalVisible, setCapacityModalVisible] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Data hooks — FIX: renamed all destructured fields to avoid duplicates ──

    const { data: venueTypeData, isLoading: isVenueTypeLoading } = useGetVenueType();

    // Client venue hook — pass filters as params (adjust to match your hook's API)
    const {
        data: clientVenueData,
        isLoading: isClientVenueLoading,
        isRefetching: isClientRefetching,
        refetch: refetchClientVenues,
    } = useGetAllVenue({
        search: debouncedSearch,
        venueType: selectedVenueType,
        city: selectedCity,
        capacity: selectedCapacity,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });

    // Owner venue hook
    const {
        data: ownerVenueData,
        isLoading: isOwnerVenueLoading,
        isRefetching: isOwnerRefetching,
        refetch: refetchOwnerVenues,
    } = useGetOwnerVenue();

    // ── Derived data ──────────────────────────────────────────────────────────

    // Pick the right venue list based on role
    const venues: any[] = isOwner ? ownerVenueData?.venues ?? [] : clientVenueData?.venues ?? [];

    const isLoading = isOwner ? isOwnerVenueLoading : isClientVenueLoading;
    const isRefetching = isOwner ? isOwnerRefetching : isClientRefetching;
    const refetch = isOwner ? refetchOwnerVenues : refetchClientVenues;

    // Categories from venue type API, prepend "All"
    const rawVenueTypes: VenueType[] = venueTypeData?.data ?? [];
    const categories: VenueType[] = [ALL_CATEGORY, ...rawVenueTypes];

    // ── Animate in when venues load ───────────────────────────────────────────
    useEffect(() => {
        if (!isLoading && venues.length > 0) {
            fadeAnim.setValue(0);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }
    }, [isLoading, venues.length]);

    // ── Debounced search ──────────────────────────────────────────────────────
    const handleSearchChange = useCallback((text: string) => {
        setSearch(text);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => setDebouncedSearch(text), 500);
    }, []);

    const handleSearchSubmit = useCallback(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        setDebouncedSearch(searchQuery);
    }, [searchQuery]);

    // ── Refresh ───────────────────────────────────────────────────────────────
    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    // ── Clear all filters ─────────────────────────────────────────────────────
    const handleClearFilters = useCallback(() => {
        setSearch('');
        setDebouncedSearch('');
        setSelectedVenueType('');
        setSelectedCity('');
        setSelectedCapacity('');
        setMinPrice('');
        setMaxPrice('');
        setOwnerFilter('all');
        // react-query will re-run the query automatically when params change
    }, []);

    // ── Apply inline filters (close panel + trigger re-fetch via param change) ─
    const handleApplyFilters = useCallback(() => {
        setFiltersExpanded(false);
        // debouncedSearch and filter states already drive the hook params,
        // so just close the panel — query re-runs automatically
        refetch();
    }, [refetch]);

    // ── Navigation ────────────────────────────────────────────────────────────
    const handleAddVenue = useCallback(() => {
        navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('addVenue');
    }, [navigation]);

    // ── Computed values ───────────────────────────────────────────────────────
    const activeFilterCount = [
        selectedVenueType,
        selectedCity,
        selectedCapacity,
        minPrice,
        maxPrice,
    ].filter(Boolean).length;

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

    // Owner tab filtering is client-side (data already fetched)
    const displayedVenues =
        isOwner && ownerFilter !== 'all' ? venues.filter(v => v.status === ownerFilter) : venues;

    // Venue type dropdown options (from API)
    const venueTypeOptions = rawVenueTypes.map(c => ({ label: c.name, value: c.name }));

    const cityOptions = [
        { label: 'Mumbai', value: 'Mumbai' },
        { label: 'Delhi', value: 'Delhi' },
        { label: 'Bangalore', value: 'Bangalore' },
        { label: 'Hyderabad', value: 'Hyderabad' },
        { label: 'Chennai', value: 'Chennai' },
        { label: 'Pune', value: 'Pune' },
        { label: 'Kolkata', value: 'Kolkata' },
        { label: 'Ahmedabad', value: 'Ahmedabad' },
        { label: 'Bhopal', value: 'Bhopal' },
        { label: 'Indore', value: 'Indore' },
    ];

    const capacityOptions = [
        { label: '10–20', value: '10-20' },
        { label: '20–30', value: '20-30' },
        { label: '30–50', value: '30-40' },
        { label: '50–100', value: '50-100' },
        { label: '100–200', value: '100-200' },
        { label: '200–300', value: '200-300' },
        { label: '300+', value: '300-400' },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
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
                        ? `${venues.length} venue${venues.length !== 1 ? 's' : ''} listed`
                        : 'Book your premium meeting venues.'}
                </Text>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={handleRefresh}
                        tintColor={Colors.primary}
                    />
                }
            >
                {isOwner ? (
                    /* ══════════════ OWNER VIEW ══════════════ */
                    <>
                        {/* Stat cards */}
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
                                            setDebouncedSearch('');
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

                            {isLoading ? (
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
                    /* ══════════════ CLIENT VIEW ══════════════ */
                    <>
                        {/* Search */}
                        <View style={styles.clientSearchWrap}>
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
                                            setDebouncedSearch('');
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

                        {/* Filters Toggle */}
                        <View style={styles.filtersToggleWrap}>
                            <TouchableOpacity
                                style={[
                                    styles.filtersToggleBtn,
                                    filtersExpanded && styles.filtersToggleBtnActive,
                                ]}
                                onPress={() => setFiltersExpanded(prev => !prev)}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name="options-outline"
                                    size={16}
                                    color={
                                        filtersExpanded || activeFilterCount > 0
                                            ? Colors.primary
                                            : Colors.charcoalMid
                                    }
                                />
                                <Text
                                    style={[
                                        styles.filtersToggleText,
                                        (filtersExpanded || activeFilterCount > 0) &&
                                            styles.filtersToggleTextActive,
                                    ]}
                                >
                                    Filters
                                </Text>
                                {activeFilterCount > 0 && (
                                    <View style={styles.filterCountBadge}>
                                        <Text style={styles.filterCountText}>
                                            {activeFilterCount}
                                        </Text>
                                    </View>
                                )}
                                <Ionicons
                                    name={filtersExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={14}
                                    color={Colors.charcoalLight}
                                />
                            </TouchableOpacity>

                            {activeFilterCount > 0 && (
                                <TouchableOpacity
                                    style={styles.clearAllBtn}
                                    onPress={handleClearFilters}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.clearAllText}>Clear All</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Expandable filters */}
                        {filtersExpanded && (
                            <View style={styles.filtersSection}>
                                {/* Row 1: Venue Type + City */}
                                <View style={styles.filterRow}>
                                    <View style={styles.filterCol}>
                                        <Text style={styles.filterLabel}>Venue Type</Text>
                                        <TouchableOpacity
                                            style={[
                                                styles.filterInput,
                                                selectedVenueType && styles.filterInputActive,
                                            ]}
                                            onPress={() => setVenueTypeModalVisible(true)}
                                            activeOpacity={0.8}
                                        >
                                            <Text
                                                style={[
                                                    styles.filterInputText,
                                                    !selectedVenueType &&
                                                        styles.filterInputPlaceholder,
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {selectedVenueType || 'Select type'}
                                            </Text>
                                            <Ionicons
                                                name="chevron-down"
                                                size={14}
                                                color={Colors.charcoalLight}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.filterCol}>
                                        <Text style={styles.filterLabel}>City</Text>
                                        <TouchableOpacity
                                            style={[
                                                styles.filterInput,
                                                selectedCity && styles.filterInputActive,
                                            ]}
                                            onPress={() => setCityModalVisible(true)}
                                            activeOpacity={0.8}
                                        >
                                            <Text
                                                style={[
                                                    styles.filterInputText,
                                                    !selectedCity && styles.filterInputPlaceholder,
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {selectedCity || 'Select city'}
                                            </Text>
                                            <Ionicons
                                                name="chevron-down"
                                                size={14}
                                                color={Colors.charcoalLight}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Row 2: Capacity */}
                                <View style={styles.filterRowSingle}>
                                    <Text style={styles.filterLabel}>Capacity</Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.filterInput,
                                            selectedCapacity && styles.filterInputActive,
                                        ]}
                                        onPress={() => setCapacityModalVisible(true)}
                                        activeOpacity={0.8}
                                    >
                                        <Text
                                            style={[
                                                styles.filterInputText,
                                                !selectedCapacity && styles.filterInputPlaceholder,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {selectedCapacity || 'Select capacity'}
                                        </Text>
                                        <Ionicons
                                            name="chevron-down"
                                            size={14}
                                            color={Colors.charcoalLight}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* Row 3: Price Range */}
                                <View style={styles.filterRow}>
                                    <View style={styles.filterCol}>
                                        <Text style={styles.filterLabel}>Min Price (₹)</Text>
                                        <View
                                            style={[
                                                styles.filterInput,
                                                minPrice && styles.filterInputActive,
                                            ]}
                                        >
                                            <TextInput
                                                style={styles.filterTextInput}
                                                placeholder="0"
                                                placeholderTextColor={Colors.charcoalLight}
                                                value={minPrice}
                                                onChangeText={setMinPrice}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.filterCol}>
                                        <Text style={styles.filterLabel}>Max Price (₹)</Text>
                                        <View
                                            style={[
                                                styles.filterInput,
                                                maxPrice && styles.filterInputActive,
                                            ]}
                                        >
                                            <TextInput
                                                style={styles.filterTextInput}
                                                placeholder="∞"
                                                placeholderTextColor={Colors.charcoalLight}
                                                value={maxPrice}
                                                onChangeText={setMaxPrice}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Apply */}
                                <TouchableOpacity
                                    style={styles.applyFiltersBtn}
                                    onPress={handleApplyFilters}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={16}
                                        color={Colors.charcoal}
                                    />
                                    <Text style={styles.applyFiltersBtnText}>Apply Filters</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Active filter strip */}
                        {(activeFilterCount > 0 || searchQuery) && (
                            <View style={styles.activeFilterStrip}>
                                <Ionicons name="funnel" size={13} color={Colors.primaryDark} />
                                <Text style={styles.activeFilterText} numberOfLines={1}>
                                    {[
                                        searchQuery && `"${searchQuery}"`,
                                        selectedCity,
                                        selectedVenueType,
                                        selectedCapacity && `Cap: ${selectedCapacity}`,
                                        (minPrice || maxPrice) &&
                                            `₹${minPrice || '0'} – ₹${maxPrice || '∞'}`,
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

                            {isLoading ? (
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

            {/* ── Dropdown Modals ── */}
            <DropdownModal
                visible={venueTypeModalVisible}
                title="Select Venue Type"
                options={venueTypeOptions}
                selectedValue={selectedVenueType}
                onSelect={value => setSelectedVenueType(value)}
                onClose={() => setVenueTypeModalVisible(false)}
                searchable
            />
            <DropdownModal
                visible={cityModalVisible}
                title="Select City"
                options={cityOptions}
                selectedValue={selectedCity}
                onSelect={value => setSelectedCity(value)}
                onClose={() => setCityModalVisible(false)}
                searchable
            />
            <DropdownModal
                visible={capacityModalVisible}
                title="Select Capacity"
                options={capacityOptions}
                selectedValue={selectedCapacity}
                onSelect={value => setSelectedCapacity(value)}
                onClose={() => setCapacityModalVisible(false)}
            />
        </View>
    );
}

// ─── Styles (unchanged) ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
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
    ownerSearchWrap: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
    clientSearchWrap: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
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
    filtersToggleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        gap: Spacing.sm,
    },
    filtersToggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
        borderWidth: 1.5,
        borderColor: Colors.border,
        ...Shadows.card,
    },
    filtersToggleBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
    filtersToggleText: {
        flex: 1,
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    filtersToggleTextActive: { color: Colors.primary },
    filterCountBadge: {
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    filterCountText: { fontSize: 10, fontWeight: Typography.extraBold, color: Colors.charcoal },
    clearAllBtn: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.danger,
        ...Shadows.card,
    },
    clearAllText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.danger },
    filtersSection: {
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.xl,
        marginTop: Spacing.md,
        padding: Spacing.lg,
        borderRadius: Radii.lg,
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        gap: Spacing.md,
        ...Shadows.card,
    },
    filterRow: { flexDirection: 'row', gap: Spacing.sm },
    filterRowSingle: { gap: 6 },
    filterCol: { flex: 1, gap: 6 },
    filterLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    filterInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    filterInputActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
    filterInputText: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.charcoal,
        fontWeight: Typography.medium,
    },
    filterInputPlaceholder: { color: Colors.charcoalLight },
    filterTextInput: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.charcoal,
        fontWeight: Typography.medium,
        padding: 0,
    },
    applyFiltersBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        borderRadius: Radii.md,
        paddingVertical: 13,
        marginTop: Spacing.xs,
        ...Shadows.primary,
    },
    applyFiltersBtnText: {
        fontSize: Typography.base,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
    categoriesContainer: {
        paddingHorizontal: Spacing.xl,
        gap: 10,
        paddingVertical: Spacing.md,
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
    loaderWrap: { alignItems: 'center', paddingVertical: 48, gap: 12 },
    loaderText: {
        fontSize: Typography.md,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
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
    dropdownBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    dropdownSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        paddingHorizontal: Spacing.xl,
        paddingBottom: 32,
        ...Shadows.floating,
    },
    dropdownHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    dropdownTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        marginBottom: Spacing.md,
    },
    dropdownSearchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        paddingHorizontal: 12,
        height: 44,
        marginBottom: Spacing.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    dropdownSearchInput: { flex: 1, fontSize: Typography.base, color: Colors.charcoal },
    dropdownOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 13,
        paddingHorizontal: 10,
        borderRadius: Radii.md,
        marginBottom: 2,
    },
    dropdownOptionActive: { backgroundColor: Colors.primaryLight },
    dropdownOptionText: {
        fontSize: Typography.md,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    dropdownOptionTextActive: { color: Colors.primary, fontWeight: Typography.bold },
});

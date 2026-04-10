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
    Modal,
    FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme/theme';
import VenueCard from '../../components/venues/venueCard';
import { venueAPI } from '../../service/apis/venues';
import { useAuthStore } from '../../store/useAuthStore';
import { OwnerTabParamList } from '../../navigations/tabNavigations/OwnerTabNavigation';
import { ClientTabParamList } from '../../navigations/tabNavigations/ClientTabNavigation';
import { tabParamList } from '../../navigations/tabNavigations/TabNavigation';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { ownerAPI } from '../../service/apis/owner';
import { RootStackParamList } from '../../navigations/RootNavigation';

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

// ── Dropdown Modal Component ──────────────────────────────────────────────────
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

    const [venues, setVenues] = useState<any[]>([]);
    const [categories, setCategories] = useState<VenueType[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [searchQuery, setSearch] = useState('');
    const [selectedCategory, setCategory] = useState('all');

    // Inline filter states
    const [selectedVenueType, setSelectedVenueType] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedCapacity, setSelectedCapacity] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [filtersExpanded, setFiltersExpanded] = useState(false);

    // Dropdown modals
    const [venueTypeModalVisible, setVenueTypeModalVisible] = useState(false);
    const [cityModalVisible, setCityModalVisible] = useState(false);
    const [capacityModalVisible, setCapacityModalVisible] = useState(false);

    // Owner filter: 'all' | 'approved' | 'pending' | 'rejected'
    const [ownerFilter, setOwnerFilter] = useState<string>('all');

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Dropdown options
    const venueTypeOptions = categories
        .filter(c => c._id !== 'all')
        .map(c => ({ label: c.name, value: c.name }));

    const cityOptions = [
        { label: 'Mumbai', value: 'Mumbai' },
        { label: 'Delhi', value: 'Delhi' },
        { label: 'Bangalore', value: 'Bangalore' },
        { label: 'Hyderabad', value: 'Hyderabad' },
        { label: 'Chennai', value: 'Chennai' },
        { label: 'Pune', value: 'Pune' },
        { label: 'Kolkata', value: 'Kolkata' },
        { label: 'Ahmedabad', value: 'Ahmedabad' },
    ];

    const capacityOptions = [
        { label: '1-10', value: '1-10' },
        { label: '10-25', value: '10-25' },
        { label: '25-50', value: '25-50' },
        { label: '50-100', value: '50-100' },
        { label: '100-200', value: '100-200' },
        { label: '200+', value: '200+' },
    ];

    const activeFilterCount = [
        selectedVenueType,
        selectedCity,
        selectedCapacity,
        minPrice,
        maxPrice,
    ].filter(Boolean).length;

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
                if (selectedCity) params.city = selectedCity;
                if (selectedVenueType) params.venueType = selectedVenueType;
                if (selectedCapacity) params.capacity = selectedCapacity;
                if (minPrice) params.minPrice = minPrice;
                if (maxPrice) params.maxPrice = maxPrice;
            }

            params.status = 'all'
            const response = isOwner
                ? await ownerAPI.getVenues()
                : await venueAPI.getVenues(params);

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

    const handleClearFilters = () => {
        setSelectedVenueType('');
        setSelectedCity('');
        setSelectedCapacity('');
        setMinPrice('');
        setMaxPrice('');
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

    const handleAddVenue = () => {
        navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('addVenue');
    };

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
                       CLIENT VIEW — search + inline filters + categories + venues
                    ══════════════════════════════════════════════════════ */
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

                        {/* Filters Toggle Button */}
                        <View style={styles.filtersToggleWrap}>
                            <TouchableOpacity
                                style={[
                                    styles.filtersToggleBtn,
                                    filtersExpanded && styles.filtersToggleBtnActive,
                                ]}
                                onPress={() => setFiltersExpanded(!filtersExpanded)}
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

                        {/* Expandable Filter Section */}
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
                                                onEndEditing={() => fetchVenues()}
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
                                                onEndEditing={() => fetchVenues()}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Apply Filters Button */}
                                <TouchableOpacity
                                    style={styles.applyFiltersBtn}
                                    onPress={() => {
                                        fetchVenues();
                                        setFiltersExpanded(false);
                                    }}
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

                        {/* Category chips */}
                        {/* <ScrollView
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
                        </ScrollView> */}

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

            {/* ── Dropdown Modals ── */}
            <DropdownModal
                visible={venueTypeModalVisible}
                title="Select Venue Type"
                options={venueTypeOptions}
                selectedValue={selectedVenueType}
                onSelect={value => {
                    setSelectedVenueType(value);
                    fetchVenues();
                }}
                onClose={() => setVenueTypeModalVisible(false)}
                searchable
            />

            <DropdownModal
                visible={cityModalVisible}
                title="Select City"
                options={cityOptions}
                selectedValue={selectedCity}
                onSelect={value => {
                    setSelectedCity(value);
                    fetchVenues();
                }}
                onClose={() => setCityModalVisible(false)}
                searchable
            />

            <DropdownModal
                visible={capacityModalVisible}
                title="Select Capacity"
                options={capacityOptions}
                selectedValue={selectedCapacity}
                onSelect={value => {
                    setSelectedCapacity(value);
                    fetchVenues();
                }}
                onClose={() => setCapacityModalVisible(false)}
            />
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

    // ── Client: search ──
    clientSearchWrap: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
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

    // ── Filters Toggle ──
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
    filtersToggleBtnActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
    },
    filtersToggleText: {
        flex: 1,
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    filtersToggleTextActive: {
        color: Colors.primary,
    },
    filterCountBadge: {
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    filterCountText: {
        fontSize: 10,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
    clearAllBtn: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.danger,
        ...Shadows.card,
    },
    clearAllText: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.danger,
    },

    // ── Filters Section ──
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
    filterRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    filterRowSingle: {
        gap: 6,
    },
    filterCol: {
        flex: 1,
        gap: 6,
    },
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
    filterInputActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
    },
    filterInputText: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.charcoal,
        fontWeight: Typography.medium,
    },
    filterInputPlaceholder: {
        color: Colors.charcoalLight,
    },
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

    // Category chips
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

    // ── Dropdown Modal ──
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
    dropdownSearchInput: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.charcoal,
    },
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
    dropdownOptionTextActive: {
        color: Colors.primary,
        fontWeight: Typography.bold,
    },
});

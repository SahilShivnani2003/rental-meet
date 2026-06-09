import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
    PanResponder,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import VenueCard from '@/components/venues/venueCard';
import { ClientTabParamList } from '@/navigations/tabNavigations/ClientTabNavigation';
import { OwnerTabParamList } from '@/navigations/tabNavigations/OwnerTabNavigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors, Spacing, Radii, Shadows, Typography } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import { useGetVenueType } from '@/features/venueType/hooks/useGetVenueType';
import { useGetAllVenue } from '../hooks/useGetAllVenue';
import { useGetOwnerVenue } from '../hooks/useGetOwnerVenue';
import { VenueType } from '@/features/venueType/types/VenueType';
import FeaturedCard from '@/components/landing/featuredCard';
import { useDeleteVenue } from '../hooks/useDeleteVenue';
import { useAlert } from '@/context/AlertContext';
import { ApiError } from '@/types/ApiError';
import { useResubmitVenue } from '../hooks/useResubmitVenue';
import ManageAvailabilityModal from '../models/ManageAvailabilityModal';
import { useToggleActive } from '../hooks/useToggleActive';
import { Venue } from '../types/Venue';
import { useCreateBlockDates } from '../hooks/useCreateBlockDates';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import useEntrance from '@/hooks/useEntrance';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const { width: SCREEN_W } = Dimensions.get('window');

const ALL_CATEGORY: VenueType = {
    _id: 'all',
    name: 'All',
    code: 'all',
    icon: '🏠',
    description: '',
    isActive: true,
    order: 0,
};

// ── Price range constants ─────────────────────────────────────────────────────
const PRICE_MIN = 0;
const PRICE_MAX = 100000;
const PRICE_STEP = 500;

// ── Dual-handle Range Slider ──────────────────────────────────────────────────
interface RangeSliderProps {
    min: number;
    max: number;
    step: number;
    low: number;
    high: number;
    onValueChange: (low: number, high: number) => void;
}

function RangeSlider({ min, max, step, low, high, onValueChange }: RangeSliderProps) {
    const sliderRef = useRef<View>(null);
    const sliderWidth = useRef(0);
    const lowRef = useRef(low);
    const highRef = useRef(high);

    // Keep refs in sync
    useEffect(() => {
        lowRef.current = low;
    }, [low]);
    useEffect(() => {
        highRef.current = high;
    }, [high]);

    const clampStep = (val: number) => {
        const stepped = Math.round(val / step) * step;
        return Math.max(min, Math.min(max, stepped));
    };

    const xToValue = (x: number) => {
        const ratio = Math.max(0, Math.min(1, x / sliderWidth.current));
        return clampStep(min + ratio * (max - min));
    };

    const valueToPercent = (val: number) => ((val - min) / (max - min)) * 100;

    // Low thumb pan
    const lowPan = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {},
            onPanResponderMove: (_, gs) => {
                const trackLeft = 0;
                const newVal = xToValue(gs.moveX - trackLeft);
                if (newVal < highRef.current) {
                    onValueChange(newVal, highRef.current);
                }
            },
        }),
    ).current;

    // High thumb pan
    const highPan = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {},
            onPanResponderMove: (_, gs) => {
                const newVal = xToValue(gs.moveX);
                if (newVal > lowRef.current) {
                    onValueChange(lowRef.current, newVal);
                }
            },
        }),
    ).current;

    const lowPct = valueToPercent(low);
    const highPct = valueToPercent(high);

    const formatPrice = (val: number) =>
        val >= 100000
            ? '₹1L+'
            : val === 0
            ? '₹0'
            : `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;

    return (
        <View style={rs.wrap}>
            {/* Labels */}
            <View style={rs.labelsRow}>
                <Text style={rs.rangeLabel}>{formatPrice(low)}</Text>
                <Text style={rs.rangeSep}>—</Text>
                <Text style={rs.rangeLabel}>{formatPrice(high)}</Text>
            </View>

            {/* Track */}
            <View
                ref={sliderRef}
                style={rs.trackOuter}
                onLayout={e => {
                    sliderWidth.current = e.nativeEvent.layout.width;
                }}
            >
                {/* Inactive track */}
                <View style={rs.trackInactive} />

                {/* Active track fill */}
                <View
                    style={[rs.trackActive, { left: `${lowPct}%`, right: `${100 - highPct}%` }]}
                />

                {/* Low thumb */}
                <View style={[rs.thumb, { left: `${lowPct}%` }]} {...lowPan.panHandlers}>
                    <View style={rs.thumbInner} />
                </View>

                {/* High thumb */}
                <View style={[rs.thumb, { left: `${highPct}%` }]} {...highPan.panHandlers}>
                    <View style={rs.thumbInner} />
                </View>
            </View>

            {/* Min / Max hint */}
            <View style={rs.hintRow}>
                <Text style={rs.hint}>₹0</Text>
                <Text style={rs.hint}>₹1L+</Text>
            </View>
        </View>
    );
}

const rs = StyleSheet.create({
    wrap: { gap: 4 },
    labelsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 6,
    },
    rangeLabel: {
        fontSize: 13,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: -0.2,
    },
    rangeSep: { fontSize: 12, color: Colors.charcoalLight },
    trackOuter: {
        height: 36,
        justifyContent: 'center',
        position: 'relative',
        marginHorizontal: 10,
    },
    trackInactive: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
    },
    trackActive: {
        position: 'absolute',
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
    },
    thumb: {
        position: 'absolute',
        width: 26,
        height: 26,
        borderRadius: 13,
        marginLeft: -13,
        top: 5,
        backgroundColor: Colors.surface,
        borderWidth: 2,
        borderColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.card,
    },
    thumbInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    hintRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 2,
        marginHorizontal: 10,
    },
    hint: { fontSize: 10, color: Colors.charcoalLight, fontWeight: Typography.medium },
});

// ─────────────────────────────────────────────────────────────────────────────
type VenueProps = CompositeScreenProps<
    BottomTabScreenProps<ClientTabParamList, 'venues'>,
    BottomTabScreenProps<OwnerTabParamList, 'venues'>
>;

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
export default function VenuesScreen({ navigation, route }: VenueProps) {
    const { search, city, capacity, venueType } = route?.params ?? {};
    const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    const { user } = useAuthStore();
    const isOwner = user?.role === 'owner';
    const alert = useAlert();
    const [operationLoading, setOperationLoading] = useState<string | null>(null);

    // ── Filter state ──────────────────────────────────────────────────────────
    const [searchQuery, setSearch] = useState('');
    const [selectedVenueType, setSelectedVenueType] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedCapacity, setSelectedCapacity] = useState('');
    const [priceLow, setPriceLow] = useState(PRICE_MIN);
    const [priceHigh, setPriceHigh] = useState(PRICE_MAX);
    const priceActive = priceLow > PRICE_MIN || priceHigh < PRICE_MAX;
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const [ownerFilter, setOwnerFilter] = useState<string>('all');

    const [venueTypeModalVisible, setVenueTypeModalVisible] = useState(false);
    const [cityModalVisible, setCityModalVisible] = useState(false);
    const [capacityModalVisible, setCapacityModalVisible] = useState(false);

    // ── Availability modal ────────────────────────────────────────────────────
    const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
    const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
    const [blockDate, setBlockDate] = useState<Date | null>(null);
    const [reason, setReason] = useState('');

    const fadeAnim = useRef(new Animated.Value(0)).current;

    // ★ Debounce search — no more manual timer
    const debouncedSearch = useDebouncedValue(searchQuery, 500);

    // ★ Applied filter state — only committed when "Apply Filters" is pressed
    const [appliedVenueType, setAppliedVenueType] = useState('');
    const [appliedCity, setAppliedCity] = useState('');
    const [appliedCapacity, setAppliedCapacity] = useState('');
    const [appliedPriceLow, setAppliedPriceLow] = useState(PRICE_MIN);
    const [appliedPriceHigh, setAppliedPriceHigh] = useState(PRICE_MAX);
    const appliedPriceActive = appliedPriceLow > PRICE_MIN || appliedPriceHigh < PRICE_MAX;

    // ── Data hooks ────────────────────────────────────────────────────────────
    const { data: venueTypeData } = useGetVenueType();

    // ★ Build query params — uses debounced search + applied filters
    const clientQueryParams = useMemo(
        () => ({
            ...(debouncedSearch && { search: debouncedSearch }),
            ...(appliedVenueType && { venueType: appliedVenueType }),
            ...(appliedCity && { city: appliedCity }),
            ...(appliedCapacity && { capacity: appliedCapacity }),
            ...(appliedPriceActive && { minPrice: appliedPriceLow, maxPrice: appliedPriceHigh }),
        }),
        [
            debouncedSearch,
            appliedVenueType,
            appliedCity,
            appliedCapacity,
            appliedPriceLow,
            appliedPriceHigh,
            appliedPriceActive,
        ],
    );

    // ★ useInfiniteQuery via updated hook
    const {
        data: clientVenueData,
        isLoading: isClientVenueLoading,
        isRefetching: isClientRefetching,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        refetch: refetchClientVenues,
    } = useGetAllVenue(clientQueryParams, { enabled: !isOwner });

    // ★ Flatten pages
    const clientVenues: Venue[] = useMemo(
        () => clientVenueData?.pages.flatMap(p => p.venues ?? []) ?? [],
        [clientVenueData],
    );
    const clientTotalCount: number =
        clientVenueData?.pages[0]?.total ??
        clientVenueData?.pages[0]?.totalCount ??
        clientVenues.length;

    const {
        data: ownerVenueData,
        isLoading: isOwnerVenueLoading,
        isRefetching: isOwnerRefetching,
        refetch: refetchOwnerVenues,
    } = useGetOwnerVenue({ enabled: isOwner });

    const { mutate: deleteVenue } = useDeleteVenue();
    const { mutate: resubmitVenue } = useResubmitVenue();
    const { mutate: toggleActive } = useToggleActive();
    const { mutate: createBlockDates } = useCreateBlockDates();

    const ownerVenues: Venue[] = ownerVenueData?.venues ?? [];
    const isLoading = isOwner ? isOwnerVenueLoading : isClientVenueLoading;
    const isRefetching = isOwner ? isOwnerRefetching : isClientRefetching;
    const refetch = isOwner ? refetchOwnerVenues : refetchClientVenues;

    const rawVenueTypes: VenueType[] = venueTypeData?.venueTypes ?? [];

    // ── Sync route params ─────────────────────────────────────────────────────
    useEffect(() => {
        if (search || city || capacity || venueType) {
            setSearch(search ?? '');
            setAppliedCapacity(capacity ?? '');
            setAppliedCity(city ?? '');
            setAppliedVenueType(venueType ?? '');
            // Also sync UI filter state so the dropdowns reflect route params
            setSelectedCapacity(capacity ?? '');
            setSelectedCity(city ?? '');
            setSelectedVenueType(venueType ?? '');
        }
    }, [search, city, capacity, venueType]);

    // ── Animate in ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isLoading) {
            fadeAnim.setValue(0);
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        }
    }, [isLoading]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleDeleteVenue = useCallback(
        (id: string) => {
            if (!id) return;
            setOperationLoading('Deleting venue…');
            deleteVenue(id, {
                onSuccess: () => {
                    alert.success('Deleted', 'Venue deleted successfully');
                    refetch();
                },
                onError: (error: ApiError) => {
                    alert.error('Error', error?.message || 'Something went wrong');
                },
                onSettled: () => setOperationLoading(null),
            });
        },
        [deleteVenue, refetch, alert],
    );

    const handleResubmitVenue = useCallback(
        (id: string) => {
            if (!id) return;
            setOperationLoading('Re-submitting venue…');
            resubmitVenue(id, {
                onSuccess: () => {
                    alert.success('Re-submitted', 'Venue re-submitted successfully');
                    refetch();
                },
                onError: (error: ApiError) => {
                    alert.error('Error', error?.message || 'Something went wrong');
                },
                onSettled: () => setOperationLoading(null),
            });
        },
        [resubmitVenue, refetch, alert],
    );

    const handleOpenAvailabilityModal = useCallback((venue: Venue) => {
        setSelectedVenue(venue);
        setBlockDate(null);
        setReason('');
        setAvailabilityModalVisible(true);
    }, []);

    const handleCloseAvailabilityModal = useCallback(() => {
        setAvailabilityModalVisible(false);
        setTimeout(() => {
            setSelectedVenue(null);
            setBlockDate(null);
            setReason('');
        }, 300);
    }, []);

    const handleToggleActive = useCallback(() => {
        if (!selectedVenue?._id) return;
        if (!selectedVenue.isActive) return;
        setOperationLoading(selectedVenue.isActive ? 'Disabling venue…' : 'Enabling venue…');
        toggleActive(
            { id: selectedVenue._id, payload: { currentIsActive: selectedVenue?.isActive } },
            {
                onSuccess: () => {
                    alert.success(
                        'Success',
                        `Venue ${selectedVenue.isActive ? 'disabled' : 'enabled'} successfully`,
                    );
                    refetch();
                    handleCloseAvailabilityModal();
                },
                onError: (error: ApiError) => {
                    alert.error('Error', error.message || 'Something went wrong');
                },
                onSettled: () => setOperationLoading(null),
            },
        );
    }, [selectedVenue, toggleActive, refetch, alert, handleCloseAvailabilityModal]);

    const handleCreateBlockDates = useCallback(() => {
        if (!selectedVenue?._id || !blockDate || !reason) return;
        setOperationLoading('Blocking dates…');
        createBlockDates(
            { id: selectedVenue._id, payload: { date: blockDate, reason: reason.trim() } },
            {
                onSuccess: () => {
                    alert.success('Success', 'Dates blocked successfully');
                    refetch();
                    handleCloseAvailabilityModal();
                },
                onError: (error: ApiError) => {
                    alert.error('Error', error.message || 'Something went wrong');
                },
                onSettled: () => setOperationLoading(null),
            },
        );
    }, [
        selectedVenue,
        blockDate,
        reason,
        createBlockDates,
        refetch,
        alert,
        handleCloseAvailabilityModal,
    ]);

    const handleClearFilters = useCallback(() => {
        setSearch('');
        setSelectedVenueType('');
        setSelectedCity('');
        setSelectedCapacity('');
        setPriceLow(PRICE_MIN);
        setPriceHigh(PRICE_MAX);
        setAppliedVenueType('');
        setAppliedCity('');
        setAppliedCapacity('');
        setAppliedPriceLow(PRICE_MIN);
        setAppliedPriceHigh(PRICE_MAX);
        setOwnerFilter('all');
    }, []);

    // ★ "Apply" commits the UI filter state to the applied state (triggers new query)
    const handleApplyFilters = useCallback(() => {
        setAppliedVenueType(selectedVenueType);
        setAppliedCity(selectedCity);
        setAppliedCapacity(selectedCapacity);
        setAppliedPriceLow(priceLow);
        setAppliedPriceHigh(priceHigh);
        setFiltersExpanded(false);
    }, [selectedVenueType, selectedCity, selectedCapacity, priceLow, priceHigh]);

    const handleAddVenue = useCallback(() => {
        navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('addVenue');
    }, [navigation]);

    // ★ Infinite scroll handler
    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // ── Computed ──────────────────────────────────────────────────────────────
    const activeFilterCount = [
        appliedVenueType,
        appliedCity,
        appliedCapacity,
        appliedPriceActive ? 'price' : '',
    ].filter(Boolean).length;

    const ownerStats: OwnerStatConfig[] = [
        {
            label: 'All Venues',
            value: ownerVenues.length,
            color: Colors.primary,
            bg: Colors.primaryLight,
            borderColor: Colors.primary,
        },
        {
            label: 'Approved',
            value: ownerVenues.filter(v => v.status === 'approved').length,
            color: Colors.success,
            bg: Colors.successLight,
            borderColor: Colors.success,
        },
        {
            label: 'Pending',
            value: ownerVenues.filter(v => v.status === 'pending').length,
            color: Colors.warning,
            bg: Colors.warningLight,
            borderColor: Colors.warning,
        },
        {
            label: 'Rejected',
            value: ownerVenues.filter(v => v.status === 'rejected').length,
            color: Colors.danger,
            bg: Colors.dangerLight,
            borderColor: Colors.danger,
        },
    ];

    const ownerFilterKeys = ['all', 'approved', 'pending', 'rejected'];
    const displayedOwnerVenues =
        ownerFilter !== 'all' ? ownerVenues.filter(v => v.status === ownerFilter) : ownerVenues;

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
        { label: '30–50', value: '30-50' },
        { label: '50–100', value: '50-100' },
        { label: '100–200', value: '100-200' },
        { label: '200–300', value: '200-300' },
        { label: '300+', value: '300-400' },
    ];

    const { fade: headerFade, slide: headerSlide } = useEntrance(0);

    // ── Client FlatList parts ─────────────────────────────────────────────────

    const clientListHeader = useMemo(
        () => (
            <>
                {/* Animated header */}
                <Animated.View
                    style={[
                        styles.header,
                        { opacity: headerFade, transform: [{ translateY: headerSlide }] },
                    ]}
                >
                    <View style={styles.headerAccentBar} />
                    <View style={styles.headerContent}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerEyebrow}>BROWSE VENUES</Text>
                            <Text style={styles.headerTitle}>Browse All Venues</Text>
                            <Text style={styles.headerSub}>
                                Find the perfect venue for your next meeting, conference, or
                                corporate event.
                            </Text>
                        </View>
                    </View>
                </Animated.View>

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
                            onChangeText={setSearch}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearch('')}>
                                <Ionicons
                                    name="close-circle"
                                    size={16}
                                    color={Colors.charcoalLight}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Filter toggle */}
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
                                <Text style={styles.filterCountText}>{activeFilterCount}</Text>
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

                {/* Expandable filter panel */}
                {filtersExpanded && (
                    <View style={styles.filtersSection}>
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
                                            !selectedVenueType && styles.filterInputPlaceholder,
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

                        {/* Price Range Slider */}
                        <View style={styles.filterRowSingle}>
                            <View style={styles.priceLabelRow}>
                                <Text style={styles.filterLabel}>Price Range</Text>
                                {priceActive && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setPriceLow(PRICE_MIN);
                                            setPriceHigh(PRICE_MAX);
                                        }}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Text style={styles.priceResetLink}>Reset</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View
                                style={[styles.sliderWrap, priceActive && styles.sliderWrapActive]}
                            >
                                <RangeSlider
                                    min={PRICE_MIN}
                                    max={PRICE_MAX}
                                    step={PRICE_STEP}
                                    low={priceLow}
                                    high={priceHigh}
                                    onValueChange={(lo, hi) => {
                                        setPriceLow(lo);
                                        setPriceHigh(hi);
                                    }}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.applyFiltersBtn}
                            onPress={handleApplyFilters}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="checkmark-circle" size={16} color={Colors.charcoal} />
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
                                appliedCity,
                                appliedVenueType,
                                appliedCapacity && `Cap: ${appliedCapacity}`,
                                appliedPriceActive &&
                                    `₹${appliedPriceLow / 1000}k – ₹${
                                        appliedPriceHigh >= PRICE_MAX
                                            ? '1L+'
                                            : `${appliedPriceHigh / 1000}k`
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

                {/* Section header */}
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <View style={styles.sectionAccent} />
                        <Text style={styles.sectionTitle}>All Venues</Text>
                    </View>
                    <Text style={styles.venueCount}>{clientTotalCount} spaces</Text>
                </View>

                {/* Skeleton while first page loads */}
                {isClientVenueLoading && (
                    <View style={styles.loaderWrap}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loaderText}>Finding spaces...</Text>
                    </View>
                )}
            </>
        ),
        [
            headerFade,
            headerSlide,
            searchQuery,
            filtersExpanded,
            activeFilterCount,
            selectedVenueType,
            selectedCity,
            selectedCapacity,
            priceLow,
            priceHigh,
            priceActive,
            appliedCity,
            appliedVenueType,
            appliedCapacity,
            appliedPriceActive,
            appliedPriceLow,
            appliedPriceHigh,
            clientTotalCount,
            isClientVenueLoading,
        ],
    );

    const clientListFooter = isFetchingNextPage ? (
        <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color={Colors.primary} />
        </View>
    ) : null;

    const clientListEmpty = !isClientVenueLoading ? (
        <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={Colors.primaryBorder} />
            <Text style={styles.emptyTitle}>No venues found</Text>
            {(activeFilterCount > 0 || searchQuery) && (
                <TouchableOpacity onPress={handleClearFilters}>
                    <Text style={styles.clearFiltersLink}>Clear all filters</Text>
                </TouchableOpacity>
            )}
        </View>
    ) : null;

    const renderClientItem = useCallback(
        ({ item: v }: { item: Venue }) => (
            <Animated.View style={[styles.venuesGrid, { opacity: fadeAnim }]}>
                <FeaturedCard
                    key={v._id}
                    v={v}
                    index={0}
                    role={user?.role}
                    onPress={() => rootNav.navigate('venueDetail', { venue: v })}
                />
            </Animated.View>
        ),
        [user?.role, rootNav],
    );

    const clientKeyExtractor = useCallback((v: Venue, i: number) => v._id ?? i.toString(), []);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            {isOwner && (
                <>
                    <View style={styles.header}>
                        <View style={styles.headerAccentBar} />
                        <View style={styles.headerContent}>
                            <View>
                                <Text style={styles.greetingLabel}>MANAGE</Text>
                                <Text style={styles.greeting}>My Venues</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.addVenueButton}
                                onPress={handleAddVenue}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="add" size={18} color={Colors.charcoal} />
                                <Text style={styles.addVenueLabel}>Add Venue</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.headerSubtitle}>
                            {`${ownerVenues.length} venue${
                                ownerVenues.length !== 1 ? 's' : ''
                            } listed`}
                        </Text>
                    </View>

                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={isOwnerRefetching}
                                onRefresh={refetchOwnerVenues}
                                tintColor={Colors.primary}
                            />
                        }
                    >
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
                                    onChangeText={setSearch}
                                    returnKeyType="search"
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearch('')}>
                                        <Ionicons
                                            name="close-circle"
                                            size={16}
                                            color={Colors.charcoalLight}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

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
                                    {displayedOwnerVenues.length} spaces
                                </Text>
                            </View>

                            {isOwnerVenueLoading ? (
                                <View style={styles.loaderWrap}>
                                    <ActivityIndicator size="large" color={Colors.primary} />
                                    <Text style={styles.loaderText}>Loading venues...</Text>
                                </View>
                            ) : displayedOwnerVenues.length === 0 ? (
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
                                    {displayedOwnerVenues.map((v, i) => (
                                        <FeaturedCard
                                            key={v._id}
                                            v={v}
                                            index={i}
                                            role={user?.role}
                                            onPress={() =>
                                                rootNav.navigate('venueDetail', { venue: v })
                                            }
                                            onDelete={() => v._id && handleDeleteVenue(v._id)}
                                            onResubmit={() => v._id && handleResubmitVenue(v._id)}
                                            onDisable={() => handleOpenAvailabilityModal(v)}
                                        />
                                    ))}
                                </Animated.View>
                            )}
                        </View>
                        <View style={{ height: 100 }} />
                    </ScrollView>
                </>
            )}

            {/* ══════════════ CLIENT VIEW (FlatList — paginated) ══════════════ */}
            {!isOwner && (
                <FlatList
                    data={clientVenues}
                    keyExtractor={clientKeyExtractor}
                    renderItem={renderClientItem}
                    ListHeaderComponent={clientListHeader}
                    ListFooterComponent={clientListFooter}
                    ListEmptyComponent={clientListEmpty}
                    contentContainerStyle={styles.clientScroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.4}
                    refreshControl={
                        <RefreshControl
                            refreshing={isClientRefetching}
                            onRefresh={refetchClientVenues}
                            tintColor={Colors.primary}
                            colors={[Colors.primary]}
                        />
                    }
                />
            )}

            {/* ── Shared modals ── */}
            <DropdownModal
                visible={venueTypeModalVisible}
                title="Select Venue Type"
                options={venueTypeOptions}
                selectedValue={selectedVenueType}
                onSelect={setSelectedVenueType}
                onClose={() => setVenueTypeModalVisible(false)}
                searchable
            />
            <DropdownModal
                visible={cityModalVisible}
                title="Select City"
                options={cityOptions}
                selectedValue={selectedCity}
                onSelect={setSelectedCity}
                onClose={() => setCityModalVisible(false)}
                searchable
            />
            <DropdownModal
                visible={capacityModalVisible}
                title="Select Capacity"
                options={capacityOptions}
                selectedValue={selectedCapacity}
                onSelect={setSelectedCapacity}
                onClose={() => setCapacityModalVisible(false)}
            />

            <ManageAvailabilityModal
                visible={availabilityModalVisible}
                onClose={handleCloseAvailabilityModal}
                title="Manage Availability"
                subtitle={selectedVenue?.businessName}
                sections={[
                    {
                        icon: selectedVenue?.isActive ? 'ban-outline' : 'checkmark-circle-outline',
                        title: selectedVenue?.isActive
                            ? 'Disable Until Re-enabled'
                            : 'Enable Venue',
                        subtitle: selectedVenue?.isActive
                            ? 'Venue will be hidden from public listing until you manually enable it.'
                            : 'Venue will become visible and bookable again.',
                        variant: selectedVenue?.isActive ? 'danger' : 'primary',
                        action: {
                            ctaLabel: selectedVenue?.isActive ? 'Disable' : 'Enable',
                            onPress: handleToggleActive,
                        },
                    },
                    {
                        icon: 'calendar-outline',
                        title: 'Block Specific Dates',
                        subtitle: 'Disable booking for selected dates',
                        variant: 'info',
                        form: {
                            fields: [
                                {
                                    type: 'date',
                                    placeholder: 'Click to pick date...',
                                    value: blockDate,
                                    onChange: setBlockDate,
                                    minimumDate: new Date(),
                                },
                                {
                                    type: 'text',
                                    placeholder: 'Reason (optional) — e.g. External booking',
                                    value: reason,
                                    onChangeText: setReason,
                                },
                            ],
                            submitLabel: 'Block Selected Dates',
                            submitDisabled: !blockDate,
                            onSubmit: handleCreateBlockDates,
                        },
                    },
                ]}
            />

            {operationLoading !== null && (
                <View style={styles.opLoaderBackdrop} pointerEvents="box-only">
                    <View style={styles.opLoaderCard}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.opLoaderText}>{operationLoading}</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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

    // ── Price slider ──────────────────────────────────────────────────────────
    priceLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceResetLink: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.bold },
    sliderWrap: {
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    sliderWrapActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },

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
    venuesGrid: { paddingHorizontal: Spacing.lg, gap: 14 },
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
    dropdownBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
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
    opLoaderBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.38)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
    },
    opLoaderCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.xl,
        alignItems: 'center',
        gap: Spacing.md,
        minWidth: 180,
        ...Shadows.floating,
    },
    opLoaderText: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
        letterSpacing: 0.2,
    },
    clientScroll: { paddingBottom: 120 },
    footerLoader: { paddingVertical: 20, alignItems: 'center' },
});

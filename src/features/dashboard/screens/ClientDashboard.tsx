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
    Modal,
    Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FeaturedCard from '@/components/landing/featuredCard';
import useEntrance from '@/hooks/useEntrance';
import { ClientTabParamList } from '@/navigations/tabNavigations/ClientTabNavigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors, Radii, Spacing, Shadows, Typography } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import { VenueType } from '@/features/venueType/types/VenueType';
import { useGetAllVenue } from '@/features/venue/hooks/useGetAllVenue';
import { Venue } from '@/features/venue/types/Venue';
import { useGetVenueLoc } from '@/features/venue/hooks/useGetVenueLoc';
import { useGetVenueType } from '@/features/venueType/hooks/useGetVenueType';

const { width: W, height: H } = Dimensions.get('window');

const CAPACITY_OPTIONS = [
    { label: 'Any Capacity', value: null },
    { label: 'Up to 50 guests', value: 50 },
    { label: 'Up to 100 guests', value: 100 },
    { label: 'Up to 200 guests', value: 200 },
    { label: 'Up to 500 guests', value: 500 },
    { label: '500+ guests', value: 999 },
];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}
function formatDate(date: Date) {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

type DropdownType = 'city' | 'capacity' | 'date' | null;
type landingProps = NativeBottomTabScreenProps<ClientTabParamList, 'home'>;

export default function ClientDashboard({ navigation }: landingProps) {
    const { user } = useAuthStore();
    const [search, setSearch] = useState('');

    // ── API hooks — each with unique destructured names ──────────────────────
    const {
        data: venueData,
        isLoading: venuesLoading,
        isRefetching: venuesRefetching,
        refetch: refetchVenues,
    } = useGetAllVenue({ limit: '6' });

    const {
        data: citiesData,
        isLoading: citiesLoading,
        isRefetching: citiesRefetching,
        refetch: refetchCities,
    } = useGetVenueLoc();

    const {
        data: venueTypeData,
        isLoading: typesLoading,
        isRefetching: typesRefetching,
        refetch: refetchTypes,
    } = useGetVenueType();

    // ── Derive data safely — no local mirror state needed ────────────────────
    const venues: Venue[] = venueData?.venues ?? [];
    const cities: string[] = citiesData?.cities ?? [];
    const categories: VenueType[] = venueTypeData?.venueTypes ?? [];

    // ── Filter state ─────────────────────────────────────────────────────────
    const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [selectedCapacity, setSelectedCapacity] = useState<{
        label: string;
        value: number | null;
    } | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // ── Calendar state ───────────────────────────────────────────────────────
    const today = new Date();
    const [calYear, setCalYear] = useState(today.getFullYear());
    const [calMonth, setCalMonth] = useState(today.getMonth());

    const { fade: bodyFade } = useEntrance(180);
    const slideAnim = useRef(new Animated.Value(300)).current;

    useEffect(() => {
        if (openDropdown) {
            slideAnim.setValue(300);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                speed: 18,
                bounciness: 4,
            }).start();
        }
    }, [openDropdown]);

    const closeDropdown = () => setOpenDropdown(null);

    const goToVenues = () => navigation.navigate('venues');
    const goToProfile = () => navigation.navigate('profile');

    const goToVenueDetail = (venue: Venue) => {
        navigation
            .getParent<NativeStackNavigationProp<RootStackParamList>>()
            ?.navigate('venueDetail', { venue });
    };

    // ── Filter chip labels ────────────────────────────────────────────────────
    const cityLabel = selectedCity ?? 'All Cities';
    const capacityLabel = selectedCapacity?.label ?? 'Capacity';
    const dateLabel = selectedDate ? formatDate(selectedDate) : 'Date';

    // ── Calendar helpers ──────────────────────────────────────────────────────
    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
    const monthName = new Date(calYear, calMonth).toLocaleString('en-IN', {
        month: 'long',
        year: 'numeric',
    });

    const prevMonth = () => {
        if (calMonth === 0) {
            setCalMonth(11);
            setCalYear(y => y - 1);
        } else setCalMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (calMonth === 11) {
            setCalMonth(0);
            setCalYear(y => y + 1);
        } else setCalMonth(m => m + 1);
    };

    const selectCalDate = (day: number) => {
        setSelectedDate(new Date(calYear, calMonth, day));
        closeDropdown();
    };

    const isPastDay = (day: number) => {
        const d = new Date(calYear, calMonth, day);
        d.setHours(0, 0, 0, 0);
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return d < t;
    };

    const isSelectedDay = (day: number) =>
        !!selectedDate &&
        selectedDate.getFullYear() === calYear &&
        selectedDate.getMonth() === calMonth &&
        selectedDate.getDate() === day;

    // ── Dropdown content ──────────────────────────────────────────────────────
    const renderDropdownContent = () => {
        if (openDropdown === 'city') {
            const displayCities = cities.length > 0 ? cities : ['Bhopal', 'Indore', 'Jabalpur'];
            return (
                <>
                    <Text style={ds.sheetTitle}>Select City</Text>
                    {/* All Cities option */}
                    <TouchableOpacity
                        style={[ds.optionRow, !selectedCity && ds.optionRowActive]}
                        onPress={() => {
                            setSelectedCity(null);
                            closeDropdown();
                        }}
                    >
                        <Ionicons
                            name="location-outline"
                            size={16}
                            color={!selectedCity ? Colors.primary : Colors.charcoalLight}
                        />
                        <Text style={[ds.optionText, !selectedCity && ds.optionTextActive]}>
                            All Cities
                        </Text>
                        {!selectedCity && (
                            <Ionicons name="checkmark" size={16} color={Colors.primary} />
                        )}
                    </TouchableOpacity>
                    {displayCities.map(city => (
                        <TouchableOpacity
                            key={city}
                            style={[ds.optionRow, selectedCity === city && ds.optionRowActive]}
                            onPress={() => {
                                setSelectedCity(city);
                                closeDropdown();
                            }}
                        >
                            <Ionicons
                                name="location-outline"
                                size={16}
                                color={
                                    selectedCity === city ? Colors.primary : Colors.charcoalLight
                                }
                            />
                            <Text
                                style={[
                                    ds.optionText,
                                    selectedCity === city && ds.optionTextActive,
                                ]}
                            >
                                {city}
                            </Text>
                            {selectedCity === city && (
                                <Ionicons name="checkmark" size={16} color={Colors.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </>
            );
        }

        if (openDropdown === 'capacity') {
            return (
                <>
                    <Text style={ds.sheetTitle}>Select Capacity</Text>
                    {CAPACITY_OPTIONS.map(opt => {
                        const isActive = selectedCapacity?.value === opt.value;
                        return (
                            <TouchableOpacity
                                key={opt.label}
                                style={[ds.optionRow, isActive && ds.optionRowActive]}
                                onPress={() => {
                                    setSelectedCapacity(opt.value === null ? null : opt);
                                    closeDropdown();
                                }}
                            >
                                <Ionicons
                                    name="people-outline"
                                    size={16}
                                    color={isActive ? Colors.primary : Colors.charcoalLight}
                                />
                                <Text style={[ds.optionText, isActive && ds.optionTextActive]}>
                                    {opt.label}
                                </Text>
                                {isActive && (
                                    <Ionicons name="checkmark" size={16} color={Colors.primary} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </>
            );
        }

        if (openDropdown === 'date') {
            const cells = Array.from({ length: firstDayOfWeek + daysInMonth }, (_, i) =>
                i < firstDayOfWeek ? null : i - firstDayOfWeek + 1,
            );
            return (
                <>
                    <Text style={ds.sheetTitle}>Select Date</Text>
                    <View style={ds.calNav}>
                        <TouchableOpacity onPress={prevMonth} style={ds.calNavBtn}>
                            <Ionicons name="chevron-back" size={18} color={Colors.charcoal} />
                        </TouchableOpacity>
                        <Text style={ds.calMonthLabel}>{monthName}</Text>
                        <TouchableOpacity onPress={nextMonth} style={ds.calNavBtn}>
                            <Ionicons name="chevron-forward" size={18} color={Colors.charcoal} />
                        </TouchableOpacity>
                    </View>
                    <View style={ds.calDayRow}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <Text key={i} style={ds.calDayLabel}>
                                {d}
                            </Text>
                        ))}
                    </View>
                    <View style={ds.calGrid}>
                        {cells.map((day, idx) => {
                            if (!day) return <View key={idx} style={ds.calCell} />;
                            const past = isPastDay(day);
                            const active = isSelectedDay(day);
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[
                                        ds.calCell,
                                        active && ds.calCellActive,
                                        past && ds.calCellDisabled,
                                    ]}
                                    onPress={() => !past && selectCalDate(day)}
                                    disabled={past}
                                    activeOpacity={0.75}
                                >
                                    <Text
                                        style={[
                                            ds.calDayNum,
                                            active && ds.calDayNumActive,
                                            past && ds.calDayNumDisabled,
                                        ]}
                                    >
                                        {day}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    {selectedDate && (
                        <TouchableOpacity
                            style={ds.clearDateBtn}
                            onPress={() => {
                                setSelectedDate(null);
                                closeDropdown();
                            }}
                        >
                            <Text style={ds.clearDateText}>Clear Date</Text>
                        </TouchableOpacity>
                    )}
                </>
            );
        }

        return null;
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <View style={s.root}>
            {/* ── HEADER ── */}
            <View style={s.header}>
                <View style={s.brand}>
                    <Image
                        source={require('@assets/NameLogo.png')}
                        style={s.brandLogo}
                        resizeMode="contain"
                    />
                </View>
                <View style={s.navIcons}>
                    <TouchableOpacity style={s.navIconBtn}>
                        <Ionicons name="notifications-outline" size={24} color={Colors.charcoal} />
                        <View style={s.notifDot} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={s.profilePill}
                        onPress={goToProfile}
                        activeOpacity={0.85}
                    >
                        <View style={s.profileAvatar}>
                            <Text style={s.profileInitials}>
                                {user?.name?.slice(0, 2).toUpperCase() || 'G'}
                            </Text>
                        </View>
                        <Text style={s.profileName}>{user?.name || 'Guest'}</Text>
                        <Ionicons name="chevron-down" size={11} color={Colors.charcoalLight} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* ── BROWSE BUTTON ── */}
                <View style={s.browseRow}>
                    <TouchableOpacity style={s.browseBtn} onPress={goToVenues} activeOpacity={0.88}>
                        <Ionicons name="business-outline" size={16} color={Colors.charcoal} />
                        <Text style={s.browseBtnText}>Browse Venues</Text>
                        <Ionicons name="arrow-forward" size={15} color={Colors.charcoal} />
                    </TouchableOpacity>
                </View>

                {/* ── SEARCH CARD ── */}
                <Animated.View style={[s.searchCard, { opacity: bodyFade }]}>
                    <View style={s.searchAccent} />
                    <View style={s.searchBody}>
                        <Text style={s.searchHeading}>Find Your Venue</Text>
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
                            {/* City */}
                            <TouchableOpacity
                                style={[
                                    s.filterChip,
                                    openDropdown === 'city' && s.filterChipOpen,
                                    selectedCity && s.filterChipSelected,
                                ]}
                                onPress={() =>
                                    setOpenDropdown(openDropdown === 'city' ? null : 'city')
                                }
                                activeOpacity={0.75}
                            >
                                <Ionicons
                                    name="location-outline"
                                    size={13}
                                    color={selectedCity ? Colors.white : Colors.primary}
                                />
                                <Text
                                    style={[
                                        s.filterChipText,
                                        selectedCity && s.filterChipTextSelected,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {cityLabel}
                                </Text>
                                <Ionicons
                                    name={openDropdown === 'city' ? 'chevron-up' : 'chevron-down'}
                                    size={11}
                                    color={selectedCity ? Colors.white : Colors.charcoalLight}
                                />
                            </TouchableOpacity>

                            {/* Capacity */}
                            <TouchableOpacity
                                style={[
                                    s.filterChip,
                                    openDropdown === 'capacity' && s.filterChipOpen,
                                    selectedCapacity && s.filterChipSelected,
                                ]}
                                onPress={() =>
                                    setOpenDropdown(openDropdown === 'capacity' ? null : 'capacity')
                                }
                                activeOpacity={0.75}
                            >
                                <Ionicons
                                    name="people-outline"
                                    size={13}
                                    color={selectedCapacity ? Colors.white : Colors.primary}
                                />
                                <Text
                                    style={[
                                        s.filterChipText,
                                        selectedCapacity && s.filterChipTextSelected,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {capacityLabel}
                                </Text>
                                <Ionicons
                                    name={
                                        openDropdown === 'capacity' ? 'chevron-up' : 'chevron-down'
                                    }
                                    size={11}
                                    color={selectedCapacity ? Colors.white : Colors.charcoalLight}
                                />
                            </TouchableOpacity>

                            {/* Date */}
                            <TouchableOpacity
                                style={[
                                    s.filterChip,
                                    openDropdown === 'date' && s.filterChipOpen,
                                    selectedDate && s.filterChipSelected,
                                ]}
                                onPress={() =>
                                    setOpenDropdown(openDropdown === 'date' ? null : 'date')
                                }
                                activeOpacity={0.75}
                            >
                                <Ionicons
                                    name="calendar-outline"
                                    size={13}
                                    color={selectedDate ? Colors.white : Colors.primary}
                                />
                                <Text
                                    style={[
                                        s.filterChipText,
                                        selectedDate && s.filterChipTextSelected,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {dateLabel}
                                </Text>
                                <Ionicons
                                    name={openDropdown === 'date' ? 'chevron-up' : 'chevron-down'}
                                    size={11}
                                    color={selectedDate ? Colors.white : Colors.charcoalLight}
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={s.searchBtn}
                            onPress={goToVenues}
                            activeOpacity={0.88}
                        >
                            <Ionicons name="search" size={16} color={Colors.charcoal} />
                            <Text style={s.searchBtnText}>Search Venues</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* ── CATEGORIES ── */}
                <Animated.View style={[s.section, { opacity: bodyFade }]}>
                    <View style={s.sectionHeader}>
                        <View style={s.sectionTitleRow}>
                            <View style={s.accentBar} />
                            <Text style={s.sectionTitle}>Browse by Category</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() =>
                                navigation
                                    .getParent<NativeStackNavigationProp<RootStackParamList>>()
                                    .navigate('category')
                            }
                        >
                            <Text style={s.seeAll}>See all →</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={s.catGrid}>
                        {categories.length === 0 ? (
                            <View style={s.emptyState}>
                                <Text style={s.emptyStateIcon}>🏷️</Text>
                                <Text style={s.emptyStateTitle}>No categories yet</Text>
                                <Text style={s.emptyStateSub}>
                                    Check back soon — new venue types are on the way.
                                </Text>
                            </View>
                        ) : (
                            categories.slice(0, 9).map(cat => (
                                <TouchableOpacity
                                    key={cat._id}
                                    style={s.catCard}
                                    onPress={goToVenues}
                                    activeOpacity={0.8}
                                >
                                    <View style={s.catIconWrap}>
                                        <Text style={s.catIconEmoji}>{cat.icon}</Text>
                                    </View>
                                    <Text style={s.catLabel}>{cat.name}</Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </Animated.View>

                {/* ── FEATURED VENUES ── */}
                <View style={[s.section, s.surfaceSection]}>
                    <View style={s.sectionHeader}>
                        <View style={s.sectionTitleRow}>
                            <View style={s.accentBar} />
                            <Text style={s.sectionTitle}>Featured Venues</Text>
                        </View>
                        <TouchableOpacity onPress={goToVenues}>
                            <Text style={s.seeAll}>See all →</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={s.sectionSub}>Handpicked premium spaces for your events</Text>
                    <View style={s.hScroll}>
                        {venues.length === 0 ? (
                            <View style={s.emptyState}>
                                <Text style={s.emptyStateIcon}>🏛️</Text>
                                <Text style={s.emptyStateTitle}>No venues available</Text>
                                <Text style={s.emptyStateSub}>
                                    We're adding new spaces soon. Browse all to stay updated.
                                </Text>
                                <TouchableOpacity
                                    style={s.emptyStateBtn}
                                    onPress={goToVenues}
                                    activeOpacity={0.85}
                                >
                                    <Text style={s.emptyStateBtnText}>Browse All Venues</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            venues.map((v, i) => (
                                <FeaturedCard
                                    key={v._id}
                                    v={v}
                                    index={i}
                                    onPress={goToVenueDetail}
                                />
                            ))
                        )}
                    </View>
                    <TouchableOpacity
                        style={s.viewAllBtn}
                        onPress={goToVenues}
                        activeOpacity={0.85}
                    >
                        <Text style={s.viewAllBtnText}>View All Venues</Text>
                        <Ionicons name="arrow-forward" size={14} color={Colors.white} />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* ── BOTTOM SHEET ── */}
            <Modal
                visible={!!openDropdown}
                transparent
                animationType="none"
                onRequestClose={closeDropdown}
            >
                <TouchableOpacity style={ds.overlay} activeOpacity={1} onPress={closeDropdown} />
                <Animated.View style={[ds.sheet, { transform: [{ translateY: slideAnim }] }]}>
                    <View style={ds.sheetHandle} />
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 32 }}
                    >
                        {renderDropdownContent()}
                    </ScrollView>
                </Animated.View>
            </Modal>
        </View>
    );
}

// ─── styles unchanged — only fix position: 'static' → 'relative' ─────────────
const ds = StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        paddingHorizontal: Spacing.xl,
        paddingTop: 12,
        maxHeight: H * 0.6,
        ...Shadows.floating,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginBottom: 16,
    },
    sheetTitle: {
        fontSize: 17,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        marginBottom: 14,
        letterSpacing: -0.3,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: Radii.md,
        marginBottom: 4,
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    optionRowActive: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryLight },
    optionText: { flex: 1, fontSize: 14, color: Colors.charcoalMid, fontWeight: Typography.medium },
    optionTextActive: { color: Colors.primary, fontWeight: Typography.bold },
    calNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    calNavBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    calMonthLabel: { fontSize: 15, fontWeight: Typography.bold, color: Colors.charcoal },
    calDayRow: { flexDirection: 'row', marginBottom: 6 },
    calDayLabel: {
        flex: 1,
        textAlign: 'center',
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: 0.5,
    },
    calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    calCell: {
        width: `${100 / 7}%` as any,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Radii.md,
        marginBottom: 2,
    },
    calCellActive: { backgroundColor: Colors.primary },
    calCellDisabled: { opacity: 0.3 },
    calDayNum: { fontSize: 13, fontWeight: Typography.medium, color: Colors.charcoal },
    calDayNumActive: { color: Colors.white, fontWeight: Typography.extraBold },
    calDayNumDisabled: { color: Colors.charcoalLight },
    clearDateBtn: {
        marginTop: 12,
        alignSelf: 'center',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    clearDateText: { fontSize: 13, color: Colors.charcoalLight, fontWeight: Typography.medium },
});

const CAT_W = (W - Spacing.lg * 2 - Spacing.sm * 2) / 3;

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingBottom: 120 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: 24,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.background,
        position: 'relative', // ← was 'static' — invalid in RN
    },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    brandLogo: { height: 50, width: 150 },
    navIcons: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    navIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
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
        borderColor: Colors.background,
    },
    profilePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
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
    profileInitials: { fontSize: 10, fontWeight: Typography.extraBold, color: Colors.charcoal },
    profileName: { fontSize: 12, fontWeight: Typography.bold, color: Colors.charcoal },
    browseRow: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.background,
    },
    browseBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: Radii.full,
        ...Shadows.primary,
    },
    browseBtnText: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: 0.2,
    },
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
    filterChipOpen: { borderColor: Colors.primary, borderWidth: 1.5 },
    filterChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterChipText: {
        flex: 1,
        fontSize: 10.5,
        color: Colors.primaryDark,
        fontWeight: Typography.semiBold,
    },
    filterChipTextSelected: { color: Colors.white },
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
    searchBtnText: { fontSize: 14.5, fontWeight: Typography.extraBold, color: Colors.charcoal },
    section: { paddingHorizontal: Spacing.lg, paddingVertical: 26 },
    surfaceSection: { backgroundColor: Colors.surface },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    accentBar: { width: 4, height: 22, backgroundColor: Colors.primary, borderRadius: 2 },
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
    seeAll: { fontSize: 13, fontWeight: Typography.bold, color: Colors.primary },
    hScroll: { paddingBottom: 4, gap: Spacing.lg, width: '100%' },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    catCard: {
        width: CAT_W,
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        padding: Spacing.sm,
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
    catIconEmoji: { fontSize: 24 },
    catLabel: {
        fontSize: 11.5,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        textAlign: 'center',
    },
    catCount: { fontSize: 10.5, color: Colors.charcoalLight, fontWeight: Typography.medium },
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
    viewAllBtnText: { fontSize: 14, fontWeight: Typography.extraBold, color: Colors.white },
    emptyState: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 36,
        paddingHorizontal: Spacing.xl,
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        gap: Spacing.sm,
    },
    emptyStateIcon: {
        fontSize: 36,
        marginBottom: 4,
    },
    emptyStateTitle: {
        fontSize: 15,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
    },
    emptyStateSub: {
        fontSize: 12.5,
        color: Colors.charcoalLight,
        textAlign: 'center',
        lineHeight: 18,
        maxWidth: 220,
    },
    emptyStateBtn: {
        marginTop: Spacing.sm,
        paddingVertical: 10,
        paddingHorizontal: Spacing.xl,
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        ...Shadows.primary,
    },
    emptyStateBtnText: {
        fontSize: 13,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
});

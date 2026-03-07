import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
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

const categories = [
    { id: 'all', name: 'All', icon: 'apps-outline', venueType: null },
    {
        id: 'Conference Hall',
        name: 'Conference',
        icon: 'business-outline',
        venueType: 'Conference Hall',
    },
    { id: 'Banquet Hall', name: 'Banquet', icon: 'restaurant-outline', venueType: 'Banquet Hall' },
    { id: 'Marriage Garden', name: 'Wedding', icon: 'rose-outline', venueType: 'Marriage Garden' },
    { id: 'Function Hall', name: 'Party', icon: 'balloon-outline', venueType: 'Function Hall' },
    { id: 'Meeting Hall', name: 'Meeting', icon: 'people-outline', venueType: 'Meeting Hall' },
];

type appParamList = OwnerTabParamList | ClientTabParamList | tabParamList;
type venueProps = NativeStackScreenProps<appParamList, 'venues'>;

// ── Screen ────────────────────────────────────────────────────────────────────
export default function VenuesScreen({ navigation }: venueProps) {
    const alert = useAlert();
    const { user, isAuthenticated } = useAuthStore();
    const [venues, setVenues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearch] = useState('');
    const [selectedCategory, setCategory] = useState('all');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchVenues();
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, [selectedCategory]);

    const fetchVenues = async () => {
        try {
            setLoading(true);

            const response = await venueAPI.getVenues();

            if (!response?.venues) {
                console.error('FETCHING VENUES ERROR : ', response?.message);
                return;
            }

            setVenues(response?.venues);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAddVenue = () => {
        if (!isAuthenticated) {
            alert.show({
                title: 'Login Reguired',
                message: 'Sign in is required to add venue.',
                buttons: [
                    { label: 'Cancel', onPress: alert.dismiss, style: 'ghost' },
                    {
                        label: 'Login',
                        onPress: () => {
                            navigation
                                .getParent<NativeStackNavigationProp<RootStackParamList>>()
                                .navigate('login');
                            alert.dismiss();
                        },
                    },
                ],
            });

            return;
        }

        navigation
            .getParent<NativeStackNavigationProp<RootStackParamList>>()
            .navigate('registerVenue');
    };
    // ── Filter by search query AND selected category ──────────────────────────
    const filteredVenues = venues.filter(v => {
        const matchesSearch = v.businessName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
            selectedCategory === 'all' ||
            (Array.isArray(v.venueType) && v.venueType.includes(selectedCategory));

        return matchesSearch && matchesCategory;
    });

    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <View style={styles.headerAccentBar} />
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greetingLabel}>DISCOVER</Text>
                        <Text style={styles.greeting}>Venues</Text>
                    </View>
                    {!isAuthenticated || user?.userType === 'owner'}
                    <TouchableOpacity
                        style={styles.addVenueButton}
                        activeOpacity={0.85}
                        onPress={handleAddVenue}
                    >
                        <Ionicons name="add" size={18} color={Colors.white} />
                        <Text style={styles.addVenueLabel}>Add Venue</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSubtitle}>Book your premium meeting venues.</Text>
            </View>

            {/* ── Search ── */}
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
                        onChangeText={setSearch}
                    />
                </View>
                <TouchableOpacity style={styles.filterButton}>
                    <Ionicons name="options" size={18} color={Colors.white} />
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
                {/* ── Categories ── */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesContainer}
                    style={{ marginBottom: Spacing.sm }}
                >
                    {categories.map(cat => {
                        const isActive = selectedCategory === cat.id;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryButton,
                                    isActive && styles.categoryButtonActive,
                                ]}
                                onPress={() => setCategory(cat.id)}
                            >
                                <View
                                    style={[
                                        styles.categoryIconWrap,
                                        isActive && styles.categoryIconWrapActive,
                                    ]}
                                >
                                    <Ionicons
                                        name={cat.icon as any}
                                        size={18}
                                        color={isActive ? Colors.white : Colors.primary}
                                    />
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

                {/* ── All Venues ── */}
                <View style={[styles.section, { paddingBottom: 100 }]}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <View style={styles.sectionAccent} />
                            <Text style={styles.sectionTitle}>All Venues</Text>
                        </View>
                        <Text style={styles.venueCount}>{filteredVenues.length} spaces</Text>
                    </View>

                    {loading ? (
                        <View style={styles.loaderWrap}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={styles.loaderText}>Finding spaces...</Text>
                        </View>
                    ) : filteredVenues.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons
                                name="search-outline"
                                size={48}
                                color={Colors.primaryBorder}
                            />
                            <Text style={styles.emptyText}>No venues found</Text>
                        </View>
                    ) : (
                        <Animated.View style={[styles.venuesGrid, { opacity: fadeAnim }]}>
                            {filteredVenues.map(v => (
                                <VenueCard key={v._id} venue={v} />
                            ))}
                        </Animated.View>
                    )}
                </View>
            </ScrollView>

            {/* ── FAB ── */}
            <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
                <View style={styles.fabInner}>
                    <Ionicons name="add" size={26} color={Colors.white} />
                </View>
                <Text style={styles.fabLabel}>Add Venue</Text>
            </TouchableOpacity>
        </View>
    );
}

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
    notificationButton: {
        width: 46,
        height: 46,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notifDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
        borderWidth: 1.5,
        borderColor: Colors.background,
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

    // Categories
    categoriesContainer: { paddingHorizontal: Spacing.xl, gap: 10, paddingVertical: Spacing.xxs },
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
    categoryText: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.semiBold,
        letterSpacing: Typography.normal,
    },
    categoryTextActive: { color: Colors.white },

    // Sections
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
    seeAllButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    seeAll: { fontSize: Typography.base, color: Colors.primary, fontWeight: Typography.bold },
    venueCount: {
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },

    // Venue grid
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

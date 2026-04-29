import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Dimensions,
    Animated,
    StatusBar,
    RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VenueType } from '../types/VenueType';
import { RootStackParamList } from '@/types/RootStackParamList';
import { useGetVenueType } from '../hooks/useGetVenueType';
import Loader from '@/components/UI/loader';
import { Spacing, Colors, Shadows, Typography, Radii } from '@/theme/theme';

const { width: W } = Dimensions.get('window');

// ── Card sizes ────────────────────────────────────────────────────────────────
const GAP = Spacing.sm;
const H_PAD = Spacing.lg;
const CARD_W = (W - H_PAD * 2 - GAP) / 2;

// ── Sort options ──────────────────────────────────────────────────────────────
const SORT_OPTIONS = ['All', 'A–Z'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

// ── Screen ────────────────────────────────────────────────────────────────────
type CategoryProps = NativeStackScreenProps<RootStackParamList, 'category'>;

export default function BrowseCategoryScreen({ navigation }: CategoryProps) {
    const { data: venueTypeData, isLoading, isRefetching, refetch } = useGetVenueType();

    const venueTypes: VenueType[] = venueTypeData?.venueTypes ?? [];

    const [search, setSearch] = useState('');
    const [activeSort, setActiveSort] = useState<SortOption>('All');

    const scrollY = useRef(new Animated.Value(0)).current;

    // ── Pull-to-refresh ───────────────────────────────────────────────────────
    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    // ── Filter + sort ─────────────────────────────────────────────────────────
    const filtered = venueTypes
        .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (activeSort === 'A–Z') return a.name.localeCompare(b.name);
            // FIX 1: `order` is optional — fall back to 0 to avoid NaN from undefined subtraction
            return (a.order ?? 0) - (b.order ?? 0);
        });

    // ── Animated header background ────────────────────────────────────────────
    const headerBg = scrollY.interpolate({
        inputRange: [0, 40],
        outputRange: ['rgba(247,246,242,0)', 'rgba(247,246,242,1)'],
        extrapolate: 'clamp',
    });

    // ── Card renderer ─────────────────────────────────────────────────────────
    const renderCard = useCallback(
        (item: VenueType) => (
            <TouchableOpacity
                style={s.card}
                activeOpacity={0.82}
                onPress={() =>
                    navigation.navigate('client', {
                        screen: 'venues',
                    })
                }
            >
                {/* Icon bubble */}
                <View style={s.iconBubble}>
                    <Text style={s.iconEmoji}>{item.icon ?? '🏠'}</Text>
                </View>

                {/* Name & description */}
                <Text style={s.cardName} numberOfLines={2}>
                    {item.name}
                </Text>
                {!!item.description && (
                    <Text style={s.cardDesc} numberOfLines={1}>
                        {item.description}
                    </Text>
                )}

                {/* Arrow button */}
                <View style={s.cardArrow}>
                    <Ionicons name="arrow-forward" size={11} color={Colors.white} />
                </View>
            </TouchableOpacity>
        ),
        [navigation],
    );

    // ── Initial load — full screen spinner ────────────────────────────────────
    if (isLoading && !venueTypeData) {
        return (
            <View style={s.root}>
                <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
                <View style={s.loadingHeader}>
                    <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Categories</Text>
                </View>
                <Loader size="md" label="Loading categories…" style={s.loader} />
            </View>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <View style={s.root}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            {/* ── Floating animated header ── */}
            <Animated.View style={[s.floatingHeader, { backgroundColor: headerBg }]}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Categories</Text>
                <View style={s.headerRight}>
                    {/* FIX 2: show "Syncing…" badge during background refetch */}
                    {isRefetching ? (
                        <View style={s.syncBadge}>
                            <Ionicons name="sync-outline" size={11} color={Colors.primary} />
                            <Text style={s.syncText}>Syncing…</Text>
                        </View>
                    ) : (
                        <View style={s.countBadge}>
                            <Text style={s.headerCount}>{filtered.length} types</Text>
                        </View>
                    )}
                </View>
            </Animated.View>

            {/* ── Main scrollable content ── */}
            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scroll}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                    useNativeDriver: false,
                })}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={handleRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
            >
                {/* Page heading */}
                <View style={s.pageHead}>
                    <Text style={s.pageTitle}>Browse by{'\n'}Category</Text>
                    <Text style={s.pageSub}>Find the perfect venue type for your next event</Text>
                </View>

                {/* Search bar */}
                <View style={s.searchWrap}>
                    <Ionicons name="search-outline" size={16} color={Colors.charcoalLight} />
                    <TextInput
                        style={s.searchInput}
                        placeholder="Search category..."
                        placeholderTextColor={Colors.charcoalLight}
                        value={search}
                        onChangeText={setSearch}
                        returnKeyType="search"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={16} color={Colors.charcoalLight} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Sort chips + result count */}
                <View style={s.sortRow}>
                    {SORT_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt}
                            style={[s.sortChip, activeSort === opt && s.sortChipActive]}
                            onPress={() => setActiveSort(opt)}
                            activeOpacity={0.75}
                        >
                            <Text
                                style={[s.sortChipText, activeSort === opt && s.sortChipTextActive]}
                            >
                                {opt}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <View style={s.sortSpacer} />
                    <Text style={s.resultCount}>
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                    </Text>
                </View>

                {/* Grid or empty state */}
                {filtered.length === 0 ? (
                    <View style={s.empty}>
                        <Text style={s.emptyEmoji}>🔍</Text>
                        <Text style={s.emptyTitle}>No categories found</Text>
                        <Text style={s.emptySub}>Try a different search term</Text>
                    </View>
                ) : (
                    <View style={s.grid}>
                        {/* FIX: renderCard now takes item directly, not {item, index} */}
                        {filtered.map(item => (
                            <React.Fragment key={item._id ?? item.code}>
                                {renderCard(item)}
                            </React.Fragment>
                        ))}
                    </View>
                )}

                {/* Bottom tip */}
                <View style={s.tip}>
                    <Ionicons
                        name="information-circle-outline"
                        size={14}
                        color={Colors.charcoalLight}
                    />
                    <Text style={s.tipText}>Tap any category to browse available venues</Text>
                </View>
            </Animated.ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },

    // Loading state header (static, no animation needed)
    loadingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 12,
        paddingHorizontal: H_PAD,
        gap: Spacing.md,
    },
    loader: { paddingTop: 60 },

    // Floating header
    floatingHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 12,
        paddingHorizontal: H_PAD,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.card,
    },
    headerTitle: {
        flex: 1,
        marginLeft: Spacing.md,
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.4,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    countBadge: {
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.full,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    headerCount: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.primaryDark,
    },
    syncBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.full,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    syncText: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },

    // Scroll
    scroll: { paddingTop: 110, paddingBottom: 100, paddingHorizontal: H_PAD },

    // Page heading
    pageHead: { marginBottom: Spacing.xl },
    pageTitle: {
        fontSize: 30,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.8,
        lineHeight: 36,
        marginBottom: 8,
    },
    pageSub: { fontSize: Typography.base, color: Colors.charcoalLight, lineHeight: 20 },

    // Search
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        paddingHorizontal: 14,
        height: 50,
        borderWidth: 1.5,
        borderColor: Colors.border,
        marginBottom: Spacing.md,
        ...Shadows.card,
    },
    searchInput: { flex: 1, fontSize: Typography.md, color: Colors.charcoal },

    // Sort
    sortRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.lg,
    },
    sortChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: Radii.full,
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    sortChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    sortChipText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    sortChipTextActive: { color: Colors.white, fontWeight: Typography.bold },
    sortSpacer: { flex: 1 },
    resultCount: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },

    // Grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },

    // Card
    card: {
        width: CARD_W,
        borderRadius: Radii.xl,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        paddingBottom: Spacing.lg,
        position: 'relative',
        ...Shadows.card,
    },
    iconBubble: {
        width: 52,
        height: 52,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primaryLight,
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        marginBottom: Spacing.sm,
    },
    iconEmoji: { fontSize: 26 },
    cardName: {
        fontSize: 13.5,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
        lineHeight: 18,
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 10.5,
        color: Colors.charcoalLight,
        fontWeight: Typography.regular,
        lineHeight: 14,
        marginBottom: Spacing.sm,
    },
    cardArrow: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
    },

    // Empty state
    empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.sm },
    emptyEmoji: { fontSize: 44 },
    emptyTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    emptySub: { fontSize: Typography.base, color: Colors.charcoalLight },

    // Tip
    tip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        justifyContent: 'center',
        marginTop: Spacing.xl,
    },
    tipText: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
});

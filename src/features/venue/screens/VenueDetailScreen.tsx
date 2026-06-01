import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Animated,
    FlatList,
    Linking,
    Platform,
    TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors, Typography, Spacing, Radii, Shadows } from '@/theme/theme';
import { Venue } from '@/features/venue/types/Venue';
import BookingSheet, { SelectedAmenityItem, formatTime } from '../models/BookingSheet';
import { useAlert } from '@/context/AlertContext';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.38;
const THUMB_SIZE = 60;

type Props = NativeStackScreenProps<RootStackParamList, 'venueDetail'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ALL_DAYS = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
] as const;
const DAY_ABBR: Record<string, string> = {
    Monday: 'M',
    Tuesday: 'T',
    Wednesday: 'W',
    Thursday: 'T',
    Friday: 'F',
    Saturday: 'S',
    Sunday: 'S',
};

// ─── Safe venue data defaults ─────────────────────────────────────────────────
// All fields on Venue are optional — centralise the safe defaults here once
function safeVenue(venue: Venue) {
    const amenities = venue.amenities ?? {};
    const pricing = venue.pricing ?? {};
    const avail = venue.availability ?? {};
    const images = venue.images ?? [];

    return {
        amenities: {
            basic: amenities.basic ?? [],
            beverages: amenities.beverages ?? [],
            refreshmentFood: amenities.refreshmentFood ?? [],
            lunchThalis: amenities.lunchThalis ?? [],
            additional: amenities.additional ?? [],
            kitchenAccess: amenities.kitchenAccess ?? {},
            diningArea: amenities.diningArea ?? {},
        },
        pricing: {
            enabledOptions: pricing.enabledOptions ?? {},
            perHour: pricing.perHour ?? { weekday: 0, weekend: 0 },
            halfDay: pricing.halfDay ?? { weekday: 0, weekend: 0 },
            fullDay: pricing.fullDay ?? { weekday: 0, weekend: 0 },
            extraHourRate: pricing.extraHourRate ?? { weekday: 0, weekend: 0 },
        },
        availability: {
            openingTime: avail.openingTime ?? '09:00',
            closingTime: avail.closingTime ?? '21:00',
            availableDays: avail.availableDays ?? [],
            advanceBookingRule: avail.advanceBookingRule ?? null,
        },
        images,
    };
}

// ─── Small reusable UI ────────────────────────────────────────────────────────
function SectionTitle({ icon, label }: { icon: string; label: string }) {
    return (
        <View style={util.sectionTitleRow}>
            <View style={util.sectionIconWrap}>
                <Ionicons name={icon as any} size={15} color={Colors.primary} />
            </View>
            <Text style={util.sectionTitleText}>{label}</Text>
        </View>
    );
}

const util = StyleSheet.create({
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    sectionIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 9,
        backgroundColor: Colors.primaryDim,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitleText: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.lg },
});

// ─── Amenity sub-components ───────────────────────────────────────────────────
function IncludedItem({ name }: { name: string }) {
    return (
        <View style={am.includedItem}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            <Text style={am.includedName} numberOfLines={1}>
                {name}
            </Text>
            <View style={am.freeBadge}>
                <Text style={am.freeText}>Free</Text>
            </View>
        </View>
    );
}

type PaidItemProps = {
    name: string;
    charge: number;
    qty: number;
    checked: boolean;
    onToggle: () => void;
    onIncrement: () => void;
    onDecrement: () => void;
    onQtyChange: (v: string) => void;
};
function PaidItem({
    name,
    charge,
    qty,
    checked,
    onToggle,
    onIncrement,
    onDecrement,
    onQtyChange,
}: PaidItemProps) {
    return (
        <View style={am.paidRow}>
            <TouchableOpacity
                style={[am.checkbox, checked && am.checkboxOn]}
                onPress={onToggle}
                activeOpacity={0.75}
            >
                {checked && <Ionicons name="checkmark" size={11} color={Colors.white} />}
            </TouchableOpacity>
            <Text style={am.paidName}>{name}</Text>
            {checked ? (
                <View style={am.stepper}>
                    <TouchableOpacity onPress={onDecrement} style={am.stepBtn}>
                        <Text style={am.stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <TextInput
                        style={am.stepInput}
                        value={String(qty)}
                        onChangeText={onQtyChange}
                        keyboardType="number-pad"
                        selectTextOnFocus
                    />
                    <TouchableOpacity onPress={onIncrement} style={am.stepBtn}>
                        <Text style={am.stepBtnText}>+</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Text style={am.paidPrice}>₹{charge}/use</Text>
            )}
        </View>
    );
}

type BeverageItemProps = {
    name: string;
    rate: number;
    qty: number;
    checked: boolean;
    onToggle: () => void;
    onIncrement: () => void;
    onDecrement: () => void;
    onQtyChange: (v: string) => void;
};
function BeverageItem({
    name,
    rate,
    qty,
    checked,
    onToggle,
    onIncrement,
    onDecrement,
    onQtyChange,
}: BeverageItemProps) {
    return (
        <View style={am.paidRow}>
            <TouchableOpacity
                style={[am.checkbox, checked && am.checkboxOn]}
                onPress={onToggle}
                activeOpacity={0.75}
            >
                {checked && <Ionicons name="checkmark" size={11} color={Colors.white} />}
            </TouchableOpacity>
            <Text style={am.paidName}>{name}</Text>
            {checked ? (
                <View style={am.stepper}>
                    <TouchableOpacity onPress={onDecrement} style={am.stepBtn}>
                        <Text style={am.stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <TextInput
                        style={am.stepInput}
                        value={String(qty)}
                        onChangeText={onQtyChange}
                        keyboardType="number-pad"
                        selectTextOnFocus
                    />
                    <TouchableOpacity onPress={onIncrement} style={am.stepBtn}>
                        <Text style={am.stepBtnText}>+</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Text style={am.paidPrice}>₹{rate}/person</Text>
            )}
        </View>
    );
}

type RefreshmentItemProps = {
    name: string;
    rate: number;
    qty: number;
    checked: boolean;
    onToggle: () => void;
    onIncrement: () => void;
    onDecrement: () => void;
    onQtyChange: (v: string) => void;
};
function RefreshmentItem({
    name,
    rate,
    qty,
    checked,
    onToggle,
    onIncrement,
    onDecrement,
    onQtyChange,
}: RefreshmentItemProps) {
    return (
        <View style={am.paidRow}>
            <TouchableOpacity
                style={[am.checkbox, checked && am.checkboxOn]}
                onPress={onToggle}
                activeOpacity={0.75}
            >
                {checked && <Ionicons name="checkmark" size={11} color={Colors.white} />}
            </TouchableOpacity>
            <Text style={am.paidName}>{name}</Text>
            {checked ? (
                <View style={am.stepper}>
                    <TouchableOpacity onPress={onDecrement} style={am.stepBtn}>
                        <Text style={am.stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <TextInput
                        style={am.stepInput}
                        value={String(qty)}
                        onChangeText={onQtyChange}
                        keyboardType="number-pad"
                        selectTextOnFocus
                    />
                    <TouchableOpacity onPress={onIncrement} style={am.stepBtn}>
                        <Text style={am.stepBtnText}>+</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Text style={am.paidPrice}>₹{rate}/plate</Text>
            )}
        </View>
    );
}

// ─── Amenity summary badge ────────────────────────────────────────────────────
function AmenitiesSummaryBadge({ count, total }: { count: number; total: number }) {
    if (count === 0) return null;
    return (
        <View style={bdg.wrap}>
            <Ionicons name="add-circle" size={12} color={Colors.primary} />
            <Text style={bdg.text}>
                {count} amenit{count === 1 ? 'y' : 'ies'} · ₹{total.toLocaleString()}
            </Text>
        </View>
    );
}
const bdg = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryDim,
        borderRadius: Radii.sm,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginTop: 2,
    },
    text: { fontSize: 10, fontWeight: Typography.semiBold, color: Colors.primaryDark },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function VenueDetailScreen({ route, navigation }: Props) {
    const { venue } = route.params as { venue: Venue };
    const { user, isAuthenticated } = useAuthStore();
    const isOwner = user?.role === 'owner';
    const alert = useAlert();

    // ── Safe destructure — all fields optional on Venue ───────────────────────
    const { amenities, pricing, availability, images } = safeVenue(venue);
    const location = venue.location;

    // ── Scroll / hero animations ──────────────────────────────────────────────
    const scrollY = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList<NonNullable<Venue['images']>[0]>>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [bookingVisible, setBookingVisible] = useState(false);

    // Auto-slide images
    const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startAutoSlide = useCallback(() => {
        if (images.length <= 1) return;
        if (autoSlideRef.current) clearInterval(autoSlideRef.current);
        autoSlideRef.current = setInterval(() => {
            setActiveImageIndex(prev => {
                const next = (prev + 1) % images.length;
                flatListRef.current?.scrollToIndex({ index: next, animated: true });
                return next;
            });
        }, 3000);
    }, [images.length]);

    useEffect(() => {
        startAutoSlide();
        return () => {
            if (autoSlideRef.current) clearInterval(autoSlideRef.current);
        };
    }, [startAutoSlide]);

    // ── Amenity selection state ───────────────────────────────────────────────
    const [paidChecked, setPaidChecked] = useState<Set<string>>(new Set());
    const [paidQty, setPaidQty] = useState<Record<string, number>>({});
    const [bevChecked, setBevChecked] = useState<Set<string>>(new Set());
    const [bevQty, setBevQty] = useState<Record<string, number>>({});
    const [refQty, setRefQty] = useState<Record<string, number>>({});
    const [thaliQty, setThaliQty] = useState<Record<string, number>>({});
    const [refChecked, setRefChecked] = useState<Set<string>>(new Set());
    const [thaliChecked, setThaliChecked] = useState<Set<string>>(new Set());

    const toggleSet = useCallback((set: Set<string>, key: string): Set<string> => {
        const next = new Set(set);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
    }, []);

    const handleQtyChange = useCallback(
        (
            key: string,
            value: string,
            setter: React.Dispatch<React.SetStateAction<Record<string, number>>>,
        ) => {
            const num = parseInt(value, 10);
            setter(prev => ({ ...prev, [key]: isNaN(num) || num < 1 ? 1 : Math.min(num, 999) }));
        },
        [],
    );

    // ── Derived amenity totals ────────────────────────────────────────────────
    const { allAmenities, paidAmenities, amenitiesTotal } = useMemo(() => {
        const all: SelectedAmenityItem[] = [];

        // 1. Basic included (free)
        amenities.basic
            .filter(a => a.type !== 'Paid' && a.name)
            .forEach(a =>
                all.push({
                    name: a.name!,
                    category: 'basic_included',
                    qty: 1,
                    unitPrice: 0,
                    total: 0,
                    rateType: 'Fixed',
                }),
            );

        // 2. Basic paid
        amenities.basic
            .filter(a => a.type === 'Paid' && a.name && paidChecked.has(a.name!))
            .forEach(a => {
                const qty = paidQty[a.name!] ?? 1;
                all.push({
                    name: a.name!,
                    category: 'basic_paid',
                    qty,
                    unitPrice: a.rate ?? 0,
                    total: (a.rate ?? 0) * qty,
                    rateType: 'Per Use',
                });
            });

        // 3. Additional services (paid only)
        amenities.additional
            .filter(a => a.type === 'Paid' && a.name && paidChecked.has(`add_${a.name}`))
            .forEach(a => {
                const qty = paidQty[`add_${a.name!}`] ?? 1;
                all.push({
                    name: a.name!,
                    category: 'additional',
                    qty,
                    unitPrice: a.charges ?? 0,
                    total: (a.charges ?? 0) * qty,
                    rateType: 'Fixed',
                });
            });

        // 4. Beverages
        amenities.beverages
            .filter(b => b.name && bevChecked.has(b.name))
            .forEach(b => {
                const qty = bevQty[b.name!] ?? 1;
                all.push({
                    name: b.name!,
                    category: 'beverage',
                    qty,
                    unitPrice: b.ratePerUnit ?? 0,
                    total: (b.ratePerUnit ?? 0) * qty,
                    rateType: 'Per Person',
                });
            });

        // 5. Refreshments
        amenities.refreshmentFood
            .filter(f => f.name && refChecked.has(f.name))
            .forEach(f => {
                const qty = refQty[f.name!] ?? 1;
                all.push({
                    name: f.name!,
                    category: 'refreshment',
                    qty,
                    unitPrice: f.ratePerPlate ?? 0,
                    total: (f.ratePerPlate ?? 0) * qty,
                    rateType: 'Per Plate',
                });
            });

        // 6. Thalis
        amenities.lunchThalis.forEach(t => {
            if (t.thaliType && Array.isArray(t.categories)) {
                t.categories?.forEach(cat => {
                    const key = `${t.thaliType}__${cat.category}`;
                    if (thaliChecked.has(key)) {
                        const qty = thaliQty[key] ?? 1;
                        all.push({
                            name: `${t.thaliType} — ${cat.category}`,
                            category: 'thali',
                            qty,
                            unitPrice: cat.ratePerPlate,
                            total: cat.ratePerPlate * qty,
                            rateType: 'Per Plate',
                            thaliCategory: cat.category,
                            numberOfItems: cat.numberOfItems,
                            itemNames: cat.itemNames,
                        });
                    }
                });
            }
        });

        const paid = all.filter(i => i.category !== 'basic_included');
        const total = paid.reduce((sum, i) => sum + i.total, 0);
        return { allAmenities: all, paidAmenities: paid, amenitiesTotal: total };
    }, [
        paidChecked,
        paidQty,
        bevChecked,
        bevQty,
        refChecked,
        thaliChecked,
        amenities,
        refQty,
        thaliQty,
    ]);

    // ── Hero parallax + sticky header ─────────────────────────────────────────
    const heroTranslate = scrollY.interpolate({
        inputRange: [0, HERO_HEIGHT],
        outputRange: [0, -HERO_HEIGHT * 0.28],
        extrapolate: 'clamp',
    });
    const headerOpacity = scrollY.interpolate({
        inputRange: [HERO_HEIGHT - 80, HERO_HEIGHT - 30],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });
    const heroOverlayOpacity = scrollY.interpolate({
        inputRange: [0, HERO_HEIGHT * 0.5],
        outputRange: [0.25, 0.6],
        extrapolate: 'clamp',
    });

    const scrollToImage = useCallback(
        (index: number) => {
            if (autoSlideRef.current) clearInterval(autoSlideRef.current);
            flatListRef.current?.scrollToIndex({ index, animated: true });
            setActiveImageIndex(index);
            setTimeout(startAutoSlide, 4000);
        },
        [startAutoSlide],
    );

    const handleBookNow = () => {
        if (!isAuthenticated) {
            alert.show({
                type: 'confirm',
                title: 'Login Required',
                message: 'For booking login is required',
                buttons: [
                    {
                        label: 'Login',
                        onPress: () => navigation.navigate('login'),
                        style: 'primary',
                    },
                    { label: 'Cancel', onPress: alert.dismiss, style: 'ghost' },
                ],
            });
        } else {
            isOwner
                ? navigation.navigate('updateVenue', { venueId: venue._id! })
                : setBookingVisible(true);
        }
    };
    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <View style={s.container}>
            {/* Sticky header (appears on scroll) */}
            <Animated.View style={[s.stickyHeader, { opacity: headerOpacity }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.stickyBack}>
                    <Ionicons name="chevron-back" size={22} color={Colors.charcoal} />
                </TouchableOpacity>
                <Text style={s.stickyTitle} numberOfLines={1}>
                    {venue.businessName}
                </Text>
                <View style={{ width: 40 }} />
            </Animated.View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                    useNativeDriver: true,
                })}
                scrollEventThrottle={16}
            >
                {/* ── Hero carousel ── */}
                <View style={s.heroContainer}>
                    <Animated.View
                        style={[s.heroInner, { transform: [{ translateY: heroTranslate }] }]}
                    >
                        {images.length > 0 ? (
                            <FlatList
                                ref={flatListRef}
                                data={images}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onMomentumScrollEnd={e => {
                                    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
                                    setActiveImageIndex(
                                        Math.round(e.nativeEvent.contentOffset.x / width),
                                    );
                                    setTimeout(startAutoSlide, 4000);
                                }}
                                keyExtractor={(_, i) => String(i)}
                                renderItem={({ item }) =>
                                    item.url ? (
                                        <Image source={{ uri: item.url }} style={s.heroImage} />
                                    ) : (
                                        <View
                                            style={[
                                                s.heroImage,
                                                {
                                                    backgroundColor: Colors.primaryLight,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                },
                                            ]}
                                        >
                                            <Ionicons
                                                name="image-outline"
                                                size={48}
                                                color={Colors.primaryBorder}
                                            />
                                        </View>
                                    )
                                }
                            />
                        ) : (
                            <View
                                style={[
                                    s.heroImage,
                                    {
                                        backgroundColor: Colors.primaryLight,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="business-outline"
                                    size={60}
                                    color={Colors.primaryBorder}
                                />
                            </View>
                        )}
                        <Animated.View style={[s.heroOverlay, { opacity: heroOverlayOpacity }]} />
                    </Animated.View>

                    {/* Back button */}
                    <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={22} color={Colors.white} />
                    </TouchableOpacity>

                    {/* Status badge */}
                    {venue.status === 'approved' && (
                        <View style={s.approvedBadge}>
                            <Ionicons name="shield-checkmark" size={11} color={Colors.white} />
                            <Text style={s.approvedText}>Approved</Text>
                        </View>
                    )}

                    {/* Featured badge */}
                    {images[activeImageIndex]?.isFeatured && (
                        <View style={s.featuredBadge}>
                            <Ionicons name="star" size={11} color={Colors.white} />
                            <Text style={s.featuredText}>Featured</Text>
                        </View>
                    )}

                    {/* Image counter */}
                    {images.length > 0 && (
                        <View style={s.imageCounter}>
                            <Text style={s.imageCountText}>
                                {activeImageIndex + 1}/{images.length}
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── Thumbnail strip ── */}
                {images.length > 1 && (
                    <View style={s.thumbStrip}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={s.thumbScroll}
                        >
                            {images.map((img, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[s.thumb, i === activeImageIndex && s.thumbActive]}
                                    onPress={() => scrollToImage(i)}
                                    activeOpacity={0.8}
                                >
                                    {img.url ? (
                                        <Image source={{ uri: img.url }} style={s.thumbImage} />
                                    ) : (
                                        <View
                                            style={[
                                                s.thumbImage,
                                                { backgroundColor: Colors.primaryLight },
                                            ]}
                                        />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* ── Info card ── */}
                <View style={s.infoCard}>
                    <View style={s.nameRow}>
                        <Text style={s.venueName}>{venue.businessName}</Text>
                        <View style={s.ratingBadge}>
                            <Ionicons name="star" size={13} color={Colors.primary} />
                            <Text style={s.ratingText}>
                                {venue.rating && venue.rating > 0 ? venue.rating.toFixed(1) : 'New'}
                            </Text>
                        </View>
                    </View>
                    <View style={s.metaRow}>
                        <View style={s.metaItem}>
                            <Ionicons name="location-outline" size={14} color={Colors.primary} />
                            <Text style={s.metaText}>
                                {location.city}, {location.area}
                            </Text>
                        </View>
                        <View style={s.metaDot} />
                        <View style={s.metaItem}>
                            <Ionicons name="people-outline" size={14} color={Colors.primary} />
                            <Text style={s.metaText}>Up to {venue.capacity} guests</Text>
                        </View>
                    </View>
                    <View style={s.statsStrip}>
                        {[
                            {
                                icon: 'grid-outline',
                                value: `${venue.areaSqft?.toLocaleString() ?? 0} sqft`,
                            },
                            {
                                icon: 'bookmark-outline',
                                value: `${venue.totalBookings ?? 0} bookings`,
                            },
                            {
                                icon: 'chatbubble-outline',
                                value: `${venue.reviewCount ?? 0} reviews`,
                            },
                        ].map((st, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <View style={s.statsDivider} />}
                                <View style={s.statItem}>
                                    <Ionicons
                                        name={st.icon as any}
                                        size={13}
                                        color={Colors.primary}
                                    />
                                    <Text style={s.statText}>{st.value}</Text>
                                </View>
                            </React.Fragment>
                        ))}
                    </View>
                </View>

                {/* ── Venue types ── */}
                {(venue.venueType?.length ?? 0) > 0 && (
                    <View style={s.section}>
                        <Text style={s.venueTypesLabel}>VENUE TYPES</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={s.typeChips}
                        >
                            {venue.venueType!.map(t => (
                                <View key={t} style={s.typeChip}>
                                    <Text style={s.typeChipText}>{t}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* ── About ── */}
                <View style={s.section}>
                    <SectionTitle icon="information-circle-outline" label="About This Venue" />
                    <Text style={s.description}>{venue.description}</Text>
                </View>

                {/* ── Availability ── */}
                <View style={s.section}>
                    <SectionTitle icon="calendar-outline" label="Availability" />

                    <View style={av.daysRow}>
                        {ALL_DAYS.map(day => {
                            const active = availability.availableDays.includes(day);
                            return (
                                <View
                                    key={day}
                                    style={[av.dayCircle, active && av.dayCircleActive]}
                                >
                                    <Text style={[av.dayAbbr, active && av.dayAbbrActive]}>
                                        {DAY_ABBR[day]}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>

                    <View style={av.infoRow}>
                        <Ionicons name="time-outline" size={13} color={Colors.primary} />
                        <Text style={av.timeText}>
                            {formatTime(availability.openingTime)} –{' '}
                            {formatTime(availability.closingTime)}
                        </Text>
                        {!!availability.advanceBookingRule && (
                            <>
                                <View style={av.dot} />
                                <Ionicons
                                    name="alert-circle-outline"
                                    size={13}
                                    color={Colors.primary}
                                />
                                <Text style={av.ruleText} numberOfLines={1}>
                                    {availability.advanceBookingRule}
                                </Text>
                            </>
                        )}
                    </View>
                </View>

                {/* ── Amenities ── */}
                <View style={s.section}>
                    <SectionTitle icon="options-outline" label="Select Amenities & Services" />

                    {/* Basic included */}
                    {amenities.basic.filter(a => a.type !== 'Paid' && a.name).length > 0 && (
                        <View style={am.subSection}>
                            <View style={am.subHeader}>
                                <View style={am.subDot} />
                                <Text style={am.subTitle}>Basic Amenities</Text>
                            </View>
                            <Text style={am.subLabel}>Included</Text>
                            <View style={am.includedGrid}>
                                {amenities.basic
                                    .filter(a => a.type !== 'Paid' && a.name)
                                    .map((item, i) => (
                                        <View key={i} style={am.includedCell}>
                                            <IncludedItem name={item.name!} />
                                        </View>
                                    ))}
                            </View>
                        </View>
                    )}

                    {/* Basic paid */}
                    {amenities.basic.filter(a => a.type === 'Paid' && a.name).length > 0 && (
                        <View style={am.subSection}>
                            <Text style={am.subLabel}>Paid</Text>
                            {amenities.basic
                                .filter(a => a.type === 'Paid' && a.name)
                                .map((item, i) => (
                                    <PaidItem
                                        key={i}
                                        name={item.name!}
                                        charge={item.rate ?? 0}
                                        qty={paidQty[item.name!] ?? 1}
                                        checked={paidChecked.has(item.name!)}
                                        onToggle={() => {
                                            setPaidChecked(prev => toggleSet(prev, item.name!));
                                            if (!paidQty[item.name!])
                                                setPaidQty(p => ({ ...p, [item.name!]: 1 }));
                                        }}
                                        onIncrement={() =>
                                            setPaidQty(p => ({
                                                ...p,
                                                [item.name!]: (p[item.name!] ?? 1) + 1,
                                            }))
                                        }
                                        onDecrement={() =>
                                            setPaidQty(p => ({
                                                ...p,
                                                [item.name!]: Math.max(1, (p[item.name!] ?? 1) - 1),
                                            }))
                                        }
                                        onQtyChange={val =>
                                            handleQtyChange(item.name!, val, setPaidQty)
                                        }
                                    />
                                ))}
                        </View>
                    )}

                    {/* Additional paid services */}
                    {amenities.additional.filter(a => a.type === 'Paid' && a.name).length > 0 && (
                        <View style={am.subSection}>
                            <View style={am.subHeader}>
                                <View style={[am.subDot, { backgroundColor: Colors.info }]} />
                                <Text style={am.subTitle}>Additional Services</Text>
                            </View>
                            {amenities.additional
                                .filter(a => a.type === 'Paid' && a.name)
                                .map((item, i) => (
                                    <PaidItem
                                        key={i}
                                        name={item.name!}
                                        charge={item.charges ?? 0}
                                        qty={paidQty[`add_${item.name!}`] ?? 1}
                                        checked={paidChecked.has(`add_${item.name!}`)}
                                        onToggle={() => {
                                            setPaidChecked(prev =>
                                                toggleSet(prev, `add_${item.name!}`),
                                            );
                                            if (!paidQty[`add_${item.name!}`])
                                                setPaidQty(p => ({
                                                    ...p,
                                                    [`add_${item.name!}`]: 1,
                                                }));
                                        }}
                                        onIncrement={() =>
                                            setPaidQty(p => ({
                                                ...p,
                                                [`add_${item.name!}`]:
                                                    (p[`add_${item.name!}`] ?? 1) + 1,
                                            }))
                                        }
                                        onDecrement={() =>
                                            setPaidQty(p => ({
                                                ...p,
                                                [`add_${item.name!}`]: Math.max(
                                                    1,
                                                    (p[`add_${item.name!}`] ?? 1) - 1,
                                                ),
                                            }))
                                        }
                                        onQtyChange={val =>
                                            handleQtyChange(`add_${item.name!}`, val, setPaidQty)
                                        }
                                    />
                                ))}
                        </View>
                    )}

                    {/* Beverages */}
                    {amenities.beverages.filter(b => b.name).length > 0 && (
                        <View style={am.subSection}>
                            <View style={am.subHeader}>
                                <Ionicons name="cafe-outline" size={14} color={Colors.primary} />
                                <Text style={am.subTitle}>Beverages</Text>
                            </View>
                            {amenities.beverages
                                .filter(b => b.name)
                                .map((b, i) => (
                                    <BeverageItem
                                        key={i}
                                        name={b.name!}
                                        rate={b.ratePerUnit ?? 0}
                                        qty={bevQty[b.name!] ?? 1}
                                        checked={bevChecked.has(b.name!)}
                                        onToggle={() => {
                                            setBevChecked(prev => toggleSet(prev, b.name!));
                                            if (!bevQty[b.name!])
                                                setBevQty(p => ({ ...p, [b.name!]: 1 }));
                                        }}
                                        onIncrement={() =>
                                            setBevQty(p => ({
                                                ...p,
                                                [b.name!]: (p[b.name!] ?? 1) + 1,
                                            }))
                                        }
                                        onDecrement={() =>
                                            setBevQty(p => ({
                                                ...p,
                                                [b.name!]: Math.max(1, (p[b.name!] ?? 1) - 1),
                                            }))
                                        }
                                        onQtyChange={val =>
                                            handleQtyChange(b.name!, val, setBevQty)
                                        }
                                    />
                                ))}
                        </View>
                    )}

                    {/* Refreshments */}
                    {amenities.refreshmentFood.filter(f => f.name).length > 0 && (
                        <View style={am.subSection}>
                            <View style={am.subHeader}>
                                <Ionicons
                                    name="fast-food-outline"
                                    size={14}
                                    color={Colors.primary}
                                />
                                <Text style={am.subTitle}>Refreshments & Snacks</Text>
                            </View>
                            {amenities.refreshmentFood
                                .filter(f => f.name)
                                .map((food, i) => (
                                    <RefreshmentItem
                                        key={i}
                                        name={food.name!}
                                        rate={food.ratePerPlate ?? 0}
                                        qty={refQty[food.name!] ?? 1}
                                        checked={refChecked.has(food.name!)}
                                        onToggle={() => {
                                            setRefChecked(prev => toggleSet(prev, food.name!));
                                            if (!refQty[food.name!])
                                                setRefQty(p => ({ ...p, [food.name!]: 1 }));
                                        }}
                                        onIncrement={() =>
                                            setRefQty(p => ({
                                                ...p,
                                                [food.name!]: (p[food.name!] ?? 1) + 1,
                                            }))
                                        }
                                        onDecrement={() =>
                                            setRefQty(p => ({
                                                ...p,
                                                [food.name!]: Math.max(1, (p[food.name!] ?? 1) - 1),
                                            }))
                                        }
                                        onQtyChange={val =>
                                            handleQtyChange(food.name!, val, setRefQty)
                                        }
                                    />
                                ))}
                        </View>
                    )}

                    {/* Lunch Thalis */}
                    {amenities.lunchThalis.length > 0 && (
                        <View style={am.subSection}>
                            <View style={am.subHeader}>
                                <Ionicons
                                    name="nutrition-outline"
                                    size={14}
                                    color={Colors.primary}
                                />
                                <Text style={am.subTitle}>Lunch Thalis</Text>
                            </View>
                            {amenities.lunchThalis.map((t, i) => {
                                if (!Array.isArray(t.categories)) return null;
                                return (
                                    <View key={i} style={am.thaliGroup}>
                                        <Text style={am.thaliGroupName}>{t.thaliType}</Text>
                                        {t.categories.map((cat, ci) => {
                                            const key = `${t.thaliType}__${cat.category}`;
                                            const checked = thaliChecked.has(key);
                                            const qty = thaliQty[key] ?? 1;
                                            return (
                                                <View
                                                    key={ci}
                                                    style={[
                                                        am.thaliRow,
                                                        checked && am.thaliRowActive,
                                                    ]}
                                                >
                                                    <TouchableOpacity
                                                        style={[
                                                            am.checkbox,
                                                            checked && am.checkboxOn,
                                                        ]}
                                                        onPress={() => {
                                                            setThaliChecked(prev =>
                                                                toggleSet(prev, key),
                                                            );
                                                            if (!thaliQty[key])
                                                                setThaliQty(p => ({
                                                                    ...p,
                                                                    [key]: 1,
                                                                }));
                                                        }}
                                                        activeOpacity={0.75}
                                                    >
                                                        {checked && (
                                                            <Ionicons
                                                                name="checkmark"
                                                                size={11}
                                                                color={Colors.white}
                                                            />
                                                        )}
                                                    </TouchableOpacity>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={am.thaliType}>
                                                            {cat.category}
                                                        </Text>
                                                        {!!cat.itemNames && (
                                                            <Text
                                                                style={am.thaliItems}
                                                                numberOfLines={1}
                                                            >
                                                                {cat.itemNames}
                                                            </Text>
                                                        )}
                                                        {!!cat.numberOfItems && (
                                                            <Text style={am.thaliItems}>
                                                                {cat.numberOfItems} items
                                                            </Text>
                                                        )}
                                                    </View>
                                                    {checked ? (
                                                        <View style={am.stepper}>
                                                            <TouchableOpacity
                                                                onPress={() =>
                                                                    setThaliQty(p => ({
                                                                        ...p,
                                                                        [key]: Math.max(
                                                                            1,
                                                                            (p[key] ?? 1) - 1,
                                                                        ),
                                                                    }))
                                                                }
                                                                style={am.stepBtn}
                                                            >
                                                                <Text style={am.stepBtnText}>
                                                                    −
                                                                </Text>
                                                            </TouchableOpacity>
                                                            <TextInput
                                                                style={am.stepInput}
                                                                value={String(qty)}
                                                                onChangeText={val =>
                                                                    handleQtyChange(
                                                                        key,
                                                                        val,
                                                                        setThaliQty,
                                                                    )
                                                                }
                                                                keyboardType="number-pad"
                                                                selectTextOnFocus
                                                            />
                                                            <TouchableOpacity
                                                                onPress={() =>
                                                                    setThaliQty(p => ({
                                                                        ...p,
                                                                        [key]: (p[key] ?? 1) + 1,
                                                                    }))
                                                                }
                                                                style={am.stepBtn}
                                                            >
                                                                <Text style={am.stepBtnText}>
                                                                    +
                                                                </Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    ) : (
                                                        <Text style={am.thaliPrice}>
                                                            ₹{cat.ratePerPlate}/plate
                                                        </Text>
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Kitchen access / Dining area */}
                    {(amenities.kitchenAccess.available || amenities.diningArea.available) && (
                        <View style={am.facilityRow}>
                            {[
                                {
                                    icon: 'restaurant-outline',
                                    label: 'Kitchen Access',
                                    data: amenities.kitchenAccess,
                                },
                                {
                                    icon: 'cafe-outline',
                                    label: 'Dining Area',
                                    data: amenities.diningArea,
                                },
                            ]
                                .filter(f => f.data.available)
                                .map(f => (
                                    <View
                                        key={f.label}
                                        style={[am.facilityCard, am.facilityCardActive]}
                                    >
                                        <Ionicons
                                            name={f.icon as any}
                                            size={20}
                                            color={Colors.primary}
                                        />
                                        <Text style={am.facilityName}>{f.label}</Text>
                                        <Text style={am.facilityStatus}>
                                            {f.data.type === 'Paid'
                                                ? `₹${f.data.charges ?? 0}`
                                                : 'Included in booking'}
                                        </Text>
                                    </View>
                                ))}
                        </View>
                    )}
                </View>

                {/* ── Location ── */}
                <View style={s.section}>
                    <SectionTitle icon="location-outline" label="Location" />
                    {[
                        { label: 'Address', value: location.address },
                        { label: 'Landmark', value: location.landmark },
                        { label: 'City', value: location.city },
                        { label: 'Area', value: location.area },
                        { label: 'Pincode', value: location.pincode },
                        { label: 'Parking', value: location.parkingAvailability },
                    ]
                        .filter(r => !!r.value)
                        .map((row, i) => (
                            <View key={i} style={loc.row}>
                                <Text style={loc.label}>{row.label}:</Text>
                                <Text style={loc.value}>{row.value}</Text>
                            </View>
                        ))}

                    {location.googleMapLink ? (
                        <TouchableOpacity
                            style={loc.mapsLink}
                            onPress={() => Linking.openURL(location.googleMapLink)}
                            activeOpacity={0.75}
                        >
                            <Ionicons name="navigate-circle" size={16} color={Colors.primary} />
                            <Text style={loc.mapsText}>View on Google Maps</Text>
                        </TouchableOpacity>
                    ) : null}

                    {(location.nearestBusAuto || location.nearestMetroTrain) && (
                        <View style={loc.transitRow}>
                            {[
                                {
                                    icon: 'bus-outline',
                                    label: 'Bus / Auto',
                                    value: location.nearestBusAuto,
                                },
                                {
                                    icon: 'train-outline',
                                    label: 'Metro / Rail',
                                    value: location.nearestMetroTrain,
                                },
                            ]
                                .filter(tr => tr.value)
                                .map(tr => (
                                    <View key={tr.label} style={loc.transitItem}>
                                        <View style={loc.transitIcon}>
                                            <Ionicons
                                                name={tr.icon as any}
                                                size={14}
                                                color={Colors.primary}
                                            />
                                        </View>
                                        <View>
                                            <Text style={loc.transitLabel}>{tr.label}</Text>
                                            <Text style={loc.transitValue}>{tr.value}</Text>
                                        </View>
                                    </View>
                                ))}
                        </View>
                    )}
                </View>

                {/* ── Pricing ── */}
                <View style={s.section}>
                    <SectionTitle icon="pricetag-outline" label="Pricing" />

                    {[
                        { key: 'weekday' as const, label: 'Weekday', isWeekend: false },
                        { key: 'weekend' as const, label: 'Weekend', isWeekend: true },
                    ].map(({ key, label, isWeekend: wknd }) => {
                        const ph = pricing.perHour[key] ?? 0;
                        const hd = pricing.halfDay[key] ?? 0;
                        const fd = pricing.fullDay[key] ?? 0;
                        if (ph === 0 && hd === 0 && fd === 0) return null;
                        return (
                            <React.Fragment key={key}>
                                <Text
                                    style={[s.pricingSubheader, wknd && { marginTop: Spacing.lg }]}
                                >
                                    {label}
                                </Text>
                                <View style={pr.cardsRow}>
                                    {[
                                        {
                                            icon: 'time-outline',
                                            label: '1 Hour',
                                            price: ph,
                                            sub: '',
                                        },
                                        {
                                            icon: 'sunny-outline',
                                            label: 'Half Day',
                                            price: hd,
                                            sub: '4 Hrs',
                                        },
                                        {
                                            icon: 'calendar-outline',
                                            label: 'Full Day',
                                            price: fd,
                                            sub: '8 Hrs',
                                        },
                                    ]
                                        .filter(p => p.price > 0)
                                        .map((p, i) => (
                                            <View key={i} style={[pr.card, wknd && pr.cardWeekend]}>
                                                <View style={pr.iconWrap}>
                                                    <Ionicons
                                                        name={p.icon as any}
                                                        size={18}
                                                        color={Colors.primary}
                                                    />
                                                </View>
                                                <Text style={pr.cardLabel}>{p.label}</Text>
                                                {!!p.sub && <Text style={pr.cardSub}>{p.sub}</Text>}
                                                <Text style={pr.cardPrice}>
                                                    ₹{p.price.toLocaleString()}
                                                </Text>
                                            </View>
                                        ))}
                                </View>
                            </React.Fragment>
                        );
                    })}

                    {(pricing.extraHourRate.weekday ?? 0) > 0 && (
                        <View style={pr.extraRow}>
                            <Ionicons name="add-circle-outline" size={14} color={Colors.primary} />
                            <Text style={pr.extraLabel}>Extra Hour (Weekday)</Text>
                            <Text style={pr.extraPrice}>
                                ₹{pricing.extraHourRate.weekday!.toLocaleString()}/hr
                            </Text>
                        </View>
                    )}
                    {(pricing.extraHourRate.weekend ?? 0) > 0 && (
                        <View style={[pr.extraRow, { marginTop: 6 }]}>
                            <Ionicons name="add-circle-outline" size={14} color={Colors.primary} />
                            <Text style={pr.extraLabel}>Extra Hour (Weekend)</Text>
                            <Text style={pr.extraPrice}>
                                ₹{pricing.extraHourRate.weekend!.toLocaleString()}/hr
                            </Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 120 }} />
            </Animated.ScrollView>

            {/* ── CTA bar ── */}
            <View style={s.ctaBar}>
                {!isOwner && (pricing.perHour.weekday ?? 0) > 0 && (
                    <View>
                        <Text style={s.ctaFromLabel}>Weekday from</Text>
                        <View style={s.ctaPriceRow}>
                            <Text style={s.ctaPrice}>
                                ₹{pricing.perHour.weekday!.toLocaleString()}
                            </Text>
                            <Text style={s.ctaPerHour}>/hr</Text>
                        </View>
                        <AmenitiesSummaryBadge
                            count={paidAmenities.length}
                            total={amenitiesTotal}
                        />
                    </View>
                )}
                <TouchableOpacity style={s.ctaButton} onPress={handleBookNow} activeOpacity={0.85}>
                    <Ionicons
                        name={isOwner ? 'pencil' : 'calendar'}
                        size={18}
                        color={Colors.white}
                        style={{ marginRight: 8 }}
                    />
                    <Text style={s.ctaButtonText}>{isOwner ? 'Update Venue' : 'Book Now'}</Text>
                </TouchableOpacity>
            </View>

            {/* ── Booking bottom sheet (separate component) ── */}
            <BookingSheet
                visible={bookingVisible}
                venue={venue}
                paidAmenities={paidAmenities}
                amenitiesTotal={amenitiesTotal}
                allAmenities={allAmenities}
                onClose={() => setBookingVisible(false)}
            />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 54 : 21,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
        ...Shadows.header,
    },
    stickyBack: {
        width: 40,
        height: 40,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stickyTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: Spacing.md,
    },

    heroContainer: { height: HERO_HEIGHT, overflow: 'hidden' },
    heroInner: { width, height: HERO_HEIGHT + 60 },
    heroImage: { width, height: HERO_HEIGHT + 60, resizeMode: 'cover' },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.black },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 54 : 42,
        left: Spacing.lg,
        width: 40,
        height: 40,
        borderRadius: Radii.md,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    approvedBadge: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 48,
        left: 66,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.success,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radii.full,
    },
    approvedText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.white },
    featuredBadge: {
        position: 'absolute',
        bottom: 16,
        left: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radii.full,
    },
    featuredText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.white },
    imageCounter: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 48,
        right: Spacing.lg,
        backgroundColor: 'rgba(0,0,0,0.50)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: Radii.full,
    },
    imageCountText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.white },

    thumbStrip: { backgroundColor: Colors.tabBar, paddingVertical: 8 },
    thumbScroll: { paddingHorizontal: Spacing.lg, gap: 6 },
    thumb: {
        borderRadius: Radii.sm,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    thumbActive: { borderColor: Colors.primary },
    thumbImage: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        resizeMode: 'cover',
        borderRadius: Radii.sm - 2,
    },

    infoCard: {
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        ...Shadows.card,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    venueName: {
        flex: 1,
        fontSize: Typography.xxl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
        marginRight: Spacing.md,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: Radii.sm,
    },
    ratingText: {
        fontSize: Typography.base,
        fontWeight: Typography.extraBold,
        color: Colors.primaryDark,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: Spacing.md,
    },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.border },
    statsStrip: {
        flexDirection: 'row',
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        padding: Spacing.md,
        gap: 4,
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        justifyContent: 'center',
    },
    statText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    statsDivider: { width: 1, backgroundColor: Colors.divider },

    section: {
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        ...Shadows.card,
    },
    venueTypesLabel: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: Typography.wider,
        marginBottom: Spacing.sm,
    },
    typeChips: { gap: 8, paddingRight: 2 },
    typeChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        backgroundColor: Colors.background,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
    },
    typeChipText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.primary,
    },
    description: {
        fontSize: Typography.md,
        color: Colors.charcoalMid,
        lineHeight: 22,
        letterSpacing: 0.1,
    },
    pricingSubheader: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.3,
        marginBottom: Spacing.sm,
        textTransform: 'uppercase',
    },

    ctaBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        ...Shadows.floating,
    },
    ctaFromLabel: {
        fontSize: 10,
        color: Colors.charcoalLight,
        fontWeight: Typography.semiBold,
        letterSpacing: 0.5,
    },
    ctaPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
    ctaPrice: {
        fontSize: Typography.xxl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
    ctaPerHour: {
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: Radii.full,
        ...Shadows.primary,
    },
    ctaButtonText: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.2,
    },
});

const am = StyleSheet.create({
    subSection: { marginBottom: Spacing.lg },
    subHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
    subDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
    subTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.charcoal },
    subLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalLight,
        letterSpacing: 0.3,
        marginBottom: 8,
    },
    includedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    includedCell: { width: '48%' },
    includedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.successLight,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: Radii.md,
    },
    includedName: {
        flex: 1,
        fontSize: Typography.sm,
        fontWeight: Typography.medium,
        color: Colors.charcoal,
    },
    freeBadge: {
        backgroundColor: Colors.success,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    freeText: { fontSize: 9, fontWeight: Typography.bold, color: Colors.white },
    paidRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
        gap: 10,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    paidName: {
        flex: 1,
        fontSize: Typography.base,
        fontWeight: Typography.medium,
        color: Colors.charcoal,
    },
    paidPrice: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primary },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.md,
        paddingHorizontal: 4,
    },
    stepBtn: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
    stepBtnText: {
        fontSize: 18,
        fontWeight: Typography.bold,
        color: Colors.primary,
        lineHeight: 22,
    },
    stepInput: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.primaryDark,
        minWidth: 30,
        textAlign: 'center',
        paddingVertical: 2,
    },
    thaliGroup: {
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        overflow: 'hidden',
        marginBottom: 10,
    },
    thaliGroupName: {
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 14,
        paddingVertical: 8,
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.primaryDark,
    },
    thaliRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
    },
    thaliRowActive: { backgroundColor: Colors.primaryDim },
    thaliType: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    thaliItems: { fontSize: Typography.sm, color: Colors.charcoalLight, marginTop: 1 },
    thaliPrice: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primary },
    facilityRow: { flexDirection: 'row', gap: 10, marginTop: Spacing.md },
    facilityCard: {
        flex: 1,
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: Colors.border,
        gap: 4,
    },
    facilityCardActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primaryBorder },
    facilityName: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        textAlign: 'center',
    },
    facilityStatus: {
        fontSize: Typography.xs,
        fontWeight: Typography.medium,
        color: Colors.primary,
        textAlign: 'center',
    },
});

const loc = StyleSheet.create({
    row: { flexDirection: 'row', paddingVertical: 5, gap: 6 },
    label: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
        width: 70,
    },
    value: { flex: 1, fontSize: Typography.base, color: Colors.charcoal },
    mapsLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
    },
    mapsText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.primary },
    transitRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
    },
    transitItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    transitIcon: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: Colors.primaryDim,
        alignItems: 'center',
        justifyContent: 'center',
    },
    transitLabel: { fontSize: 9, color: Colors.charcoalLight, fontWeight: Typography.medium },
    transitValue: { fontSize: Typography.sm, color: Colors.charcoal, fontWeight: Typography.bold },
});

const pr = StyleSheet.create({
    cardsRow: { flexDirection: 'row', gap: 10 },
    card: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        alignItems: 'center',
        gap: 4,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    cardWeekend: { backgroundColor: Colors.primaryDim, borderColor: Colors.primaryBorder },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: Radii.md,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    cardLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
        textAlign: 'center',
    },
    cardSub: { fontSize: 9, color: Colors.charcoalLight, fontWeight: Typography.medium },
    cardPrice: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
        marginTop: 2,
    },
    extraRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
    },
    extraLabel: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    extraPrice: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.primary },
});

const av = StyleSheet.create({
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    dayCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    dayCircleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    dayAbbr: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.charcoalLight },
    dayAbbrActive: { color: Colors.white },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    timeText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: Colors.border,
        marginHorizontal: 2,
    },
    ruleText: {
        flex: 1,
        fontSize: Typography.sm,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
});

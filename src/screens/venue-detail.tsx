import React, { useRef, useState, useCallback, useMemo } from 'react';
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
    Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigations/RootNavigation';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/auth-store';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.38;
const THUMB_SIZE = 60;

type Props = NativeStackScreenProps<RootStackParamList, 'venueDetail'>;

// ─── Domain types ──────────────────────────────────────────────────────────────

export type BasicAmenity = { name: string; type: string; rate: number };
export type AdditionalAmenity = { name: string; charges: number };
export type Beverage = { name: string; ratePerUnit: number };
export type RefreshmentFood = { name: string; ratePerPlate: number };
// Format 1 (flat):   { type, itemNames, ratePerPlate, numberOfItems }
// Format 2 (nested): { thaliType, available, categories: [{ category, ratePerPlate, ... }] }
export type LunchThaliCategory = {
    _id?: string;
    category: string;
    ratePerPlate: number;
    numberOfItems?: number;
    itemNames?: string;
};
export type LunchThali = {
    // Format 1 fields
    type?: string;
    itemNames?: string;
    ratePerPlate?: number;
    numberOfItems?: number;
    // Format 2 fields
    thaliType?: string;
    available?: boolean;
    categories?: LunchThaliCategory[];
    _id?: string;
};
export type FacilityItem = { available: boolean; type: string; charges: number };

export type Amenities = {
    basic: BasicAmenity[];
    additional: AdditionalAmenity[];
    beverages: Beverage[];
    refreshmentFood: RefreshmentFood[];
    lunchThalis: LunchThali[];
    kitchenAccess: FacilityItem;
    diningArea: FacilityItem;
};

export type VenueImage = { url: string; isFeatured: boolean };
export type Pricing = {
    perHour: { weekday: number; weekend: number };
    halfDay: { weekday: number; weekend: number };
    fullDay: { weekday: number; weekend: number };
    extraHourRate: { weekday: number; weekend: number };
    enabledOptions?: { perHour?: boolean; halfDay?: boolean; fullDay?: boolean };
};
export type Availability = {
    openingTime: string;
    closingTime: string;
    availableDays: string[];
    advanceBookingRule: string;
};
export type Location = {
    address: string;
    landmark: string;
    city: string;
    area: string;
    pincode: string;
    parkingAvailability: string;
    googleMapLink: string;
    nearestBusAuto: number;
    nearestMetroTrain: string;
};
export type Venue = {
    _id?: string;
    id?: string;
    businessName: string;
    status: string;
    images: VenueImage[];
    rating: number;
    capacity: number;
    areaSqft: number;
    totalBookings: number;
    reviewCount: number;
    venueType: string[];
    description: string;
    pricing: Pricing;
    availability: Availability;
    amenities: Amenities;
    location: Location;
    customPlatformFee?: { enabled: boolean; percentage: number };
    customGST?: { enabled: boolean; rate: number };
};

export type SelectedAmenityItem = {
    name: string;
    category: 'basic_included' | 'basic_paid' | 'additional' | 'beverage' | 'refreshment' | 'thali';
    qty: number;
    unitPrice: number;
    total: number;
    rateType?: string;
    thaliCategory?: string;
    numberOfItems?: number;
    itemNames?: string;
};

type SheetDurationOption = {
    label: string;
    hours: number;
    price: number;
    type: 'perHour' | 'halfDay' | 'fullDay';
};

type StatItem = { icon: string; value: string };
type PricingCard = { icon: string; label: string; price: number; sub: string };
type TransitItem = { icon: string; label: string; value: string };
type LocationRow = { label: string; value: string | number | undefined };
type FacilityDef = { icon: string; label: string; data: FacilityItem };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBR: Record<string, string> = {
    Monday: 'M',
    Tuesday: 'T',
    Wednesday: 'W',
    Thursday: 'T',
    Friday: 'F',
    Saturday: 'S',
    Sunday: 'S',
};

function formatTime(t: string): string {
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function isWeekend(dateStr: string): boolean {
    const d = new Date(dateStr);
    return d.getDay() === 0 || d.getDay() === 6;
}

// FIX 1: Removed thaliGroupKey() entirely — not needed for direct flat list

function buildSheetDurations(pricing: Pricing, wknd: boolean): SheetDurationOption[] {
    const opts: SheetDurationOption[] = [];

    const useEnabled = !!(
        pricing.enabledOptions?.perHour ||
        pricing.enabledOptions?.halfDay ||
        pricing.enabledOptions?.fullDay
    );

    if (!useEnabled || pricing.enabledOptions?.perHour) {
        const rate = wknd ? pricing.perHour?.weekend : pricing.perHour?.weekday;
        if (rate) {
            [1, 2, 4].forEach(h =>
                opts.push({ label: `${h}H`, hours: h, price: rate * h, type: 'perHour' }),
            );
        }
    }
    if (!useEnabled || pricing.enabledOptions?.halfDay) {
        const rate = wknd ? pricing.halfDay?.weekend : pricing.halfDay?.weekday;
        if (rate) opts.push({ label: 'Half Day', hours: 4, price: rate, type: 'halfDay' });
    }
    if (!useEnabled || pricing.enabledOptions?.fullDay) {
        const rate = wknd ? pricing.fullDay?.weekend : pricing.fullDay?.weekday;
        if (rate) opts.push({ label: 'Full Day', hours: 8, price: rate, type: 'fullDay' });
    }

    return opts;
}

// ─── Small reusable UI pieces ─────────────────────────────────────────────────

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

function Divider() {
    return <View style={util.divider} />;
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

// ─── IncludedItem ──────────────────────────────────────────────────────────────

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

// ─── PaidItem ──────────────────────────────────────────────────────────────────

type PaidItemProps = {
    name: string;
    charge: number;
    qty: number;
    checked: boolean;
    onToggle: () => void;
    onIncrement: () => void;
    onDecrement: () => void;
};
function PaidItem({
    name,
    charge,
    qty,
    checked,
    onToggle,
    onIncrement,
    onDecrement,
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
                    <Text style={am.stepQty}>{qty}</Text>
                    <TouchableOpacity onPress={onIncrement} style={am.stepBtn}>
                        <Text style={am.stepBtnText}>+</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Text style={am.paidPrice}>₹{charge}</Text>
            )}
        </View>
    );
}

// ─── BeverageItem ──────────────────────────────────────────────────────────────

type BeverageItemProps = {
    name: string;
    rate: number;
    qty: number;
    checked: boolean;
    onToggle: () => void;
    onIncrement: () => void;
    onDecrement: () => void;
};
function BeverageItem({
    name,
    rate,
    qty,
    checked,
    onToggle,
    onIncrement,
    onDecrement,
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
            <View style={{ flex: 1 }}>
                <Text style={am.paidName}>{name}</Text>
            </View>
            {checked ? (
                <View style={am.stepper}>
                    <TouchableOpacity onPress={onDecrement} style={am.stepBtn}>
                        <Text style={am.stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={am.stepQty}>{qty}</Text>
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

// ─── RefreshmentItem ──────────────────────────────────────────────────────────

type RefreshmentItemProps = { name: string; rate: number; checked: boolean; onToggle: () => void };
function RefreshmentItem({ name, rate, checked, onToggle }: RefreshmentItemProps) {
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
            <Text style={am.paidPrice}>₹{rate}/plate</Text>
        </View>
    );
}

// FIX 2: ThaliGroup component and ThaliGroupProps type REMOVED — replaced by direct flat map in JSX

// ─── BookingSheet ─────────────────────────────────────────────────────────────

type BookingSheetProps = {
    visible: boolean;
    venue: Venue;
    paidAmenities: SelectedAmenityItem[];
    amenitiesTotal: number;
    allAmenities: SelectedAmenityItem[];
    onClose: () => void;
};

function BookingSheet({
    visible,
    venue,
    paidAmenities,
    amenitiesTotal,
    allAmenities,
    onClose,
}: BookingSheetProps) {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const today = new Date().toISOString().split('T')[0];
    const wknd = isWeekend(today);

    const durationOptions = useMemo(
        () => buildSheetDurations(venue.pricing, wknd),
        [venue.pricing, wknd],
    );

    const [durationIdx, setDurationIdx] = useState(0);
    const selected = durationOptions[durationIdx];
    const venueRental = selected?.price ?? 0;
    const estimatedSubtotal = venueRental + amenitiesTotal;

    const handleReserve = () => {
        if (!selected) return;
        onClose();
        navigation.navigate('booking', {
            venue,
            selectedAmenities: allAmenities,
            amenitiesTotal,
            preselectedDurationHours: selected.hours,
            preselectedDurationType: selected.type,
        });
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={sheet.overlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFillObject}
                    onPress={onClose}
                    activeOpacity={1}
                />
                <View style={sheet.container}>
                    <View style={sheet.handle} />
                    <View style={sheet.header}>
                        <View>
                            <Text style={sheet.headerTitle}>Book This Venue</Text>
                            <View style={sheet.priceRow}>
                                <Text style={sheet.startingFrom}>Starting from </Text>
                                <Text style={sheet.price}>
                                    ₹
                                    {(wknd
                                        ? venue.pricing.perHour.weekend
                                        : venue.pricing.perHour.weekday
                                    ).toLocaleString()}
                                </Text>
                                <Text style={sheet.perHour}>/hour</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={sheet.closeBtn}>
                            <Ionicons name="close" size={20} color={Colors.charcoalMid} />
                        </TouchableOpacity>
                    </View>
                    <Divider />

                    <Text style={sheet.fieldLabel}>Duration</Text>
                    {durationOptions.length === 0 ? (
                        <Text style={sheet.noDurations}>
                            No pricing options configured for this venue.
                        </Text>
                    ) : (
                        <View style={sheet.durationRow}>
                            {durationOptions.map((d, i) => (
                                <TouchableOpacity
                                    key={d.label}
                                    style={[
                                        sheet.durationBtn,
                                        i === durationIdx && sheet.durationBtnActive,
                                    ]}
                                    onPress={() => setDurationIdx(i)}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            sheet.durationText,
                                            i === durationIdx && sheet.durationTextActive,
                                        ]}
                                    >
                                        {d.label}
                                    </Text>
                                    <Text
                                        style={[
                                            sheet.durationPrice,
                                            i === durationIdx && sheet.durationPriceActive,
                                        ]}
                                    >
                                        ₹{d.price.toLocaleString()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={sheet.summaryBox}>
                        <View style={sheet.summaryRow}>
                            <Text style={sheet.summaryLabel}>Base Price</Text>
                            <Text style={sheet.summaryValue}>₹{venueRental.toLocaleString()}</Text>
                        </View>
                        {amenitiesTotal > 0 && (
                            <View style={[sheet.summaryRow, { marginTop: 6 }]}>
                                <Text style={sheet.summaryLabel}>
                                    Amenities ({paidAmenities.length} item
                                    {paidAmenities.length !== 1 ? 's' : ''})
                                </Text>
                                <Text style={sheet.summaryValue}>
                                    ₹{amenitiesTotal.toLocaleString()}
                                </Text>
                            </View>
                        )}
                        <View style={[sheet.summaryRow, { marginTop: 8 }]}>
                            <Text style={[sheet.summaryLabel, { fontWeight: Typography.bold }]}>
                                Subtotal (excl. taxes)
                            </Text>
                            <Text style={sheet.estimatedTotal}>
                                ₹{estimatedSubtotal.toLocaleString()}
                            </Text>
                        </View>
                        <Text style={sheet.taxNote}>* Platform fee & GST applied at checkout</Text>
                    </View>

                    <TouchableOpacity
                        style={[sheet.reserveBtn, !selected && { opacity: 0.5 }]}
                        activeOpacity={0.85}
                        onPress={handleReserve}
                        disabled={!selected}
                    >
                        <Ionicons
                            name="calendar"
                            size={18}
                            color={Colors.white}
                            style={{ marginRight: 8 }}
                        />
                        <Text style={sheet.reserveText}>Reserve Now</Text>
                    </TouchableOpacity>

                    <View style={sheet.infoStrip}>
                        {(
                            [
                                {
                                    icon: 'time-outline',
                                    text: `${formatTime(
                                        venue.availability.openingTime,
                                    )} – ${formatTime(venue.availability.closingTime)}`,
                                },
                                { icon: 'people-outline', text: `Capacity: ${venue.capacity}` },
                            ] as Array<{ icon: string; text: string }>
                        ).map((info, i) => (
                            <View key={i} style={sheet.infoItem}>
                                <Ionicons
                                    name={info.icon as any}
                                    size={13}
                                    color={Colors.primary}
                                />
                                <Text style={sheet.infoText}>{info.text}</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity style={sheet.shareBtn} activeOpacity={0.8}>
                        <Ionicons name="share-social-outline" size={16} color={Colors.primary} />
                        <Text style={sheet.shareText}>Share Venue</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─── Amenity summary badge ────────────────────────────────────────────────────

function AmenitiesSummaryBadge({ count, total }: { count: number; total: number }) {
    if (count === 0) return null;
    return (
        <View style={badge.wrap}>
            <Ionicons name="add-circle" size={12} color={Colors.primary} />
            <Text style={badge.text}>
                {count} amenit{count === 1 ? 'y' : 'ies'} • ₹{total.toLocaleString()}
            </Text>
        </View>
    );
}
const badge = StyleSheet.create({
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
    const { user } = useAuthStore();
    const scrollY = useRef(new Animated.Value(0)).current;
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [bookingVisible, setBookingVisible] = useState(false);
    const { pricing, availability, amenities, location } = venue;
    const isOwner = user?.role === 'owner';

    const [paidChecked, setPaidChecked] = useState<Set<string>>(new Set());
    const [paidQty, setPaidQty] = useState<Record<string, number>>({});
    const [bevChecked, setBevChecked] = useState<Set<string>>(new Set());
    const [bevQty, setBevQty] = useState<Record<string, number>>({});
    const [refChecked, setRefChecked] = useState<Set<string>>(new Set());
    const [thaliChecked, setThaliChecked] = useState<Set<string>>(new Set());

    const toggleSet = useCallback((set: Set<string>, key: string): Set<string> => {
        const next = new Set(set);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
    }, []);

    const { allAmenities, paidAmenities, amenitiesTotal } = useMemo(() => {
        const all: SelectedAmenityItem[] = [];

        // 1. Basic included (free)
        amenities.basic
            .filter(a => a.type !== 'Paid')
            .forEach(a => {
                all.push({
                    name: a.name,
                    category: 'basic_included',
                    qty: 1,
                    unitPrice: 0,
                    total: 0,
                    rateType: 'Fixed',
                });
            });

        // 2. Basic paid
        amenities.basic
            .filter(a => a.type === 'Paid' && paidChecked.has(a.name))
            .forEach(a => {
                const qty = paidQty[a.name] ?? 1;
                all.push({
                    name: a.name,
                    category: 'basic_paid',
                    qty,
                    unitPrice: a.rate,
                    total: a.rate * qty,
                    rateType: 'Per Use',
                });
            });

        // 3. Additional services
        amenities.additional
            .filter(a => paidChecked.has(`add_${a.name}`))
            .forEach(a => {
                const qty = paidQty[`add_${a.name}`] ?? 1;
                all.push({
                    name: a.name,
                    category: 'additional',
                    qty,
                    unitPrice: a.charges,
                    total: a.charges * qty,
                    rateType: 'Fixed',
                });
            });

        // 4. Beverages
        amenities.beverages
            .filter(b => bevChecked.has(b.name))
            .forEach(b => {
                const qty = bevQty[b.name] ?? 1;
                all.push({
                    name: b.name,
                    category: 'beverage',
                    qty,
                    unitPrice: b.ratePerUnit,
                    total: b.ratePerUnit * qty,
                    rateType: 'Per Person',
                });
            });

        // 5. Refreshments
        amenities.refreshmentFood
            .filter(f => refChecked.has(f.name))
            .forEach(f => {
                all.push({
                    name: f.name,
                    category: 'refreshment',
                    qty: 1,
                    unitPrice: f.ratePerPlate,
                    total: f.ratePerPlate,
                    rateType: 'Per Plate',
                });
            });

        // 6. Thalis — handle both API formats
        //    Format 1: flat { type, ratePerPlate, itemNames, numberOfItems }
        //    Format 2: nested { thaliType, categories: [{ category, ratePerPlate, ... }] }
        amenities.lunchThalis.forEach(t => {
            if (t.thaliType && Array.isArray(t.categories)) {
                // Format 2 — iterate each category row; key = `${thaliType}__${category}`
                t.categories.forEach(cat => {
                    const key = `${t.thaliType}__${cat.category}`;
                    if (thaliChecked.has(key)) {
                        all.push({
                            name: `${t.thaliType} — ${cat.category}`,
                            category: 'thali',
                            qty: 1,
                            unitPrice: cat.ratePerPlate,
                            total: cat.ratePerPlate,
                            rateType: 'Per Plate',
                            thaliCategory: cat.category,
                            numberOfItems: cat.numberOfItems ?? 0,
                            itemNames: cat.itemNames ?? '',
                        });
                    }
                });
            } else if (t.type) {
                // Format 1 — flat entry; key = t.type
                if (thaliChecked.has(t.type)) {
                    all.push({
                        name: t.type,
                        category: 'thali',
                        qty: 1,
                        unitPrice: t.ratePerPlate ?? 0,
                        total: t.ratePerPlate ?? 0,
                        rateType: 'Per Plate',
                        thaliCategory: t.type,
                        numberOfItems: t.numberOfItems ?? 0,
                        itemNames: t.itemNames ?? '',
                    });
                }
            }
        });

        const paid = all.filter(i => i.category !== 'basic_included');
        const total = paid.reduce((sum, i) => sum + i.total, 0);

        return { allAmenities: all, paidAmenities: paid, amenitiesTotal: total };
    }, [paidChecked, paidQty, bevChecked, bevQty, refChecked, thaliChecked, amenities]);

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

    // FIX 6: thaliGroups reduce REMOVED — no grouping needed

    return (
        <View style={s.container}>
            {/* Sticky header */}
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
                {/* Hero carousel */}
                <View style={s.heroContainer}>
                    <Animated.View
                        style={[s.heroInner, { transform: [{ translateY: heroTranslate }] }]}
                    >
                        <FlatList<VenueImage>
                            data={venue.images}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={e =>
                                setActiveImageIndex(
                                    Math.round(e.nativeEvent.contentOffset.x / width),
                                )
                            }
                            keyExtractor={(_, i) => String(i)}
                            renderItem={({ item }) => (
                                <Image source={{ uri: item.url }} style={s.heroImage} />
                            )}
                        />
                        <Animated.View style={[s.heroOverlay, { opacity: heroOverlayOpacity }]} />
                    </Animated.View>
                    <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={22} color={Colors.white} />
                    </TouchableOpacity>
                    {venue.status === 'approved' && (
                        <View style={s.approvedBadge}>
                            <Ionicons name="shield-checkmark" size={11} color={Colors.white} />
                            <Text style={s.approvedText}>Approved</Text>
                        </View>
                    )}
                    {venue.images[activeImageIndex]?.isFeatured && (
                        <View style={s.featuredBadge}>
                            <Ionicons name="star" size={11} color={Colors.white} />
                            <Text style={s.featuredText}>Featured</Text>
                        </View>
                    )}
                    <View style={s.imageCounter}>
                        <Text style={s.imageCountText}>
                            {activeImageIndex + 1}/{venue.images.length}
                        </Text>
                    </View>
                </View>

                {/* Thumbnail strip */}
                <View style={s.thumbStrip}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={s.thumbScroll}
                    >
                        {venue.images.map((img, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[s.thumb, i === activeImageIndex && s.thumbActive]}
                                onPress={() => setActiveImageIndex(i)}
                                activeOpacity={0.8}
                            >
                                <Image source={{ uri: img.url }} style={s.thumbImage} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Info card */}
                <View style={s.infoCard}>
                    <View style={s.nameRow}>
                        <Text style={s.venueName}>{venue.businessName}</Text>
                        <View style={s.ratingBadge}>
                            <Ionicons name="star" size={13} color={Colors.primary} />
                            <Text style={s.ratingText}>
                                {venue.rating > 0 ? venue.rating.toFixed(1) : 'New'}
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
                        {(
                            [
                                {
                                    icon: 'grid-outline',
                                    value: `${venue.areaSqft.toLocaleString()} sqft`,
                                },
                                {
                                    icon: 'bookmark-outline',
                                    value: `${venue.totalBookings} bookings`,
                                },
                                {
                                    icon: 'chatbubble-outline',
                                    value: `${venue.reviewCount} reviews`,
                                },
                            ] as StatItem[]
                        ).map((st, i) => (
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

                {/* Venue Types */}
                <View style={s.section}>
                    <View style={s.venueTypesHeader}>
                        <Text style={s.venueTypesLabel}>VENUE TYPES</Text>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={s.typeChips}
                    >
                        {venue.venueType.map(t => (
                            <View key={t} style={s.typeChip}>
                                <Text style={s.typeChipText}>{t}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* About */}
                <View style={s.section}>
                    <SectionTitle icon="information-circle-outline" label="About This Venue" />
                    <Text style={s.description}>{venue.description}</Text>
                </View>

                {/* Amenities */}
                <View style={s.section}>
                    <SectionTitle icon="options-outline" label="Select Amenities & Services" />

                    {amenities.basic.filter(a => a.type !== 'Paid').length > 0 && (
                        <View style={am.subSection}>
                            <View style={am.subHeader}>
                                <View style={am.subDot} />
                                <Text style={am.subTitle}>Basic Amenities</Text>
                            </View>
                            <Text style={am.subLabel}>Included</Text>
                            <View style={am.includedGrid}>
                                {amenities.basic
                                    .filter(a => a.type !== 'Paid')
                                    .map((item, i) => (
                                        <View key={i} style={am.includedCell}>
                                            <IncludedItem name={item.name} />
                                        </View>
                                    ))}
                            </View>
                        </View>
                    )}

                    {amenities.basic.filter(a => a.type === 'Paid').length > 0 && (
                        <View style={am.subSection}>
                            <Text style={am.subLabel}>Paid</Text>
                            {amenities.basic
                                .filter(a => a.type === 'Paid')
                                .map((item, i) => (
                                    <PaidItem
                                        key={i}
                                        name={item.name}
                                        charge={item.rate}
                                        qty={paidQty[item.name] ?? 0}
                                        checked={paidChecked.has(item.name)}
                                        onToggle={() => {
                                            setPaidChecked(prev => toggleSet(prev, item.name));
                                            if (!paidQty[item.name])
                                                setPaidQty(p => ({ ...p, [item.name]: 1 }));
                                        }}
                                        onIncrement={() =>
                                            setPaidQty(p => ({
                                                ...p,
                                                [item.name]: (p[item.name] ?? 1) + 1,
                                            }))
                                        }
                                        onDecrement={() =>
                                            setPaidQty(p => ({
                                                ...p,
                                                [item.name]: Math.max(1, (p[item.name] ?? 1) - 1),
                                            }))
                                        }
                                    />
                                ))}
                        </View>
                    )}

                    {amenities.additional.length > 0 && (
                        <View style={am.subSection}>
                            <View style={am.subHeader}>
                                <View style={[am.subDot, { backgroundColor: Colors.info }]} />
                                <Text style={am.subTitle}>Additional Services</Text>
                            </View>
                            {amenities.additional.map((item, i) => (
                                <PaidItem
                                    key={i}
                                    name={item.name}
                                    charge={item.charges}
                                    qty={paidQty[`add_${item.name}`] ?? 0}
                                    checked={paidChecked.has(`add_${item.name}`)}
                                    onToggle={() => {
                                        setPaidChecked(prev => toggleSet(prev, `add_${item.name}`));
                                        if (!paidQty[`add_${item.name}`])
                                            setPaidQty(p => ({
                                                ...p,
                                                [`add_${item.name}`]: 1,
                                            }));
                                    }}
                                    onIncrement={() =>
                                        setPaidQty(p => ({
                                            ...p,
                                            [`add_${item.name}`]: (p[`add_${item.name}`] ?? 1) + 1,
                                        }))
                                    }
                                    onDecrement={() =>
                                        setPaidQty(p => ({
                                            ...p,
                                            [`add_${item.name}`]: Math.max(
                                                1,
                                                (p[`add_${item.name}`] ?? 1) - 1,
                                            ),
                                        }))
                                    }
                                />
                            ))}
                        </View>
                    )}

                    {amenities.beverages.length > 0 && (
                        <View style={am.subSection}>
                            <View style={am.subHeader}>
                                <Ionicons name="cafe-outline" size={14} color={Colors.primary} />
                                <Text style={am.subTitle}>Beverages</Text>
                            </View>
                            {amenities.beverages.map((b, i) => (
                                <BeverageItem
                                    key={i}
                                    name={b.name}
                                    rate={b.ratePerUnit}
                                    qty={bevQty[b.name] ?? 0}
                                    checked={bevChecked.has(b.name)}
                                    onToggle={() => {
                                        setBevChecked(prev => toggleSet(prev, b.name));
                                        if (!bevQty[b.name])
                                            setBevQty(p => ({ ...p, [b.name]: 1 }));
                                    }}
                                    onIncrement={() =>
                                        setBevQty(p => ({
                                            ...p,
                                            [b.name]: (p[b.name] ?? 1) + 1,
                                        }))
                                    }
                                    onDecrement={() =>
                                        setBevQty(p => ({
                                            ...p,
                                            [b.name]: Math.max(1, (p[b.name] ?? 1) - 1),
                                        }))
                                    }
                                />
                            ))}
                        </View>
                    )}

                    {amenities.refreshmentFood.length > 0 && (
                        <View style={am.subSection}>
                            <View style={am.subHeader}>
                                <Ionicons
                                    name="fast-food-outline"
                                    size={14}
                                    color={Colors.primary}
                                />
                                <Text style={am.subTitle}>Refreshments & Snacks</Text>
                            </View>
                            {amenities.refreshmentFood.map((food, i) => (
                                <RefreshmentItem
                                    key={i}
                                    name={food.name}
                                    rate={food.ratePerPlate}
                                    checked={refChecked.has(food.name)}
                                    onToggle={() =>
                                        setRefChecked(prev => toggleSet(prev, food.name))
                                    }
                                />
                            ))}
                        </View>
                    )}

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
                            {/* Handles both API formats for lunchThalis */}
                            {amenities.lunchThalis.map((t, i) => {
                                // ── Format 2: nested { thaliType, categories[] } ──
                                if (t.thaliType && Array.isArray(t.categories)) {
                                    return (
                                        <View key={t._id ?? t.thaliType ?? i} style={am.thaliGroup}>
                                            {/* Cuisine header */}
                                            <Text style={am.thaliGroupName}>{t.thaliType}</Text>
                                            {t.categories.map((cat, ci) => {
                                                const key = `${t.thaliType}__${cat.category}`;
                                                const checked = thaliChecked.has(key);
                                                return (
                                                    <TouchableOpacity
                                                        key={cat._id ?? ci}
                                                        style={[
                                                            am.thaliRow,
                                                            checked && am.thaliRowActive,
                                                        ]}
                                                        onPress={() =>
                                                            setThaliChecked(prev =>
                                                                toggleSet(prev, key),
                                                            )
                                                        }
                                                        activeOpacity={0.8}
                                                    >
                                                        <View
                                                            style={[
                                                                am.checkbox,
                                                                checked && am.checkboxOn,
                                                            ]}
                                                        >
                                                            {checked && (
                                                                <Ionicons
                                                                    name="checkmark"
                                                                    size={11}
                                                                    color={Colors.white}
                                                                />
                                                            )}
                                                        </View>
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
                                                        <Text style={am.thaliPrice}>
                                                            ₹{cat.ratePerPlate}/plate
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    );
                                }

                                // ── Format 1: flat { type, ratePerPlate, ... } ──
                                const checked = thaliChecked.has(t.type ?? '');
                                return (
                                    <TouchableOpacity
                                        key={t.type ?? i}
                                        style={[am.thaliRow, checked && am.thaliRowActive]}
                                        onPress={() =>
                                            setThaliChecked(prev => toggleSet(prev, t.type ?? ''))
                                        }
                                        activeOpacity={0.8}
                                    >
                                        <View style={[am.checkbox, checked && am.checkboxOn]}>
                                            {checked && (
                                                <Ionicons
                                                    name="checkmark"
                                                    size={11}
                                                    color={Colors.white}
                                                />
                                            )}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={am.thaliType}>{t.type}</Text>
                                            {!!t.itemNames && (
                                                <Text style={am.thaliItems} numberOfLines={1}>
                                                    {t.itemNames}
                                                </Text>
                                            )}
                                            {!!t.numberOfItems && (
                                                <Text style={am.thaliItems}>
                                                    {t.numberOfItems} items
                                                </Text>
                                            )}
                                        </View>
                                        <Text style={am.thaliPrice}>₹{t.ratePerPlate}/plate</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                    <View style={am.facilityRow}>
                        {(
                            [
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
                            ] as FacilityDef[]
                        ).map(f => (
                            <View
                                key={f.label}
                                style={[am.facilityCard, f.data.available && am.facilityCardActive]}
                            >
                                <Ionicons
                                    name={f.icon as any}
                                    size={20}
                                    color={f.data.available ? Colors.primary : Colors.charcoalLight}
                                />
                                <Text style={am.facilityName}>{f.label}</Text>
                                <Text
                                    style={[
                                        am.facilityStatus,
                                        !f.data.available && { color: Colors.charcoalLight },
                                    ]}
                                >
                                    {f.data.available
                                        ? f.data.type === 'Paid'
                                            ? `₹${f.data.charges}`
                                            : 'Included in booking'
                                        : 'Not available'}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Location */}
                <View style={s.section}>
                    <SectionTitle icon="location-outline" label="Location" />
                    {(
                        [
                            { label: 'Address', value: location.address },
                            { label: 'Landmark', value: location.landmark },
                            { label: 'City', value: location.city },
                            { label: 'Area', value: location.area },
                            { label: 'Pincode', value: location.pincode },
                            { label: 'Parking', value: location.parkingAvailability },
                        ] as LocationRow[]
                    )
                        .filter(r => !!r.value)
                        .map((row, i) => (
                            <View key={i} style={loc.row}>
                                <Text style={loc.label}>{row.label}:</Text>
                                <Text style={loc.value}>{row.value}</Text>
                            </View>
                        ))}
                    <TouchableOpacity
                        style={loc.mapsLink}
                        onPress={() => Linking.openURL(location.googleMapLink)}
                        activeOpacity={0.75}
                    >
                        <Ionicons name="navigate-circle" size={16} color={Colors.primary} />
                        <Text style={loc.mapsText}>View on Google Maps</Text>
                    </TouchableOpacity>
                    <View style={loc.transitRow}>
                        {(
                            [
                                {
                                    icon: 'bus-outline',
                                    label: 'Bus / Auto',
                                    value: `${location.nearestBusAuto}m`,
                                },
                                {
                                    icon: 'train-outline',
                                    label: 'Metro / Rail',
                                    value: location.nearestMetroTrain,
                                },
                            ] as TransitItem[]
                        ).map(tr => (
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
                </View>

                {/* Pricing */}
                <View style={s.section}>
                    <SectionTitle icon="pricetag-outline" label="Pricing (Weekday)" />
                    <View style={pr.cardsRow}>
                        {(
                            [
                                {
                                    icon: 'time-outline',
                                    label: '1 Hour',
                                    price: pricing.perHour.weekday,
                                    sub: '',
                                },
                                {
                                    icon: 'sunny-outline',
                                    label: 'Half Day',
                                    price: pricing.halfDay.weekday,
                                    sub: '4 Hours',
                                },
                                {
                                    icon: 'calendar-outline',
                                    label: 'Full Day',
                                    price: pricing.fullDay.weekday,
                                    sub: '8 Hours',
                                },
                            ] as PricingCard[]
                        ).map((p, i) => (
                            <View key={i} style={pr.card}>
                                <View style={pr.iconWrap}>
                                    <Ionicons
                                        name={p.icon as any}
                                        size={18}
                                        color={Colors.primary}
                                    />
                                </View>
                                <Text style={pr.cardLabel}>{p.label}</Text>
                                {!!p.sub && <Text style={pr.cardSub}>{p.sub}</Text>}
                                <Text style={pr.cardPrice}>₹{p.price.toLocaleString()}</Text>
                            </View>
                        ))}
                    </View>
                    {pricing.extraHourRate.weekday > 0 && (
                        <View style={pr.extraRow}>
                            <Ionicons name="add-circle-outline" size={14} color={Colors.primary} />
                            <Text style={pr.extraLabel}>Extra Hour</Text>
                            <Text style={pr.extraPrice}>
                                ₹{pricing.extraHourRate.weekday.toLocaleString()}/hr
                            </Text>
                        </View>
                    )}
                </View>

                {/* Availability */}
                <View style={s.section}>
                    <SectionTitle icon="calendar-outline" label="Availability" />
                    <View style={av.timeRow}>
                        <View style={av.timeBox}>
                            <Text style={av.timeLabel}>Opens</Text>
                            <Text style={av.timeValue}>{formatTime(availability.openingTime)}</Text>
                        </View>
                        <View style={av.timeSep}>
                            <View style={av.timeLine} />
                            <Ionicons name="time-outline" size={18} color={Colors.primary} />
                            <View style={av.timeLine} />
                        </View>
                        <View style={av.timeBox}>
                            <Text style={av.timeLabel}>Closes</Text>
                            <Text style={av.timeValue}>{formatTime(availability.closingTime)}</Text>
                        </View>
                    </View>
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
                    {!!availability.advanceBookingRule && (
                        <View style={av.ruleBox}>
                            <Ionicons
                                name="alert-circle-outline"
                                size={14}
                                color={Colors.primary}
                            />
                            <Text style={av.ruleText}>{availability.advanceBookingRule}</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 120 }} />
            </Animated.ScrollView>

            {/* CTA bar */}
            <View style={s.ctaBar}>
                {!isOwner && (
                    <View>
                        <Text style={s.ctaFromLabel}>Starting from</Text>
                        <View style={s.ctaPriceRow}>
                            <Text style={s.ctaPrice}>₹{pricing.perHour.weekday.toLocaleString()}</Text>
                            <Text style={s.ctaPerHour}>/hr</Text>
                        </View>
                        <AmenitiesSummaryBadge count={paidAmenities.length} total={amenitiesTotal} />
                    </View>
                )}
                <TouchableOpacity
                    style={s.ctaButton}
                    onPress={() => isOwner ? navigation.navigate('updateVenue',{
                        venueId:venue._id
                    }) : setBookingVisible(true)}
                    activeOpacity={0.85}
                >
                    <Ionicons
                        name={isOwner ? 'pencil' : 'calendar'}
                        size={18}
                        color={Colors.white}
                        style={{ marginRight: 8 }}
                    />
                    <Text style={s.ctaButtonText}>{isOwner ? 'Update Venue' : 'Book Now'}</Text>
                </TouchableOpacity>
            </View>

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
    venueTypesHeader: { marginBottom: Spacing.sm },
    venueTypesLabel: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.charcoalLight,
        letterSpacing: Typography.wider,
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
    stepQty: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.primaryDark,
        minWidth: 20,
        textAlign: 'center',
    },
    // thaliGroup: bordered card container for Format 2 grouped thalis
    thaliGroup: {
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        overflow: 'hidden',
        marginBottom: 10,
    },
    // thaliGroupName: cuisine header shown at top of each Format 2 group
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
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    timeBox: {
        alignItems: 'center',
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: Radii.md,
        minWidth: 100,
    },
    timeLabel: {
        fontSize: 9,
        fontWeight: Typography.bold,
        color: Colors.primaryDark,
        letterSpacing: 1,
    },
    timeValue: {
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.primaryDark,
    },
    timeSep: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timeLine: { width: 14, height: 1.5, backgroundColor: Colors.primaryBorder },
    daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
    dayCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    dayCircleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    dayAbbr: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.charcoalLight },
    dayAbbrActive: { color: Colors.white },
    ruleBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primaryDim,
        padding: Spacing.sm,
        borderRadius: Radii.md,
    },
    ruleText: {
        flex: 1,
        fontSize: Typography.sm,
        color: Colors.primaryDark,
        fontWeight: Typography.medium,
    },
});

const sheet = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
    container: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
        paddingTop: Spacing.lg,
        ...Shadows.floating,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginBottom: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.lg,
    },
    headerTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 4 },
    startingFrom: { fontSize: Typography.sm, color: Colors.charcoalLight },
    price: { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: Colors.primary },
    perHour: { fontSize: Typography.sm, color: Colors.charcoalLight },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fieldLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.3,
        marginBottom: Spacing.sm,
    },
    noDurations: { fontSize: Typography.sm, color: Colors.charcoalLight, marginBottom: Spacing.lg },
    durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.lg },
    durationBtn: {
        flex: 1,
        minWidth: 70,
        paddingVertical: 10,
        paddingHorizontal: 6,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: 'center',
        backgroundColor: Colors.background,
        gap: 2,
    },
    durationBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    durationText: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
    },
    durationTextActive: { color: Colors.white },
    durationPrice: { fontSize: 10, fontWeight: Typography.semiBold, color: Colors.charcoalLight },
    durationPriceActive: { color: Colors.white },
    summaryBox: {
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: {
        fontSize: Typography.base,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    summaryValue: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    estimatedTotal: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
    },
    taxNote: { fontSize: 10, color: Colors.charcoalLight, marginTop: 6, fontStyle: 'italic' },
    reserveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        paddingVertical: 15,
        marginBottom: Spacing.lg,
        ...Shadows.primary,
    },
    reserveText: { fontSize: Typography.lg, fontWeight: Typography.extraBold, color: Colors.white },
    infoStrip: { gap: 6, marginBottom: Spacing.lg },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        borderRadius: Radii.full,
        paddingVertical: 12,
        gap: 6,
    },
    shareText: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.primary,
    },
});

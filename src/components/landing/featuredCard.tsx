import {
    Animated,
    TouchableOpacity,
    View,
    Text,
    StyleSheet,
    Dimensions,
    Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Spacing, Colors, Radii, Shadows, Typography } from '../../theme/theme';
import { useRef } from 'react';
import useEntrance from '../../hooks/useEntrance';
import { Venue } from '@/features/venue/types/Venue';
import { User } from '@/features/profile/types/User';

const { width: W } = Dimensions.get('window');

const CARD_H = 220;
const THUMB_W = 82;

function usePressScale(to = 0.98) {
    const scale = useRef(new Animated.Value(1)).current;
    const onIn = () =>
        Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 30 }).start();
    const onOut = () =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22 }).start();
    return { scale, onIn, onOut };
}

function getRatingLabel(rating: number) {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Average';
    return 'New';
}

// ── Status badge config ───────────────────────────────────────────────────────
// Add to STATUS_META
const STATUS_META: Record<string, { label: string; icon: string; bg: string; color: string }> = {
    pending: { label: 'Pending Review', icon: 'time-outline', bg: '#FFF7E6', color: '#D97706' },
    approved: {
        label: 'Approved',
        icon: 'checkmark-circle-outline',
        bg: '#ECFDF5',
        color: Colors.success,
    },
    rejected: {
        label: 'Rejected',
        icon: 'close-circle-outline',
        bg: '#FEF2F2',
        color: Colors.danger,
    },
    draft: {
        label: 'Draft',
        icon: 'document-outline',
        bg: Colors.background,
        color: Colors.charcoalLight,
    },
    inactive: {
        label: 'Inactive',
        icon: 'ban-outline',
        bg: '#F3F4F6',
        color: Colors.charcoalLight,
    },
};

interface Props {
    v: Venue;
    index: number;
    role: User['role'];
    onPress: (venue: Venue) => void;
    onBook?: (venue: Venue) => void;
    onDelete?: (venue: Venue) => void;
    onResubmit?: (venue: Venue) => void;
    onDisable?: (venue: Venue) => void;
}

export default function FeaturedCard({
    v,
    index,
    role,
    onPress,
    onBook,
    onDelete,
    onResubmit,
    onDisable,
}: Props) {
    const { fade, slide } = useEntrance(160 + index * 70);
    const { scale, onIn, onOut } = usePressScale();
    const isInactive = v.isActive === false;

    // ── Images ───────────────────────────────────────────────────────────────
    const allImages = v.images ?? [];
    const featured = allImages.find(img => img.isFeatured)?.url ?? allImages[0]?.url ?? null;
    const thumbs = allImages.filter(img => img.url !== featured).slice(0, 3);
    const extraCount = allImages.length - 1 - thumbs.length;

    // ── Price ────────────────────────────────────────────────────────────────
    const price =
        v.pricing?.perHour?.weekday ??
        v.pricing?.halfDay?.weekday ??
        v.pricing?.fullDay?.weekday ??
        null;
    const priceUnit = v.pricing?.enabledOptions?.perHour
        ? '/hr'
        : v.pricing?.enabledOptions?.halfDay
        ? '/half day'
        : '/day';

    // ── Amenities ────────────────────────────────────────────────────────────
    const amenityChips = (v.amenities?.basic ?? [])
        .filter(a => a.available && a.name)
        .slice(0, 2)
        .map(a => a.name!);
    const amenityExtra =
        (v.amenities?.basic?.filter(a => a.available)?.length ?? 0) - amenityChips.length;

    const hasRating = (v.rating ?? 0) > 0;
    const isVerified = v.status === 'approved';
    const location = [v.location?.area, v.location?.city].filter(Boolean).join(', ');

    const isOwner = role === 'owner';
    const status = v.status ?? 'draft';
    const statusMeta = STATUS_META[status] ?? STATUS_META.draft;
    const displayStatusMeta = isInactive ? STATUS_META.inactive : statusMeta;

    // ── Owner action button logic ─────────────────────────────────────────────
    const renderActions = () => {
        if (!isOwner) {
            return (
                <>
                    <TouchableOpacity
                        style={fc.btnOutline}
                        onPress={() => onPress(v)}
                        activeOpacity={0.8}
                    >
                        <Text style={fc.btnOutlineText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={fc.btnBook}
                        onPress={() => onBook?.(v) ?? onPress(v)}
                        activeOpacity={0.85}
                    >
                        <Text style={fc.btnBookText}>Book Now</Text>
                    </TouchableOpacity>
                </>
            );
        }

        // ── Shared owner base buttons (always visible) ──────────────────────────
        const viewBtn = (
            <TouchableOpacity style={fc.btnOutline} onPress={() => onPress(v)} activeOpacity={0.8}>
                <Text style={fc.btnOutlineText}>View</Text>
            </TouchableOpacity>
        );

        const editBtn = (
            <TouchableOpacity
                style={fc.btnEdit}
                onPress={() => onPress(v)} // replace with onEdit?.(v) when wired
                activeOpacity={0.8}
            >
                <Ionicons name="create-outline" size={13} color={Colors.primary} />
                <Text style={fc.btnEditText}>Edit</Text>
            </TouchableOpacity>
        );

        // ── Per-status tertiary icon button ─────────────────────────────────────
        if (status === 'approved') {
            return (
                <>
                    {viewBtn}
                    {editBtn}
                    <TouchableOpacity
                        style={fc.btnIconWarning}
                        onPress={() => onDisable?.(v)} // replace with onDisable?.(v) when wired
                        activeOpacity={0.85}
                    >
                        <Ionicons name="ban-outline" size={15} color="#D97706" />
                    </TouchableOpacity>
                </>
            );
        }

        // In renderActions — rejected branch only
        if (status === 'rejected') {
            return (
                <>
                    {viewBtn}
                    {editBtn}
                    <TouchableOpacity
                        style={fc.btnIconResubmit}
                        onPress={() => onResubmit?.(v)}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="refresh-outline" size={15} color="#D97706" />
                    </TouchableOpacity>
                </>
            );
        }

        // pending / draft / any other → Delete icon button
        return (
            <>
                {viewBtn}
                {editBtn}
                <TouchableOpacity
                    style={fc.btnIconDanger}
                    onPress={() => onDelete?.(v)}
                    activeOpacity={0.85}
                >
                    <Ionicons name="trash-outline" size={15} color={Colors.danger} />
                </TouchableOpacity>
            </>
        );
    };

    return (
        <Animated.View style={[fc.wrapper, { opacity: fade, transform: [{ translateY: slide }] }]}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={() => onPress(v)}
                onPressIn={onIn}
                onPressOut={onOut}
            >
                <Animated.View
                    style={[fc.card, { transform: [{ scale }] }, isInactive && fc.cardInactive, {height: status==='rejected' ? 280 : CARD_H}]}
                >
                    {/* ── Left: Featured image ── */}
                    <View style={fc.featuredWrap}>
                        {featured ? (
                            <Image
                                source={{ uri: featured }}
                                style={fc.featuredImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[fc.featuredImage, fc.imageFallback]}>
                                <Ionicons
                                    name="business-outline"
                                    size={32}
                                    color={Colors.charcoalLight}
                                />
                            </View>
                        )}
                        {isVerified && (
                            <View style={fc.verifiedBadge}>
                                <Ionicons name="shield-checkmark" size={9} color="#fff" />
                            </View>
                        )}

                        {/* Owner-only status badge on image */}
                        {isOwner && (
                            <View style={[fc.statusBadge, { backgroundColor: statusMeta.bg }]}>
                                <Ionicons
                                    name={statusMeta.icon as any}
                                    size={9}
                                    color={statusMeta.color}
                                />
                                <Text style={[fc.statusBadgeText, { color: statusMeta.color }]}>
                                    {statusMeta.label}
                                </Text>
                            </View>
                        )}
                        {isOwner && (
                            <View
                                style={[fc.statusBadge, { backgroundColor: displayStatusMeta.bg }]}
                            >
                                <Ionicons
                                    name={displayStatusMeta.icon as any}
                                    size={9}
                                    color={displayStatusMeta.color}
                                />
                                <Text
                                    style={[fc.statusBadgeText, { color: displayStatusMeta.color }]}
                                >
                                    {displayStatusMeta.label}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* ── Right: Info ── */}
                    <View style={fc.info}>
                        {/* Name */}
                        <Text style={fc.name} numberOfLines={1}>
                            {v.businessName}
                        </Text>

                        {/* Location */}
                        <View style={fc.row}>
                            <Ionicons name="location" size={12} color={Colors.primary} />
                            <Text style={fc.locationText} numberOfLines={1}>
                                {location}
                            </Text>
                        </View>

                        {/* Rating */}
                        <View style={[fc.row, { marginTop: 3 }]}>
                            {hasRating ? (
                                <View style={fc.ratingBadge}>
                                    <Text style={fc.ratingNum}>{v.rating!.toFixed(0)}</Text>
                                    <Ionicons name="star" size={9} color="#fff" />
                                </View>
                            ) : null}
                            {(v.reviewCount ?? 0) > 0 && (
                                <Text style={fc.reviewCount}>({v.reviewCount} Ratings)</Text>
                            )}
                            {hasRating && (
                                <Text style={fc.ratingLabel}>· {getRatingLabel(v.rating!)}</Text>
                            )}
                            {!hasRating && (
                                <View style={fc.newBadge}>
                                    <Text style={fc.newBadgeText}>NEW</Text>
                                </View>
                            )}
                        </View>

                        {/* Capacity + Amenity chips */}
                        <View style={[fc.row, { marginTop: 3, flexWrap: 'wrap', gap: 6 }]}>
                            {v.capacity ? (
                                <View style={fc.chip}>
                                    <Ionicons
                                        name="people-outline"
                                        size={11}
                                        color={Colors.charcoalLight}
                                    />
                                    <Text style={fc.chipText}>{v.capacity}</Text>
                                </View>
                            ) : null}
                            {amenityChips.map(a => (
                                <Text key={a} style={fc.amenityText}>
                                    {a}
                                </Text>
                            ))}
                            {amenityExtra > 0 && (
                                <Text style={fc.amenityMore}>+{amenityExtra} more</Text>
                            )}
                        </View>

                        {/* Divider */}
                        <View style={fc.divider} />

                        {/* Price */}
                        <View style={fc.row}>
                            {price ? (
                                <>
                                    <Text style={fc.priceAmount}>
                                        ₹{price.toLocaleString('en-IN')}
                                    </Text>
                                    <Text style={fc.priceOnwards}> onwards</Text>
                                </>
                            ) : (
                                <Text style={fc.priceNego}>Price on request</Text>
                            )}
                        </View>

                        {/* Rejection reason (owner + rejected only) */}
                        {isOwner && status === 'rejected' && v.rejectionReason && (
                            <View style={fc.rejectionBox}>
                                <View style={fc.rejectionHeader}>
                                    <Ionicons name="alert-circle" size={12} color={Colors.danger} />
                                    <Text style={fc.rejectionTitle}>Rejection reason</Text>
                                </View>
                                <Text style={fc.rejectionText} numberOfLines={2}>
                                    {v.rejectionReason}
                                </Text>
                            </View>
                        )}
                        {/* Coupon tag */}
                        {(v?.activeCouponCount ?? 0) > 0 &&
                            v?.activeCoupons?.length > 0 &&
                            v.activeCoupons.map((c: any, i: any) => (
                                <View key={c.code ?? i} style={fc.couponRow}>
                                    <Ionicons name="pricetag" size={10} color={Colors.success} />
                                    <Text style={fc.couponText}>
                                        {c.code} ·{' '}
                                        {c.discountType === 'percentage'
                                            ? `${c.discountValue}%${
                                                  c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''
                                              }`
                                            : `₹${c.discountValue}`}{' '}
                                        off
                                    </Text>
                                </View>
                            ))}

                        {/* ── Actions ── */}
                        <View style={fc.actions}>{renderActions()}</View>
                    </View>
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const fc = StyleSheet.create({
    wrapper: {
        marginBottom: Spacing.md,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.card,
    },
    cardInactive: { opacity: 0.55 },
    // ── Featured image ───────────────────────────────────────────────────────
    featuredWrap: {
        width: W * 0.32,
        position: 'relative',
    },
    featuredImage: {
        width: '100%',
        height: '100%',
    },
    imageFallback: {
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifiedBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusBadge: {
        position: 'absolute',
        bottom: 8,
        left: 6,
        right: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        paddingHorizontal: 5,
        paddingVertical: 3,
        borderRadius: Radii.sm,
    },
    statusBadgeText: {
        fontSize: 9,
        fontWeight: Typography.bold,
        letterSpacing: 0.2,
    },

    // ── Thumbnails ───────────────────────────────────────────────────────────
    thumbCol: { width: THUMB_W, gap: 2 },
    thumbWrap: { flex: 1, position: 'relative' },
    thumb: { width: '100%', height: '100%' },
    thumbEmpty: { backgroundColor: Colors.background },
    thumbOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.52)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumbOverlayText: { color: '#fff', fontSize: 15, fontWeight: Typography.extraBold },

    // ── Info panel ───────────────────────────────────────────────────────────
    info: {
        flex: 1,
        paddingHorizontal: 10,
        paddingVertical: 10,
        gap: 3,
    },
    name: {
        fontSize: 14,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationText: {
        fontSize: 11.5,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        flex: 1,
    },

    // Rating
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: Colors.success,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: Radii.sm,
    },
    ratingNum: { fontSize: 11, fontWeight: Typography.extraBold, color: '#fff' },
    reviewCount: { fontSize: 11, color: Colors.charcoalLight, fontWeight: Typography.medium },
    ratingLabel: { fontSize: 11, color: Colors.charcoalLight, fontWeight: Typography.medium },
    newBadge: {
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: Radii.sm,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    newBadgeText: {
        fontSize: 9,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
        letterSpacing: 0.5,
    },

    // Capacity / amenity chips
    chip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    chipText: { fontSize: 11, color: Colors.charcoalLight, fontWeight: Typography.medium },
    amenityText: { fontSize: 11, color: Colors.charcoalLight, fontWeight: Typography.medium },
    amenityMore: { fontSize: 11, color: Colors.primary, fontWeight: Typography.bold },

    divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },

    // Price
    priceAmount: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.5,
    },
    priceOnwards: {
        fontSize: 11.5,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        alignSelf: 'flex-end',
        marginBottom: 2,
    },
    priceNego: { fontSize: 13, color: Colors.charcoalLight, fontStyle: 'italic' },

    // Coupon
    couponRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    couponText: { fontSize: 10, color: Colors.success, fontWeight: Typography.semiBold },

    rejectionBox: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: Radii.sm,
        paddingHorizontal: 8,
        paddingVertical: 6,
        marginTop: 2,
        gap: 2,
    },
    rejectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rejectionTitle: {
        fontSize: 10,
        fontWeight: Typography.bold,
        color: Colors.danger,
        letterSpacing: 0.2,
    },
    rejectionCount: {
        fontSize: 9,
        fontWeight: Typography.medium,
        color: Colors.charcoalLight,
        marginLeft: 'auto',
    },
    rejectionText: {
        fontSize: 11,
        color: Colors.charcoal,
        lineHeight: 14,
    },

    // ── Action buttons ───────────────────────────────────────────────────────
    actions: { flexDirection: 'row', gap: 6, marginTop: 4 },

    // Shared outline
    btnOutline: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 7,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    btnOutlineText: { fontSize: 11.5, fontWeight: Typography.bold, color: Colors.charcoal },

    // Book (customer)
    btnBook: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 7,
        borderRadius: Radii.md,
        backgroundColor: Colors.success,
        ...Shadows.card,
    },
    btnBookText: { fontSize: 11.5, fontWeight: Typography.extraBold, color: '#fff' },

    // Delete (owner + pending)
    btnDelete: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 7,
        borderRadius: Radii.md,
        backgroundColor: Colors.danger,
        shadowColor: Colors.danger,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.28,
        shadowRadius: 4,
        elevation: 3,
    },
    btnDeleteText: { fontSize: 11.5, fontWeight: Typography.extraBold, color: '#fff' },

    // Re-submit (owner + rejected)
    btnResubmit: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 7,
        borderRadius: Radii.md,
        backgroundColor: '#D97706',
        shadowColor: '#D97706',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.28,
        shadowRadius: 4,
        elevation: 3,
    },
    btnResubmitText: { fontSize: 11.5, fontWeight: Typography.extraBold, color: '#fff' },

    // Disabled / locked (owner + approved/draft)
    btnDisabled: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 7,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.divider,
        backgroundColor: Colors.background,
    },
    btnDisabledText: {
        fontSize: 11.5,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalLight,
    },
    // Replace / add in fc = StyleSheet.create({ ... })

    // Edit button (owner, always shown)
    btnEdit: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 7,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        backgroundColor: Colors.primaryLight,
    },
    btnEditText: {
        fontSize: 11.5,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },

    // Icon-only danger (trash) — pending / draft
    btnIconDanger: {
        width: 34,
        height: 34,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.dangerLight,
        backgroundColor: Colors.dangerLight,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Icon-only warning (ban/disable) — approved
    btnIconWarning: {
        width: 34,
        height: 34,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: '#FEF3C7',
        backgroundColor: '#FFF7E6',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Icon-only warning (refresh/resubmit) — rejected
    btnIconResubmit: {
        width: 34,
        height: 34,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: '#FEF3C7',
        backgroundColor: '#FFF7E6',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

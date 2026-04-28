import { Colors, Radii, Spacing, Shadows, Typography } from '@/theme/theme';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { VendorService } from '../types/VendorService';
import { CategoryMeta } from '../data/Category';

const fmtPrice = (n?: number) =>
    n ? '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : null;

export function ServiceCard({
    service,
    catMeta,
    onViewProfile,
    onBookNow,
    onGetQuotation,
}: {
    service: VendorService;
    catMeta: CategoryMeta;
    onViewProfile: () => void;
    onBookNow: () => void;
    onGetQuotation: () => void;
}) {
    const isVerified = service.status === 'approved';
    const location = [service.city, service.state].filter(Boolean).join(', ');
    const displayName = service.brandName ?? service.companyName ?? 'Vendor';

    return (
        <View style={sv.card}>
            {/* Image */}
            <View style={sv.imageWrap}>
                {service.featuredImage ? (
                    <Image
                        source={{ uri: service.featuredImage }}
                        style={sv.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[sv.imagePlaceholder, { backgroundColor: catMeta.bg }]}>
                        <Ionicons name={catMeta.icon as any} size={36} color={catMeta.color} />
                    </View>
                )}
                {/* Category badge on image */}
                <View style={[sv.categoryBadge, { backgroundColor: catMeta.color + 'EE' }]}>
                    <Ionicons name={catMeta.icon as any} size={10} color={Colors.white} />
                    <Text style={sv.categoryBadgeText}>{service.category}</Text>
                </View>
            </View>

            {/* Content */}
            <View style={sv.content}>
                {/* Title */}
                <Text style={sv.title} numberOfLines={2}>
                    {service.title}
                </Text>

                {/* Location */}
                {location ? (
                    <View style={sv.locationRow}>
                        <Ionicons name="location-outline" size={12} color={Colors.charcoalLight} />
                        <Text style={sv.locationText}>{location}</Text>
                    </View>
                ) : null}

                {/* Verified + company */}
                <View style={sv.verifiedRow}>
                    {isVerified && (
                        <>
                            <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
                            <Text style={sv.verifiedText}>Verified Vendor</Text>
                            {(service.companyName || service.brandName) && (
                                <Text style={sv.verifiedSep}>·</Text>
                            )}
                        </>
                    )}
                    {(service.companyName || service.brandName) && (
                        <Text style={sv.companyText} numberOfLines={1}>
                            {service.brandName ?? service.companyName}
                        </Text>
                    )}
                </View>

                {/* Description */}
                {service.description ? (
                    <Text style={sv.description} numberOfLines={2}>
                        {service.description}
                    </Text>
                ) : null}

                {/* Price */}
                <View style={sv.priceRow}>
                    {service.startingPrice ? (
                        <>
                            <Text style={sv.priceAmount}>{fmtPrice(service.startingPrice)}</Text>
                            <Text style={sv.priceOnwards}> onwards</Text>
                        </>
                    ) : (
                        <Text style={sv.priceNegotiable}>Price on request</Text>
                    )}
                </View>
                {service.startingPrice ? (
                    <Text style={sv.directBooking}>Direct booking available</Text>
                ) : null}

                {/* Action buttons */}
                <View style={sv.actions}>
                    <TouchableOpacity
                        style={sv.btnOutline}
                        onPress={onViewProfile}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="person-outline" size={13} color={Colors.charcoal} />
                        <Text style={sv.btnOutlineText}>View Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={sv.btnPrimary}
                        onPress={onBookNow}
                        activeOpacity={0.85}
                    >
                        <Text style={sv.btnPrimaryText}>Book Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={sv.btnQuote}
                        onPress={onGetQuotation}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="document-text-outline" size={13} color={Colors.white} />
                        <Text style={sv.btnQuoteText}>Get Quotation</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const sv = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        marginBottom: Spacing.lg,
        overflow: 'hidden',
        ...Shadows.card,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    imageWrap: { position: 'relative', width: '100%', height: 180 },
    image: { width: '100%', height: '100%' },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: Radii.full,
    },
    categoryBadgeText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.white },
    content: { padding: Spacing.md, gap: 5 },
    title: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        lineHeight: 22,
    },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    locationText: { fontSize: 11.5, color: Colors.charcoalLight, fontWeight: Typography.medium },
    verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
    verifiedText: { fontSize: 11.5, color: Colors.success, fontWeight: Typography.semiBold },
    verifiedSep: { fontSize: 11.5, color: Colors.charcoalLight },
    companyText: { fontSize: 11.5, color: Colors.charcoalLight, flex: 1 },
    description: { fontSize: 12.5, color: Colors.charcoalMid, lineHeight: 18, marginTop: 2 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
    priceAmount: {
        fontSize: 20,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.5,
    },
    priceOnwards: { fontSize: 12, color: Colors.charcoalLight, fontWeight: Typography.medium },
    priceNegotiable: {
        fontSize: 14,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        fontStyle: 'italic',
    },
    directBooking: { fontSize: 10.5, color: Colors.charcoalLight, marginTop: 1 },
    actions: { flexDirection: 'row', gap: 6, marginTop: Spacing.sm, flexWrap: 'wrap' },
    btnOutline: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    btnOutlineText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.charcoal },
    btnPrimary: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: Radii.md,
        backgroundColor: Colors.success,
        ...Shadows.card,
    },
    btnPrimaryText: { fontSize: 12, fontWeight: Typography.extraBold, color: Colors.white },
    btnQuote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: Radii.md,
        backgroundColor: Colors.primary,
        ...Shadows.primary,
    },
    btnQuoteText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.charcoal },
});

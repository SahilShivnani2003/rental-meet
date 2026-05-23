import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Platform,
    RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Spacing, Colors, Radii, Shadows, Typography } from '@/theme/theme';
import { useGetVendorQuationDownloads } from '../hooks/useVendorQuotaion';
import { useAuthStore } from '@/store/useAuthStore';
import { useGetVenueQuotations } from '../hooks/useVenueQuotations';
import { ServiceQuotationDownload } from '../types/ServiceQuotationDownload';
import { QuotationDownload } from '../types/QuotationDownload';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const fmtDate = (d?: Date | string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

const fmtTime = (d?: Date | string) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

// ─── Normalised shape used by the card ────────────────────────────────────────
// Lets one card component handle both service and venue quotations.
interface NormalisedQuotation {
    _id: string;
    quotationNumber: string;
    action: 'download' | 'print';
    totalAmount: number;
    downloadedAt?: Date | string;

    // Subject (service title or venue name)
    subjectTitle: string;
    subjectMeta: string; // category / sku
    subjectLocation: string; // "City, State"

    // Customer
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    customerCompany?: string; // service: company | venue: eventType
    eventLabel: string; // service: eventName | venue: eventType

    // Booking extras (venue only)
    bookingDate?: string;
    bookingTime?: string;
    bookingDuration?: string;
    bookingType?: string;
    guestCount?: number;
    specialRequirements?: string;

    // Event date (service only)
    eventDate?: Date;

    // Price breakdown
    price: {
        baseOrSubtotal: number;
        cgst?: number; // service
        sgst?: number; // service
        gst?: number; // venue (single GST line)
        amenitiesTotal?: number; // venue
        platformFee?: number;
        platformFeeGST?: number;
        discount?: number;
        couponCode?: string;
        total: number;
    };
}

function normaliseService(q: ServiceQuotationDownload): NormalisedQuotation {
    const p = q.priceSnapshot;
    return {
        _id: q._id ?? '',
        quotationNumber: q.quotationNumber ?? '—',
        action: q.action ?? 'download',
        totalAmount: q.totalAmount ?? 0,
        downloadedAt: q.downloadedAt,
        subjectTitle: q.serviceSnapshot?.title ?? 'Service',
        subjectMeta: q.serviceSnapshot?.category ?? '',
        subjectLocation: [q.serviceSnapshot?.city, q.serviceSnapshot?.state]
            .filter(Boolean)
            .join(', '),
        customerName: q.customerSnapshot?.name ?? 'Unknown Customer',
        customerEmail: q.customerSnapshot?.email,
        customerPhone: q.customerSnapshot?.phone,
        customerCompany: q.customerSnapshot?.company,
        eventLabel: q.customerSnapshot?.eventName ?? '',
        eventDate: q.eventDate,
        price: {
            baseOrSubtotal: p?.subtotal ?? 0,
            cgst: p?.serviceCGST,
            sgst: p?.serviceSGST,
            platformFee: p?.platformFee,
            platformFeeGST: p?.platformFeeGST,
            discount: p?.discount,
            couponCode: p?.couponCode,
            total: p?.total ?? q.totalAmount ?? 0,
        },
    };
}

function normaliseVenue(q: QuotationDownload): NormalisedQuotation {
    const p = q.priceSnapshot;
    return {
        _id: q._id ?? '',
        quotationNumber: q.quotationNumber ?? '—',
        action: q.action ?? 'download',
        totalAmount: q.totalAmount ?? 0,
        downloadedAt: q.downloadedAt,
        subjectTitle: q.venueSnapshot?.businessName ?? 'Venue',
        subjectMeta: q.venueSnapshot?.sku ?? '',
        subjectLocation: [q.venueSnapshot?.city, q.venueSnapshot?.state].filter(Boolean).join(', '),
        customerName: q.customerSnapshot?.name ?? 'Unknown Customer',
        customerEmail: q.customerSnapshot?.email,
        customerPhone: q.customerSnapshot?.phone,
        customerCompany: q.customerSnapshot?.eventType,
        eventLabel: q.customerSnapshot?.eventType ?? '',
        bookingDate: q.bookingSnapshot?.date,
        bookingTime: [q.bookingSnapshot?.startTime, q.bookingSnapshot?.endTime]
            .filter(Boolean)
            .join(' – '),
        bookingDuration: q.bookingSnapshot?.duration,
        bookingType: q.bookingSnapshot?.bookingType,
        guestCount: q.customerSnapshot?.guestCount,
        specialRequirements: q.customerSnapshot?.specialRequirements,
        price: {
            baseOrSubtotal: p?.basePrice ?? p?.subtotal ?? 0,
            gst: p?.gst,
            amenitiesTotal: p?.amenitiesTotal,
            platformFee: p?.platformFee,
            platformFeeGST: p?.platformFeeGST,
            discount: p?.discount,
            total: p?.grandTotal ?? q.totalAmount ?? 0,
        },
    };
}

// ─── Expandable Quotation Card ─────────────────────────────────────────────────
type QuotationCardProps = {
    quotation: NormalisedQuotation;
    index: number;
    isVenue: boolean;
    onDownload: () => void;
    onShare: () => void;
};

function QuotationCard({ quotation: q, index, isVenue, onDownload, onShare }: QuotationCardProps) {
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(20)).current;
    const [expanded, setExpanded] = useState(false);
    const expandAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, {
                toValue: 1,
                delay: 80 + index * 60,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(slide, {
                toValue: 0,
                delay: 80 + index * 60,
                speed: 16,
                bounciness: 5,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const toggleExpand = () => {
        const toValue = expanded ? 0 : 1;
        Animated.spring(expandAnim, {
            toValue,
            speed: 18,
            bounciness: 4,
            useNativeDriver: false,
        }).start();
        setExpanded(v => !v);
    };

    const isDownload = q.action === 'download';

    return (
        <Animated.View style={[s.card, { opacity: fade, transform: [{ translateY: slide }] }]}>
            <View style={[s.cardAccent, isDownload ? s.cardAccentDownload : s.cardAccentPrint]} />

            <TouchableOpacity onPress={toggleExpand} activeOpacity={0.85}>
                <View style={s.cardMain}>
                    {/* Icon */}
                    <View
                        style={[
                            s.actionIcon,
                            isDownload ? s.actionIconDownload : s.actionIconPrint,
                        ]}
                    >
                        <Ionicons
                            name={isDownload ? 'cloud-download-outline' : 'print-outline'}
                            size={20}
                            color={isDownload ? Colors.info : Colors.charcoalMid}
                        />
                    </View>

                    {/* Info */}
                    <View style={s.cardInfo}>
                        <View style={s.cardTopRow}>
                            <Text style={s.quotationNumber}>{q.quotationNumber}</Text>
                            <View
                                style={[
                                    s.actionBadge,
                                    isDownload ? s.actionBadgeDownload : s.actionBadgePrint,
                                ]}
                            >
                                <Text
                                    style={[
                                        s.actionBadgeText,
                                        isDownload
                                            ? s.actionBadgeTextDownload
                                            : s.actionBadgeTextPrint,
                                    ]}
                                >
                                    {isDownload ? 'Downloaded' : 'Printed'}
                                </Text>
                            </View>
                        </View>

                        <Text style={s.customerName} numberOfLines={1}>
                            {q.customerName}
                        </Text>

                        {/* Service title or venue name */}
                        <View style={s.cardMetaItem}>
                            <Ionicons
                                name={isVenue ? 'business-outline' : 'briefcase-outline'}
                                size={11}
                                color={Colors.primary}
                            />
                            <Text style={s.eventName} numberOfLines={1}>
                                {q.subjectTitle}
                                {q.eventLabel ? ` · ${q.eventLabel}` : ''}
                            </Text>
                        </View>

                        <View style={s.cardMetaRow}>
                            <View style={s.cardMetaItem}>
                                <Ionicons
                                    name="calendar-outline"
                                    size={11}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.cardMetaText}>{fmtDate(q.downloadedAt)}</Text>
                            </View>
                            <View style={s.metaDot} />
                            <View style={s.cardMetaItem}>
                                <Ionicons
                                    name="time-outline"
                                    size={11}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.cardMetaText}>{fmtTime(q.downloadedAt)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Amount + chevron */}
                    <View style={s.cardRight}>
                        <Text style={s.totalAmount}>{fmtCurrency(q.totalAmount)}</Text>
                        <Animated.View
                            style={{
                                transform: [
                                    {
                                        rotate: expandAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0deg', '180deg'],
                                        }),
                                    },
                                ],
                                marginTop: 6,
                            }}
                        >
                            <Ionicons name="chevron-down" size={16} color={Colors.charcoalLight} />
                        </Animated.View>
                    </View>
                </View>
            </TouchableOpacity>

            {/* ── Expanded details ── */}
            {expanded && (
                <View style={s.expandedWrap}>
                    <View style={s.expandedDivider} />

                    {/* Subject (service / venue) */}
                    <View style={s.expandSection}>
                        <Text style={s.expandSectionTitle}>
                            {isVenue ? 'VENUE DETAILS' : 'SERVICE DETAILS'}
                        </Text>
                        <View style={s.expandRow}>
                            <Ionicons
                                name={isVenue ? 'business-outline' : 'briefcase-outline'}
                                size={13}
                                color={Colors.primary}
                            />
                            <Text style={s.expandRowText}>{q.subjectTitle}</Text>
                        </View>
                        {!!q.subjectMeta && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="pricetag-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>{q.subjectMeta}</Text>
                            </View>
                        )}
                        {!!q.subjectLocation && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="location-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>{q.subjectLocation}</Text>
                            </View>
                        )}

                        {/* Venue: booking details */}
                        {isVenue && q.bookingDate && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="calendar-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>
                                    Booking: {fmtDate(q.bookingDate)}
                                    {q.bookingTime ? `  ${q.bookingTime}` : ''}
                                </Text>
                            </View>
                        )}
                        {isVenue && q.bookingType && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="layers-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>
                                    {q.bookingType}
                                    {q.bookingDuration ? ` · ${q.bookingDuration}` : ''}
                                </Text>
                            </View>
                        )}
                        {isVenue && (q.guestCount ?? 0) > 0 && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="people-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>{q.guestCount} Guests</Text>
                            </View>
                        )}

                        {/* Service: event date */}
                        {!isVenue && q.eventDate && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="calendar-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>
                                    Event Date: {fmtDate(q.eventDate)}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Customer info */}
                    <View style={s.expandSection}>
                        <Text style={s.expandSectionTitle}>CUSTOMER INFO</Text>
                        <View style={s.expandRow}>
                            <Ionicons name="person-outline" size={13} color={Colors.primary} />
                            <Text style={s.expandRowText}>{q.customerName}</Text>
                        </View>
                        {!!q.customerPhone && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="call-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>{q.customerPhone}</Text>
                            </View>
                        )}
                        {!!q.customerEmail && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="mail-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>{q.customerEmail}</Text>
                            </View>
                        )}
                        {!!q.customerCompany && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="business-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>{q.customerCompany}</Text>
                            </View>
                        )}
                        {isVenue && !!q.specialRequirements && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="chatbubble-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>{q.specialRequirements}</Text>
                            </View>
                        )}
                    </View>

                    {/* Price breakdown */}
                    <View style={s.priceBreakdown}>
                        <Text style={s.expandSectionTitle}>PRICE BREAKDOWN</Text>

                        <View style={s.priceRow}>
                            <Text style={s.priceLabel}>{isVenue ? 'Base Price' : 'Subtotal'}</Text>
                            <Text style={s.priceValue}>{fmtCurrency(q.price.baseOrSubtotal)}</Text>
                        </View>

                        {/* Venue: amenities */}
                        {isVenue && (q.price.amenitiesTotal ?? 0) > 0 && (
                            <View style={s.priceRow}>
                                <Text style={s.priceLabel}>Amenities</Text>
                                <Text style={s.priceValue}>
                                    {fmtCurrency(q.price.amenitiesTotal!)}
                                </Text>
                            </View>
                        )}

                        {/* Venue: single GST */}
                        {isVenue && (q.price.gst ?? 0) > 0 && (
                            <View style={s.priceRow}>
                                <Text style={s.priceLabel}>GST</Text>
                                <Text style={s.priceValue}>{fmtCurrency(q.price.gst!)}</Text>
                            </View>
                        )}

                        {/* Service: split CGST / SGST */}
                        {!isVenue && (q.price.cgst ?? 0) > 0 && (
                            <View style={s.priceRow}>
                                <Text style={s.priceLabel}>CGST (9%)</Text>
                                <Text style={s.priceValue}>{fmtCurrency(q.price.cgst!)}</Text>
                            </View>
                        )}
                        {!isVenue && (q.price.sgst ?? 0) > 0 && (
                            <View style={s.priceRow}>
                                <Text style={s.priceLabel}>SGST (9%)</Text>
                                <Text style={s.priceValue}>{fmtCurrency(q.price.sgst!)}</Text>
                            </View>
                        )}

                        {(q.price.platformFee ?? 0) > 0 && (
                            <View style={s.priceRow}>
                                <Text style={s.priceLabel}>Platform Fee</Text>
                                <Text style={s.priceValue}>
                                    {fmtCurrency(q.price.platformFee!)}
                                </Text>
                            </View>
                        )}
                        {(q.price.platformFeeGST ?? 0) > 0 && (
                            <View style={s.priceRow}>
                                <Text style={s.priceLabel}>Platform GST</Text>
                                <Text style={s.priceValue}>
                                    {fmtCurrency(q.price.platformFeeGST!)}
                                </Text>
                            </View>
                        )}
                        {(q.price.discount ?? 0) > 0 && (
                            <View style={s.priceRow}>
                                <Text style={[s.priceLabel, { color: Colors.success }]}>
                                    Discount
                                    {q.price.couponCode ? ` (${q.price.couponCode})` : ''}
                                </Text>
                                <Text style={[s.priceValue, { color: Colors.success }]}>
                                    -{fmtCurrency(q.price.discount!)}
                                </Text>
                            </View>
                        )}

                        <View style={s.priceTotalRow}>
                            <Text style={s.priceTotalLabel}>Total</Text>
                            <Text style={s.priceTotalValue}>{fmtCurrency(q.price.total)}</Text>
                        </View>
                    </View>

                    {/* Action buttons */}
                    <View style={s.cardActions}>
                        <TouchableOpacity style={s.shareBtn} onPress={onShare} activeOpacity={0.7}>
                            <Ionicons
                                name="share-social-outline"
                                size={15}
                                color={Colors.primary}
                            />
                            <Text style={s.shareBtnText}>Share</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={s.downloadBtn}
                            onPress={onDownload}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="cloud-download-outline"
                                size={15}
                                color={Colors.surface}
                            />
                            <Text style={s.downloadBtnText}>Re-download</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </Animated.View>
    );
}

// ─── Header Summary ────────────────────────────────────────────────────────────
function HeaderSummary({ quotations }: { quotations: NormalisedQuotation[] }) {
    const downloads = quotations.filter(q => q.action === 'download').length;
    const prints = quotations.filter(q => q.action === 'print').length;
    const totalRevenue = quotations.reduce((acc, q) => acc + q.totalAmount, 0);

    return (
        <View style={s.headerStats}>
            <View style={s.headerStatItem}>
                <Text style={s.headerStatValue}>{quotations.length}</Text>
                <Text style={s.headerStatLabel}>Total</Text>
            </View>
            <View style={s.headerStatDivider} />
            <View style={s.headerStatItem}>
                <Text style={[s.headerStatValue, { color: Colors.info }]}>{downloads}</Text>
                <Text style={s.headerStatLabel}>Downloads</Text>
            </View>
            <View style={s.headerStatDivider} />
            <View style={s.headerStatItem}>
                <Text style={[s.headerStatValue, { color: Colors.charcoalMid }]}>{prints}</Text>
                <Text style={s.headerStatLabel}>Prints</Text>
            </View>
            <View style={s.headerStatDivider} />
            <View style={s.headerStatItem}>
                <Text style={[s.headerStatValue, { color: Colors.primary, fontSize: 16 }]}>
                    {fmtCurrency(totalRevenue)}
                </Text>
                <Text style={s.headerStatLabel}>Total Value</Text>
            </View>
        </View>
    );
}

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function QuotationDownloadsScreen() {
    const { user } = useAuthStore();
    const isVendor = user?.role === 'vendor';
    const isVenue = user?.role === 'owner'; // venue owner

    const [filter, setFilter] = useState<'all' | 'download' | 'print'>('all');

    const headerFade = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-14)).current;

    // ── Service (vendor) quotations ───────────────────────────────────────────
    const {
        data: vendorData,
        isLoading: vendorLoading,
        isRefetching: vendorRefetching,
        refetch: refetchVendor,
    } = useGetVendorQuationDownloads({ enabled: isVendor });

    // ── Venue (owner) quotations ──────────────────────────────────────────────
    const {
        data: venueData,
        isLoading: venueLoading,
        isRefetching: venueRefetching,
        refetch: refetchVenue,
    } = useGetVenueQuotations({ enabled: isVenue });

    // ── Normalise into one array ──────────────────────────────────────────────
    const quotations: NormalisedQuotation[] = useMemo(() => {
        if (isVendor) {
            return (vendorData?.records ?? ([] as ServiceQuotationDownload[])).map(
                normaliseService,
            );
        }
        if (isVenue) {
            return (venueData?.records ?? ([] as QuotationDownload[])).map(normaliseVenue);
        }
        return [];
    }, [isVendor, isVenue, vendorData, venueData]);

    const isLoading = isVendor ? vendorLoading : venueLoading;
    const isRefetching = isVendor ? vendorRefetching : venueRefetching;
    const refetch = isVendor ? refetchVendor : refetchVenue;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerFade, { toValue: 1, duration: 380, useNativeDriver: true }),
            Animated.spring(headerSlide, {
                toValue: 0,
                speed: 16,
                bounciness: 4,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const filtered = useMemo(() => {
        if (filter === 'all') return quotations;
        return quotations.filter(q => q.action === filter);
    }, [filter, quotations]);

    const handleDownload = useCallback((q: NormalisedQuotation) => {
        console.log('Re-download quotation:', q.quotationNumber);
    }, []);

    const handleShare = useCallback((q: NormalisedQuotation) => {
        console.log('Share quotation:', q.quotationNumber);
    }, []);

    const handleRefresh = useCallback(() => refetch(), [refetch]);

    return (
        <View style={s.root}>
            {/* ── Header ── */}
            <Animated.View
                style={[
                    s.header,
                    { opacity: headerFade, transform: [{ translateY: headerSlide }] },
                ]}
            >
                <View style={s.headerAccent} />
                <View style={s.headerContent}>
                    <View>
                        <Text style={s.headerEyebrow}>QUOTATIONS</Text>
                        <Text style={s.headerTitle}>Download History</Text>
                    </View>
                    <TouchableOpacity style={s.headerIconBtn} activeOpacity={0.8}>
                        <Ionicons name="funnel-outline" size={18} color={Colors.charcoal} />
                    </TouchableOpacity>
                </View>

                <HeaderSummary quotations={quotations} />

                {/* Filter tabs */}
                <View style={s.filterRow}>
                    {(['all', 'download', 'print'] as const).map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[s.filterTab, filter === f && s.filterTabActive]}
                            onPress={() => setFilter(f)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={
                                    f === 'all'
                                        ? 'layers-outline'
                                        : f === 'download'
                                        ? 'cloud-download-outline'
                                        : 'print-outline'
                                }
                                size={13}
                                color={filter === f ? Colors.primaryDark : Colors.charcoalMid}
                            />
                            <Text style={[s.filterTabText, filter === f && s.filterTabTextActive]}>
                                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scroll}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={handleRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
            >
                {isLoading ? (
                    // Skeleton placeholder rows while loading
                    Array.from({ length: 4 }).map((_, i) => (
                        <View key={i} style={[s.card, s.skeletonCard]}>
                            <View style={[s.cardAccent, { backgroundColor: Colors.border }]} />
                            <View style={s.skeletonRow}>
                                <View style={s.skeletonIcon} />
                                <View style={{ flex: 1, gap: 8 }}>
                                    <View style={[s.skeletonLine, { width: '60%' }]} />
                                    <View style={[s.skeletonLine, { width: '40%' }]} />
                                    <View style={[s.skeletonLine, { width: '50%' }]} />
                                </View>
                                <View style={s.skeletonAmount} />
                            </View>
                        </View>
                    ))
                ) : filtered.length === 0 ? (
                    <View style={s.emptyWrap}>
                        <View style={s.emptyIconWrap}>
                            <Ionicons
                                name="document-outline"
                                size={36}
                                color={Colors.primaryBorder}
                            />
                        </View>
                        <Text style={s.emptyTitle}>No quotations found</Text>
                        <Text style={s.emptySub}>
                            {filter !== 'all'
                                ? `No ${filter}ed quotations yet.`
                                : 'Quotations will appear here once customers download or print them from their bookings.'}
                        </Text>
                    </View>
                ) : (
                    filtered.map((q, i) => (
                        <QuotationCard
                            key={q._id || i}
                            quotation={q}
                            index={i}
                            isVenue={isVenue}
                            onDownload={() => handleDownload(q)}
                            onShare={() => handleShare(q)}
                        />
                    ))
                )}
                <View style={{ height: 24 }} />
            </ScrollView>
        </View>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },

    // Header
    header: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        paddingBottom: Spacing.lg,
        ...Shadows.header,
    },
    headerAccent: { height: 4, backgroundColor: Colors.primary },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing.xl,
        paddingTop: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg,
        marginBottom: Spacing.lg,
    },
    headerEyebrow: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: Typography.wider,
        marginBottom: 3,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.4,
    },
    headerIconBtn: {
        width: 42,
        height: 42,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    headerStats: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.md,
    },
    headerStatItem: { flex: 1, alignItems: 'center' },
    headerStatValue: {
        fontSize: 22,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.5,
    },
    headerStatLabel: {
        fontSize: 10,
        color: Colors.charcoalLight,
        fontWeight: Typography.semiBold,
        marginTop: 2,
    },
    headerStatDivider: { width: 1, height: 32, backgroundColor: Colors.divider, marginTop: 4 },
    filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.sm },
    filterTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterTabActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryBorder },
    filterTabText: { fontSize: 11, fontWeight: Typography.semiBold, color: Colors.charcoalMid },
    filterTabTextActive: { color: Colors.primaryDark, fontWeight: Typography.bold },

    // Scroll
    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 100 },

    // Card
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        marginBottom: Spacing.md,
        overflow: 'hidden',
        ...Shadows.card,
    },
    cardAccent: { height: 3 },
    cardAccentDownload: { backgroundColor: Colors.info },
    cardAccentPrint: { backgroundColor: Colors.charcoalLight },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    actionIconDownload: { backgroundColor: Colors.infoLight },
    actionIconPrint: { backgroundColor: Colors.background },
    cardInfo: { flex: 1 },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    quotationNumber: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.4,
    },
    actionBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radii.full },
    actionBadgeDownload: { backgroundColor: Colors.infoLight },
    actionBadgePrint: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    actionBadgeText: { fontSize: 9, fontWeight: Typography.bold, letterSpacing: 0.3 },
    actionBadgeTextDownload: { color: Colors.info },
    actionBadgeTextPrint: { color: Colors.charcoalMid },
    customerName: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.2,
        marginBottom: 2,
    },
    eventName: {
        fontSize: 12,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
        marginBottom: Spacing.xs,
        flex: 1,
    },
    cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    cardMetaText: { fontSize: 10, color: Colors.charcoalLight, fontWeight: Typography.medium },
    metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.border },
    cardRight: { alignItems: 'flex-end' },
    totalAmount: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
    },

    // Expanded
    expandedWrap: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
    expandedDivider: { height: 1, backgroundColor: Colors.divider, marginBottom: Spacing.md },
    expandSection: { marginBottom: Spacing.md },
    expandSectionTitle: {
        fontSize: 9,
        fontWeight: Typography.extraBold,
        color: Colors.charcoalLight,
        letterSpacing: Typography.wider,
        marginBottom: Spacing.sm,
    },
    expandRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
    expandRowText: {
        fontSize: 12,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
        flex: 1,
    },

    // Price breakdown
    priceBreakdown: {
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    priceLabel: { fontSize: 12, color: Colors.charcoalMid, fontWeight: Typography.medium },
    priceValue: { fontSize: 12, color: Colors.charcoal, fontWeight: Typography.semiBold },
    priceTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Spacing.sm,
        marginTop: 4,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    priceTotalLabel: {
        fontSize: 13,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
    },
    priceTotalValue: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
        letterSpacing: -0.3,
    },

    // Card actions
    cardActions: { flexDirection: 'row', gap: Spacing.sm },
    shareBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: Colors.primaryLight,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    shareBtnText: { fontSize: 13, fontWeight: Typography.bold, color: Colors.primary },
    downloadBtn: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: Colors.primary,
        ...Shadows.primary,
    },
    downloadBtnText: { fontSize: 13, fontWeight: Typography.bold, color: Colors.surface },

    // Skeleton
    skeletonCard: { opacity: 0.55 },
    skeletonRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    skeletonIcon: {
        width: 44,
        height: 44,
        borderRadius: Radii.md,
        backgroundColor: Colors.border,
    },
    skeletonLine: {
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.border,
    },
    skeletonAmount: {
        width: 60,
        height: 18,
        borderRadius: 6,
        backgroundColor: Colors.border,
    },

    // Empty state
    emptyWrap: {
        alignItems: 'center',
        paddingVertical: Spacing.xxl * 2,
        paddingHorizontal: Spacing.xl,
    },
    emptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.primaryBorder,
        marginBottom: Spacing.lg,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        marginBottom: Spacing.xs,
    },
    emptySub: {
        fontSize: 13,
        color: Colors.charcoalLight,
        textAlign: 'center',
        lineHeight: 19,
    },
});

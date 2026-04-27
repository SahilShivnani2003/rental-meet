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

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface ServiceQuotationDownload {
    _id?: string;
    serviceBooking?: string;
    service?: string;
    vendor?: string;
    customer?: string;
    quotationNumber?: string;
    action?: 'download' | 'print';
    totalAmount?: number;
    serviceSnapshot?: {
        title?: string;
        category?: string;
        companyName?: string;
        city?: string;
        state?: string;
    };
    customerSnapshot?: {
        name?: string;
        email?: string;
        phone?: string;
        company?: string;
        eventName?: string;
    };
    eventDate?: Date;
    priceSnapshot?: {
        subtotal?: number;
        serviceCGST?: number;
        serviceSGST?: number;
        platformFee?: number;
        platformFeeGST?: number;
        discount?: number;
        couponCode?: string;
        total?: number;
    };
    downloadedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

// ─── Static Data ───────────────────────────────────────────────────────────────
const STATIC_QUOTATIONS: ServiceQuotationDownload[] = [
    {
        _id: 'q1',
        serviceBooking: 'bk001',
        service: '1',
        vendor: 'vendor123',
        customer: 'cust001',
        quotationNumber: 'QT-2026-00142',
        action: 'download',
        totalAmount: 42500,
        serviceSnapshot: {
            title: 'Wedding Photography Package',
            category: 'Photography',
            companyName: 'Moments Studio',
            city: 'Itarsi',
            state: 'Madhya Pradesh',
        },
        customerSnapshot: {
            name: 'Rahul Sharma',
            email: 'rahul.sharma@email.com',
            phone: '+91 98765 43210',
            company: 'Sharma Enterprises',
            eventName: 'Rahul & Priya Wedding',
        },
        eventDate: new Date('2026-06-15'),
        priceSnapshot: {
            subtotal: 35000,
            serviceCGST: 3150,
            serviceSGST: 3150,
            platformFee: 500,
            platformFeeGST: 90,
            discount: 1390,
            couponCode: 'SUMMER10',
            total: 42500,
        },
        downloadedAt: new Date('2026-04-25T10:32:00'),
        createdAt: new Date('2026-04-24'),
    },
    {
        _id: 'q2',
        serviceBooking: 'bk002',
        service: '2',
        vendor: 'vendor123',
        customer: 'cust002',
        quotationNumber: 'QT-2026-00138',
        action: 'print',
        totalAmount: 21240,
        serviceSnapshot: {
            title: 'Corporate Event Videography',
            category: 'Videography',
            companyName: 'Moments Studio',
            city: 'Itarsi',
            state: 'Madhya Pradesh',
        },
        customerSnapshot: {
            name: 'Anita Verma',
            email: 'anita.verma@corp.in',
            phone: '+91 91234 56789',
            company: 'TechCorp Solutions',
            eventName: 'Annual Tech Summit 2026',
        },
        eventDate: new Date('2026-05-20'),
        priceSnapshot: {
            subtotal: 18000,
            serviceCGST: 1620,
            serviceSGST: 1620,
            platformFee: 500,
            platformFeeGST: 90,
            discount: 590,
            total: 21240,
        },
        downloadedAt: new Date('2026-04-22T14:15:00'),
        createdAt: new Date('2026-04-21'),
    },
    {
        _id: 'q3',
        serviceBooking: 'bk003',
        service: '1',
        vendor: 'vendor123',
        customer: 'cust003',
        quotationNumber: 'QT-2026-00131',
        action: 'download',
        totalAmount: 38900,
        serviceSnapshot: {
            title: 'Wedding Photography Package',
            category: 'Photography',
            companyName: 'Moments Studio',
            city: 'Itarsi',
            state: 'Madhya Pradesh',
        },
        customerSnapshot: {
            name: 'Vikram Patel',
            email: 'vikram.patel@gmail.com',
            phone: '+91 87654 32109',
            eventName: 'Vikram & Meera Engagement',
        },
        eventDate: new Date('2026-07-08'),
        priceSnapshot: {
            subtotal: 33000,
            serviceCGST: 2970,
            serviceSGST: 2970,
            platformFee: 500,
            platformFeeGST: 90,
            discount: 630,
            total: 38900,
        },
        downloadedAt: new Date('2026-04-18T09:05:00'),
        createdAt: new Date('2026-04-17'),
    },
    {
        _id: 'q4',
        serviceBooking: 'bk004',
        service: '3',
        vendor: 'vendor123',
        customer: 'cust004',
        quotationNumber: 'QT-2026-00124',
        action: 'print',
        totalAmount: 9440,
        serviceSnapshot: {
            title: 'Portrait Photography Session',
            category: 'Photography',
            companyName: 'Moments Studio',
            city: 'Itarsi',
            state: 'Madhya Pradesh',
        },
        customerSnapshot: {
            name: 'Sneha Gupta',
            email: 'sneha.g@outlook.com',
            phone: '+91 76543 21098',
            eventName: 'Professional Headshots',
        },
        eventDate: new Date('2026-05-05'),
        priceSnapshot: {
            subtotal: 8000,
            serviceCGST: 720,
            serviceSGST: 720,
            platformFee: 500,
            platformFeeGST: 90,
            discount: 590,
            total: 9440,
        },
        downloadedAt: new Date('2026-04-10T16:48:00'),
        createdAt: new Date('2026-04-09'),
    },
    {
        _id: 'q5',
        serviceBooking: 'bk005',
        service: '2',
        vendor: 'vendor123',
        customer: 'cust005',
        quotationNumber: 'QT-2026-00115',
        action: 'download',
        totalAmount: 26780,
        serviceSnapshot: {
            title: 'Corporate Event Videography',
            category: 'Videography',
            companyName: 'Moments Studio',
            city: 'Itarsi',
            state: 'Madhya Pradesh',
        },
        customerSnapshot: {
            name: 'Manish Agarwal',
            email: 'm.agarwal@business.com',
            phone: '+91 65432 10987',
            company: 'Agarwal & Sons Ltd.',
            eventName: 'Product Launch Event',
        },
        eventDate: new Date('2026-05-30'),
        priceSnapshot: {
            subtotal: 22500,
            serviceCGST: 2025,
            serviceSGST: 2025,
            platformFee: 500,
            platformFeeGST: 90,
            discount: 360,
            couponCode: 'CORP5',
            total: 26780,
        },
        downloadedAt: new Date('2026-04-02T11:20:00'),
        createdAt: new Date('2026-04-01'),
    },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const fmtDate = (d?: Date) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

const fmtTime = (d?: Date) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

// ─── Expandable Quotation Card ─────────────────────────────────────────────────
type QuotationCardProps = {
    quotation: ServiceQuotationDownload;
    index: number;
    onDownload: () => void;
    onShare: () => void;
};

function QuotationCard({ quotation, index, onDownload, onShare }: QuotationCardProps) {
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
        setExpanded(!expanded);
    };

    const p = quotation.priceSnapshot;
    const isDownload = quotation.action === 'download';

    return (
        <Animated.View style={[s.card, { opacity: fade, transform: [{ translateY: slide }] }]}>
            {/* Top accent strip */}
            <View style={[s.cardAccent, isDownload ? s.cardAccentDownload : s.cardAccentPrint]} />

            <TouchableOpacity onPress={toggleExpand} activeOpacity={0.85}>
                {/* Main row */}
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

                    {/* Middle info */}
                    <View style={s.cardInfo}>
                        <View style={s.cardTopRow}>
                            <Text style={s.quotationNumber}>{quotation.quotationNumber}</Text>
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
                            {quotation.customerSnapshot?.name || 'Unknown Customer'}
                        </Text>
                        <Text style={s.eventName} numberOfLines={1}>
                            {quotation.customerSnapshot?.eventName ||
                                quotation.serviceSnapshot?.title}
                        </Text>
                        <View style={s.cardMetaRow}>
                            <View style={s.cardMetaItem}>
                                <Ionicons
                                    name="calendar-outline"
                                    size={11}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.cardMetaText}>
                                    {fmtDate(quotation.downloadedAt)}
                                </Text>
                            </View>
                            <View style={s.metaDot} />
                            <View style={s.cardMetaItem}>
                                <Ionicons
                                    name="time-outline"
                                    size={11}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.cardMetaText}>
                                    {fmtTime(quotation.downloadedAt)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Amount + chevron */}
                    <View style={s.cardRight}>
                        <Text style={s.totalAmount}>{fmtCurrency(quotation.totalAmount || 0)}</Text>
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

            {/* Expanded details */}
            {expanded && (
                <View style={s.expandedWrap}>
                    <View style={s.expandedDivider} />

                    {/* Service & Event info */}
                    <View style={s.expandSection}>
                        <Text style={s.expandSectionTitle}>SERVICE DETAILS</Text>
                        <View style={s.expandRow}>
                            <Ionicons name="briefcase-outline" size={13} color={Colors.primary} />
                            <Text style={s.expandRowText}>{quotation.serviceSnapshot?.title}</Text>
                        </View>
                        <View style={s.expandRow}>
                            <Ionicons
                                name="pricetag-outline"
                                size={13}
                                color={Colors.charcoalLight}
                            />
                            <Text style={s.expandRowText}>
                                {quotation.serviceSnapshot?.category}
                            </Text>
                        </View>
                        <View style={s.expandRow}>
                            <Ionicons
                                name="location-outline"
                                size={13}
                                color={Colors.charcoalLight}
                            />
                            <Text style={s.expandRowText}>
                                {quotation.serviceSnapshot?.city},{' '}
                                {quotation.serviceSnapshot?.state}
                            </Text>
                        </View>
                        <View style={s.expandRow}>
                            <Ionicons
                                name="calendar-outline"
                                size={13}
                                color={Colors.charcoalLight}
                            />
                            <Text style={s.expandRowText}>
                                Event Date: {fmtDate(quotation.eventDate)}
                            </Text>
                        </View>
                    </View>

                    {/* Customer info */}
                    <View style={s.expandSection}>
                        <Text style={s.expandSectionTitle}>CUSTOMER INFO</Text>
                        <View style={s.expandRow}>
                            <Ionicons name="person-outline" size={13} color={Colors.primary} />
                            <Text style={s.expandRowText}>{quotation.customerSnapshot?.name}</Text>
                        </View>
                        {quotation.customerSnapshot?.phone && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="call-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>
                                    {quotation.customerSnapshot.phone}
                                </Text>
                            </View>
                        )}
                        {quotation.customerSnapshot?.email && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="mail-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>
                                    {quotation.customerSnapshot.email}
                                </Text>
                            </View>
                        )}
                        {quotation.customerSnapshot?.company && (
                            <View style={s.expandRow}>
                                <Ionicons
                                    name="business-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.expandRowText}>
                                    {quotation.customerSnapshot.company}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Price breakdown */}
                    {p && (
                        <View style={s.priceBreakdown}>
                            <Text style={s.expandSectionTitle}>PRICE BREAKDOWN</Text>
                            <View style={s.priceRow}>
                                <Text style={s.priceLabel}>Subtotal</Text>
                                <Text style={s.priceValue}>{fmtCurrency(p.subtotal || 0)}</Text>
                            </View>
                            {(p.serviceCGST || 0) > 0 && (
                                <View style={s.priceRow}>
                                    <Text style={s.priceLabel}>CGST (9%)</Text>
                                    <Text style={s.priceValue}>
                                        {fmtCurrency(p.serviceCGST || 0)}
                                    </Text>
                                </View>
                            )}
                            {(p.serviceSGST || 0) > 0 && (
                                <View style={s.priceRow}>
                                    <Text style={s.priceLabel}>SGST (9%)</Text>
                                    <Text style={s.priceValue}>
                                        {fmtCurrency(p.serviceSGST || 0)}
                                    </Text>
                                </View>
                            )}
                            {(p.platformFee || 0) > 0 && (
                                <View style={s.priceRow}>
                                    <Text style={s.priceLabel}>Platform Fee</Text>
                                    <Text style={s.priceValue}>
                                        {fmtCurrency(p.platformFee || 0)}
                                    </Text>
                                </View>
                            )}
                            {(p.platformFeeGST || 0) > 0 && (
                                <View style={s.priceRow}>
                                    <Text style={s.priceLabel}>Platform GST</Text>
                                    <Text style={s.priceValue}>
                                        {fmtCurrency(p.platformFeeGST || 0)}
                                    </Text>
                                </View>
                            )}
                            {(p.discount || 0) > 0 && (
                                <View style={s.priceRow}>
                                    <Text style={[s.priceLabel, { color: Colors.success }]}>
                                        Discount{p.couponCode ? ` (${p.couponCode})` : ''}
                                    </Text>
                                    <Text style={[s.priceValue, { color: Colors.success }]}>
                                        -{fmtCurrency(p.discount || 0)}
                                    </Text>
                                </View>
                            )}
                            <View style={s.priceTotalRow}>
                                <Text style={s.priceTotalLabel}>Total</Text>
                                <Text style={s.priceTotalValue}>{fmtCurrency(p.total || 0)}</Text>
                            </View>
                        </View>
                    )}

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
function HeaderSummary({ quotations }: { quotations: ServiceQuotationDownload[] }) {
    const downloads = quotations.filter(q => q.action === 'download').length;
    const prints = quotations.filter(q => q.action === 'print').length;
    const totalRevenue = quotations.reduce((acc, q) => acc + (q.totalAmount || 0), 0);

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
    const [filter, setFilter] = useState<'all' | 'download' | 'print'>('all');
    const isRefetching = false;

    const headerFade = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-14)).current;

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

    const quotations: ServiceQuotationDownload[] = STATIC_QUOTATIONS;

    const filtered = useMemo(() => {
        if (filter === 'all') return quotations;
        return quotations.filter(q => q.action === filter);
    }, [filter, quotations]);

    const handleDownload = useCallback((q: ServiceQuotationDownload) => {
        console.log('Re-download quotation:', q.quotationNumber);
    }, []);

    const handleShare = useCallback((q: ServiceQuotationDownload) => {
        console.log('Share quotation:', q.quotationNumber);
    }, []);

    const handleRefresh = useCallback(() => {}, []);

    return (
        <View style={s.root}>
            {/* Header */}
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
                {filtered.length === 0 ? (
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
                            Quotations will appear here once customers download or print them from
                            their bookings.
                        </Text>
                    </View>
                ) : (
                    filtered.map((q, i) => (
                        <QuotationCard
                            key={q._id}
                            quotation={q}
                            index={i}
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

    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
    },
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
    filterTabActive: {
        backgroundColor: Colors.primaryLight,
        borderColor: Colors.primaryBorder,
    },
    filterTabText: {
        fontSize: 11,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    filterTabTextActive: {
        color: Colors.primaryDark,
        fontWeight: Typography.bold,
    },

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
    actionBadge: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: Radii.full,
    },
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

    // Expanded section
    expandedWrap: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
    expandedDivider: {
        height: 1,
        backgroundColor: Colors.divider,
        marginBottom: Spacing.md,
    },
    expandSection: { marginBottom: Spacing.md },
    expandSectionTitle: {
        fontSize: 9,
        fontWeight: Typography.extraBold,
        color: Colors.charcoalLight,
        letterSpacing: Typography.wider,
        marginBottom: Spacing.sm,
    },
    expandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        marginBottom: 5,
    },
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
    priceLabel: {
        fontSize: 12,
        color: Colors.charcoalMid,
        fontWeight: Typography.medium,
    },
    priceValue: {
        fontSize: 12,
        color: Colors.charcoal,
        fontWeight: Typography.semiBold,
    },
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
    cardActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
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
    shareBtnText: {
        fontSize: 13,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },
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
    downloadBtnText: {
        fontSize: 13,
        fontWeight: Typography.bold,
        color: Colors.surface,
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

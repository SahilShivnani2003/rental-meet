import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    Image,
    Share,
    StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radii, Shadows } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import { useAlert } from '@/context/AlertContext';
import { VendorService } from '@/features/otherService/types/VendorService';
import { VendorProfile } from '../types/VendorProfile';
import { useGetVendorProfile } from '../hooks/useVendorService';
import { useAuthStore } from '@/store/useAuthStore';

const { width: W, height: H } = Dimensions.get('window');
const HERO_H = H * 0.38;

const fmtPrice = (n?: number) =>
    n ? '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—';

// ─── Category color map ───────────────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
    Catering: '#E67E22',
    'Makeup & Beauty': '#8E44AD',
    Photography: '#16A085',
    Entertainment: '#2980B9',
    'Decor & Floral': '#27AE60',
    Security: '#C0392B',
    Celebrity: '#F39C12',
    'Logistics & Support': '#17A589',
};

type Tab = 'overview' | 'portfolio' | 'packages' | 'availability';

type Props = NativeStackScreenProps<RootStackParamList, 'vendorDetail'>;

export default function VendorDetailScreen({ navigation, route }: Props) {
    const { service } = route.params as { service: VendorService };
    const { isAuthenticated } = useAuthStore();
    const alert = useAlert();
    const { data: profileData, isLoading } = useGetVendorProfile({
        enabled: isAuthenticated,
    });
    const profile: Partial<VendorProfile> = profileData?.profile ?? {};

    const catColor = CAT_COLOR[service.category] ?? Colors.primary;

    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [imgIndex, setImgIndex] = useState(0);
    const [saved, setSaved] = useState(false);

    const headerFade = useRef(new Animated.Value(0)).current;
    const btnScale = useRef(new Animated.Value(1)).current;
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        StatusBar.setBarStyle('light-content');
        Animated.timing(headerFade, { toValue: 1, duration: 380, useNativeDriver: true }).start();
        return () => StatusBar.setBarStyle('dark-content');
    }, []);

    const handleShare = useCallback(async () => {
        try {
            await Share.share({
                message: `Check out ${service.title} on RentalMeet!\nStarting from ${fmtPrice(
                    service.startingPrice,
                )}`,
            });
        } catch {}
    }, [service]);

    const pressBtnIn = () =>
        Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();
    const pressBtnOut = () =>
        Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 22 }).start();

    // ── Gallery images ────────────────────────────────────────────────────────
    const images: string[] = [
        ...(service.featuredImage ? [service.featuredImage] : []),
        ...(service.images ?? []),
    ].filter(Boolean);

    // ── Tabs ──────────────────────────────────────────────────────────────────
    const TABS: { key: Tab; label: string; icon: string }[] = [
        { key: 'overview', label: 'Overview', icon: 'information-circle-outline' },
        { key: 'portfolio', label: 'Portfolio', icon: 'images-outline' },
        { key: 'packages', label: 'Packages', icon: 'pricetag-outline' },
        { key: 'availability', label: 'Availability', icon: 'calendar-outline' },
    ];

    const handleGetQuotation = () => {
        if (isAuthenticated) {
            navigation.navigate('getServiceQuotation', { service });
        } else {
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
                    {
                        label: 'Cancel',
                        onPress: alert.dismiss,
                        style: 'ghost',
                    },
                ],
            });
        }
    };

    const handleBooking = () => {
        if (isAuthenticated) {
            navigation.navigate('serviceBooking', {
                service,
            });
        } else {
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
                    {
                        label: 'Cancel',
                        onPress: alert.dismiss,
                        style: 'ghost',
                    },
                ],
            });
        }
    };
    // ── Availability helpers ──────────────────────────────────────────────────
    const avail = service.availability ?? profile.availability ?? [];

    return (
        <View style={s.root}>
            {/* ── Animated back button (floats over hero) ── */}
            <Animated.View style={[s.floatBar, { opacity: headerFade }]}>
                <TouchableOpacity style={s.floatBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color={Colors.white} />
                </TouchableOpacity>
                <View style={s.floatRight}>
                    <TouchableOpacity style={s.floatBtn} onPress={handleShare}>
                        <Ionicons name="share-social-outline" size={20} color={Colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.floatBtn} onPress={() => setSaved(p => !p)}>
                        <Ionicons
                            name={saved ? 'heart' : 'heart-outline'}
                            size={20}
                            color={saved ? Colors.danger : Colors.white}
                        />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* ── Hero gallery ── */}
                <View style={s.heroWrap}>
                    {images.length > 0 ? (
                        <Image
                            source={{ uri: images[imgIndex] }}
                            style={s.heroImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View
                            style={[
                                s.heroImage,
                                s.heroPlaceholder,
                                { backgroundColor: catColor + '22' },
                            ]}
                        >
                            <Ionicons name="image-outline" size={52} color={catColor} />
                        </View>
                    )}
                    {/* Dark gradient overlay at bottom */}
                    <View style={s.heroOverlay} />

                    {/* Category + verified badges */}
                    <View style={s.heroBadges}>
                        <View style={[s.catBadge, { backgroundColor: catColor }]}>
                            <Text style={s.catBadgeText}>{service.category}</Text>
                        </View>
                        {service.status === 'approved' && (
                            <View style={s.verifiedBadge}>
                                <Ionicons
                                    name="shield-checkmark"
                                    size={12}
                                    color={Colors.success}
                                />
                                <Text style={s.verifiedBadgeText}>Verified</Text>
                            </View>
                        )}
                    </View>

                    {/* Image dots */}
                    {images.length > 1 && (
                        <View style={s.dotRow}>
                            {images.map((_, i) => (
                                <TouchableOpacity key={i} onPress={() => setImgIndex(i)}>
                                    <View style={[s.dot, i === imgIndex && s.dotActive]} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* ── Identity card ── */}
                <View style={s.identityCard}>
                    <View style={s.identityMain}>
                        {/* Avatar */}
                        <View
                            style={[
                                s.avatar,
                                { backgroundColor: catColor + '22', borderColor: catColor + '55' },
                            ]}
                        >
                            <Text style={[s.avatarText, { color: catColor }]}>
                                {(service.title ?? 'V').slice(0, 2).toUpperCase()}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.vendorTitle} numberOfLines={2}>
                                {service.title}
                            </Text>
                            {(profile.businessInfo?.companyName ||
                                profile.businessInfo?.brandName) && (
                                <Text style={s.companyName}>
                                    {profile.businessInfo?.brandName ??
                                        profile.businessInfo?.companyName}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Meta row */}
                    <View style={s.metaRow}>
                        {(service.city || service.state) && (
                            <View style={s.metaItem}>
                                <Ionicons
                                    name="location-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.metaText}>
                                    {[service.city, service.state].filter(Boolean).join(', ')}
                                </Text>
                            </View>
                        )}
                        {profile.businessInfo?.experienceYears ? (
                            <View style={s.metaItem}>
                                <Ionicons
                                    name="time-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.metaText}>
                                    {profile.businessInfo.experienceYears}+ yrs exp
                                </Text>
                            </View>
                        ) : null}
                        {service.totalBookings ? (
                            <View style={s.metaItem}>
                                <Ionicons
                                    name="calendar-outline"
                                    size={13}
                                    color={Colors.charcoalLight}
                                />
                                <Text style={s.metaText}>{service.totalBookings} bookings</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Tags */}
                    {(service.tags ?? []).length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={s.tagRow}>
                                {(service.tags ?? []).map((t, i) => (
                                    <View key={i} style={s.tag}>
                                        <Text style={s.tagText}>{t}</Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    )}

                    {/* Starting price */}
                    <View
                        style={[
                            s.priceStrip,
                            { backgroundColor: catColor + '12', borderColor: catColor + '30' },
                        ]}
                    >
                        <View>
                            <Text style={s.priceLabel}>Starting from</Text>
                            <Text style={[s.priceValue, { color: catColor }]}>
                                {fmtPrice(service.startingPrice)}
                            </Text>
                        </View>
                        {service.minimumOrderPrice ? (
                            <View>
                                <Text style={s.priceLabel}>Min. order</Text>
                                <Text style={[s.priceValue, { color: Colors.charcoal }]}>
                                    {fmtPrice(service.minimumOrderPrice)}
                                </Text>
                            </View>
                        ) : null}
                        <View style={[s.priceEnquiryBadge, { backgroundColor: catColor }]}>
                            <Ionicons
                                name="chatbubble-ellipses-outline"
                                size={13}
                                color={Colors.white}
                            />
                            <Text style={s.priceEnquiryText}>Get Quote</Text>
                        </View>
                    </View>
                </View>

                {/* ── Tabs ── */}
                <View style={s.tabBar}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[
                                s.tabItem,
                                activeTab === tab.key && {
                                    borderBottomColor: catColor,
                                    borderBottomWidth: 2.5,
                                },
                            ]}
                            onPress={() => setActiveTab(tab.key)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={tab.icon as any}
                                size={15}
                                color={activeTab === tab.key ? catColor : Colors.charcoalLight}
                            />
                            <Text
                                style={[
                                    s.tabLabel,
                                    {
                                        color:
                                            activeTab === tab.key ? catColor : Colors.charcoalLight,
                                    },
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── Tab content ── */}
                <View style={s.tabContent}>
                    {/* OVERVIEW */}
                    {activeTab === 'overview' && (
                        <View style={s.section}>
                            {/* Description */}
                            {service.description || profile.businessInfo?.description ? (
                                <View style={s.infoCard}>
                                    <View style={s.infoCardHeader}>
                                        <Ionicons
                                            name="document-text-outline"
                                            size={16}
                                            color={catColor}
                                        />
                                        <Text style={s.infoCardTitle}>About</Text>
                                    </View>
                                    <Text style={s.bodyText}>
                                        {service.description ?? profile.businessInfo?.description}
                                    </Text>
                                </View>
                            ) : null}

                            {/* Specialization */}
                            {service.specialization ?? profile.businessInfo?.specialization ? (
                                <View style={s.infoCard}>
                                    <View style={s.infoCardHeader}>
                                        <Ionicons name="star-outline" size={16} color={catColor} />
                                        <Text style={s.infoCardTitle}>Specialization</Text>
                                    </View>
                                    <Text style={s.bodyText}>
                                        {service.specialization ??
                                            profile.businessInfo?.specialization}
                                    </Text>
                                </View>
                            ) : null}

                            {/* Serviceable areas */}
                            {(service.serviceableAreas ?? profile.address?.serviceableAreas ?? [])
                                .length > 0 && (
                                <View style={s.infoCard}>
                                    <View style={s.infoCardHeader}>
                                        <Ionicons name="map-outline" size={16} color={catColor} />
                                        <Text style={s.infoCardTitle}>Serviceable Areas</Text>
                                    </View>
                                    <View style={s.areaChipRow}>
                                        {(
                                            service.serviceableAreas ??
                                            profile.address?.serviceableAreas ??
                                            []
                                        ).map((a, i) => (
                                            <View
                                                key={i}
                                                style={[
                                                    s.areaChip,
                                                    {
                                                        backgroundColor: catColor + '14',
                                                        borderColor: catColor + '35',
                                                    },
                                                ]}
                                            >
                                                <Text style={[s.areaChipText, { color: catColor }]}>
                                                    {a}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Contact / online */}
                            {service.website ??
                            profile.online?.website ??
                            service.instagram ??
                            profile.online?.instagram ? (
                                <View style={s.infoCard}>
                                    <View style={s.infoCardHeader}>
                                        <Ionicons name="link-outline" size={16} color={catColor} />
                                        <Text style={s.infoCardTitle}>Online Presence</Text>
                                    </View>
                                    {service.website ?? profile.online?.website ? (
                                        <View style={s.onlineRow}>
                                            <Ionicons
                                                name="globe-outline"
                                                size={14}
                                                color={Colors.info}
                                            />
                                            <Text style={s.onlineLink}>
                                                {service.website ?? profile.online?.website}
                                            </Text>
                                        </View>
                                    ) : null}
                                    {service.instagram ?? profile.online?.instagram ? (
                                        <View style={s.onlineRow}>
                                            <Ionicons
                                                name="logo-instagram"
                                                size={14}
                                                color="#E1306C"
                                            />
                                            <Text style={s.onlineLink}>
                                                {service.instagram ?? profile.online?.instagram}
                                            </Text>
                                        </View>
                                    ) : null}
                                    {service.facebook ?? profile.online?.facebook ? (
                                        <View style={s.onlineRow}>
                                            <Ionicons
                                                name="logo-facebook"
                                                size={14}
                                                color="#1877F2"
                                            />
                                            <Text style={s.onlineLink}>
                                                {service.facebook ?? profile.online?.facebook}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                            ) : null}

                            {/* Booking policy */}
                            {service.advanceBooking ?? profile.bookingPolicy?.advanceBooking ? (
                                <View style={s.infoCard}>
                                    <View style={s.infoCardHeader}>
                                        <Ionicons name="alarm-outline" size={16} color={catColor} />
                                        <Text style={s.infoCardTitle}>Booking Policy</Text>
                                    </View>
                                    <View style={s.policyRow}>
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={14}
                                            color={Colors.success}
                                        />
                                        <Text style={s.policyText}>
                                            Advance booking required:{' '}
                                            <Text
                                                style={{
                                                    fontWeight: Typography.bold,
                                                    color: Colors.charcoal,
                                                }}
                                            >
                                                {service.advanceBooking ??
                                                    profile.bookingPolicy?.advanceBooking}
                                            </Text>
                                        </Text>
                                    </View>
                                </View>
                            ) : null}
                        </View>
                    )}

                    {/* PORTFOLIO */}
                    {activeTab === 'portfolio' && (
                        <View style={s.section}>
                            {images.length === 0 ? (
                                <EmptyTab icon="images-outline" message="No portfolio images yet" />
                            ) : (
                                <View style={s.portfolioGrid}>
                                    {images.map((uri, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            style={s.portfolioThumb}
                                            activeOpacity={0.85}
                                        >
                                            <Image
                                                source={{ uri }}
                                                style={s.portfolioImg}
                                                resizeMode="cover"
                                            />
                                            {i === 0 && (
                                                <View style={s.featuredTag}>
                                                    <Text style={s.featuredTagText}>Featured</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Video links */}
                            {(service.videoLinks ?? profile.portfolio?.videoLinks ?? []).length >
                                0 && (
                                <View style={s.infoCard}>
                                    <View style={s.infoCardHeader}>
                                        <Ionicons
                                            name="videocam-outline"
                                            size={16}
                                            color={catColor}
                                        />
                                        <Text style={s.infoCardTitle}>Video Work</Text>
                                    </View>
                                    {(
                                        service.videoLinks ??
                                        profile.portfolio?.videoLinks ??
                                        []
                                    ).map((link, i) => (
                                        <View key={i} style={s.onlineRow}>
                                            <Ionicons
                                                name="play-circle-outline"
                                                size={14}
                                                color={Colors.info}
                                            />
                                            <Text style={s.onlineLink} numberOfLines={1}>
                                                {link}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* PACKAGES */}
                    {activeTab === 'packages' && (
                        <View style={s.section}>
                            {(service.packages ?? profile.pricing?.packages ?? []).length === 0 ? (
                                <EmptyTab
                                    icon="pricetag-outline"
                                    message="No packages listed yet"
                                />
                            ) : (
                                (service.packages ?? profile.pricing?.packages ?? []).map(
                                    (pkg, i) => (
                                        <View
                                            key={i}
                                            style={[s.pkgCard, { borderLeftColor: catColor }]}
                                        >
                                            <View style={s.pkgHeader}>
                                                <View
                                                    style={[
                                                        s.pkgNum,
                                                        { backgroundColor: catColor },
                                                    ]}
                                                >
                                                    <Text style={s.pkgNumText}>{i + 1}</Text>
                                                </View>
                                                <Text style={s.pkgName}>
                                                    {(pkg as any).name ??
                                                        (pkg as any).serviceName ??
                                                        `Package ${i + 1}`}
                                                </Text>
                                                <Text style={[s.pkgPrice, { color: catColor }]}>
                                                    {fmtPrice(
                                                        (pkg as any).price ?? (pkg as any).rate,
                                                    )}
                                                    {(pkg as any).unit ? (
                                                        <Text style={s.pkgUnit}>
                                                            /{(pkg as any).unit}
                                                        </Text>
                                                    ) : null}
                                                </Text>
                                            </View>
                                            {(pkg as any).quantity ? (
                                                <Text style={s.pkgMeta}>
                                                    Quantity: {(pkg as any).quantity}
                                                </Text>
                                            ) : null}
                                        </View>
                                    ),
                                )
                            )}
                        </View>
                    )}

                    {/* AVAILABILITY */}
                    {activeTab === 'availability' && (
                        <View style={s.section}>
                            {avail.length === 0 ? (
                                <EmptyTab
                                    icon="calendar-outline"
                                    message="Availability not specified"
                                />
                            ) : (
                                <View style={s.infoCard}>
                                    <View style={s.infoCardHeader}>
                                        <Ionicons
                                            name="calendar-outline"
                                            size={16}
                                            color={catColor}
                                        />
                                        <Text style={s.infoCardTitle}>Weekly Schedule</Text>
                                    </View>
                                    {avail.map((av, i) => (
                                        <View key={i} style={s.availRow}>
                                            <Text style={s.availDay}>{av.day ?? '—'}</Text>
                                            {av.isAvailable ? (
                                                <View style={s.availSlot}>
                                                    <Ionicons
                                                        name="checkmark-circle"
                                                        size={13}
                                                        color={Colors.success}
                                                    />
                                                    <Text style={s.availTime}>
                                                        {av.startTime ?? '—'} – {av.endTime ?? '—'}
                                                    </Text>
                                                </View>
                                            ) : (
                                                <View style={s.availSlot}>
                                                    <Ionicons
                                                        name="close-circle"
                                                        size={13}
                                                        color={Colors.danger}
                                                    />
                                                    <Text
                                                        style={[
                                                            s.availTime,
                                                            { color: Colors.danger },
                                                        ]}
                                                    >
                                                        Unavailable
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </View>

                <View style={{ height: 110 }} />
            </ScrollView>

            {/* ── Sticky bottom action bar ── */}
            <View style={s.stickyBar}>
                <TouchableOpacity
                    style={s.quoteBtn}
                    onPress={handleGetQuotation}
                    activeOpacity={0.85}
                >
                    <Ionicons name="document-text-outline" size={16} color={Colors.charcoal} />
                    <Text style={s.quoteBtnText}>Get Quotation</Text>
                </TouchableOpacity>
                <Animated.View style={{ flex: 1, transform: [{ scale: btnScale }] }}>
                    <TouchableOpacity
                        style={[s.bookBtn, { backgroundColor: catColor }]}
                        onPress={handleBooking}
                        onPressIn={pressBtnIn}
                        onPressOut={pressBtnOut}
                        activeOpacity={0.9}
                    >
                        <Ionicons name="calendar" size={16} color={Colors.white} />
                        <Text style={s.bookBtnText}>Book Now</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}

function EmptyTab({ icon, message }: { icon: string; message: string }) {
    return (
        <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
            <Ionicons name={icon as any} size={40} color={Colors.primaryBorder} />
            <Text
                style={{ fontSize: 14, color: Colors.charcoalLight, fontWeight: Typography.medium }}
            >
                {message}
            </Text>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingBottom: 20 },

    floatBar: {
        position: 'absolute',
        top: 44,
        left: 0,
        right: 0,
        zIndex: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
    },
    floatRight: { flexDirection: 'row', gap: Spacing.sm },
    floatBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    heroWrap: { width: W, height: HERO_H, position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        // gradient simulation with bottom-heavy opacity
    },
    heroBadges: { position: 'absolute', bottom: 14, left: 14, flexDirection: 'row', gap: 8 },
    catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.full },
    catBadgeText: { fontSize: 11, fontWeight: Typography.bold, color: Colors.white },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.surface,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Radii.full,
    },
    verifiedBadgeText: { fontSize: 11, fontWeight: Typography.bold, color: Colors.success },
    dotRow: { position: 'absolute', bottom: 14, right: 14, flexDirection: 'row', gap: 5 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
    dotActive: { width: 18, backgroundColor: Colors.white },

    identityCard: {
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.lg,
        marginTop: -24,
        borderRadius: Radii.xxl,
        padding: Spacing.lg,
        gap: Spacing.sm,
        ...Shadows.card,
        zIndex: 5,
    },
    identityMain: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    avatarText: { fontSize: 18, fontWeight: Typography.extraBold },
    vendorTitle: {
        fontSize: 18,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.4,
        lineHeight: 24,
    },
    companyName: { fontSize: 12, color: Colors.charcoalLight, marginTop: 2 },

    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: Colors.charcoalLight, fontWeight: Typography.medium },

    tagRow: { flexDirection: 'row', gap: 6, paddingBottom: 2 },
    tag: {
        backgroundColor: Colors.background,
        borderRadius: Radii.full,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tagText: { fontSize: 10.5, color: Colors.charcoalMid, fontWeight: Typography.semiBold },

    priceStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: Radii.lg,
        padding: Spacing.md,
        borderWidth: 1,
        marginTop: 4,
    },
    priceLabel: { fontSize: 10, color: Colors.charcoalLight, fontWeight: Typography.medium },
    priceValue: { fontSize: 20, fontWeight: Typography.extraBold, letterSpacing: -0.5 },
    priceEnquiryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: Radii.full,
    },
    priceEnquiryText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.white },

    tabBar: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        marginTop: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        gap: 3,
        borderBottomWidth: 2.5,
        borderBottomColor: 'transparent',
    },
    tabLabel: { fontSize: 9.5, fontWeight: Typography.bold },

    tabContent: { paddingHorizontal: Spacing.lg },
    section: { paddingTop: Spacing.lg, gap: Spacing.md },

    infoCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        gap: Spacing.sm,
        ...Shadows.card,
    },
    infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    infoCardTitle: { fontSize: 15, fontWeight: Typography.extraBold, color: Colors.charcoal },
    bodyText: { fontSize: 13.5, color: Colors.charcoalMid, lineHeight: 22 },

    areaChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    areaChip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radii.full,
        borderWidth: 1,
    },
    areaChipText: { fontSize: 12, fontWeight: Typography.semiBold },

    onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
    onlineLink: { fontSize: 13, color: Colors.info, fontWeight: Typography.medium, flex: 1 },

    policyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    policyText: { fontSize: 13, color: Colors.charcoalMid },

    portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    portfolioThumb: {
        width: (W - Spacing.lg * 2 - Spacing.sm) / 2,
        height: 140,
        borderRadius: Radii.lg,
        overflow: 'hidden',
        position: 'relative',
    },
    portfolioImg: { width: '100%', height: '100%' },
    featuredTag: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radii.full,
    },
    featuredTagText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.charcoal },

    pkgCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        borderLeftWidth: 4,
        ...Shadows.card,
        gap: 6,
    },
    pkgHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    pkgNum: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pkgNumText: { fontSize: 12, fontWeight: Typography.extraBold, color: Colors.white },
    pkgName: { flex: 1, fontSize: 14, fontWeight: Typography.bold, color: Colors.charcoal },
    pkgPrice: { fontSize: 16, fontWeight: Typography.extraBold },
    pkgUnit: { fontSize: 11, color: Colors.charcoalLight },
    pkgMeta: { fontSize: 12, color: Colors.charcoalLight, marginLeft: 34 },

    availRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    availDay: { fontSize: 14, fontWeight: Typography.bold, color: Colors.charcoal, width: 90 },
    availSlot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    availTime: { fontSize: 13, color: Colors.charcoalMid },

    stickyBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: Spacing.md,
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        paddingBottom: 28,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        ...Shadows.header,
    },
    quoteBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radii.md,
        paddingVertical: 14,
        backgroundColor: Colors.background,
    },
    quoteBtnText: { fontSize: 14, fontWeight: Typography.bold, color: Colors.charcoal },
    bookBtn: {
        flex: 1.4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        borderRadius: Radii.md,
        paddingVertical: 14,
        ...Shadows.primary,
    },
    bookBtnText: { fontSize: 15, fontWeight: Typography.extraBold, color: Colors.white },
});

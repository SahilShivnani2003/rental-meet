import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
    RefreshControl,
    Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { useAlert } from '@/context/AlertContext';
import { Spacing, Colors, Radii, Shadows, Typography } from '@/theme/theme';
import { VendorTabParamList } from '@/navigations/tabNavigations/VendorTabNavigation';
import { VendorService } from '@/features/otherService/types/VendorService';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';
import { useGetVendorServices } from '../hooks/useVendorService';

const { width: W } = Dimensions.get('window');
// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { color: string; bg: string; label: string; icon: string }> = {
    approved: {
        color: Colors.success,
        bg: Colors.successLight,
        label: 'Approved',
        icon: 'checkmark-circle',
    },
    pending: { color: Colors.warning, bg: Colors.warningLight, label: 'Pending', icon: 'time' },
    rejected: {
        color: Colors.danger,
        bg: Colors.dangerLight,
        label: 'Rejected',
        icon: 'close-circle',
    },
    draft: {
        color: Colors.charcoalLight,
        bg: Colors.border,
        label: 'Draft',
        icon: 'document-outline',
    },
};

const fmtCurrency = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

// ─── Service Card ─────────────────────────────────────────────────────────────
type ServiceCardProps = {
    service: VendorService;
    index: number;
    onPress: () => void;
    onEdit: () => void;
    onToggleActive: () => void;
};

function ServiceCard({ service, index, onPress, onEdit, onToggleActive }: ServiceCardProps) {
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, {
                toValue: 1,
                delay: 100 + index * 60,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(slide, {
                toValue: 0,
                delay: 100 + index * 60,
                speed: 16,
                bounciness: 5,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const st = STATUS_MAP[service.status || 'draft'] ?? STATUS_MAP.draft;

    return (
        <Animated.View
            style={[s.serviceCard, { opacity: fade, transform: [{ translateY: slide }] }]}
        >
            <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
                {/* Image */}
                <View style={s.imageWrap}>
                    {service.featuredImage ? (
                        <Image source={{ uri: service.featuredImage }} style={s.serviceImage} />
                    ) : (
                        <View style={[s.serviceImage, s.imagePlaceholder]}>
                            <Ionicons
                                name="camera-outline"
                                size={32}
                                color={Colors.charcoalLight}
                            />
                        </View>
                    )}
                    {/* Status badge */}
                    <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                        <Ionicons name={st.icon as any} size={11} color={st.color} />
                        <Text style={[s.statusBadgeText, { color: st.color }]}>{st.label}</Text>
                    </View>
                    {/* Active toggle */}
                    <TouchableOpacity
                        style={[s.activeToggle, service.isActive && s.activeToggleOn]}
                        onPress={onToggleActive}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={service.isActive ? 'eye' : 'eye-off'}
                            size={14}
                            color={service.isActive ? Colors.success : Colors.charcoalLight}
                        />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={s.cardContent}>
                    <Text style={s.serviceTitle} numberOfLines={2}>
                        {service.title}
                    </Text>
                    <View style={s.categoryRow}>
                        <View style={s.categoryPill}>
                            <Text style={s.categoryText}>{service.category}</Text>
                        </View>
                        {service.experienceYears && (
                            <Text style={s.expText}>{service.experienceYears}+ yrs exp</Text>
                        )}
                    </View>

                    {service.city && (
                        <View style={s.locationRow}>
                            <Ionicons
                                name="location-outline"
                                size={12}
                                color={Colors.charcoalLight}
                            />
                            <Text style={s.locationText} numberOfLines={1}>
                                {service.area ? `${service.area}, ` : ''}
                                {service.city}
                            </Text>
                        </View>
                    )}

                    {/* Stats row */}
                    <View style={s.statsRow}>
                        <View style={s.statItem}>
                            <Ionicons name="eye-outline" size={13} color={Colors.info} />
                            <Text style={s.statText}>{service.totalEnquiries || 0}</Text>
                        </View>
                        <View style={s.statDivider} />
                        <View style={s.statItem}>
                            <Ionicons name="calendar-outline" size={13} color={Colors.success} />
                            <Text style={s.statText}>{service.totalBookings || 0}</Text>
                        </View>
                        <View style={s.statDivider} />
                        <View style={s.statItem}>
                            <Ionicons name="cash-outline" size={13} color={Colors.primary} />
                            <Text style={s.statText}>
                                {fmtCurrency(service.startingPrice || 0)}
                            </Text>
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={s.cardActions}>
                        <TouchableOpacity style={s.editBtn} onPress={onEdit} activeOpacity={0.7}>
                            <Ionicons name="create-outline" size={16} color={Colors.primary} />
                            <Text style={s.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.viewBtn} onPress={onPress} activeOpacity={0.7}>
                            <Text style={s.viewBtnText}>View Details</Text>
                            <Ionicons name="arrow-forward" size={14} color={Colors.surface} />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Header Stats ─────────────────────────────────────────────────────────────
function HeaderStats({ services }: { services: VendorService[] }) {
    const approved = services.filter(s => s.status === 'approved').length;
    const pending = services.filter(s => s.status === 'pending').length;
    const active = services.filter(s => s.isActive).length;

    return (
        <View style={s.headerStats}>
            <View style={s.headerStatItem}>
                <Text style={s.headerStatValue}>{services.length}</Text>
                <Text style={s.headerStatLabel}>Total</Text>
            </View>
            <View style={s.headerStatDivider} />
            <View style={s.headerStatItem}>
                <Text style={[s.headerStatValue, { color: Colors.success }]}>{approved}</Text>
                <Text style={s.headerStatLabel}>Approved</Text>
            </View>
            <View style={s.headerStatDivider} />
            <View style={s.headerStatItem}>
                <Text style={[s.headerStatValue, { color: Colors.warning }]}>{pending}</Text>
                <Text style={s.headerStatLabel}>Pending</Text>
            </View>
            <View style={s.headerStatDivider} />
            <View style={s.headerStatItem}>
                <Text style={[s.headerStatValue, { color: Colors.info }]}>{active}</Text>
                <Text style={s.headerStatLabel}>Active</Text>
            </View>
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
type Props = NativeBottomTabScreenProps<VendorTabParamList, 'myService'>;

export default function VendorServicesScreen({ navigation }: Props) {
    const alert = useAlert();
    const {data, isLoading, isRefetching, refetch} = useGetVendorServices();
    const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
    const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    const services: VendorService[] = data?.services ?? [];

    const handleRefresh = useCallback(() => {
        refetch();
    }, []);

    // ── Animations ────────────────────────────────────────────────────────────
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

    // ── Filtered services ─────────────────────────────────────────────────────
    const filteredServices = useMemo(() => {
        if (filter === 'all') return services;
        return services.filter(s => s.status === filter);
    }, [services, filter]);

    const handleServicePress = useCallback((service: VendorService) => {
        rootNav.navigate('vendorDetail', {
            service: service
        })
    }, []);

    const handleEditService = useCallback((service: VendorService) => {
        rootNav.navigate('addVendorService')
    }, []);

    const handleToggleActive = useCallback((service: VendorService) => {
        alert.info(
            'Toggle Active',
            `Service "${service.title}" is now ${!service.isActive ? 'active' : 'inactive'}`,
        );
    }, []);

    const handleAddService = useCallback(() => {
        rootNav.navigate('addVendorService')
    }, []);

    // ── Render ────────────────────────────────────────────────────────────────
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
                        <Text style={s.headerEyebrow}>MY SERVICES</Text>
                        <Text style={s.headerTitle}>Manage Your Services</Text>
                    </View>
                    <TouchableOpacity
                        style={s.addBtn}
                        onPress={handleAddService}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="add" size={22} color={Colors.surface} />
                    </TouchableOpacity>
                </View>
                <HeaderStats services={services} />

                {/* Filter tabs */}
                <View style={s.filterRow}>
                    {(['all', 'approved', 'pending'] as const).map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[s.filterTab, filter === f && s.filterTabActive]}
                            onPress={() => setFilter(f)}
                            activeOpacity={0.7}
                        >
                            <Text style={[s.filterTabText, filter === f && s.filterTabTextActive]}>
                                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
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
                {filteredServices.length === 0 ? (
                    <View style={s.emptyWrap}>
                        <View style={s.emptyIconWrap}>
                            <Ionicons
                                name="briefcase-outline"
                                size={36}
                                color={Colors.primaryBorder}
                            />
                        </View>
                        <Text style={s.emptyTitle}>No services yet</Text>
                        <Text style={s.emptySub}>
                            Add your first service to start receiving bookings from clients.
                        </Text>
                        <TouchableOpacity
                            style={s.emptyBtn}
                            onPress={handleAddService}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add-circle" size={18} color={Colors.surface} />
                            <Text style={s.emptyBtnText}>Add Service</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    filteredServices.map((service, i) => (
                        <ServiceCard
                            key={service._id}
                            service={service}
                            index={i}
                            onPress={() => handleServicePress(service)}
                            onEdit={() => handleEditService(service)}
                            onToggleActive={() => handleToggleActive(service)}
                        />
                    ))
                )}

                <View style={{ height: 24 }} />
            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },

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
    addBtn: {
        width: 42,
        height: 42,
        borderRadius: Radii.md,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.primary,
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
        paddingVertical: Spacing.sm,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterTabActive: {
        backgroundColor: Colors.primaryLight,
        borderColor: Colors.primaryBorder,
    },
    filterTabText: {
        fontSize: 12,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
    filterTabTextActive: {
        color: Colors.primaryDark,
        fontWeight: Typography.bold,
    },

    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 100 },

    serviceCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        marginBottom: Spacing.lg,
        overflow: 'hidden',
        ...Shadows.card,
    },
    imageWrap: {
        position: 'relative',
    },
    serviceImage: {
        width: '100%',
        height: 180,
        backgroundColor: Colors.border,
    },
    imagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusBadge: {
        position: 'absolute',
        top: Spacing.md,
        left: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Radii.full,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: Typography.bold,
        letterSpacing: 0.2,
    },
    activeToggle: {
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.md,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    activeToggleOn: {
        backgroundColor: Colors.successLight,
        borderColor: Colors.success,
    },

    cardContent: { padding: Spacing.lg },
    serviceTitle: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        marginBottom: Spacing.sm,
        lineHeight: 21,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    categoryPill: {
        backgroundColor: Colors.infoLight,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radii.full,
        borderWidth: 1,
        borderColor: Colors.info + '30',
    },
    categoryText: {
        fontSize: 10,
        fontWeight: Typography.bold,
        color: Colors.info,
        letterSpacing: 0.3,
    },
    expText: {
        fontSize: 10,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },

    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: Spacing.md,
    },
    locationText: {
        fontSize: 11,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        flex: 1,
    },

    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: Colors.divider,
        marginBottom: Spacing.md,
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        fontWeight: Typography.semiBold,
        color: Colors.charcoal,
    },
    statDivider: {
        width: 1,
        height: 18,
        backgroundColor: Colors.divider,
    },

    cardActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    editBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: Colors.primaryLight,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    editBtnText: {
        fontSize: 13,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },
    viewBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: Colors.primary,
        ...Shadows.primary,
    },
    viewBtnText: {
        fontSize: 13,
        fontWeight: Typography.bold,
        color: Colors.surface,
    },

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
        marginBottom: Spacing.xl,
    },
    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: Colors.primary,
        ...Shadows.primary,
    },
    emptyBtnText: {
        fontSize: 14,
        fontWeight: Typography.bold,
        color: Colors.surface,
    },
});

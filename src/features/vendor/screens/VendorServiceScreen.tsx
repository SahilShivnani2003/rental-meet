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
import {
    useCreateBlockDates,
    useDeletVendorService,
    useGetVendorServices,
    useResubmitVendorService,
    useSubmitVendorService,
    useToggleActiveService,
} from '../hooks/useVendorService';
import ManageAvailabilityModal from '@/features/venue/models/ManageAvailabilityModal';

const { width: W } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { color: string; bg: string; label: string; icon: string }> = {
    approved: {
        color: Colors.success,
        bg: Colors.successLight,
        label: 'Approved',
        icon: 'checkmark-circle',
    },
    pending: {
        color: Colors.warning,
        bg: Colors.warningLight,
        label: 'Pending',
        icon: 'time',
    },
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
    onDelete: () => void;
    onSubmit: () => void;
    onResubmit: () => void;
    onManageAvailability: () => void;
};

function ServiceCard({
    service,
    index,
    onPress,
    onEdit,
    onToggleActive,
    onDelete,
    onSubmit,
    onResubmit,
    onManageAvailability,
}: ServiceCardProps) {
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
    const status = service.status ?? 'draft';

    // ── Status-aware action row ───────────────────────────────────────────────
    const renderActions = () => {
        switch (status) {
            case 'draft':
                return (
                    <>
                        <TouchableOpacity
                            style={s.btnDanger}
                            onPress={onDelete}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                            <Text style={s.btnDangerText}>Delete</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.editBtn} onPress={onEdit} activeOpacity={0.7}>
                            <Ionicons name="create-outline" size={14} color={Colors.primary} />
                            <Text style={s.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.viewBtn} onPress={onSubmit} activeOpacity={0.85}>
                            <Ionicons name="send-outline" size={14} color={Colors.surface} />
                            <Text style={s.viewBtnText}>Submit</Text>
                        </TouchableOpacity>
                    </>
                );

            case 'pending':
                return (
                    <>
                        <TouchableOpacity
                            style={s.btnDanger}
                            onPress={onDelete}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                            <Text style={s.btnDangerText}>Delete</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.viewBtn, s.viewBtnDisabled]}
                            disabled
                            activeOpacity={1}
                        >
                            <Ionicons name="time-outline" size={14} color={Colors.charcoalLight} />
                            <Text style={s.viewBtnDisabledText}>Under Review</Text>
                        </TouchableOpacity>
                    </>
                );

            case 'rejected':
                return (
                    <>
                        <TouchableOpacity style={s.editBtn} onPress={onEdit} activeOpacity={0.7}>
                            <Ionicons name="create-outline" size={14} color={Colors.primary} />
                            <Text style={s.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.viewBtn, { backgroundColor: Colors.warning }]}
                            onPress={onResubmit}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="refresh-outline" size={14} color={Colors.surface} />
                            <Text style={s.viewBtnText}>Re-submit</Text>
                        </TouchableOpacity>
                    </>
                );

            case 'approved':
            default:
                return (
                    <>
                        <TouchableOpacity style={s.editBtn} onPress={onEdit} activeOpacity={0.7}>
                            <Ionicons name="create-outline" size={14} color={Colors.primary} />
                            <Text style={s.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={s.availabilityBtn}
                            onPress={onManageAvailability}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="calendar-outline"
                                size={14}
                                color={Colors.charcoalMid}
                            />
                            <Text style={s.availabilityBtnText}>Availability</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.viewBtn} onPress={onPress} activeOpacity={0.7}>
                            <Text style={s.viewBtnText}>View</Text>
                            <Ionicons name="arrow-forward" size={14} color={Colors.surface} />
                        </TouchableOpacity>
                    </>
                );
        }
    };

    return (
        <Animated.View
            style={[s.serviceCard, { opacity: fade, transform: [{ translateY: slide }] }]}
        >
            <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
                {/* Image */}
                <View style={s.imageWrap}>
                    {service.featuredImage ? (
                        <Image
                            source={{ uri: service.featuredImage }}
                            style={s.serviceImage}
                            resizeMode="cover"
                        />
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

                    {/* Rejection reason pill */}
                    {status === 'rejected' && service.rejectionReason && (
                        <View style={s.rejectionBanner}>
                            <Ionicons name="alert-circle-outline" size={11} color={Colors.danger} />
                            <Text style={s.rejectionText} numberOfLines={1}>
                                {service.rejectionReason}
                            </Text>
                        </View>
                    )}

                    {/* Active toggle — only meaningful when approved */}
                    {status === 'approved' && (
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
                    )}
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
                        {service.experienceYears ? (
                            <Text style={s.expText}>{service.experienceYears}+ yrs exp</Text>
                        ) : null}
                    </View>

                    {service.city ? (
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
                    ) : null}

                    {/* Stats */}
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

                    {/* Status-aware actions */}
                    <View style={s.cardActions}>{renderActions()}</View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Header Stats ─────────────────────────────────────────────────────────────
function HeaderStats({ services }: { services: VendorService[] }) {
    const approved = services.filter(sv => sv.status === 'approved').length;
    const pending = services.filter(sv => sv.status === 'pending').length;
    const active = services.filter(sv => sv.isActive).length;

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
    const { data, isLoading, isRefetching, refetch } = useGetVendorServices();
    const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'draft'>(
        'all',
    );
    const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    const services: VendorService[] = data?.services ?? [];

    const { mutate: deleteService } = useDeletVendorService();
    const { mutate: submitService } = useSubmitVendorService();
    const { mutate: reSubmitService } = useResubmitVendorService();
    const { mutate: toggleActive } = useToggleActiveService();
    const { mutate: createBlockDate } = useCreateBlockDates();

    // ── Availability modal state ───────────────────────────────────────────────
    const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
    const [selectedService, setSelectedService] = useState<VendorService | null>(null);
    const [blockDate, setBlockDate] = useState<Date | null>(null);
    const [reason, setReason] = useState('');

    const handleOpenAvailabilityModal = useCallback((service: VendorService) => {
        setSelectedService(service);
        setBlockDate(null);
        setReason('');
        setAvailabilityModalVisible(true);
    }, []);

    const handleCloseAvailabilityModal = useCallback(() => {
        setAvailabilityModalVisible(false);
        setSelectedService(null);
    }, []);

    // ── Mutations ─────────────────────────────────────────────────────────────
    const handleToggleActive = useCallback(() => {
        if (!selectedService?._id) return;
        toggleActive(selectedService._id, {
            onSuccess: () => {
                alert.success(
                    'Updated',
                    `Service is now ${selectedService.isActive ? 'inactive' : 'active'}`,
                );
                refetch();
                handleCloseAvailabilityModal();
            },
            onError: () => alert.error('Failed', 'Could not update service status'),
        });
    }, [selectedService]);

    const handleCreateBlockDates = useCallback(() => {
        if (!selectedService?._id || !blockDate) return;
        createBlockDate(
            {
                id: selectedService._id,
                payload: { blockedDates: [{ date: blockDate, reason }] },
            },
            {
                onSuccess: () => {
                    alert.success('Blocked', 'Date blocked successfully');
                    setBlockDate(null);
                    setReason('');
                    refetch();
                },
                onError: () => alert.error('Failed', 'Could not block date'),
            },
        );
    }, [selectedService, blockDate, reason]);

    const handleDelete = useCallback((service: VendorService) => {
        if (!service._id) return;

        alert.show({
            type: 'confirm',
            title: 'Delete Service',
            message: `Delete "${service.title}"? This cannot be undone.`,
            buttons: [
                { label: 'cancel', onPress: alert.dismiss, style: 'ghost' },
                {
                    label: 'Delete',
                    onPress: () => {
                        deleteService(service._id!, {
                            onSuccess: () => {
                                alert.success('Deleted', 'Service deleted successfully');
                                refetch();
                            },
                            onError: () => alert.error('Failed', 'Could not delete service'),
                        });
                    },
                    style: 'danger',
                },
            ],
        });
    }, []);

    const handleSubmit = useCallback((service: VendorService) => {
        if (!service._id) return;
        alert.show({
            type: 'confirm',
            title: 'Submit for Review',
            message: `Submit "${service.title}" to the admin for approval?`,
            buttons: [
                { label: 'Cancel', onPress: alert.dismiss, style: 'ghost' },
                {
                    label: 'Submit',
                    onPress: () => {
                        submitService(service._id!, {
                            onSuccess: () => {
                                alert.success('Submitted', 'Service submitted for review');
                                refetch();
                            },
                            onError: () => alert.error('Failed', 'Could not submit service'),
                        });
                    },
                    style: 'primary',
                },
            ],
        });
    }, []);

    const handleResubmit = useCallback((service: VendorService) => {
        if (!service._id) return;
        reSubmitService(service._id, {
            onSuccess: () => {
                alert.success('Re-submitted', 'Service re-submitted for review');
                refetch();
            },
            onError: () => alert.error('Failed', 'Could not re-submit service'),
        });
    }, []);

    const handleRefresh = useCallback(() => refetch(), [refetch]);

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
        return services.filter(sv => sv.status === filter);
    }, [services, filter]);

    // ── Navigation ────────────────────────────────────────────────────────────
    const handleServicePress = useCallback(
        (service: VendorService) => {
            rootNav.navigate('vendorDetail', { service });
        },
        [rootNav],
    );

    const handleEditService = useCallback(
        (service: VendorService) => {
            if (!service?._id) {
                alert.error('Missing', 'Service ID missing');
                return;
            }
            rootNav.navigate('updateVendorService', {
                serviceId: service._id,
                initialData: service,
            });
        },
        [rootNav],
    );

    const handleAddService = useCallback(() => {
        rootNav.navigate('addVendorService');
    }, [rootNav]);

    // ── Render ────────────────────────────────────────────────────────────────
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
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.filterRow}
                >
                    {(['all', 'approved', 'pending', 'rejected', 'draft'] as const).map(f => (
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
                </ScrollView>
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
                    // Skeleton cards
                    Array.from({ length: 3 }).map((_, i) => (
                        <View key={i} style={[s.serviceCard, s.skeletonCard]}>
                            <View style={s.skeletonImage} />
                            <View style={s.skeletonContent}>
                                <View style={[s.skeletonLine, { width: '70%' }]} />
                                <View style={[s.skeletonLine, { width: '45%' }]} />
                                <View style={[s.skeletonLine, { width: '55%' }]} />
                            </View>
                        </View>
                    ))
                ) : filteredServices.length === 0 ? (
                    <View style={s.emptyWrap}>
                        <View style={s.emptyIconWrap}>
                            <Ionicons
                                name="briefcase-outline"
                                size={36}
                                color={Colors.primaryBorder}
                            />
                        </View>
                        <Text style={s.emptyTitle}>
                            {filter === 'all' ? 'No services yet' : `No ${filter} services`}
                        </Text>
                        <Text style={s.emptySub}>
                            {filter === 'all'
                                ? 'Add your first service to start receiving bookings from clients.'
                                : `You have no services with "${filter}" status.`}
                        </Text>
                        {filter === 'all' && (
                            <TouchableOpacity
                                style={s.emptyBtn}
                                onPress={handleAddService}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="add-circle" size={18} color={Colors.surface} />
                                <Text style={s.emptyBtnText}>Add Service</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    filteredServices.map((service, i) => (
                        <ServiceCard
                            key={service._id}
                            service={service}
                            index={i}
                            onPress={() => handleServicePress(service)}
                            onEdit={() => handleEditService(service)}
                            onToggleActive={() => {
                                setSelectedService(service);
                                handleToggleActive();
                            }}
                            onDelete={() => handleDelete(service)}
                            onSubmit={() => handleSubmit(service)}
                            onResubmit={() => handleResubmit(service)}
                            onManageAvailability={() => handleOpenAvailabilityModal(service)}
                        />
                    ))
                )}

                <View style={{ height: 24 }} />
            </ScrollView>

            {/* ── Manage Availability Modal ── */}
            <ManageAvailabilityModal
                visible={availabilityModalVisible}
                onClose={handleCloseAvailabilityModal}
                title="Manage Availability"
                subtitle={selectedService?.title}
                sections={[
                    {
                        icon: selectedService?.isActive
                            ? 'ban-outline'
                            : 'checkmark-circle-outline',
                        title: selectedService?.isActive
                            ? 'Disable Until Re-enabled'
                            : 'Enable Service',
                        subtitle: selectedService?.isActive
                            ? 'Service will be hidden from listings until you manually enable it.'
                            : 'Service will become visible and bookable again.',
                        variant: selectedService?.isActive ? 'danger' : 'primary',
                        action: {
                            ctaLabel: selectedService?.isActive ? 'Disable' : 'Enable',
                            onPress: handleToggleActive,
                        },
                    },
                    {
                        icon: 'calendar-outline',
                        title: 'Block Specific Dates',
                        subtitle: 'Prevent bookings on selected dates',
                        variant: 'info',
                        form: {
                            fields: [
                                {
                                    type: 'date',
                                    placeholder: 'Click to pick date...',
                                    value: blockDate,
                                    onChange: setBlockDate,
                                    minimumDate: new Date(),
                                },
                                {
                                    type: 'text',
                                    placeholder: 'Reason (optional) — e.g. External booking',
                                    value: reason,
                                    onChangeText: setReason,
                                },
                            ],
                            submitLabel: 'Block Selected Date',
                            submitDisabled: !blockDate,
                            onSubmit: handleCreateBlockDates,
                        },
                    },
                ]}
            />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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

    // Filter tabs — horizontal scroll to fit all 5
    filterRow: {
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
        paddingBottom: 2,
    },
    filterTab: {
        paddingHorizontal: Spacing.md,
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
    filterTabText: { fontSize: 12, fontWeight: Typography.semiBold, color: Colors.charcoalMid },
    filterTabTextActive: { color: Colors.primaryDark, fontWeight: Typography.bold },

    // Scroll
    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 100 },

    // Card
    serviceCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.xl,
        marginBottom: Spacing.lg,
        overflow: 'hidden',
        ...Shadows.card,
    },
    imageWrap: { position: 'relative' },
    serviceImage: { width: '100%', height: 180, backgroundColor: Colors.border },
    imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },

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
    statusBadgeText: { fontSize: 10, fontWeight: Typography.bold, letterSpacing: 0.2 },

    rejectionBanner: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.dangerLight + 'EE',
        paddingHorizontal: Spacing.md,
        paddingVertical: 5,
    },
    rejectionText: {
        fontSize: 10,
        color: Colors.danger,
        fontWeight: Typography.semiBold,
        flex: 1,
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
    expText: { fontSize: 10, color: Colors.charcoalLight, fontWeight: Typography.medium },

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
    statText: { fontSize: 12, fontWeight: Typography.semiBold, color: Colors.charcoal },
    statDivider: { width: 1, height: 18, backgroundColor: Colors.divider },

    // Action buttons
    cardActions: { flexDirection: 'row', gap: Spacing.sm },

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
    editBtnText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.primary },

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
    viewBtnText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.surface },

    viewBtnDisabled: {
        backgroundColor: Colors.background,
        shadowOpacity: 0,
        elevation: 0,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    viewBtnDisabledText: {
        fontSize: 12,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalLight,
    },

    btnDanger: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: Colors.dangerLight,
        borderWidth: 1,
        borderColor: Colors.danger + '40',
    },
    btnDangerText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.danger },

    availabilityBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    availabilityBtnText: {
        fontSize: 12,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },

    // Skeleton
    skeletonCard: { opacity: 0.5 },
    skeletonImage: { width: '100%', height: 180, backgroundColor: Colors.border },
    skeletonContent: { padding: Spacing.lg, gap: 10 },
    skeletonLine: { height: 12, borderRadius: 6, backgroundColor: Colors.border },

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
    emptyBtnText: { fontSize: 14, fontWeight: Typography.bold, color: Colors.surface },
});

import { VendorService } from '@/features/otherService/types/VendorService';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/theme/theme';
import { useRef, useEffect } from 'react';
import { Animated, TouchableOpacity, Text, View, Image, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
export type ServiceCardProps = {
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

export default function ServiceCard({
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

const s = StyleSheet.create({
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
});

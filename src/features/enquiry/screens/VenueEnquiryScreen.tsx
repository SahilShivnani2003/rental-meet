import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { useAlert } from '@/context/AlertContext';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/theme/theme';
import { OwnerTabParamList } from '@/navigations/tabNavigations/OwnerTabNavigation';
import { VenueEnquiry } from '../types/VenueEnquiry';
import { useGetEnquiry } from '../hooks/useVenueEnquiry';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/RootStackParamList';

type Props = NativeStackScreenProps<RootStackParamList, 'enquires'>;
type EnquiryFilter = 'all' | 'pending' | 'contacted' | 'converted' | 'cancelled';

const FILTERS: EnquiryFilter[] = ['all', 'pending', 'contacted', 'converted', 'cancelled'];

const STATUS_STYLE: Record<
    Exclude<EnquiryFilter, 'all'>,
    { label: string; color: string; background: string; icon: React.ComponentProps<typeof Ionicons>['name'] }
> = {
    pending: {
        label: 'New',
        color: Colors.warning,
        background: Colors.warningLight,
        icon: 'time-outline',
    },
    contacted: {
        label: 'Contacted',
        color: Colors.info,
        background: Colors.infoLight,
        icon: 'chatbubble-ellipses-outline',
    },
    converted: {
        label: 'Converted',
        color: Colors.success,
        background: Colors.successLight,
        icon: 'checkmark-circle-outline',
    },
    cancelled: {
        label: 'Cancelled',
        color: Colors.danger,
        background: Colors.dangerLight,
        icon: 'close-circle-outline',
    },
};

const getStatus = (enquiry: VenueEnquiry): Exclude<EnquiryFilter, 'all'> =>
    enquiry.status ?? 'pending';

const getEnquiries = (response: unknown): VenueEnquiry[] | null => {
    if (Array.isArray(response)) return response as VenueEnquiry[];
    if (!response || typeof response !== 'object') return null;

    const envelope = response as {
        enquiries?: unknown;
        data?: unknown;
        results?: unknown;
    };
    if (Array.isArray(envelope.enquiries)) return envelope.enquiries as VenueEnquiry[];
    if (Array.isArray(envelope.results)) return envelope.results as VenueEnquiry[];
    if (Array.isArray(envelope.data)) return envelope.data as VenueEnquiry[];
    if (envelope.data && typeof envelope.data === 'object') {
        const nested = envelope.data as { enquiries?: unknown; results?: unknown };
        if (Array.isArray(nested.enquiries)) return nested.enquiries as VenueEnquiry[];
        if (Array.isArray(nested.results)) return nested.results as VenueEnquiry[];
    }
    return null;
};

const formatDate = (value?: string | Date) => {
    if (!value) return 'Date not set';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'Date not set';
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const formatCurrency = (amount?: number) => {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) return null;
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const getVenueName = (venue: VenueEnquiry['venue']) => {
    if (venue && typeof venue === 'object') {
        const populatedVenue = venue as unknown as { businessName?: string; name?: string };
        return populatedVenue.businessName ?? populatedVenue.name ?? 'Venue enquiry';
    }
    return 'Venue enquiry';
};

const getDateValue = (enquiry: VenueEnquiry) =>
    enquiry.bookingDetails.bookingDate ?? enquiry.bookingDetails.date;

function StatusBadge({ status }: { status: Exclude<EnquiryFilter, 'all'> }) {
    const config = STATUS_STYLE[status];
    return (
        <View style={[styles.statusBadge, { backgroundColor: config.background }]}>
            <Ionicons name={config.icon} size={12} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>
    );
}

function EnquiryCard({
    enquiry,
    onPress,
}: {
    enquiry: VenueEnquiry;
    onPress: () => void;
}) {
    const amount = formatCurrency(enquiry.estimatedAmount);
    const guestCount = enquiry.customerDetails.guestCount ?? enquiry.bookingDetails.guests;

    return (
        <TouchableOpacity style={styles.enquiryCard} onPress={onPress} activeOpacity={0.82}>
            <View style={styles.cardTopRow}>
                <View style={styles.customerIcon}>
                    <Ionicons name="person-outline" size={19} color={Colors.primaryDark} />
                </View>
                <View style={styles.customerMain}>
                    <Text style={styles.customerName} numberOfLines={1}>
                        {enquiry.customerDetails.name || 'Guest'}
                    </Text>
                    <Text style={styles.enquiryNumber} numberOfLines={1}>
                        {enquiry.enquiryNumber || `Enquiry ${enquiry._id?.slice(-6) ?? ''}`}
                    </Text>
                </View>
                <StatusBadge status={getStatus(enquiry)} />
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.venueRow}>
                <Ionicons name="business-outline" size={15} color={Colors.charcoalLight} />
                <Text style={styles.venueName} numberOfLines={1}>{getVenueName(enquiry.venue)}</Text>
            </View>

            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.charcoalLight} />
                    <Text style={styles.detailText}>{formatDate(getDateValue(enquiry))}</Text>
                </View>
                {guestCount != null && (
                    <View style={styles.detailItem}>
                        <Ionicons name="people-outline" size={14} color={Colors.charcoalLight} />
                        <Text style={styles.detailText}>{guestCount} guests</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardFooter}>
                <View>
                    <Text style={styles.eventLabel}>{enquiry.customerDetails.eventType || 'Event enquiry'}</Text>
                    {amount && <Text style={styles.amount}>{amount}</Text>}
                </View>
                <View style={styles.viewDetails}>
                    <Text style={styles.viewDetailsText}>Details</Text>
                    <Ionicons name="arrow-forward" size={14} color={Colors.primaryDark} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

function EnquiryDetailsModal({
    enquiry,
    onClose,
}: {
    enquiry: VenueEnquiry | null;
    onClose: () => void;
}) {
    const alert = useAlert();

    const openContact = async (scheme: 'tel' | 'mailto', value?: string) => {
        if (!value) {
            alert.info('Contact unavailable', 'No contact information was provided for this enquiry.');
            return;
        }
        try {
            const url = `${scheme}:${value}`;
            if (!(await Linking.canOpenURL(url))) {
                alert.error('Unable to open contact', 'No supported app is available on this device.');
                return;
            }
            await Linking.openURL(url);
        } catch (error) {
            alert.error(
                'Unable to open contact',
                error instanceof Error ? error.message : 'Please try again.',
            );
        }
    };

    if (!enquiry) return null;

    const details = enquiry.bookingDetails;
    const customer = enquiry.customerDetails;
    const estimatedAmount = formatCurrency(enquiry.estimatedAmount);
    const contactButtons = [
        { label: 'Call', icon: 'call-outline' as const, scheme: 'tel' as const, value: customer.phone },
        { label: 'Email', icon: 'mail-outline' as const, scheme: 'mailto' as const, value: customer.email },
    ];

    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalBackdrop}>
                <TouchableOpacity style={styles.modalDismissArea} onPress={onClose} activeOpacity={1} />
                <View style={styles.modalSheet}>
                    <View style={styles.modalHandle} />
                    <View style={styles.modalHeader}>
                        <View style={styles.modalTitleWrap}>
                            <Text style={styles.modalEyebrow}>ENQUIRY DETAILS</Text>
                            <Text style={styles.modalTitle} numberOfLines={1}>
                                {customer.name || 'Guest'}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel="Close enquiry details">
                            <Ionicons name="close" size={20} color={Colors.charcoalMid} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.modalVenueCard}>
                            <Ionicons name="business-outline" size={18} color={Colors.primaryDark} />
                            <Text style={styles.modalVenueName}>{getVenueName(enquiry.venue)}</Text>
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>Contact information</Text>
                            <DetailRow icon="call-outline" label="Phone" value={customer.phone || 'Not provided'} />
                            <DetailRow icon="mail-outline" label="Email" value={customer.email || 'Not provided'} />
                            {!!customer.company && <DetailRow icon="briefcase-outline" label="Company" value={customer.company} />}
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>Event details</Text>
                            <DetailRow icon="sparkles-outline" label="Event type" value={customer.eventType || details.purpose || details.bookingType || 'Not specified'} />
                            <DetailRow icon="calendar-outline" label="Event date" value={formatDate(getDateValue(enquiry))} />
                            <DetailRow icon="time-outline" label="Timing" value={[details.startTime, details.endTime].filter(Boolean).join(' – ') || details.duration || 'Not specified'} />
                            <DetailRow icon="people-outline" label="Guests" value={String(customer.guestCount ?? details.guests ?? 'Not specified')} />
                            {estimatedAmount && (
                                <DetailRow icon="cash-outline" label="Estimated amount" value={estimatedAmount} />
                            )}
                        </View>

                        {!!(customer.specialRequirements || details.specialRequests) && (
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Special requirements</Text>
                                <Text style={styles.requirementsText}>
                                    {customer.specialRequirements || details.specialRequests}
                                </Text>
                            </View>
                        )}

                        {!!enquiry.notes && (
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Notes</Text>
                                <Text style={styles.requirementsText}>{enquiry.notes}</Text>
                            </View>
                        )}
                    </ScrollView>
                    <View style={styles.contactActions}>
                        {contactButtons.map(button => (
                            <TouchableOpacity
                                key={button.label}
                                style={[styles.contactButton, !button.value && styles.contactButtonDisabled]}
                                onPress={() => void openContact(button.scheme, button.value)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name={button.icon} size={17} color={Colors.white} />
                                <Text style={styles.contactButtonText}>{button.label} guest</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function DetailRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
    return (
        <View style={styles.detailModalRow}>
            <Ionicons name={icon} size={16} color={Colors.charcoalLight} />
            <Text style={styles.detailModalLabel}>{label}</Text>
            <Text style={styles.detailModalValue}>{value}</Text>
        </View>
    );
}

export default function VenueEnquiryScreen({}: Props) {
    const { data, isLoading, isError, error, isRefetching, refetch } = useGetEnquiry();
    const [filter, setFilter] = useState<EnquiryFilter>('all');
    const [search, setSearch] = useState('');
    const [selectedEnquiry, setSelectedEnquiry] = useState<VenueEnquiry | null>(null);

    const enquiries = getEnquiries(data);
    const visibleEnquiries = useMemo(() => {
        if (!enquiries) return [];
        const query = search.trim().toLowerCase();
        return enquiries.filter(enquiry => {
            const matchesFilter = filter === 'all' || getStatus(enquiry) === filter;
            if (!matchesFilter) return false;
            if (!query) return true;
            const searchContent = [
                enquiry.enquiryNumber,
                enquiry.customerDetails.name,
                enquiry.customerDetails.email,
                enquiry.customerDetails.phone,
                enquiry.customerDetails.eventType,
                enquiry.bookingDetails.purpose,
                getVenueName(enquiry.venue),
            ].filter(Boolean).join(' ').toLowerCase();
            return searchContent.includes(query);
        });
    }, [enquiries, filter, search]);

    const counts = useMemo(() => {
        const items = enquiries ?? [];
        return {
            total: items.length,
            pending: items.filter(item => getStatus(item) === 'pending').length,
            contacted: items.filter(item => getStatus(item) === 'contacted').length,
        };
    }, [enquiries]);

    const responseShapeError = !isLoading && !isError && enquiries === null;

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <View style={styles.headerEyebrowRow}>
                    <View style={styles.headerDot} />
                    <Text style={styles.eyebrow}>OWNER INBOX</Text>
                </View>
                <View style={styles.headerTitleRow}>
                    <View style={styles.headerTitleCopy}>
                        <Text style={styles.headerTitle}>Venue enquiries</Text>
                        <Text style={styles.headerSubtitle}>Stay on top of every new event request.</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={() => void refetch()}
                        accessibilityLabel="Refresh enquiries"
                    >
                        <Ionicons name="refresh-outline" size={19} color={Colors.charcoal} />
                    </TouchableOpacity>
                </View>

                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{counts.total}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: Colors.warning }]}>{counts.pending}</Text>
                        <Text style={styles.statLabel}>New</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: Colors.info }]}>{counts.contacted}</Text>
                        <Text style={styles.statLabel}>Contacted</Text>
                    </View>
                </View>

                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={18} color={Colors.charcoalLight} />
                    <TextInput
                        style={styles.searchInput}
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search guests, event, or enquiry ID"
                        placeholderTextColor={Colors.charcoalLight}
                        returnKeyType="search"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {!!search && (
                        <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Clear search">
                            <Ionicons name="close-circle" size={18} color={Colors.charcoalLight} />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterList}
                >
                    {FILTERS.map(item => (
                        <TouchableOpacity
                            key={item}
                            style={[styles.filterPill, filter === item && styles.filterPillActive]}
                            onPress={() => setFilter(item)}
                            activeOpacity={0.75}
                        >
                            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                                {item === 'all' ? 'All' : item.charAt(0).toUpperCase() + item.slice(1)}
                            </Text>
                            {item === 'pending' && counts.pending > 0 && (
                                <View style={[styles.filterCount, filter === item && styles.filterCountActive]}>
                                    <Text style={[styles.filterCountText, filter === item && styles.filterCountTextActive]}>
                                        {counts.pending}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={() => void refetch()}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
            >
                {isLoading ? (
                    <View style={styles.stateBox}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.stateText}>Loading your enquiries…</Text>
                    </View>
                ) : isError ? (
                    <View style={styles.stateBox}>
                        <View style={[styles.stateIcon, styles.errorStateIcon]}>
                            <Ionicons name="cloud-offline-outline" size={28} color={Colors.danger} />
                        </View>
                        <Text style={styles.stateTitle}>Couldn’t load enquiries</Text>
                        <Text style={styles.stateText}>
                            {error instanceof Error ? error.message : 'Check your connection and try again.'}
                        </Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => void refetch()}>
                            <Text style={styles.retryText}>Try again</Text>
                        </TouchableOpacity>
                    </View>
                ) : responseShapeError ? (
                    <View style={styles.stateBox}>
                        <View style={[styles.stateIcon, styles.errorStateIcon]}>
                            <Ionicons name="alert-circle-outline" size={28} color={Colors.danger} />
                        </View>
                        <Text style={styles.stateTitle}>Unexpected enquiry response</Text>
                        <Text style={styles.stateText}>
                            The server response did not include an enquiry list. Refresh or try again later.
                        </Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => void refetch()}>
                            <Text style={styles.retryText}>Try again</Text>
                        </TouchableOpacity>
                    </View>
                ) : visibleEnquiries.length === 0 ? (
                    <View style={styles.stateBox}>
                        <View style={styles.stateIcon}>
                            <Ionicons
                                name={search || filter !== 'all' ? 'search-outline' : 'chatbubbles-outline'}
                                size={30}
                                color={Colors.primaryDark}
                            />
                        </View>
                        <Text style={styles.stateTitle}>
                            {search || filter !== 'all' ? 'No matching enquiries' : 'No enquiries yet'}
                        </Text>
                        <Text style={styles.stateText}>
                            {search || filter !== 'all'
                                ? 'Try another search or status filter.'
                                : 'When guests ask about your venues, their requests will show up here.'}
                        </Text>
                    </View>
                ) : (
                    visibleEnquiries.map(enquiry => (
                        <EnquiryCard
                            key={enquiry._id ?? enquiry.enquiryNumber ?? `${enquiry.customerDetails.email}-${String(getDateValue(enquiry))}`}
                            enquiry={enquiry}
                            onPress={() => setSelectedEnquiry(enquiry)}
                        />
                    ))
                )}
                <View style={styles.bottomSpacer} />
            </ScrollView>
            <EnquiryDetailsModal enquiry={selectedEnquiry} onClose={() => setSelectedEnquiry(null)} />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.background },
    header: {
        backgroundColor: Colors.surface,
        paddingTop: 18,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.sm,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        ...Shadows.card,
    },
    headerEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
    headerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary },
    eyebrow: { fontSize: Typography.xs, fontWeight: Typography.extraBold, letterSpacing: 1.8, color: Colors.primaryDark },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitleCopy: { flex: 1, paddingRight: Spacing.sm },
    headerTitle: { fontSize: 25, lineHeight: 31, fontWeight: Typography.extraBold, color: Colors.charcoal, letterSpacing: -0.5 },
    headerSubtitle: { fontSize: Typography.sm, color: Colors.charcoalLight, marginTop: 2 },
    refreshButton: {
        width: 42,
        height: 42,
        borderRadius: Radii.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: Colors.background,
        borderRadius: Radii.md,
        marginTop: Spacing.md,
        paddingVertical: 12,
    },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { color: Colors.charcoal, fontSize: 19, fontWeight: Typography.extraBold },
    statLabel: { color: Colors.charcoalLight, fontSize: Typography.xs, fontWeight: Typography.bold, marginTop: 2 },
    statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
    searchBox: {
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        marginTop: Spacing.md,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
    },
    searchInput: { flex: 1, paddingVertical: 0, fontSize: Typography.base, color: Colors.charcoal },
    filterList: { gap: Spacing.sm, paddingVertical: Spacing.md },
    filterPill: {
        minHeight: 35,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.full,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterPillActive: { backgroundColor: Colors.charcoal, borderColor: Colors.charcoal },
    filterText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.charcoalMid },
    filterTextActive: { color: Colors.white },
    filterCount: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryLight },
    filterCountActive: { backgroundColor: Colors.primary },
    filterCountText: { fontSize: 9, fontWeight: Typography.extraBold, color: Colors.primaryDark },
    filterCountTextActive: { color: Colors.charcoal },
    list: { flex: 1 },
    listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
    enquiryCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.card,
    },
    cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    customerIcon: { width: 42, height: 42, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryLight },
    customerMain: { flex: 1 },
    customerName: { fontSize: Typography.md, fontWeight: Typography.extraBold, color: Colors.charcoal },
    enquiryNumber: { fontSize: Typography.xs, color: Colors.charcoalLight, marginTop: 3 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: Radii.full },
    statusText: { fontSize: 9, fontWeight: Typography.extraBold },
    cardDivider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.md },
    venueRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: Spacing.sm },
    venueName: { flex: 1, fontSize: Typography.base, color: Colors.charcoalMid, fontWeight: Typography.semiBold },
    detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    detailText: { fontSize: Typography.sm, color: Colors.charcoalLight },
    cardFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: Spacing.md },
    eventLabel: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.charcoal },
    amount: { fontSize: Typography.md, color: Colors.primaryDark, fontWeight: Typography.extraBold, marginTop: 3 },
    viewDetails: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5, paddingLeft: Spacing.sm },
    viewDetailsText: { fontSize: Typography.sm, color: Colors.primaryDark, fontWeight: Typography.bold },
    stateBox: { alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: 44 },
    stateIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryLight, marginBottom: Spacing.md },
    errorStateIcon: { backgroundColor: Colors.dangerLight },
    stateTitle: { color: Colors.charcoal, fontSize: Typography.lg, fontWeight: Typography.extraBold, textAlign: 'center' },
    stateText: { color: Colors.charcoalLight, fontSize: Typography.base, lineHeight: 20, textAlign: 'center', marginTop: Spacing.xs },
    retryButton: { marginTop: Spacing.md, backgroundColor: Colors.primary, borderRadius: Radii.full, paddingVertical: 10, paddingHorizontal: Spacing.xl },
    retryText: { color: Colors.white, fontSize: Typography.base, fontWeight: Typography.bold },
    bottomSpacer: { height: 90 },
    modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(25,22,16,0.48)' },
    modalDismissArea: { flex: 1 },
    modalSheet: {
        maxHeight: '86%',
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xl,
        ...Shadows.floating,
    },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.md },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
    modalTitleWrap: { flex: 1, paddingRight: Spacing.md },
    modalEyebrow: { fontSize: Typography.xs, fontWeight: Typography.extraBold, color: Colors.primaryDark, letterSpacing: 1.4 },
    modalTitle: { fontSize: 22, fontWeight: Typography.extraBold, color: Colors.charcoal, marginTop: 3 },
    closeButton: { width: 38, height: 38, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
    modalVenueCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radii.md, padding: Spacing.md, backgroundColor: Colors.primaryHighLight, marginBottom: Spacing.md },
    modalVenueName: { flex: 1, color: Colors.charcoal, fontWeight: Typography.bold, fontSize: Typography.base },
    modalSection: { paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider },
    modalSectionTitle: { fontSize: Typography.md, fontWeight: Typography.extraBold, color: Colors.charcoal, marginBottom: Spacing.md },
    detailModalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.md },
    detailModalLabel: { width: 104, fontSize: Typography.sm, color: Colors.charcoalLight },
    detailModalValue: { flex: 1, fontSize: Typography.sm, fontWeight: Typography.semiBold, color: Colors.charcoal, lineHeight: 18 },
    requirementsText: { color: Colors.charcoalMid, fontSize: Typography.base, lineHeight: 21 },
    contactActions: { flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.md },
    contactButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 48, borderRadius: Radii.md, backgroundColor: Colors.charcoal },
    contactButtonDisabled: { opacity: 0.48 },
    contactButtonText: { color: Colors.white, fontSize: Typography.base, fontWeight: Typography.bold },
});

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAlert } from '@/context/AlertContext';
import { Colors, Spacing, Typography, Radii, Shadows } from '@/theme/theme';
import { RootStackParamList } from '@/types/RootStackParamList';
import Step3Amenities from '../components/amenities-info';
import Step1BasicInfo from '../components/basic-info';
import Step6Documents from '../components/documents-info';
import Step2Location from '../components/location-info';
import Step5Photos from '../components/photos-upload';
import Step4Pricing from '../components/pricing-info';
import Step7Terms from '../components/terms-info';
import {
    VenueFormData,
    initialVenueFormData,
    CAPACITY_RANGES,
    PARKING_TYPES,
    ADVANCE_OPTIONS,
    ROLES,
    BUSINESS_PROOF_TYPES,
    ACCOUNT_TYPES,
    BasicAmenityForm,
    BeverageForm,
    FoodPackForm,
} from '../types/VenueFormData';
import { useGetVenueById } from '../hooks/useGetVenueById';
import { useUpdateVenue } from '../hooks/useUpdateVenue';
import { Venue } from '../types/Venue';
import { buildVenuePayload } from '../types/BuildVenuePlayload';

const TOTAL_STEPS = 7;
const STEP_LABELS = [
    'Basic Info',
    'Location',
    'Amenities',
    'Pricing',
    'Photos',
    'Documents',
    'Terms',
];

type UpdateVenueProps = NativeStackScreenProps<RootStackParamList, 'updateVenue'>;

// ─── Map Venue API shape → VenueFormData ──────────────────────────────────────
// This is the reverse of buildVenuePayload. It merges API data with default
// seed arrays so every amenity/beverage row always exists in the form.
function venueToFormData(v: Venue, defaults: VenueFormData): VenueFormData {
    // ── Basic ─────────────────────────────────────────────────────────────────
    const basic: VenueFormData['basic'] = {
        businessName: v.businessName ?? '',
        venueTypes: v.venueType ?? [],
        description: v.description ?? '',
        capacity: CAPACITY_RANGES.includes(v.capacity ?? '')
            ? v.capacity ?? CAPACITY_RANGES[0]
            : CAPACITY_RANGES[0],
        areaSqft: v.areaSqft ? String(v.areaSqft) : '',
    };

    // ── Location ──────────────────────────────────────────────────────────────
    const loc = v.location ?? {};
    const rawParking = loc.parkingAvailability === 'None' ? 'No' : loc.parkingAvailability ?? '';
    const location: VenueFormData['location'] = {
        address: loc.address ?? '',
        landmark: loc.landmark ?? '',
        city: loc.city ?? '',
        area: loc.area ?? '',
        state: loc.state ?? '',
        village: loc.village ?? '',
        pincode: loc.pincode ?? '',
        googleMapLink: loc.googleMapLink ?? '',
        parkingAvailability: PARKING_TYPES.includes(rawParking) ? rawParking : PARKING_TYPES[0],
        nearestBusAuto: loc.nearestBusAuto ?? '',
        nearestMetroTrain: loc.nearestMetroTrain ?? '',
    };

    // ── Amenities — merge API state into default seed rows ────────────────────
    const apiBasic = v.amenities?.basic ?? [];
    const basic_amenities: BasicAmenityForm[] = defaults.amenities.basic.map(row => {
        const match = apiBasic.find(a => a.name === row.name);
        if (!match) return row;
        return {
            ...row,
            selected: match.available ?? false,
            type: (match.type as 'Included' | 'Paid') ?? 'Included',
            rate: match.rate ? String(match.rate) : '',
            rateType: (match.rateType as 'Fixed' | 'Per Use') ?? 'Fixed',
        };
    });

    const apiBev = v.amenities?.beverages ?? [];
    const beverages: BeverageForm[] = defaults.amenities.beverages.map(row => {
        const match = apiBev.find(b => b.name === row.name);
        if (!match) return row;
        return {
            ...row,
            selected: match.available ?? false,
            ratePerUnit: match.ratePerUnit ? String(match.ratePerUnit) : '',
            brand: match.brand ?? '',
        };
    });

    const apiFood = v.amenities?.refreshmentFood ?? [];
    const refreshmentFood: FoodPackForm[] = defaults.amenities.refreshmentFood.map(row => {
        const match = apiFood.find(f => f.name === row.name);
        if (!match) return row;
        return {
            ...row,
            selected: match.available ?? false,
            ratePerPlate: match.ratePerPlate ? String(match.ratePerPlate) : '',
            items: match.items ?? '',
        };
    });

    const lunchThalis = (v.amenities?.lunchThalis ?? []).flatMap(t =>
        (t.categories ?? []).map(cat => ({
            thaliType: t.thaliType ?? '',
            category: cat.category ?? '',
            ratePerPlate: cat.ratePerPlate ? String(cat.ratePerPlate) : '',
            items: cat.itemNames ?? '',
        })),
    );

    const apiKitchen = v.amenities?.kitchenAccess;
    const apiDining = v.amenities?.diningArea;
    const apiAdditional = v.amenities?.additional ?? [];

    const additional = defaults.amenities.additional.map(row => {
        const match = apiAdditional.find(a => a.name === row.name);
        if (!match) return row;
        return {
            ...row,
            selected: match.available ?? false,
            type: (match.type as 'Included' | 'Paid') ?? 'Included',
            rate: match.charges ? String(match.charges) : '',
        };
    });

    const amenities: VenueFormData['amenities'] = {
        basic: basic_amenities,
        beverages,
        refreshmentFood,
        lunchThalis,
        kitchenAccess: {
            available: apiKitchen?.available ?? false,
            type: (apiKitchen?.type as 'Included' | 'Paid') ?? 'Included',
            rate: apiKitchen?.charges ? String(apiKitchen.charges) : '',
        },
        diningArea: {
            available: apiDining?.available ?? false,
            type: (apiDining?.type as 'Included' | 'Paid') ?? 'Included',
            rate: apiDining?.charges ? String(apiDining.charges) : '',
        },
        additional,
    };

    // ── Pricing ───────────────────────────────────────────────────────────────
    const p = v.pricing ?? {};
    const avail = v.availability ?? {};
    const rawAdvance = avail.advanceBookingRule ?? '';
    const pricing: VenueFormData['pricing'] = {
        prices: {
            perHour: {
                weekday: p.perHour?.weekday ? String(p.perHour.weekday) : '',
                weekend: p.perHour?.weekend ? String(p.perHour.weekend) : '',
            },
            halfDay: {
                weekday: p.halfDay?.weekday ? String(p.halfDay.weekday) : '',
                weekend: p.halfDay?.weekend ? String(p.halfDay.weekend) : '',
            },
            fullDay: {
                weekday: p.fullDay?.weekday ? String(p.fullDay.weekday) : '',
                weekend: p.fullDay?.weekend ? String(p.fullDay.weekend) : '',
            },
            extraHour: {
                weekday: p.extraHourRate?.weekday ? String(p.extraHourRate.weekday) : '',
                weekend: p.extraHourRate?.weekend ? String(p.extraHourRate.weekend) : '',
            },
        },
        openTime: avail.openingTime ?? '09:00 AM',
        closeTime: avail.closingTime ?? '09:00 PM',
        availDays: (avail.availableDays as string[]) ?? [],
        advanceBooking: ADVANCE_OPTIONS.includes(rawAdvance) ? rawAdvance : ADVANCE_OPTIONS[0],
        blackoutDate: avail.blackoutDates?.[0]?.date
            ? new Date(avail.blackoutDates[0].date).toLocaleDateString('en-IN')
            : '',
    };

    // ── Photos ────────────────────────────────────────────────────────────────
    const photos: VenueFormData['photos'] = {
        uploadedImages: (v.images ?? []).map(img => ({
            url: img.url ?? '',
            publicId: '', // publicId not stored in Venue model
            sectionKey: categoryToSectionKey(img.category),
        })),
    };

    // ── Documents ─────────────────────────────────────────────────────────────
    const owner = v.ownerInfo ?? {};
    const docs = v.documents ?? {};
    const bank = v.bankDetails ?? {};
    const rawRole = owner.role ?? '';
    const documents: VenueFormData['documents'] = {
        fullName: owner.fullName ?? '',
        email: owner.email ?? '',
        mobile: owner.mobile ?? '',
        altMobile: owner.alternatePhone ?? '',
        role: ROLES.includes(rawRole) ? rawRole : ROLES[0],
        hasGST: owner.hasGST ?? false,
        gstNumber: owner.gstNumber ?? '',
        idType: docs.idProof?.type === 'PAN' ? 'pan' : 'aadhaar',
        idNumber: docs.idProof?.number ?? '',
        bizProofType: BUSINESS_PROOF_TYPES.includes(docs.businessProof?.type ?? '')
            ? docs.businessProof?.type ?? BUSINESS_PROOF_TYPES[0]
            : BUSINESS_PROOF_TYPES[0],
        accountHolder: bank.accountHolderName ?? '',
        accountNumber: bank.accountNumber ?? '',
        ifsc: bank.ifscCode ?? '',
        bankName: bank.bankName ?? '',
        branchName: bank.branchName ?? '',
        accountType: ACCOUNT_TYPES.includes(bank.accountType ?? '')
            ? bank.accountType ?? ACCOUNT_TYPES[0]
            : ACCOUNT_TYPES[0],
        // Restore upload display names from stored URLs (show filename portion)
        uploads: {
            ...(docs.idProof?.frontUrl ? { id_front: urlToFilename(docs.idProof.frontUrl) } : {}),
            ...(docs.idProof?.backUrl ? { id_back: urlToFilename(docs.idProof.backUrl) } : {}),
            ...(docs.selfieUrl ? { selfie: urlToFilename(docs.selfieUrl) } : {}),
            ...(docs.businessProof?.documentUrl
                ? { biz_doc: urlToFilename(docs.businessProof.documentUrl) }
                : {}),
            ...(owner.hasGST && docs.businessProof?.documentUrl
                ? { gst_doc: urlToFilename(docs.businessProof.documentUrl) }
                : {}),
        },
        // Restore uploadedDocs so re-uploads can de-duplicate by uploadKey
        uploadedDocs: [
            ...(docs.idProof?.frontUrl
                ? [{ url: docs.idProof.frontUrl, publicId: '', uploadKey: 'id_front' }]
                : []),
            ...(docs.idProof?.backUrl
                ? [{ url: docs.idProof.backUrl, publicId: '', uploadKey: 'id_back' }]
                : []),
            ...(docs.selfieUrl ? [{ url: docs.selfieUrl, publicId: '', uploadKey: 'selfie' }] : []),
            ...(docs.businessProof?.documentUrl
                ? [{ url: docs.businessProof.documentUrl, publicId: '', uploadKey: 'biz_doc' }]
                : []),
        ],
    };

    // ── Terms ─────────────────────────────────────────────────────────────────
    const terms: VenueFormData['terms'] = {
        agreed: v.termsAccepted ?? false,
        confirmationHours: (avail.confirmationHours as 1 | 2 | 3) ?? 2,
    };

    return { basic, location, amenities, pricing, photos, documents, terms };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function categoryToSectionKey(cat: string | undefined): string {
    const map: Record<string, string> = {
        Featured: 'featured',
        Exterior: 'exterior',
        Interior: 'interior',
        Amenities: 'amenities',
        Additional: 'additional',
    };
    return map[cat ?? ''] ?? 'additional';
}

function urlToFilename(url: string): string {
    try {
        return decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? 'file');
    } catch {
        return 'file';
    }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function UpdateVenueScreen({ navigation, route }: UpdateVenueProps) {
    const alert = useAlert();
    const venueId = route?.params?.venueId;

    const { data: venueData, isLoading } = useGetVenueById(venueId);
    // FIX: use mutateAsync so we can await the result and check response inline
    const { mutateAsync: updateVenueAsync, isPending } = useUpdateVenue();

    const [step, setStep] = useState(1);
    const [successModal, setSuccessModal] = useState(false);
    const [form, setForm] = useState<VenueFormData>(initialVenueFormData);
    // FIX: tracks whether the form has been hydrated from API data (prevents
    // the form briefly showing blank values while isLoading is still true)
    const [hydrated, setHydrated] = useState(false);

    // ── Hydrate form once venue data arrives ──────────────────────────────────
    useEffect(() => {
        if (venueData?.venue && !hydrated) {
            setForm(venueToFormData(venueData.venue, initialVenueFormData));
            setHydrated(true);
        }
    }, [venueData, hydrated]);

    const patchForm = <K extends keyof VenueFormData>(key: K, value: VenueFormData[K]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const goNext = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
    const goPrev = () => setStep(s => Math.max(s - 1, 1));

    // ── Submit update ─────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!venueId) {
            console.warn('No venueId — cannot update');
            return;
        }
        try {
            const payload = buildVenuePayload(form);
            const response = await updateVenueAsync({ id: venueId, data: payload });
            if (!response?.success) {
                alert.error?.('Failed', response?.message ?? 'Something went wrong');
                return;
            }
            setSuccessModal(true);
        } catch (error: any) {
            console.error('VENUE UPDATE ERROR:', error);
            alert.error?.('Failed', error?.message ?? 'Something went wrong');
        }
    };

    // ── Step renderer ─────────────────────────────────────────────────────────
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <Step1BasicInfo
                        data={form.basic}
                        onChange={v => patchForm('basic', v)}
                        onNext={goNext}
                    />
                );
            case 2:
                return (
                    <Step2Location
                        data={form.location}
                        onChange={v => patchForm('location', v)}
                        onPrev={goPrev}
                        onNext={goNext}
                    />
                );
            case 3:
                return (
                    <Step3Amenities
                        data={form.amenities}
                        onChange={v => patchForm('amenities', v)}
                        onPrev={goPrev}
                        onNext={goNext}
                    />
                );
            case 4:
                return (
                    <Step4Pricing
                        data={form.pricing}
                        onChange={v => patchForm('pricing', v)}
                        onPrev={goPrev}
                        onNext={goNext}
                    />
                );
            case 5:
                return (
                    <Step5Photos
                        data={form.photos}
                        onChange={v => patchForm('photos', v)}
                        onPrev={goPrev}
                        onNext={goNext}
                    />
                );
            case 6:
                return (
                    <Step6Documents
                        data={form.documents}
                        onChange={v => patchForm('documents', v)}
                        onPrev={goPrev}
                        onNext={goNext}
                    />
                );
            case 7:
                return (
                    <Step7Terms
                        data={form.terms}
                        onChange={v => patchForm('terms', v)}
                        onPrev={goPrev}
                        onSubmit={handleSubmit}
                        // FIX: drive the spinner from mutation state, not local state
                        isSubmitting={isPending}
                    />
                );
            default:
                return null;
        }
    };

    // ── Loading state — show until venue data is fetched and form is hydrated ─
    if (isLoading || !hydrated) {
        return (
            <View style={s.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={s.loadingText}>Loading venue data...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={s.root}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* ── Header ── */}
            <View style={s.header}>
                <View style={s.headerAccentBar} />
                <View style={s.headerContent}>
                    <View style={s.headerLeft}>
                        <Text style={s.headerEyebrow}>UPDATE VENUE</Text>
                        <Text style={s.headerTitle}>{STEP_LABELS[step - 1]}</Text>
                        <Text style={s.headerSub}>
                            Step {step} of {TOTAL_STEPS} · Update your venue information
                        </Text>
                    </View>
                    <View style={s.stepPill}>
                        <Text style={s.stepPillNum}>{step}</Text>
                        <Text style={s.stepPillSep}>/</Text>
                        <Text style={s.stepPillTotal}>{TOTAL_STEPS}</Text>
                    </View>
                    <TouchableOpacity
                        style={s.backBtn}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.75}
                    >
                        <Text style={s.backBtnText}>Cancel</Text>
                        <Ionicons name="close" size={16} color={Colors.charcoal} />
                    </TouchableOpacity>
                </View>
                <View style={s.progressWrap}>
                    <View style={s.progressTrack}>
                        <View
                            style={[
                                s.progressFill,
                                { width: `${(step / TOTAL_STEPS) * 100}%` as any },
                            ]}
                        />
                    </View>
                    <Text style={s.progressPct}>{Math.round((step / TOTAL_STEPS) * 100)}%</Text>
                </View>
            </View>

            {/* ── Step indicator ── */}
            <View style={s.stepsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.stepsScroll}
                >
                    {STEP_LABELS.map((label, idx) => {
                        const n = idx + 1;
                        const completed = n < step;
                        const active = n === step;
                        const showLabel = active || completed;
                        return (
                            <View key={idx} style={s.stepRow}>
                                {idx > 0 && (
                                    <View
                                        style={[
                                            s.stepConnector,
                                            completed ? s.connectorDone : s.connectorIdle,
                                        ]}
                                    />
                                )}
                                <View
                                    style={[
                                        s.stepChip,
                                        active && s.stepChipActive,
                                        completed && s.stepChipDone,
                                    ]}
                                >
                                    <View
                                        style={[
                                            s.stepNum,
                                            active && s.stepNumActive,
                                            completed && s.stepNumDone,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                s.stepNumText,
                                                active && s.stepNumTextActive,
                                                completed && s.stepNumTextDone,
                                            ]}
                                        >
                                            {completed ? '✓' : n}
                                        </Text>
                                    </View>
                                    {showLabel && (
                                        <Text
                                            style={[
                                                s.stepLabel,
                                                active && s.stepLabelActive,
                                                completed && s.stepLabelDone,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {label}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ── Step content ── */}
            <View style={s.content}>{renderStep()}</View>

            {/* ── Success modal ── */}
            <Modal visible={successModal} transparent animationType="fade">
                <View style={s.overlay}>
                    <View style={s.modalCard}>
                        <View style={s.successRing}>
                            <View style={s.successIcon}>
                                <Ionicons name="checkmark" size={34} color={Colors.white} />
                            </View>
                        </View>
                        <Text style={s.modalTitle}>Venue Updated!</Text>
                        <Text style={s.modalSub}>
                            Your venue has been updated successfully. Changes are now live.
                        </Text>
                        <View style={s.modalDivider} />
                        <View style={s.modalInfoRow}>
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={14}
                                color={Colors.success}
                            />
                            <Text style={s.modalInfoText}>All changes saved</Text>
                        </View>
                        <View style={s.modalInfoRow}>
                            <Ionicons name="time-outline" size={14} color={Colors.charcoalLight} />
                            <Text style={s.modalInfoText}>Updated just now</Text>
                        </View>
                        <TouchableOpacity
                            style={s.modalBtn}
                            onPress={() => {
                                setSuccessModal(false);
                                navigation.goBack();
                            }}
                            activeOpacity={0.85}
                        >
                            <Text style={s.modalBtnText}>Back to Venue</Text>
                            <Ionicons name="arrow-forward" size={15} color={Colors.charcoal} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
    },
    loadingText: {
        fontSize: Typography.md,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    header: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: Radii.xxl,
        borderBottomRightRadius: Radii.xxl,
        paddingBottom: Spacing.lg,
        ...Shadows.header,
    },
    headerAccentBar: { height: 4, backgroundColor: Colors.info },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingTop: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg,
        marginBottom: Spacing.lg,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xxs,
        borderRadius: Radii.sm,
        backgroundColor: Colors.background,
        marginLeft: Spacing.sm,
    },
    backBtnText: {
        fontSize: Typography.sm,
        fontWeight: Typography.medium,
        color: Colors.charcoal,
    },
    headerLeft: { flex: 1 },
    headerEyebrow: {
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
        color: Colors.info,
        letterSpacing: Typography.wider,
        marginBottom: Spacing.xxs,
    },
    headerTitle: {
        fontSize: Typography.xxl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: Typography.tight,
        marginBottom: Spacing.xxs,
    },
    headerSub: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    stepPill: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 1,
        backgroundColor: Colors.infoLight,
        borderWidth: 1,
        borderColor: Colors.info,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Radii.full,
    },
    stepPillNum: {
        fontSize: 16,
        fontWeight: Typography.extraBold,
        color: Colors.info,
        letterSpacing: -0.5,
    },
    stepPillSep: {
        fontSize: 11,
        color: Colors.info,
        fontWeight: Typography.medium,
        marginHorizontal: 1,
    },
    stepPillTotal: { fontSize: 11, fontWeight: Typography.semiBold, color: Colors.charcoalLight },
    progressWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.xl,
    },
    progressTrack: {
        flex: 1,
        height: 5,
        backgroundColor: Colors.border,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: Colors.info, borderRadius: 3 },
    progressPct: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.info,
        minWidth: 30,
        textAlign: 'right',
    },
    stepsWrapper: {
        marginTop: 10,
        backgroundColor: Colors.background,
        paddingVertical: Spacing.md,
        borderBottomColor: Colors.border,
    },
    stepsScroll: { paddingHorizontal: Spacing.lg, alignItems: 'center' },
    stepRow: { flexDirection: 'row', alignItems: 'center' },
    stepConnector: { width: 10, height: 1.5, borderRadius: 1 },
    connectorDone: { backgroundColor: Colors.success },
    connectorIdle: { backgroundColor: Colors.border },
    stepChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 5,
        paddingLeft: 5,
        paddingRight: 5,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    stepChipActive: {
        paddingRight: 12,
        borderColor: Colors.info,
        backgroundColor: Colors.infoLight,
    },
    stepChipDone: {
        paddingRight: 10,
        borderColor: Colors.successLight,
        backgroundColor: Colors.successLight,
    },
    stepNum: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    stepNumActive: { backgroundColor: Colors.info, borderColor: Colors.info },
    stepNumDone: { backgroundColor: Colors.success, borderColor: Colors.success },
    stepNumText: {
        fontSize: 11,
        fontWeight: Typography.extraBold,
        color: Colors.charcoalLight,
        lineHeight: 13,
    },
    stepNumTextActive: { color: Colors.white },
    stepNumTextDone: { color: Colors.white },
    stepLabel: { fontSize: 12, fontWeight: Typography.bold, color: Colors.charcoalLight },
    stepLabelActive: { color: Colors.info },
    stepLabelDone: { color: Colors.success, fontWeight: Typography.semiBold },
    content: { flex: 1, backgroundColor: Colors.background },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    modalCard: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: Radii.xxl,
        padding: Spacing.xxl,
        alignItems: 'center',
        ...Shadows.floating,
    },
    successRing: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: Colors.successLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    successIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.3,
        marginBottom: Spacing.sm,
    },
    modalSub: {
        fontSize: Typography.base,
        color: Colors.charcoalLight,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: Spacing.sm,
    },
    modalDivider: {
        width: '100%',
        height: 1,
        backgroundColor: Colors.divider,
        marginVertical: Spacing.lg,
    },
    modalInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
        marginBottom: Spacing.sm,
    },
    modalInfoText: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
    },
    modalBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.md,
        marginTop: Spacing.lg,
        width: '100%',
        ...Shadows.primary,
    },
    modalBtnText: {
        fontSize: Typography.md,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: 0.2,
    },
});

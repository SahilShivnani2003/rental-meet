import {
    VenueFormData,
    AmenityItem,
    Venue,
    WeekPrice,
} from '../../types/venue.type';

// ── Helpers ───────────────────────────────────────────────────────────────────

const toNum = (v: string): number => parseFloat(v) || 0;

const toWeekPrice = (p: { weekday: string; weekend: string } | null): WeekPrice => ({
    weekday: p != null ? toNum(p.weekday) : 0,
    weekend: p != null ? toNum(p.weekend) : 0,
});

const hasPrice = (p: { weekday: string; weekend: string }) =>
    p.weekday.trim() !== '' || p.weekend.trim() !== '';

/** Strip "Select …" placeholder values left by pickers — send undefined instead */
const clean = (v: string): string => /^select\s/i.test(v.trim()) ? '' : v.trim();

// ── Amenity builders ──────────────────────────────────────────────────────────

function buildBasicAmenities(form: VenueFormData['amenities']): AmenityItem[] {
    return form.basic
        .filter(a => a.selected)
        .map(a => ({
            name: a.name,
            available: true,
            type: a.type,
            rate: a.type === 'Paid' ? toNum(a.rate) : 0,
            rateType: a.type === 'Paid' ? a.rateType : 'Fixed',
        }));
}

function buildBeverages(form: VenueFormData['amenities']): AmenityItem[] {
    return form.beverages
        .filter(b => b.selected)
        .map(b => ({
            name: b.name,
            available: true,  // beverages are always paid
            ratePerUnit: toNum(b.ratePerUnit),
            brand: b.brand || '',
        }));
}

function buildRefreshmentFood(form: VenueFormData['amenities']): AmenityItem[] {
    return form.refreshmentFood
        .filter(f => f.selected)
        .map(f => ({
            name: f.name,
            available: true,
            ratePerPlate: toNum(f.ratePerPlate),
            items: f.items,  // Keep 'items' for refreshmentFood
        }));
}

function buildLunchThalis(form: VenueFormData['amenities']): AmenityItem[] {
    return form.lunchThalis.map(t => {
        // Count items from comma-separated string
        const itemsList = t.items.split(',').map(i => i.trim()).filter(Boolean);
        const numberOfItems = itemsList.length;

        return {
            thaliType: t.thaliType,
            available: true,
            categories: [{
                category: t.category || 'Regular Thali',  // fallback if not set
                itemsName: t.items,  // FIXED: Backend expects 'itemsName' not 'items'
                numberOfItems: numberOfItems,  // FIXED: Calculate from items
                ratePerPlate: toNum(t.ratePerPlate),
            }],
        };
    });
}

function buildFacility(f: VenueFormData['amenities']['kitchenAccess']): AmenityItem {
    return {
        available: f.available,
        type: f.type,
        charges: f.type === 'Paid' ? toNum(f.rate) : 0,
    };
}

function buildAdditional(form: VenueFormData['amenities']): AmenityItem[] {
    return form.additional
        .filter(a => a.selected)
        .map(a => ({
            name: a.name,
            available: true,
            type: a.type,
            charges: a.type === 'Paid' ? toNum(a.rate) : 0,
        }));
}

// ── Image section → category mapping ─────────────────────────────────────────

const SECTION_TO_CATEGORY: Record<string, string> = {
    featured: 'Featured',
    exterior: 'Exterior',
    interior: 'Interior',
    amenities: 'Amenities',
    additional: 'Additional',
};

// ── Main builder ──────────────────────────────────────────────────────────────

export function buildVenuePayload(
    form: VenueFormData,
    venueTypeNames: Record<string, string>,   // _id → name map (populated by Step1)
): Venue {
    const { basic, location, amenities, pricing, photos, documents, terms } = form;

    // Uploaded docs keyed by uploadKey
    const docUrl = (key: string) =>
        documents.uploadedDocs.find(d => d.uploadKey === key)?.url ?? '';

    // Pricing options enabled
    const enabledOptions = {
        perHour: hasPrice(pricing.prices.perHour),
        halfDay: hasPrice(pricing.prices.halfDay),
        fullDay: hasPrice(pricing.prices.fullDay),
    };

    return {
        // ── Basic ──────────────────────────────────────────────────────────────
        businessName: basic.businessName.trim(),
        capacity: clean(basic.capacity),
        description: basic.description.trim(),
        areaSqft: toNum(basic.areaSqft),
        confirmationHours: terms.confirmationHours,
        venueType: basic.venueTypes,

        // ── Location ──────────────────────────────────────────────────────────
        location: {
            address: location.address.trim(),
            area: location.area.trim(),
            city: location.city.trim(),
            state: location.state.trim(),
            village: location.village.trim(),
            googleMapLink: location.googleMapLink.trim(),
            landmark: location.landmark.trim(),
            nearestBusAuto: location.nearestBusAuto.trim(),
            nearestMetroTrain: location.nearestMetroTrain.trim(),
            parkingAvailability: clean(location.parkingAvailability),
            pincode: location.pincode.trim(),
        },

        // ── Amenities ─────────────────────────────────────────────────────────
        amenities: {
            basic: buildBasicAmenities(amenities),
            beverages: buildBeverages(amenities),
            refreshmentFood: buildRefreshmentFood(amenities),
            lunchThalis: buildLunchThalis(amenities),
            kitchenAccess: buildFacility(amenities.kitchenAccess),
            diningArea: buildFacility(amenities.diningArea),
            additional: buildAdditional(amenities),
        },

        // ── Pricing ───────────────────────────────────────────────────────────
        pricing: {
            enabledOptions,
            perHour: enabledOptions.perHour ? toWeekPrice(pricing.prices.perHour) : toWeekPrice(null),
            halfDay: enabledOptions.halfDay ? toWeekPrice(pricing.prices.halfDay) : toWeekPrice(null),
            fullDay: enabledOptions.fullDay ? toWeekPrice(pricing.prices.fullDay) : toWeekPrice(null),
            extraHourRate: hasPrice(pricing.prices.extraHour)
                ? toWeekPrice(pricing.prices.extraHour)
                : toWeekPrice(null),
        },

        // ── Availability ──────────────────────────────────────────────────────
        availability: {
            openingTime: pricing.openTime.trim(),
            closingTime: pricing.closeTime.trim(),
            availableDays: pricing.availDays,
            advanceBookingRule: clean(pricing.advanceBooking),
            blackoutDates: pricing.blackoutDate.trim() ? [pricing.blackoutDate.trim()] : [],
            confirmationHours: terms.confirmationHours,
        },

        // ── Images ────────────────────────────────────────────────────────────
        images: photos.uploadedImages.map(img => ({
            url: img.url,
            category: SECTION_TO_CATEGORY[img.sectionKey] ?? img.sectionKey,
            isFeatured: img.sectionKey === 'featured',
            publicId: img.publicId
        })),

        // ── Owner info ────────────────────────────────────────────────────────
        ownerInfo: {
            fullName: documents.fullName.trim(),
            email: documents.email.trim(),
            mobile: documents.mobile.trim(),
            alternatePhone: documents.altMobile.trim(),
            role: clean(documents.role),
            hasGST: documents.hasGST,
            gstNumber: documents.hasGST ? documents.gstNumber.trim() : '',
        },

        // ── Documents ─────────────────────────────────────────────────────────
        documents: {
            idProof: {
                // FIXED: Backend expects 'Aadhaar' or 'PAN' (capitalized)
                type: documents.idType === 'aadhaar' ? 'Aadhaar' : 'PAN',
                number: documents.idNumber.trim(),
                frontUrl: docUrl('id_front'),
                backUrl: docUrl('id_back'),
            },
            selfieUrl: docUrl('selfie'),
            businessProof: {
                type: clean(documents.bizProofType),
                documentUrl: docUrl('biz_doc'),
                otherSpecify: '',
            },
            verified: false,
        },

        // ── Bank details ──────────────────────────────────────────────────────
        bankDetails: {
            accountHolderName: documents.accountHolder.trim(),
            accountNumber: documents.accountNumber.trim(),
            accountType: clean(documents.accountType),
            bankName: documents.bankName.trim(),
            branchName: documents.branchName.trim(),
            ifscCode: documents.ifsc.trim().toUpperCase(),
        },

        // ── Terms ─────────────────────────────────────────────────────────────
        termsAccepted: terms.agreed,
        termsAcceptedDate: terms.agreed ? new Date().toISOString() : '',
    };
}
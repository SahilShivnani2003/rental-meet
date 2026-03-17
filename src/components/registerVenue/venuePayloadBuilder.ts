import { VenueFormData } from '../../types/venue.type';

// Maps form data → exact API payload shape from the spec
export function buildVenuePayload(form: VenueFormData, venueTypeNames: Record<string, string>) {
    const { basic, location, amenities, pricing, photos, documents, terms } = form;

    // ── Basic amenities ───────────────────────────────────────────────────────
    const basicAmenities = amenities.basicSelected.map(id => {
        const d = amenities.amenityData[id];
        return {
            name: id,           // swap for actual name if you store it
            available: true,
            type: d?.pricing === 'paid' ? 'Paid' : 'Included',
            rate: d?.pricing === 'paid' ? Number(d.rate) || 0 : 0,
            ...(d?.pricing === 'paid' && d.rateType ? { rateType: d.rateType } : {}),
        };
    });

    // ── Beverages ─────────────────────────────────────────────────────────────
    const beverages = Object.entries(amenities.beverageData)
        .filter(([, v]) => v.checked)
        .map(([id, v]) => ({ name: id, rate: Number(v.rate) || 0, brand: v.brand }));

    // ── Refreshment / Food ────────────────────────────────────────────────────
    const refreshmentFood = [
        ...Object.entries(amenities.snackData).filter(([, v]) => v.checked).map(([id, v]) => ({ name: id, rate: Number(v.rate) || 0, items: v.items })),
        ...Object.entries(amenities.breakfastData).filter(([, v]) => v.checked).map(([id, v]) => ({ name: id, rate: Number(v.rate) || 0, items: v.items })),
    ];

    // ── Lunch thalis ──────────────────────────────────────────────────────────
    const lunchThalis = amenities.thalis.map(t => ({ type: t.type, rate: Number(t.rate) || 0, items: t.items }));

    // ── Pricing ───────────────────────────────────────────────────────────────
    const p = pricing.prices;
    const pricingPayload = {
        enabledOptions: {
            perHour: !!p.perHour?.weekday,
            halfDay: !!p.halfDay?.weekday,
            fullDay: !!p.fullDay?.weekday,
        },
        perHour: { weekday: Number(p.perHour?.weekday) || 0, weekend: Number(p.perHour?.weekend) || 0 },
        halfDay: { weekday: Number(p.halfDay?.weekday) || 0, weekend: Number(p.halfDay?.weekend) || 0 },
        fullDay: { weekday: Number(p.fullDay?.weekday) || 0, weekend: Number(p.fullDay?.weekend) || 0 },
        extraHourRate: { weekday: Number(p.extraHour?.weekday) || 0, weekend: Number(p.extraHour?.weekend) || 0 },
    };

    // ── Photos → images ───────────────────────────────────────────────────────
    const images = photos.uploadedImages.map((img, idx) => ({
        url: img.url,
        publicId: img.publicId,
        category: capitalize(img.sectionKey),
        isFeatured: img.sectionKey === 'featured' || idx === 0,
    }));

    // ── Documents ─────────────────────────────────────────────────────────────
    const getDocUrl = (key: string) =>
        documents.uploadedDocs.find(d => d.uploadKey === key)?.url ?? '';

    const docs = documents;

    return {
        businessName: basic.businessName,
        venueType: basic.venueTypes.map(id => venueTypeNames[id] ?? id).join(', '),
        description: basic.description,
        capacity: basic.capacity,
        areaSqft: Number(basic.areaSqft) || 0,

        location: {
            address: location.address,
            landmark: location.landmark,
            state: '',          // not collected in form; fill if needed
            city: location.city,
            village: '',
            area: location.area,
            pincode: location.pincode,
            googleMapLink: location.googleMapLink,
            parkingAvailability: location.parkingAvailability,
            nearestBusAuto: location.nearestBusAuto,
            nearestMetroTrain: location.nearestMetroTrain,
        },

        amenities: {
            basic: basicAmenities,
            beverages,
            refreshmentFood,
            lunchThalis,
            kitchenAccess: {
                available: amenities.kitchenAvail,
                type: amenities.kitchenPricing === 'Included' ? 'Included' : amenities.kitchenPricing === 'Paid' ? 'Paid' : 'Included',
                charges: 0,
            },
            diningArea: {
                available: amenities.diningAvail,
                type: amenities.diningPricing === 'Included' ? 'Included' : amenities.diningPricing === 'Paid' ? 'Paid' : 'Included',
                charges: 0,
            },
            additional: amenities.additionalSelected,
        },

        pricing: pricingPayload,

        availability: {
            openingTime: pricing.openTime,
            closingTime: pricing.closeTime,
            availableDays: pricing.availDays,
            advanceBookingRule: pricing.advanceBooking,
            blackoutDates: pricing.blackoutDate ? [pricing.blackoutDate] : [],
        },

        images,

        ownerInfo: {
            fullName: docs.fullName,
            email: docs.email,
            mobile: docs.mobile,
            alternatePhone: docs.altMobile,
            role: docs.role,
            hasGST: false,
            gstNumber: '',
        },

        documents: {
            idProof: {
                type: docs.idType === 'aadhaar' ? 'Aadhaar' : 'PAN',
                number: docs.idNumber,
                frontUrl: getDocUrl('id_front'),
                backUrl: getDocUrl('id_back'),
            },
            selfieUrl: getDocUrl('selfie'),
            businessProof: {
                type: docs.bizProofType,
                documentUrl: getDocUrl('biz_doc'),
                otherSpecify: '',
            },
            verified: false,
        },

        bankDetails: {
            accountHolderName: docs.accountHolder,
            accountNumber: docs.accountNumber,
            ifscCode: docs.ifsc,
            bankName: docs.bankName,
            branchName: docs.branchName,
            accountType: docs.accountType,
        },

        termsAccepted: terms.agreed,
        termsAcceptedDate: new Date().toISOString(),
    };
}

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
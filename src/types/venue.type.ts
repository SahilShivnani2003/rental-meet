// ─── Shared types for the venue registration flow ────────────────────────────

export interface VenueFormData {
    // Step 1
    basic: {
        businessName: string;
        venueTypes: string[];        // array of _id strings
        description: string;
        capacity: string;
        areaSqft: string;
    };
    // Step 2
    location: {
        address: string;
        landmark: string;
        city: string;
        area: string;
        pincode: string;
        googleMapLink: string;
        parkingAvailability: string;
        nearestBusAuto: string;
        nearestMetroTrain: string;
    };
    // Step 3
    amenities: {
        basicSelected: string[];
        amenityData: Record<string, { pricing: 'included' | 'paid'; rate: string; rateType: string; rateTypeOpen: boolean }>;
        beverageData: Record<string, { checked: boolean; rate: string; brand: string }>;
        additionalSelected: string[];
        snackData: Record<string, { checked: boolean; rate: string; items: string }>;
        breakfastData: Record<string, { checked: boolean; rate: string; items: string }>;
        thalis: { type: string; rate: string; items: string }[];
        kitchenAvail: boolean;
        kitchenPricing: string;
        diningAvail: boolean;
        diningPricing: string;
    };
    // Step 4
    pricing: {
        prices: Record<string, { weekday: string; weekend: string }>;
        openTime: string;
        closeTime: string;
        availDays: string[];
        advanceBooking: string;
        blackoutDate: string;
    };
    // Step 5
    photos: {
        uploadedImages: { url: string; publicId: string; sectionKey: string }[];
    };
    // Step 6
    documents: {
        fullName: string;
        email: string;
        mobile: string;
        altMobile: string;
        role: string;
        idType: 'aadhaar' | 'pan';
        idNumber: string;
        bizProofType: string;
        accountHolder: string;
        accountNumber: string;
        ifsc: string;
        bankName: string;
        branchName: string;
        accountType: string;
        uploads: Record<string, string>;           // key → display name
        uploadedDocs: { url: string; publicId: string; uploadKey: string }[];
    };
    // Step 7
    terms: {
        agreed: boolean;
    };
}

export const initialVenueFormData: VenueFormData = {
    basic: { businessName: '', venueTypes: [], description: '', capacity: 'Select capacity range', areaSqft: '' },
    location: { address: '', landmark: '', city: '', area: '', pincode: '', googleMapLink: '', parkingAvailability: 'Select parking type', nearestBusAuto: '', nearestMetroTrain: '' },
    amenities: { basicSelected: ['firstAid', 'fireSafety'], amenityData: { firstAid: { pricing: 'included', rate: '', rateType: 'Fixed', rateTypeOpen: false }, fireSafety: { pricing: 'included', rate: '', rateType: 'Fixed', rateTypeOpen: false } }, beverageData: {}, additionalSelected: [], snackData: {}, breakfastData: {}, thalis: [], kitchenAvail: false, kitchenPricing: 'Select', diningAvail: false, diningPricing: 'Select' },
    pricing: { prices: {}, openTime: '', closeTime: '', availDays: [], advanceBooking: 'Select option', blackoutDate: '' },
    photos: { uploadedImages: [] },
    documents: { fullName: '', email: '', mobile: '', altMobile: '', role: 'Select role', idType: 'aadhaar', idNumber: '', bizProofType: 'Select type', accountHolder: '', accountNumber: '', ifsc: '', bankName: '', branchName: '', accountType: 'Select type', uploads: {}, uploadedDocs: [] },
    terms: { agreed: false },
};
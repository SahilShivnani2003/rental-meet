// ─── API-facing types (from backend) ─────────────────────────────────────────

export interface CategoryItem {
    category: string;
    itemsName: string;
    numberOfItems: number;
    ratePerPlate: number;
}

export interface AmenityItem {
    _id?: string;
    name?: string;
    available: boolean;
    charges?: number;
    type?: 'Included' | 'Paid';
    rate?: number;
    rateType?: 'Fixed' | 'Per Use';
    brand?: string;
    ratePerUnit?: number;
    thaliType?: string;
    categories?: CategoryItem[];
    ratePerPlate?: number;
}

export interface Amenity {
    additional: AmenityItem[];
    basic: AmenityItem[];
    beverages: AmenityItem[];
    diningArea: AmenityItem;
    kitchenAccess: AmenityItem;
    lunchThalis: AmenityItem[];
    refreshmentFood: AmenityItem[];
}

export interface WeekPrice {
    weekday: number;
    weekend: number;
}

export interface Venue {
    businessName: string;
    capacity: string;
    description: string;
    areaSqft: number;
    confirmationHours: number;
    termsAccepted: boolean;
    termsAcceptedDate: string;
    venueType: string[];
    amenities: Amenity;
    availability: {
        advanceBookingRule: string;
        availableDays: string[];
        blackoutDates: string[];
        closingTime: string;
        openingTime: string;
        confirmationHours: number;
    };
    bankDetails: {
        accountHolderName: string;
        accountNumber: string;
        accountType: string;
        bankName: string;
        branchName: string;
        ifscCode: string;
    };
    documents: {
        businessProof: { documentUrl: string; otherSpecify: string; type: string };
        idProof: { backUrl: string; frontUrl: string; number: string; type: string };
        selfieUrl: string;
        verified: boolean;
    };
    images: { category: string; isFeatured: boolean; url: string, publicId:string }[];
    location: {
        address: string;
        area: string;
        city: string;
        googleMapLink: string;
        landmark: string;
        nearestBusAuto: string;
        nearestMetroTrain: string;
        parkingAvailability: string;
        pincode: string;
        state: string;
        village: string;
    };
    ownerInfo: {
        alternatePhone: string;
        email: string;
        fullName: string;
        gstNumber: string;
        hasGST: boolean;
        mobile: string;
        role: string;
    };
    pricing: {
        enabledOptions: { fullDay: boolean; halfDay: boolean; perHour: boolean };
        extraHourRate?: WeekPrice;
        fullDay?: WeekPrice;
        halfDay?: WeekPrice;
        perHour?: WeekPrice;
    };
}

// ─── Form-level types (used inside the app) ───────────────────────────────────

export interface BasicAmenityForm {
    id: string;
    name: string;
    locked: boolean;           // mandatory, cannot deselect
    isDefault: boolean;           // pre-selected, user can toggle
    selected: boolean;
    type: 'Included' | 'Paid';
    rate: string;
    rateType: 'Fixed' | 'Per Use';
}

export interface BeverageForm {
    id: string;
    name: string;
    unit: string;
    selected: boolean;
    ratePerUnit: string;
    brand: string;
}

export interface FoodPackForm {
    id: string;
    name: string;
    category: 'Snack' | 'Breakfast';  // used to group in UI & payload
    selected: boolean;
    ratePerPlate: string;
    items: string;   // comma-separated item names
}

export interface ThaliForm {
    thaliType: string;
    category: string;   // e.g. 'Regular Thali' | 'Special Thali' | 'Maharaja Thali'
    ratePerPlate: string;
    items: string;
}

export interface AdditionalForm {
    name: string;
    selected: boolean;
    type: 'Included' | 'Paid';
    rate: string;
}

export interface FacilityForm {
    available: boolean;
    type: 'Included' | 'Paid';
    rate: string;
}

// ── Step form shapes ──────────────────────────────────────────────────────────

export interface BasicInfoForm {
    businessName: string;
    venueTypes: string[];   // array of VenueType _id strings
    description: string;
    capacity: string;
    areaSqft: string;
}

export interface LocationForm {
    address: string;
    landmark: string;
    city: string;
    area: string;
    state: string;
    village: string;
    pincode: string;
    googleMapLink: string;
    parkingAvailability: string;
    nearestBusAuto: string;
    nearestMetroTrain: string;
}

export interface AmenitiesForm {
    basic: BasicAmenityForm[];
    beverages: BeverageForm[];
    refreshmentFood: FoodPackForm[];     // snacks + breakfast packs
    lunchThalis: ThaliForm[];
    kitchenAccess: FacilityForm;
    diningArea: FacilityForm;
    additional: AdditionalForm[];
}

export interface PricingForm {
    prices: {
        perHour: { weekday: string; weekend: string };
        halfDay: { weekday: string; weekend: string };
        fullDay: { weekday: string; weekend: string };
        extraHour: { weekday: string; weekend: string };
    };
    openTime: string;
    closeTime: string;
    availDays: string[];
    advanceBooking: string;
    blackoutDate: string;
}

export interface PhotosForm {
    uploadedImages: { url: string; publicId: string; sectionKey: string }[];
}

export interface DocumentsForm {
    // Owner info
    fullName: string;
    email: string;
    mobile: string;
    altMobile: string;
    role: string;
    // GST
    hasGST: boolean;
    gstNumber: string;
    // ID Proof
    idType: 'aadhaar' | 'pan';
    idNumber: string;
    // Upload tracking
    uploads: Record<string, string>;                             // key → display name
    uploadedDocs: { url: string; publicId: string; uploadKey: string }[];
    // Business proof
    bizProofType: string;
    // Bank details
    accountHolder: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    branchName: string;
    accountType: string;
}

export interface TermsForm {
    agreed: boolean;
    confirmationHours: 1 | 2 | 3;   // max 3 hrs, 1-hr intervals
}

// ── Root form ─────────────────────────────────────────────────────────────────

export interface VenueFormData {
    basic: BasicInfoForm;
    location: LocationForm;
    amenities: AmenitiesForm;
    pricing: PricingForm;
    photos: PhotosForm;
    documents: DocumentsForm;
    terms: TermsForm;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const mkBasicAmenity = (
    id: string, name: string,
    opts: { locked?: boolean; isDefault?: boolean } = {},
): BasicAmenityForm => ({
    id, name,
    locked: opts.locked ?? false,
    isDefault: opts.isDefault ?? false,
    selected: !!(opts.locked || opts.isDefault),
    type: 'Included',
    rate: '',
    rateType: 'Fixed',
});

const mkBeverage = (id: string, name: string, unit: string): BeverageForm => ({
    id, name, unit, selected: false, ratePerUnit: '', brand: '',
});

const mkFoodPack = (id: string, name: string, category: 'Snack' | 'Breakfast'): FoodPackForm => ({
    id, name, category, selected: false, ratePerPlate: '', items: '',
});

const mkAdditional = (name: string): AdditionalForm => ({
    name, selected: false, type: 'Included', rate: '',
});

const mkFacility = (): FacilityForm => ({ available: false, type: 'Included', rate: '' });

export const initialVenueFormData: VenueFormData = {
    basic: {
        businessName: '',
        venueTypes: [],
        description: '',
        capacity: 'Select capacity range',
        areaSqft: '',
    },
    location: {
        address: '',
        landmark: '',
        city: '',
        area: '',
        state: '',
        village: '',
        pincode: '',
        googleMapLink: '',
        parkingAvailability: 'Select parking type',
        nearestBusAuto: '',
        nearestMetroTrain: '',
    },
    amenities: {
        basic: [
            mkBasicAmenity('firstAid', 'First Aid Box', { locked: true }),
            mkBasicAmenity('fireSafety', 'Fire & Safety', { locked: true }),
            mkBasicAmenity('wifi', 'High-Speed WiFi', { isDefault: true }),
            mkBasicAmenity('ac', 'Air Conditioning', { isDefault: true }),
            mkBasicAmenity('projector', 'Projector'),
            mkBasicAmenity('projScreen', 'Projection Screen'),
            mkBasicAmenity('whiteboard', 'Whiteboard'),
            mkBasicAmenity('soundSystem', 'Sound System'),
            mkBasicAmenity('mic', 'Microphone'),
            mkBasicAmenity('tv', 'LED / Smart TV'),
            mkBasicAmenity('videoConf', 'Video Conferencing'),
            mkBasicAmenity('confPhone', 'Conference Phone'),
            mkBasicAmenity('seating', 'Comfortable Seating'),
            mkBasicAmenity('printing', 'Printing / Photocopy'),
        ],
        beverages: [
            mkBeverage('tea', 'Tea', 'Per Cup'),
            mkBeverage('coffee', 'Coffee', 'Per Cup'),
            mkBeverage('water350', 'Water Bottle (350ml)', 'Per Bottle'),
            mkBeverage('water500', 'Water Bottle (500ml)', 'Per Bottle'),
            mkBeverage('water1l', 'Water Bottle (1 Ltr)', 'Per Bottle'),
            mkBeverage('water2l', 'Water Bottle (2 Ltr)', 'Per Bottle'),
            mkBeverage('dispenser', 'Water Dispenser (20 Ltr)', 'Per Dispenser'),
            mkBeverage('soft350', 'Soft Drink (350ml)', 'Per Bottle'),
            mkBeverage('soft750', 'Soft Drink (750ml)', 'Per Bottle'),
            mkBeverage('soft1125', 'Soft Drink (1/1.25 Ltr)', 'Per Bottle'),
            mkBeverage('soft2225', 'Soft Drink (2/2.25 Ltr)', 'Per Bottle'),
        ],
        refreshmentFood: [
            mkFoodPack('snack3', 'Snacks Pack (3 Items)', 'Snack'),
            mkFoodPack('bp1', 'Breakfast Pack (1 Item)', 'Breakfast'),
            mkFoodPack('bp2', 'Breakfast Pack (2 Items)', 'Breakfast'),
            mkFoodPack('bp3', 'Breakfast Pack (3 Items)', 'Breakfast'),
        ],
        lunchThalis: [],
        kitchenAccess: mkFacility(),
        diningArea: mkFacility(),
        additional: [
            mkAdditional('Separate Washrooms'),
            mkAdditional('Power Backup'),
            mkAdditional('Security Personnel'),
            mkAdditional('Daily Cleaning'),
            mkAdditional('Reception Service'),
            mkAdditional('Storage Space'),
            mkAdditional('Valet Parking'),
            mkAdditional('Wheelchair Access'),
            mkAdditional('Elevator'),
        ],
    },
    pricing: {
        prices: {
            perHour: { weekday: '', weekend: '' },
            halfDay: { weekday: '', weekend: '' },
            fullDay: { weekday: '', weekend: '' },
            extraHour: { weekday: '', weekend: '' },
        },
        openTime: '',
        closeTime: '',
        availDays: [],
        advanceBooking: 'Select option',
        blackoutDate: '',
    },
    photos: {
        uploadedImages: [],
    },
    documents: {
        fullName: '',
        email: '',
        mobile: '',
        altMobile: '',
        role: 'Select role',
        hasGST: false,
        gstNumber: '',
        idType: 'aadhaar',
        idNumber: '',
        uploads: {},
        uploadedDocs: [],
        bizProofType: 'Select type',
        accountHolder: '',
        accountNumber: '',
        ifsc: '',
        bankName: '',
        branchName: '',
        accountType: 'Select type',
    },
    terms: { agreed: false, confirmationHours: 2 },
};
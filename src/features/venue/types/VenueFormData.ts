// ─── Sub-form interfaces ──────────────────────────────────────────────────────

export interface BasicAmenityForm {
    id: string;
    name: string;
    selected: boolean;
    /** Locked items are mandatory and cannot be deselected */
    locked?: boolean;
    type: 'Included' | 'Paid';
    rate: string;
    rateType: 'Fixed' | 'Per Use';
    /** '' means unlimited, matches web's blank = unlimited behavior */
    maxQuantity: string;
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
    /** Determines which sub-section the pack belongs to */
    category: 'Snack' | 'Breakfast';
    selected: boolean;
    ratePerPlate: string;
    items: string;
}

/** One selected category within a thali type (Regular / Special / Maharaja) */
export interface ThaliCategoryEntry {
    category: string;
    ratePerPlate: string;
    numberOfItems: string;
    itemNames: string;
}

export interface ThaliForm {
    thaliType: string;
    categories: ThaliCategoryEntry[];
}

export interface FacilityForm {
    available: boolean;
    type: 'Included' | 'Paid';
    rate: string;
}

export interface AdditionalForm {
    name: string;
    selected: boolean;
    type: 'Included' | 'Paid';
    rate: string;
}

export interface UploadedImage {
    url: string;
    publicId: string;
    sectionKey: string;
}

export interface UploadedDoc {
    url: string;
    publicId: string;
    uploadKey: string;
}

// ─── Top-level form shape ─────────────────────────────────────────────────────

export interface VenueFormData {
    basic: {
        businessName: string;
        venueTypes: string[];
        description: string;
        capacity: string;
        areaSqft: string;
        foodType?: 'Veg' | 'Non Veg' | 'Both';
    };
    location: {
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
    };
    amenities: {
        basic: BasicAmenityForm[];
        beverages: BeverageForm[];
        refreshmentFood: FoodPackForm[];
        lunchThalis: ThaliForm[];
        kitchenAccess: FacilityForm;
        diningArea: FacilityForm;
        additional: AdditionalForm[];
    };
    pricing: {
        prices: Record<string, { weekday: string; weekend: string }>;
        enabledOptions?: {
            perHour?: boolean;
            halfDay?: boolean;
            fullDay?: boolean;
        };
        openTime: string;
        closeTime: string;
        availDays: string[];
        advanceBooking: string;
        blackoutDate: string;
        confirmationHours: 1 | 2 | 3;
    };

    photos: {
        uploadedImages: UploadedImage[];
    };
    documents: {
        fullName: string;
        email: string;
        mobile: string;
        altMobile: string;
        role: string;
        hasGST: boolean;
        gstNumber: string;
        idType: 'aadhaar' | 'pan';
        idNumber: string;
        bizProofType: string;
        accountHolder: string;
        accountNumber: string;
        ifsc: string;
        bankName: string;
        branchName: string;
        accountType: string;
        bankProofUrl?: string;
        bankProofPublicId?: string;
        uploads: Record<string, string>;
        uploadedDocs: UploadedDoc[];
    };
    terms: {
        agreed: boolean;

    };
}

// ─── Default amenity seeds (aligned with web) ────────────────────────────────

const DEFAULT_BASIC_AMENITIES: BasicAmenityForm[] = [
    // Locked / mandatory, matches web's `defaultAmenities`
    { id: 'firstaid', name: 'First Aid Box', selected: true, locked: true, type: 'Included', rate: '', rateType: 'Fixed', maxQuantity: '' },
    { id: 'firesafety', name: 'Fire & Safety', selected: true, locked: true, type: 'Included', rate: '', rateType: 'Fixed', maxQuantity: '' },
    // Selectable, matches web's `basicAmenities`
    { id: 'wifi', name: 'High-Speed WiFi', selected: false, type: 'Included', rate: '', rateType: 'Fixed', maxQuantity: '' },
    { id: 'ac', name: 'Air Conditioning', selected: false, type: 'Included', rate: '', rateType: 'Fixed', maxQuantity: '' },
    { id: 'projector', name: 'Projector', selected: false, type: 'Included', rate: '', rateType: 'Fixed', maxQuantity: '' },
    { id: 'screen', name: 'Projection Screen', selected: false, type: 'Included', rate: '', rateType: 'Fixed', maxQuantity: '' },
    { id: 'whiteboard', name: 'Whiteboard', selected: false, type: 'Included', rate: '', rateType: 'Fixed', maxQuantity: '' },
    { id: 'sound', name: 'Sound System', selected: false, type: 'Included', rate: '', rateType: 'Fixed', maxQuantity: '' },
    { id: 'mic', name: 'Microphone', selected: false, type: 'Included', rate: '', rateType: 'Fixed', maxQuantity: '' },
    { id: 'tv', name: 'LED / Smart TV', selected: false, type: 'Included', rate: '', rateType: 'Fixed', maxQuantity: '' },
    { id: 'videoconf', name: 'Video Conferencing', selected: false, type: 'Included', rate: '', rateType: 'Fixed', maxQuantity: '' },
    { id: 'phone', name: 'Conference Phone', selected: false, type: 'Included', rate: '', rateType: 'Fixed', maxQuantity: '' },
    { id: 'seating', name: 'Comfortable Seating', selected: false, type: 'Included', rate: '', rateType: 'Fixed', maxQuantity: '' },
    { id: 'printing', name: 'Printing / Photocopy', selected: false, type: 'Included', rate: '', rateType: 'Fixed', maxQuantity: '' },
];

const DEFAULT_BEVERAGES: BeverageForm[] = [
    { id: 'tea', name: 'Tea', unit: 'Per Cup', selected: false, ratePerUnit: '', brand: '' },
    { id: 'coffee', name: 'Coffee', unit: 'Per Cup', selected: false, ratePerUnit: '', brand: '' },
    { id: 'water250', name: 'Water Bottle (250ml)', unit: 'Per Bottle', selected: false, ratePerUnit: '', brand: '' },
    { id: 'water500', name: 'Water Bottle (500ml)', unit: 'Per Bottle', selected: false, ratePerUnit: '', brand: '' },
    { id: 'water1l', name: 'Water Bottle (1 Ltr)', unit: 'Per Bottle', selected: false, ratePerUnit: '', brand: '' },
    { id: 'water2l', name: 'Water Bottle (2 Ltr)', unit: 'Per Bottle', selected: false, ratePerUnit: '', brand: '' },
    { id: 'dispenser20l', name: 'Water Dispenser (20 Ltr)', unit: 'Per Dispenser', selected: false, ratePerUnit: '', brand: '' },
    { id: 'softdrink250', name: 'Soft Drink (250ml)', unit: 'Per Bottle', selected: false, ratePerUnit: '', brand: '' },
    { id: 'softdrink750', name: 'Soft Drink (750ml)', unit: 'Per Bottle', selected: false, ratePerUnit: '', brand: '' },
    { id: 'softdrink1_25l', name: 'Soft Drink (1/1.25 Ltr)', unit: 'Per Bottle', selected: false, ratePerUnit: '', brand: '' },
    { id: 'softdrink2_25l', name: 'Soft Drink (2/2.25 Ltr)', unit: 'Per Bottle', selected: false, ratePerUnit: '', brand: '' },
];

const DEFAULT_FOOD_PACKS: FoodPackForm[] = [
    { id: 'snacks3', name: 'Snacks Pack (3 Items)', category: 'Snack', selected: false, ratePerPlate: '', items: '' },
    { id: 'breakfast1', name: 'Breakfast Pack (1 Item)', category: 'Breakfast', selected: false, ratePerPlate: '', items: '' },
    { id: 'breakfast2', name: 'Breakfast Pack (2 Items)', category: 'Breakfast', selected: false, ratePerPlate: '', items: '' },
    { id: 'breakfast3', name: 'Breakfast Pack (3 Items)', category: 'Breakfast', selected: false, ratePerPlate: '', items: '' },
];

const DEFAULT_ADDITIONAL: AdditionalForm[] = [
    { name: 'Separate Washrooms', selected: false, type: 'Included', rate: '' },
    { name: 'Power Backup', selected: false, type: 'Included', rate: '' },
    { name: 'Security Personnel', selected: false, type: 'Included', rate: '' },
    { name: 'Daily Cleaning', selected: false, type: 'Included', rate: '' },
    { name: 'Reception Service', selected: false, type: 'Included', rate: '' },
    { name: 'Storage Space', selected: false, type: 'Included', rate: '' },
    { name: 'Valet Parking', selected: false, type: 'Included', rate: '' },
    { name: 'Wheelchair Access', selected: false, type: 'Included', rate: '' },
    { name: 'Elevator', selected: false, type: 'Included', rate: '' },
];

// ─── Initial form state ───────────────────────────────────────────────────────

export const CAPACITY_RANGES = [
    'Select capacity range',
    '10-20', '20-30', '30-40', '40-50', '50-100', '100-200', '200-300',
    '300-400', '400-500', '500-600', '600-700', '700-800', '800-1000',
    '1000-1500', '1500-2000', 'More than 2000',
];

export const PARKING_TYPES = ['Select parking type', 'Free', 'Paid', 'Limited', 'No'];
export const FOOD_TYPES = ['Select food type', 'Veg', 'Non Veg', 'Both'];
export const ADVANCE_OPTIONS = [
    'Select option',
    'Same day allowed',
    '24 hours in advance',
    '48 hours in advance',
    '1 week in advance',
];
export const ROLES = ['Select role', 'Owner', 'Manager', 'Partner', 'Director'];
export const BUSINESS_PROOF_TYPES = [
    'Select type',
    'Business Regd. Certificate',
    'Trade License',
    'Certificate of Incorporation',
    'Partnership Deed',
    'Udyog Aadhar',
    'Other',
];
export const ACCOUNT_TYPES = ['Select type', 'Savings', 'Current', 'Overdraft'];

export const initialVenueFormData: VenueFormData = {
    basic: {
        businessName: '',
        venueTypes: [],
        description: '',
        capacity: CAPACITY_RANGES[0],
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
        parkingAvailability: PARKING_TYPES[0],
        nearestBusAuto: '',
        nearestMetroTrain: '',
    },
    amenities: {
        basic: DEFAULT_BASIC_AMENITIES,
        beverages: DEFAULT_BEVERAGES,
        refreshmentFood: DEFAULT_FOOD_PACKS,
        lunchThalis: [],
        kitchenAccess: { available: false, type: 'Included', rate: '' },
        diningArea: { available: false, type: 'Included', rate: '' },
        additional: DEFAULT_ADDITIONAL,
    },
    pricing: {
        prices: {
            perHour: { weekday: '', weekend: '' },
            halfDay: { weekday: '', weekend: '' },
            fullDay: { weekday: '', weekend: '' },
            extraHour: { weekday: '', weekend: '' },
        },
        enabledOptions: {
            perHour: false,
            halfDay: false,
            fullDay: false,
        },
        openTime: '09:00 AM',
        closeTime: '09:00 PM',
        availDays: [],
        advanceBooking: ADVANCE_OPTIONS[0],
        blackoutDate: '',
        confirmationHours: 2,
    },
    photos: {
        uploadedImages: [],
    },
    documents: {
        fullName: '',
        email: '',
        mobile: '',
        altMobile: '',
        role: ROLES[0],
        hasGST: false,
        gstNumber: '',
        idType: 'aadhaar',
        idNumber: '',
        bizProofType: BUSINESS_PROOF_TYPES[0],
        accountHolder: '',
        accountNumber: '',
        ifsc: '',
        bankName: '',
        branchName: '',
        accountType: ACCOUNT_TYPES[0],
        uploads: {},
        uploadedDocs: [],
    },
    terms: {
        agreed: false,

    },
};
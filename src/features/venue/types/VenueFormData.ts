// ─── Sub-form interfaces ──────────────────────────────────────────────────────

export interface BasicAmenityForm {
    id: string;
    name: string;
    selected: boolean;
    /** Locked items are mandatory and cannot be deselected */
    locked?: boolean;
    isDefault?: boolean;
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
    /** Determines which sub-section the pack belongs to */
    category: 'Snack' | 'Breakfast';
    selected: boolean;
    ratePerPlate: string;
    items: string;
}

export interface ThaliForm {
    thaliType: string;
    category: string;
    ratePerPlate: string;
    items: string;
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
        openTime: string;
        closeTime: string;
        availDays: string[];
        advanceBooking: string;
        blackoutDate: string;
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
        /** Map of uploadKey → display filename */
        uploads: Record<string, string>;
        uploadedDocs: UploadedDoc[];
    };
    terms: {
        agreed: boolean;
        confirmationHours: 1 | 2 | 3;
    };
}

// ─── Default amenity seeds ────────────────────────────────────────────────────

const DEFAULT_BASIC_AMENITIES: BasicAmenityForm[] = [
    { id: 'wifi', name: 'Wi-Fi / Internet', selected: true, locked: true, type: 'Included', rate: '', rateType: 'Fixed' },
    { id: 'power', name: 'Power Backup', selected: true, isDefault: true, type: 'Included', rate: '', rateType: 'Fixed' },
    { id: 'ac', name: 'Air Conditioning', selected: false, type: 'Included', rate: '', rateType: 'Fixed' },
    { id: 'projector', name: 'Projector / Screen', selected: false, type: 'Included', rate: '', rateType: 'Fixed' },
    { id: 'whiteboard', name: 'Whiteboard', selected: false, type: 'Included', rate: '', rateType: 'Fixed' },
    { id: 'sound', name: 'Sound System', selected: false, type: 'Included', rate: '', rateType: 'Fixed' },
    { id: 'mic', name: 'Microphone', selected: false, type: 'Included', rate: '', rateType: 'Fixed' },
    { id: 'elevator', name: 'Elevator / Lift', selected: false, type: 'Included', rate: '', rateType: 'Fixed' },
    { id: 'security', name: 'Security / CCTV', selected: false, type: 'Included', rate: '', rateType: 'Fixed' },
    { id: 'restroom', name: 'Restrooms', selected: true, locked: true, type: 'Included', rate: '', rateType: 'Fixed' },
];

const DEFAULT_BEVERAGES: BeverageForm[] = [
    { id: 'water', name: 'Water', unit: 'per bottle', selected: false, ratePerUnit: '', brand: '' },
    { id: 'tea', name: 'Tea', unit: 'per cup', selected: false, ratePerUnit: '', brand: '' },
    { id: 'coffee', name: 'Coffee', unit: 'per cup', selected: false, ratePerUnit: '', brand: '' },
    { id: 'juice', name: 'Fruit Juice', unit: 'per glass', selected: false, ratePerUnit: '', brand: '' },
    { id: 'softdrink', name: 'Soft Drinks', unit: 'per bottle', selected: false, ratePerUnit: '', brand: '' },
    { id: 'buttermilk', name: 'Buttermilk / Lassi', unit: 'per glass', selected: false, ratePerUnit: '', brand: '' },
];

const DEFAULT_FOOD_PACKS: FoodPackForm[] = [
    { id: 'samosa', name: 'Samosa Pack', category: 'Snack', selected: false, ratePerPlate: '', items: '' },
    { id: 'kachori', name: 'Kachori Pack', category: 'Snack', selected: false, ratePerPlate: '', items: '' },
    { id: 'namkeen', name: 'Namkeen / Mixture', category: 'Snack', selected: false, ratePerPlate: '', items: '' },
    { id: 'sandwich', name: 'Sandwich Pack', category: 'Snack', selected: false, ratePerPlate: '', items: '' },
    { id: 'poha', name: 'Poha', category: 'Breakfast', selected: false, ratePerPlate: '', items: '' },
    { id: 'idli', name: 'Idli-Sambar', category: 'Breakfast', selected: false, ratePerPlate: '', items: '' },
    { id: 'paratha', name: 'Paratha', category: 'Breakfast', selected: false, ratePerPlate: '', items: '' },
    { id: 'upma', name: 'Upma', category: 'Breakfast', selected: false, ratePerPlate: '', items: '' },
];

const DEFAULT_ADDITIONAL: AdditionalForm[] = [
    { name: 'Decoration', selected: false, type: 'Included', rate: '' },
    { name: 'Photography / Videography', selected: false, type: 'Included', rate: '' },
    { name: 'DJ / Music', selected: false, type: 'Included', rate: '' },
    { name: 'Valet Parking', selected: false, type: 'Included', rate: '' },
    { name: 'Housekeeping', selected: false, type: 'Included', rate: '' },
    { name: 'Lounge / Waiting Area', selected: false, type: 'Included', rate: '' },
    { name: 'Prayer / Meditation Room', selected: false, type: 'Included', rate: '' },
    { name: 'Generator Backup', selected: false, type: 'Included', rate: '' },
];

// ─── Initial form state ───────────────────────────────────────────────────────

export const CAPACITY_RANGES = [
    'Select capacity range',
    '10-20',
    '20-30',
    '30-40',
    '40-50',
    '50-100',
    '100-200',
    '200-300',
    '300-400',
    '400-500',
    '500-600',
    '600-700',
    '700-800',
    '800-1000',
    '1000-1500',
    '1500-2000',
    'More than 2000',
];

export const PARKING_TYPES = ['Select parking type', 'Free', 'Paid', 'Limited', 'No'];
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
        openTime: '09:00 AM',
        closeTime: '09:00 PM',
        availDays: [],
        advanceBooking: ADVANCE_OPTIONS[0],
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
        confirmationHours: 2,
    },
};
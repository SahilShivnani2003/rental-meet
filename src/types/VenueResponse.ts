export type Capacity =
  | '10-20' | '20-30' | '30-40' | '40-50'
  | '50-100' | '100-200' | '200-300'
  | '300-400' | '400-500' | '500-600'
  | '600-700' | '700-800' | '800-1000'
  | '1000-1500' | '1500-2000' | 'More than 2000';

export type ParkingType = 'Free' | 'Paid' | 'Limited' | 'None';

export type AmenityType = 'Included' | 'Paid';
export type RateType = 'Fixed' | 'Per Use';

export type WeekDay =
  | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday'
  | 'Friday' | 'Saturday' | 'Sunday';

export type ThaliType =
  | 'North Indian Thali'
  | 'Punjabi Thali'
  | 'Non-Veg Thali'
  | 'South Indian Thali'
  | 'Gujarati Thali'
  | 'Rajasthani Thali'
  | 'Bengali Thali'
  | 'Maharashtrian Thali'
  | 'Kashmiri Thali'
  | 'Simple/Daily Thali'
  | 'Protein-Packed Thali'
  | 'Festive/Banquet Thali';

export type ThaliCategory =
  | 'Regular Thali'
  | 'Special Thali'
  | 'Maharaja Thali';

export type ImageCategory =
  | 'Featured'
  | 'Exterior'
  | 'Interior'
  | 'Amenities'
  | 'Additional';

export type OwnerRole = 'Owner' | 'Manager' | 'Representative';

export type IdProofType = 'Aadhaar' | 'PAN';

export type BusinessProofType =
  | 'Business Regd. Certificate'
  | 'GST Certificate'
  | 'Trade License'
  | 'Certificate of Incorporation'
  | 'Partnership Deed'
  | 'Udyog Aadhar'
  | 'Other';

export type AccountType = 'Savings' | 'Current';

export type VenueStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface VenueResponse {
  owner: string;

  sku?: string;

  businessName: string;
  venueType: string[];
  description: string;
  capacity: Capacity;
  areaSqft: number;

  location: {
    address: string;
    landmark: string;
    state: string;
    city: string;
    village?: string;
    area: string;
    pincode: string;
    googleMapLink: string;
    parkingAvailability: ParkingType;
    nearestBusAuto?: string;
    nearestMetroTrain?: string;
  };

  amenities?: {
    basic?: {
      name?: string;
      available?: boolean;
      type?: AmenityType;
      rate?: number;
      rateType?: RateType;
    }[];
    beverages?: {
      name?: string;
      available?: boolean;
      ratePerUnit?: number;
      brand?: string;
    }[];
    refreshmentFood?: {
      name?: string;
      available?: boolean;
      ratePerPlate?: number;
      items?: string;
    }[];
    lunchThalis?: {
      thaliType: ThaliType;
      available?: boolean;
      categories?: {
        category: ThaliCategory;
        ratePerPlate: number;
        numberOfItems: number;
        itemNames: string;
      }[];
    }[];
    kitchenAccess?: {
      available?: boolean;
      type?: AmenityType;
      charges?: number;
    };
    diningArea?: {
      available?: boolean;
      type?: AmenityType;
      charges?: number;
    };
    additional?: {
      name?: string;
      available?: boolean;
      type?: AmenityType;
      charges?: number;
    }[];
  };

  pricing?: {
    enabledOptions: {
      perHour: boolean;
      halfDay: boolean;
      fullDay: boolean;
    };
    perHour?: { weekday?: number; weekend?: number };
    halfDay?: { weekday?: number; weekend?: number };
    fullDay?: { weekday?: number; weekend?: number };
    extraHourRate?: { weekday?: number; weekend?: number };
  };

  customPlatformFee: {
    enabled: boolean;
    percentage: number;
  };

  customGST: {
    enabled: boolean;
    rate: number;
  };

  availability?: {
    openingTime?: string;
    closingTime?: string;
    availableDays?: WeekDay[];
    advanceBookingRule?: 'Same day allowed' | '24 hours in advance' | '48 hours in advance' | '1 week in advance';
    blackoutDates?: {
      date?: string;
      reason?: string;
    }[];
    confirmationHours: number;
  };

  images?: {
    url?: string;
    category?: ImageCategory;
    isFeatured?: boolean;
    uploadedAt: string;
  }[];

  ownerInfo?: {
    fullName?: string;
    email?: string;
    mobile?: string;
    alternatePhone?: string;
    role?: OwnerRole;
    hasGST: boolean;
    gstNumber?: string;
  };

  documents?: {
    idProof?: {
      type?: IdProofType;
      number?: string;
      frontUrl?: string;
      backUrl?: string;
    };
    selfieUrl?: string;
    businessProof?: {
      type?: BusinessProofType;
      documentUrl?: string;
      otherSpecify?: string;
    };
    verified: boolean;
  };

  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branchName?: string;
    accountType?: AccountType;
  };

  termsAccepted: boolean;
  termsAcceptedDate: string;

  status: VenueStatus;
  rejectionReason?: string;

  verificationTimeline?: {
    applicationReview?: string;
    documentVerification?: string;
    siteVisit?: string;
    listingActivation?: string;
  };

  isActive: boolean;

  blockedDates?: {
    date: string;
    reason: string;
  }[];

  totalBookings: number;
  totalEarnings: number;
  rating: number;
  reviewCount: number;

  createdAt: string;
  updatedAt: string;
}
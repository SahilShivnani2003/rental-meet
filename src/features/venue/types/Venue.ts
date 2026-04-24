export interface Venue {
    _id?: string;

    owner: string;
    sku?: string;

    businessName: string;
    venueType: string[];
    description: string;
    capacity:
    | '10-20' | '20-30' | '30-40' | '40-50' | '50-100' | '100-200'
    | '200-300' | '300-400' | '400-500' | '500-600' | '600-700'
    | '700-800' | '800-1000' | '1000-1500' | '1500-2000' | 'More than 2000';
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
        parkingAvailability: 'Free' | 'Paid' | 'Limited' | 'None';
        nearestBusAuto?: string;
        nearestMetroTrain?: string;
    };

    amenities?: {
        basic?: {
            name?: string;
            available?: boolean;
            type?: 'Included' | 'Paid';
            rate?: number;
            rateType?: 'Fixed' | 'Per Use';
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
            thaliType:
            | 'North Indian Thali' | 'Punjabi Thali' | 'Non-Veg Thali'
            | 'South Indian Thali' | 'Gujarati Thali' | 'Rajasthani Thali'
            | 'Bengali Thali' | 'Maharashtrian Thali' | 'Kashmiri Thali'
            | 'Simple/Daily Thali' | 'Protein-Packed Thali' | 'Festive/Banquet Thali';
            available?: boolean;
            categories?: {
                category: 'Regular Thali' | 'Special Thali' | 'Maharaja Thali';
                ratePerPlate: number;
                numberOfItems: number;
                itemNames: string;
            }[];
        }[];
        kitchenAccess?: {
            available?: boolean;
            type?: 'Included' | 'Paid';
            charges?: number;
        };
        diningArea?: {
            available?: boolean;
            type?: 'Included' | 'Paid';
            charges?: number;
        };
        additional?: {
            name?: string;
            available?: boolean;
            type?: 'Included' | 'Paid';
            charges?: number;
        }[];
    };

    pricing?: {
        enabledOptions?: {
            perHour?: boolean;
            halfDay?: boolean;
            fullDay?: boolean;
        };
        perHour?: { weekday?: number; weekend?: number };
        halfDay?: { weekday?: number; weekend?: number };
        fullDay?: { weekday?: number; weekend?: number };
        extraHourRate?: { weekday?: number; weekend?: number };
    };

    customPlatformFee?: {
        enabled?: boolean;
        percentage?: number;
    };

    customGST?: {
        enabled?: boolean;
        rate?: number;
    };

    availability?: {
        openingTime?: string;
        closingTime?: string;
        availableDays?: (
            'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' |
            'Friday' | 'Saturday' | 'Sunday'
        )[];
        advanceBookingRule?:
        | 'Same day allowed'
        | '24 hours in advance'
        | '48 hours in advance'
        | '1 week in advance';
        blackoutDates?: {
            date?: Date;
            reason?: string;
        }[];
        confirmationHours?: number;
    };

    images?: {
        url?: string;
        category?: 'Featured' | 'Exterior' | 'Interior' | 'Amenities' | 'Additional';
        isFeatured?: boolean;
        uploadedAt?: Date;
    }[];

    ownerInfo?: {
        fullName?: string;
        email?: string;
        mobile?: string;
        alternatePhone?: string;
        role?: 'Owner' | 'Manager' | 'Representative';
        hasGST?: boolean;
        gstNumber?: string;
    };

    documents?: {
        idProof?: {
            type?: 'Aadhaar' | 'PAN';
            number?: string;
            frontUrl?: string;
            backUrl?: string;
        };
        selfieUrl?: string;
        businessProof?: {
            type?:
            | 'Business Regd. Certificate' | 'GST Certificate' | 'Trade License'
            | 'Certificate of Incorporation' | 'Partnership Deed'
            | 'Udyog Aadhar' | 'Other';
            documentUrl?: string;
            otherSpecify?: string;
        };
        verified?: boolean;
    };

    bankDetails?: {
        accountHolderName?: string;
        accountNumber?: string;
        ifscCode?: string;
        bankName?: string;
        branchName?: string;
        accountType?: 'Savings' | 'Current';
        bankProofUrl?: string;
        bankProofPublicId?: string;
    };

    termsAccepted: boolean;
    termsAcceptedDate?: Date;

    status?: 'pending' | 'approved' | 'rejected' | 'suspended' | 'resubmitted';
    rejectionReason?: string;
    rejectionHistory?: {
        reason?: string;
        rejectedAt?: Date;
        rejectedBy?: string;
    }[];

    verificationTimeline?: {
        applicationReview?: Date;
        documentVerification?: Date;
        siteVisit?: Date;
        listingActivation?: Date;
    };

    isActive?: boolean;

    blockedDates?: {
        date: Date;
        reason?: string;
    }[];

    totalBookings?: number;
    totalEarnings?: number;
    rating?: number;
    reviewCount?: number;

    createdAt?: Date;
    updatedAt?: Date;
}
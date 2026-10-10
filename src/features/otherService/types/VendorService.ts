
export interface VendorService {
    _id?: string;
    vendor: string;

    // Step 1 — Contact Info
    contactInfo?: {
        fullName?: string;
        primaryMobile?: string;
        secondaryMobile?: string;
        role?: 'owner' | 'manager' | 'representative';
    };

    // Step 2 — Business Info
    title: string;
    slug?: string;
    category: string;
    companyName?: string;
    brandName?: string;
    experienceYears?: number;
    description?: string;
    specialization?: string[];
    tags?: string[];

    // Step 3 — Address
    officeAddress?: string;
    state?: string;
    city?: string;
    area?: string;
    village?: string;
    pincode?: string;
    serviceableAreas?: string[];

    website?: string;
    instagram?: string;
    facebook?: string;

    // Step 4 — Pricing
    startingPrice?: number;
    minimumOrderPrice?: number;

    packages?: {
        sno?: number;
        name?: string;
        price?: number;
        unit?: string;
        minQty?: number;
        maxQty?: number | null;
    }[];

    // Step 5 — Portfolio
    featuredImage?: string;
    images?: string[];
    videoLinks?: string[];
    previousWorkLinks?: string[];

    // Step 6 — Documents
    businessDocs?: {
        registrationCertificate?: string;
        msme?: string;
        gst?: string;
        pan?: string;
        tradeLicense?: string;
        fssai?: string;
    };

    ownerDocs?: {
        aadhaarFront?: string;
        aadhaarBack?: string;
        pan?: string;
        selfie?: string;
    };

    // Step 7 — Bank
    bankDetails?: {
        accountHolderName?: string;
        accountNumber?: string;
        ifsc?: string;
        bankName?: string;
        branchName?: string;
        accountType?: 'savings' | 'current';
        upiId?: string;
        proof?: string;
    };

    // Step 8 — Availability
    availability?: {
        day?: string;
        isAvailable?: boolean;
        startTime?: string;
        endTime?: string;
    }[];

    publicHoliday?: {
        isAvailable?: boolean;
        startTime?: string;
        endTime?: string;
    };

    advanceBooking?: 'same-day' | '24h' | '48h' | '1week' | 'custom';
    customAdvanceDays?: number;

    // Confirmation Deadline
    confirmationHours?: number;

    // Terms
    termsAccepted?: boolean;

    // Status
    status?:
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'
    | 'resubmitted';

    rejectionReason?: string;

    rejectionHistory?: {
        reason?: string;
        rejectedAt?: Date | string;
        rejectedBy?: string;
    }[];

    resubmittedAt?: Date | string;
    currentStep?: number;

    // Stats
    totalEnquiries?: number;
    totalBookings?: number;
    isActive?: boolean;

    // Owner-blocked Dates
    blockedDates?: {
        date: Date | string;
        reason?: string;
    }[];

    // Audit Status History
    statusHistory?: {
        action?: string;
        status?: string;
        isActive?: boolean;
        reason?: string;
        changedBy?: {
            userId?: string;
            name?: string;
            email?: string;
            role?: string;
        };
        ipAddress?: string;
        timestamp?: Date | string;
    }[];

    // Timestamps
    createdAt?: Date | string;
    updatedAt?: Date | string;
}
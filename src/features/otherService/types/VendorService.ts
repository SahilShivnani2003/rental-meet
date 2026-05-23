export interface VendorService {
    _id?: string;

    vendor: string;

    contactInfo?: {
        fullName?: string;
        primaryMobile?: string;
        secondaryMobile?: string;
        role?: 'owner' | 'manager' | 'representative';
    };

    title: string;
    category: string;
    companyName?: string;
    brandName?: string;
    experienceYears?: number;
    description?: string;
    specialization?: string;
    tags?: string[];

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

    startingPrice?: number;
    minimumOrderPrice?: number;
    packages?: {
        sno?: number;
        name?: string;
        price?: number;
        unit?: string;
        quantity?: number;
    }[];

    featuredImage?: string;
    images?: string[];
    videoLinks?: string[];
    previousWorkLinks?: string[];

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

    termsAccepted?: boolean;

    status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended' | 'resubmitted';
    rejectionReason?: string;
    rejectionHistory?: {
        reason?: string;
        rejectedAt?: Date;
        rejectedBy?: string;
    }[];

    resubmittedAt?: Date;
    currentStep?: number;

    totalEnquiries?: number;
    totalBookings?: number;
    isActive?: boolean;

    blockedDates?: {
        date: Date;
        reason?: string;
    }[];

    createdAt?: Date;
    updatedAt?: Date;
}
export interface VendorProfile {
    _id?: string;

    user: string;

    basicInfo?: {
        fullName?: string;
        primaryMobile?: string;
        secondaryMobile?: string;
        role?: 'owner' | 'manager' | 'representative';
    };

    businessInfo?: {
        companyName?: string;
        brandName?: string;
        experienceYears?: number;
        category?: string;
        description?: string;
        specialization?: string;
    };

    address?: {
        officeAddress?: string;
        state?: string;
        city?: string;
        area?: string;
        village?: string;
        pincode?: string;
        serviceableAreas?: string[];
    };

    online?: {
        website?: string;
        instagram?: string;
        facebook?: string;
    };

    pricing?: {
        startingPrice?: number;
        minimumOrderPrice?: number;
        packages?: {
            serviceName?: string;
            rate?: number;
            unit?: string;
            quantity?: number;
        }[];
    };

    portfolio?: {
        featuredImage?: string;
        serviceImages?: string[];
        videoLinks?: string[];
        previousWorkLinks?: string[];
    };

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

    bookingPolicy?: {
        advanceBooking?: 'same-day' | '24h' | '48h' | '1week' | 'custom';
    };

    termsAccepted?: boolean;

    status?: 'incomplete' | 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    submittedAt?: Date;
    approvedAt?: Date;

    onboardingStep?: number;

    createdAt?: Date;
    updatedAt?: Date;
}
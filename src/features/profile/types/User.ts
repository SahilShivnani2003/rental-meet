export interface User {
    _id?: string;
    userId?: string;

    name: string;
    email: string;
    phone: string;
    alternatePhone?: string;

    role?:
    | 'owner'
    | 'admin'
    | 'subadmin'
    | 'customer'
    | 'employee'
    | 'vendor'
    | 'ambassador';

    password?: string;

    resetPasswordToken?: string;
    resetPasswordExpire?: Date;

    address?: string;
    city?: string;
    state?: string;
    pincode?: string;

    profilePicture?: string;

    isActive?: boolean;
    isDeleted?: boolean;
    deletedAt?: Date | null;

    // KYC
    kyc?: {
        idProof?: string | null;
        idProofBack?: string | null;
        idProofType?:
        | 'Aadhaar'
        | 'PAN'
        | 'Passport'
        | 'Voter ID'
        | 'Driving License'
        | null;
        selfie?: string | null;
        addressProof?: string | null;
        verifiedAt?: Date | null;
    };

    // SubAdmin Permissions
    permissions?: {
        dashboard?: boolean;

        // Venues
        venues?: boolean;
        venueTypes?: boolean;
        bookings?: boolean;
        payments?: boolean;
        coupons?: boolean;
        quotations?: boolean;

        // Vendors
        vendorServices?: boolean;
        vendorPayments?: boolean;
        vendorCoupons?: boolean;
        serviceBookings?: boolean;
        serviceQuotations?: boolean;

        // System
        heroSlides?: boolean;
        users?: boolean;
        employees?: boolean;
        subadmins?: boolean;
        expenses?: boolean;
        revenue?: boolean;
        reports?: boolean;
        reviews?: boolean;
        platformSettings?: boolean;
        faqs?: boolean;
        chatbot?: boolean;
        settings?: boolean;
        notifications?: boolean;
        analytics?: boolean;
    };

    // Referral System
    referralCode?: string;

    referredBy?: string;
    referredByCode?: string;

    referralCount?: number;

    referrals: {
        user?: string;
        joinedAt?: Date;
    }[];

    // Account
    accountType?: 'individual' | 'company';

    // Vendor
    vendorCategory?: string;

    // GST / Business
    gstNumber?: string;
    companyName?: string;
    panNumber?: string;

    // Razorpay / Linked Account
    razorpayAccountId?: string;
    linkedAccountId?: string;
    razorpayAccountStatus?: string;
    razorpayAccountSyncedAt?: Date;

    // Employee
    employeeDetails?: {
        title?: 'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Prof';

        fatherOrHusbandName?: string;

        dateOfBirth?: Date;

        gender?: 'Male' | 'Female' | 'Other';

        maritalStatus?:
        | 'Single'
        | 'Married'
        | 'Divorced'
        | 'Widowed';

        bloodGroup?:
        | 'A+'
        | 'A-'
        | 'B+'
        | 'B-'
        | 'AB+'
        | 'AB-'
        | 'O+'
        | 'O-';

        // Qualification
        qualification?: {
            tenth?: {
                board?: string;
                year?: number;
                percentage?: number;
                certificate?: string;
            };

            twelfth?: {
                board?: string;
                year?: number;
                percentage?: number;
                certificate?: string;
            };

            graduation?: {
                degree?: string;
                university?: string;
                year?: number;
                percentage?: number;
                certificate?: string;
            };

            postGraduation?: {
                degree?: string;
                university?: string;
                year?: number;
                percentage?: number;
                certificate?: string;
            };
        };

        photo?: string;

        position?: string;

        department?: string;

        employmentType?: 'Permanent' | 'Contract';

        salary?: number;

        contractDetails?: {
            paymentType?: 'perLead' | 'overall';
            amount?: number;
        };

        joiningDate?: Date;

        reportingManager?: string;

        previousExperience?: number;

        // Employee Documents
        documents?: {
            aadhaarNumber?: string;
            aadhaarFront?: string;
            aadhaarBack?: string;

            panNumber?: string;
            panCard?: string;

            gstNumber?: string;
            companyName?: string;
        };

        // Bank
        bankDetails?: {
            accountHolderName?: string;
            accountNumber?: string;
            ifscCode?: string;
            bankName?: string;
            branchName?: string;
        };

        // Emergency Contact
        emergencyContact?: {
            name?: string;
            relationship?: string;
            phone?: string;
        };
    };

    createdAt?: Date;
    updatedAt?: Date;
}
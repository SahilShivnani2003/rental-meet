export interface User {
    _id?: string;

    userId?: string;

    name: string;
    email: string;
    phone: string;

    alternatePhone?: string;

    role?: 'owner' | 'admin' | 'subadmin' | 'customer' | 'employee' | 'vendor';

    password?: string;

    address?: string;
    city?: string;
    state?: string;
    pincode?: string;

    profilePicture?: string;

    isActive?: boolean;

    isDeleted?: boolean;
    deletedAt?: Date | null;

    kyc?: {
        idProof?: string | null;
        idProofBack?: string | null;
        idProofType?: 'Aadhaar' | 'PAN' | 'Passport' | 'Voter ID' | 'Driving License' | null;
        selfie?: string | null;
        verifiedAt?: Date | null;
    };

    permissions?: {
        dashboard?: boolean;
        heroSlides?: boolean;
        venues?: boolean;
        venueTypes?: boolean;
        users?: boolean;
        employees?: boolean;
        subadmins?: boolean;
        bookings?: boolean;
        payments?: boolean;
        reports?: boolean;
        reviews?: boolean;
        platformSettings?: boolean;
        settings?: boolean;
    };

    referralCode?: string;
    referredBy?: string;
    referredByCode?: string;
    referralCount?: number;

    referrals: {
        user?: string;
        joinedAt?: Date;
    }[];

    accountType?: 'individual' | 'company';

    vendorCategory?: string;

    gstNumber?: string;
    companyName?: string;
    panNumber?: string;

    employeeDetails?: {
        title?: 'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Prof';
        fatherOrHusbandName?: string;
        dateOfBirth?: Date;
        gender?: 'Male' | 'Female' | 'Other';
        maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
        bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

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

        documents?: {
            aadhaarNumber?: string;
            aadhaarFront?: string;
            aadhaarBack?: string;
            panNumber?: string;
            panCard?: string;
            gstNumber?: string;
            companyName?: string;
        };

        bankDetails?: {
            accountHolderName?: string;
            accountNumber?: string;
            ifscCode?: string;
            bankName?: string;
            branchName?: string;
        };

        emergencyContact?: {
            name?: string;
            relationship?: string;
            phone?: string;
        };
    };

    createdAt?: Date;
    updatedAt?: Date;
}

export interface UpdateUser {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstNumber?: string;
    companyName?: string;
    panNumber?: string;
}
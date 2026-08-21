export interface AmbassadorProfile {
    _id?: string;

    // User reference
    user: string;

    // Office ID assigned upon approval
    ambassadorId?: string;

    // Level & Badge
    assignedLevel?: 'LV.1' | 'LV.2' | 'LV.3' | 'LV.4';

    badge?:
    | 'Bronze Explorer'
    | 'Silver Champion'
    | 'Gold Master'
    | 'City Legend';

    // PART A: Personal Information
    personalInfo: {
        fullName: string;
        parentName?: string;
        dateOfBirth?: string;
        gender?: 'Male' | 'Female' | 'Other';
        mobileNumber: string;
        whatsAppNumber?: string;
        email: string;
        aadhaarNumber?: string;
        panNumber?: string;
    };

    // PART B: Address Details
    addressDetails: {
        currentAddress: string;
        city: string;
        district?: string;
        state: string;
        pincode?: string;
        areaCoverage: string;
    };

    // PART C: Professional Details
    professionalDetails?: {
        currentOccupation?: string;
        companyName?: string;
        educationQualification?: string;
        workExperience?: string;
        salesMarketingExperience?: boolean;
        digitalMarketingExperience?: boolean;
    };

    // PART D: Ambassador Profile
    profileType?:
    | 'Venue Explorer (Part-Time)'
    | 'Venue Champion'
    | 'City Venue Partner'
    | 'Full-Time Venue Acquisition Partner';

    preferredWorkingArea?: {
        cityCoverage?: string;
        districtCoverage?: string;
        stateCoverage?: string;
    };

    // PART E: Venue Network Information
    venueNetwork?: {
        hotels?: boolean;
        meetingRooms?: boolean;
        conferenceHalls?: boolean;
        trainingCentres?: boolean;
        coachingInstitutes?: boolean;
        banquetHalls?: boolean;
        marriageGardens?: boolean;
        farmHouses?: boolean;
        coworkingSpaces?: boolean;
        schoolsColleges?: boolean;
    };

    // PART F: Expected Performance
    expectedPerformance?: {
        venuesPerDay?: string;
        venuesPerMonth?: string;
        preferredWorkingTime?: string;
        preferredAreaCoverage?: string;
    };

    // PART G: Bank Details
    bankDetails?: {
        accountHolderName?: string;
        bankName?: string;
        accountNumber?: string;
        ifscCode?: string;
        upiId?: string;
    };

    // PART H: Referral Information
    referralInfo?: {
        referredByAmbassadorId?: string;
        referralCode?: string;
    };

    // PART I: Document Upload
    documents?: {
        passportPhoto?: string;
        aadhaarFront?: string;
        aadhaarBack?: string;
        panCard?: string;
        identityProof?: string;
        identityProofBack?: string;
        identityProofType?:
        | 'Aadhaar'
        | 'PAN'
        | 'Voter ID'
        | 'Driving License'
        | 'Passport';
        bankProof?: string;
        addressProof?: string;
    };

    // PART J: Declaration
    declaration?: {
        agreed?: boolean;
        applicantSignatureName?: string;
        date?: Date;
        place?: string;
    };

    // Office & Admin Status
    applicationStatus?: 'pending' | 'approved' | 'rejected';

    cityPartnerCode?: string;

    verifiedBy?: string;

    verifiedAt?: Date;

    rejectionReason?: string;

    // Earning & Performance Metrics
    walletBalance?: number;

    totalEarnings?: number;

    totalVenuesSubmitted?: number;

    totalVenuesApproved?: number;

    totalVenuesRejected?: number;

    // 25% 1-Year Recurring Profit Share
    profitShareUnlocked?: boolean;

    profitShareUnlockedAt?: Date;

    profitShareExpiresAt?: Date;

    // Challenge Streaks
    dailyStreak?: {
        date?: string;
        approvedCount?: number;
        bonusAwarded?: boolean;
    };

    weeklyStreak?: {
        weekStart?: string;
        approvedCount?: number;
        bonusAwarded?: boolean;
    };

    monthlyStreak?: {
        month?: string;
        approvedCount?: number;
        bonusAwarded?: boolean;
    };

    createdAt?: Date;
    updatedAt?: Date;
}
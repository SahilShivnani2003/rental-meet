
// ── Ambassador profile API types ──────────────────────────────────────────────

export interface PersonalInfo {
    fullName: string;
    parentName: string;
    dateOfBirth: string;
    gender: string;
    mobileNumber: string;
    whatsAppNumber: string;
    email: string;
    aadhaarNumber: string;
    panNumber: string;
}

export interface AddressDetails {
    currentAddress: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    areaCoverage: string;
}

export interface ProfessionalDetails {
    currentOccupation: string;
    companyName: string;
    educationQualification: string;
    workExperience: string;
    salesMarketingExperience: boolean;
    digitalMarketingExperience: boolean;
}

export interface PreferredWorkingArea {
    cityCoverage: string;
    districtCoverage: string;
    stateCoverage: string;
}

export interface VenueNetwork {
    hotels: boolean;
    meetingRooms: boolean;
    conferenceHalls: boolean;
    trainingCentres: boolean;
    coachingInstitutes: boolean;
    banquetHalls: boolean;
    marriageGardens: boolean;
    farmHouses: boolean;
    coworkingSpaces: boolean;
    schoolsColleges: boolean;
}

export interface ExpectedPerformance {
    venuesPerDay: string;
    venuesPerMonth: string;
    preferredWorkingTime: string;
    preferredAreaCoverage: string;
}

export interface BankDetails {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
}

export interface ReferralInfo {
    referredByAmbassadorId: string;
    referralCode: string;
}

export interface AmbassadorDocuments {
    passportPhoto: string;
    aadhaarFront: string;
    aadhaarBack: string;
    panCard: string;
    identityProof: string;
    identityProofBack: string;
    identityProofType: string;
    bankProof: string;
    addressProof: string;
}

export interface Declaration {
    agreed: boolean;
    applicantSignatureName: string;
    place: string;
    date: string;
}

export interface StreakInfo {
    date?: string;
    weekStart?: string;
    month?: string;
    approvedCount: number;
    bonusAwarded: boolean;
}

export type ApplicationStatus =
    | 'pending'
    | 'approved'
    | 'rejected'
    | (string & {});

export interface AmbassadorStatusHistory {
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
    timestamp?: string;
}

export interface AmbassadorProfile {
    _id: string;
    user: string;

    // Office ID
    ambassadorId: string;

    // Level & Badge
    assignedLevel: string;
    badge: string;

    // Profile
    profileType: string;

    // Application Status
    applicationStatus: ApplicationStatus;
    isActive: boolean;
    deactivatedAt?: string;
    deactivationReason?: string;
    cityPartnerCode?: string;
    rejectionReason?: string;

    // Verification
    verifiedAt?: string;
    verifiedBy?: string;

    // Status Audit History
    statusHistory?: AmbassadorStatusHistory[];

    // Earnings & Performance
    walletBalance: number;
    totalEarnings: number;
    totalVenuesSubmitted: number;
    totalVenuesApproved: number;
    totalVenuesRejected: number;

    // Profit Share
    profitShareUnlocked: boolean;
    profitShareUnlockedAt?: string;
    profitShareExpiresAt?: string;

    // Profile Sections
    personalInfo: PersonalInfo;
    addressDetails: AddressDetails;
    professionalDetails: ProfessionalDetails;
    preferredWorkingArea: PreferredWorkingArea;
    venueNetwork: VenueNetwork;
    expectedPerformance: ExpectedPerformance;
    bankDetails: BankDetails;
    referralInfo: ReferralInfo;
    documents: AmbassadorDocuments;
    declaration: Declaration;

    // Challenge Streaks
    dailyStreak: StreakInfo;
    weeklyStreak: StreakInfo;
    monthlyStreak: StreakInfo;

    // Timestamps
    createdAt: string;
    updatedAt: string;
    __v?: number;
}

export interface AmbassadorUser {
    _id: string;
    name: string;
    email: string;
    phone: string;
    referralCode: string;
}

// GET /ambassador/profile response
export interface GetAmbassadorProfileResponse {
    success: boolean;
    profile: AmbassadorProfile;
    user: AmbassadorUser;
}

// Update Ambassador Profile Payload
export interface UpdateAmbassadorProfilePayload {
    personalInfo?: Partial<
        Pick<
            PersonalInfo,
            | 'fullName'
            | 'dateOfBirth'
            | 'gender'
            | 'whatsAppNumber'
            | 'email'
            | 'aadhaarNumber'
        >
    >;

    profileType?: string;

    addressDetails?: Partial<
        Pick<
            AddressDetails,
            | 'currentAddress'
            | 'areaCoverage'
            | 'city'
            | 'state'
            | 'pincode'
        >
    >;

    professionalDetails?: Partial<
        Pick<
            ProfessionalDetails,
            'currentOccupation' | 'companyName'
        >
    >;

    bankDetails?: Partial<BankDetails>;
}
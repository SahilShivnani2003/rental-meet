// ── Ambassador profile API types ──────────────────────────────────────────────
// Mirrors the exact shape returned by GET /ambassador/profile.

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
    approvedCount: number;
    bonusAwarded: boolean;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | (string & {});

export interface AmbassadorProfile {
    _id: string;
    user: string;
    ambassadorId: string;
    assignedLevel: string;
    badge: string;
    profileType: string;
    applicationStatus: ApplicationStatus;

    walletBalance: number;
    totalEarnings: number;
    totalVenuesSubmitted: number;
    totalVenuesApproved: number;
    totalVenuesRejected: number;
    profitShareUnlocked: boolean;

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

    dailyStreak: StreakInfo;
    weeklyStreak: StreakInfo;
    monthlyStreak: StreakInfo;

    createdAt: string;
    updatedAt: string;
    verifiedAt?: string;
    verifiedBy?: string;
    __v?: number;
}

export interface AmbassadorUser {
    _id: string;
    name: string;
    email: string;
    phone: string;
    referralCode: string;
}

// Shape returned by the profile-fetch endpoint / hook.
export interface GetAmbassadorProfileResponse {
    success: boolean;
    profile: AmbassadorProfile;
    user: AmbassadorUser;
}

// Nested partial payload sent back on save — mirrors the editable
// sub-objects on AmbassadorProfile so the update endpoint can merge them.
export interface UpdateAmbassadorProfilePayload {
    personalInfo?: Partial<
        Pick<PersonalInfo, 'fullName' | 'dateOfBirth' | 'gender' | 'whatsAppNumber' | 'email' | 'aadhaarNumber'>
    >;
    profileType?: string;
    addressDetails?: Partial<
        Pick<AddressDetails, 'currentAddress' | 'areaCoverage' | 'city' | 'state' | 'pincode'>
    >;
    professionalDetails?: Partial<Pick<ProfessionalDetails, 'currentOccupation' | 'companyName'>>;
    bankDetails?: Partial<BankDetails>;
}
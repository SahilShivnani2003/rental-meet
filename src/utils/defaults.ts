import { AmbassadorRegistration } from '@/types/ambassador.types';

export function createEmptyAmbassadorForm(): AmbassadorRegistration {
    return {
        name: '',
        email: '',
        phone: '',
        password: '',

        personalInfo: {
            fullName: '',
            dateOfBirth: '',
            gender: 'Male',
            mobileNumber: '',
            whatsAppNumber: '',
            email: '',
            aadhaarNumber: '',
            panNumber: '',
        },

        addressDetails: {
            currentAddress: '',
            city: '',
            district: '',
            state: '',
            pincode: '',
            areaCoverage: '',
        },

        professionalDetails: {
            currentOccupation: '',
            companyName: '',
            educationQualification: '',
            workExperience: '',
            salesMarketingExperience: false,
            digitalMarketingExperience: false,
        },

        profileType: 'Venue Explorer (Part-Time)',

        preferredWorkingArea: {
            cityCoverage: '',
            districtCoverage: '',
            stateCoverage: '',
        },

        venueNetwork: {
            hotels: false,
            meetingRooms: false,
            conferenceHalls: false,
            trainingCentres: false,
            coachingInstitutes: false,
            banquetHalls: false,
            marriageGardens: false,
            farmHouses: false,
            coworkingSpaces: false,
            schoolsColleges: false,
        },

        expectedPerformance: {
            venuesPerDay: '1-2 Venues',
            venuesPerMonth: '20-50 Venues (LV.1)',
            // Not present in any provided screenshot — defaulted, no UI collects these.
            preferredWorkingTime: '',
            preferredAreaCoverage: '',
        },

        bankDetails: {
            accountHolderName: '',
            bankName: '',
            accountNumber: '',
            ifscCode: '',
            upiId: '',
        },

        documents: {
            passportPhoto: '',
            aadhaarFront: '',
            aadhaarBack: '',
            panCard: '',
            // Not present in any provided screenshot — defaulted, no UI collects these.
            identityProof: '',
            identityProofBack: '',
            identityProofType: '',
            bankProof: '',
            addressProof: '',
        },

        declaration: {
            agreed: false,
            applicantSignatureName: '',
            place: '',
        },

        referredBy: '',
    };
}

export const PROFILE_TYPE_OPTIONS = [
    'Venue Explorer (Part-Time)',
    'Venue Explorer (Full-Time)',
    'Field Ambassador',
    'Corporate Tie-up Specialist',
];

export const VENUES_PER_DAY_OPTIONS = ['1-2 Venues', '3-5 Venues', '6-10 Venues', '10+ Venues'];

export const VENUES_PER_MONTH_OPTIONS = [
    '20-50 Venues (LV.1)',
    '51-100 Venues (LV.2)',
    '101-200 Venues (LV.3)',
    '200+ Venues (LV.4)',
];

export const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

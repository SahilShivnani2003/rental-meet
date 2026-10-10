export interface AmbassadorAddVenue {
    businessName: string;
    description: string;
    venueType: string[];
    foodType: 'Veg' | 'Non Veg' | 'Both';
    capacity: string;
    areaSqft: number;
    termsAccepted: boolean;
    listingSource: string;
    onboardingPhase: number;
    isProvisional: boolean;

    ownerInfo: {
        fullName: string;
        mobile: string;
        email: string;
        authorisedPerson: {
            name: string;
            fullName: string;
            phone: string;
            mobile: string;
            email: string;
        };
    };
    location: {
        address: string;
        landmark: string;
        state: string;
        city: string;
        area: string;
        pincode: string;
        googleMapLink: string;
        parkingAvailability: 'Free' | 'Paid' | 'Limited' | 'None';
        parkingDetails: {
            type: 'Free' | 'Paid' | 'Limited' | 'None';
            carsCapacity: number;
            twoWheelerCapacity: number;
            carCharges: number;
            twoWheelerCharges: number;
        };
    };
    pricing: {
        selectedPricingModels: PricingModel[];
        onlyRent: RentPricing;
        rentWithAmenities: RentPricing;
        perPax: PerPaxPricing;
    };
    images: {
        url: string;
        category: string;
        isFeatured: boolean;
    }[];
}


export type PricingModel =
    | 'onlyRent'
    | 'rentWithAmenities'
    | 'perPax';

export interface RentPricing {
    hourly: RentRate;
    halfDay: RentRate;
    fullDay: RentRate;
}

export interface RentRate {
    rate: number;
    extraPerHour: number;
}

export interface PerPaxPricing {
    withoutFood: PaxRate;
    breakfastOnly: PaxRate;
    breakfastLunch: PaxRate;
    lunchOnly: PaxRate;
    dinnerOnly: PaxRate;
    allMeals: PaxRate;
}

export interface PaxRate {
    rate: number;
    minPax: number;
}
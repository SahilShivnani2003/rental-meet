export interface RegisterClient {
    name: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    password: string;
    role: 'customer'
    referralCode?: string;
    deviceId?: string;
}

export interface RegisterVendor {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'vendor';
    referralCode?: string;
    city: string;
    state: string;
    deviceId?: string;
    vendorCategory: string;
}

export interface RegisterOwner {
    name: string;
    email: string;
    phone: string;
    password: string;
    city: string;
    state: string;
    role: 'owner';
    referralCode?: string;
    deviceId?: string;
    venueData: {
        businessName: string;
        description: string;
        venueType: string[];
        capacity: string;
        areaSqft: number;
        foodType?: 'Veg' | 'Non Veg' | 'Both';
        location: {
            address: string;
            landmark?: string;
            state: string;
            city: string;
            area: string;
            pincode: string;
            googleMapLink?: string;
            parkingAvailability?: 'Available' | 'Not Available' | 'Free' | 'Paid';
            parkingDetails?: {
                type: 'Free' | 'Paid' | 'Both' | 'None';
                carsCapacity?: number;
                twoWheelerCapacity?: number;
                carCharges?: number;
                twoWheelerCharges?: number;
            };
        };
        parkingDetails?: {
            type: 'Free' | 'Paid' | 'Both' | 'None';
            cars: {
                capacity: number;
                isChargeable: boolean;
                chargePerVehicle?: number;
            };
            twoWheelers: {
                capacity: number;
                isChargeable: boolean;
                chargePerVehicle?: number;
            };
        };
        pricing: {
            enabledOptions: {
                perHour: boolean;
                halfDay: boolean;
                fullDay: boolean;
            };
            selectedPricingModels: (
                | 'onlyRent'
                | 'perPax'
                | 'rentWithAmenities'
            )[];
            onlyRent?: {
                hourly?: { rate: number };
                halfDay?: { rate: number };
                fullDay?: { rate: number };
            };
            rentWithAmenities?: {
                hourly?: { rate: number };
                halfDay?: { rate: number };
                fullDay?: { rate: number };
            };
            perPax?: {
                withoutFood?: { rate: number; minPax: number };
                breakfastOnly?: { rate: number; minPax: number };
                breakfastLunch?: { rate: number; minPax: number };
                lunchOnly?: { rate: number; minPax: number };
                dinnerOnly?: { rate: number; minPax: number };
                allMeals?: { rate: number; minPax: number };
            };
        };
        images: {
            url: string;
            category: string;
            isFeatured: boolean;
        }[];
    };
}
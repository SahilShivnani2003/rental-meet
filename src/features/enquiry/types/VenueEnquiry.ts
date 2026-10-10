
export interface VenueEnquiry {
    _id?: string;
    enquiryNumber?: string;

    // References
    venue: string;
    customer?: string;

    // Customer information
    customerDetails: {
        name: string;
        email: string;
        phone: string;
        company?: string;
        address?: string;
        gstin?: string;
        eventType?: string;
        guestCount?: number;
        specialRequirements?: string;
    };

    // Booking information
    bookingDetails: {
        date: Date | string;
        bookingDate?: string;
        startTime: string;
        endTime?: string;
        duration: string;
        bookingType?: string;
        guests?: number;
        purpose?: string;
        specialRequests?: string;
    };

    // Selected venue amenities
    selectedAmenities?: {
        basic?: unknown[];
        beverages?: unknown[];
        refreshmentFood?: unknown[];
        lunchThalis?: unknown[];
        additional?: unknown[];
        [key: string]: unknown;
    };

    // Pricing information
    priceBreakdown?: Record<string, unknown>;

    estimatedAmount?: number;

    // Enquiry status
    status?: 'pending' | 'contacted' | 'converted' | 'cancelled';

    // Converted booking reference
    convertedBookingId?: string;

    notes?: string;

    // Mongoose timestamps
    createdAt?: Date | string;
    updatedAt?: Date | string;
}
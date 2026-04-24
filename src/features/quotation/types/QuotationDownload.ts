export interface QuotationDownload {
    _id?: string;

    venue: string;
    customer?: string;

    action?: 'download' | 'print';

    quotationNumber?: string;
    totalAmount?: number;

    venueSnapshot?: {
        businessName?: string;
        sku?: string;
        city?: string;
        state?: string;
        address?: string;
        capacity?: number;
    };

    customerSnapshot?: {
        name?: string;
        email?: string;
        phone?: string;
        eventType?: string;
        guestCount?: number;
        specialRequirements?: string;
    };

    bookingSnapshot?: {
        date?: string;
        startTime?: string;
        endTime?: string;
        duration?: string;
        bookingType?: string;
    };

    priceSnapshot?: {
        basePrice?: number;
        amenitiesTotal?: number;
        subtotal?: number;
        gst?: number;
        platformFee?: number;
        platformFeeGST?: number;
        discount?: number;
        grandTotal?: number;
    };

    downloadedAt?: Date;

    createdAt?: Date;
    updatedAt?: Date;
}
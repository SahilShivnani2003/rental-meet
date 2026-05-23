export interface ServiceQuotationDownload {
    _id?: string;

    serviceBooking?: string;
    service?: string;
    vendor?: string;
    customer?: string;

    quotationNumber?: string;

    action?: 'download' | 'print';

    totalAmount?: number;

    serviceSnapshot?: {
        title?: string;
        category?: string;
        companyName?: string;
        city?: string;
        state?: string;
    };

    customerSnapshot?: {
        name?: string;
        email?: string;
        phone?: string;
        company?: string;
        eventName?: string;
    };

    eventDate?: Date;

    priceSnapshot?: {
        subtotal?: number;
        serviceCGST?: number;
        serviceSGST?: number;
        platformFee?: number;
        platformFeeGST?: number;
        discount?: number;
        couponCode?: string;
        total?: number;
    };

    downloadedAt?: Date;

    createdAt?: Date;
    updatedAt?: Date;
}
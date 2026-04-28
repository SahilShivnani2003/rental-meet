export interface ServiceBooking {
    _id?: string;

    service: string;
    vendor: string;
    customer?: string;

    quotationNumber?: string;
    bookingNumber?: string;

    eventDate: Date;

    customerInfo?: {
        name?: string;
        email?: string;
        phone?: string;
        company?: string;
        eventName?: string;
        notes?: string;
    };

    serviceSnapshot?: {
        title?: string;
        category?: string;
        companyName?: string;
        city?: string;
        state?: string;
    };

    items: {
        name?: string;
        price?: number;
        unit?: string;
        quantity?: number;
        amount?: number;
    }[];

    pricing?: {
        subtotal?: number;
        serviceCGST?: number;
        serviceSGST?: number;
        cgstPct?: number;
        sgstPct?: number;
        platformFee?: number;
        platformFeePct?: number;
        platformFeeGST?: number;
        total?: number;
    };

    status?: 'enquiry' | 'confirmed' | 'cancelled';

    paymentStatus?: 'pending' | 'paid' | 'failed';

    paymentDetails?: {
        razorpay_order_id?: string;
        razorpay_payment_id?: string;
        razorpay_signature?: string;
        paidAt?: Date;
    };

    amount?: number;

    coupon?: {
        couponId?: string;
        code?: string;
        discountAmount?: number;
    };

    downloadedAt?: Date;
    serviceId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
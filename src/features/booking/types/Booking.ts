import { Venue } from "@/features/venue/types/Venue";

export interface Booking {
    _id?: string;

    bookingNumber?: string;

    venue: string | Venue;
    customer?: string;

    bookingDate: Date;
    startTime: string;
    endTime: string;

    bookingType: 'hourly' | 'halfday' | 'fullday';

    amount: number;

    // ── Amenities ─────────────────────────────────────
    selectedAmenities: {
        basic: {
            name?: string;
            type?: string;
            rate?: number;
            rateType?: string;
            quantity?: number;
            total?: number;
        }[];

        beverages: {
            name?: string;
            ratePerUnit?: number;
            brand?: string;
            quantity?: number;
            total?: number;
        }[];

        refreshmentFood: {
            name?: string;
            ratePerPlate?: number;
            items?: string;
            quantity?: number;
            total?: number;
        }[];

        lunchThalis: {
            thaliType?: string;
            category?: string;
            ratePerPlate?: number;
            numberOfItems?: number;
            itemNames?: string;
            quantity?: number;
            total?: number;
        }[];

        additional: {
            name?: string;
            type?: string;
            charges?: number;
            quantity?: number;
            total?: number;
        }[];
    };

    amenitiesTotal?: number;

    // ── Price Breakdown ───────────────────────────────
    priceBreakdown?: {
        basePrice?: number;
        amenitiesTotal?: number;
        subtotal?: number;

        venueCGST?: number;
        venueCGSTRate?: number;
        venueSGST?: number;
        venueSGSTRate?: number;
        gst?: number;
        gstRate?: number;

        platformFee?: number;
        platformFeeRate?: number;
        platformFeeCGST?: number;
        platformFeeCGSTRate?: number;
        platformFeeSGST?: number;
        platformFeeSGSTRate?: number;
        platformFeeGST?: number;
        platformFeeTotal?: number;

        discount?: number;
        couponCode?: string;
        total?: number;
    };

    // ── Coupon ───────────────────────────────────────
    coupon?: {
        couponId?: string;
        code?: string;
        discountAmount?: number;
    };

    // ── Venue Invoice ────────────────────────────────
    venueInvoice?: {
        invoiceNumber?: string;
        amount?: number;
        cgst?: number;
        cgstRate?: number;
        sgst?: number;
        sgstRate?: number;
        total?: number;
        hsnCode?: string;
    };

    // ── Platform Invoice ─────────────────────────────
    platformInvoice?: {
        invoiceNumber?: string;
        platformFee?: number;
        platformFeeRate?: number;
        cgst?: number;
        cgstRate?: number;
        sgst?: number;
        sgstRate?: number;
        total?: number;
        hsnCode?: string;
    };

    // ── GST Snapshot ─────────────────────────────────
    gstSettingsSnapshot?: {
        venueCGST?: number;
        venueSGST?: number;
        venueHSN?: string;
        platformFeePercentage?: number;
        platformCGST?: number;
        platformSGST?: number;
    };

    // ── Customer Details ─────────────────────────────
    customerDetails?: {
        name?: string;
        email?: string;
        phone?: string;
        eventType?: string;
        guestCount?: number;
        specialRequirements?: string;
    };

    // ── Status ───────────────────────────────────────
    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';

    paymentStatus?: 'pending' | 'paid' | 'refunded';

    paymentId?: string;

    paymentDetails: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        paidAt: number;
    };

    cancellationReason?: string;

    cancelledBy?: string;

    confirmationDeadline?: Date;

    approveSoonUsed?: boolean;

    // ── Refund ───────────────────────────────────────
    refundDetails?: {
        refundId?: string;
        refundAmount?: number;
        refundStatus?: 'pending' | 'processed' | 'failed';
        refundedAt?: Date;
        refundReason?: string;
    };

    // ── Payment Ledger ───────────────────────────────
    paymentLedger?: {
        totalDue?: number;
        totalPaid?: number;
        amountDue?: number;
        refundDue?: number;

        transactions: {
            txnId?: string;
            type?: 'payment' | 'refund' | 'adjustment' | 'manual_payment' | 'manual_refund';
            amount?: number;
            status?: 'pending' | 'completed' | 'failed';
            note?: string;
            performedBy?: string;
            date?: Date;
        }[];

        adjustments: {
            oldAmount?: number;
            newAmount?: number;
            difference?: number;
            reason?: string;
            performedBy?: string;
            date?: Date;
        }[];
    };

    createdAt?: Date;
    updatedAt?: Date;
}

export interface ModifyBookingPayload {
    bookingDate: Date;
    startTime: string;
    endTime: string;

    bookingType: 'hourly' | 'halfday' | 'fullday';
    amount: number;
    selectedAmenities: {
        basic: {
            name?: string;
            type?: string;
            rate?: number;
            rateType?: string;
            quantity?: number;
            total?: number;
        }[];

        beverages: {
            name?: string;
            ratePerUnit?: number;
            brand?: string;
            quantity?: number;
            total?: number;
        }[];

        refreshmentFood: {
            name?: string;
            ratePerPlate?: number;
            items?: string;
            quantity?: number;
            total?: number;
        }[];

        lunchThalis: {
            thaliType?: string;
            category?: string;
            ratePerPlate?: number;
            numberOfItems?: number;
            itemNames?: string;
            quantity?: number;
            total?: number;
        }[];

        additional: {
            name?: string;
            type?: string;
            charges?: number;
            quantity?: number;
            total?: number;
        }[];
    };

    amenitiesTotal?: number;
    priceBreakdown?: {
        basePrice?: number;
        amenitiesTotal?: number;
        subtotal?: number;

        venueCGST?: number;
        venueCGSTRate?: number;
        venueSGST?: number;
        venueSGSTRate?: number;
        gst?: number;
        gstRate?: number;

        platformFee?: number;
        platformFeeRate?: number;
        platformFeeCGST?: number;
        platformFeeCGSTRate?: number;
        platformFeeSGST?: number;
        platformFeeSGSTRate?: number;
        platformFeeGST?: number;
        platformFeeTotal?: number;

        discount?: number;
        couponCode?: string;
        total?: number;
    };
    customerDetails?: {
        name?: string;
        email?: string;
        phone?: string;
        eventType?: string;
        guestCount?: number;
        specialRequirements?: string;
    };
}
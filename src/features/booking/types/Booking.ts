
import { Venue } from "@/features/venue/types/Venue";

export interface Booking {
    _id?: string;
    bookingNumber: string;

    venue: string | Venue;
    customer: string;

    bookingDate: Date | string;
    startTime: string;
    endTime: string;

    bookingType: 'hourly' | 'halfday' | 'fullday' | 'perpax' | 'custom';

    amount: number;
    ownerEarnings?: number;

    // ── Selected Amenities and Services ──────────────────
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

        parking?: {
            cars?: number;
            twoWheelers?: number;
            charges?: number;
        };
    };

    amenitiesTotal?: number;

    // ── Price Breakdown ──────────────────────────────────
    priceBreakdown?: {
        basePrice?: number;
        amenitiesTotal?: number;
        subtotal?: number;
        durationHours?: number;
        pricingModel?: string;
        perPaxPackage?: string;
        guestCount?: number;
        parkingCharges?: number;

        // Venue GST
        venueCGST?: number;
        venueCGSTRate?: number;
        venueSGST?: number;
        venueSGSTRate?: number;
        venueHSN?: string;
        gst?: number;
        gstRate?: number;

        // Platform Fee
        platformFee?: number;
        platformFeeSource?: string;
        platformFeeType?: 'fixed' | 'percentage';
        platformFeeValue?: number;
        platformFeeRate?: number;
        platformFeePercentage?: number;
        platformFeeCGST?: number;
        platformFeeCGSTRate?: number;
        platformFeeSGST?: number;
        platformFeeSGSTRate?: number;
        platformFeeGST?: number;
        platformFeeTotal?: number;

        // Discount and Total
        discount?: number;
        discountAppliesTo?: string;
        couponCode?: string;
        total?: number;
    };

    // ── Coupon ───────────────────────────────────────────
    coupon?: {
        couponId?: string;
        code?: string;
        appliesTo?: string;
        discountAmount?: number;
        isOwnerSponsored?: boolean;
    };

    // ── Venue Invoice ────────────────────────────────────
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

    // ── Platform Invoice ─────────────────────────────────
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

    // ── GST Settings Snapshot ────────────────────────────
    gstSettingsSnapshot?: {
        venueCGST?: number;
        venueSGST?: number;
        venueHSN?: string;
        platformFeeType?: string;
        platformFeeValue?: number;
        platformFeePercentage?: number;
        platformCGST?: number;
        platformSGST?: number;
    };

    // ── Customer Details ─────────────────────────────────
    customerDetails?: {
        name?: string;
        email?: string;
        phone?: string;
        eventType?: string;
        guestCount?: number;
        specialRequirements?: string;
        gstNumber?: string;
        companyName?: string;
    };

    // ── Booking Status ───────────────────────────────────
    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';

    paymentStatus?: 'pending' | 'paid' | 'refunded';
    paymentId?: string;

    paymentDetails?: {
        razorpay_order_id?: string;
        razorpay_payment_id?: string;
        razorpay_signature?: string;
        paidAt?: Date | string;
    };

    // ── Cancellation ─────────────────────────────────────
    cancellationReason?: string;
    cancelledBy?: string;

    cancelledByRole?: 'customer' | 'owner' | 'vendor' | 'admin' | 'system' | null;

    cancellationType?: 'auto' | 'manual';

    confirmationDeadline?: Date | string;
    approveSoonUsed?: boolean;

    // ── Refund Details ───────────────────────────────────
    refundDetails?: {
        refundId?: string;
        refundAmount?: number;
        refundStatus?: 'pending' | 'processed' | 'failed';
        refundedAt?: Date | string;
        refundReason?: string;
    };

    // ── Payout Settlement ────────────────────────────────
    settlementStatus?: 'unsettled' | 'settled' | 'failed';

    settlementDetails?: {
        transactionId?: string;
        settledAt?: Date | string;
        amount?: number;
        remarks?: string;
        settlementMethod?: 'automatic' | 'manual';
    };

    // ── Payment Ledger ───────────────────────────────────
    paymentLedger?: {
        totalDue?: number;
        totalPaid?: number;
        amountDue?: number;
        refundDue?: number;

        transactions?: {
            txnId?: string;
            type?:
            | 'payment'
            | 'refund'
            | 'adjustment'
            | 'manual_payment'
            | 'manual_refund';
            amount?: number;
            status?: 'pending' | 'completed' | 'failed';
            note?: string;
            performedBy?: string;
            date?: Date | string;
        }[];

        adjustments?: {
            oldAmount?: number;
            newAmount?: number;
            difference?: number;
            reason?: string;
            performedBy?: string;
            date?: Date | string;
        }[];
    };

    // ── Timestamps ───────────────────────────────────────
    createdAt?: Date | string;
    updatedAt?: Date | string;

    // ── Mongoose Helper Methods (optional) ────────────────
    generateInvoiceNumbers?: () => void;

    calculateGSTInvoices?: (
        gstSettings: {
            platformFeeType?: 'fixed' | 'percentage';
            platformFeeValue?: number;
            platformFeePercentage?: number;
            venueCGST: number;
            venueSGST: number;
            venueHSN?: string;
            platformCGST: number;
            platformSGST: number;
        }
    ) => {
        venueInvoice: Booking['venueInvoice'];
        platformInvoice: Booking['platformInvoice'];
        customerPays: number;
    };
}

// ── Modify Booking Payload ────────────────────────────────
export interface ModifyBookingPayload {
    bookingDate: Date | string;
    startTime: string;
    endTime: string;

    bookingType: 'hourly' | 'halfday' | 'fullday' | 'perpax' | 'custom';

    amount: number;

    selectedAmenities: Booking['selectedAmenities'];

    amenitiesTotal?: number;

    priceBreakdown?: Booking['priceBreakdown'];

    customerDetails?: Booking['customerDetails'];
}
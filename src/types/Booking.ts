export type BookingType = 'hourly' | 'halfday' | 'fullday';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export type RefundStatus = 'pending' | 'processed' | 'failed';

export type TransactionType =
  | 'payment'
  | 'refund'
  | 'adjustment'
  | 'manual_payment'
  | 'manual_refund';

export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface Booking {
  bookingNumber: string;

  venue: string;
  customer: string;

  bookingDate: string;
  startTime: string;
  endTime: string;

  bookingType: BookingType;

  amount: number;

  selectedAmenities?: {
    basic?: {
      name?: string;
      type?: string;
      rate?: number;
      rateType?: string;
      quantity: number;
      total?: number;
    }[];
    beverages?: {
      name?: string;
      ratePerUnit?: number;
      brand?: string;
      quantity: number;
      total?: number;
    }[];
    refreshmentFood?: {
      name?: string;
      ratePerPlate?: number;
      items?: string;
      quantity: number;
      total?: number;
    }[];
    lunchThalis?: {
      thaliType?: string;
      category?: string;
      ratePerPlate?: number;
      numberOfItems?: number;
      itemNames?: string;
      quantity: number;
      total?: number;
    }[];
    additional?: {
      name?: string;
      type?: string;
      charges?: number;
      quantity: number;
      total?: number;
    }[];
  };

  amenitiesTotal: number;

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

  coupon?: {
    couponId?: string;
    code?: string;
    discountAmount?: number;
  };

  venueInvoice?: {
    invoiceNumber?: string;
    amount?: number;
    cgst?: number;
    cgstRate?: number;
    sgst?: number;
    sgstRate?: number;
    total?: number;
    hsnCode: string;
  };

  platformInvoice?: {
    invoiceNumber?: string;
    platformFee?: number;
    platformFeeRate?: number;
    cgst?: number;
    cgstRate?: number;
    sgst?: number;
    sgstRate?: number;
    total?: number;
    hsnCode: string;
  };

  gstSettingsSnapshot?: {
    venueCGST?: number;
    venueSGST?: number;
    venueHSN?: string;
    platformFeePercentage?: number;
    platformCGST?: number;
    platformSGST?: number;
  };

  customerDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    eventType?: string;
    guestCount?: number;
    specialRequirements?: string;
  };

  status: BookingStatus;

  paymentStatus: PaymentStatus;

  paymentId?: string;

  paymentDetails?: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    paidAt?: string;
  };

  cancellationReason?: string;

  cancelledBy?: string;

  confirmationDeadline?: string;

  approveSoonUsed: boolean;

  refundDetails?: {
    refundId?: string;
    refundAmount?: number;
    refundStatus?: RefundStatus;
    refundedAt?: string;
    refundReason?: string;
  };

  paymentLedger?: {
    totalDue: number;
    totalPaid: number;
    amountDue: number;
    refundDue: number;

    transactions?: {
      txnId?: string;
      type?: TransactionType;
      amount?: number;
      status?: TransactionStatus;
      note?: string;
      performedBy?: string;
      date: string;
    }[];

    adjustments?: {
      oldAmount?: number;
      newAmount?: number;
      difference?: number;
      reason?: string;
      performedBy?: string;
      date: string;
    }[];
  };

  createdAt: string;
  updatedAt: string;
}
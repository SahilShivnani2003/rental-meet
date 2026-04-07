export type DiscountType = 'percentage' | 'fixed';

export interface CouponUsage {
    user?: string;
    booking?: string;
    discountAmount?: number;
    usedAt: string;
}

export interface Coupon {
    code: string;

    venue: string;
    owner: string;

    discountType: DiscountType;
    discountValue: number;

    maxDiscount: number | null;

    minBookingAmount: number;

    maxUses: number | null;
    usedCount: number;

    expiryDate: string | null;

    isActive: boolean;

    activatedAt: string;
    deactivatedAt: string | null;

    usages?: CouponUsage[];

    createdAt: string;
    updatedAt: string;
}
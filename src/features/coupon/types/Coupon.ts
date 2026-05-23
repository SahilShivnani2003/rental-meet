export interface Coupon {
    _id?: string;

    code: string;

    venue?: string | null;
    service?: string | null;
    serviceVendor?: string | null;
    owner?: string | null;

    discountType: 'percentage' | 'fixed';
    discountValue: number;

    appliesTo?: 'total' | 'platformFee' | 'amenities' | 'baseAmount';

    maxDiscount?: number | null;
    minBookingAmount?: number;
    maxUses?: number | null;
    usedCount?: number;

    expiryDate?: Date | null;

    isActive?: boolean;
    activatedAt?: Date;
    deactivatedAt?: Date | null;

    usages: {
        user?: string;
        booking?: string;
        discountAmount?: number;
        usedAt?: Date;
    }[];

    quotationNumber?: string;

    downloads: {
        downloadedBy?: string;
        downloadedAt?: Date;
        role?: 'owner' | 'admin' | 'customer';
        venueSnapshot?: {
            businessName?: string;
            sku?: string;
            city?: string;
            state?: string;
        };
    }[];

    createdAt?: Date;
    updatedAt?: Date;
}
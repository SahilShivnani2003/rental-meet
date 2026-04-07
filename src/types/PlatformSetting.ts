export type PlatformFeeType = 'fixed' | 'percentage';

export interface PlatformSettings {
    // Venue GST
    venueCGST: number;
    venueSGST: number;
    venueHSN: string;

    // Platform Fee
    platformFeeType: PlatformFeeType;
    platformFeePercentage: number;
    platformCGST: number;
    platformSGST: number;

    // Signatures
    gstInvoiceSignature: string | null;
    platformInvoiceSignature: string | null;

    // Legacy
    gstRate: number;
    platformFeeValue: number;
    commissionRate: number;

    updatedBy?: string;

    createdAt: string;
    updatedAt: string;
}
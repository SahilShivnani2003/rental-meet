export interface PlatformSettings {
    venueCGST: number;
    venueSGST: number;
    venueHSN?: string;

    platformFeeType?: 'fixed' | 'percentage';
    platformFeePercentage: number;
    platformCGST: number;
    platformSGST: number;

    gstInvoiceSignature?: string | null;
    platformInvoiceSignature?: string | null;

    serviceCGST?: number;
    serviceSGST?: number;
    serviceHSN?: string;
    servicePlatformFee?: number;

    serviceCategoryRates: {
        category: string;
        cgst?: number;
        sgst?: number;
        platformFee?: number;
        platformCGST?: number;
        platformSGST?: number;
        hsn?: string;
    }[];

    gstRate?: number;
    platformFeeValue?: number;
    commissionRate?: number;

    updatedBy?: string;

    createdAt?: Date;
    updatedAt?: Date;
}
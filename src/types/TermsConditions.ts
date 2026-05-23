export interface TermsConditions {
    _id?: string;

    bookingTerms: {
        point: string;
        order: number;
    }[];

    cancellationPolicy?: string;
    paymentTerms?: string;
    quotationValidity?: number;
    venueOnboardingTerms?: string;

    updatedBy?: string;

    createdAt?: Date;
    updatedAt?: Date;
}
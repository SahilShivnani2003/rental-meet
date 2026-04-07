export interface BookingTerm {
  point: string;
  order: number;
}

export interface TermsConditions {
  bookingTerms: BookingTerm[];

  cancellationPolicy: string;
  paymentTerms: string;

  quotationValidity: number;

  updatedBy?: string;

  createdAt: string;
  updatedAt: string;
}
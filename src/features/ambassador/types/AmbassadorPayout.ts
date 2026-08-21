export interface AmbassadorPayout {
    _id?: string;

    payoutNumber: string;

    // References
    ambassador: string;
    profile?: string;

    // Payout amount
    amount: number;

    // Payout method
    payoutMethod:
    | 'UPI'
    | 'Bank Transfer'
    | 'upi'
    | 'bank'
    | 'bank_transfer'
    | 'Bank'
    | 'upi_transfer';

    // Payout details
    payoutDetails?: {
        upiId?: string;
        accountHolderName?: string;
        bankName?: string;
        accountNumber?: string;
        ifscCode?: string;
    };

    // Payout status
    status?: 'pending' | 'processing' | 'completed' | 'rejected';

    transactionReference?: string;

    rejectionReason?: string;

    // Admin/User who processed the payout
    processedBy?: string;

    processedAt?: Date;

    notes?: string;

    createdAt?: Date;
    updatedAt?: Date;
}
export interface VenueReview {
    _id?: string;

    venue: string;
    user: string;
    booking?: string | null;

    rating: number;
    title: string;
    comment: string;

    images?: {
        url?: string;
        caption?: string;
    }[];

    helpful?: string[];
    helpfulCount?: number;

    status?: 'pending' | 'approved' | 'rejected';

    response?: {
        text?: string;
        respondedBy?: string;
        respondedAt?: Date;
    };

    createdAt?: Date;
    updatedAt?: Date;
}
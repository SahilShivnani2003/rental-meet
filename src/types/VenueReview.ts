export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewImage {
    url?: string;
    caption?: string;
}

export interface ReviewResponse {
    text?: string;
    respondedBy?: string;
    respondedAt?: string;
}

export interface VenueReview {
    venue: string;
    user: string;
    booking: string | null;

    rating: number;

    title: string;
    comment: string;

    images?: ReviewImage[];

    helpful?: string[];
    helpfulCount: number;

    status: ReviewStatus;

    response?: ReviewResponse;

    createdAt: string;
    updatedAt: string;
}
export interface AmbassadorReward {
    _id?: string;

    ambassador: string;

    profile?: string;

    rewardType:
    | 'listing_reward'
    | 'daily_challenge'
    | 'weekly_streak'
    | 'monthly_champion'
    | 'booking_revenue_share'
    | 'monthly_award'
    | 'referral_bonus';

    venue?: string;

    booking?: string;

    amount: number;

    description: string;

    levelAtReward?: 'LV.1' | 'LV.2' | 'LV.3' | 'LV.4';

    profitShareDetails?: {
        bookingAmount?: number;
        platformProfit?: number;
        profitSharePercentage?: number;
        calculatedShare?: number;
    };

    status?: 'credited' | 'withdrawn' | 'cancelled';

    createdAt?: Date;
    updatedAt?: Date;
}
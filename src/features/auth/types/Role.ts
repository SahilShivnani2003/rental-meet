import { Colors } from "../../../theme/theme";

export const ROLES = [
    {
        id: 'customer',
        title: 'User Registration',
        subtitle: 'User',
        description:
            'Browse and book premium meeting venues, conference rooms, and event spaces with ease.',
        icon: 'person',
        color: Colors.info,
        bg: Colors.infoLight,
        cardBg: Colors.infoHighLight,
        perks: [
            'Browse & book venues',
            'Manage your bookings',
            'Save favourites',
            'Chat with owners',
        ],
        featured: true,
    },
    {
        id: 'owner',
        title: 'List Your Venue',
        subtitle: 'Venue Owner',
        description:
            'List and manage your properties. Accept bookings and grow your venue business.',
        icon: 'business',
        color: Colors.primary,
        bg: Colors.primaryLight,
        cardBg: Colors.primaryHighLight,
        perks: [
            'List your spaces',
            'Accept & manage bookings',
            'Set pricing & availability',
            'Earn revenue',
        ],
    },
    {
        id: 'vendor',
        title: 'List Your Service',
        subtitle: 'Vendor',
        description:
            'Offer services like catering, AV setup, decoration, and more to venue bookers.',
        icon: 'construct',
        color: Colors.success,
        bg: Colors.successLight,
        cardBg: Colors.successHighLight,
        perks: [
            'Offer your services',
            'Connect with clients',
            'Manage service requests',
            'Grow your brand',
        ],
    },
    {
        id: 'ambassador',
        title: 'Become an Ambassador',
        subtitle: 'Ambassador',
        description:
            'Promote our platform, connect with businesses, and earn rewards by bringing new users and partners to the platform.',
        icon: 'megaphone',
        color: Colors.warning,
        bg: Colors.warningLight,
        cardBg: Colors.primaryHighLight,
        perks: [
            'Refer new users & businesses',
            'Earn referral rewards',
            'Track your referrals',
            'Grow your network',
        ],
    },
];
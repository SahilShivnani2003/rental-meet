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
        title: 'List your venue',
        subtitle: 'Owner',
        description:
            'List and manage your properties. Accept bookings and grow your venue business.',
        icon: 'business',
        color: Colors.primary,
        bg: Colors.primaryLight,
        perks: [
            'List your spaces',
            'Accept & manage bookings',
            'Set pricing & availability',
            'Earn revenue',
        ],
    },
    {
        id: 'vendor',
        title: 'List your business',
        subtitle: 'Vendor',
        description:
            'Offer services like catering, AV setup, decoration, and more to venue bookers.',
        icon: 'construct',
        color: Colors.success,
        bg: Colors.successLight,
        perks: [
            'Offer your services',
            'Connect with clients',
            'Manage service requests',
            'Grow your brand',
        ],
    },
];
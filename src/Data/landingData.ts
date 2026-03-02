import { Colors } from "../theme/theme";

export const KEY_STATS = [
    { value: '500+', label: 'Venues' },
    { value: '10K+', label: 'Bookings' },
    { value: '4.9', label: 'Rating' },
    { value: '24/7', label: 'Support' },
];

export const CATEGORIES = [
    { icon: 'business-outline', label: 'Banquet', count: 12 },
    { icon: 'desktop-outline', label: 'Meeting', count: 28 },
    { icon: 'mic-outline', label: 'Auditorium', count: 7 },
    { icon: 'briefcase-outline', label: 'Board Room', count: 19 },
    { icon: 'sunny-outline', label: 'Outdoor', count: 5 },
    { icon: 'camera-outline', label: 'Studio', count: 9 },
];

export const FEATURED = [
    {
        id: '1',
        name: 'BNSS Meeting Hall',
        type: 'Meeting Room',
        capacity: '500–600',
        price: 'Rs.1,000',
        rating: 4.5,
        accent: Colors.info,
        badge: 'Featured',
    },
    {
        id: '2',
        name: 'Luxury Grand Palace',
        type: 'Banquet Hall',
        capacity: '500–600',
        price: 'Rs.4,500',
        rating: 4.8,
        accent: Colors.success,
        badge: 'Top Rated',
    },
    {
        id: '3',
        name: 'Rooftop Lounge',
        type: 'Event Space',
        capacity: '100–200',
        price: 'Rs.2,000',
        rating: 4.3,
        accent: Colors.primary,
        badge: null,
    },
];

export const AMENITIES = [
    { icon: 'wifi-outline', label: 'High-Speed WiFi' },
    { icon: 'tv-outline', label: 'HD Projection' },
    { icon: 'restaurant-outline', label: 'Gourmet Catering' },
    { icon: 'shield-checkmark-outline', label: '24/7 Security' },
    { icon: 'car-outline', label: 'Ample Parking' },
    { icon: 'headset-outline', label: 'Tech Support' },
    { icon: 'snow-outline', label: 'Climate Control' },
    { icon: 'cafe-outline', label: 'Refreshments' },
];

export const PACKAGES = [
    {
        label: '1 Hour',
        price: 'Rs.1,000',
        subtext: 'up to Rs.5,000',
        icon: 'time-outline',
        featured: false,
    },
    {
        label: '2 Hours',
        price: 'Rs.1,800',
        subtext: 'up to Rs.9,000',
        icon: 'time-outline',
        featured: false,
    },
    {
        label: '4 Hours',
        price: 'Rs.3,000',
        subtext: 'up to Rs.15,000',
        icon: 'hourglass-outline',
        featured: true,
    },
    {
        label: 'Full Day',
        price: 'Rs.6,000',
        subtext: 'up to Rs.30,000',
        icon: 'calendar-outline',
        featured: false,
    },
];

export const TESTIMONIALS = [
    {
        initials: 'RK',
        name: 'Rajesh Kumar',
        role: 'CEO, Tech Corp',
        stars: 5,
        text: 'RentalMeet transformed how we organize meetings. Premium spaces, seamless experience.',
    },
    {
        initials: 'SS',
        name: 'Sneha Sharma',
        role: 'Event Director, Bloom',
        stars: 5,
        text: 'Unmatched attention to detail and premium facilities. Highly recommend for any event!',
    },
    {
        initials: 'AP',
        name: 'Amit Patel',
        role: 'Founder, Startup Hub',
        stars: 5,
        text: 'Finding quality spaces was always a challenge until RentalMeet. Truly professional.',
    },
];
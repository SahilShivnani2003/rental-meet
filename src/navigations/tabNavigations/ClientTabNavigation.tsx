import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from '../../components/bottomTab/custom-tabBar';
import ClientDashboard from '@/features/dashboard/screens/ClientDashboard';
import VenuesScreen from '@/features/venue/screens/VenueScreen';
import BookingsScreen from '@/features/booking/screens/BookingScreen';
import OtherServicesScreen from '@/features/otherService/screens/OtherServiceScreen';
import ClientProfile from '@/features/profile/screen/ClientProfile';
import { useAuthStore } from '@/store/useAuthStore';
import GuestProfile from '@/features/profile/screen/GuestProfile';

export type ClientTabParamList = {
    home: undefined;
    venues: {
        search?:string,  
        city?:string,
        capacity?:string,
        venueType?:string,
    }| undefined;
    bookings: undefined;
    otherService: undefined;
    profile: undefined;
};

// ─── Tab config ───────────────────────────────────────────────────────────────
const clientTabs = [
    { name: 'home', label: 'Home', icon: 'grid', iconOff: 'grid-outline' },
    { name: 'venues', label: 'Browse', icon: 'search', iconOff: 'search-outline' },
    {
        name: 'bookings',
        label: 'Bookings',
        icon: 'calendar',
        iconOff: 'calendar-outline',
        center: true,
    },
    {
        name: 'otherService',
        label: 'Premium',
        icon: 'diamond',
        iconOff: 'diamond-outline',
    },
    { name: 'profile', label: 'Profile', icon: 'person', iconOff: 'person-outline' },
];

// ─── Client navigator ─────────────────────────────────────────────────────────
const Tabs = createBottomTabNavigator<ClientTabParamList>();

export function ClientTabNavigation() {
    const isAuthenticated = useAuthStore().isAuthenticated;
    return (
        <Tabs.Navigator
            tabBar={props => <CustomTabBar {...props} tabs={clientTabs} />}
            screenOptions={{ headerShown: false }}
        >
            <Tabs.Screen name="home" component={ClientDashboard} />
            <Tabs.Screen name="venues" component={VenuesScreen} />
            <Tabs.Screen name="bookings" component={BookingsScreen} />
            <Tabs.Screen name="otherService" component={OtherServicesScreen} />
            <Tabs.Screen
                name="profile"
                component={isAuthenticated ? ClientProfile : GuestProfile}
            />
        </Tabs.Navigator>
    );
}

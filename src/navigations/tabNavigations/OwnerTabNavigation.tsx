import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from '../../components/bottomTab/custom-tabBar';
import OwnerDashboardScreen from '@/features/dashboard/screens/OwnerDashboardScreen';
import BookingsScreen from '@/features/booking/screens/BookingScreen';
import VenuesScreen from '@/features/venue/screens/VenueScreen';
import ProfileScreen from '@/features/profile/screen/OwnerProfile';

export type OwnerTabParamList = {
    dashboard: undefined;
    venues: undefined;
    bookings: undefined;
    profile: undefined;
};

// ─── Tab config ───────────────────────────────────────────────────────────────
const ownerTabs = [
    { name: 'dashboard', label: 'Dashboard', icon: 'grid', iconOff: 'grid-outline' },
    {
        name: 'venues',
        label: 'My Venues',
        icon: 'search',
        iconOff: 'search-outline',
    },
    { name: 'bookings', label: 'My Bookings', icon: 'calendar', iconOff: 'calendar-outline' },
    { name: 'profile', label: 'Profile', icon: 'person', iconOff: 'person-outline' },
];

// ─── Owner navigator ──────────────────────────────────────────────────────────
const Tabs = createBottomTabNavigator<OwnerTabParamList>();

export function OwnerTabNavigation() {
    return (
        <Tabs.Navigator
            tabBar={props => <CustomTabBar {...props} tabs={ownerTabs} />}
            screenOptions={{ headerShown: false }}
        >
            <Tabs.Screen name="dashboard" component={OwnerDashboardScreen} />
            <Tabs.Screen name="bookings" component={BookingsScreen} />
            <Tabs.Screen name="venues" component={VenuesScreen} />
            <Tabs.Screen name="profile" component={ProfileScreen} />
        </Tabs.Navigator>
    );
}

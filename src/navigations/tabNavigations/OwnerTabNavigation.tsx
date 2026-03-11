import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import OwnerDashboardScreen from '../../screens/owner/dashboard';
import BookingsScreen from '../../screens/tabs/bookings';
import MessagesScreen from '../../screens/tabs/messages';
import ProfileScreen from '../../screens/tabs/profile';
import VenuesScreen from '../../screens/tabs/venues';
import CustomTabBar from '../../components/bottomTab/custom-tabBar';

export type OwnerTabParamList = {
    dashboard: undefined;
    bookings: undefined;
    venues: undefined; // center FAB — navigates to an Add Venue stack screen
    messages: undefined;
    profile: undefined;
};

// ─── Tab config ───────────────────────────────────────────────────────────────
const ownerTabs = [
    { name: 'dashboard', label: 'Dashboard', icon: 'grid', iconOff: 'grid-outline' },
    { name: 'bookings', label: 'My Bookings', icon: 'calendar', iconOff: 'calendar-outline' },
    {
        name: 'venues',
        label: 'My Venues',
        icon: 'add-circle',
        iconOff: 'add-circle-outline',
        center: true,
    },
    { name: 'messages', label: 'Messages', icon: 'chatbubbles', iconOff: 'chatbubbles-outline' },
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
            <Tabs.Screen name="messages" component={MessagesScreen} />
            <Tabs.Screen name="profile" component={ProfileScreen} />
        </Tabs.Navigator>
    );
}

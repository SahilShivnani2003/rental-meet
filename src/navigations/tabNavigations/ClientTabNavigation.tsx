import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BookingsScreen from '../../screens/tabs/bookings';
import HomeScreen from '../../screens/tabs/venues';
import LandingScreen from '../../screens/landing';
import ClientProfile from '../../screens/client/client-profile';
import OtherServicesScreen from '../../screens/tabs/other-service';
import CustomTabBar from '../../components/bottomTab/custom-tabBar';

export type ClientTabParamList = {
    home: undefined;
    venues: undefined;
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
        label: 'Other Service',
        icon: 'briefcase',
        iconOff: 'briefcase-outline',
    },
    { name: 'profile', label: 'Profile', icon: 'person', iconOff: 'person-outline' },
];

// ─── Client navigator ─────────────────────────────────────────────────────────
const Tabs = createBottomTabNavigator<ClientTabParamList>();

export function ClientTabNavigation() {
    return (
        <Tabs.Navigator
            tabBar={props => <CustomTabBar {...props} tabs={clientTabs} />}
            screenOptions={{ headerShown: false }}
        >
            <Tabs.Screen name="home" component={LandingScreen} />
            <Tabs.Screen name="venues" component={HomeScreen} />
            <Tabs.Screen name="bookings" component={BookingsScreen} />
            <Tabs.Screen name="otherService" component={OtherServicesScreen} />
            <Tabs.Screen name="profile" component={ClientProfile} />
        </Tabs.Navigator>
    );
}

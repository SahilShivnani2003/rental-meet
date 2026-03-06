import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from '../../components/bottomTab/custom-tabBar';
import BookingsScreen from '../../screens/tabs/bookings';
import LandingScreen from '../../screens/landing';
import GuestProfile from '../../screens/tabs/guest-profile';
import VenuesScreen from '../../screens/tabs/venues';
import OtherServicesScreen from '../../screens/tabs/other-service';

export type tabParamList = {
    home: undefined;
    venues: undefined;
    bookings: undefined;
    otherService: undefined;
    profile: undefined;
};
export const TABS = [
    { name: 'home', label: 'Home', icon: 'home', iconOff: 'home-outline' },
    { name: 'venues', label: 'Browse', icon: 'search', iconOff: 'search-outline' },
    { name: 'bookings', label: 'Bookings', icon: 'calendar', iconOff: 'calendar-outline', center: true },
    {
        name: 'otherService',
        label: 'Other Service',
        icon: 'briefcase',
        iconOff: 'briefcase-outline',
    },
    { name: 'profile', label: 'Profile', icon: 'person', iconOff: 'person-outline' },
];

const Tabs = createBottomTabNavigator<tabParamList>();

export const TabNavigation = () => (
    <Tabs.Navigator
        tabBar={props => <CustomTabBar {...props} tabs={TABS}  />}
        screenOptions={{ headerShown: false }}
    >
        <Tabs.Screen name="home" component={LandingScreen} />
        <Tabs.Screen name="venues" component={VenuesScreen} />
        <Tabs.Screen name="bookings" component={BookingsScreen} />
        <Tabs.Screen name="otherService" component={OtherServicesScreen} />
        <Tabs.Screen name="profile" component={GuestProfile} />
    </Tabs.Navigator>
);

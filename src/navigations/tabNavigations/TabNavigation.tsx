import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from '../../components/bottomTab/custom-tabBar';
import FavoritesScreen from '../../screens/favorites';
import BookingsScreen from '../../screens/tabs/bookings';
import MessagesScreen from '../../screens/tabs/messages';
import ProfileScreen from '../../screens/tabs/profile';
import LandingScreen from '../../screens/landing';
import GuestProfile from '../../screens/tabs/guest-profile';

export type tabParamList = {
    home: undefined;
    bookings: undefined;
    favorites: undefined;
    messages: undefined;
    profile: undefined;
};
export const TABS = [
    { name: 'home', label: 'Home', icon: 'home', iconOff: 'home-outline' },
    { name: 'bookings', label: 'Bookings', icon: 'calendar', iconOff: 'calendar-outline' },
    { name: 'favorites', label: 'Saved', icon: 'heart', iconOff: 'heart-outline', center: true },
    {
        name: 'messages',
        label: 'Chat',
        icon: 'chatbubbles',
        iconOff: 'chatbubbles-outline',
        badge: true,
    },
    { name: 'profile', label: 'Profile', icon: 'person', iconOff: 'person-outline' },
];

const Tabs = createBottomTabNavigator<tabParamList>();

export const TabNavigation = () => (
    <Tabs.Navigator
        tabBar={props => <CustomTabBar {...props} tabs={TABS} />}
        screenOptions={{ headerShown: false }}
    >
        <Tabs.Screen name="home" component={LandingScreen} />
        <Tabs.Screen name="bookings" component={BookingsScreen} />
        <Tabs.Screen name="favorites" component={FavoritesScreen} />
        <Tabs.Screen name="messages" component={MessagesScreen} />
        <Tabs.Screen name="profile" component={GuestProfile} />
    </Tabs.Navigator>
);

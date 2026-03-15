import React from 'react';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/login';
import SplashScreen from '../screens/splashScreen';
import RegisterTypeScreen from '../screens/auth/resigter-type';
import { ClientTabNavigation, ClientTabParamList } from './tabNavigations/ClientTabNavigation';
import { OwnerTabNavigation, OwnerTabParamList } from './tabNavigations/OwnerTabNavigation';
import RegisterScreen from '../screens/auth/register';
import { AlertProvider } from '../context/AlertContext';
import VenueDetailScreen, { SelectedAmenityItem, Venue } from '../screens/venue-detail';
import { TabNavigation, tabParamList } from './tabNavigations/TabNavigation';
import RegisterVenueScreen from '../screens/auth/register-venue';
import BrowseCategoryScreen from '../screens/CategoryList';
import BookingScreen from '../screens/BookingScreen';
import BookingDetailScreen from '../screens/BookingDetailScreen';

export type RootStackParamList = {
    splash: undefined;
    login: undefined;
    main: NavigatorScreenParams<tabParamList> | undefined;
    registerType: undefined;
    client: NavigatorScreenParams<ClientTabParamList> | undefined;
    owner: NavigatorScreenParams<OwnerTabParamList> | undefined;
    registerVenue: undefined;
    register: {
        role: string;
    };
    venueDetail: {
        venue: any;
    };
    category: undefined;
    booking: {
        venue: Venue;
        selectedAmenities?: SelectedAmenityItem[];
        amenitiesTotal?: number;
        preselectedDurationHours?: number;
        preselectedDurationType?: string;
    };
    bookingDetail: {
        booking: any;
    };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    return (
        <AlertProvider>
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName="login"
                    screenOptions={{ headerShown: false, animation: 'fade' }}
                >
                    <Stack.Screen name="splash" component={SplashScreen} />
                    <Stack.Screen name="login" component={LoginScreen} />
                    <Stack.Screen name="registerType" component={RegisterTypeScreen} />
                    <Stack.Screen name="register" component={RegisterScreen} />
                    <Stack.Screen name="registerVenue" component={RegisterVenueScreen} />
                    <Stack.Screen
                        name="main"
                        component={TabNavigation}
                        options={{ animation: 'fade' }}
                    />
                    <Stack.Screen
                        name="client"
                        component={ClientTabNavigation}
                        options={{ animation: 'fade' }}
                    />
                    <Stack.Screen
                        name="owner"
                        component={OwnerTabNavigation}
                        options={{ animation: 'fade' }}
                    />
                    <Stack.Screen name="venueDetail" component={VenueDetailScreen} />
                    <Stack.Screen name="category" component={BrowseCategoryScreen} />
                    <Stack.Screen name="booking" component={BookingScreen} />
                    <Stack.Screen name="bookingDetail" component={BookingDetailScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        </AlertProvider>
    );
}

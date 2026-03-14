import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/login';
import SplashScreen from '../screens/dummyScreen';
import RegisterTypeScreen from '../screens/auth/resigter-type';
import { ClientTabNavigation } from './tabNavigations/ClientTabNavigation';
import { OwnerTabNavigation } from './tabNavigations/OwnerTabNavigation';
import RegisterScreen from '../screens/auth/register';
import { AlertProvider } from '../context/AlertContext';
import VenueDetailScreen from '../screens/venue-detail';
import { TabNavigation } from './tabNavigations/TabNavigation';
import RegisterVenueScreen from '../screens/auth/register-venue';

export type RootStackParamList = {
    splash: undefined;
    login: undefined;
    main: undefined;
    registerType: undefined;
    client: undefined;
    owner: undefined;
    registerVenue: undefined;
    register: {
        role: string;
    };
    venueDetail: {
        venue: any;
    };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    return (
        <AlertProvider>
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName="splash"
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
                </Stack.Navigator>
            </NavigationContainer>
        </AlertProvider>
    );
}

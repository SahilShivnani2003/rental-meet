import React from 'react';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/login';
import SplashScreen from '../screens/dummyScreen';
import RegisterTypeScreen from '../screens/auth/resigter-type';
import { ClientTabNavigation, ClientTabParamList } from './tabNavigations/ClientTabNavigation';
import { OwnerTabNavigation, OwnerTabParamList } from './tabNavigations/OwnerTabNavigation';
import RegisterScreen from '../screens/auth/register';
import { AlertProvider } from '../context/AlertContext';
import VenueDetailScreen from '../screens/venue-detail';
import { TabNavigation, tabParamList } from './tabNavigations/TabNavigation';
import RegisterVenueScreen from '../screens/auth/register-venue';
import BrowseCategoryScreen from '../screens/CategoryList';

export type RootStackParamList = {
    splash: undefined;
    login: undefined;
    main: NavigatorScreenParams<tabParamList>;
    registerType: undefined;
    client: NavigatorScreenParams<ClientTabParamList>;
    owner: NavigatorScreenParams<OwnerTabParamList>;
    registerVenue: undefined;
    register: {
        role: string;
    };
    venueDetail: {
        venue: any;
    };
    category: undefined;
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
                </Stack.Navigator>
            </NavigationContainer>
        </AlertProvider>
    );
}

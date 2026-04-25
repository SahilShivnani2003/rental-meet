import React from 'react';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '@features/auth/screens/LoginScreen';
import RegisterTypeScreen from '../screens/auth/resigter-type';
import { ClientTabNavigation, ClientTabParamList } from './tabNavigations/ClientTabNavigation';
import { OwnerTabNavigation, OwnerTabParamList } from './tabNavigations/OwnerTabNavigation';
import RegisterScreen from '../screens/auth/register';
import { AlertProvider } from '../context/AlertContext';
import VenueDetailScreen, { SelectedAmenityItem, Venue } from '../screens/venue-detail';
import { TabNavigation, tabParamList } from './tabNavigations/TabNavigation';
import BrowseCategoryScreen from '../screens/CategoryList';
import BookingScreen from '../screens/BookingScreen';
import BookingDetailScreen from '../screens/BookingDetailScreen';
import OnboardingScreen from '../screens/OnBoarding';
import SplashScreen from '../screens/splashScreen';
import RegisterVenueScreen from '../screens/owner/AddVenue';
import UpdateVenueScreen from '../screens/owner/UpdateVenue';
import VenueDetail from '../screens/VenueDetailScreen';
import { RootStackParamList } from '@/types/RootStackParamList';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/service/queryClient';
import ModifyBookingScreen from '@/features/booking/screens/ModifyBookingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    return (
        <QueryClientProvider client={queryClient}>
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
                        <Stack.Screen name="onBoarding" component={OnboardingScreen} />
                        <Stack.Screen name="addVenue" component={RegisterVenueScreen} />
                        <Stack.Screen name="updateVenue" component={UpdateVenueScreen} />
                        <Stack.Screen name="vDetail" component={VenueDetail} />
                        <Stack.Screen name="modifyBooking" component={ModifyBookingScreen}/>
                    </Stack.Navigator>
                </NavigationContainer>
            </AlertProvider>
        </QueryClientProvider>
    );
}

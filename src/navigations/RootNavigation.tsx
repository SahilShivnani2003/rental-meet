import React from 'react';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '@features/auth/screens/LoginScreen';
import { ClientTabNavigation } from './tabNavigations/ClientTabNavigation';
import { OwnerTabNavigation } from './tabNavigations/OwnerTabNavigation';
import { AlertProvider } from '../context/AlertContext';
import OnboardingScreen from '../screens/OnBoarding';
import SplashScreen from '../screens/splashScreen';
import RegisterVenueScreen from '../screens/owner/AddVenue';
import UpdateVenueScreen from '../screens/owner/UpdateVenue';
import { RootStackParamList } from '@/types/RootStackParamList';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/service/queryClient';
import ModifyBookingScreen from '@/features/booking/screens/ModifyBookingScreen';
import RegisterScreen from '@/features/auth/screens/RegisterScreen';
import BookingDetailScreen from '@/features/booking/screens/BookingDetailScreen';
import BookingScreen from '@/features/booking/screens/BookingScreen';
import VenueDetailScreen from '@/features/venue/screens/VenueDetailScreen';
import BrowseCategoryScreen from '@/features/venueType/screens/VenueTypeScreen';
import RegisterTypeScreen from '@/features/auth/screens/RoleTypeScreen';
import VenueBookingScreen from '@/features/booking/screens/VenueBookingScreen';

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
                        <Stack.Screen name="booking" component={VenueBookingScreen} />
                        <Stack.Screen name="bookingDetail" component={BookingDetailScreen} />
                        <Stack.Screen name="onBoarding" component={OnboardingScreen} />
                        <Stack.Screen name="addVenue" component={RegisterVenueScreen} />
                        <Stack.Screen name="updateVenue" component={UpdateVenueScreen} />
                        <Stack.Screen name="modifyBooking" component={ModifyBookingScreen}/>
                    </Stack.Navigator>
                </NavigationContainer>
            </AlertProvider>
        </QueryClientProvider>
    );
}

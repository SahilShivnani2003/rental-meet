import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '@features/auth/screens/LoginScreen';
import { ClientTabNavigation } from './tabNavigations/ClientTabNavigation';
import { OwnerTabNavigation } from './tabNavigations/OwnerTabNavigation';
import { AlertProvider } from '../context/AlertContext';
import OnboardingScreen from '../screens/OnBoarding';
import SplashScreen from '../screens/splashScreen';
import { RootStackParamList } from '@/types/RootStackParamList';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/service/queryClient';
import ModifyBookingScreen from '@/features/booking/screens/ModifyBookingScreen';
import RegisterScreen from '@/features/auth/screens/RegisterScreen';
import BookingDetailScreen from '@/features/booking/screens/BookingDetailScreen';
import VenueDetailScreen from '@/features/venue/screens/VenueDetailScreen';
import BrowseCategoryScreen from '@/features/venueType/screens/VenueTypeScreen';
import RegisterTypeScreen from '@/features/auth/screens/RoleTypeScreen';
import VenueBookingScreen from '@/features/booking/screens/VenueBookingScreen';
import RegisterVenueScreen from '@/features/venue/screens/AddVenueScreen';
import UpdateVenueScreen from '@/features/venue/screens/UpdataVenueScreen';
import { VendorTabNavigation } from './tabNavigations/VendorTabNavigation';
import AddServiceScreen from '@/features/vendor/screens/AddServiceScreen';
import VendorDetailScreen from '@/features/vendor/screens/VendorDetailScreen';
import ServiceBookingScreen from '@/features/booking/screens/ServiceBookingScreen';
import GetQuotationScreen from '@/features/quotation/screens/GetQuotationScreen';
import { updateVendorService } from '@/features/vendor/service/vendorService';
import UpdateServiceScreen from '@/features/vendor/screens/UpdateServiceScreen';
import ServiceBookingDetailScreen from '@/features/booking/screens/ServiceBookingDetailScreen';
import ForgotPasswordScreen from '@/features/auth/screens/ForgotPasswordScreen';
import ReferralScreen from '@/features/profile/screen/RefferralScreen';
import SplashScreen2 from '@/screens/SplashScreen2';
import { Colors } from '@/theme/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    return (
        <QueryClientProvider client={queryClient}>
            <AlertProvider>
                <NavigationContainer>
                    <Stack.Navigator
                        initialRouteName="splash"
                        screenOptions={{ headerShown: false, animation: 'fade' , statusBarStyle: 'light', statusBarBackgroundColor:Colors.primary}}
                    >
                        <Stack.Screen name="splash" component={SplashScreen2} />
                        <Stack.Screen name="login" component={LoginScreen} />
                        <Stack.Screen name="registerType" component={RegisterTypeScreen} />
                        <Stack.Screen name="register" component={RegisterScreen} />
                        <Stack.Screen name="forgotPassword" component={ForgotPasswordScreen} />
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
                        <Stack.Screen name="vendor" component={VendorTabNavigation} />
                        <Stack.Screen name="venueDetail" component={VenueDetailScreen} />
                        <Stack.Screen name="category" component={BrowseCategoryScreen} />
                        <Stack.Screen name='venueBooking' component={VenueBookingScreen} />
                        <Stack.Screen name="venueBookingDetail" component={BookingDetailScreen} />
                        <Stack.Screen name="onBoarding" component={OnboardingScreen} />
                        <Stack.Screen name="addVenue" component={RegisterVenueScreen} />
                        <Stack.Screen name="updateVenue" component={UpdateVenueScreen} />
                        <Stack.Screen name="modifyVenueBooking" component={ModifyBookingScreen} />
                        <Stack.Screen name="addVendorService" component={AddServiceScreen} />
                        <Stack.Screen name='vendorDetail' component={VendorDetailScreen}/>
                        <Stack.Screen name='serviceBooking' component={ServiceBookingScreen}/>
                        <Stack.Screen name='getServiceQuotation' component={GetQuotationScreen}/>
                        <Stack.Screen name='updateVendorService' component={UpdateServiceScreen}/>
                        <Stack.Screen name='serviceBookingDetail' component={ServiceBookingDetailScreen}/>
                        <Stack.Screen name="referral" component={ReferralScreen} />
                    </Stack.Navigator>
                </NavigationContainer>
            </AlertProvider>
        </QueryClientProvider>
    );
}

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigation } from './TabNavigation';
import LoginScreen from '../screens/auth/login';
import SplashScreen from '../screens/splashScreen';
import RegisterTypeScreen from '../screens/auth/resigter-type';

export type RootStackParamList = {
    splash: undefined;
    login: undefined;
    main: undefined;
    registerType: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="splash"
                screenOptions={{ headerShown: false, animation: 'fade' }}
            >
                <Stack.Screen name="splash" component={SplashScreen} />
                <Stack.Screen name="login" component={LoginScreen} />
                <Stack.Screen name="registerType" component={RegisterTypeScreen} />
                <Stack.Screen
                    name="main"
                    component={TabNavigation}
                    options={{ animation: 'fade' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
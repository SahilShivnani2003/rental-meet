import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { TabNavigation } from './TabNavigation';
import LoginScreen from '../screens/auth/login';
import SplashScreen from '../screens/splashScreen';

// ─── Stack param list ─────────────────────────────────────────────────────────
export type RootStackParamList = {
  Splash: undefined;
  Login:  undefined;
  Main:   undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Root navigator ───────────────────────────────────────────────────────────
export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Splash" component={SplashScreenWrapper} />
        <Stack.Screen name="Login"  component={LoginScreenWrapper}  />
        <Stack.Screen
          name="Main"
          component={TabNavigation}
          options={{ animation: 'fade' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── Wrappers to inject navigation callbacks ──────────────────────────────────

type SplashProps = NativeStackScreenProps<RootStackParamList, 'Splash'>;
type LoginProps  = NativeStackScreenProps<RootStackParamList, 'Login'>;

function SplashScreenWrapper({ navigation }: SplashProps) {
  return (
    <SplashScreen
      onFinish={() =>
        navigation.replace('Login')
      }
    />
  );
}

function LoginScreenWrapper({ navigation }: LoginProps) {
  return (
    <LoginScreen
      onLogin={() =>
        navigation.replace('Main')
      }
    />
  );
}
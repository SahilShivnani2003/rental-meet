import { PermissionsAndroid, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info';
import { useAuthStore } from '@/store/useAuthStore';
import { IRegisterDevice, registerDevice } from '@/features/notification/services/notificationService';

export default async function requestNotificationPermission() {
    try {
        let enabled = false;

        if (Platform.OS === 'android') {
            if (Platform.Version >= 33) {
                const grant = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                );
                if (grant === PermissionsAndroid.RESULTS.GRANTED) {
                    console.log('Android notification permission granted');
                    const authStatus = await messaging().requestPermission();
                    enabled =
                        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
                } else {
                    console.log('Post notification permission denied');
                }
            } else {
                // Pre-Android 13, permissions are granted at install time
                const authStatus = await messaging().requestPermission();
                enabled =
                    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
            }
        } else if (Platform.OS === 'ios') {
            const authStatus = await messaging().requestPermission();
            enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        }

        if (enabled) {
            console.log('Firebase permission granted');
            const token = await messaging().getToken();
            console.log('FCM token:', token);
            const deviceId = await DeviceInfo.getUniqueId();
            const { user, isAuthenticated } = useAuthStore.getState();

            const registerDevicePayload : IRegisterDevice = {
                deviceId: deviceId,
                fcmToken: token,
                platform: 'android'
            };

            await registerDevice({data: registerDevicePayload, isLoggedIn: isAuthenticated});
        }
    } catch (error) {
        console.log('Notification Permission & Registration Error:', error);
    }
}
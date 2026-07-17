import { privateClient, publicClient } from "@/service/apiClient";

export const getNotification = async() =>{
    try{
        console.log('fetching notification ');
        const response = await privateClient.get('/notifications');
        console.log('notification response : ', response.data);
        return response.data;
    }catch(error){
        console.log('failed to fetch notification : ', error);
        throw error;
    }
}

export interface IRegisterDevice {
    deviceId: string;
    fcmToken: string;
    platform: 'android' | 'ios'
}
export const registerDevice = async(payload: {data: IRegisterDevice, isLoggedIn: boolean}) =>{
    try{
        console.log('Registering device for notification.');
        const response  = payload.isLoggedIn ? await privateClient.post('/notifications/register-device', payload.data) : await publicClient.post('/notifications/register-device', payload.data);

        console.log('Register device response : ', response.data);
        return response.data;
    }catch(error){
        console.error('Failed to register device : ', error);
        throw error;
    }
}

export const deviceLogout = async(deviceId: string) =>{
    try{
        console.log('Logging out device');
        const response = await privateClient.post('/notifications/device/logout', {deviceId});
        console.log('Device logged out : ', response.data);
        return response.data;
    }catch(error){
        console.error('failed to logout device : ', error);
        throw error;
    }
}
import { publicClient } from "@/service/apiClient";
import { RegisterClient, RegisterOwner, RegisterVendor } from "../types/Register";

export const registerUser = async (data: RegisterClient | RegisterVendor | RegisterOwner) => {
    try {

        console.log('User registering...');

        const response = await publicClient.post('/auth/register', data);

        console.log('User register response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while user registring : ', error);
        throw error;
    }
}

export const login = async (data: { email: string, password: string, deviceId: string }) => {
    try {
        console.log('Loggin user.....');

        const response = await publicClient.post('/auth/login', data);

        console.log('Logging response : ', response.data);

        return response.data
    } catch (error) {
        console.error('Error while logging user : ', error);
        throw error;
    }
}

export const sendEmailOtp = async (data: { name: string, email: string }) => {
    try {
        console.log('Sending email otp...');
        const respone = await publicClient.post('/auth/send-email-otp', data);

        console.log('Email otp response : ', respone.data);
        return respone.data;
    } catch (error) {
        console.error('Error while sending email otp : ', error);
        throw error;
    }
}

export const verifyEmailOtp = async (data: { email: string, otp: string }) => {
    try {
        console.log('Verifying email otp...');
        const response = await publicClient.post('/auth/verify-email-otp', data);
        console.log('Verify email otp response : ', response.data);
        return response.data;
    } catch (error) {
        console.error('Error while verifying email otp : ', error);
        throw error;
    }
}

export const sendPhoneOtp = async (data: { name: string, phone: string }) => {
    try {
        console.log('Sending phone otp...');
        const response = await publicClient.post('/auth/send-phone-otp', data);
        console.log('Phone otp response : ', response.data);
        return response.data;
    } catch (error) {
        console.error('Error while sending phone otp : ', error);
        throw error;
    }
}

export const verifyPhoneOtp = async (data: { phone: string, otp: string }) => {
    try {
        console.log('Verifying phone otp...');
        const response = await publicClient.post('/auth/verify-phone-otp', data);
        console.log('Verify phone otp response : ', response.data);
        return response.data;
    } catch (error) {
        console.error('Error while verifying phone otp : ', error);
        throw error;
    }
}

export const forgotPassword = async (data: { email: string }) => {
    try {
        console.log('Forgot password...');
        const response = await publicClient.post('/auth/forgot-password', data);
        console.log('Forgot password response : ', response.data);
        return response.data;
    } catch (error) {
        console.error('Error while forgot password : ', error);
        throw error;
    }
}

export const resetPassword = async (data: { email: string, otp: string, newPassword: string }) => {
    try {
        console.log('Resetting password...');
        const response = await publicClient.post('/auth/reset-password', data);
        console.log('Reset password response : ', response.data);
        return response.data;
    } catch (error) {
        console.error('Error while resetting password : ', error);
        throw error;
    }
}
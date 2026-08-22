import { privateClient, publicClient } from "@/service/apiClient"
import { CreateAmbassadorPayout } from "../types/AmbassadorPayout";

const Base = '/ambassador'
export const getLeaderboard = async () => {
    try {
        const response = await publicClient.get(`${Base}/leaderboard`);
        return response.data;
    } catch (error) {
        console.error('failed to fetch leader board : ', error);
        throw error;
    }
}

export const getAmbassadorDashboard = async () => {
    try {
        const response = await privateClient.get(`${Base}/dashboard`);
        return response.data;
    } catch (error) {
        console.error('failed to fetch ambassador dashboard : ', error);
        throw error;
    }
}

export const getAmbassadorVenues = async () => {
    try {
        const response = await privateClient.get(`${Base}/venues`);
        return response.data;
    } catch (error) {
        console.error('failed to load venues : ', error);
        throw error;
    }
}

export const getAmbassadorBookings = async () => {
    try {
        const response = await privateClient.get(`${Base}/bookings`);
        return response.data;
    } catch (error) {
        console.error('failed to load bookings : ', error);
        throw error;
    }
}

export const getAmbassadorEarnings = async () => {
    try {
        const response = await privateClient.get(`${Base}/earnings`);
        return response.data;
    } catch (error) {
        console.error('failed to fetch earnings : ', error);
        throw error;
    }
}

export const createAmbassadorPayout = async (data: CreateAmbassadorPayout) => {
    try {
        console.log('Creating ambassador payouts : ', data);
        const response = await privateClient.post(`${Base}/payouts`);
        return response.data;
    } catch (error) {
        console.error('failed to create payouts : ', error);
        throw error;
    }
}

export const getAmbassadorPayouts = async () => {
    try {
        const response = await privateClient.get(`${Base}/payouts`);
        return response.data;
    } catch (error) {
        console.error('failed to fetch payouts : ', error);
        throw error;
    }
}

export const requestAmbassadorPayouts = async (data: CreateAmbassadorPayout) => {
    try {
        console.log('Request payout data : ', data);
        const response = await privateClient.post(`${Base}/payouts/request`, data);
        return response.data;
    } catch (error) {
        console.error('failed to request payout : ', error);
        throw error;
    }
}

export const getAmbassadorProfile = async () => {
    try {
        const response = await privateClient.get(`${Base}/profile`);
        return response.data;
    } catch (error) {
        console.error('failed to get profile : ', error);
        throw error;
    }
}

export const updateAmbassadorProfile = async () => {
    try {
        const reposne = await privateClient.put(`${Base}/profile`);
        return reposne.data;
    } catch (error) {
        console.error('failed to update ambassador profile : ', error);
        throw error;
    }
}
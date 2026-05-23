import { privateClient } from "@/service/apiClient";
import { Coupon } from "../types/Coupon";

export const getVenueCoupons = async () => {
    try {
        console.log('Fetching venue coupons....');

        const response = await privateClient.get('/owner/coupons');

        console.log('Venue coupon response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while venue coupon fetching : ', error);
        throw error;
    }
}

export const createVenueCoupons = async (data: Coupon) => {
    try {
        console.log('Creating venue coupon....')

        const response = await privateClient.post('/owner/coupons');

        console.log('Create venue coupon respone : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while creting venue coupon : ', error);
        throw error;
    }
}

export const getVenueCouponById = async (id: string) => {
    try {
        console.log('Fetching venue coupons....');

        const response = await privateClient.get(`/owner/coupons/${id}`);

        console.log('Venue coupon response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while venue coupon fetching : ', error);
        throw error;
    }
}

export const updateVenueCoupon = async (data: { id: string, payload: Coupon }) => {
    try {
        console.log('Updating venue coupons....');

        const response = await privateClient.put(`/owner/coupons/${data.id}`, data.payload);

        console.log('Update Venue coupon response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while venue coupon Updating : ', error);
        throw error;
    }
}

export const deleteVenueCoupon = async (id: string) => {
    try {
        console.log('Deleting venue coupons....');

        const response = await privateClient.delete(`/owner/coupons/${id}`);

        console.log('Delete Venue coupon response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while venue coupon deleting : ', error);
        throw error;
    }
}
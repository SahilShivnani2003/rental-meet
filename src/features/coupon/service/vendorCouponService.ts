import { privateClient } from "@/service/apiClient";
import { Coupon } from "../types/Coupon";

export const getVendorCoupons = async () => {
    try {
        console.log('Fetching vendor coupon.....');

        const response = await privateClient.get('/vendor/service-coupons');

        console.log('Venue coupon resposne : ', response.data);

        return response.data;
    } catch (error) {
        console.error('error while fetching vendor coupon : ', error);
        throw error;
    }
}

export const createVendorCoupon = async (data: Coupon) => {
    try {
        console.log('Creating vendor coupon.....');

        const response = await privateClient.post('/vendor/service-coupons', data);

        console.log('Creating vendor coupon response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while creating vendor coupon : ', error);
        throw error;
    }
}

export const updatingVendorCoupon = async (data: { id: string, payload: Coupon }) => {
    try {
        console.log('Updating vendor coupon....');

        const response = await privateClient.put(`/vendor/service-coupons/${data.id}`, data.payload);

        console.log('Updating vendor coupon response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while updating vendor coupon : ', error);
        throw error;
    }
}

export const deleteVendorCoupon = async (id: string) => {
    try {
        console.log('Deleting vendor coupon....');

        const response = await privateClient.delete(`/vendor/service-coupon/${id}`);

        console.log('Vendor coupon deleting respone : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while deleting vendor coupon : ', error);
        throw error;
    }
}
import { privateClient, publicClient } from "@/service/apiClient";
import { ServiceBooking } from "../types/ServiceBooking";

export const createServiceBooking = async (data: ServiceBooking) => {
    try {
        console.log('Creating vendor service booking.....');

        const response = await privateClient.post('/service-bookings', data);

        console.log('Service booking response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while creating service booking ; ', error);
        throw error;
    }
}

export const validateCoupon = async (data: {
    code: string,
    serviceId: string,
    bookingAmount: string,
}) => {
    try {
        console.log('Validating coupon ...');

        const response = await publicClient.post('/servie-coupons/validate', data);

        console.log('Validate coupon response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while validating coupon : ', error);
        throw error;
    }
}

export const getCustomerBookings = async () => {
    try {
        console.log('Fetching customer booking ....');

        const response = await privateClient.get('/customer/service-bookings');

        console.log('Customer bookings response : ', response.data);

        return response.data;
    } catch (error) {
        console.log('Error while fetching customer bookings : ', error);
        throw error;
    }
}

export const updateQuotationDownloaded = async (data: {
    id: string,
    payload: { action: string }
}) => {
    try {
        console.log('Updating quotation download action ....');

        const response = await privateClient.post(`/service-bookings/${data.id}/downloaded`, data.payload);

        console.log('Updating quotation response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while updating quotatio : ', error);
        throw error;
    }
}

export const vendorServiceBookings = async() =>{
    try{
        console.log('Fetching vendor service booking...');

        const response = await privateClient.get('/vendor/service-bookings');

        console.log('Vendor service booking response : ', response.data);

        return response.data;
    }catch(error){
        console.error('Error while fetching vendor bookings : ', error);
        throw error;
    }
}

export const getServicePlatformSetting = async() =>{
    try{
        console.log('Fetching service plat form setting.....');

        const response = await publicClient.get('/service-platform-settings');

        console.log('Service platform setting response : ', response.data);

        return response.data;
    }catch(error){
        console.error('Error while fetching platform settings: ', error);
        throw error;
    }
}
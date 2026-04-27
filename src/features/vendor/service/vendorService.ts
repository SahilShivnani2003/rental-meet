import { privateClient } from "@/service/apiClient";

export const getVendorProfile = async () => {
    try {
        console.log('Fetching vendor profile....');

        const response = await privateClient.get('/vendor/profile');

        console.log('Vendor profile response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while fetching vendor profile : ', error);
        throw error;
    }
}
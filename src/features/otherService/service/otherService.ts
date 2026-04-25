import { publicClient } from "@/service/apiClient";

export const getOtherService = async () => {
    try {
        console.log('Fetching other services...');

        const response = await publicClient.get('/vendor-services');

        console.log('Other service response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while fetching other services : ', error);
        throw error;
    }
}
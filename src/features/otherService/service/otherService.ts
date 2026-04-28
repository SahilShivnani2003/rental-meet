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

export const getOtherServiceById = async (id: string) => {
    try {
        console.log('Fetching other service by id....');

        const response = await publicClient.get(`/vendor-services/${id}`);

        console.log('Other service by Id resposne : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while fetching other service by Id : ', error);
        throw error;
    }
}
import { privateClient } from "@/service/apiClient";

export const getEnquiry = async () => {
    try {
        const response = await privateClient.get('/owner/enquiries');
        return response.data;
    } catch (error) {
        throw error;
    }
}
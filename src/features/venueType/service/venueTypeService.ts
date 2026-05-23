import { publicClient } from "@/service/apiClient";

export const getAllVenueType = async () => {
    try {
        console.log('Fetching all venue type...');

        const response = await publicClient.get('/venue-types');

        console.log('Venue type response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while fetching venue type ', error);
        throw error;
    }
}
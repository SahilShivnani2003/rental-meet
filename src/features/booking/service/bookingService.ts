import { privateClient } from "@/service/apiClient";

export const getAllBookings = async () => {
    try {
        console.log('Fetching bookings....');

        const response = await privateClient.get('/bookings');

        console.log('Booking response :', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while fetching booking : ', error);
        throw error;
    }
}
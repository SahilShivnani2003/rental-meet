import { privateClient } from "@/service/apiClient";
import { Booking, ModifyBookingPayload } from "../types/Booking";

export interface BookingParasms {
    status?: string;
    search?: string;
    page: number;
    limit: number;
}
export const getAllBookings = async (params: BookingParasms) => {
    try {
        console.log('Fetching bookings....');

        const response = await privateClient.get('/bookings', { params });

        console.log('Booking response :', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while fetching booking : ', error);
        throw error;
    }
}

export const getBookingDetail = async (id: string) => {
    try {
        console.log('Fetching booking detail ');
        const response = await privateClient.get(`/bookings/${id}`);

        console.log('Booking detail response :', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while fetching booking detail :', error);
        throw error;
    }
}

export const updateStatus = async (payload: {
    id: string,
    data: { status: string }
}) => {
    try {
        console.log('Updating booking status....');

        const response = await privateClient.put(`/bookings/${payload.id}/status`, payload.data);

        console.log('Booking status update response : ', response.data);

        return response.data;
    } catch (error) {
        console.log('Error while updating booking status : ', error);
        throw error;
    }
}

export const modifyBooking = async (data: { id: string, payload: ModifyBookingPayload }) => {
    try {
        console.log('Modifying booking....');

        const response = await privateClient.put(`/bookings/${data.id}/modify`, data.payload);

        console.log('Modify booking response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while modifying booking :', error);
        throw error;

    }
}

export const cancleBooking = async (data: { id: string, payload: { reason: string } }) => {
    try {
        console.log('Canceling booking.....');

        const response = await privateClient.put(`/bookings/${data.id}/cancel`, data.payload);

        console.log('Cancel booking response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while cancelig booking : ', error);
        throw error;
    }
}

export const approveSoon = async (id: string) => {
    try {
        console.log('Updating status to approve soon ....');

        const response = await privateClient.put(`/bookings/${id}/approve-soon`);

        console.log('Approve soon response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while update status to approve soon : ', error);
        throw error;
    }
};

export const createBooking = async (data: Booking) => {
    try {
        console.log('Creating booking ....',)

        const response = await privateClient.post('/bookings', data);

        console.log('Crate booking response : ', response.data);

        return response.data
    } catch (error) {
        console.log('Creating booking error : ', error);
        throw error;
    }
}

export const getVenueBlockedDates = async (sku: string) => {
    try {
        console.log('fetching blocked dates.');
        const response = await privateClient.get(`/bookings/booked-dates/${sku}`);
        console.log('Blocked dates responsed: ', response.data);
        return response.data
    } catch (error) {
        console.error('failed to fetch blocked dates : ', error);
        throw error;
    }
}
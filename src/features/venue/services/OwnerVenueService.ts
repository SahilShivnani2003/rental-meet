import { privateClient } from "@/service/apiClient";
import { Venue } from "../types/Venue";

export const getOwnerVenue = async () => {
    try {

        console.log('Fetching owner venue....');

        const response = await privateClient.get('/owner/venues');

        console.log('Owner venue response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while fetching owner venue : ', error);
        throw error;
    }
}

export const getOwnerVenueById = async (id: string) => {
    try {
        console.log('Fetching owner venue by id ....');

        const response = await privateClient.get(`/owner/venues/${id}`);

        console.log('Owner venue by id response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while fetching owner veneue by id : ', error);
        throw error;
    }
}

export const updateOwnerVenue = async (data: { id: string, payload: Venue }) => {
    try {
        console.log('Updating owner venue.....');

        const response = await privateClient.put(`/owner/venues/${data.id}`, data.payload);

        console.log('Owner venue update response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while updating owner veneue : ', error);
        throw error;
    }
}

export const deleteOwnerVenue = async (id: string) => {
    try {
        console.log('Deleting owner venue.....');

        const response = await privateClient.delete(`/owner/venues/${id}`);

        console.log('Deleting owner venue respose : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while deleting owner veneue : ', error);
        throw error;
    }
}

export const toggleVenueActive = async (data: { id: string, payload: { currentIsActive: boolean } }) => {
    try {
        console.log('Updating venue status....');

        const response = await privateClient.put(`/owner/venues/${data.id}/toggle-active`, data.payload);

        console.log('Venue toggle active resposne : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while toggling active inactve of venue : ', error);
        throw error;
    }
}

export const resubmitVenue = async (id: string) => {
    try {
        console.log('Re submiting venue...');
        const response = await privateClient.put(`/owner/venues/${id}/resubmit`)

        console.log('Venue re-submit response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while re submitting venue : ', error);
        throw error;
    }
}

export const createBlockedDates = async (data: {
    id: string,
    payload: { date: Date, reason: string }
}) => {
    try {
        console.log('Creting blocked dates...');

        const response = await privateClient.post(`/owner/venues/${data.id}/blocked-dates`, data.payload);

        console.log('Creating blocked dates resposne : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while creting blocked dates : ', error);
        throw error;
    }
}

export const deletBlockedDates = async (data: { venueId: string, dataId: string }) => {
    try {
        console.log('Deleting blocked dates.....');

        const resposne = await privateClient.delete(`/owner/venues/${data.venueId}/blocked-dates/${data.dataId}`);

        console.log('Deleting blocked dates response : ', resposne.data);

        return resposne.data;
    } catch (error) {
        console.error('Error while deleting blocked dates : ', error);

        throw error;
    }
}
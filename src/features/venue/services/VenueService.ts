import { privateClient, publicClient } from "@/service/apiClient";
import { Venue } from "../types/Venue";

export interface VenueParams {
  city?: string;
  location?: string;
  venueType?: string;
  capacity?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: string;
  limit?: string;
}
export const getAllVenues = async (params?:VenueParams) => {
    try {
        console.log('Fetching all venues....');

        const response = await publicClient.get('/venues', {params});

        console.log('Venues response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while fetching venues : ', error);
        throw error;
    }
}

export const createVenue = async (data: Venue) => {
    try {

        console.log('Creating venue....');

        const response = await privateClient.post('/venues', data);

        console.log('Create venue response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while creating venue: ', error);
        throw error;
    }
}

export const getMyVenue = async () => {
    try {

        console.log('Fetching my venues.....');

        const response = await privateClient.get('/venues/my-venues');

        console.log('My venue response : ', response.data);

        return response.data;
    } catch (error) {
        console.log('Errr while fetching my venue : ', error);
        throw error;
    }
}

export const getVenueLocations = async () => {
    try {
        console.log('Fetching venue location ');

        const response = await publicClient.get('venues/locations/all');

        console.log('Venue location response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while fetching my locations : ', error);
        throw error;
    }
}

export const getVenueById = async (id: string) => {
    try {

        console.log("Fetching venue detail by id...");

        const response = await publicClient.get(`/venues/${id}`);

        console.log('Venue detail response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while fetching venue by Id : ', error);
        throw error;
    }
}

export const deleteVenue = async (id: string) => {
    try {
        console.log('Deleting venue....');

        const response = await privateClient.delete(`/venues/${id}`);

        console.log('Venue delete response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while deleting venue : ', error);
        throw error;
    }
}

interface updateVenuePayload {
    id: string;
    data: Venue;
}
export const updateVenue = async (payload: updateVenuePayload) => {
    try {
        console.log('Updating venue .....');

        const response = await privateClient.put(`/venues/${payload.id}`, payload.data);

        console.log('Update venue respone : ', response.data);

        return response.data
    } catch (error) {
        console.error('Error while updating venue : ', error);
        throw error;
    }
}
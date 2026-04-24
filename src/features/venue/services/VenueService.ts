import { privateClient, publicClient } from "@/service/apiClient";
import { Venue } from "../types/Venue";

export const getAllVenues = async () => {
    try {
        console.log('Fetching all venues....');

        const response = await publicClient.get('/venues');

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

export const getMyVenue = async() =>{
    try{

        console.log('Fetching my venues.....');

        const response = await privateClient.get('/venues/my-venues');

        console.log('My venue response : ', response.data);

        return response.data;        
    }catch(error){
        console.log('Errr while fetching my venue : ', error);
        throw error;
    }
}

export const getVenueLocations = async() =>{
    try{
        console.log('Fetching venue location ');

        const response = await publicClient.get('venues/locations/all');

        console.log('Venue location response : ', response.data);

        return response.data;
    }catch(error){
        console.error('Error while fetching my locations : ', error);
        throw error;
    }
}
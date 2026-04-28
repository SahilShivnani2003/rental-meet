import { privateClient, publicClient } from "@/service/apiClient";
import { VenueReview } from "../types/VenueReview";

export const getVenueReviews = async (venueId: string) => {
    try {
        console.log('fetching venue review...');

        const response = await publicClient.get(`/venues/${venueId}/reviews`);

        console.log('Venue review response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while fetching venue review : ', error);
        throw error;
    }
}


export const createVenueReview = async (data: { id: string, payload: VenueReview }) => {
    try {
        console.log('Creating venue review....');

        const response = await privateClient.post(`/venues/${data.id}/reviews`, data.payload);

        console.log('Create venue response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while creating venue review : ', error);
        throw error;
    }
}

export const getMyVenueReview = async (venueId: string) => {
    try {
        console.log('Fetching my reviews...');

        const response = await privateClient.get(`/venues/${venueId}/reviews/my-review`);

        console.log('My review response : ', response.data);

        return response.data
    } catch (error) {
        console.error('Error while fetching my review : ', error);
        throw error;
    }
}

export const updateVenueReview = async (data: { venueId: string, reviewId: string }) => {
    try {
        console.log('Updating venue review....');

        const response = await privateClient.put(`/venues/${data.venueId}/reviews/${data.reviewId}`);

        console.log('Update review response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while updating venue : ', error);
        throw error;
    }
}

export const deleteVenueReview = async (data: { venueId: string, reviewId: string }) => {
    try {
        console.log('Deleting venue review....');

        const response = await privateClient.delete(`/venues/${data.venueId}/reviews/${data.reviewId}`);

        console.log('Delete review response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while Deleting venue : ', error);
        throw error;
    }
}

export const createHelpfulVenueReview = async (data: {
    venueId: string,
    reviewId: string,
}) => {
    try {
        console.log('Creating help review ....');

        const response = await privateClient.post(`/venues/${data.venueId}/reviews/${data.reviewId}/helpful`);

        console.log('Crete helpful venue review response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while creating helpful review : ', error);
    }
}
import { apiClient, header } from "../api-client";

export const ownerAPI = {

    getDashboard: () => apiClient.get('owner/dashboard', {
        headers: header
    }),

    getVenues: () => apiClient.get('owner/venues', {
        headers: header
    }),

    getVenueById: (id: string) => apiClient.get(`owner/venues/${id}`, {
        headers: header
    }),

    updateVenueStatus: (id: string, data: any) => apiClient.put(`owner/venues/${id}`, data, {
        headers: header
    }),

    deleteVenue: (id: string) => apiClient.delete(`owner/venues/${id}`, {
        headers: header
    })
}
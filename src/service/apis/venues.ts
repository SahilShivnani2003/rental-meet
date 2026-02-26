import { apiClient, header } from "../api-client";

export const venueAPI = {

    getVenues: (params?: any) => apiClient.get('venues', {
        params: params
    }),

    createVenue: (data: any) => apiClient.post('venues', data, {
        headers: header
    }),

    getMyVenues: () => apiClient.get('venues/my-venues', {
        headers: header
    }),

    getVenueLocations: () => apiClient.get('/venues/locations/all'),

    getSku: (sku: string) => apiClient.get(`venues/sku/${sku}`),

    getById: (id: string) => apiClient.get(`venues/${id}`),

    updateVenue: (data: any, id: string) => apiClient.put(`venues/${id}`, data, {
        headers: header
    }),

    deleteVenue: (id: string) => apiClient.delete(`venues/${id}`, {
        headers: header
    }),

    venueImages: (data: any, id: string) => apiClient.post(`venues/${id}/images`, data, {
        headers: header
    })
}
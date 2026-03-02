import { apiClient, getAuthHeader } from "../api-client";

export const venueAPI = {

    getVenues: (params?: any) => apiClient.get('venues', {
        params: params
    }),

    createVenue: (data: any) => apiClient.post('venues', data, {
        headers: getAuthHeader()
    }),

    getMyVenues: () => apiClient.get('venues/my-venues', {
        headers: getAuthHeader()
    }),

    getVenueLocations: () => apiClient.get('/venues/locations/all'),

    getSku: (sku: string) => apiClient.get(`venues/sku/${sku}`),

    getById: (id: string) => apiClient.get(`venues/${id}`),

    updateVenue: (data: any, id: string) => apiClient.put(`venues/${id}`, data, {
        headers: getAuthHeader()
    }),

    deleteVenue: (id: string) => apiClient.delete(`venues/${id}`, {
        headers: getAuthHeader()
    }),

    venueImages: (data: any, id: string) => apiClient.post(`venues/${id}/images`, data, {
        headers: getAuthHeader()
    })
}
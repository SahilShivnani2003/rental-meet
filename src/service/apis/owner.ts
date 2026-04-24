import { apiClient, getAuthHeader} from "../apiClient";

export const ownerAPI = {

    getDashboard: () => apiClient.get('owner/dashboard', {
        headers: getAuthHeader()
    }),

    getVenues: () => apiClient.get('owner/venues', {
        headers: getAuthHeader()
    }),

    getVenueById: (id: string) => apiClient.get(`owner/venues/${id}`, {
        headers: getAuthHeader()
    }),

    updateVenueStatus: (id: string, data: any) => apiClient.put(`owner/venues/${id}`, data, {
        headers: getAuthHeader()
    }),

    deleteVenue: (id: string) => apiClient.delete(`owner/venues/${id}`, {
        headers: getAuthHeader()
    })
}
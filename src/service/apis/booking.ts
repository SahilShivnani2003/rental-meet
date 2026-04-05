import { apiClient, getAuthHeader } from "../api-client";

export const bookingAPI = {
    getAll: () => apiClient.get('bookings', {
        headers: getAuthHeader()
    }),

    create: (data: any) => apiClient.post('bookings', data, {
        headers: getAuthHeader()
    }),

    getById: (id: string) => apiClient.get(`bookings/${id}`),

    updateStatus: (id: string, data: {
        status: string
    }) => apiClient.put(`bookings/${id}/status`, data, {
        headers: getAuthHeader()
    }),

    bookingCancel: (id: string, data: {
        reason: string
    }) => apiClient.put(`bookings/${id}/cancel`, data, {
        headers: getAuthHeader()
    }),

    confirmSoon: (id:string) => apiClient.put(`bookings/${id}/approve-soon`),

    terms: () => apiClient.get('terms/'),
}
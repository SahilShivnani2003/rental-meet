import { apiClient, header } from "../api-client";

export const bookingAPI = {
    getAll: () => apiClient.get('bookings', {
        headers: header
    }),

    create: (data: any) => apiClient.post('bookings', data, {
        headers: header
    }),

    getById: (id: string) => apiClient.get(`bookings/${id}`),

    updateStatus: (id: string, data: any) => apiClient.put(`bookings/${id}/status`, data, {
        headers: header
    }),

    bookingCancel: (id: string, data: any) => apiClient.put(`bookings/${id}/cancel`, data, {
        headers: header
    })
}
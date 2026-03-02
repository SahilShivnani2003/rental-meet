import { apiClient, getAuthHeader } from "../api-client";

export const authAPI = {
    register: (data: any) => apiClient.post('auth/register', data),

    login: (data: any) => apiClient.post('auth/login', data),

    getUser: () => apiClient.get<any>('auth/me', {
        headers: getAuthHeader()
    }),

    updateProfile: (data: any) => apiClient.put('auth/update-profile', data, {
        headers: getAuthHeader()
    }),

    changePassword: (data: any) => apiClient.put('auth/change-password', data, {
        headers: getAuthHeader()
    })
}
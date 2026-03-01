import { apiClient, getAuthHeader } from "../api-client";

export const authAPI = {
    register: (data: any) => apiClient.post<any>('auth/register', data),

    login: (data: any) => apiClient.post<any>('auth/login', data),

    getUser: () => apiClient.get<any>('auth/me', {
        headers: getAuthHeader()
    }),

    updateProfile: (data: any) => apiClient.put<any>('auth/update-profile', data, {
        headers: getAuthHeader()
    }),

    changePassword: (data: any) => apiClient.put<any>('auth/change-password', data, {
        headers: getAuthHeader()
    })

}
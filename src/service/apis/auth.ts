import { apiClient, header } from "../api-client";

export const authAPI = {
    register: (data: any) => apiClient.post('auth/register', data),

    login: (data: any) => apiClient.post('auth/login', data),

    getUser: () => apiClient.get('auth/me', {
        headers: header
    }),

    updateProfile: (data: any) => apiClient.put('auth/update-profile', data, {
        headers: header
    }),

    changePassword: (data: any) => apiClient.put('auth/change-password', data, {
        headers: header
    })

}
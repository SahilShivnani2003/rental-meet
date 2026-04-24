import { apiClient, getAuthHeader } from "../apiClient";

export const imageAPI = {
    uploadImage: (data: any) => apiClient.post('upload/image', data, {
        headers: getAuthHeader()
    }),

    uploadDocument: (data: any) => apiClient.post('upload/document', data, {
        headers: getAuthHeader()
    }),

    delete: (publicId: string) => apiClient.delete(`upload/${publicId}`, {
        headers: getAuthHeader()
    })
}
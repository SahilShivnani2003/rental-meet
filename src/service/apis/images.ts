import { apiClient, header } from "../api-client";

export const imageAPI = {
    uploadImage: (data: any) => apiClient.post('upload/image', data, {
        headers: header
    }),

    uploadDocument: (data: any) => apiClient.post('upload/document', data, {
        headers: header
    }),

    delete: (publicId: string) => apiClient.delete(`upload/${publicId}`, {
        headers: header
    })
}
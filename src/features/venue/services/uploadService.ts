import { privateClient } from "@/service/apiClient";

export const uploadImage = async (data: { file: any, folder: string }) => {
    try {
        console.log('Uploading image.....');

        const response = await privateClient.post('/upload/image', data);

        console.log('Upload image response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while uploading image : ', error);
        throw error;
    }
};

export const uploadDocument = async (data: { file: any, folder: string }) => {
    try {
        console.log('Uploading document....');

        const response = await privateClient.post('/upload/document', data);

        console.log('Upload document response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while uploading document : ', error);
        throw error;
    }
}
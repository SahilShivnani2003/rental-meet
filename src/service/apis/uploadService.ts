import { privateClient } from "../apiClient";

export const upload = async (data: FormData) => {
    try {
        console.log('Uploading ....')
        const resposne = await privateClient.post('/upload/', data, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        })

        console.log('Upload response : ', resposne.data);
        return resposne.data;
    } catch (error) {
        console.error('Upload error : ', error);
        throw error;
    }
}
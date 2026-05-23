import { publicClient } from "@/service/apiClient";

export const quickReplies = async () => {
    try {
        console.log('Getting quick replies...');

        const response = await publicClient.get('/chatbot/quick-replies');

        console.log('Chat bot quick replies response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while getting quick replies : ', error);
        throw error;
    }
}
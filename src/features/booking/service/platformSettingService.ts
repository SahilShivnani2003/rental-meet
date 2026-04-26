import { publicClient } from "@/service/apiClient";

export const getVenuePlatformSettings = async () => {
    try {
        console.log('Fetching platform setting');

        const response = await publicClient.get('/venues/platform-settings/public');

        console.log('Platform setting response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while fetching platform setting : ', error);
        throw error;
    }
};

export const getTermsConditions = async() =>{
    try{
        console.log('Fetching terms and conditions....');

        const response = await publicClient.get('/terms');

        console.log('Terms and condition response : ', response.data);

        return response.data;
    }catch(error){
        console.error('Error while fetching terms : ', error);
        throw error;
    }
}
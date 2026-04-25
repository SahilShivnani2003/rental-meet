import { privateClient } from "@/service/apiClient";

export const getOwnerDashboard = async() =>{
    try{
        console.log('Fetching owner dashboard.....');

        const response = await privateClient.get('/owner/dashboard');

        console.log('Owner dashboard response : ',response.data);

        return response.data;
    }catch(error){
        console.error('Error while fetching owner dashboard : ',error);
        throw error;
    }
}
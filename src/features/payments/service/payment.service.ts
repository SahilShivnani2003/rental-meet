import { privateClient } from "@/service/apiClient";

export const getPaymenst = async(params: {page: number, limit: number}) =>{
    try{
        console.log('Fetching payments');
        const response = await privateClient.get('/owner/payments', {params});
        console.log('Fetched payments : ', response.data);
        return response.data;
    }catch(error){
        console.error('Failed to fetch payments : ', error);
        throw error;
    }
}
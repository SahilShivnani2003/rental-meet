import { privateClient } from "@/service/apiClient";

export const getOwnerVenue = async() =>{
    try{

        console.log('Fetching owner venue....');

        const  response = await privateClient.get('/owner/venues');

        console.log('Owner venue response : ', response.data);

        return response.data;
    }catch(error){
        console.error('Error while fetching owner venue : ',error);
        throw error;
    }
}
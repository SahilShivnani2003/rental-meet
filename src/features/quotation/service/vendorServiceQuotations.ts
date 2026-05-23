import { privateClient } from "@/service/apiClient";

export const getVendorServiceQuotations = async() =>{
    try{
        console.log('Fetching vendor service quotations downloads ...');
        
        const response = await privateClient.get('/vendor/service-quotation-downloads');

        console.log('Vendor service quotation download response : ', response.data);

        return response.data;
    }catch(error){
        console.error('Error while fetching vendor service quotations : ', error);
        throw error;
    }
}
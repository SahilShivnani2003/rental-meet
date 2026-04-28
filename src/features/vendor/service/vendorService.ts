import { privateClient } from "@/service/apiClient";
import { VendorProfile } from "../types/VendorProfile";
import { VendorService } from "@/features/otherService/types/VendorService";

export const getVendorProfile = async () => {
    try {
        console.log('Fetching vendor profile....');

        const response = await privateClient.get('/vendor/profile');

        console.log('Vendor profile response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while fetching vendor profile : ', error);
        throw error;
    }
}

export const getVendorStats = async() =>{
    try{
        console.log('Fetching vendor stats ....');

        const response = await privateClient.get('/vendor/stats');

        console.log('Vendor stats response : ', response.data);

        return response.data;
    }catch(error){
        console.error('Error while fetching vendor stats : ', error);
        throw error;
    }
}

export const updateVendorProfile = async(data: VendorProfile) =>{
    try{
        console.log('Updating vendor Profile....');

        const resposne = await privateClient.put('/vendor/profile', data);

        console.log('Vendor profile update response : ', resposne.data);

        return resposne.data;
    }catch(error){
        console.error('Error while updating vendor profile : ', error);
        throw error;
    }
}

export const vendorProfileSubmit = async() =>{
    try{
        console.log('Submitting vendor profile ....');

        const response = await privateClient.post('/vendor/profile/submit');

        console.log('submitting vendor profile response : ', response.data);

        return response.data
    }catch(error){
        console.error('Error while submmitting vendor profile : ', error);
        throw error;
    }
}

export const getVendorServices = async() =>{
    try{
        console.log('Fetching vendor services .... ');

        const response = await privateClient.get('/vendor/services');

        console.log('vendor service response : ', response.data);

        return response.data;
    }catch(error){
        console.error('Error while fetching vendor services : ', error);
        throw error;
    }
}

export const createVendorService = async(data: VendorService) =>{
    try{
        console.log('Creating vendor serivce ....');

        const response = await privateClient.post('/vendor/services', data);

        console.log('Create vendor service response : ', response.data);

        return response.data;
    }catch(error){
        console.error('Error while creating vendor service : ', error);
        throw error; 
    }
}

export const getVendorServiceById  = async(id : string) =>{
    try{
        console.log('Fetching vendor service by id...');

        const response = await privateClient.get(`/vendor/services/${id}`);

        console.log('Vendor service by id response : ', response.data);

        return response.data;
    }catch(error){
        console.error('Error while fetching vendor serice by id : ', error);
        throw error; 
    }
}

export const updateVendorService = async(data: {id:string, payload: VendorService}) =>{
    try{
        console.log('Updating vendor service ....');

        const response = await privateClient.put(`/vendor/services/${data.id}`, data.payload);

        console.log('Update vendor response : ', response.data);

        return response.data;
    }catch(error){
        console.error('Error while updating vendor : ', error);
        throw error;
    }
}

export const deleteVendorService = async(id: string) =>{
    try{
        console.log('Deleting vendor service ....');

        const response = await privateClient.delete(`/vendor/services/${id}`);

        console.log('Delete vendor response : ', response.data);

        return response.data;
    }catch(error){
        console.error('Error while deleting vendor : ', error);
        throw error;
    }
}

export const submitVendorService = async(id:string)  =>{
    try{
        console.log('Submitting vendor service ....');
        
        const response = await privateClient.post(`/vendor/services/${id}/submit`);

        console.log('Vendor service submit response : ', response.data);

        return response.data;
    }catch(error){
        console.error('Error while submitting vendor serivce : ', error);
        throw error;
    }
}

export const resSumbmitVendorService = async(id:string) =>{
    try{
        console.log('Re-Submitting vendor service ....');
        
        const response = await privateClient.put(`/vendor/services/${id}/resubmit`);

        console.log('Vendor service re-submit response : ', response.data);

        return response.data;
    }catch(error){
        console.error('Error while re-submitting vendor serivce : ', error);
        throw error;
    }
}

export const toggleVendorServiceActive = async(id:string) =>{
    try{
        console.log('Active/Inactive vendor service ....');
        
        const response = await privateClient.put(`/vendor/services/${id}/toggle-active`);

        console.log('Vendor service active/inactive response : ', response.data);

        return response.data;
    }catch(error){
        console.error('Error while active/inactive vendor serivce : ', error);
        throw error;
    }
}

export const blockedDates = async(data:{id:string, payload:{blockedDates:any}}) =>{
    try{
        console.log('Updating vendor service blocked dates ....');
        
        const response = await privateClient.put(`/vendor/services/${data.id}/blocked-dates`, data.payload);

        console.log('Vendor service blocked dates response : ', response.data);

        return response.data;
    }catch(error){
        console.error('Error while Updating vendor service blocked dates : ', error);
        throw error;
    }
}
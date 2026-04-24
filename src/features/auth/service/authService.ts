import { publicClient } from "@/service/apiClient";
import { RegisterClient, RegisterOwner, RegisterVendor } from "../types/Register";

export const registerUser = async(data: RegisterClient | RegisterVendor | RegisterOwner) =>{
    try{

        console.log('User registering...');

        const response = await publicClient.post('/auth/register', data);

        console.log('User register response : ', response.data);

        return response.data;
    }catch(error){
        console.error('Error while user registring : ', error);
        throw error;
    }
}

export const login = async(data: {email: string, password: string})=>{
    try{
        console.log('Loggin user.....');

        const response = await publicClient.post('/auth/login', data);

        console.log('Logging response : ', response.data);

        return response.data
    }catch(error){
        console.error('Error while logging user : ', error);
        throw error;
    }
}
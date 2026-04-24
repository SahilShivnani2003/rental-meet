import { publicClient } from "@/service/apiClient";

export const registerUser = async() =>{
    try{

        console.log('User registering...');

        const response = await publicClient.post('/auth/register');

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
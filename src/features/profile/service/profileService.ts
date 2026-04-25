import { privateClient } from "@/service/apiClient";
import { UpdateUser } from "../types/User";

export const getMyProfile = async () => {
    try {

        console.log('Fetching my profile...');
        const response = await privateClient.get('/auth/me');

        console.log('My profile response : ', response.data);
        return response.data;
    } catch (error) {
        console.error('Error while fetching my profile : ', error);
        throw error;
    }
};

export const updateProfile = async (data: UpdateUser) => {
    try {
        console.log('Updating user profile...');

        const response = await privateClient.put('/auth/update-profile');

        console.log('Update profile respose : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while updating response :', error);
        throw error;
    }
};

interface changePasswordPayload {
    currentPassword: string;
    newPassword: string;
}
export const changePassword = async (data: changePasswordPayload) => {
    try {
        console.log('Changing password....');

        const response = await privateClient.put('/auth/change-password', data);

        console.log('Change pasword response : ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while changing a password :', error);
        throw error;
    }
}

export const deleteAccount = async () => {
    try {
        console.log('Deleting account....');

        const response = await privateClient.delete('/auth/delete-account');

        console.log('Delete account response : ', response.data);

        return response.data
    } catch (error) {
        console.error('Error while deleting account : ', error);
    }
}

export const deactivateAccount = async () => {
    try {
        console.log('Deactivating account ....');
        const response = await privateClient.put('/auth/deactivate-account');

        console.log('Deactivate account response : ', response.data);
        return response.data;
    } catch (error) {
        console.error('Error while deactivating account : ', error);
        throw error;
    }
}

export const uploadKycDoc = async (data: { idProofType: any }) => {
    try {
        console.log('Uploading kyc docs...');

        const response = await privateClient.post('/auth/kyc-upload', data);

        console.log('Kyc doc upload response....', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while uploading kyc docs : ', error);
        throw error;
    }
}
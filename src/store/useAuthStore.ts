import { User } from '@/features/profile/types/User';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from "zustand"

interface AuthStore {
    user: User | null,
    isAuthenticated: boolean,
    token: string | null,
    setUser: (user: User, token: string) => void,
    logOut: () => void,
    loadUser: () => Promise<void>
}

const STORAGE_KEY = 'auth';

export const useAuthStore = create<AuthStore>((set) => ({
    isAuthenticated: false,
    user: null,
    token: null,
    setUser: async (user: User, token: string) => {
        try {
            const data = JSON.stringify({ user, token });

            await AsyncStorage.setItem(STORAGE_KEY, data);

            set({
                isAuthenticated: true,
                user,
                token
            })
        } catch (error) {
            console.error('Error while saving auth : ', error);
        }
    },
    logOut: async () => {
        try {

            await AsyncStorage.removeItem(STORAGE_KEY);

            set({
                isAuthenticated: false,
                user: null,
                token: null
            })
        } catch (error) {
            console.log('Errow while removing auth from local storage : ', error);
        }
    },
    loadUser: async () => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);

            if (data) {
                const authData = JSON.parse(data);

                set({
                    isAuthenticated: true,
                    user: authData?.user,
                    token: authData?.token
                })
            } else {
                console.warn('No data found. User not logged in yet.');
            }
        } catch (error) {
            console.error('Error while loading auth : ', error);
        }
    }
}))
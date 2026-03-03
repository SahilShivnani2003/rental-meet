import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from "zustand"

interface AuthStore {
    user: any | null,
    isAuthenticated: boolean,
    token: any | null,
    setUser: (user: any | null, token: any | null) => void,
    logOut: () => void,
    loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    isAuthenticated: false,
    token: null,
    setUser: async (user, token) => {
        if (user && token) {

            await AsyncStorage.setItem('user', JSON.stringify(user))

            await AsyncStorage.setItem('token', token);

            set({ user: user, isAuthenticated: true, token: token })
        } else {

            await AsyncStorage.removeItem('user');

            set({ user: null, isAuthenticated: false, token: token })
        }
    },
    loadUser: async () => {

        const user = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        debugger
        if (user && token) {
            const userData = JSON.parse(user);
            set({ user: userData, isAuthenticated: true, token:token })
        }
    },
    logOut: async () => {

        await AsyncStorage.removeItem('user');

        set({ user: null, isAuthenticated: false })
    }
}))
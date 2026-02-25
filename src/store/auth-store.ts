import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from "zustand"

interface AuthStore {
    user: any | null,
    isAuthenticated: boolean,
    setUser: (user: any | null) => void,
    logOut: () => void,
    loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    isAuthenticated: false,
    setUser: async (user) => {
        if (user) {
            await AsyncStorage.setItem('user', JSON.stringify(user))
            set({ user: user, isAuthenticated: true })
        } else {
            await AsyncStorage.removeItem('user');
            set({ user: null, isAuthenticated: false })
        }
    },
    loadUser: async () => {

        const user = await AsyncStorage.getItem('user')

        if (user) {
            const userData = JSON.parse(user);
            set({ user: userData, isAuthenticated: true })
        }
    },
    logOut: async () => {

        await AsyncStorage.removeItem('user');

        set({ user: null, isAuthenticated: false })
    }
}))
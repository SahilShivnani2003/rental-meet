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
  
const STORAGE_KEY = 'auth';

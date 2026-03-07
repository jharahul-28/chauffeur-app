import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from '../constants/storageKeys';

export const getAccessToken = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
        console.log("Unable to fetch access token");
        return null;
    }
}

export const setAccessToken = async (token: string) => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
        console.log("Access token stored");
        return;
    } catch (err) {
        console.log("Unable to store access token");
        return;
    }
}

export const removeAccessToken = async () => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
        console.error("Unable to store access token", error);
    }
};
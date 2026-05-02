import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from '../constants/storageKeys';

export const getAccessToken = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
        console.log("Unable to fetch access token");
        return null;
    }
};

export const setAccessToken = async (token: string) => {
    if (!token) {
        console.warn('[tokenStorage] setAccessToken called with empty/undefined token — skipping');
        return;
    }
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
        return;
    } catch (err) {
        console.log("Unable to store access token");
        return;
    }
};

export const removeAccessToken = async () => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
        console.error("Unable to remove access token", error);
    }
};

export const getChauffeurId = async (): Promise<number | null> => {
    try {
        const value = await AsyncStorage.getItem(STORAGE_KEYS.CHAUFFEUR_ID);
        if (!value) return null;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    } catch (error) {
        console.log("Unable to fetch chauffeur id");
        return null;
    }
};

export const setChauffeurId = async (id: number) => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.CHAUFFEUR_ID, String(id));
    } catch (error) {
        console.log("Unable to store chauffeur id");
    }
};

export const removeChauffeurId = async () => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.CHAUFFEUR_ID);
    } catch (error) {
        console.error("Unable to remove chauffeur id", error);
    }
};

export const getActiveBookingVehicleId = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_BOOKING_VEHICLE_ID);
    } catch (error) {
        return null;
    }
};

export const setActiveBookingVehicleId = async (id: string) => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_BOOKING_VEHICLE_ID, id);
    } catch (error) {
        console.error("Unable to store active booking vehicle id", error);
    }
};

export const removeActiveBookingVehicleId = async () => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_BOOKING_VEHICLE_ID);
    } catch (error) {
        console.error("Unable to remove active booking vehicle id", error);
    }
};

export const getRideStartTime = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(STORAGE_KEYS.RIDE_START_TIME);
    } catch (error) {
        return null;
    }
};

export const setRideStartTimeStorage = async (time: string) => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.RIDE_START_TIME, time);
    } catch (error) {
        console.error("Unable to store ride start time", error);
    }
};

export const removeRideStartTime = async () => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.RIDE_START_TIME);
    } catch (error) {
        console.error("Unable to remove ride start time", error);
    }
};
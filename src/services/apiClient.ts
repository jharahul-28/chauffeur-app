import axios from "axios";
import { getAccessToken, setAccessToken, removeAccessToken } from "../storage/tokenStorage";

export { setAccessToken, removeAccessToken };

const apiClient = axios.create({
    baseURL: process.env.EXPO_PUBLIC_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use(
    async (config) => {
        const token = await getAccessToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await removeAccessToken();
        }

        return Promise.reject(error);
    }
);

export default apiClient;
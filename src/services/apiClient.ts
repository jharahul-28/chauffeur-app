import axios from "axios";
import {
    getAccessToken,
    setAccessToken,
    removeAccessToken,
    removeChauffeurId,
} from "../storage/tokenStorage";

export { setAccessToken, removeAccessToken };

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

/** Subscribe to be notified when the API returns 401 (token expired/invalid). */
export const onUnauthorized = (cb: UnauthorizedListener) => {
    unauthorizedListeners.add(cb);
    return () => unauthorizedListeners.delete(cb);
};

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
            config.headers["auth-key"] = token;
        }

        // ── Request log ──────────────────────────────────────────────────────
        console.log('[API] ➡️  Request', {
            method: config.method?.toUpperCase(),
            url: `${config.baseURL}${config.url}`,
            params: config.params,
            headers: {
                'auth-key': token ? `${token.slice(0, 12)}...` : 'MISSING',
                'Content-Type': config.headers['Content-Type'],
            },
        });

        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => {
        // ── Response log ─────────────────────────────────────────────────────
        console.log('[API] ✅ Response', {
            status: response.status,
            url: response.config.url,
            dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
            dataKeys: response.data && typeof response.data === 'object'
                ? Object.keys(response.data)
                : 'N/A',
            // Log full raw data so we can see the exact field names from API
            rawData: response.data,
        });
        return response;
    },
    async (error) => {
        // ── Error log ────────────────────────────────────────────────────────
        console.error('[API] ❌ Error', {
            url: error.config?.url,
            status: error.response?.status,
            message: error.message,
            responseData: error.response?.data,
        });

        if (error.response?.status === 401) {
            await removeAccessToken();
            await removeChauffeurId();
            console.warn('[API] 401 — credentials cleared, notifying listeners');
            unauthorizedListeners.forEach((cb) => cb());
        }

        return Promise.reject(error);
    }
);

export default apiClient;
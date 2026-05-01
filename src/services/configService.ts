import apiClient from './apiClient';

export interface AppConfig {
    LATEST_APP_VERSION: string;
    SOFT_UPDATE: boolean;
    FORCE_UPDATE: boolean;
    HELP_NUMBER: string;
}

export interface ConfigResponse {
    name: string;
    appVersion: string;
    config: AppConfig;
}

/**
 * Fetches remote configuration for the app.
 * Headers (platform, app-version, app-type) are automatically added by apiClient.
 */
export const getAppConfig = async (): Promise<ConfigResponse> => {
    const response = await apiClient.get<ConfigResponse>('/utils/config');
    return response.data;
};

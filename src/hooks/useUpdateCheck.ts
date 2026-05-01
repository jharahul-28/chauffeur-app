import { useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { getAppConfig } from '../services/configService';
import { useAlert } from '../context/AlertContext';

export function useUpdateCheck() {
    const { showAlert } = useAlert();

    useEffect(() => {
        const checkUpdate = async () => {
            try {
                const configData = await getAppConfig();

                // Get version from app.json / Constants
                const currentVersion = Constants.expoConfig?.version || '1.0.0';
                const latestVersion = configData.config.LATEST_APP_VERSION;

                if (latestVersion !== currentVersion) {
                    const isForceUpdate = configData.config.FORCE_UPDATE;
                    const isSoftUpdate = configData.config.SOFT_UPDATE;

                    if (isForceUpdate || isSoftUpdate) {
                        showAlert({
                            title: isForceUpdate ? 'Update Required' : 'Update Available',
                            message: isForceUpdate
                                ? 'A critical update is required to continue using the app. Please update to the latest version.'
                                : 'A new version of the app is available. Would you like to update now?',
                            buttons: [
                                ...(isForceUpdate ? [] : [{
                                    text: 'Later',
                                    onPress: () => { },
                                    type: 'secondary'
                                }]),
                                {
                                    text: 'Update Now',
                                    onPress: () => {
                                        const url = Platform.OS === 'ios'
                                            ? 'https://apps.apple.com/app/idYOUR_APP_ID'
                                            : 'https://play.google.com/store/apps/details?id=com.velvetexperience.chauffeur';
                                        Linking.openURL(url);
                                    },
                                    type: 'primary'
                                }
                            ]
                        });
                    }
                }
            } catch (err) {
                console.error('[useUpdateCheck] Failed to check for updates:', err);
            }
        };

        const timer = setTimeout(checkUpdate, 2000);
        return () => clearTimeout(timer);
    }, [showAlert]);
}

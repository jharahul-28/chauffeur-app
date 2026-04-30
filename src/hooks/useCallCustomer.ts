import { useCallback } from 'react';
import { Linking } from 'react-native';
import { useAlert } from '../context/AlertContext';

export function useCallCustomer() {
  const { showAlert } = useAlert();

  const callCustomer = useCallback((phoneNumber: string | undefined) => {
    if (!phoneNumber) {
      showAlert({
        title: 'No Contact',
        message: 'Customer contact is not available.',
        buttons: [{ text: 'OK', onPress: () => {}, type: 'primary' }],
      });
      return;
    }
    const raw = phoneNumber.replace(/[\s\-()]/g, '');
    const tel = raw.startsWith('+') ? raw : `+${raw}`;
    Linking.openURL(`tel:${tel}`).catch(() => {
      showAlert({
        title: 'Error',
        message: 'Unable to open dialler.',
        buttons: [{ text: 'OK', onPress: () => {}, type: 'primary' }],
      });
    });
  }, [showAlert]);

  return { callCustomer };
}

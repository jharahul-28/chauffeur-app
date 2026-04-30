import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import AppAlert, { AppAlertButton } from '../components/AppAlert';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AlertConfig {
  title?: string;
  message: string;
  buttons?: AppAlertButton[];
}

interface AlertContextValue {
  showAlert: (config: AlertConfig) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AlertContext = createContext<AlertContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig>({ message: '' });

  // Queue: if a second alert fires while one is open, replace with the newer one
  // after the current closes (prevents stacking modals).
  const pendingRef = useRef<AlertConfig | null>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    // If another alert was queued while this one was visible, show it next tick
    if (pendingRef.current) {
      const next = pendingRef.current;
      pendingRef.current = null;
      setTimeout(() => {
        setConfig(next);
        setVisible(true);
      }, 200);
    }
  }, []);

  const showAlert = useCallback((newConfig: AlertConfig) => {
    if (visible) {
      // Replace queued alert — only the latest matters
      pendingRef.current = newConfig;
      return;
    }
    setConfig(newConfig);
    setVisible(true);
  }, [visible]);

  // Wrap each button's onPress so pressing any button auto-dismisses the alert
  const wrappedButtons: AppAlertButton[] | undefined = config.buttons?.map((btn) => ({
    ...btn,
    onPress: () => {
      dismiss();
      btn.onPress();
    },
  }));

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AppAlert
        visible={visible}
        title={config.title}
        message={config.message}
        buttons={wrappedButtons}
        onClose={dismiss}
      />
    </AlertContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return ctx;
}

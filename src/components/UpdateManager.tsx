import { useUpdateCheck } from '../hooks/useUpdateCheck';

/**
 * Headless component that triggers the app update check on mount.
 * Must be rendered within an AlertProvider.
 */
export default function UpdateManager() {
    useUpdateCheck();
    return null;
}

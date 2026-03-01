import React, { createContext, useCallback, useContext, useState, useRef } from 'react';
import CustomAlert, { AlertType, AlertButton } from '../components/customAlert';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AlertOptions {
    type?: AlertType;
    title: string;
    message?: string;
    buttons?: AlertButton[];
    dismissable?: boolean;
}

interface AlertContextValue {
    show: (options: AlertOptions) => void;
    success: (title: string, message?: string, buttons?: AlertButton[]) => void;
    error: (title: string, message?: string, buttons?: AlertButton[]) => void;
    warning: (title: string, message?: string, buttons?: AlertButton[]) => void;
    info: (title: string, message?: string, buttons?: AlertButton[]) => void;
    confirm: (title: string, message?: string) => Promise<boolean>;
    dismiss: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AlertContext = createContext<AlertContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
interface AlertState extends AlertOptions {
    visible: boolean;
}

const DEFAULT_STATE: AlertState = {
    visible: false,
    type: 'info',
    title: '',
    message: undefined,
    buttons: undefined,
    dismissable: true,
};

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [alertState, setAlertState] = useState<AlertState>(DEFAULT_STATE);

    // Holds the resolve function for `confirm()` promises
    const confirmResolve = useRef<((value: boolean) => void) | null>(null);

    const dismiss = useCallback(() => {
        setAlertState((prev) => ({ ...prev, visible: false }));
    }, []);

    const show = useCallback((options: AlertOptions) => {
        setAlertState({
            ...DEFAULT_STATE,
            ...options,
            visible: true,
        });
    }, []);

    const success = useCallback(
        (title: string, message?: string, buttons?: AlertButton[]) =>
            show({
                type: 'success',
                title,
                message,
                buttons: buttons ?? [{ label: 'Done', onPress: dismiss, style: 'primary' }],
            }),
        [show, dismiss],
    );

    const error = useCallback(
        (title: string, message?: string, buttons?: AlertButton[]) =>
            show({
                type: 'error',
                title,
                message,
                buttons: buttons ?? [{ label: 'OK', onPress: dismiss, style: 'primary' }],
            }),
        [show, dismiss],
    );

    const warning = useCallback(
        (title: string, message?: string, buttons?: AlertButton[]) =>
            show({
                type: 'warning',
                title,
                message,
                buttons: buttons ?? [{ label: 'OK', onPress: dismiss, style: 'primary' }],
            }),
        [show, dismiss],
    );

    const info = useCallback(
        (title: string, message?: string, buttons?: AlertButton[]) =>
            show({
                type: 'info',
                title,
                message,
                buttons: buttons ?? [{ label: 'Got it', onPress: dismiss, style: 'primary' }],
            }),
        [show, dismiss],
    );

    const confirm = useCallback(
        (title: string, message?: string): Promise<boolean> =>
            new Promise((resolve) => {
                confirmResolve.current = resolve;

                show({
                    type: 'confirm',
                    title,
                    message,
                    dismissable: false,
                    buttons: [
                        {
                            label: 'Cancel',
                            style: 'ghost',
                            onPress: () => {
                                dismiss();
                                confirmResolve.current?.(false);
                                confirmResolve.current = null;
                            },
                        },
                        {
                            label: 'Confirm',
                            style: 'primary',
                            onPress: () => {
                                dismiss();
                                confirmResolve.current?.(true);
                                confirmResolve.current = null;
                            },
                        },
                    ],
                });
            }),
        [show, dismiss],
    );

    const contextValue: AlertContextValue = {
        show,
        success,
        error,
        warning,
        info,
        confirm,
        dismiss,
    };

    return (
        <AlertContext.Provider value={contextValue}>
            {children}
            <CustomAlert
                visible={alertState.visible}
                type={alertState.type}
                title={alertState.title}
                message={alertState.message}
                buttons={alertState.buttons}
                dismissable={alertState.dismissable}
                onDismiss={dismiss}
            />
        </AlertContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAlert(): AlertContextValue {
    const ctx = useContext(AlertContext);
    if (!ctx) {
        throw new Error('useAlert must be used within an <AlertProvider>');
    }
    return ctx;
}


// ─── Usage Example ────────────────────────────────────────────────────────────
//
// 1. Wrap your app (or navigator root) with <AlertProvider>:
//
//    export default function App() {
//      return (
//        <AlertProvider>
//          <NavigationContainer>
//            {/* ... */}
//          </NavigationContainer>
//        </AlertProvider>
//      );
//    }
//
// 2. Call from any component:
//
//    const alert = useAlert();
//
//    // Simple helpers
//    alert.success('Saved!', 'Your changes have been saved.');
//    alert.error('Oops', 'Something went wrong.');
//    alert.warning('Heads up', 'Only 2 slots remaining.');
//    alert.info('New feature', 'You can now save favourites.');
//
//    // Full control
//    alert.show({
//      type: 'confirm',
//      title: 'Delete item?',
//      message: 'This cannot be undone.',
//      buttons: [
//        { label: 'Cancel',  onPress: alert.dismiss, style: 'ghost'   },
//        { label: 'Delete',  onPress: handleDelete,  style: 'danger'  },
//      ],
//    });
//
//    // Async confirm (await-able)
//    const confirmed = await alert.confirm('Cancel booking?', 'This cannot be undone.');
//    if (confirmed) { /* proceed */ }
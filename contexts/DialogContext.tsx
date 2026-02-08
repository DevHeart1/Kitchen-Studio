import React, { useState, useCallback } from "react";
import createContextHook from "@nkzw/create-context-hook";
import CustomDialog, {
  DialogConfig,
  DialogVariant,
  DialogButton,
} from "@/components/CustomDialog";

interface ShowDialogOptions {
  title: string;
  message: string;
  variant?: DialogVariant;
  buttons?: DialogButton[];
  dismissable?: boolean;
}

function useDialogState() {
  const [visible, setVisible] = useState<boolean>(false);
  const [config, setConfig] = useState<DialogConfig | null>(null);

  const showDialog = useCallback((options: ShowDialogOptions) => {
    setConfig({
      title: options.title,
      message: options.message,
      variant: options.variant ?? "info",
      buttons: options.buttons,
      dismissable: options.dismissable,
    });
    setVisible(true);
  }, []);

  const hideDialog = useCallback(() => {
    setVisible(false);
    setTimeout(() => setConfig(null), 200);
  }, []);

  const showAlert = useCallback(
    (title: string, message: string, onOk?: () => void) => {
      showDialog({
        title,
        message,
        variant: "info",
        buttons: [{ text: "OK", style: "default", onPress: onOk }],
      });
    },
    [showDialog]
  );

  const showSuccess = useCallback(
    (title: string, message: string, onOk?: () => void) => {
      showDialog({
        title,
        message,
        variant: "success",
        buttons: [{ text: "Got it", style: "default", onPress: onOk }],
      });
    },
    [showDialog]
  );

  const showError = useCallback(
    (title: string, message: string, onOk?: () => void) => {
      showDialog({
        title,
        message,
        variant: "error",
        buttons: [{ text: "OK", style: "default", onPress: onOk }],
      });
    },
    [showDialog]
  );

  const showWarning = useCallback(
    (title: string, message: string, onOk?: () => void) => {
      showDialog({
        title,
        message,
        variant: "warning",
        buttons: [{ text: "OK", style: "default", onPress: onOk }],
      });
    },
    [showDialog]
  );

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void,
      confirmText = "Confirm",
      cancelText = "Cancel"
    ) => {
      showDialog({
        title,
        message,
        variant: "confirm",
        buttons: [
          { text: cancelText, style: "cancel", onPress: onCancel },
          { text: confirmText, style: "default", onPress: onConfirm },
        ],
      });
    },
    [showDialog]
  );

  const showDestructive = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void,
      confirmText = "Delete",
      cancelText = "Cancel"
    ) => {
      showDialog({
        title,
        message,
        variant: "destructive",
        dismissable: true,
        buttons: [
          { text: cancelText, style: "cancel", onPress: onCancel },
          { text: confirmText, style: "destructive", onPress: onConfirm },
        ],
      });
    },
    [showDialog]
  );

  return {
    visible,
    config,
    showDialog,
    hideDialog,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showConfirm,
    showDestructive,
  };
}

export const [DialogProviderInner, useDialog] =
  createContextHook(useDialogState);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  return (
    <DialogProviderInner>
      <DialogRenderer>{children}</DialogRenderer>
    </DialogProviderInner>
  );
}

function DialogRenderer({ children }: { children: React.ReactNode }) {
  const { visible, config, hideDialog } = useDialog();

  return (
    <>
      {children}
      <CustomDialog visible={visible} config={config} onDismiss={hideDialog} />
    </>
  );
}

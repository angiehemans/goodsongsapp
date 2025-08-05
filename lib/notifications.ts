import { notifications } from '@mantine/notifications';

interface NotificationOptions {
  title?: string;
  message: string;
  autoClose?: number | boolean;
}

export const showSuccessNotification = (options: NotificationOptions) => {
  notifications.show({
    title: options.title || 'Success',
    message: options.message,
    color: 'green',
    autoClose: options.autoClose ?? 4000,
  });
};

export const showErrorNotification = (options: NotificationOptions) => {
  notifications.show({
    title: options.title || 'Error',
    message: options.message,
    color: 'red',
    autoClose: options.autoClose ?? 6000,
  });
};

export const showInfoNotification = (options: NotificationOptions) => {
  notifications.show({
    title: options.title || 'Info',
    message: options.message,
    color: 'blue',
    autoClose: options.autoClose ?? 4000,
  });
};

export const showWarningNotification = (options: NotificationOptions) => {
  notifications.show({
    title: options.title || 'Warning',
    message: options.message,
    color: 'yellow',
    autoClose: options.autoClose ?? 5000,
  });
};
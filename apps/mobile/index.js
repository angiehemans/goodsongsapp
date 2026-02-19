import { AppRegistry } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Handle background/quit state notifications
// This must be set up before registering the app component
const messaging = getMessaging();
setBackgroundMessageHandler(messaging, async (remoteMessage) => {
  console.log('Background notification received:', remoteMessage);
  // You can process the notification data here if needed
  // The notification will still be displayed by the system
});

AppRegistry.registerComponent(appName, () => App);

// import { Platform } from "react-native";
// import * as Notifications from "expo-notifications";
// import Constants from "expo-constants";
// import { registerDevice } from "../api/notification";
// import googleServicesConfig from "../../google-services.json";

// console.log("🔥 Loaded google-services.json:", {
//   projectId: googleServicesConfig?.project_info?.project_id,
//   projectNumber: googleServicesConfig?.project_info?.project_number,
//   appId: googleServicesConfig?.client?.[0]?.client_info?.mobilesdk_app_id,
//   packageName: googleServicesConfig?.client?.[0]?.client_info?.android_client_info?.package_name,
// });

// let isNotificationsAvailable = true;
// let initialized = false;

// async function initialize() {
//   if (initialized) return;
//   initialized = true;

//   try {
//     const isExpoGo = Constants?.appOwnership === "expo";

//     if (isExpoGo) {
//       console.warn(
//         "Push notifications are not supported in Expo Go. Use a development build instead. See: https://docs.expo.dev/develop/development-builds/introduction/"
//       );
//       isNotificationsAvailable = false;
//       return;
//     }

//     Notifications.setNotificationHandler({
//       handleNotification: async () => ({
//         shouldShowAlert: true,
//         shouldPlaySound: true,
//         shouldSetBadge: true,
//       }),
//     });
//   } catch (err) {
//     console.warn("expo-notifications setup error:", err.message || err);
//   }
// }

// let notificationListener = null;
// let responseListener = null;

// async function getDeviceToken() {
//   await initialize();
//   if (!isNotificationsAvailable || !Notifications) {
//     console.warn("Notifications are not available in this environment.");
//     return null;
//   }

//   const existingPermissions = await Notifications.getPermissionsAsync();
//   let finalStatus = existingPermissions.status;

//   if (finalStatus !== "granted") {
//     const { status } = await Notifications.requestPermissionsAsync();
//     finalStatus = status;
//   }

//   console.log("Notification permission status:", finalStatus);

//   if (finalStatus !== "granted") {
//     console.warn("Notification permission denied by user.");
//     return null;
//   }

//   const projectId =
//     Constants?.expoConfig?.extra?.eas?.projectId ||
//     Constants?.easConfig?.projectId;

//   try {
//     console.log('projectId------------------------------ :>> ', projectId);
//     const token = await Notifications.getExpoPushTokenAsync(
//       projectId ? { projectId } : undefined
//     );
//     console.log('token----------- :>> ', token);
//     return token.data;
//   } catch (err) {
//     console.warn("Could not get push token (FCM setup or Expo Go restriction):", err.message || err);
//     return null;
//   }
// }

// async function registerDeviceWithBackend() {
//   console.log("Registering device for notifications with backend...");
//   await initialize();
//   if (!isNotificationsAvailable) {
//     console.warn("Push notifications are not available. Use a development build for push notification support.");
//     return;
//   }

//   try {
//     const deviceToken = await getDeviceToken();
//     if (!deviceToken) return;

//     const platform = Platform.OS;
//     console.log(`Registering device for notifications: ${deviceToken} (${platform})`);
//     await registerDevice(deviceToken, platform);
//   } catch (error) {
//     console.error("Failed to register device for notifications:", error);
//   }
// }

// function addNotificationListeners() {
//   initialize().then(() => {
//     if (!isNotificationsAvailable || !Notifications) return;

//     if (notificationListener) {
//       Notifications.removeNotificationSubscription(notificationListener);
//     }
//     if (responseListener) {
//       Notifications.removeNotificationSubscription(responseListener);
//     }

//     notificationListener = Notifications.addNotificationReceivedListener((notification) => {
//       console.log("Notification received:", notification);
//     });

//     responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
//       const notification = response.notification;
//       const data = notification.request.content.data;
//       console.log("Notification response:", data);
//     });
//   });
// }

// function removeNotificationListeners() {
//   initialize().then(() => {
//     if (!isNotificationsAvailable || !Notifications) return;

//     if (notificationListener) {
//       Notifications.removeNotificationSubscription(notificationListener);
//       notificationListener = null;
//     }
//     if (responseListener) {
//       Notifications.removeNotificationSubscription(responseListener);
//       responseListener = null;
//     }
//   });
// }

// export const notificationService = {
//   registerDeviceWithBackend,
//   addNotificationListeners,
//   removeNotificationListeners,
//   getDeviceToken,
//   get isAvailable() {
//     return isNotificationsAvailable;
//   },
// };

import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { registerDevice } from "../api/notification";
import googleServicesConfig from "../../google-services.json";

console.log("🔥 Loaded google-services.json:", {
  projectId: googleServicesConfig?.project_info?.project_id,
  projectNumber: googleServicesConfig?.project_info?.project_number,
  appId: googleServicesConfig?.client?.[0]?.client_info?.mobilesdk_app_id,
  packageName:
    googleServicesConfig?.client?.[0]?.client_info?.android_client_info
      ?.package_name,
});

let isNotificationsAvailable = true;
let initialized = false;

let notificationListener = null;
let responseListener = null;

async function initialize() {
  if (initialized) return;

  initialized = true;

  try {
    const isExpoGo = Constants.appOwnership === "expo";

    if (isExpoGo) {
      console.warn(
        "Push notifications are NOT supported in Expo Go. Please use an EAS Development Build."
      );
      isNotificationsAvailable = false;
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    console.log("Notification service initialized.");
  } catch (err) {
    console.error("Notification initialization error:", err);
  }
}

async function getDeviceToken() {
  await initialize();

  if (!isNotificationsAvailable) {
    return null;
  }

  try {
    // Check notification permission
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } =
        await Notifications.requestPermissionsAsync();

      finalStatus = status;
    }

    console.log("Notification Permission:", finalStatus);

    if (finalStatus !== "granted") {
      console.warn("Notification permission denied.");
      return null;
    }

    // Get Native FCM Token for Firebase Admin SDK
    let tokenData = null;

    try {
      const deviceTokenObj = await Notifications.getDevicePushTokenAsync();
      tokenData = deviceTokenObj.data;
    } catch (e) {
      console.warn("getDevicePushTokenAsync error, trying getExpoPushTokenAsync fallback:", e.message || e);
      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ||
          Constants?.easConfig?.projectId;

        const tokenObj = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );
        tokenData = tokenObj.data;
      } catch (err2) {
        console.error("Both token methods failed:", err2.message || err2);
      }
    }

    console.log("=================================");
    console.log("FCM Device Push Token:", tokenData);
    console.log("=================================");

    return tokenData;
  } catch (error) {
    console.error("Failed to get FCM token:", error);
    return null;
  }
}

async function registerDeviceWithBackend() {
  await initialize();

  if (!isNotificationsAvailable) return;

  try {
    const deviceToken = await getDeviceToken();

    if (!deviceToken) {
      console.warn("Device token not found.");
      return;
    }

    const platform = Platform.OS;

    console.log("Registering device...");
    console.log({
      token: deviceToken,
      platform,
    });

    await registerDevice(deviceToken, platform);

    console.log("Device registered successfully.");
  } catch (error) {
    console.error("Failed to register device:", error);
  }
}

function addNotificationListeners() {
  initialize().then(() => {
    if (!isNotificationsAvailable) return;

    if (notificationListener) {
      if (typeof notificationListener.remove === "function") {
        notificationListener.remove();
      } else if (typeof Notifications.removeNotificationSubscription === "function") {
        Notifications.removeNotificationSubscription(notificationListener);
      }
    }

    if (responseListener) {
      if (typeof responseListener.remove === "function") {
        responseListener.remove();
      } else if (typeof Notifications.removeNotificationSubscription === "function") {
        Notifications.removeNotificationSubscription(responseListener);
      }
    }

    notificationListener =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Foreground Notification:");
        console.log(notification);
      });

    responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification Clicked");

        const data = response.notification.request.content.data;

        console.log("Notification Data:", data);

        // Example:
        // navigation.navigate(data.screen, data);
      });
  });
}

function removeNotificationListeners() {
  if (notificationListener) {
    if (typeof notificationListener.remove === "function") {
      notificationListener.remove();
    } else if (typeof Notifications.removeNotificationSubscription === "function") {
      Notifications.removeNotificationSubscription(notificationListener);
    }
    notificationListener = null;
  }

  if (responseListener) {
    if (typeof responseListener.remove === "function") {
      responseListener.remove();
    } else if (typeof Notifications.removeNotificationSubscription === "function") {
      Notifications.removeNotificationSubscription(responseListener);
    }
    responseListener = null;
  }
}

export const notificationService = {
  initialize,
  getDeviceToken,
  registerDeviceWithBackend,
  addNotificationListeners,
  removeNotificationListeners,
  get isAvailable() {
    return isNotificationsAvailable;
  },
};
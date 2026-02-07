import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function initLocalNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  const perm = await Notifications.getPermissionsAsync();
  if (perm.status !== "granted") {
    await Notifications.requestPermissionsAsync();
  }
  console.log("[NOTIF] permission", await Notifications.getPermissionsAsync());

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("azan", {
      name: "Azan",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#F0A500",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: "default",
    });
  }
}

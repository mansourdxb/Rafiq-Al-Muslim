import React, { useEffect, useRef, useState } from "react";
import { BackHandler, Platform, StyleSheet, View } from "react-native";
import { createNavigationContainerRef, NavigationContainer } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import tzLookup from "tz-lookup";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

import { useFonts } from "expo-font";
import { Amiri_400Regular, Amiri_700Bold } from "@expo-google-fonts/amiri";
import { Cairo_400Regular, Cairo_700Bold } from "@expo-google-fonts/cairo";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import AppDrawerNavigator from "@/navigation/AppDrawerNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { initLocalNotifications } from "@/src/services/notificationsInit";
import { getPrayerSettings, getSelectedCity } from "@/src/lib/prayer/preferences";
import { reschedulePrayerNotificationsIfEnabled } from "@/src/services/prayerNotifications";
import { playPreview, stopPreview } from "@/services/athanAudio";
import {
  computePrayerTimes,
  formatTimeInTZ,
  type PrayerName,
} from "@/src/services/prayerTimes";

// Keep splash visible until we manually hide it
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [ready, setReady] = useState(false);
  const [bannerText, setBannerText] = useState<string | null>(null);
  const navigationRef = createNavigationContainerRef();
  const lastAthanRef = useRef<string | null>(null);
  const athanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const athanResyncRef = useRef<NodeJS.Timeout | null>(null);

  const PRAYER_AR: Record<PrayerName, string> = {
    Fajr: "الفجر",
    Sunrise: "الشروق",
    Dhuhr: "الظهر",
    Asr: "العصر",
    Maghrib: "المغرب",
    Isha: "العشاء",
  };

 const [fontsLoaded] = useFonts({
  Amiri: Amiri_400Regular,
  AmiriBold: Amiri_700Bold,
  Cairo: Cairo_400Regular,
  CairoBold: Cairo_700Bold,

  KFGQPCUthmanicScript: require("./assets/fonts/uthmanic_hafs_v20.ttf"),
  KFGQPCUthmanicScriptOTF: require("./assets/fonts/KFGQPC Uthmanic Script HAFS Regular.otf"),
});


  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!fontsLoaded) return;
      } finally {
        if (!mounted) return;
        if (!fontsLoaded) return;

        setReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fontsLoaded]);

  useEffect(() => {
    if (!ready) return;
    void initLocalNotifications();
    (async () => {
      const [city, settings] = await Promise.all([
        getSelectedCity(),
        getPrayerSettings(),
      ]);
      await reschedulePrayerNotificationsIfEnabled({ city, settings });
    })();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    let active = true;

    const clearTimers = () => {
      if (athanTimeoutRef.current) {
        clearTimeout(athanTimeoutRef.current);
        athanTimeoutRef.current = null;
      }
      if (athanResyncRef.current) {
        clearTimeout(athanResyncRef.current);
        athanResyncRef.current = null;
      }
    };

    const scheduleNextCheck = async () => {
      if (!active) return;
      try {
        const [city, settings] = await Promise.all([
          getSelectedCity(),
          getPrayerSettings(),
        ]);
        if (!city || !settings?.notificationsEnabled) return;
        const tz = city.tz ?? tzLookup(city.lat, city.lon);
        const times = computePrayerTimes({
          city: { lat: city.lat, lon: city.lon, tz },
          settings,
          timeZone: tz,
        });
        const nextTime = times.nextPrayerTime;
        const msToNext = nextTime.getTime() - Date.now();
        const fireInMs = Math.max(msToNext - 10000, 0);
        const signature = `${times.nextPrayerName}-${nextTime.toISOString()}`;

        clearTimers();
        athanTimeoutRef.current = setTimeout(() => {
          if (!active) return;
          if (lastAthanRef.current === signature) return;
          lastAthanRef.current = signature;
          const label = PRAYER_AR[times.nextPrayerName] ?? "الصلاة";
          setBannerText(`${label} - ${formatTimeInTZ(nextTime, tz, "ar")}`);
          void playPreview("makkah");
          void scheduleNextCheck();
        }, fireInMs);

        // Hourly resync to keep schedule accurate without frequent polling.
        athanResyncRef.current = setTimeout(() => {
          void scheduleNextCheck();
        }, 60 * 60 * 1000);
      } catch {
        // ignore foreground athan errors
      }
    };

    void scheduleNextCheck();
    return () => {
      active = false;
      clearTimers();
    };
  }, [ready]);

  useEffect(() => {
    if (!ready || Platform.OS !== "android") return;
    const onBackPress = () => {
      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        return false;
      }
      BackHandler.exitApp();
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [ready, navigationRef]);

  useEffect(() => {
    if (!ready) return;
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const body = notification.request.content.body ?? "وقت الصلاة";
      setBannerText(body);
      void playPreview("makkah");
    });
    return () => {
      sub.remove();
      void stopPreview();
    };
  }, [ready]);

  if (!ready) return null;

  return (
    <View style={styles.webOuter}>
      <View style={styles.webInner}>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
              <GestureHandlerRootView style={styles.root}>
                <KeyboardProvider>
                  <ThemeProvider>
                    <AppProvider>
                      <NavigationContainer ref={navigationRef}>
                        <AppDrawerNavigator />
                      </NavigationContainer>
                    </AppProvider>
                    <StatusBar style="auto" />
                  </ThemeProvider>
                </KeyboardProvider>
              </GestureHandlerRootView>
            </SafeAreaProvider>
          </QueryClientProvider>
        </ErrorBoundary>
        {bannerText ? (
          <View style={styles.notifBanner}>
            <Text style={styles.notifBannerText}>{bannerText}</Text>
            <Pressable
              onPress={() => {
                setBannerText(null);
                void stopPreview();
              }}
              style={styles.notifBannerBtn}
            >
              <Text style={styles.notifBannerBtnText}>إيقاف</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    backgroundColor: "#F3F5F8",
    ...(Platform.OS === "web"
      ? { alignItems: "center", justifyContent: "center" }
      : null),
  },
  webInner: {
    flex: 1,
    width: "100%",
    ...(Platform.OS === "web"
      ? {
          maxWidth: 460,
          backgroundColor: "#F3F5F8",
          borderRadius: 28,
          overflow: "hidden",
        }
      : null),
  },
  root: {
    flex: 1,
  },
  notifBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    alignItems: "center",
  },
  notifBannerText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#111111",
    textAlign: "center",
  },
  notifBannerBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(94,167,212,0.18)",
  },
  notifBannerBtnText: {
    fontFamily: "CairoBold",
    fontSize: 12,
    color: "#2D6185",
  },
});

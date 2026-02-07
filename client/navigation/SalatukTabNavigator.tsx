import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { type ParamListBase } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import KaabaDirection from "@/screens/qibla/KaabaDirection";
import QiblaScreen from "@/screens/QiblaScreen";
import PrayerSettingsScreen from "@/screens/settings/PrayerSettingsScreen";
import SalatukCitiesScreen from "@/screens/salatuk/SalatukCitiesScreen";
import SalatukPrayerTimesScreen from "@/screens/salatuk/SalatukPrayerTimesScreen";

export type SalatukTabParamList = {
  SalatukHome: undefined;
  SalatukCities: undefined;
  SalatukSettings: undefined;
  SalatukPrayerTimes: undefined;
  PrayerTimes: undefined;
};

const Tab = createBottomTabNavigator<SalatukTabParamList>();

function SalatukTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routes = state.routes;
  const activeIndex = state.index;
  const barStyle: ViewStyle = useMemo(
    () => ({
      ...styles.bar,
      bottom: Math.max(10, insets.bottom + 6),
    }),
    [insets.bottom]
  );

  const iconNameByRoute: Record<string, keyof typeof Feather.glyphMap> = {
    SalatukHome: "navigation",
    SalatukCities: "globe",
    SalatukSettings: "bell",
    SalatukPrayerTimes: "list",
    PrayerTimes: "clock",
  };

  return (
    <View style={barStyle}>
      {routes.map((route, index) => {
        const isActive = activeIndex === index;
        const iconName = iconNameByRoute[route.name] ?? "circle";
        const focusedBg = isActive ? "#ECECEC" : "transparent";
        const iconColor = isActive ? "#2FA8EE" : "#121212";

        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) {
                navigation.navigate(route.name as keyof ParamListBase);
              }
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={route.name}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.itemPress}
          >
            <View style={[styles.iconBubble, { backgroundColor: focusedBg }]}>
              <Feather name={iconName} size={22} color={iconColor} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SalatukTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="PrayerTimes"
      backBehavior="none"
      tabBar={(props) => <SalatukTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="SalatukHome" component={KaabaDirection} />
      <Tab.Screen name="SalatukCities" component={SalatukCitiesScreen} />
      <Tab.Screen name="SalatukSettings" component={PrayerSettingsScreen} />
      <Tab.Screen name="SalatukPrayerTimes" component={SalatukPrayerTimesScreen} />
      <Tab.Screen
        name="PrayerTimes"
        component={QiblaScreen}
        options={{ title: "الصلوات" }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 14,
    right: 14,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.09,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  itemPress: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
});


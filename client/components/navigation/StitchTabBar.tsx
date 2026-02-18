import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { ParamListBase } from "@react-navigation/native";

const ACTIVE_COLOR = "#D0A85C";
const INACTIVE_COLOR = "#A7A7A7";
const BAR_BG = "#1F4B3B";

const LABELS: Record<string, string> = {
  PrayerTab: "الصلاة",
  QuranTab: "القرآن",
  HadithTab: "الحديث",
  AthkarTab: "الأذكار",
  MoreTab: "المزيد",
};

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  PrayerTab: "moon-outline",
  QuranTab: "book-outline",
  HadithTab: "chatbubble-ellipses-outline",
  AthkarTab: "sparkles-outline",
  MoreTab: "ellipsis-horizontal",
};

export default function StitchTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routes = state.routes;

  const focusedRoute = routes[state.index];
  const focusedOptions = focusedRoute ? descriptors[focusedRoute.key]?.options : undefined;
  const tabBarStyle = focusedOptions?.tabBarStyle as any;
  if (tabBarStyle?.display === "none") return null;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(10, insets.bottom) }]}>
      {routes.map((route, index) => {
        const isFocused = state.index === index;
        const label = LABELS[route.name] ?? route.name;
        const iconName = ICONS[route.name] ?? "ellipse-outline";
        const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

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
            onLongPress={() => {
              navigation.emit({ type: "tabLongPress", target: route.key });
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={descriptors[route.key]?.options?.tabBarAccessibilityLabel}
            style={styles.item}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={iconName} size={22} color={color} />
            <Text style={[styles.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: BAR_BG,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 52,
  },
  label: {
    fontFamily: "Cairo",
    fontSize: 11,
  },
});
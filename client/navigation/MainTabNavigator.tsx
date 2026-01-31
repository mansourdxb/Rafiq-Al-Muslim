import React from "react";
import { View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CounterStackNavigator from "@/navigation/CounterStackNavigator";
import PresetsStackNavigator from "@/navigation/PresetsStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export type MainTabParamList = {
  CounterTab: undefined;
  PresetsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabBarIcon({ 
  name, 
  focused, 
  color 
}: { 
  name: keyof typeof Feather.glyphMap; 
  focused: boolean; 
  color: string;
}) {
  const { theme } = useTheme();
  
  return (
    <View style={styles.tabIconContainer}>
      <Feather name={name} size={22} color={color} />
      {focused ? (
        <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />
      ) : null}
    </View>
  );
}

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="CounterTab"
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: -2,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
          height: 56 + insets.bottom,
          paddingTop: Spacing.xs,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={80}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="CounterTab"
        component={CounterStackNavigator}
        options={{
          title: "Counter",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="circle" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PresetsTab"
        component={PresetsStackNavigator}
        options={{
          title: "Presets",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="list" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="user" focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: "center",
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});

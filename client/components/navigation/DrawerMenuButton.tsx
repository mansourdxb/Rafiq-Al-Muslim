import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { DrawerActions, useNavigation, useTheme } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

export default function DrawerMenuButton() {
  const navigation = useNavigation();
  const theme = useTheme?.();
  const color = theme?.colors?.text ?? "#3B3B3B";

  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      style={({ pressed }) => [styles.button, pressed ? { opacity: 0.85 } : null]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Feather name="menu" size={20} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
});

import React from "react";
import { View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

export default function SalatukEntryScreen() {
  const navigation = useNavigation<any>();

  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent?.();
      if (parent?.getState?.()?.routeNames?.includes("Salatuk")) {
        parent.navigate("Salatuk");
      }
    }, [navigation])
  );

  return <View style={{ flex: 1, backgroundColor: "#F6F2E8" }} />;
}


import React from "react";
import {
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

export default function MasjidsComingSoonScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const goToPrayerTimes = React.useCallback(() => {
    navigation.navigate("PrayerTimes");
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      // Always return to Prayer Times from this screen (hardware back override).
      const onBack = () => {
        goToPrayerTimes();
        return true;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
      return () => sub.remove();
    }, [goToPrayerTimes])
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={goToPrayerTimes} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#2F6E52" />
        </Pressable>
        <Text style={styles.headerTitle}>المساجد</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.message}>قريباً بإذن الله سوف يتم إضافة هذه الخاصية</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F6F2E8",
  },
  header: {
    width: "100%",
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3DED3",
  },
  headerTitle: {
    fontFamily: "CairoBold",
    fontSize: 18,
    color: "#2F6E52",
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  message: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#5C5C5C",
    textAlign: "center",
    lineHeight: 26,
  },
});

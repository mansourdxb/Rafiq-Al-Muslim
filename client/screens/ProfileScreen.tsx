import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { DailyChart } from "@/components/DailyChart";
import { SettingsToggle, SettingsButton } from "@/components/SettingsToggle";
import { SectionHeader } from "@/components/SectionHeader";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { settings, updateSettings, dailyLogs, allTimeTotal, todayTotal } = useApp();

  const handleAbout = () => {
    navigation.navigate("About");
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.profileSection}>
        <View
          style={[
            styles.avatarContainer,
            { backgroundColor: theme.surface },
            Shadows.small,
          ]}
        >
          <Image
            source={require("../../assets/images/avatar-default.png")}
            style={styles.avatar}
            resizeMode="cover"
          />
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>
              {todayTotal.toLocaleString()}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Today
            </ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>
              {allTimeTotal.toLocaleString()}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              All Time
            </ThemedText>
          </View>
        </View>
      </View>

      <SectionHeader title="Analytics" />
      <DailyChart dailyLogs={dailyLogs} />

      <SectionHeader title="Settings" />
      <View style={styles.settingsContainer}>
        <SettingsToggle
          icon="smartphone"
          title="Haptic Feedback"
          subtitle="Vibrate when counting"
          value={settings.hapticEnabled}
          onValueChange={(value) => updateSettings({ hapticEnabled: value })}
        />
        <SettingsToggle
          icon="sun"
          title="Keep Screen On"
          subtitle="Prevent display from sleeping"
          value={settings.keepScreenOn}
          onValueChange={(value) => updateSettings({ keepScreenOn: value })}
        />
        <SettingsButton
          icon="info"
          title="About"
          subtitle="Version 1.0.0"
          onPress={handleAbout}
        />
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xl,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
  },
  settingsContainer: {
    paddingHorizontal: Spacing.lg,
  },
});

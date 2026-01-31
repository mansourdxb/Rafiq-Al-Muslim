import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeInDown } from "react-native-reanimated";
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
        paddingBottom: tabBarHeight + Spacing["2xl"],
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <Animated.View 
        entering={FadeInDown.delay(100).springify()}
        style={styles.profileSection}
      >
        <View
          style={[
            styles.avatarContainer,
            { backgroundColor: theme.surfaceElevated },
            Shadows.medium,
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
            <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>
              Today
            </ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: theme.accent }]}>
              {allTimeTotal.toLocaleString()}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>
              All Time
            </ThemedText>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <SectionHeader title="This Week" />
        <DailyChart dailyLogs={dailyLogs} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).springify()}>
        <SectionHeader title="Preferences" />
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
            title="About Tasbih"
            subtitle="Version 1.0.0"
            onPress={handleAbout}
          />
        </View>
      </Animated.View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing["3xl"],
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 44,
  },
  settingsContainer: {
    paddingHorizontal: Spacing.xl,
  },
});

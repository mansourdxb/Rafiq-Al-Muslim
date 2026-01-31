import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { CounterDisplay } from "@/components/CounterDisplay";
import { StatsRow } from "@/components/StatsRow";
import { FloatingButton } from "@/components/FloatingButton";
import { PresetSelector } from "@/components/PresetSelector";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing } from "@/constants/theme";

export default function CounterScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const {
    presets,
    currentPreset,
    todayTotal,
    allTimeTotal,
    increment,
    undo,
    reset,
    setCurrentPreset,
  } = useApp();

  const [selectorVisible, setSelectorVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);

  const pulseOpacity = useSharedValue(0.4);

  React.useEffect(() => {
    if (currentPreset?.count === 0) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [currentPreset?.count]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handleReset = () => {
    reset();
    setResetModalVisible(false);
  };

  if (!currentPreset) {
    return null;
  }

  const gradientColors = isDark
    ? ["rgba(91, 124, 153, 0.08)", "transparent"]
    : ["rgba(91, 124, 153, 0.05)", "transparent"];

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={gradientColors as [string, string]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />

      <View style={[styles.content, { paddingTop: headerHeight }]}>
        <Pressable
          style={styles.presetButton}
          onPress={() => setSelectorVisible(true)}
        >
          <View style={[styles.colorDot, { backgroundColor: currentPreset.color }]} />
          <ThemedText style={[styles.presetName, { color: theme.textSecondary }]}>
            {currentPreset.name}
          </ThemedText>
          <Feather name="chevron-down" size={16} color={theme.textSecondary} />
        </Pressable>

        <View style={styles.counterArea}>
          <CounterDisplay
            count={currentPreset.count}
            target={currentPreset.target}
            color={currentPreset.color}
            onTap={increment}
          />
          {currentPreset.count === 0 ? (
            <Animated.View style={[styles.hintContainer, pulseStyle]}>
              <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
                Tap anywhere to begin
              </ThemedText>
            </Animated.View>
          ) : null}
        </View>

        <View style={[styles.statsContainer, { paddingBottom: tabBarHeight + Spacing.xl }]}>
          <StatsRow todayTotal={todayTotal} allTimeTotal={allTimeTotal} />
        </View>
      </View>

      <FloatingButton
        icon="rotate-ccw"
        onPress={() => setResetModalVisible(true)}
        bottom={tabBarHeight + Spacing.lg}
        right={Spacing.lg}
      />

      <PresetSelector
        visible={selectorVisible}
        presets={presets}
        currentPresetId={currentPreset.id}
        onSelect={setCurrentPreset}
        onClose={() => setSelectorVisible(false)}
      />

      <ConfirmationModal
        visible={resetModalVisible}
        title="Reset Counter"
        message={`Are you sure you want to reset the counter for ${currentPreset.name}? This will set the count back to 0.`}
        confirmText="Reset"
        confirmColor={theme.error}
        onConfirm={handleReset}
        onCancel={() => setResetModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  presetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  presetName: {
    fontSize: 15,
    fontWeight: "500",
  },
  counterArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  hintContainer: {
    position: "absolute",
    bottom: 60,
  },
  hint: {
    fontSize: 15,
  },
  statsContainer: {
    paddingTop: Spacing.lg,
  },
});

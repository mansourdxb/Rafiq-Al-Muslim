import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
} from "react-native-reanimated";
import { CounterDisplay } from "@/components/CounterDisplay";
import { StatsRow } from "@/components/StatsRow";
import { FloatingButton } from "@/components/FloatingButton";
import { PresetSelector } from "@/components/PresetSelector";
import { PresetPill } from "@/components/PresetPill";
import { TargetSheet } from "@/components/TargetSheet";
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
    reset,
    setCurrentPreset,
    updatePreset,
  } = useApp();

  const [selectorVisible, setSelectorVisible] = useState(false);
  const [targetSheetVisible, setTargetSheetVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);

  const pulseOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (currentPreset?.count === 0) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 1200, easing: Easing.inOut(Easing.ease) })
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

  const handleTargetChange = (newTarget: number) => {
    if (currentPreset) {
      updatePreset(currentPreset.id, { target: newTarget });
    }
  };

  if (!currentPreset) {
    return null;
  }

  const gradientColors = isDark
    ? [theme.gradientStart, theme.gradientEnd] as [string, string]
    : [theme.gradientStart, theme.gradientEnd] as [string, string];

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />

      <Animated.View 
        entering={FadeIn.duration(400)}
        style={[styles.content, { paddingTop: headerHeight + Spacing.sm }]}
      >
        <PresetPill
          preset={currentPreset}
          onPress={() => setSelectorVisible(true)}
          onTargetPress={() => setTargetSheetVisible(true)}
        />

        <View style={styles.counterArea}>
          <CounterDisplay
            count={currentPreset.count}
            target={currentPreset.target}
            color={currentPreset.color}
            onTap={increment}
          />
          {currentPreset.count === 0 ? (
            <Animated.View style={[styles.hintContainer, pulseStyle]}>
              <ThemedText style={[styles.hint, { color: theme.textMuted }]}>
                Tap the ring to begin
              </ThemedText>
            </Animated.View>
          ) : null}
        </View>

        <View style={[styles.statsContainer, { paddingBottom: tabBarHeight + Spacing["2xl"] }]}>
          <StatsRow todayTotal={todayTotal} allTimeTotal={allTimeTotal} />
        </View>
      </Animated.View>

      <FloatingButton
        icon="rotate-ccw"
        onPress={() => setResetModalVisible(true)}
        bottom={tabBarHeight + Spacing.lg}
        right={Spacing.xl}
        color={theme.error}
      />

      <PresetSelector
        visible={selectorVisible}
        presets={presets}
        currentPresetId={currentPreset.id}
        onSelect={setCurrentPreset}
        onClose={() => setSelectorVisible(false)}
      />

      <TargetSheet
        visible={targetSheetVisible}
        currentTarget={currentPreset.target}
        onSelect={handleTargetChange}
        onClose={() => setTargetSheetVisible(false)}
      />

      <ConfirmationModal
        visible={resetModalVisible}
        title="Reset Counter"
        message={`Reset "${currentPreset.name}" counter back to 0?`}
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
  counterArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  hintContainer: {
    position: "absolute",
    bottom: 40,
  },
  hint: {
    fontSize: 15,
    fontWeight: "500",
  },
  statsContainer: {
    paddingTop: Spacing.lg,
  },
});

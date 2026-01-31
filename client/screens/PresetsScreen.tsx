import React, { useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PresetCard } from "@/components/PresetCard";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { FloatingButton } from "@/components/FloatingButton";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing } from "@/constants/theme";
import { Preset } from "@/types";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PresetsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { presets, currentPreset, setCurrentPreset, deletePreset } = useApp();

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<Preset | null>(null);

  const builtInPresets = presets.filter((p) => p.isBuiltIn);
  const customPresets = presets.filter((p) => !p.isBuiltIn);

  const handlePresetPress = (preset: Preset) => {
    setCurrentPreset(preset.id);
    navigation.navigate("Main");
  };

  const handlePresetLongPress = (preset: Preset) => {
    if (!preset.isBuiltIn) {
      setPresetToDelete(preset);
      setDeleteModalVisible(true);
    }
  };

  const handleDelete = () => {
    if (presetToDelete) {
      deletePreset(presetToDelete.id);
    }
    setDeleteModalVisible(false);
    setPresetToDelete(null);
  };

  const handleAddPreset = () => {
    navigation.navigate("AddPreset");
  };

  const renderItem = ({ item }: { item: Preset }) => (
    <PresetCard
      preset={item}
      isActive={item.id === currentPreset?.id}
      onPress={() => handlePresetPress(item)}
      onLongPress={() => handlePresetLongPress(item)}
    />
  );

  const ListHeader = () => (
    <>
      <SectionHeader title="Recommended" />
      {builtInPresets.map((preset) => (
        <PresetCard
          key={preset.id}
          preset={preset}
          isActive={preset.id === currentPreset?.id}
          onPress={() => handlePresetPress(preset)}
        />
      ))}
      <SectionHeader title="Custom" />
    </>
  );

  const EmptyCustom = () => (
    <EmptyState
      image={require("../../assets/images/empty-presets.png")}
      title="No Custom Presets"
      message="Add your own dhikr presets to track different prayers and goals."
      buttonText="Add Preset"
      onButtonPress={handleAddPreset}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={customPresets}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyCustom}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.md,
          paddingBottom: tabBarHeight + Spacing["5xl"],
        }}
        showsVerticalScrollIndicator={false}
      />

      <FloatingButton
        icon="plus"
        onPress={handleAddPreset}
        bottom={tabBarHeight + Spacing.lg}
        right={Spacing.lg}
      />

      <ConfirmationModal
        visible={deleteModalVisible}
        title="Delete Preset"
        message={`Are you sure you want to delete "${presetToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor={theme.error}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

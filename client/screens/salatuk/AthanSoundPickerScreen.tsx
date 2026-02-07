import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import {
  getAthanSounds,
  setPrayerAthanSound,
  type AthanSoundId,
  type PrayerKey,
} from "@/storage/salatukAthanSounds";
import { playPreview, stopPreview } from "@/services/athanAudio";

const OPTIONS: Array<{ id: AthanSoundId; label: string }> = [
  { id: "makkah", label: "أذان مكة" },
  { id: "madina", label: "أذان المدينة" },
  { id: "oriental1", label: "أذان مصر" },
  { id: "oriental2", label: "أذان سوريا" },
  { id: "maghrib1", label: "أذان المغرب" },
];

type RouteParams = { prayer: PrayerKey };

export default function AthanSoundPickerScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const { prayer } = route.params as RouteParams;
  const [savedSoundId, setSavedSoundId] = useState<AthanSoundId>("makkah");
  const [tempSoundId, setTempSoundId] = useState<AthanSoundId>("makkah");

  useEffect(() => {
    let active = true;
    getAthanSounds().then((data) => {
      if (!active) return;
      const initial = data.perPrayerSound[prayer] ?? "makkah";
      setSavedSoundId(initial);
      setTempSoundId(initial);
    });
    return () => {
      active = false;
    };
  }, [prayer]);

  useEffect(() => {
    const sub = navigation.addListener("beforeRemove", () => {
      void stopPreview();
    });
    return sub;
  }, [navigation]);

  useEffect(() => {
    return () => {
      void stopPreview();
    };
  }, []);

  const onSelect = async (id: AthanSoundId) => {
    setTempSoundId(id);
    await playPreview(id);
  };

  const onSave = async () => {
    await setPrayerAthanSound(prayer, tempSoundId);
    await stopPreview();
    navigation.goBack();
  };

  const onClose = async () => {
    setTempSoundId(savedSoundId);
    await stopPreview();
    navigation.goBack();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable
          onPress={onSave}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.saveBtn}
        >
          <Text style={styles.saveText}>حفظ</Text>
        </Pressable>
        <Pressable
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.closeBtn}
        >
          <Feather name="x" size={26} color="#111111" />
        </Pressable>
      </View>

      <Text style={styles.title}>أصوات التطبيق</Text>

      <View style={styles.list}>
        {OPTIONS.map((option) => {
          const isActive = tempSoundId === option.id;
          return (
            <Pressable
              key={option.id}
              style={styles.row}
              onPress={() => onSelect(option.id)}
            >
              <Text style={styles.label}>{option.label}</Text>
              <View style={[styles.radio, isActive && styles.radioActive]}>
                {isActive ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    width: "100%",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  saveBtn: {
    minWidth: 44,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#2FA8EE",
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 8,
    marginBottom: 10,
    fontFamily: "CairoBold",
    fontSize: 20,
    color: "#1E2630",
    textAlign: "center",
  },
  list: {
    paddingHorizontal: 18,
  },
  row: {
    minHeight: 52,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  label: {
    fontFamily: "Cairo",
    fontSize: 15,
    color: "#2A2D32",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#C8CDD2",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: "#F0A500",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F0A500",
  },
});

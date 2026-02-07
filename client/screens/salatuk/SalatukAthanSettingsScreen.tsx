import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import {
  getAthanPrefs,
  setAthanMode,
  type AthanMode,
  type AthanPrayerKey,
  type AthanPrefs,
} from "@/src/lib/prayer/athanPrefs";
import {
  getAthanSounds,
  type AthanSoundId,
  type PrayerKey,
} from "@/storage/salatukAthanSounds";

const PRAYERS: Array<{
  key: AthanPrayerKey;
  soundKey: PrayerKey;
  label: string;
}> = [
  { key: "Fajr", soundKey: "fajr", label: "الفجر" },
  { key: "Dhuhr", soundKey: "dhuhr", label: "الظهر" },
  { key: "Asr", soundKey: "asr", label: "العصر" },
  { key: "Maghrib", soundKey: "maghrib", label: "المغرب" },
  { key: "Isha", soundKey: "isha", label: "العشاء" },
];

const MODE_LABELS: Record<AthanMode, string> = {
  mute: "كتم",
  vibrate: "اهتزاز",
  sound: "صوت",
};

const MODE_ICONS: Record<AthanMode, keyof typeof Feather.glyphMap> = {
  mute: "volume-x",
  vibrate: "smartphone",
  sound: "volume-1",
};

const SOUND_LABELS: Record<AthanSoundId, string> = {
  makkah: "Athan Makkah",
  madina: "Athan Madina",
  oriental1: "Salatuk Athan - Oriental style 1",
  oriental2: "Salatuk Athan - Oriental style 2",
  maghrib1: "Salatuk Athan - Maghrib style 1",
};

export default function SalatukAthanSettingsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<AthanPrefs | null>(null);
  const [sounds, setSounds] = useState<Record<PrayerKey, AthanSoundId> | null>(null);

  useEffect(() => {
    let active = true;
    getAthanPrefs().then((data) => {
      if (active) setPrefs(data);
    });
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      getAthanSounds().then((data) => {
        if (active) setSounds(data.perPrayerSound);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const onSelect = async (prayer: AthanPrayerKey, mode: AthanMode) => {
    const next = await setAthanMode(prayer, mode);
    setPrefs(next);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.closeBtn}
        >
          <Feather name="x" size={26} color="#111111" />
        </Pressable>
      </View>

      <View style={styles.body}>
        {PRAYERS.map((item) => {
          const current = prefs?.[item.key]?.mode ?? "sound";
          const soundId = sounds?.[item.soundKey] ?? "makkah";
          const label = SOUND_LABELS[soundId];
          return (
            <View key={item.key} style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.prayerName}>{item.label}</Text>
                <View style={styles.modes}>
                  {(Object.keys(MODE_LABELS) as AthanMode[]).map((mode) => {
                    const isActive = current === mode;
                    return (
                      <Pressable
                        key={mode}
                        onPress={() => onSelect(item.key, mode)}
                        style={styles.modeBtn}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Feather
                          name={MODE_ICONS[mode]}
                          size={20}
                          color={isActive ? "#F0A500" : "#9AA2A9"}
                        />
                        <Text style={[styles.modeLabel, isActive && styles.modeLabelActive]}>
                          {MODE_LABELS[mode]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <Pressable
                onPress={() => navigation.navigate("AthanSoundPicker", { prayer: item.soundKey })}
              >
                <Text style={styles.athanLabel}>{label}</Text>
              </Pressable>
              <View style={styles.divider} />
            </View>
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
    alignItems: "flex-end",
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  row: {
    paddingTop: 12,
  },
  rowMain: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  prayerName: {
    fontFamily: "CairoBold",
    fontSize: 20,
    color: "#1E2630",
  },
  modes: {
    flexDirection: "row",
    gap: 10,
  },
  modeBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 58,
  },
  modeLabel: {
    marginTop: 2,
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#9AA2A9",
  },
  modeLabelActive: {
    color: "#F0A500",
  },
  athanLabel: {
    marginTop: 6,
    fontFamily: "Cairo",
    fontSize: 13,
    color: "#2FA8EE",
    textAlign: "right",
  },
  divider: {
    marginTop: 10,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
});

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import type { City } from "@/src/lib/prayer/preferences";
import { setSelectedCity } from "@/src/lib/prayer/preferences";
import { getCityFromGPS, searchCityByName } from "@/src/services/cityService";

const RECENTS_KEY = "@tasbeeh/salatukRecentCities";
const MAX_RECENTS = 10;
const SEARCH_DEBOUNCE_MS = 500;

type SalatukLocationModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (city: City) => void;
  currentCity?: City | null;
};

export default function SalatukLocationModal({
  visible,
  onClose,
  onConfirm,
  currentCity,
}: SalatukLocationModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [recents, setRecents] = useState<City[]>([]);
  const [selected, setSelected] = useState<City | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedCity, setDetectedCity] = useState<City | null>(null);
  const searchToken = useRef(0);

  const headerTitle = useMemo(
    () => "" + "\u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0645\u0648\u0642\u0639",
    []
  );

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setQuery("");
    setResults([]);
    setSelected(null);
    void loadRecents();
    if (currentCity && currentCity.source === "gps") {
      setDetectedCity(currentCity);
    }
  }, [visible, currentCity]);

  const runSearch = async (trimmed: string) => {
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const token = ++searchToken.current;
    try {
      console.log("[SalatukSearch] query", trimmed);
      const list = await searchCityByName(trimmed);
      if (searchToken.current !== token) return;
      console.log("[SalatukSearch] results", list.length);
      setResults(list.slice(0, 10));
    } catch {
      if (searchToken.current !== token) return;
      setError("\u062a\u0639\u0630\u0631 \u0627\u0644\u0628\u062d\u062b \u0639\u0646 \u0627\u0644\u0645\u062f\u064a\u0646\u0629");
      setResults([]);
    } finally {
      if (searchToken.current === token) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!visible) return;
    const trimmed = query.trim();
    const timer = setTimeout(async () => {
      await runSearch(trimmed);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, visible]);

  const loadRecents = async () => {
    try {
      const raw = await AsyncStorage.getItem(RECENTS_KEY);
      if (!raw) {
        setRecents([]);
        return;
      }
      const parsed = JSON.parse(raw) as City[];
      setRecents(Array.isArray(parsed) ? parsed : []);
    } catch {
      setRecents([]);
    }
  };

  const saveRecents = async (next: City[]) => {
    setRecents(next);
    try {
      await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const isSameCity = (a: City, b: City) => {
    if (a.lat === b.lat && a.lon === b.lon) return true;
    const aName = (a.name || "").trim().toLowerCase();
    const bName = (b.name || "").trim().toLowerCase();
    const aCountry = (a.country || "").trim().toLowerCase();
    const bCountry = (b.country || "").trim().toLowerCase();
    return aName && bName && aName === bName && aCountry === bCountry;
  };

  const pushRecent = async (city: City) => {
    const next = [city, ...recents.filter((item) => !isSameCity(item, city))].slice(0, MAX_RECENTS);
    await saveRecents(next);
  };

  const handleRemoveRecent = async (city: City) => {
    const next = recents.filter((item) => !isSameCity(item, city));
    await saveRecents(next);
  };

  const handleUseCurrentLocation = async () => {
    setLoadingGPS(true);
    setError(null);
    try {
      const city = await getCityFromGPS();
      const nextCity = { ...city, source: "gps" as const };
      setDetectedCity(nextCity);
      await setSelectedCity(nextCity);
      await pushRecent(nextCity);
      onConfirm(nextCity);
      onClose();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "\u062a\u0639\u0630\u0631 \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0648\u0642\u0639 \u0627\u0644\u062d\u0627\u0644\u064a";
      setError(message);
    } finally {
      setLoadingGPS(false);
    }
  };

  const handleConfirmManual = async () => {
    if (!selected) return;
    const nextCity = { ...selected, source: "manual" as const };
    await setSelectedCity(nextCity);
    await pushRecent(nextCity);
    onConfirm(nextCity);
    onClose();
  };

  const showRecents = !query.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{headerTitle}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
              <Feather name="x" size={20} color="#6E5A46" />
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={"\u0623\u062f\u062e\u0644 \u0645\u0648\u0642\u0639\u0643 \u064a\u062f\u0648\u064a\u0627\u064b"}
              placeholderTextColor="#8A8A8A"
              style={styles.input}
              textAlign="right"
              returnKeyType="search"
              onSubmitEditing={() => runSearch(query.trim())}
            />
          </View>

          <Text style={styles.orText}>{"\u0623\u0648"}</Text>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed ? styles.pressed : null,
            ]}
            onPress={handleUseCurrentLocation}
            disabled={loadingGPS}
          >
            {loadingGPS ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.primaryContent}>
                <Feather name="crosshair" size={18} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>{"\u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0648\u0642\u0639 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b"}</Text>
              </View>
            )}
          </Pressable>

          {detectedCity ? (
            <Text style={styles.detectedText}>
              {detectedCity.country
                ? `${detectedCity.name}, ${detectedCity.country}`
                : detectedCity.name}
            </Text>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{"\u0646\u062a\u0627\u0626\u062c \u0627\u0644\u0628\u062d\u062b"}</Text>
            </View>

            <View style={styles.resultsWrap}>
              {loading ? (
                <Text style={styles.loadingText}>{"\u062c\u0627\u0631\u064a \u0627\u0644\u0628\u062d\u062b..."}</Text>
              ) : query.trim().length >= 2 && results.length === 0 ? (
                <Text style={styles.emptyText}>{"\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c"}</Text>
              ) : (
                <FlatList
                  data={results}
                  keyExtractor={(item) => `${item.name}-${item.lat}-${item.lon}`}
                  style={styles.resultsList}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => {
                    const isSelected = selected ? isSameCity(selected, item) : false;
                    return (
                      <Pressable
                        style={({ pressed }) => [
                          styles.resultRow,
                          isSelected ? styles.resultRowSelected : null,
                          pressed ? styles.resultRowPressed : null,
                        ]}
                        onPress={() => setSelected(item)}
                      >
                        <View style={styles.resultTextWrap}>
                          <Text style={styles.resultTitle}>
                            {item.name}
                          </Text>
                          <Text style={styles.resultMeta}>
                            {item.lat.toFixed(3)}, {item.lon.toFixed(3)}
                          </Text>
                        </View>
                        {isSelected ? <Feather name="check" size={18} color="#3D6FA3" /> : null}
                      </Pressable>
                    );
                  }}
                />
              )}
            </View>
          </View>

          {showRecents ? (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>{"\u0627\u0644\u0645\u0648\u0627\u0642\u0639 \u0627\u0644\u0623\u062e\u064a\u0631\u0629"}</Text>
              {recents.length === 0 ? (
                <Text style={styles.emptyText}>{"\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0648\u0627\u0642\u0639 \u0645\u062d\u0641\u0648\u0638\u0629"}</Text>
              ) : (
                recents.map((item) => {
                  const isSelected = selected ? isSameCity(selected, item) : false;
                  return (
                  <View key={`${item.name}-${item.lat}-${item.lon}`} style={styles.recentRow}>
                      <Pressable
                        style={styles.recentRemove}
                        onPress={() => handleRemoveRecent(item)}
                        accessibilityRole="button"
                      >
                        <Feather name="x" size={16} color="#B3261E" />
                      </Pressable>
                      <Pressable
                        style={styles.recentContent}
                        onPress={() => setSelected(item)}
                        accessibilityRole="button"
                      >
                        <Text style={styles.resultTitle}>
                          {item.name}
                        </Text>
                      </Pressable>
                      {isSelected ? (
                        <Feather name="check" size={16} color="#3D6FA3" />
                      ) : (
                        <Feather name="clock" size={16} color="#9C8A75" />
                      )}
                    </View>
                  );
                })
              )}
            </View>
          ) : null}

          <View style={styles.footerRow}>
            <Pressable
              style={({ pressed }) => [
                styles.confirmButton,
                !selected ? styles.confirmButtonDisabled : null,
                pressed && selected ? styles.pressed : null,
              ]}
              onPress={handleConfirmManual}
              disabled={!selected}
            >
              <Text style={styles.confirmButtonText}>{"\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0645\u0648\u0642\u0639"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 22,
    backgroundColor: "#FDF8EF",
    borderWidth: 1,
    borderColor: "rgba(80,56,28,0.10)",
    padding: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: "CairoBold",
    fontSize: 22,
    color: "#6E5A46",
    textAlign: "right",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4E9D9",
  },
  searchWrap: {
    marginTop: 12,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(80,56,28,0.16)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    fontFamily: "Cairo",
    fontSize: 15,
    color: "#3B3B3B",
    textAlign: "right",
  },
  orText: {
    textAlign: "center",
    color: "#9C8A75",
    fontFamily: "CairoBold",
    marginVertical: 8,
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  primaryContent: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  detectedText: {
    fontFamily: "Cairo",
    fontSize: 13,
    color: "#6E5A46",
    textAlign: "right",
    marginBottom: 6,
  },
  errorText: {
    fontFamily: "Cairo",
    fontSize: 14,
    color: "#B3261E",
    textAlign: "right",
    marginBottom: 6,
  },
  sectionWrap: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: "CairoBold",
    fontSize: 15,
    color: "#6E5A46",
    textAlign: "right",
    marginBottom: 6,
  },
  loadingRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  loadingText: {
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#9C8A75",
  },
  resultsWrap: {
    width: "100%",
    maxHeight: 220,
  },
  resultsList: {
    width: "100%",
  },
  emptyText: {
    fontFamily: "Cairo",
    fontSize: 13,
    color: "#9C8A75",
    textAlign: "right",
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(80,56,28,0.10)",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    gap: 8,
  },
  recentRemove: {
    padding: 4,
  },
  recentContent: {
    flex: 1,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(80,56,28,0.10)",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  resultRowSelected: {
    borderColor: "#3D6FA3",
    backgroundColor: "rgba(61,111,163,0.08)",
  },
  resultRowPressed: {
    opacity: 0.85,
  },
  resultTextWrap: {
    flex: 1,
  },
  resultTitle: {
    fontFamily: "CairoBold",
    fontSize: 15,
    color: "#3B3B3B",
    textAlign: "right",
  },
  resultMeta: {
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#7D7D7D",
    textAlign: "right",
  },
  footerRow: {
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
    marginTop: 4,
  },
  confirmButton: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 18,
    backgroundColor: "#6E5A46",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontFamily: "CairoBold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  pressed: {
    opacity: 0.88,
  },
});

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import type { City } from "@/screens/qibla/services/preferences";
import { getCityFromGPS, searchCityByName } from "@/screens/qibla/services/cityService";

type CityPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (city: City) => void;
};

export default function CityPickerModal({
  visible,
  onClose,
  onSelect,
}: CityPickerModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showSearchResults = query.trim().length >= 2;

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    setLoadingSearch(true);
    const timer = setTimeout(async () => {
      try {
        const list = await searchCityByName(term);
        setResults(list);
      } catch {
        setError("تعذر البحث عن المدينة");
        setResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [query]);

  const handleUseCurrentLocation = async () => {
    setLoadingGPS(true);
    setError(null);
    try {
      const city = await getCityFromGPS();
      onSelect(city);
      onClose();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "تعذر تحديد الموقع الحالي";
      setError(message);
    } finally {
      setLoadingGPS(false);
    }
  };

  const handleSelectCity = (city: City) => {
    onSelect(city);
    onClose();
  };

  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 430);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.page}>
        <View style={[styles.sheet, { width: contentWidth }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeIcon}>
              <Feather name="x" size={26} color="#111111" />
            </Pressable>
          </View>

          <View style={styles.inputWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="أدخل اسم المدينة"
              placeholderTextColor="#B7B7B7"
              style={styles.input}
              textAlign="right"
              returnKeyType="search"
              onSubmitEditing={() => {}}
            />
            <View style={styles.inputUnderline} />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {showSearchResults ? (
            <>
              <Text style={styles.sectionTitle}>نتائج البحث</Text>
              <View style={styles.resultsWrap}>
                {loadingSearch ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#6B6E72" />
                  </View>
                ) : results.length === 0 ? (
                  <Text style={styles.emptyText}>لا توجد نتائج</Text>
                ) : (
                  results.map((item) => (
                    <Pressable
                      key={`${item.name}-${item.lat}-${item.lon}`}
                      style={styles.resultRow}
                      onPress={() => handleSelectCity(item)}
                    >
                      <Text style={styles.resultTitle}>{item.name}</Text>
                      <Text style={styles.resultMeta}>
                        Latitude: {item.lat.toFixed(4)}, Longitude: {item.lon.toFixed(4)}
                      </Text>
                    </Pressable>
                  ))
                )}
              </View>
            </>
          ) : null}

          <View style={styles.gpsRow}>
            <Pressable
              style={({ pressed }) => [styles.gpsButton, pressed ? styles.pressed : null]}
              onPress={handleUseCurrentLocation}
              disabled={loadingGPS}
            >
              {loadingGPS ? (
                <ActivityIndicator color="#111111" />
              ) : (
                <Text style={styles.gpsText}>استخدام الموقع الحالي</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: 430,
  },
  headerRow: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 20,
  },
  closeIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: {
    marginBottom: 18,
  },
  input: {
    minHeight: 40,
    paddingHorizontal: 6,
    fontFamily: "Cairo",
    fontSize: 20,
    color: "#111111",
  },
  inputUnderline: {
    height: 1,
    backgroundColor: "#6B6E72",
    marginTop: 6,
  },
  errorText: {
    fontFamily: "Cairo",
    fontSize: 14,
    color: "#B3261E",
    textAlign: "right",
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#5E5E5E",
    textAlign: "right",
    marginBottom: 10,
  },
  resultsWrap: {
    maxHeight: 300,
    marginBottom: 18,
  },
  resultRow: {
    paddingVertical: 10,
    alignItems: "flex-end",
  },
  resultTitle: {
    fontFamily: "CairoBold",
    fontSize: 18,
    color: "#111111",
    textAlign: "right",
  },
  resultMeta: {
    marginTop: 4,
    fontFamily: "Cairo",
    fontSize: 13,
    color: "#6B6E72",
    textAlign: "right",
  },
  resultMain: {
    flex: 1,
    alignItems: "flex-end",
    paddingHorizontal: 12,
  },
  removeIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingRow: {
    paddingVertical: 12,
    alignItems: "center",
  },
  gpsRow: {
    marginTop: 8,
    alignItems: "center",
  },
  gpsButton: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  gpsText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#111111",
  },
  pressed: {
    opacity: 0.88,
  },
});


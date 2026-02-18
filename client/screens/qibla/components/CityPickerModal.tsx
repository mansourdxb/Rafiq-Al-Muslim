import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  const insets = useSafeAreaInsets();
  const showSearchResults = query.trim().length >= 2;

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults([]);
      setError(null);
    }
  }, [visible]);

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
      <View style={[styles.page, { paddingTop: insets.top }]}>
        {/* ─── Header ─── */}
        <LinearGradient
          colors={["#5A8F6A", "#79A688", "#8EB89C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={[styles.headerInner, { width: contentWidth }]}>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Feather name="x" size={22} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerTitle}>اختر المدينة</Text>
            <View style={styles.closeBtnSpacer} />
          </View>
        </LinearGradient>

        <View style={[styles.body, { width: contentWidth }]}>
          {/* ─── Search Bar ─── */}
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color="#8C8C8C" style={styles.searchIcon} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="ابحث عن مدينة..."
              placeholderTextColor="#B5B5B5"
              style={styles.searchInput}
              textAlign="right"
              returnKeyType="search"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8} style={styles.clearBtn}>
                <Feather name="x-circle" size={16} color="#B5B5B5" />
              </Pressable>
            )}
          </View>

          {/* ─── GPS Card ─── */}
          <Pressable
            style={({ pressed }) => [styles.gpsCard, pressed && styles.gpsCardPressed]}
            onPress={handleUseCurrentLocation}
            disabled={loadingGPS}
          >
            <View style={styles.gpsIconWrap}>
              {loadingGPS ? (
                <ActivityIndicator size="small" color={C.green} />
              ) : (
                <Ionicons name="navigate" size={20} color={C.green} />
              )}
            </View>
            <View style={styles.gpsTextWrap}>
              <Text style={styles.gpsTitle}>استخدام الموقع الحالي</Text>
              <Text style={styles.gpsSubtitle}>تحديد المدينة تلقائياً عبر GPS</Text>
            </View>
            <Feather name="chevron-left" size={18} color="#C8C8C8" />
          </Pressable>

          {/* ─── Error ─── */}
          {error ? (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={15} color="#C0392B" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* ─── Search Results ─── */}
          {showSearchResults ? (
            <View style={styles.resultsSection}>
              <Text style={styles.sectionLabel}>نتائج البحث</Text>

              {loadingSearch ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator color={C.green} />
                  <Text style={styles.loadingText}>جارٍ البحث...</Text>
                </View>
              ) : results.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Feather name="map-pin" size={32} color="#D4D4D4" />
                  <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
                  <Text style={styles.emptySubtitle}>جرّب اسم مدينة مختلف</Text>
                </View>
              ) : (
                <FlatList
                  data={results}
                  keyExtractor={(item) => `${item.name}-${item.lat}-${item.lon}`}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  style={styles.resultsList}
                  renderItem={({ item }) => {
                    const cityName = item.name?.split(",")[0]?.trim() ?? item.name;
                    const region = item.name?.includes(",")
                      ? item.name.substring(item.name.indexOf(",") + 1).trim()
                      : null;
                    return (
                      <Pressable
                        style={({ pressed }) => [
                          styles.resultCard,
                          pressed && styles.resultCardPressed,
                        ]}
                        onPress={() => handleSelectCity(item)}
                      >
                        <View style={styles.resultIconWrap}>
                          <Ionicons name="location" size={18} color={C.green} />
                        </View>
                        <View style={styles.resultTextWrap}>
                          <Text style={styles.resultName}>{cityName}</Text>
                          {region ? (
                            <Text style={styles.resultRegion}>{region}</Text>
                          ) : null}
                        </View>
                        <Feather name="chevron-left" size={16} color="#D4D4D4" />
                      </Pressable>
                    );
                  }}
                />
              )}
            </View>
          ) : null}

          {/* ─── Hint (empty state) ─── */}
          {!showSearchResults && !error && (
            <View style={styles.hintWrap}>
              <View style={styles.hintIconCircle}>
                <Ionicons name="earth" size={38} color={C.green} />
              </View>
              <Text style={styles.hintTitle}>ابحث عن مدينتك</Text>
              <Text style={styles.hintSubtitle}>
                اكتب اسم المدينة لتحديد مواقيت الصلاة بدقة
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const C = {
  bg: "#FDFCF7",
  card: "#FFFFFF",
  green: "#5A8F6A",
  greenLight: "#EBF3ED",
  text: "#2E2F2E",
  textMuted: "#8C8C8C",
  border: "rgba(0,0,0,0.05)",
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: C.bg,
  },
  /* ─── Header ─── */
  header: {
    paddingTop: 14,
    paddingBottom: 14,
    alignItems: "center",
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontFamily: "CairoBold",
    fontSize: 18,
    color: "#FFFFFF",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnSpacer: {
    width: 36,
  },
  /* ─── Body ─── */
  body: {
    flex: 1,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  /* ─── Search Bar ─── */
  searchBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 50,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchIcon: {
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Cairo",
    fontSize: 16,
    color: C.text,
    paddingVertical: 0,
  },
  clearBtn: {
    marginRight: 6,
    padding: 4,
  },
  /* ─── GPS Card ─── */
  gpsCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginTop: 12,
    gap: 12,
  },
  gpsCardPressed: {
    backgroundColor: C.greenLight,
  },
  gpsIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.greenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  gpsTextWrap: {
    flex: 1,
    alignItems: "flex-end",
  },
  gpsTitle: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: C.text,
  },
  gpsSubtitle: {
    fontFamily: "Cairo",
    fontSize: 11,
    color: C.textMuted,
    marginTop: -2,
  },
  /* ─── Error ─── */
  errorRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  errorText: {
    fontFamily: "Cairo",
    fontSize: 13,
    color: "#C0392B",
  },
  /* ─── Results ─── */
  resultsSection: {
    flex: 1,
    marginTop: 18,
  },
  sectionLabel: {
    fontFamily: "CairoBold",
    fontSize: 13,
    color: C.textMuted,
    textAlign: "right",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  resultsList: {
    flex: 1,
  },
  resultCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  resultCardPressed: {
    backgroundColor: C.greenLight,
  },
  resultIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.greenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTextWrap: {
    flex: 1,
    alignItems: "flex-end",
  },
  resultName: {
    fontFamily: "CairoBold",
    fontSize: 15,
    color: C.text,
    textAlign: "right",
  },
  resultRegion: {
    fontFamily: "Cairo",
    fontSize: 12,
    color: C.textMuted,
    textAlign: "right",
    marginTop: -2,
  },
  /* ─── Loading ─── */
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 30,
    gap: 8,
  },
  loadingText: {
    fontFamily: "Cairo",
    fontSize: 13,
    color: C.textMuted,
  },
  /* ─── Empty ─── */
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 30,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: "CairoBold",
    fontSize: 15,
    color: C.textMuted,
    marginTop: 4,
  },
  emptySubtitle: {
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#B5B5B5",
  },
  /* ─── Hint (empty state) ─── */
  hintWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 6,
  },
  hintIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.greenLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  hintTitle: {
    fontFamily: "CairoBold",
    fontSize: 17,
    color: C.text,
  },
  hintSubtitle: {
    fontFamily: "Cairo",
    fontSize: 13,
    color: C.textMuted,
    textAlign: "center",
    maxWidth: 240,
  },
});
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

import { fetchNearbyMasjids, type NearbyMasjid } from "@/src/services/nearbyMasjids";
import { getSelectedCity } from "@/screens/qibla/services/preferences";

const RADII = [5, 10, 20, 50] as const;
type RadiusOption = (typeof RADII)[number];

export default function NearbyMasjidsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 430);

  const [radiusKm, setRadiusKm] = useState<RadiusOption>(10);
  const [useMyLocation, setUseMyLocation] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<NearbyMasjid[]>([]);

  const resolveCoords = useCallback(async () => {
    setError(null);

    if (useMyLocation) {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.granted) {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        return;
      }
      setError("لم يتم منح إذن الموقع. سيتم استخدام المدينة المحددة.");
    }

    const city = await getSelectedCity();
    if (city) setCoords({ lat: city.lat, lon: city.lon });
    else {
      setCoords(null);
      setError("لا توجد مدينة محددة.");
    }
  }, [useMyLocation]);

  const loadMasjids = useCallback(async () => {
    if (!coords) return;
    setLoading(true);
    setError(null);
    try {
      const list = await fetchNearbyMasjids({
        lat: coords.lat,
        lon: coords.lon,
        radiusKm,
      });
      setItems(list);
    } catch {
      setError("تعذر تحميل المساجد القريبة. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }, [coords, radiusKm]);

  useEffect(() => {
    void resolveCoords();
  }, [resolveCoords]);

  useEffect(() => {
    if (coords) void loadMasjids();
  }, [coords, loadMasjids]);

  const renderItem = ({ item }: { item: NearbyMasjid }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDistance}>{item.distanceKm.toFixed(1)} كم</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}> 
      <View style={[styles.header, { width: contentWidth }]}> 
        <Text style={styles.headerTitle}>المساجد القريبة</Text>
      </View>

      <View style={[styles.controls, { width: contentWidth }]}> 
        <View style={styles.switchRow}>
          <Pressable
            onPress={() => setUseMyLocation((prev) => !prev)}
            style={[styles.toggleBtn, useMyLocation && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, useMyLocation && styles.toggleTextActive]}>
              موقعي الحالي
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setUseMyLocation(false)}
            style={[styles.toggleBtn, !useMyLocation && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, !useMyLocation && styles.toggleTextActive]}>
              المدينة المحددة
            </Text>
          </Pressable>
        </View>

        <View style={styles.radiusRow}>
          {RADII.map((r) => (
            <Pressable
              key={r}
              onPress={() => setRadiusKm(r)}
              style={[styles.radiusBtn, radiusKm === r && styles.radiusBtnActive]}
            >
              <Text style={[styles.radiusText, radiusKm === r && styles.radiusTextActive]}>
                {r} كم
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.mapWrap, { width: contentWidth }]}> 
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={28} color="#2F6E52" />
          <Text style={styles.placeholderText}>عرض الخريطة غير متاح على الويب.</Text>
        </View>
      </View>

      <View style={[styles.listWrap, { width: contentWidth }]}> 
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#2F6E52" />
            <Text style={styles.loadingText}>جاري تحميل المساجد...</Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : items.length === 0 ? (
          <Text style={styles.emptyText}>لا توجد مساجد ضمن هذا النطاق.</Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", backgroundColor: "#F6F2E8" },
  header: { paddingHorizontal: 16, marginBottom: 10 },
  headerTitle: { fontFamily: "CairoBold", fontSize: 20, color: "#2F6E52", textAlign: "center" },
  controls: { paddingHorizontal: 16, marginBottom: 10 },
  switchRow: { flexDirection: "row-reverse", gap: 8 },
  toggleBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 14, backgroundColor: "#FFF",
    borderWidth: 1, borderColor: "#E3DED3", alignItems: "center",
  },
  toggleBtnActive: { backgroundColor: "#E6F0EA", borderColor: "#2F6E52" },
  toggleText: { fontFamily: "Cairo", fontSize: 12, color: "#5C5C5C" },
  toggleTextActive: { color: "#2F6E52", fontFamily: "CairoBold" },
  radiusRow: { marginTop: 10, flexDirection: "row-reverse", gap: 8 },
  radiusBtn: {
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, backgroundColor: "#FFF",
    borderWidth: 1, borderColor: "#E3DED3",
  },
  radiusBtnActive: { backgroundColor: "#2F6E52", borderColor: "#2F6E52" },
  radiusText: { fontFamily: "Cairo", fontSize: 12, color: "#5C5C5C" },
  radiusTextActive: { color: "#FFF", fontFamily: "CairoBold" },
  mapWrap: {
    height: 240, borderRadius: 18, overflow: "hidden", backgroundColor: "#FFF",
    borderWidth: 1, borderColor: "#E3DED3", marginBottom: 10,
  },
  mapPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  placeholderText: { fontFamily: "Cairo", fontSize: 12, color: "#8A8A8A" },
  listWrap: { flex: 1, paddingHorizontal: 16 },
  card: {
    backgroundColor: "#FFF", borderRadius: 16, padding: 14, borderWidth: 1,
    borderColor: "#E3DED3", marginBottom: 10,
  },
  cardHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontFamily: "CairoBold", fontSize: 14, color: "#1F1F1F" },
  cardDistance: { fontFamily: "CairoBold", fontSize: 12, color: "#2F6E52" },
  loadingRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8, marginTop: 12 },
  loadingText: { fontFamily: "Cairo", fontSize: 12, color: "#5C5C5C" },
  errorText: { fontFamily: "Cairo", fontSize: 12, color: "#B44B4B", textAlign: "center", marginTop: 12 },
  emptyText: { fontFamily: "Cairo", fontSize: 12, color: "#8A8A8A", textAlign: "center", marginTop: 12 },
});

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

/* ═══════════════════════════════════════════════════════════════════════════
 *  TYPES & CONSTANTS
 * ═══════════════════════════════════════════════════════════════════════════*/

type Mosque = {
  id: number;
  name: string;
  nameAr: string;
  lat: number;
  lon: number;
  distanceKm: number;
  bearing: number;
};

const C = {
  primary: "#3D6B4F",
  accent: "#C19B53",
  bg: "#F3F5F4",
  card: "#FFFFFF",
  text: "#1A1A1A",
  textSec: "#6B6B6B",
  muted: "#9CA3A9",
  green: "#2E7D32",
  greenLight: "rgba(46,125,50,0.08)",
};

const SEARCH_RADIUS_M = 5000;
const MAX_RESULTS = 30;

/* ═══════════════════════════════════════════════════════════════════════════
 *  GEO HELPERS
 * ═══════════════════════════════════════════════════════════════════════════*/

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number) {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function toCardinal(deg: number): string {
  const dirs = ["شمال", "شمال شرق", "شرق", "جنوب شرق", "جنوب", "جنوب غرب", "غرب", "شمال غرب", "شمال"];
  return dirs[Math.round((deg % 360) / 45)] ?? "شمال";
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} متر`;
  return `${km.toFixed(1)} كم`;
}

async function openInMaps(lat: number, lon: number, label: string) {
  const encoded = encodeURIComponent(label);

  if (Platform.OS === "ios") {
    // Try Google Maps app first
    const gmaps = `comgooglemaps://?daddr=${lat},${lon}&directionsmode=walking`;
    const canGoogle = await Linking.canOpenURL(gmaps).catch(() => false);
    if (canGoogle) {
      Linking.openURL(gmaps);
      return;
    }
    // Fall back to Apple Maps
    Linking.openURL(`maps:0,0?q=${encoded}&ll=${lat},${lon}`);
  } else {
    // Android: try Google Maps, fall back to any maps app
    const gmaps = `google.navigation:q=${lat},${lon}&mode=w`;
    Linking.openURL(gmaps).catch(() => {
      Linking.openURL(`geo:${lat},${lon}?q=${lat},${lon}(${encoded})`);
    });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  OVERPASS API — fetch mosques from OpenStreetMap (free, no API key)
 * ═══════════════════════════════════════════════════════════════════════════*/

async function fetchNearbyMosques(lat: number, lon: number, radiusM: number): Promise<Mosque[]> {
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lon});
      way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lon});
      node["building"="mosque"](around:${radiusM},${lat},${lon});
      way["building"="mosque"](around:${radiusM},${lat},${lon});
    );
    out center body;
  `;

  const resp = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!resp.ok) throw new Error(`Overpass: ${resp.status}`);
  const data = await resp.json();

  const seen = new Set<string>();
  const mosques: Mosque[] = [];

  for (const el of data.elements ?? []) {
    const elLat = el.lat ?? el.center?.lat;
    const elLon = el.lon ?? el.center?.lon;
    if (elLat == null || elLon == null) continue;

    const key = `${elLat.toFixed(4)}:${elLon.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const tags = el.tags ?? {};

    // Use actual mosque name only, never fabricate from address
    const displayName =
      tags["name:ar"] || tags.name || tags["name:en"] || "مسجد";

    mosques.push({
      id: el.id,
      name: displayName,
      nameAr: displayName,
      lat: elLat,
      lon: elLon,
      distanceKm: haversineKm(lat, lon, elLat, elLon),
      bearing: bearingDeg(lat, lon, elLat, elLon),
    });
  }

  mosques.sort((a, b) => a.distanceKm - b.distanceKm);
  return mosques.slice(0, MAX_RESULTS);
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  MOSQUE CARD
 * ═══════════════════════════════════════════════════════════════════════════*/

function MosqueCard({
  mosque,
  index,
  isSelected,
  onPress,
}: {
  mosque: Mosque;
  index: number;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onPress}
    >
      <View style={styles.cardRow}>
        {/* Number badge */}
        <View style={[styles.numBadge, isSelected && styles.numBadgeSelected]}>
          <Text style={[styles.numText, isSelected && styles.numTextSelected]}>
            {index + 1}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={2}>
            {mosque.nameAr || mosque.name}
          </Text>
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="walk-outline" size={13} color={C.textSec} />
              <Text style={styles.metaText}>{formatDistance(mosque.distanceKm)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="compass-outline" size={13} color={C.textSec} />
              <Text style={styles.metaText}>{toCardinal(mosque.bearing)}</Text>
            </View>
          </View>
        </View>

        {/* Navigate */}
        <Pressable
          style={styles.navBtn}
          onPress={() => openInMaps(mosque.lat, mosque.lon, mosque.name)}
          hitSlop={8}
        >
          <Ionicons name="navigate" size={18} color={C.primary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  MAIN SCREEN
 * ═══════════════════════════════════════════════════════════════════════════*/

export default function MasjidsComingSoonScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 430);

  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLat, setUserLat] = useState<number>(25.2048);
  const [userLon, setUserLon] = useState<number>(55.2708);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const mapRef = useRef<MapView>(null);
  const listRef = useRef<FlatList>(null);
  const loadedRef = useRef(false);

  const goBack = useCallback(() => {
    if (navigation.canGoBack?.()) navigation.goBack();
    else navigation.navigate("PrayerTimes");
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        goBack();
        return true;
      });
      return () => sub.remove();
    }, [goBack])
  );

  /* ── Load mosques ──────────────────────────────────────────────────── */
  const loadMosques = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("يرجى السماح بالوصول إلى الموقع للبحث عن المساجد القريبة");
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      setUserLat(latitude);
      setUserLon(longitude);

      const results = await fetchNearbyMosques(latitude, longitude, SEARCH_RADIUS_M);
      setMosques(results);

      if (results.length === 0) {
        setError("لم يتم العثور على مساجد قريبة في نطاق 5 كم");
      } else {
        // Fit map to show all markers
        setTimeout(() => {
          if (mapRef.current && results.length > 0) {
            const coords = [
              { latitude, longitude },
              ...results.map((m) => ({ latitude: m.lat, longitude: m.lon })),
            ];
            mapRef.current.fitToCoordinates(coords, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            });
          }
        }, 500);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("Overpass") || msg.includes("network")) {
        setError("تعذر الاتصال بخدمة البحث. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.");
      } else {
        setError(msg || "حدث خطأ أثناء البحث");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    void loadMosques();
  }, [loadMosques]);

  /* ── Select mosque (map ↔ list sync) ──────────────────────────────── */
  const selectMosque = useCallback(
    (mosque: Mosque, scrollToIndex?: number) => {
      setSelectedId(mosque.id);
      mapRef.current?.animateToRegion(
        {
          latitude: mosque.lat,
          longitude: mosque.lon,
          latitudeDelta: 0.006,
          longitudeDelta: 0.006,
        },
        400
      );
      if (scrollToIndex != null) {
        listRef.current?.scrollToIndex({
          index: scrollToIndex,
          animated: true,
          viewPosition: 0.3,
        });
      }
    },
    []
  );

  /* ── Render ────────────────────────────────────────────────────────── */
  const renderItem = useCallback(
    ({ item, index }: { item: Mosque; index: number }) => (
      <MosqueCard
        mosque={item}
        index={index}
        isSelected={item.id === selectedId}
        onPress={() => selectMosque(item)}
      />
    ),
    [selectedId, selectMosque]
  );

  const keyExtractor = useCallback((item: Mosque) => String(item.id), []);

  const MAP_HEIGHT = 280;

  return (
    <View style={styles.root}>
      {/* ─── Header ─── */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={goBack} hitSlop={8} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={20} color={C.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>المساجد القريبة</Text>
          <Pressable
            onPress={() => loadMosques(true)}
            hitSlop={8}
            style={styles.headerBtn}
          >
            <Ionicons name="refresh" size={18} color={C.primary} />
          </Pressable>
        </View>
      </View>

      {/* ─── Map ─── */}
      <View style={[styles.mapWrap, { height: MAP_HEIGHT }]}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          initialRegion={{
            latitude: userLat,
            longitude: userLon,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {mosques.map((m, i) => (
            <Marker
              key={m.id}
              coordinate={{ latitude: m.lat, longitude: m.lon }}
              title={m.nameAr || m.name}
              description={formatDistance(m.distanceKm)}
              pinColor={m.id === selectedId ? C.green : C.primary}
              onPress={() => {
                setSelectedId(m.id);
                listRef.current?.scrollToIndex({
                  index: i,
                  animated: true,
                  viewPosition: 0.3,
                });
              }}
            />
          ))}
        </MapView>

        {/* My location button */}
        <Pressable
          style={styles.myLocBtn}
          onPress={() => {
            mapRef.current?.animateToRegion(
              {
                latitude: userLat,
                longitude: userLon,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              },
              400
            );
          }}
        >
          <Ionicons name="locate" size={18} color={C.primary} />
        </Pressable>

        {mosques.length > 0 && (
          <Pressable
            style={styles.fitAllBtn}
            onPress={() => {
              const coords = [
                { latitude: userLat, longitude: userLon },
                ...mosques.map((m) => ({ latitude: m.lat, longitude: m.lon })),
              ];
              mapRef.current?.fitToCoordinates(coords, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
              });
            }}
          >
            <Ionicons name="expand-outline" size={18} color={C.primary} />
          </Pressable>
        )}
      </View>

      {/* ─── List ─── */}
      <View style={[styles.listContainer, { width: contentWidth, alignSelf: "center" }]}>
        {!loading && mosques.length > 0 && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="mosque" size={14} color={C.primary} />
              <Text style={styles.statLabel}>{mosques.length} مسجد</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="location-outline" size={14} color={C.primary} />
              <Text style={styles.statLabel}>نطاق {SEARCH_RADIUS_M / 1000} كم</Text>
            </View>
          </View>
        )}

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loadingText}>جارٍ البحث عن المساجد القريبة...</Text>
          </View>
        ) : error && mosques.length === 0 ? (
          <View style={styles.center}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="mosque" size={44} color={C.muted} />
            </View>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => loadMosques()}>
              <Text style={styles.retryText}>إعادة المحاولة</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={mosques}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={() => loadMosques(true)}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            ListFooterComponent={<View style={{ height: insets.bottom + 20 }} />}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                listRef.current?.scrollToIndex({ index: info.index, animated: true });
              }, 300);
            }}
          />
        )}
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  STYLES
 * ═══════════════════════════════════════════════════════════════════════════*/

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    backgroundColor: C.card,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontFamily: "CairoBold", fontSize: 18, color: C.primary },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: C.greenLight,
  },

  mapWrap: { width: "100%", position: "relative" },
  myLocBtn: {
    position: "absolute", bottom: 14, right: 14,
    width: 40, height: 40, borderRadius: 20, backgroundColor: C.card,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  fitAllBtn: {
    position: "absolute", bottom: 14, right: 62,
    width: 40, height: 40, borderRadius: 20, backgroundColor: C.card,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },

  statsBar: {
    flexDirection: "row", justifyContent: "center", gap: 20,
    paddingVertical: 10, paddingHorizontal: 16,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  statLabel: { fontFamily: "CairoBold", fontSize: 12, color: C.primary },

  listContainer: { flex: 1 },
  list: { paddingHorizontal: 16 },

  center: {
    flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32,
  },
  loadingText: {
    fontFamily: "Cairo", fontSize: 14, color: C.textSec,
    marginTop: 14, textAlign: "center",
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  errorText: {
    fontFamily: "Cairo", fontSize: 14, color: C.textSec,
    textAlign: "center", lineHeight: 22,
  },
  retryBtn: {
    marginTop: 18, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 20, backgroundColor: C.greenLight,
  },
  retryText: { fontFamily: "CairoBold", fontSize: 14, color: C.green },

  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
    borderWidth: 1.5, borderColor: "transparent",
  },
  cardSelected: {
    borderColor: C.primary, backgroundColor: "rgba(61,107,79,0.04)",
  },
  cardRow: { flexDirection: "row", alignItems: "center" },
  numBadge: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: C.greenLight,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  numBadgeSelected: { backgroundColor: C.primary },
  numText: { fontFamily: "CairoBold", fontSize: 13, color: C.primary },
  numTextSelected: { color: "#FFF" },
  cardInfo: { flex: 1, marginRight: 8 },
  cardName: {
    fontFamily: "CairoBold", fontSize: 14, color: C.text,
    lineHeight: 20, textAlign: "right", writingDirection: "rtl",
  },
  cardMeta: { flexDirection: "row", gap: 14, marginTop: 3 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontFamily: "Cairo", fontSize: 12, color: C.textSec },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.greenLight,
    alignItems: "center", justifyContent: "center",
  },
});
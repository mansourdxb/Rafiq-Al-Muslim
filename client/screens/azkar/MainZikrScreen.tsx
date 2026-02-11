import React, { useMemo } from "react";

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";

import { typography } from "@/theme/typography";

const CATEGORIES = [
  { title: "أذكار المساء", icon: "moon", bg: "#E4E9FF", color: "#5C6CFA" },
  { title: "أذكار الصباح", icon: "sun", bg: "#FFE9CC", color: "#F4A340" },
  { title: "أذكار الصلاة", icon: "home", bg: "#D9F5E6", color: "#26A46D" },
  { title: "أذكار النوم", icon: "cloud", bg: "#DCEBFF", color: "#4B8CFF" },
];

export default function MainZikrScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0
  );

  const progress = 0.5;
  const ring = useMemo(() => {
    const size = 52;
    const stroke = 6;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const dash = c * progress;
    return { size, stroke, r, c, dash };
  }, [progress]);

  const navigateAthkar = (screen: string, params?: Record<string, any>) => {
    const nestedParams = { screen, params };
    let parent: any = navigation;

    while (parent) {
      const routeNames = parent.getState?.().routeNames ?? [];
      if (routeNames.includes("Main")) {
        parent.navigate("Main", { screen: "AthkarTab", params: nestedParams });
        return;
      }
      parent = parent.getParent?.();
    }

    const routes = navigation.getState?.().routeNames ?? [];
    if (routes.includes("AthkarTab")) {
      navigation.navigate("AthkarTab", nestedParams);
      return;
    }

    navigation.navigate(screen, params);
  };

  const openPresets = () => {
    navigateAthkar("Presets");
  };
  const openHisnIndex = () => {
    navigateAthkar("HisnAlMuslim");
  };
  const openStats = () => {
    navigateAthkar("Stats");
  };
  const openHisnCategory = (title: string) => {
    navigateAthkar("HisnCategory", { categoryTitle: title });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
          <View style={styles.headerRow}>
            <Pressable style={styles.bellBtn} hitSlop={10}>
              <Feather name="bell" size={20} color="#E9E3D4" />
            </Pressable>
            <Text style={styles.headerTitle}>الأذكار</Text>
            <View style={styles.headerRightSpacer} />
          </View>

          <View style={styles.searchWrap}>
            <Feather name="search" size={18} color="#B8C3B6" style={styles.searchIcon} />
            <TextInput
              placeholder="بحث في الأذكار..."
              placeholderTextColor="#B8C3B6"
              style={styles.searchInput}
              textAlign="right"
              writingDirection="rtl"
            />
          </View>
        </View>

        <Pressable style={styles.progressCard} onPress={openHisnIndex}>
          <View style={styles.progressRow}>
            <View style={styles.progressTextWrap}>
              <Text style={styles.progressTitle}>حصن المسلم</Text>
              <Text style={styles.progressSubtitle}>تم إنجاز 12 من 33</Text>
            </View>
            <View style={styles.progressRing}>
              <Svg width={ring.size} height={ring.size}>
                <Circle
                  cx={ring.size / 2}
                  cy={ring.size / 2}
                  r={ring.r}
                  stroke="#EFE7D4"
                  strokeWidth={ring.stroke}
                  fill="none"
                />
                <Circle
                  cx={ring.size / 2}
                  cy={ring.size / 2}
                  r={ring.r}
                  stroke="#D4AF37"
                  strokeWidth={ring.stroke}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${ring.dash} ${ring.c - ring.dash}`}
                  rotation={-90}
                  originX={ring.size / 2}
                  originY={ring.size / 2}
                />
              </Svg>
              <Text style={styles.progressPct}>50%</Text>
            </View>
          </View>

          <Pressable style={styles.progressButton} onPress={openHisnIndex}>
            <Text style={styles.progressButtonText}>متابعة الأذكار</Text>
          </Pressable>
        </Pressable>

        <View style={styles.grid}>
          {CATEGORIES.map((item) => (
            <Pressable
              key={item.title}
              style={styles.gridCard}
              onPress={() => {
                if (item.title === "أذكار الصباح" || item.title === "أذكار المساء") {
                  openHisnCategory("أذكار الصباح والمساء");
                  return;
                }
                if (item.title === "أذكار النوم") {
                  openHisnCategory("أذكار النوم");
                  return;
                }
                if (item.title === "أذكار الصلاة") {
                  openHisnCategory("الأذكار بعد السلام من الصلاة");
                }
              }}
            >
              <View style={[styles.gridIcon, { backgroundColor: item.bg }]}>
                <Feather name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.gridTitle}>{item.title}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.tasbeehCard} onPress={openPresets}>
          <View style={styles.tasbeehTopRow}>
            <Text style={styles.tasbeehTitle}>المسبحة الإلكترونية</Text>
            <Text style={styles.tasbeehNumber}>128</Text>
          </View>
          <Text style={styles.tasbeehSubtitle}>سبحان الله وبحمده</Text>
          <Pressable style={styles.tasbeehButton} onPress={openPresets}>
            <Text style={styles.tasbeehButtonText}>ابدأ الآن</Text>
          </Pressable>
          <View style={styles.tasbeehMark} />
        </Pressable>

        <View style={styles.quickActionsCard}>
          <View style={styles.quickActionsRow}>
            <Pressable
              style={styles.quickActionButton}
              onPress={() => console.log("quick-action:heart")}
            >
              <Feather name="heart" size={22} color="#D4AF37" />
            </Pressable>
            <Pressable
              style={styles.quickActionButton}
              onPress={() => console.log("quick-action:pin")}
            >
              <Feather name="map-pin" size={22} color="#D4AF37" />
            </Pressable>
            <Pressable
              style={styles.quickActionButton}
              onPress={() => {
                console.log("quick-action:calendar");
                navigateAthkar("Calendar");
              }}
            >
              <Feather name="calendar" size={22} color="#D4AF37" />
            </Pressable>
            <Pressable
              style={styles.quickActionButton}
              onPress={openStats}
            >
              <Feather name="bar-chart-2" size={22} color="#D4AF37" />
            </Pressable>
          </View>
          {/* TODO: Wire quick actions to routes when ready. */}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F5F4F1",
  },
  scroll: {
    paddingHorizontal: 18,
  },
  header: {
    backgroundColor: "#1B4332",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 22,
    paddingHorizontal: 18,
    marginHorizontal: -18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...typography.screenTitle,
    color: "#FFFFFF",
    fontSize: 24,
    textAlign: "center",
  },
  headerRightSpacer: {
    width: 36,
    height: 36,
  },
  searchWrap: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  searchIcon: {
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    ...typography.inputText,
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "right",
    writingDirection: "rtl",
  },
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressTextWrap: {
    flex: 1,
    alignItems: "flex-end",
  },
  progressTitle: {
    ...typography.itemTitle,
    fontSize: 18,
    color: "#1C2C24",
  },
  progressSubtitle: {
    ...typography.itemSubtitle,
    fontSize: 13,
    color: "#7C8A82",
    marginTop: 4,
  },
  progressRing: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  progressPct: {
    position: "absolute",
    ...typography.buttonText,
    fontSize: 12,
    color: "#D4AF37",
  },
  progressButton: {
    marginTop: 16,
    backgroundColor: "#1B4332",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  progressButtonText: {
    ...typography.buttonText,
    color: "#FFFFFF",
    fontSize: 14,
  },
  grid: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  gridIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  gridTitle: {
    ...typography.itemTitle,
    fontSize: 15,
    color: "#1F2D25",
  },
  tasbeehCard: {
    backgroundColor: "#1B4332",
    borderRadius: 22,
    padding: 18,
    marginTop: 8,
    overflow: "hidden",
  },
  tasbeehTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tasbeehTitle: {
    ...typography.sectionTitle,
    fontSize: 20,
    color: "#FFFFFF",
  },
  tasbeehNumber: {
    ...typography.numberText,
    fontSize: 28,
    color: "#FFFFFF",
  },
  tasbeehSubtitle: {
    ...typography.itemSubtitle,
    fontSize: 14,
    color: "#D6DED7",
    marginTop: 6,
  },
  tasbeehButton: {
    alignSelf: "flex-start",
    marginTop: 14,
    backgroundColor: "#D4AF37",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  tasbeehButtonText: {
    ...typography.buttonText,
    fontSize: 14,
    color: "#1B4332",
  },
  tasbeehMark: {
    position: "absolute",
    left: -10,
    bottom: -10,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: "rgba(255,255,255,0.08)",
  },
  quickActionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  quickActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickActionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F0E1",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
});

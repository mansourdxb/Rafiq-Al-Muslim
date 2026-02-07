import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { CommonActions, DrawerActions, useTheme } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { drawerSections, type DrawerRow } from "@/navigation/drawerItems";

const ICON_MAP: Record<string, keyof typeof Feather.glyphMap> = {
  BookOpen: "book-open",
  List: "list",
  BookText: "file-text",
  Highlighter: "edit-3",
  CheckCircle: "check-circle",
  ScrollText: "book-open",
  LibraryBig: "book",
  ListOrdered: "list",
  Bookmark: "bookmark",
  Settings: "settings",
  Type: "type",
  Moon: "moon",
  Info: "info",
  Sparkles: "star",
  SlidersHorizontal: "sliders",
  Plus: "plus",
  BarChart2: "bar-chart-2",
  Navigation: "navigation",
};

function IconBox({
  name,
  color,
  backgroundColor,
  small = false,
}: {
  name: string;
  color: string;
  backgroundColor: string;
  small?: boolean;
}) {
  return (
    <View
      style={[
        styles.iconBox,
        small ? styles.iconBoxSmall : null,
        { backgroundColor, borderColor: `${color}22` },
      ]}
    >
      <Feather
        name={ICON_MAP[name] ?? "circle"}
        size={small ? 14 : 16}
        color={color}
      />
    </View>
  );
}

export default function AppDrawerContent({ navigation }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme?.();
  const isDark = theme?.dark ?? false;
  const background = isDark ? "#171510" : "#F8F1E6";
  const cardBg = isDark ? "#221F18" : "#FDF8EF";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(80,56,28,0.08)";
  const rowDivider = isDark ? "rgba(255,255,255,0.07)" : "rgba(80,56,28,0.09)";
  const titleColor = isDark ? "#F5EFE4" : "#6E5A46";
  const sectionColor = isDark ? "rgba(245,239,228,0.72)" : "rgba(110,90,70,0.75)";
  const iconColor = isDark ? "#F5EFE4" : "#6E5A46";
  const iconBg = isDark ? "#2E281F" : "#F4E9D9";
  const pressedBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(110,90,70,0.06)";
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);

  const contentStyle = useMemo(
    () => [
      styles.container,
      {
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 16,
        backgroundColor: background,
      },
    ],
    [insets.bottom, insets.top, background]
  );

  const navigateToRoute = (row: DrawerRow) => {
    if (!row.route) {
      console.warn("[Drawer] missing route for row:", row.key);
      return;
    }

    if (!navigation.getState().routeNames.includes("RootStack")) {
      console.warn("[Drawer] RootStack route is not available.");
      return;
    }

    const params =
      row.key === "quran-index"
        ? { ...row.params, navToken: Date.now(), openIndex: true }
        : row.params;

    navigation.dispatch(DrawerActions.closeDrawer());
    try {
      if (row.route === "Salatuk") {
        navigation.dispatch(
          CommonActions.navigate({
            name: "RootStack",
            params: row.params ? { screen: "Salatuk", params: row.params } : { screen: "Salatuk" },
          })
        );
        return;
      }
      navigation.navigate("RootStack", { screen: row.route, params } as any);
    } catch (error) {
      console.warn("[Drawer] failed to navigate:", row.route, error);
    }
  };

  const renderParentRow = (row: DrawerRow) => {
    const hasChildren = (row.children ?? []).length > 0;
    const isExpanded = expandedSectionId === row.key;
    const toggleExpanded = () => {
      if (!hasChildren) return;
      setExpandedSectionId((prev) => (prev === row.key ? null : row.key));
    };

    return (
      <Pressable
        key={`${row.key}-parent`}
        onPress={toggleExpanded}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={row.title}
        style={({ pressed }) => [
          styles.row,
          pressed ? { backgroundColor: pressedBg } : null,
        ]}
      >
        <Text style={[styles.rowTitle, { color: titleColor }]}>{row.title}</Text>
        {hasChildren ? (
          <Feather
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={sectionColor}
            style={styles.chevron}
          />
        ) : null}
        <IconBox name={row.icon} color={iconColor} backgroundColor={iconBg} />
      </Pressable>
    );
  };

  const renderChildRow = (row: DrawerRow) => (
    <Pressable
      key={row.key}
      onPress={() => navigateToRoute(row)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={row.title}
      style={({ pressed }) => [
        styles.row,
        styles.childRow,
        pressed ? { backgroundColor: pressedBg } : null,
      ]}
    >
      <Text style={[styles.rowTitle, styles.childTitle, { color: titleColor }]}>
        {row.title}
      </Text>
    </Pressable>
  );

  return (
    <DrawerContentScrollView contentContainerStyle={contentStyle}>
      <Text style={[styles.screenTitle, { color: titleColor }]}>{"\u0627\u0644\u0642\u0627\u0626\u0645\u0629"}</Text>

      {drawerSections.map((section) => (
        <View
          key={section.key}
          style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
        >
          <Text style={[styles.sectionTitle, { color: sectionColor }]}>{section.title}</Text>
          {section.rows.map((row) => (
            <View key={row.key}>
              {renderParentRow(row)}
              {(row.children ?? []).length && expandedSectionId === row.key ? (
                <View style={styles.childrenWrap}>
                  {(row.children ?? []).map((child, childIdx) => (
                    <View key={child.key}>
                      {renderChildRow(child)}
                      {childIdx < (row.children ?? []).length - 1 ? (
                        <View
                          style={[
                            styles.divider,
                            styles.childDivider,
                            { backgroundColor: rowDivider },
                          ]}
                        />
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
  },
  screenTitle: {
    fontFamily: "CairoBold",
    fontSize: 34,
    textAlign: "right",
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: "CairoBold",
    fontSize: 15,
    textAlign: "right",
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  row: {
    minHeight: 50,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  childRow: {
    minHeight: 44,
    paddingRight: 18,
    paddingLeft: 6,
  },
  rowTitle: {
    flex: 1,
    textAlign: "right",
    writingDirection: "rtl",
    fontFamily: "CairoBold",
    fontSize: 17,
  },
  childTitle: {
    fontFamily: "Cairo",
    fontSize: 15,
  },
  chevron: {
    marginLeft: 4,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    marginVertical: 3,
    marginHorizontal: 2,
  },
  childrenWrap: {
    marginTop: 2,
    marginBottom: 4,
  },
  childDivider: {
    marginRight: 20,
  },
});

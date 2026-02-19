import React from "react";
import { View, Text, StyleSheet, Pressable, Switch, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

/* ─── Toggle Row ─── */
export function ToggleRow({ icon, label, subtitle, value, onValueChange }: {
  icon: string; label: string; subtitle?: string; value: boolean; onValueChange: (v: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={s.row}>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.switchTrackOff, true: "#A8D5BA" }} thumbColor={value ? colors.green : "#F4F3F1"} />
      <View style={s.rowContent}>
        <Text style={[s.rowLabel, { color: colors.text }]}>{label}</Text>
        {subtitle && <Text style={[s.rowSub, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      <View style={[s.rowIcon, { backgroundColor: colors.iconBg }]}>
        <Ionicons name={icon as any} size={20} color={colors.green} />
      </View>
    </View>
  );
}

/* ─── Navigation Row ─── */
export function NavRow({ icon, label, subtitle, value, onPress }: {
  icon: string; label: string; subtitle?: string; value?: string; onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable style={s.row} onPress={onPress}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        {value && <Text style={[s.rowValue, { color: colors.textSecondary }]}>{value}</Text>}
      </View>
      <View style={s.rowContent}>
        <Text style={[s.rowLabel, { color: colors.text }]}>{label}</Text>
        {subtitle && <Text style={[s.rowSub, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      <View style={[s.rowIcon, { backgroundColor: colors.iconBg }]}>
        <Ionicons name={icon as any} size={20} color={colors.green} />
      </View>
    </Pressable>
  );
}

/* ─── Action Row ─── */
export function ActionRow({ icon, label, subtitle, color, onPress }: {
  icon: string; label: string; subtitle?: string; color?: string; onPress: () => void;
}) {
  const { colors } = useTheme();
  const c = color ?? colors.green;
  return (
    <Pressable style={s.row} onPress={onPress}>
      <View style={{ width: 18 }} />
      <View style={s.rowContent}>
        <Text style={[s.rowLabel, { color: c }]}>{label}</Text>
        {subtitle && <Text style={[s.rowSub, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      <View style={[s.rowIcon, { backgroundColor: `${c}15` }]}>
        <Ionicons name={icon as any} size={20} color={c} />
      </View>
    </Pressable>
  );
}

/* ─── Select Row ─── */
export function SelectRow({ label, selected, onPress }: {
  label: string; selected: boolean; onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable style={s.selectRow} onPress={onPress}>
      <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={22} color={selected ? colors.green : colors.textSecondary} />
      <Text style={[s.rowLabel, { flex: 1, color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

/* ─── Section ─── */
export function SettingsSection({ title, children }: { title?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const items = React.Children.toArray(children);
  return (
    <View style={s.section}>
      {title && <Text style={[s.sectionTitle, { color: colors.green }]}>{title}</Text>}
      <View style={[s.card, { backgroundColor: colors.cardBackground }]}>
        {items.map((child, idx) => (
          <React.Fragment key={idx}>
            {child}
            {idx < items.length - 1 && <View style={[s.divider, { backgroundColor: colors.divider }]} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

/* ─── Screen wrapper ─── */
export function SettingsScreen({ title, children, onBack, insetTop, bottomPadding }: {
  title: string; children: React.ReactNode; onBack: () => void; insetTop: number; bottomPadding: number;
}) {
  const { colors } = useTheme();
  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insetTop + 4, backgroundColor: colors.headerBackground }]}>
        <View style={s.headerRow}>
          <Pressable onPress={onBack} hitSlop={12} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.headerText} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.headerText }]}>{title}</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: bottomPadding + 90 }} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: 16, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "CairoBold", fontSize: 20, textAlign: "center", flex: 1 },
  section: { marginBottom: 8, marginTop: 8 },
  sectionTitle: { fontFamily: "CairoBold", fontSize: 14, textAlign: "right", paddingHorizontal: 20, marginBottom: 6 },
  card: { marginHorizontal: 14, borderRadius: 16, overflow: "hidden" },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 14, gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowContent: { flex: 1, alignItems: "flex-end", gap: 1 },
  rowLabel: { fontFamily: "CairoBold", fontSize: 15, textAlign: "right" },
  rowSub: { fontFamily: "Cairo", fontSize: 12, textAlign: "right" },
  rowValue: { fontFamily: "Cairo", fontSize: 13 },
  selectRow: { flexDirection: "row-reverse", alignItems: "center", paddingVertical: 13, paddingHorizontal: 14, gap: 12 },
});

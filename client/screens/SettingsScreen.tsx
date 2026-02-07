import React, { useEffect, useMemo, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  Switch,
  Pressable,
  Platform,
  useWindowDimensions,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import PrivacyPolicyScreen from "@/screens/Privacypolicyscreen";
import { typography } from "@/theme/typography";
import DrawerMenuButton from "@/components/navigation/DrawerMenuButton";
import { initLocalNotifications } from "@/src/services/notificationsInit";

type RowProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
};

type RowColors = {
  titleColor: string;
  subtitleColor: string;
  dividerColor: string;
};

function CardRow({
  title,
  subtitle,
  right,
  onPress,
  isLast = false,
  titleColor,
  subtitleColor,
  dividerColor,
}: RowProps & RowColors) {
  const Container: any = onPress ? Pressable : View;

  return (
    <>
      <Container
        onPress={onPress}
        style={({ pressed }: any) => [
          styles.row,
          onPress ? (pressed ? { opacity: 0.92 } : null) : null,
        ]}
      >
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: titleColor }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.rowSub, { color: subtitleColor }]}>{subtitle}</Text>
          ) : null}
        </View>

        <View style={styles.rowRight}>{right}</View>
      </Container>
      {!isLast && <View style={[styles.divider, { backgroundColor: dividerColor }]} />}
    </>
  );
}

export default function SettingsScreen() {
  useEffect(() => {
    void initLocalNotifications();
  }, []);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isDarkMode, toggleDarkMode, colors, setThemeMode } = useTheme();

  // Ensure headerGradient is typed as a tuple for LinearGradient
  const headerGradientColors = colors.headerGradient as [string, string, ...string[]];

  const pageBackground = colors.background;
  const cardBackground = isDarkMode ? "#2B2B2B" : "#FFFFFF";
  const cardTitleColor = isDarkMode ? "#FFFFFF" : "#111418";
  const rowTitleColor = isDarkMode ? "#FFFFFF" : "#111418";
  const rowSubColor = isDarkMode ? "rgba(255,255,255,0.55)" : "rgba(17,20,24,0.55)";
  const dividerColor = isDarkMode ? "rgba(255,255,255,0.10)" : "rgba(17,20,24,0.08)";
  const versionTextColor = isDarkMode ? "rgba(255,255,255,0.55)" : "rgba(17,20,24,0.55)";
  const resetButtonBg = isDarkMode ? "#666666" : "#E7EDF4";
  const resetButtonText = isDarkMode ? "#FFFFFF" : "#111418";
  const iconColor = isDarkMode ? "rgba(255,255,255,0.65)" : "rgba(17,20,24,0.55)";

  const rowColors: RowColors = {
    titleColor: rowTitleColor,
    subtitleColor: rowSubColor,
    dividerColor,
  };

  // Keeps it "phone-like" even on web
  const maxW = 430;
  const contentWidth = Math.min(width, maxW);

  const [vibration, setVibration] = useState(true);
  const [sound, setSound] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  const headerPadTop = useMemo(() => insets.top + 12, [insets.top]);

  return (
    <View style={[styles.root, { backgroundColor: pageBackground }]}>
      {/* Blue header */}
      <LinearGradient
        colors={headerGradientColors}
        style={[styles.header, { paddingTop: headerPadTop }]}
      >
        <View style={[styles.headerInner, { width: contentWidth }]}>
          <View style={styles.menuButton}>
            <DrawerMenuButton />
          </View>
          <Text style={styles.headerTitle}>الإعدادات</Text>
        </View>
      </LinearGradient>

      {/* Scrollable Body */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { width: contentWidth, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Counter Feedback (??????? ??????) */}
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <Text style={[styles.cardTitle, { color: cardTitleColor }]}>تعليقات العداد</Text>

          <CardRow
            title="الاهتزاز"
            right={
              <>
                <Feather
                  name="activity"
                  size={18}
                  color={iconColor}
                  style={{ marginRight: 8 }}
                />
                <Switch
                  value={vibration}
                  onValueChange={setVibration}
                  trackColor={{ false: "#5b5b5b", true: "#7EC3E6" }}
                  thumbColor={"#ffffff"}
                />
              </>
            }
            {...rowColors}
          />

          <CardRow
            title="الصوت"
            subtitle="تشغيل الصوت أثناء العد"
            right={
              <>
                <Feather
                  name="volume-2"
                  size={18}
                  color={iconColor}
                  style={{ marginRight: 8 }}
                />
                <Switch
                  value={sound}
                  onValueChange={setSound}
                  trackColor={{ false: "#5b5b5b", true: "#7EC3E6" }}
                  thumbColor={"#ffffff"}
                />
              </>
            }
            {...rowColors}
          />

          <CardRow
            title="خيارات الصوت"
            subtitle="الحالي: كريستال"
            onPress={() => {
              // Open sound picker modal
              console.log("Open sound options");
            }}
            right={
              <>
                <Feather name="music" size={18} color={iconColor} />
                <Feather
                  name="chevron-left"
                  size={20}
                  color={iconColor}
                  style={{ marginLeft: 4 }}
                />
              </>
            }
            isLast
            {...rowColors}
          />
        </View>

        {/* Card 2: Notifications (?????????) */}
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <Text style={[styles.cardTitle, { color: cardTitleColor }]}>الإشعارات</Text>

          <CardRow
            title="تفعيل الإشعارات"
            subtitle="اضغط للتفعيل"
            onPress={() => {
              // Request notification permissions
              setNotifications(!notifications);
              console.log("Toggle notifications");
            }}
            right={
              <>
                <Feather
                  name={notifications ? "bell" : "bell-off"}
                  size={18}
                  color={iconColor}
                />
                <Feather
                  name="chevron-left"
                  size={20}
                  color={iconColor}
                  style={{ marginLeft: 4 }}
                />
              </>
            }
            isLast
            {...rowColors}
          />
        </View>

        {/* Card 4: Appearance (??????) */}
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <Text style={[styles.cardTitle, { color: cardTitleColor }]}>المظهر</Text>

          <CardRow
            title="الوضع الداكن"
            subtitle="تفعيل الوضع الداكن"
            right={
              <>
                <Feather
                  name="moon"
                  size={18}
                  color={iconColor}
                  style={{ marginRight: 8 }}
                />
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleDarkMode}
                  trackColor={{ false: "#5b5b5b", true: "#7EC3E6" }}
                  thumbColor={"#ffffff"}
                />
              </>
            }
            isLast
            {...rowColors}
          />
        </View>

        {/* Card 5: About (???) */}
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <Text style={[styles.cardTitle, { color: cardTitleColor }]}>حول</Text>

          <CardRow
            title="إصدار التطبيق"
            right={<Text style={[styles.versionText, { color: versionTextColor }]}>1.0.0</Text>}
            {...rowColors}
          />

          <CardRow
            title="سياسة الخصوصية"
            onPress={() => setShowPrivacyPolicy(true)}
            right={
              <>
                <Feather name="shield" size={18} color={iconColor} />
                <Feather
                  name="chevron-left"
                  size={20}
                  color={iconColor}
                  style={{ marginLeft: 4 }}
                />
              </>
            }
            isLast
            {...rowColors}
          />
        </View>

        {/* Reset Button */}
        <Pressable
          style={({ pressed }) => [
            styles.resetButton,
            { backgroundColor: resetButtonBg },
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => {
            // Reset to default settings
            if (Platform.OS === "web") {
              const confirmed = window.confirm(
                "هل تريد إعادة جميع الإعدادات إلى الوضع الافتراضي؟"
              );
              if (confirmed) {
                setVibration(true);
                setSound(false);
                setNotifications(false);
                setThemeMode("light");
              }
            } else {
              Alert.alert(
                "إعادة الإعدادات",
                "هل تريد إعادة جميع الإعدادات إلى الوضع الافتراضي؟",
                [
                  { text: "إلغاء", style: "cancel" },
                  {
                    text: "إعادة تعيين",
                    style: "destructive",
                    onPress: () => {
                      setVibration(true);
                      setSound(false);
                      setNotifications(false);
                      setThemeMode("light");
                    },
                  },
                ],
                { cancelable: true }
              );
            }
          }}
        >
          <Text style={[styles.resetButtonText, { color: resetButtonText }]}>إعادة تعيين الإعدادات</Text>
        </Pressable>
      </ScrollView>

      {/* Privacy Policy Modal */}
      <Modal visible={showPrivacyPolicy} animationType="slide" presentationStyle="fullScreen">
        <PrivacyPolicyScreen onClose={() => setShowPrivacyPolicy(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#E9EFF5",
    alignItems: "center",
  },

  header: {
    width: "100%",
    paddingBottom: 18,
    alignItems: "center",
  },
  headerInner: {
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...typography.screenTitle,
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "900",
    textAlign: "center",
  },
  menuButton: {
    position: "absolute",
    right: 4,
    top: 2,
    zIndex: 5,
  },

  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingTop: 14,
    alignSelf: "center",
  },

  card: {
    backgroundColor: "#2B2B2B",
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 14,
    marginBottom: 14,
    // soft shadow
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  cardTitle: {
    ...typography.sectionTitle,
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "right",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: 12,
  },
  rowText: {
    flex: 1,
    paddingLeft: 12,
  },
  rowTitle: {
    ...typography.itemTitle,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "right",
  },
  rowSub: {
    ...typography.itemSubtitle,
    marginTop: 4,
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 52,
    justifyContent: "flex-start",
  },

  versionText: {
    ...typography.numberText,
    color: "rgba(255,255,255,0.55)",
    fontSize: 16,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  resetButton: {
    backgroundColor: "#666666",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginHorizontal: 14,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  resetButtonText: {
    ...typography.buttonText,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});

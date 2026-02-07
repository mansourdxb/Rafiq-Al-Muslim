import React from "react";
import { View, StyleSheet, Image, I18nManager } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

const FEATURES = [
  { icon: "moon", text: "مواقيت الصلاة حسب المدينة مع التنبيهات" },
  { icon: "compass", text: "اتجاه القبلة بدقة مع اختيار المدينة" },
  { icon: "book-open", text: "القرآن الكريم: قراءة ومتابعة آخر صفحة" },
  { icon: "bookmark", text: "الأحاديث: كتب الحديث مع المفضلة والبحث" },
  { icon: "repeat", text: "الذكر: عدّاد تسبيح وأذكار مخصصة وإحصائيات" },
  { icon: "bar-chart-2", text: "إحصائيات يومية وأسبوعية للتقدم" },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const isRTL = I18nManager.isRTL;

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing["2xl"],
        paddingHorizontal: Spacing.xl,
        alignItems: "center",
      }}
    >
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={[
          styles.iconContainer,
          { backgroundColor: theme.surfaceElevated },
          Shadows.large,
        ]}
      >
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).springify()}>
        <ThemedText style={[styles.appName, { color: theme.text }]}>
          رفيق المسلم
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <View style={[styles.versionBadge, { backgroundColor: `${theme.primary}12` }]}>
          <ThemedText style={[styles.version, { color: theme.primary }]}>
            الإصدار 1.0.0
          </ThemedText>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(250).springify()}
        style={[
          styles.card,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.borderLight,
          },
          Shadows.medium,
        ]}
      >
        <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
          تطبيق شامل يساعدك في عبادتك اليومية: مواقيت الصلاة حسب موقعك، اتجاه القبلة،
          القرآن الكريم، الأحاديث، والذكر مع إحصائيات وتنبيهات—كل ذلك بتجربة بسيطة وسريعة.
        </ThemedText>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(300).springify()}
        style={[
          styles.card,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.borderLight,
          },
          Shadows.medium,
        ]}
      >
        <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
          المميزات
        </ThemedText>

        {FEATURES.map((feature, index) => (
          <View
            key={index}
            style={[
              styles.featureRow,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <View style={[styles.featureIcon, { backgroundColor: `${theme.primary}12` }]}>
              <Feather name={feature.icon as any} size={16} color={theme.primary} />
            </View>

            <ThemedText
              style={[
                styles.featureText,
                {
                  color: theme.textSecondary,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
            >
              {feature.text}
            </ThemedText>
          </View>
        ))}
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(350).springify()}
        style={[
          styles.card,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.borderLight,
          },
          Shadows.medium,
        ]}
      >
        <View
          style={[
            styles.privacyHeader,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <View style={[styles.privacyIcon, { backgroundColor: `${theme.success}15` }]}>
            <Feather name="shield" size={18} color={theme.success} />
          </View>

          <ThemedText
            style={[
              styles.sectionTitle,
              {
                color: theme.text,
                marginBottom: 0,
                textAlign: isRTL ? "right" : "left",
                flex: 1,
              },
            ]}
          >
            الخصوصية
          </ThemedText>
        </View>

        <ThemedText
          style={[
            styles.privacyText,
            {
              color: theme.textSecondary,
              textAlign: isRTL ? "right" : "left",
            },
          ]}
        >
          يتم حفظ بياناتك محليًا على جهازك. لا نقوم بجمع أو إرسال أي معلومات شخصية.
        </ThemedText>
      </Animated.View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  icon: { width: "100%", height: "100%" },

  appName: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },

  versionBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing["3xl"],
  },
  version: { fontSize: 13, fontWeight: "600" },

  card: {
    width: "100%",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },

  description: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: Spacing.lg,
  },

  featureRow: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },

  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    marginLeft: Spacing.md,
  },

  featureText: {
    fontSize: 15,
    flex: 1,
  },

  privacyHeader: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },

  privacyIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    marginLeft: Spacing.md,
  },

  privacyText: {
    fontSize: 15,
    lineHeight: 24,
  },
});

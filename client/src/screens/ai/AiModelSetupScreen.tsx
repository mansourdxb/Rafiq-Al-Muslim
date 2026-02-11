import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { typography } from "@/theme/typography";
import { getAiEngine } from "@/src/ai/engine";
import {
  getModelInfo,
  downloadModel,
  deleteModel,
} from "@/src/lib/ai/modelStorage";
import {
  getWebModelList,
  getSelectedWebModelId,
  setSelectedWebModelId,
  getWebReadyFlag,
} from "@/src/ai/engine/webEngine";

export default function AiModelSetupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0
  );

  const [loading, setLoading] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [sizeBytes, setSizeBytes] = useState(0);
  const [progressRatio, setProgressRatio] = useState(0);
  const [progressWritten, setProgressWritten] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [webModels, setWebModels] = useState<string[]>([]);
  const [selectedWebModel, setSelectedWebModel] = useState<string | null>(null);
  const [webReady, setWebReady] = useState(false);
  const engine = useMemo(() => getAiEngine(), []);

  const refreshInfo = useCallback(async () => {
    if (Platform.OS === "web") {
      setInstalled(false);
      setSizeBytes(0);
      return;
    }
    const info = await getModelInfo();
    setInstalled(info.exists);
    setSizeBytes(info.sizeBytes ?? 0);
  }, []);

  useEffect(() => {
    void refreshInfo();
  }, [refreshInfo]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    let mounted = true;
    const loadWebModels = async () => {
      try {
        const list = await getWebModelList();
        if (!mounted) return;
        setWebModels(list);
        const stored = getSelectedWebModelId();
        const fallback = stored ?? list[0] ?? null;
        if (!stored && list[0]) {
          setSelectedWebModelId(list[0]);
        }
        setSelectedWebModel(fallback);
        const ready = getWebReadyFlag();
        if (mounted) setWebReady(ready);
      } catch (err: any) {
        if (mounted) setErrorText(err?.message ?? "تعذر تحميل نماذج الويب");
      }
    };
    void loadWebModels();
    return () => {
      mounted = false;
    };
  }, [engine]);

  const sizeLabel = useMemo(() => {
    if (Platform.OS === "web") return "غير متاح";
    if (!sizeBytes) return "0 MB";
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }, [sizeBytes]);

  const startDownload = async () => {
    if (Platform.OS === "web") {
      if (!engine.isSupported()) {
        setErrorText("WebGPU غير مدعوم على هذا الجهاز");
        return;
      }
      if (!selectedWebModel) {
        setErrorText("اختر نموذج الويب أولاً");
        return;
      }
      setLoading(true);
      setErrorText(null);
      setProgressRatio(0);
      setProgressWritten(0);
      setProgressTotal(0);
      try {
        await engine.ensureModelReady({
          modelId: selectedWebModel,
          onProgress: (ratio) => setProgressRatio(ratio),
        });
        setWebReady(true);
      } catch (err: any) {
        setErrorText(err?.message ?? "تعذر تحميل نموذج الويب");
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    setErrorText(null);
    setProgressRatio(0);
    setProgressWritten(0);
    setProgressTotal(0);
    try {
      await downloadModel((ratio, written, total) => {
        setProgressRatio(ratio);
        setProgressWritten(written);
        setProgressTotal(total);
      });
      await refreshInfo();
    } catch (err: any) {
      setErrorText(err?.message ?? "تعذر تنزيل النموذج");
    } finally {
      setLoading(false);
    }
  };

  const removeModel = async () => {
    if (Platform.OS === "web") return;
    setLoading(true);
    setErrorText(null);
    try {
      await deleteModel();
      await refreshInfo();
    } catch (err: any) {
      setErrorText(err?.message ?? "تعذر حذف النموذج");
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = progressTotal > 0 ? Math.round(progressRatio * 100) : 0;
  const progressLabel = progressTotal
    ? `${(progressWritten / (1024 * 1024)).toFixed(1)} / ${(progressTotal / (1024 * 1024)).toFixed(1)} MB`
    : "";

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>إعداد النموذج</Text>
          <Pressable
            style={styles.headerIcon}
            onPress={() => navigation.goBack()}
            hitSlop={10}
          >
            <Feather name="chevron-right" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>حالة النموذج</Text>
          <Text style={styles.cardValue}>
            {Platform.OS === "web"
              ? webReady
                ? "جاهز"
                : "غير مثبت"
              : installed
              ? "مثبت"
              : "غير مثبت"}
          </Text>
          <Text style={styles.cardMeta}>الحجم: {sizeLabel}</Text>
        </View>

        {Platform.OS === "web" ? (
          <View style={styles.webSection}>
            <Text style={styles.webTitle}>نماذج الويب</Text>
            {webModels.length === 0 ? (
              <Text style={styles.helperText}>جاري تحميل القائمة...</Text>
            ) : (
              <View style={styles.webModelList}>
                {webModels.slice(0, 6).map((modelId) => {
                  const selected = modelId === selectedWebModel;
                  return (
                    <Pressable
                      key={modelId}
                      style={[styles.webModelChip, selected && styles.webModelChipActive]}
                      onPress={() => {
                        setSelectedWebModel(modelId);
                        setSelectedWebModelId(modelId);
                        setWebReady(false);
                      }}
                    >
                      <Text style={[styles.webModelText, selected && styles.webModelTextActive]}>
                        {modelId}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

        {!installed && Platform.OS !== "web" ? (
          <Pressable style={styles.primaryBtn} onPress={startDownload} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>تحميل النموذج</Text>
            )}
          </Pressable>
        ) : null}

        {Platform.OS === "web" ? (
          <Pressable style={styles.primaryBtn} onPress={startDownload} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>
                {webReady ? "تشغيل نموذج الويب" : "تحميل نموذج الويب"}
              </Text>
            )}
          </Pressable>
        ) : null}

        {loading && (progressTotal > 0 || Platform.OS === "web") ? (
          <View style={styles.progressWrap}>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>{Platform.OS === "web" ? "" : progressLabel}</Text>
              <Text style={styles.progressText}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
            </View>
          </View>
        ) : null}

        {installed && Platform.OS !== "web" ? (
          <Pressable style={styles.secondaryBtn} onPress={removeModel} disabled={loading}>
            <Text style={styles.secondaryText}>حذف النموذج</Text>
          </Pressable>
        ) : null}

        <Text style={styles.helperText}>يتم تنزيل النموذج مرة واحدة ثم يعمل بدون إنترنت.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F4F4F2",
  },
  header: {
    backgroundColor: "#1B4332",
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingBottom: 18,
    paddingHorizontal: 18,
    marginHorizontal: -18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  headerTitle: {
    ...typography.screenTitle,
    color: "#FFFFFF",
    fontSize: 22,
    textAlign: "center",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  webSection: {
    marginTop: 14,
  },
  webTitle: {
    ...typography.itemTitle,
    fontSize: 14,
    color: "#1B4332",
    textAlign: "right",
    marginBottom: 8,
  },
  webModelList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  webModelChip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(27,67,50,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  webModelChipActive: {
    backgroundColor: "rgba(27,67,50,0.12)",
    borderColor: "#1B4332",
  },
  webModelText: {
    ...typography.itemSubtitle,
    fontSize: 11,
    color: "#4D5C55",
  },
  webModelTextActive: {
    color: "#1B4332",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: {
    ...typography.itemTitle,
    fontSize: 16,
    color: "#1F2D25",
    textAlign: "right",
  },
  cardValue: {
    ...typography.itemTitle,
    fontSize: 18,
    color: "#1B4332",
    textAlign: "right",
    marginTop: 6,
  },
  cardMeta: {
    ...typography.itemSubtitle,
    fontSize: 13,
    color: "#7C8A82",
    textAlign: "right",
    marginTop: 4,
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: "#1B4332",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryText: {
    ...typography.buttonText,
    fontSize: 14,
    color: "#FFFFFF",
  },
  secondaryBtn: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1B4332",
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryText: {
    ...typography.buttonText,
    fontSize: 14,
    color: "#1B4332",
  },
  helperText: {
    ...typography.itemSubtitle,
    fontSize: 12,
    color: "#7C8A82",
    textAlign: "center",
    marginTop: 14,
  },
  errorText: {
    ...typography.itemSubtitle,
    fontSize: 12,
    color: "#B04E4E",
    textAlign: "center",
    marginTop: 10,
  },
  progressWrap: {
    marginTop: 14,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressText: {
    ...typography.itemSubtitle,
    fontSize: 12,
    color: "#7C8A82",
  },
  progressTrack: {
    marginTop: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#E6ECE7",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#D4AF37",
    borderRadius: 8,
  },
});

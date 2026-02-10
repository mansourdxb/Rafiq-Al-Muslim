import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import { initLlama } from "llama.rn";

import { typography } from "@/theme/typography";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

const MODEL_PATH = FileSystem.documentDirectory + "models/ai-model.gguf";
const SYSTEM_PROMPT =
  "أنت مساعد ذكي داخل تطبيق إسلامي. أجب دائمًا بالعربية الفصحى وبأسلوب لطيف ومختصر. لا تُصدر فتاوى مفصلة؛ عند الأحكام الشرعية قدّم تنبيهًا لطيفًا بمراجعة العلماء أو المصادر الموثوقة.";

const STOP_WORDS = [
  "</s>",
  "<|end|>",
  "<|eot_id|>",
  "<|end_of_text|>",
  "<|im_end|>",
  "<|EOT|>",
  "<|END_OF_TURN_TOKEN|>",
  "<|end_of_turn|>",
  "<|endoftext|>",
];

export default function AiChatTestScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0
  );

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "missing" | "ready" | "error">("idle");
  const [errorText, setErrorText] = useState<string | null>(null);
  const contextRef = useRef<any>(null);
  const isSendingRef = useRef(false);

  const canSend = status === "ready" && !isSendingRef.current;

  const headerTitle = "المساعد الذكي";

  const checkAndInit = useCallback(async () => {
    if (Platform.OS === "web") {
      setStatus("missing");
      setErrorText("النموذج غير مدعوم على الويب");
      return;
    }
    setStatus("loading");
    setErrorText(null);
    try {
      const info = await FileSystem.getInfoAsync(MODEL_PATH);
      if (!info.exists) {
        setStatus("missing");
        setErrorText("Model not installed");
        return;
      }
      const modelUri = "file://" + MODEL_PATH;
      const ctx = await initLlama({ model: modelUri, n_ctx: 2048 });
      contextRef.current = ctx;
      setStatus("ready");
    } catch (err: any) {
      setStatus("error");
      setErrorText(err?.message ?? "تعذر تحميل النموذج");
    }
  }, []);

  useEffect(() => {
    void checkAndInit();
    return () => {
      try {
        contextRef.current?.release?.();
      } catch {}
    };
  }, [checkAndInit]);

  const sendMessage = async () => {
    if (!canSend) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    const userId = `u_${Date.now()}`;
    const assistantId = `a_${Date.now() + 1}`;
    const nextMessages: ChatMessage[] = [
      ...messages,
      { id: userId, role: "user", content: trimmed },
      { id: assistantId, role: "assistant", content: "" },
    ];

    setMessages(nextMessages);
    setInput("");
    isSendingRef.current = true;

    try {
      const ctx = contextRef.current;
      if (!ctx) throw new Error("Context not ready");

      const chatMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...nextMessages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role, content: m.content })),
      ];

      await ctx.completion(
        {
          messages: chatMessages,
          n_predict: 200,
          stop: STOP_WORDS,
        },
        (data: any) => {
          const token = data?.token ?? data?.content ?? "";
          if (!token) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + token } : m
            )
          );
        }
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "تعذر الحصول على الرد. حاول مرة أخرى." }
            : m
        )
      );
      setErrorText(err?.message ?? "تعذر الحصول على الرد");
    } finally {
      isSendingRef.current = false;
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
          {item.content}
        </Text>
      </View>
    );
  };

  const footerStatus = useMemo(() => {
    if (status === "missing") return errorText || "Model not installed";
    if (status === "loading") return "جاري تحميل النموذج...";
    if (status === "error") return errorText || "حدث خطأ أثناء التحميل";
    return null;
  }, [status, errorText]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <Pressable
            style={styles.headerIcon}
            onPress={() => navigation.goBack()}
            hitSlop={10}
          >
            <Feather name="chevron-right" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {footerStatus ? (
          <Text style={styles.statusText}>{footerStatus}</Text>
        ) : null}

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
        />

        <View style={[styles.inputRow, { paddingBottom: insets.bottom + 10 }]}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="اكتب رسالتك..."
            placeholderTextColor="#9BA5A0"
            style={styles.input}
            textAlign="right"
            writingDirection="rtl"
            multiline
          />
          <Pressable
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!canSend}
          >
            <Text style={styles.sendText}>إرسال</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  body: {
    flex: 1,
  },
  statusText: {
    ...typography.itemSubtitle,
    fontSize: 13,
    color: "#B04E4E",
    textAlign: "center",
    paddingTop: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#E7F1EC",
  },
  bubbleAssistant: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E5E2",
  },
  bubbleText: {
    ...typography.itemSubtitle,
    fontSize: 14,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: "#1F2D25",
    textAlign: "right",
    writingDirection: "rtl",
  },
  bubbleTextAssistant: {
    color: "#1F2D25",
    textAlign: "right",
    writingDirection: "rtl",
  },
  inputRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: "#F4F4F2",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    ...typography.inputText,
    fontSize: 14,
    color: "#1F2D25",
  },
  sendBtn: {
    backgroundColor: "#1B4332",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendText: {
    ...typography.buttonText,
    fontSize: 14,
    color: "#FFFFFF",
  },
});

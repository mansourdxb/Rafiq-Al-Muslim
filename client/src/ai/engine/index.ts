import { Platform } from "react-native";
import type { AiEngine } from "./types";

let cachedEngine: AiEngine | null = null;

export function getAiEngine(): AiEngine {
  if (cachedEngine) return cachedEngine;

  if (Platform.OS === "web") {
    const { createWebEngine } = require("./webEngine");
    cachedEngine = createWebEngine();
    return cachedEngine;
  }

  const { createNativeEngine } = require("./nativeEngine");
  cachedEngine = createNativeEngine();
  return cachedEngine;
}

import type { AiEngine, EnsureModelOptions, GenerateInput } from "./types";

const MODEL_KEY = "ai.webllm.model";
const READY_KEY = "ai.webllm.ready";

let engineRef: any = null;
let loadedModelId: string | null = null;
let loadingPromise: Promise<void> | null = null;

function getStorage() {
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

export function getSelectedWebModelId(): string | null {
  const storage = getStorage();
  if (!storage) return null;
  return storage.getItem(MODEL_KEY);
}

export function setSelectedWebModelId(modelId: string) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(MODEL_KEY, modelId);
}

export function clearSelectedWebModelId() {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(MODEL_KEY);
}

export function getWebReadyFlag(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  return storage.getItem(READY_KEY) === "1";
}

function setWebReadyFlag(value: boolean) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(READY_KEY, value ? "1" : "0");
}

export async function getWebModelList(): Promise<string[]> {
  const webllm = await import("@mlc-ai/web-llm");
  const list = webllm.prebuiltAppConfig?.model_list ?? [];
  return list.map((item: any) => item.model_id).filter(Boolean);
}

function isWebGpuSupported() {
  if (typeof navigator === "undefined") return false;
  return "gpu" in navigator;
}

function isDocumentVisible() {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
}

function normalizeWebGpuError(err: any) {
  const msg = String(err?.message ?? "");
  if (err?.name === "NotAllowedError" || msg.includes("requestAdapter")) {
    return new Error("?????? ??? ????? ?????? ?????? ??????? ?? ????? ????????");
  }
  return err;
}

async function ensureWebEngine(options?: EnsureModelOptions) {
  if (!isWebGpuSupported()) {
    throw new Error("WebGPU ??? ????? ??? ??? ??????");
  }

  const modelId = options?.modelId ?? getSelectedWebModelId();
  if (!modelId) {
    throw new Error("???? ????? ????? ?????");
  }

  if (engineRef && loadedModelId === modelId) {
    return;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    const webllm = await import("@mlc-ai/web-llm");
    const initProgressCallback = (info: any) => {
      const ratio =
        typeof info?.progress === "number"
          ? info.progress
          : typeof info === "number"
          ? info
          : 0;
      options?.onProgress?.(ratio);
    };

    if (!isDocumentVisible()) {
      throw new Error("?????? ??? ????? ?????? ?????? ??????? ?? ????? ????????");
    }

    try {
      engineRef = await webllm.CreateMLCEngine(modelId, {
        initProgressCallback,
      });
    } catch (err: any) {
      throw normalizeWebGpuError(err);
    }
    loadedModelId = modelId;
    setWebReadyFlag(true);
  })();

  try {
    await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

export function createWebEngine(): AiEngine {
  return {
    isSupported() {
      return isWebGpuSupported();
    },
    async isModelReady() {
      const modelId = getSelectedWebModelId();
      if (!modelId) return false;
      if (!isWebGpuSupported()) return false;
      return Boolean(engineRef && loadedModelId === modelId);
    },
    async ensureModelReady(options?: EnsureModelOptions) {
      await ensureWebEngine(options);
    },
    async generateStream(input: GenerateInput, onToken: (token: string) => void) {
      await ensureWebEngine();

      let stream: any;
      try {
        stream = await engineRef.chat.completions.create({
          messages: input.messages,
          temperature: input.temperature,
          stream: true,
        });
      } catch (err: any) {
        throw normalizeWebGpuError(err);
      }

      for await (const chunk of stream) {
        const delta = chunk?.choices?.[0]?.delta?.content ?? "";
        if (delta) onToken(delta);
      }
    },
  };
}

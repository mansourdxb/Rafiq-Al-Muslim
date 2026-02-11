import type { AiEngine, EnsureModelOptions, GenerateInput } from "./types";
import { getModelInfo, getModelPath } from "@/src/lib/ai/modelStorage";

let contextRef: any = null;
let initPromise: Promise<void> | null = null;

async function ensureContext(options?: EnsureModelOptions) {
  if (contextRef) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const info = await getModelInfo();
    if (!info.exists) {
      throw new Error("النموذج غير مثبت");
    }

    const modelUri = "file://" + getModelPath();
    const llama = await import("llama.rn");
    contextRef = await llama.initLlama({
      model: modelUri,
      n_ctx: 2048,
    });
  })();

  return initPromise;
}

export function createNativeEngine(): AiEngine {
  return {
    isSupported() {
      return true;
    },
    async isModelReady() {
      const info = await getModelInfo();
      return Boolean(info.exists);
    },
    async ensureModelReady(options?: EnsureModelOptions) {
      await ensureContext(options);
    },
    async generateStream(input: GenerateInput, onToken: (token: string) => void) {
      await ensureContext();
      const ctx = contextRef;
      if (!ctx) {
        throw new Error("Context not ready");
      }

      await ctx.completion(
        {
          messages: input.messages,
          temperature: input.temperature,
          n_predict: 200,
          stop: [
            "</s>",
            "<|end|>",
            "<|eot_id|>",
            "<|end_of_text|>",
            "<|im_end|>",
            "<|EOT|>",
            "<|END_OF_TURN_TOKEN|>",
            "<|end_of_turn|>",
            "<|endoftext|>",
          ],
        },
        (data: any) => {
          const token = data?.token ?? data?.content ?? "";
          if (token) onToken(token);
        }
      );
    },
  };
}

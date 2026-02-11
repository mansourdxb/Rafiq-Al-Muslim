export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerateInput = {
  messages: AiMessage[];
  temperature?: number;
};

export type EnsureModelOptions = {
  modelId?: string;
  onProgress?: (ratio: number) => void;
};

export type AiEngine = {
  isSupported(): boolean;
  isModelReady(): Promise<boolean>;
  ensureModelReady(options?: EnsureModelOptions): Promise<void>;
  generateStream(input: GenerateInput, onToken: (token: string) => void): Promise<void>;
};

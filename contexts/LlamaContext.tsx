import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "@luxin_model_info";

export interface ModelInfo {
  name: string;
  path: string;
}

interface LlamaContextValue {
  modelInfo: ModelInfo | null;
  isLoading: boolean;
  loadingProgress: number;
  isGenerating: boolean;
  isPreviewMode: boolean;
  loadModel: (uri: string, name: string) => Promise<void>;
  unloadModel: () => Promise<void>;
  generateResponse: (
    messages: { role: "user" | "assistant"; content: string }[],
    systemPrompt: string,
    onToken: (token: string) => void,
  ) => Promise<void>;
  stopGeneration: () => void;
}

const LlamaCtx = createContext<LlamaContextValue | null>(null);

function buildPrompt(
  messages: { role: "user" | "assistant"; content: string }[],
  systemPrompt: string,
): string {
  let prompt = systemPrompt
    ? `<|im_start|>system\n${systemPrompt}<|im_end|>\n`
    : "";
  for (const msg of messages) {
    prompt += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`;
  }
  prompt += "<|im_start|>assistant\n";
  return prompt;
}

export function LlamaProvider({ children }: { children: React.ReactNode }) {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const contextRef = useRef<any>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const loadModel = useCallback(async (uri: string, name: string) => {
    if (contextRef.current) {
      try {
        await contextRef.current.release();
      } catch {}
      contextRef.current = null;
    }

    setIsLoading(true);
    setLoadingProgress(0);

    let llamaLib: any = null;
    try {
      llamaLib = require("llama.rn");
    } catch {
      setIsPreviewMode(true);
    }

    if (!llamaLib) {
      await new Promise((r) => setTimeout(r, 1500));
      setLoadingProgress(100);
      const info = { name, path: uri };
      setModelInfo(info);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(info));
      setIsLoading(false);
      setIsPreviewMode(true);
      return;
    }

    try {
      const filePath = uri.startsWith("file://") ? uri.slice(7) : uri;
      const ctx = await llamaLib.initLlama(
        {
          model: filePath,
          use_mlock: true,
          n_ctx: 2048,
          n_batch: 512,
        },
        (progress: number) => {
          setLoadingProgress(progress);
        },
      );
      contextRef.current = ctx;
      const info = { name, path: uri };
      setModelInfo(info);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    } catch (e) {
      console.warn("llama.rn load error:", e);
      setIsPreviewMode(true);
      const info = { name, path: uri };
      setModelInfo(info);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    } finally {
      setIsLoading(false);
      setLoadingProgress(100);
    }
  }, []);

  const unloadModel = useCallback(async () => {
    if (contextRef.current) {
      try {
        await contextRef.current.release();
      } catch {}
      contextRef.current = null;
    }
    setModelInfo(null);
    setIsPreviewMode(false);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const generateResponse = useCallback(
    async (
      messages: { role: "user" | "assistant"; content: string }[],
      systemPrompt: string,
      onToken: (token: string) => void,
    ) => {
      if (isGenerating) return;
      setIsGenerating(true);

      if (isPreviewMode || !contextRef.current) {
        const demoText =
          "I'm running in preview mode. To use real AI inference, please build the app natively via Expo Launch (iOS) or a development build. Once built natively, load any GGUF model file and I'll respond with real AI-generated text!";
        for (const char of demoText) {
          onToken(char);
          await new Promise((r) => setTimeout(r, 15));
        }
        setIsGenerating(false);
        return;
      }

      try {
        const prompt = buildPrompt(messages, systemPrompt);
        const { stop, promise } = contextRef.current.completion(
          {
            prompt,
            n_predict: 512,
            temperature: 0.7,
            top_k: 40,
            top_p: 0.9,
            stop: ["<|im_end|>", "<|im_start|>", "###", "Human:", "User:"],
          },
          (data: { token: string }) => {
            onToken(data.token);
          },
        );
        stopRef.current = stop;
        await promise;
      } catch (e) {
        console.warn("Generation error:", e);
        onToken("\n[Error generating response]");
      } finally {
        stopRef.current = null;
        setIsGenerating(false);
      }
    },
    [isGenerating, isPreviewMode],
  );

  const stopGeneration = useCallback(() => {
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  return (
    <LlamaCtx.Provider
      value={{
        modelInfo,
        isLoading,
        loadingProgress,
        isGenerating,
        isPreviewMode,
        loadModel,
        unloadModel,
        generateResponse,
        stopGeneration,
      }}
    >
      {children}
    </LlamaCtx.Provider>
  );
}

export function useLlama() {
  const ctx = useContext(LlamaCtx);
  if (!ctx) throw new Error("useLlama must be used inside LlamaProvider");
  return ctx;
}

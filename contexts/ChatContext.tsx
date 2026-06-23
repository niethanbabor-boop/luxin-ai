import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "@luxin_conversations";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

interface ChatContextValue {
  conversations: Conversation[];
  currentConversationId: string | null;
  currentMessages: Message[];
  isLoaded: boolean;
  newConversation: () => string;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  addUserMessage: (content: string) => string;
  startAssistantMessage: () => string;
  appendToMessage: (id: string, token: string) => void;
  finalizeMessage: (id: string) => void;
  clearAll: () => void;
}

function makeId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 7);
}

const ChatCtx = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Conversation[];
          setConversations(parsed);
          if (parsed.length > 0) setCurrentId(parsed[0].id);
        } catch {}
      }
      setIsLoaded(true);
    });
  }, []);

  const persist = useCallback((convs: Conversation[]) => {
    const toSave = convs.map((c) => ({
      ...c,
      messages: c.messages.map((m) => ({ ...m, isStreaming: false })),
    }));
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, []);

  const newConversation = useCallback(() => {
    const id = makeId();
    const conv: Conversation = {
      id,
      title: "New chat",
      messages: [],
      createdAt: Date.now(),
    };
    setConversations((prev) => {
      const updated = [conv, ...prev];
      persist(updated);
      return updated;
    });
    setCurrentId(id);
    return id;
  }, [persist]);

  const selectConversation = useCallback((id: string) => {
    setCurrentId(id);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        persist(updated);
        return updated;
      });
      setCurrentId((prev) => {
        if (prev !== id) return prev;
        return conversations.find((c) => c.id !== id)?.id ?? null;
      });
    },
    [conversations, persist],
  );

  const addUserMessage = useCallback(
    (content: string) => {
      const msgId = makeId();
      let convId = currentId;

      setConversations((prev) => {
        let updated = [...prev];
        if (!convId || !prev.find((c) => c.id === convId)) {
          convId = makeId();
          const newConv: Conversation = {
            id: convId,
            title: content.slice(0, 40) || "New chat",
            messages: [],
            createdAt: Date.now(),
          };
          updated = [newConv, ...updated];
        }
        updated = updated.map((c) => {
          if (c.id !== convId) return c;
          const title =
            c.messages.length === 0 ? content.slice(0, 40) || c.title : c.title;
          return {
            ...c,
            title,
            messages: [
              ...c.messages,
              { id: msgId, role: "user" as const, content },
            ],
          };
        });
        persist(updated);
        return updated;
      });

      if (!currentId) setCurrentId(convId!);
      return msgId;
    },
    [currentId, persist],
  );

  const startAssistantMessage = useCallback(() => {
    const msgId = makeId();
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== currentId) return c;
        return {
          ...c,
          messages: [
            ...c.messages,
            { id: msgId, role: "assistant" as const, content: "", isStreaming: true },
          ],
        };
      }),
    );
    return msgId;
  }, [currentId]);

  const appendToMessage = useCallback((id: string, token: string) => {
    setConversations((prev) =>
      prev.map((c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === id ? { ...m, content: m.content + token } : m,
        ),
      })),
    );
  }, []);

  const finalizeMessage = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const updated = prev.map((c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === id ? { ...m, isStreaming: false } : m,
          ),
        }));
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  const clearAll = useCallback(() => {
    setConversations([]);
    setCurrentId(null);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const currentMessages =
    conversations.find((c) => c.id === currentId)?.messages ?? [];

  return (
    <ChatCtx.Provider
      value={{
        conversations,
        currentConversationId: currentId,
        currentMessages,
        isLoaded,
        newConversation,
        selectConversation,
        deleteConversation,
        addUserMessage,
        startAssistantMessage,
        appendToMessage,
        finalizeMessage,
        clearAll,
      }}
    >
      {children}
    </ChatCtx.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error("useChat must be used inside ChatProvider");
  return ctx;
}

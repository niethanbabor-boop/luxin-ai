import * as Haptics from "expo-haptics";
import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatBubble } from "@/components/ChatBubble";
import { ModelPickerModal } from "@/components/ModelPickerModal";
import { Sidebar } from "@/components/Sidebar";
import { TypingIndicator } from "@/components/TypingIndicator";
import { useChat } from "@/contexts/ChatContext";
import { useLlama } from "@/contexts/LlamaContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

const SYSTEM_PROMPT =
  "You are Luxin AI, a helpful and knowledgeable assistant. Be concise, clear, and helpful.";

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const {
    currentMessages,
    newConversation,
    addUserMessage,
    startAssistantMessage,
    appendToMessage,
    finalizeMessage,
  } = useChat();

  const {
    modelInfo,
    isGenerating,
    isLoading,
    isPreviewMode,
    generateResponse,
    stopGeneration,
  } = useLlama();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isGenerating) return;

    Keyboard.dismiss();
    setInput("");

    addUserMessage(text);
    const assistantMsgId = startAssistantMessage();

    const messagesToSend = [
      ...currentMessages.filter((m) => !m.isStreaming),
      { role: "user" as const, content: text },
    ];

    await generateResponse(
      messagesToSend,
      SYSTEM_PROMPT,
      (token: string) => {
        appendToMessage(assistantMsgId, token);
      },
    );

    finalizeMessage(assistantMsgId);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [
    input,
    isGenerating,
    currentMessages,
    addUserMessage,
    startAssistantMessage,
    generateResponse,
    appendToMessage,
    finalizeMessage,
  ]);

  const handleNewChat = useCallback(() => {
    newConversation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [newConversation]);

  const isEmpty = currentMessages.length === 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.headerBg,
            paddingTop: topPad + 8,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setShowSidebar(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerBtn}
        >
          <Feather name="menu" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowModelPicker(true)}
          style={styles.modelSelector}
          activeOpacity={0.7}
        >
          <Text style={[styles.modelName, { color: colors.foreground }]}>
            {isLoading
              ? "Loading…"
              : modelInfo
                ? modelInfo.name.length > 20
                  ? modelInfo.name.slice(0, 18) + "…"
                  : modelInfo.name
                : "Select model"}
          </Text>
          {!isLoading && (
            <View
              style={[
                styles.modelDot,
                {
                  backgroundColor: modelInfo
                    ? isPreviewMode
                      ? colors.mutedForeground
                      : colors.primary
                    : colors.mutedForeground,
                },
              ]}
            />
          )}
          <Feather
            name="chevron-down"
            size={14}
            color={colors.mutedForeground}
            style={{ marginLeft: 2 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNewChat}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerBtn}
        >
          <Feather name="edit" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {/* Empty state */}
        {isEmpty ? (
          <View style={styles.emptyState}>
            <View
              style={[styles.logoContainer, { backgroundColor: colors.card }]}
            >
              <Image
                source={require("@/assets/images/icon.png")}
                style={styles.logo}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Luxin AI
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              {modelInfo
                ? "Ask me anything"
                : "Load a GGUF model to get started"}
            </Text>
            {!modelInfo && (
              <TouchableOpacity
                style={[
                  styles.loadModelBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => setShowModelPicker(true)}
              >
                <Feather
                  name="cpu"
                  size={16}
                  color={colors.primaryForeground}
                />
                <Text
                  style={[
                    styles.loadModelText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Load a model
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={[...currentMessages].reverse()}
            keyExtractor={(item) => item.id}
            inverted
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.messageList,
              { paddingBottom: 16 },
            ]}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              isGenerating &&
              currentMessages[currentMessages.length - 1]?.role === "user" ? (
                <TypingIndicator />
              ) : null
            }
            renderItem={({ item }) => <ChatBubble message={item} />}
          />
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: bottomPad + 8,
            },
          ]}
        >
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              style={[
                styles.textInput,
                { color: colors.foreground },
              ]}
              placeholder={
                modelInfo ? "Message Luxin…" : "Load a model to chat"
              }
              placeholderTextColor={colors.mutedForeground}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={4000}
              returnKeyType="default"
              editable={!!modelInfo && !isLoading}
              blurOnSubmit={false}
            />
            {isGenerating ? (
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: colors.destructive }]}
                onPress={() => {
                  stopGeneration();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <Feather name="square" size={16} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor:
                      input.trim() && modelInfo
                        ? colors.primary
                        : colors.muted,
                  },
                ]}
                onPress={handleSend}
                disabled={!input.trim() || !modelInfo || isLoading}
              >
                <Feather
                  name="arrow-up"
                  size={18}
                  color={
                    input.trim() && modelInfo
                      ? colors.primaryForeground
                      : colors.mutedForeground
                  }
                />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            {isPreviewMode
              ? "Preview mode — native build required for real inference"
              : "Runs 100% on your device — no internet required"}
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* Sidebar */}
      <Sidebar
        visible={showSidebar}
        onClose={() => setShowSidebar(false)}
        onNewChat={handleNewChat}
      />

      {/* Model picker */}
      <ModelPickerModal
        visible={showModelPicker}
        onClose={() => setShowModelPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modelSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modelName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  modelDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 32,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 4,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  loadModelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  loadModelText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  messageList: {
    paddingTop: 8,
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 120,
    paddingTop: 6,
    paddingBottom: 6,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 2,
    opacity: 0.7,
  },
});

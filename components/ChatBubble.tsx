import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Message } from "@/contexts/ChatContext";

interface Props {
  message: Message;
}

export function ChatBubble({ message }: Props) {
  const colors = useColors();
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <View style={styles.userRow}>
        <View
          style={[
            styles.userBubble,
            {
              backgroundColor: colors.userBubble,
              borderColor: colors.userBubbleBorder,
            },
          ]}
        >
          <Text style={[styles.userText, { color: colors.foreground }]}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.assistantRow}>
      <View
        style={[
          styles.assistantIcon,
          { backgroundColor: colors.primary },
        ]}
      >
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.iconImage}
        />
      </View>
      <View style={styles.assistantContent}>
        <Text style={[styles.assistantText, { color: colors.foreground }]}>
          {message.content}
          {message.isStreaming && (
            <Text style={{ color: colors.primary }}>▋</Text>
          )}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  userBubble: {
    maxWidth: "80%",
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
  assistantRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    alignItems: "flex-start",
  },
  assistantIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginTop: 2,
  },
  iconImage: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  assistantContent: {
    flex: 1,
  },
  assistantText: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: "Inter_400Regular",
  },
});

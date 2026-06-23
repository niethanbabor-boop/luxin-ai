import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useChat, type Conversation } from "@/contexts/ChatContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  onClose: () => void;
  onNewChat: () => void;
}

export function Sidebar({ visible, onClose, onNewChat }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { conversations, currentConversationId, selectConversation, deleteConversation } = useChat();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSelect = useCallback(
    (id: string) => {
      selectConversation(id);
      Haptics.selectionAsync();
      onClose();
    },
    [selectConversation, onClose],
  );

  const handleDelete = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      deleteConversation(id);
    },
    [deleteConversation],
  );

  if (!visible) return null;

  const renderItem = ({ item }: { item: Conversation }) => {
    const isActive = item.id === currentConversationId;
    return (
      <TouchableOpacity
        style={[
          styles.convItem,
          isActive && { backgroundColor: colors.secondary },
        ]}
        onPress={() => handleSelect(item.id)}
        activeOpacity={0.7}
      >
        <Feather
          name="message-circle"
          size={16}
          color={isActive ? colors.primary : colors.mutedForeground}
          style={{ marginTop: 1 }}
        />
        <Text
          style={[
            styles.convTitle,
            {
              color: isActive ? colors.foreground : colors.mutedForeground,
            },
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="x" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable
        style={[
          styles.sidebar,
          {
            backgroundColor: colors.sidebar,
            paddingTop: topPad + 8,
            paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 34 : 16),
          },
        ]}
        onPress={(e) => e.stopPropagation()}
      >
        <View style={styles.header}>
          <Text style={[styles.appName, { color: colors.foreground }]}>
            Luxin AI
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.newChatBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            onNewChat();
            onClose();
          }}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={16} color={colors.primaryForeground} />
          <Text
            style={[styles.newChatText, { color: colors.primaryForeground }]}
          >
            New chat
          </Text>
        </TouchableOpacity>

        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="message-circle" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No conversations yet
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              Recent
            </Text>
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
            />
          </>
        )}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    zIndex: 100,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sidebar: {
    width: 280,
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  appName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  newChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  newChatText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  convItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 2,
  },
  convTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});

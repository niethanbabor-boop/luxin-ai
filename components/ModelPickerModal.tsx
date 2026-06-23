import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLlama } from "@/contexts/LlamaContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ModelPickerModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { modelInfo, isLoading, loadingProgress, isPreviewMode, loadModel, unloadModel } =
    useLlama();

  const handlePickModel = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) return;
      if (!asset.name.toLowerCase().endsWith(".gguf")) {
        return;
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await loadModel(asset.uri, asset.name.replace(".gguf", ""));
      onClose();
    } catch (e) {
      console.warn("Document picker error:", e);
    }
  }, [loadModel, onClose]);

  const handleUnload = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await unloadModel();
  }, [unloadModel]);

  const bottomPad = Math.max(insets.bottom, 16);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              paddingBottom: bottomPad + 8,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[styles.handle, { backgroundColor: colors.mutedForeground }]}
          />
          <Text style={[styles.title, { color: colors.foreground }]}>
            Model
          </Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                Loading model... {Math.round(loadingProgress)}%
              </Text>
              <View
                style={[styles.progressBar, { backgroundColor: colors.border }]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${loadingProgress}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ) : modelInfo ? (
            <View style={styles.modelInfo}>
              <View
                style={[
                  styles.modelCard,
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                ]}
              >
                <View style={styles.modelRow}>
                  <View
                    style={[
                      styles.modelDot,
                      {
                        backgroundColor: isPreviewMode
                          ? colors.mutedForeground
                          : colors.primary,
                      },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.modelName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {modelInfo.name}
                    </Text>
                    <Text
                      style={[
                        styles.modelStatus,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {isPreviewMode
                        ? "Preview mode (native build required)"
                        : "Running on device"}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.btn,
                  styles.btnSecondary,
                  { borderColor: colors.border },
                ]}
                onPress={handlePickModel}
              >
                <Feather name="folder" size={16} color={colors.foreground} />
                <Text style={[styles.btnText, { color: colors.foreground }]}>
                  Switch Model
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.destructive }]}
                onPress={handleUnload}
              >
                <Feather name="trash-2" size={16} color="#fff" />
                <Text style={[styles.btnText, { color: "#fff" }]}>
                  Unload Model
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noModel}>
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: colors.secondary },
                ]}
              >
                <Feather name="cpu" size={32} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No model loaded
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Load a GGUF model file to start chatting offline
              </Text>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary }]}
                onPress={handlePickModel}
              >
                <Feather name="folder" size={16} color={colors.primaryForeground} />
                <Text
                  style={[
                    styles.btnText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Browse for .gguf file
                </Text>
              </TouchableOpacity>
              {Platform.OS !== "web" && (
                <Text
                  style={[
                    styles.noteText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Supports llama 3, Mistral, Phi, Gemma, Qwen and more
                </Text>
              )}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
    opacity: 0.4,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 30,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  progressBar: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  modelInfo: {
    gap: 12,
    paddingBottom: 8,
  },
  modelCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  modelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modelName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  modelStatus: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  noModel: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 260,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
  },
  btnSecondary: {
    borderWidth: 1,
  },
  btnText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  noteText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 4,
  },
});

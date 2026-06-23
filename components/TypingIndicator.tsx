import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export function TypingIndicator() {
  const colors = useColors();
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -6,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(600),
        ]),
      );

    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 150);
    const a3 = anim(dot3, 300);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: colors.primary }]}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.iconImage}
        />
      </View>
      <View style={[styles.bubble, { backgroundColor: colors.card }]}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: colors.mutedForeground },
              { transform: [{ translateY: dot }] },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    alignItems: "center",
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  iconImage: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});

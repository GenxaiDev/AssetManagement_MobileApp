import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { spacing, typography } from "../theme/colors";

export default function AppHeader({
  title,
  subtitle,
  colors,
  onMenuPress,
  onBackPress,
}) {
  const insets = useSafeAreaInsets();
  const isMenu = !!onMenuPress;
  const leftIcon = isMenu ? "menu" : "chevron-back";
  const onLeftPress = isMenu ? onMenuPress : onBackPress;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.cardBorder,
          paddingTop: Math.max(insets.top, spacing.lg),
        },
      ]}
    >
      <TouchableOpacity
        onPress={onLeftPress}
        style={styles.iconButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.6}
      >
        <Ionicons name={leftIcon} size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    minHeight: 56,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fontHeading,
    fontSize: typography.h2,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subtitle: {
    fontFamily: typography.fontBody,
    fontSize: typography.small,
    color: "#FFFFFF",
    marginTop: 2,
  },
});

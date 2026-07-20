import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme, lightTheme } from "../theme/colors";
import { spacing, radius, typography } from "../theme/colors";
import AssetRegistrationScreen from "./AssetRegistrationScreen";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";

export default function DashboardScreen({ route }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const colors = theme;
  const permissions = route?.params?.permissions || [];
  const defaultPageKey = route?.params?.defaultPageKey || SIDEBAR_ITEMS[0].pageKey;

  const allowedItems = SIDEBAR_ITEMS.filter((item) =>
    permissions.some((p) => p.pageKey === item.pageKey && p.canView)
  );

  const defaultItem = allowedItems.find((item) => item.pageKey === defaultPageKey) || allowedItems[0] || SIDEBAR_ITEMS[0];
  const [activeItem, setActiveItem] = useState(defaultItem);

  const ActiveComponent = activeItem.Component;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.sidebar, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
        <View style={styles.sidebarHeader}>
          <Text style={[styles.sidebarTitle, { color: colors.textPrimary }]}>Menu</Text>
        </View>
        <ScrollView>
          {allowedItems.map((item) => {
            const isActive = activeItem.pageKey === item.pageKey;
            return (
              <TouchableOpacity
                key={item.pageKey}
                style={[
                  styles.sidebarItem,
                  { borderBottomColor: colors.cardBorder, backgroundColor: isActive ? colors.cardBackground2 : "transparent" },
                ]}
                onPress={() => setActiveItem(item)}
              >
                <Ionicons name={item.icon} size={20} color={isActive ? colors.accentBlue : colors.textSecondary} style={styles.sidebarIcon} />
                <Text style={[styles.sidebarLabel, { color: isActive ? colors.textPrimary : colors.textSecondary }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          }          )}
        </ScrollView>
        <View style={[styles.sidebarThemeRow, { borderTopColor: colors.cardBorder }]}>
          <Text style={[styles.sidebarThemeLabel, { color: colors.textSecondary }]}>Dark Mode</Text>
          <ThemeToggle isDark={isDark} theme={colors} onPress={toggleTheme} />
        </View>
      </View>
      <View style={styles.content}>
        <ActiveComponent theme={colors} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 260,
    borderRightWidth: 1,
  },
  sidebarHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.cardBorder,
  },
  sidebarTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.h2,
    fontWeight: "800",
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  sidebarIcon: {
    marginRight: spacing.md,
  },
  sidebarLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.body,
  },
  sidebarThemeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  sidebarThemeLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.body,
  },
  content: {
    flex: 1,
  },
});

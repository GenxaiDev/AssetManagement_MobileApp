import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, radius, typography } from "../theme/colors";
import ThemeToggle from "./ThemeToggle";

const SIDEBAR_WIDTH = 260;

const MENU_ITEMS = [
  { label: "Dashboard", icon: "grid", screen: "Dashboard" },
  { label: "Asset", icon: "cube", screen: "AssetRegistration" },
  { label: "Service Request", icon: "construct", screen: "ServiceRequest" },
  { label: "Incident Request", icon: "warning", screen: "IncidentRequest" },
];

export default function AppSidebar({
  colors,
  sidebarOpen,
  slideAnim,
  isAnimating,
  toggleSidebar,
  closeSidebar,
  navigation,
  route,
  username,
  roleName,
  isDark,
  toggleTheme,
  contextTheme,
}) {
  const handleMenuPress = (screen) => {
    if (screen === route.name) return;
    closeSidebar();
    setTimeout(() => {
      navigation.navigate(screen, {
        permissions: route?.params?.permissions || [],
        user: route?.params?.user || {},
      });
    }, 260);
  };

  const handleLogout = () => {
    closeSidebar();
    setTimeout(() => {
      navigation.replace("Login");
    }, 260);
  };

  const handleChangePassword = () => {
    closeSidebar();
    setTimeout(() => {
      navigation.navigate("ChangePassword");
    }, 260);
  };

  return (
    <Animated.View
      style={[
        styles.sidebar,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <View style={styles.sidebarHeader}>
        <View style={styles.sidebarHeaderRow}>
          <Text style={[styles.sidebarTitle, { color: colors.textPrimary }]}>Menu</Text>
          <TouchableOpacity onPress={closeSidebar} style={styles.sidebarCloseButton}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={styles.sidebarMenu}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={[
                styles.sidebarItem,
                { borderBottomColor: colors.cardBorder },
              ]}
              onPress={() => handleMenuPress(item.screen)}
            >
              <Ionicons name={item.icon} size={22} color={colors.accentBlue} style={styles.sidebarIcon} />
              <Text style={[styles.sidebarLabel, { color: colors.textPrimary }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      <View style={[styles.sidebarFooter, { borderTopColor: colors.cardBorder, borderBottomColor: colors.cardBorder }]}>
        <View style={[styles.userSection]}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={[styles.userAvatar, { backgroundColor: colors.accentBlue }]}>
                <Ionicons name="person" size={16} color={colors.white} />
              </View>
              <View style={[styles.userInfo, { marginLeft: 10 }]}>
                <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {username}
                </Text>
                <Text style={[styles.userRole, { color: colors.textSecondary }]} numberOfLines={1}>
                  {roleName}
                </Text>
              </View>
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <ThemeToggle isDark={isDark} theme={contextTheme} onPress={toggleTheme} />
          </View>
        </View>

        <TouchableOpacity style={[styles.sidebarItem]} onPress={handleChangePassword}>
          <Ionicons name="key-outline" size={22} color={colors.textSecondary} style={styles.sidebarIcon} />
          <Text style={[styles.sidebarLabel, { color: colors.textSecondary }]}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.sidebarItem]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} style={styles.sidebarIcon} />
            <Text style={[styles.sidebarLabel, { color: colors.textSecondary }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 20,
    flexDirection: "column",
  },
  sidebarHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  sidebarHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sidebarTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.h2,
    fontWeight: "800",
  },
  sidebarCloseButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  sidebarMenu: {},
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
  },
  sidebarThemeLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.body,
  },
  sidebarFooter: {
    borderTopWidth: 1,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
    alignItems: "flex-start",
  },
  userName: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.body,
  },
  userRole: {
    fontFamily: typography.fontBody,
    fontSize: typography.small,
  },
});

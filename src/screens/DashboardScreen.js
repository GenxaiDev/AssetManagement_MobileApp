import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme } from "../theme/colors";
import { spacing, radius, typography } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { getDashboardStats } from "../api/dashboard";
import { getUnreadNotificationCount } from "../api/notification";
import AppSidebar from "../components/AppSidebar";
import AppHeader from "../components/AppHeader";
import NotificationModal from "../components/NotificationModal";

const SIDEBAR_WIDTH = 260;

export default function DashboardScreen({ navigation, route }) {
  const { isDark, toggleTheme, theme } = useTheme();
  const colors = theme;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const isAnimating = useRef(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await getDashboardStats();
      setStats(res?.data?.data || res?.data || res);
    } catch (err) {
      console.error("Dashboard stats fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await getUnreadNotificationCount();
      setUnreadCount(res?.data?.unreadCount ?? 0);
    } catch (err) {
      console.error("Unread count fetch failed:", err);
    }
  };

  const formatCurrency = (value) => {
    if (value == null) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const toggleSidebar = () => {
    if (isAnimating.current) return;
    const toValue = sidebarOpen ? -SIDEBAR_WIDTH : 0;
    isAnimating.current = true;
    Animated.timing(slideAnim, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSidebarOpen(!sidebarOpen);
      isAnimating.current = false;
      if (!sidebarOpen) {
        loadUnreadCount();
      }
    });
  };

  const closeSidebar = () => {
    if (isAnimating.current) return;
    if (!sidebarOpen) return;
    isAnimating.current = true;
    Animated.timing(slideAnim, {
      toValue: -SIDEBAR_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSidebarOpen(false);
      isAnimating.current = false;
    });
  };

  const handleNotificationPress = () => {
    setShowNotifications(true);
  };

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accentBlue} size="large" />
      </View>
    );
  }

  const recentActivity = stats?.recentActivity || [];
  const distribution = stats?.distribution || [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Dashboard"
        subtitle="Asset overview and quick actions"
        colors={colors}
        onMenuPress={toggleSidebar}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: spacing.md }}>

        <View style={styles.cardsRow}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Ionicons name="cube" size={28} color={colors.accentBlue} />
          <Text style={[styles.cardValue, { color: colors.textPrimary }]}>
            {stats?.totalAssets ?? 0}
          </Text>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Total Assets</Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Ionicons name="checkmark-circle" size={28} color={colors.accentGreen} />
          <Text style={[styles.cardValue, { color: colors.textPrimary }]}>
            {stats?.allocatedCount ?? 0}
          </Text>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Allocated</Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Ionicons name="archive" size={28} color={colors.warning} />
          <Text style={[styles.cardValue, { color: colors.textPrimary }]}>
            {stats?.inStockCount ?? 0}
          </Text>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>In Stock</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.qrButton, { backgroundColor: colors.accentBlue }]}
        onPress={() => navigation.navigate("AssetRegistration")}
      >
        <Ionicons name="qr-code-outline" size={24} color={colors.white} />
        <Text style={[styles.qrButtonText, { color: colors.white }]}>Scan Asset QR Code</Text>
      </TouchableOpacity>

      <View
        style={[
          styles.section,
          { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
        {recentActivity.length ? (
          recentActivity.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.activityItem,
                { borderBottomColor: colors.cardBorder },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.activityCode, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {item.assetCode}
                </Text>
                <Text
                  style={[styles.activityName, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.assetName}
                </Text>
                <Text
                  style={[styles.activityMeta, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  {item.assignedTo} · {item.location}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.activityStatus, { color: colors.accentGreen }]}>
                  {item.assetStatus}
                </Text>
                <Text
                  style={[styles.activityType, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  {item.assetTypeName}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={{ color: colors.textMuted, marginVertical: spacing.md }}>
            No recent activity
          </Text>
        )}
      </View>
      <View style={{ height: spacing.md }} />
    </ScrollView>
    {sidebarOpen && (
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={closeSidebar}
      />
    )}
      <AppSidebar
        colors={colors}
        sidebarOpen={sidebarOpen}
        slideAnim={slideAnim}
        isAnimating={isAnimating}
        toggleSidebar={toggleSidebar}
        closeSidebar={closeSidebar}
        navigation={navigation}
        route={route}
        username={
          route?.params?.user?.name || route?.params?.user?.email || "User"
        }
        roleName={
          route?.params?.user?.roleName || route?.params?.user?.role || "User"
        }
        isDark={isDark}
        toggleTheme={toggleTheme}
        contextTheme={theme}
        onNotificationPress={handleNotificationPress}
        unreadCount={unreadCount}
      />
      <NotificationModal
        visible={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          loadUnreadCount();
        }}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: spacing.sm
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  collapseButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fontHeading,
    fontSize: typography.h2,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontBody,
    fontSize: typography.body,
  },
  cardsRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  card: {
    flex: 1,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.xs,
  },
  cardValue: {
    fontFamily: typography.fontHeading,
    fontSize: typography.h3,
    fontWeight: "700",
  },
  cardLabel: {
    fontFamily: typography.fontBody,
    fontSize: typography.small,
    textAlign: "center",
  },
  qrButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  qrButtonText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.body,
    fontWeight: "600",
  },
  section: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.h3,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  activityCode: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.body,
  },
  activityName: {
    fontFamily: typography.fontBody,
    fontSize: typography.small,
  },
  activityMeta: {
    fontFamily: typography.fontBody,
    fontSize: typography.small,
  },
  activityStatus: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.small,
  },
  activityType: {
    fontFamily: typography.fontBody,
    fontSize: typography.small,
  },
  distributionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  summaryItem: {
    alignItems: "center",
    gap: spacing.xs,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 10,
  },
});

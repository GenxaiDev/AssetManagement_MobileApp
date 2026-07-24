import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, radius, typography, darkTheme } from "../theme/colors";
import { getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "../api/notification";

export default function NotificationModal({ visible, onClose, colors }) {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUserNotifications();
      const list = res?.data?.notifications || res?.data || [];
      const count = res?.data?.unreadCount ?? list.filter((n) => !n.isRead).length;
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      Alert.alert("Error", "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible, loadNotifications]);

  const handlePress = async (item) => {
    try {
      if (!item.isRead) {
        await markNotificationAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { borderBottomColor: colors.cardBorder, backgroundColor: item.isRead ? colors.cardBackground : colors.background },
      ]}
      onPress={() => handlePress(item)}
    >
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationModule, { color: colors.textSecondary }]}>{item.module}</Text>
        <Text style={[styles.notificationMessage, { color: colors.textPrimary }]}>{item.message}</Text>
        <Text style={[styles.notificationDate, { color: colors.textMuted }]}>
          {new Date(item.createdDate).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
      {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.accentBlue }]} />}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
        <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Notifications</Text>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
                  <Text style={[styles.markAllText, { color: colors.accentBlue }]}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.accentBlue} size="large" />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No notifications yet</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: spacing.md }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  container: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontFamily: typography.fontHeading,
    fontSize: typography.h2,
    fontWeight: "800",
  },
  markAllButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  markAllText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.small,
  },
  closeButton: {
    padding: spacing.xs,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    fontFamily: typography.fontBody,
    fontSize: typography.body,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  notificationContent: {
    flex: 1,
    gap: spacing.xs,
  },
  notificationModule: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notificationMessage: {
    fontFamily: typography.fontBody,
    fontSize: typography.body,
  },
  notificationDate: {
    fontFamily: typography.fontBody,
    fontSize: typography.small,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

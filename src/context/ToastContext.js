import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { typography, radius } from "../theme/colors";

const ToastContext = createContext(null);

const { width } = Dimensions.get("window");

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const timeoutRef = useRef(null);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((message, type = "info", duration = 3000) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToast({ visible: true, message, type });

    Animated.timing(slideAnim, {
      toValue: Math.max(insets.top, 12),
      duration: 350,
      useNativeDriver: true,
    }).start();

    timeoutRef.current = setTimeout(() => {
      hideToast();
    }, duration);
  }, [insets.top]);

  const hideToast = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    });
  }, []);

  const getTheme = () => {
    switch (toast.type) {
      case "success":
        return { bg: "#10B981", icon: "checkmark-circle-outline" };
      case "error":
        return { bg: "#EF4444", icon: "alert-circle-outline" };
      case "warning":
        return { bg: "#F59E0B", icon: "warning-outline" };
      default:
        return { bg: "#3B82F6", icon: "information-circle-outline" };
    }
  };

  const theme = getTheme();

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              backgroundColor: theme.bg,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.content}>
            <Ionicons name={theme.icon} size={20} color="#FFFFFF" />
            <Text style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
            <TouchableOpacity onPress={hideToast} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    zIndex: 9999,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  message: {
    flex: 1,
    color: "#FFFFFF",
    fontFamily: typography.fontBodySemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 2,
  },
});

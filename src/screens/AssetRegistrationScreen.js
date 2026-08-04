import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, Animated } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme, lightTheme } from "../theme/colors";
import { spacing, radius, typography } from "../theme/colors";
import { getAssetById, searchAsset } from "../api/asset";
import { getUnreadNotificationCount } from "../api/notification";
import { useTheme } from "../context/ThemeContext";
import AppSidebar from "../components/AppSidebar";
import AppHeader from "../components/AppHeader";
import NotificationModal from "../components/NotificationModal";
import { signalRService } from "../services/signalRService";

const SIDEBAR_WIDTH = 260;

export default function AssetRegistrationScreen({ theme, navigation, route }) {
  const { isDark, toggleTheme, theme: contextTheme } = useTheme();
  const colors = contextTheme || darkTheme;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetDetails, setAssetDetails] = useState(null);
  const [loadingAsset, setLoadingAsset] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const isAnimating = useRef(false);

  const user = route?.params?.user || {};
  const username = user.name || user.email || "User";
  const roleName = user.roleName || user.role || "User";

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    const handler = (data) => {
      console.log("📬 SeedStatus:", data);
      const message = data.message || `${data.type} ${data.status}`;
      onShowToast?.({ message, suppressGeneric: !!data.nofUnread });
      if (data.nofUnread !== undefined) {
        setUnreadCount(data.nofUnread);
      }
    };
    signalRService.on("ReceiveNotification", handler);
    return () => {
      signalRService.off("ReceiveNotification", handler);
    };
  }, []);

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

  const loadUnreadCount = async () => {
    try {
      const res = await getUnreadNotificationCount();
      setUnreadCount(res?.data?.unreadCount ?? 0);
    } catch (err) {
      console.error("Unread count fetch failed:", err);
    }
  };

  const handleNotificationPress = () => {
    setShowNotifications(true);
  };

  const handleBarCodeScanned = async ({ data }) => {
    console.log("data of QR code", data)
    setScanned(true);
    setLoadingAsset(true);
    try {
      const asset = await searchAsset(data);
      console.log("asset--------------", asset)
      setAssetDetails(asset[0]);
      setShowAssetModal(true);
    } catch (err) {
      Alert.alert("Error", "Asset not found for this QR code.");
    } finally {
      setLoadingAsset(false);
    }
  };

  const handleManualSearch = async () => {
    if (!manualCode.trim()) {
      Alert.alert("Missing info", "Please enter an asset code.");
      return;
    }
    setLoadingAsset(true);
    try {
      const asset = await searchAsset(manualCode.trim());
      setAssetDetails(asset[0]);
      setShowAssetModal(true);
      setManualCode("");
    } catch (err) {
      Alert.alert("Error", "Asset not found.");
    } finally {
      setLoadingAsset(false);
    }
  };

  const renderAssetModal = () => {
    const handleServiceRequest = () => {
      setShowAssetModal(false);
      navigation.navigate("ServiceRequest", {
        asset: assetDetails,
        permissions: route?.params?.permissions || [],
        user: route?.params?.user || {},
      });
    };

    const handleIncidentRequest = () => {
      setShowAssetModal(false);
      navigation.navigate("IncidentRequest", {
        asset: assetDetails,
        permissions: route?.params?.permissions || [],
        user: route?.params?.user || {},
      });
    };

    return (
      <Modal visible={showAssetModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Asset Details</Text>
              <TouchableOpacity onPress={() => setShowAssetModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {assetDetails ? (
              <View style={styles.modalBody}>
                <Text style={[styles.detailText, { color: colors.textPrimary }]}>Asset Code: {assetDetails.assetCode}</Text>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>Type: {assetDetails.assetTypeName || "N/A"}</Text>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>Status: {assetDetails.assetStatus || "N/A"}</Text>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>Location: {assetDetails.currentLocation || "N/A"}</Text>

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={[styles.modalActionButton, { backgroundColor: colors.accentBlue }]}
                    onPress={handleServiceRequest}
                  >
                    <Ionicons name="construct-outline" size={20} color="#FFFFFF" style={styles.modalActionIcon} />
                    <Text style={styles.modalActionText}>Service Request</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionButton, { backgroundColor: colors.danger || "#EF4444" }]}
                    onPress={handleIncidentRequest}
                  >
                    <Ionicons name="warning-outline" size={20} color="#FFFFFF" style={styles.modalActionIcon} />
                    <Text style={styles.modalActionText}>Incident Request</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>No details available.</Text>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  if (!permission) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: colors.textPrimary }}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: spacing.lg }]}>
        <Ionicons name="camera-off" size={48} color={colors.textMuted} />
        <Text style={[styles.errorText, { color: colors.textPrimary, marginTop: spacing.md }]}>Camera permission denied</Text>
        <Text style={[styles.errorSubText, { color: colors.textSecondary, marginTop: spacing.sm }]}>
          Please enable camera access in your device settings to scan QR codes.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Asset Registration"
        subtitle="Scan asset QR code or enter asset code manually"
        colors={colors}
        onMenuPress={toggleSidebar}
      />

      <View style={styles.scannerContainer}>
        <CameraView
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          style={styles.camera}
        >
          <View style={styles.scannerOverlay}>
            <View style={styles.scanFrame} />
          </View>
        </CameraView>
        {scanned && (
          <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.rescanText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.manualSection}>
        <Text style={[styles.manualLabel, { color: colors.textMuted }]}>OR ENTER ASSET CODE MANUALLY</Text>
        <View style={styles.manualRow}>
          <TextInput
            style={[styles.manualInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
            placeholder="Asset Code / QR Data"
            placeholderTextColor={colors.placeholder}
            value={manualCode}
            onChangeText={setManualCode}
          />
          <TouchableOpacity
            style={[styles.manualButton, { backgroundColor: colors.accentBlue }]}
            onPress={handleManualSearch}
            disabled={loadingAsset}
          >
            <Ionicons name="search" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {sidebarOpen && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeSidebar} />
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
        username={username}
        roleName={roleName}
        isDark={isDark}
        toggleTheme={toggleTheme}
        contextTheme={contextTheme}
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
      {renderAssetModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  menuButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.h2,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: typography.body,
    marginTop: spacing.xs,
  },
  scannerContainer: {
    flex: 1,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    overflow: "hidden",
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderRadius: radius.md,
  },
  rescanButton: {
    position: "absolute",
    bottom: spacing.lg,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    gap: spacing.sm,
  },
  rescanText: {
    color: "#FFFFFF",
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.body,
  },
  manualSection: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  manualLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.tiny,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  manualRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  manualInput: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontFamily: typography.fontBody,
    fontSize: typography.body,
  },
  manualButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.h2,
    fontWeight: "800",
  },
  modalBody: {
    gap: spacing.sm,
  },
  modalActionRow: {
    flexDirection: "column",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.sm,
    minHeight: 52,
  },
  modalActionText: {
    color: "#FFFFFF",
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.body,
  },
  modalActionIcon: {
    marginRight: spacing.xs,
  },
  detailText: {
    fontFamily: typography.fontBody,
    fontSize: typography.body,
  },
  errorText: {
    fontFamily: typography.fontHeading,
    fontSize: typography.h2,
    textAlign: "center",
  },
  errorSubText: {
    fontFamily: typography.fontBody,
    fontSize: typography.body,
    textAlign: "center",
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
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
    zIndex: 20,
    flexDirection: "column",
  },
  sidebarHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.cardBorder,
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
    marginRight: -spacing.xs,
  },
  sidebarMenu: {
    flex: 1,
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
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.cardBorder,
  },
  sidebarThemeLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.body,
  },
  sidebarFooter: {
    borderTopWidth: 1,
    paddingVertical: spacing.md,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.body,
  },
  userRole: {
    fontFamily: typography.fontBody,
    fontSize: typography.small,
    marginTop: 2,
  },
});

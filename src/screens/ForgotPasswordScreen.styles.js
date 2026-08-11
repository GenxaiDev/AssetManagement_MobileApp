import { StyleSheet, Platform, StatusBar as RNStatusBar, Dimensions } from "react-native";
import { spacing, radius, typography } from "../theme/colors";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  glow: {
    position: "absolute",
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width,
    opacity: 0.16,
  },
  glowTop: {
    top: -width * 0.35,
    right: -width * 0.3,
    backgroundColor: "#1E88E5",
  },
  glowBottom: {
    bottom: -width * 0.35,
    left: -width * 0.3,
    backgroundColor: "#2E8B3A",
  },
  topHeaderBar: {
    paddingTop: (Platform.OS === "android" ? RNStatusBar.currentHeight : 0) + 25,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "end",
    justifyContent: "space-between",
    zIndex: 10,
  },
  toggleWrap: {
    position: "absolute",
    top: (Platform.OS === "android" ? RNStatusBar.currentHeight : 0) + 25,
    right: spacing.lg,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: spacing.xxl,
    justifyContent: "center",
  },
  heroTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.h2,
    lineHeight: typography.h2 + 4,
    textAlign: "center",
  },
  heroDesc: {
    fontFamily: typography.fontBody,
    fontSize: typography.body,
    lineHeight: 22,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    textAlign: "center",
    // maxWidth: "88%",
  },
  loginWrap: {
    marginTop: spacing.md,
  },
  welcomeCenter: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  fieldGap: {
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontFamily: typography.fontHeading,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  cardSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 16,
    fontWeight: "500",
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.tiny,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  backText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.small,
  },
});

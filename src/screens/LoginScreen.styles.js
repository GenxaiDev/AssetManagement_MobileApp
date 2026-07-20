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
  toggleWrap: {
    position: "absolute",
    top: (Platform.OS === "android" ? RNStatusBar.currentHeight : 0) + 12,
    right: spacing.lg,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 24,
    paddingBottom: spacing.xxl,
    justifyContent: "center",
  },
  heroTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.h2,
    lineHeight: typography.h2 + 4,
  },
  heroDesc: {
    fontFamily: typography.fontBody,
    fontSize: typography.body,
    lineHeight: 22,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    maxWidth: "88%",
  },
  featureRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  featureCard: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
  },
  featureIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
    backgroundColor: "rgba(30,136,229,0.12)",
  },
  featureBody: {},
  featureTitle: {
    fontFamily: typography.fontHeadingSemiBold,
    fontSize: 12.5,
    marginBottom: 2,
  },
  featureSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    lineHeight: 14,
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
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  rememberWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.xs,
  },
  rememberText: {
    fontFamily: typography.fontBody,
    fontSize: typography.small,
  },
  forgotText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.small,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 10,
    letterSpacing: 2,
    marginHorizontal: spacing.sm,
  },
  biometricBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  biometricText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.body,
  },
  footer: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 10,
    letterSpacing: 1.5,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});

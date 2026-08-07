import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import AppHeader from "../components/AppHeader";
import { changePassword as changePasswordApi } from "../api/auth/changePassword";
import { darkTheme, lightTheme } from "../theme/colors";
import { spacing, radius, typography } from "../theme/colors";

import { useToast } from "../context/ToastContext";

export default function ChangePasswordScreen({ navigation }) {
  const { isDark, theme } = useTheme();
  const colors = isDark ? darkTheme : lightTheme;
  const { showToast } = useToast();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast("Please fill in all fields", "warning");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "warning");
      return;
    }

    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters", "warning");
      return;
    }

    setLoading(true);
    try {
      await changePasswordApi(oldPassword, newPassword, confirmPassword);
      showToast("Password changed successfully", "success");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      navigation.goBack();
    } catch (error) {
      showToast(error?.response?.data?.message || "Failed to change password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <AppHeader
        title="Change Password"
        colors={theme}
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Update your password to keep your account secure.
          </Text>

          <View style={styles.form}>
            <InputField
              label="Old Password"
              placeholder="Enter old password"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
              autoCapitalize="none"
              theme={colors}
            />

            <InputField
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
              theme={colors}
            />

            <InputField
              label="Confirm New Password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              theme={colors}
            />

            <PrimaryButton
              title="Update Password"
              onPress={handleChangePassword}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.h2,
    fontFamily: "Exo2_700Bold",
  },
  description: {
    fontSize: typography.body,
    fontFamily: "DMSans_400Regular",
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
});

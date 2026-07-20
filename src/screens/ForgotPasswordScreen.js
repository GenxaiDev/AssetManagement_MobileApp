import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import ThemeToggle from "../components/ThemeToggle";
import BrandHeader from "../components/BrandHeader";
import {
  darkTheme,
  lightTheme,
} from "../theme/colors";
import { styles } from "./ForgotPasswordScreen.styles";
import { forgotPassword as forgotPasswordApi } from "../api/auth/forgotPassword";
import { useTheme } from "../context/ThemeContext";

export default function ForgotPasswordScreen({ navigation }) {
  const { isDark, theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert("Missing info", "Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await forgotPasswordApi(email);
      Alert.alert("Reset link sent", "Check your email for password reset instructions.");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Request failed", err.message || "Unable to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <LinearGradient
        colors={isDark ? ["#0a1426", "#0d1c33", "#0a1426"] : ["#eef1f6", "#e6ecf6", "#eef1f6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glow, styles.glowTop]} pointerEvents="none" />
      <View style={[styles.glow, styles.glowBottom]} pointerEvents="none" />

      <View style={styles.toggleWrap}>
        <ThemeToggle
          isDark={isDark}
          theme={theme}
          onPress={toggleTheme}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BrandHeader theme={theme} size="lg" />

          <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
            Reset <Text style={[styles.heroTitle, { color: theme.accentBlue }]}>Password</Text>
          </Text>

          <Text style={[styles.heroDesc, { color: theme.textSecondary }]}>
            Enter your registered email and we will send you a link to reset your password.
          </Text>

          <View style={styles.loginWrap}>
            <View style={styles.welcomeCenter}>
              <Text style={[styles.cardTitle, { color: theme.accentBlue }]}>
                Forgot Password?
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                Reset your credentials
              </Text>
            </View>

            <View style={styles.fieldGap}>
              <Text style={[styles.label, { color: theme.textMuted }]}>
                EMAIL ADDRESS
              </Text>
              <InputField
                icon="mail-outline"
                placeholder="you@company.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                theme={theme}
              />
            </View>

            <PrimaryButton
              title="Send Reset Link"
              onPress={handleReset}
              loading={loading}
            />

            <View style={styles.rowCenter}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={[styles.backText, { color: theme.accentBlue }]}>
                  Back to Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

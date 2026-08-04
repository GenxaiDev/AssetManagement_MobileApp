import React, { useState } from "react";
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
import AppHeader from "../components/AppHeader";
import {
  darkTheme,
  lightTheme,
} from "../theme/colors";
import { styles } from "./LoginScreen.styles";
import { login as loginApi } from "../api/auth/login";
import { useTheme } from "../context/ThemeContext";
import { signalRService } from "../services/signalRService";
import { notificationService } from "../services/notificationService";

export default function LoginScreen({ navigation }) {
  const { isDark, theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const data = await loginApi(email, password);

      // Trigger background services asynchronously so screen navigation is immediate & resilient
      Promise.allSettled([
        signalRService.start(),
        notificationService.registerDeviceWithBackend(),
      ]).catch((e) => console.warn("Background services initialization error:", e));

      navigation.replace("Dashboard", {
        permissions: data.permissions || [],
        user: data,
      });
    } catch (err) {
      Alert.alert("Login failed", err.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* <AppHeader
        title="Login"
        colors={theme}
      /> */}

      <LinearGradient
        colors={isDark ? ["#0a1426", "#0d1c33", "#0a1426"] : ["#eef1f6", "#e6ecf6", "#eef1f6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glow, styles.glowTop]} pointerEvents="none" />
      <View style={[styles.glow, styles.glowBottom]} pointerEvents="none" />

      <View style={styles.topHeaderBar}>
        <BrandHeader theme={theme} size="md" />
        <ThemeToggle
          isDark={isDark}
          theme={theme}
          onPress={toggleTheme}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
            Asset Management  <Text style={[styles.heroTitle, { color: theme.accentBlue }]}>
            Portal
          </Text>
          </Text>
          
          <Text style={[styles.heroDesc, { color: theme.textSecondary }]}>
            Track, manage and optimise your assets across all locations —
            offices, depots and RSRTC client sites.
          </Text>

          <View style={styles.loginWrap}>
            <View style={styles.welcomeCenter}>
              <Text style={[styles.cardTitle, { color: theme.accentBlue }]}>
                Welcome back
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                Sign in to your account
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

            <View style={styles.fieldGap}>
              <Text style={[styles.label, { color: theme.textMuted }]}>
                PASSWORD
              </Text>
              <InputField
                icon="lock-closed-outline"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                theme={theme}
              />
            </View>

            <PrimaryButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
            />
            <View style={styles.rowCenter}>
              <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                <Text style={[styles.forgotText, { color: theme.accentBlue, marginTop: 8 }]}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

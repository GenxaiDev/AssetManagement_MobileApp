import React, { useEffect } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts, Exo2_600SemiBold, Exo2_700Bold, Exo2_800ExtraBold } from "@expo-google-fonts/exo-2";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from "@expo-google-fonts/dm-sans";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { NotificationProvider } from "./src/context/NotificationContext";
import LoginScreen from "./src/screens/LoginScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import AssetRegistrationScreen from "./src/screens/AssetRegistrationScreen";
import IncidentRequestScreen from "./src/screens/IncidentRequestScreen";
import ServiceRequestScreen from "./src/screens/ServiceRequestScreen";
import ChangePasswordScreen from "./src/screens/ChangePasswordScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import { darkTheme } from "./src/theme/colors";
import { notificationService } from "./src/services/notificationService";

const Stack = createNativeStackNavigator();

function AppContent() {
  const { theme, loading } = useTheme();

  const [fontsLoaded] = useFonts({
    Exo2_600SemiBold,
    Exo2_700Bold,
    Exo2_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  useEffect(() => {
    notificationService.addNotificationListeners();
    return () => {
      notificationService.removeNotificationListeners();
    };
  }, []);

  if (!fontsLoaded || loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: darkTheme.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={darkTheme.accentBlue} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="AssetRegistration" component={AssetRegistrationScreen} />
        <Stack.Screen name="IncidentRequest" component={IncidentRequestScreen} />
        <Stack.Screen name="ServiceRequest" component={ServiceRequestScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import { ToastProvider } from "./src/context/ToastContext";

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NotificationProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </NotificationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { radius } from "../theme/colors";

export default function ThemeToggle({ isDark, onPress, theme }) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: theme.toggleBackground,
          borderColor: theme.cardBorder,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons
        name={isDark ? "sunny-outline" : "moon-outline"}
        size={18}
        color={theme.toggleIcon}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { radius } from "../theme/colors";

export default function ThemeToggle({ isDark, onPress, theme }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.track,
        { backgroundColor: "#1e88e5"},
      ]}
    >
      <View
        style={[
          styles.thumb,
          { transform: [{ translateX: isDark ? 22 : 2 }] },
        ]}
      >
        <Ionicons
          name={isDark ? "sunny" : "moon"}
          size={12}
          color={"#FFA500"}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 50,
    height: 28,
    borderRadius: radius.pill,
    padding: 2,
    justifyContent: "center",
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1.5,
    elevation: 2,
  },
});

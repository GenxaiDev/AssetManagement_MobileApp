import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { gradients } from "../theme/colors";

export default function GradientBar({ style }) {
  return (
    <LinearGradient
      colors={gradients.brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.bar, style]}
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 3,
    width: "100%",
  },
});

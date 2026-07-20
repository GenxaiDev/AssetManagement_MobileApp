import { Text } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

// Mimics the website's:
//   background: linear-gradient(90deg, #4CAF50, #1E88E5);
//   WebkitBackgroundClip: text;
//   WebkitTextFillColor: transparent;
export default function GradientText({
  children,
  colors = ["#4CAF50", "#1E88E5"],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  style,
}) {
  return (
    <MaskedView maskElement={<Text style={[style, { backgroundColor: "transparent" }]}>{children}</Text>}>
      <LinearGradient colors={colors} start={start} end={end}>
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

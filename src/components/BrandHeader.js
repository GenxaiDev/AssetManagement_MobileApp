import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { typography } from "../theme/colors";

export default function BrandHeader({ theme, size = "md" }) {
  const sizes = {
    sm: { logo: 40, title: 20, sub: 9, radius: 12, boxMarginRight: 10, letterSpacing: -1 },
    md: { logo: 52, title: 24, sub: 10, radius: 14, boxMarginRight: 12, letterSpacing: -1.2 },
    lg: { logo: 60, title: 28, sub: 11, radius: 16, boxMarginRight: 14, letterSpacing: -1.5 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <View style={styles.brandRow}>
      <LinearGradient
        colors={["#2E8B3A", "#1565C0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.logoBox,
          {
            width: s.logo,
            height: s.logo,
            borderRadius: s.radius,
            marginRight: s.boxMarginRight,
          },
        ]}
      >
        <Text
          style={[
            styles.logoBoxText,
            { fontSize: s.logo * 0.42 },
          ]}
        >
          GX
        </Text>
      </LinearGradient>

      <View style={styles.brandTextWrap}>
        <Text
          style={[
            styles.logoText,
            {
              fontSize: s.title,
              letterSpacing: s.letterSpacing,
              lineHeight: s.title + 2,
            },
          ]}
        >
          <Text style={{ color: theme.accentGreen }}>G</Text>
          <Text style={{ color: "#29807b" }}>E</Text>
          <Text style={{ color: theme.accentBlue }}>N</Text>
          <Text style={{ color: theme.accentBlue }}>X</Text>
          <Text style={{ color: theme.accentBlue }}>A</Text>
          <Text style={{ color: theme.accentGreen }}>I</Text>
        </Text>
        <Text
          style={[
            styles.logoSubtext,
            {
              color: theme.accentBlue,
              fontSize: s.sub,
              marginTop: 2,
            },
          ]}
        >
          MOBILE WORKSPACE
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  logoBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoBoxText: {
    color: "#FFFFFF",
    fontFamily: typography.fontHeading,
    fontWeight: "800",
  },
  brandTextWrap: {
    justifyContent: "center",
  },
  logoText: {
    fontFamily: typography.fontHeading,
    fontWeight: "900",
  },
  logoSubtext: {
    fontFamily: typography.fontBodySemiBold,
    fontWeight: "700",
    letterSpacing: 2.5,
  },
});

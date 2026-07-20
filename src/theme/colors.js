// Theme file — colors pulled directly from the real GenxAI website's CSS
// variables (:root and .light), so this mobile app matches the web app
// exactly. If the website's CSS changes, just update the hex values here.

export const gradients = {
  // --accent-gradient: linear-gradient(135deg, #1e88e5 0%, #4caf50 100%)
  brand: ["#1e88e5", "#4caf50"],
  // --gradient-success: linear-gradient(135deg, #2e7d32 0%, #4caf50 50%, #66bb6a 100%)
  button: ["#2e7d32", "#4caf50", "#66bb6a"],
  // --gradient-primary: linear-gradient(135deg, #1565c0 0%, #1e88e5 50%, #42a5f5 100%)
  logoBox: ["#1565c0", "#1e88e5", "#42a5f5"],
};

export const darkTheme = {
  mode: "dark",
  background: "#0a1426",        // --bg
  cardBackground: "#111e37",    // --card
  cardBackground2: "#0f1b30",   // --card-2
  featureCardBackground: "#0f1b30",
  inputBackground: "rgba(255,255,255,0.05)",  // --input-bg
  cardBorder: "rgba(255,255,255,0.08)",       // --border
  inputBorder: "rgba(255,255,255,0.12)",      // --border-in
  textPrimary: "#e9eff6",       // --text-pri
  textSecondary: "#7b9bb6",     // --text-sec
  textMuted: "#3e5b73",         // --text-mut
  accentBlue: "#1e88e5",        // --blue-l
  accentBlueDark: "#1565c0",    // --blue
  accentGreen: "#4caf50",       // --green-l
  danger: "#f44336",
  warning: "#ff9800",
  placeholder: "#3e5b73",
  white: "#FFFFFF",
  toggleBackground: "rgba(255,255,255,0.05)",
  toggleIcon: "#e9eff6",
  shadowColor: "#000000",
};

export const lightTheme = {
  mode: "light",
  background: "#eef1f6",        // .light --bg
  cardBackground: "#f2f5f9",    // .light --card
  cardBackground2: "#eef1f6",   // .light --card-2
  featureCardBackground: "#f2f5f9",
  inputBackground: "#e8ecf2",   // .light --input-bg
  cardBorder: "rgba(0,0,0,0.09)",     // .light --border
  inputBorder: "rgba(0,0,0,0.13)",    // .light --border-in
  textPrimary: "#111827",       // .light --text-pri
  textSecondary: "#374151",     // .light --text-sec
  textMuted: "#6b7280",         // .light --text-mut
  accentBlue: "#1565c0",        // .light uses --blue for accents
  accentBlueDark: "#1565c0",
  accentGreen: "#4caf50",
  danger: "#f44336",
  warning: "#ff9800",
  placeholder: "#9ca3af",
  white: "#FFFFFF",
  toggleBackground: "#e8ecf2",
  toggleIcon: "#374151",
  shadowColor: "#0F172A",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 10,     // matches .field border-radius: 10px
  card: 16,   // matches --radius-card: 16px
  lg: 20,     // matches --radius-lg: 20px
  pill: 999,
};

export const typography = {
  h1: 30,
  h2: 22,     // matches .page-title ~1.35rem-ish scaled for mobile hero
  body: 15,
  small: 13,
  tiny: 11,
  fontHeading: "Exo2_700Bold",
  fontHeadingSemiBold: "Exo2_600SemiBold",
  fontBody: "DMSans_400Regular",
  fontBodyMedium: "DMSans_500Medium",
  fontBodySemiBold: "DMSans_600SemiBold",
};

const { withAppBuildGradle } = require("@expo/config-plugins");

// Injects Gradle's `splits { abi { ... } }` block into the generated
// android/app/build.gradle, so `eas build` produces separate, smaller
// per-architecture APKs instead of one universal APK containing all 4.
module.exports = function withAbiSplit(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes("splits {")) {
      return config; // already injected, avoid duplicating
    }

    const splitBlock = `
android {
    splits {
        abi {
            enable true
            reset()
            include  "arm64-v8a"
            universalApk false
        }
    }
`;

    config.modResults.contents = config.modResults.contents.replace(
      /android\s*\{/,
      splitBlock
    );

    return config;
  });
};
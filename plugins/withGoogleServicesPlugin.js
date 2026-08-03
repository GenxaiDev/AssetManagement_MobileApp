const { createRunOncePlugin, withProjectBuildGradle, withAppBuildGradle } = require("@expo/config-plugins");

const withGoogleServicesPlugin = (config) => {
  // 1. Add google-services classpath to root build.gradle
  config = withProjectBuildGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes("com.google.gms:google-services")) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n        classpath('com.google.gms:google-services:4.4.1')`
      );
    }
    return cfg;
  });

  // 2. Apply google-services plugin at the end of android/app/build.gradle
  config = withAppBuildGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes('apply plugin: "com.google.gms.google-services"')) {
      cfg.modResults.contents += `\napply plugin: "com.google.gms.google-services"\n`;
    }
    return cfg;
  });

  return config;
};

module.exports = createRunOncePlugin(
  withGoogleServicesPlugin,
  "withGoogleServicesPlugin",
  "1.0.0"
);

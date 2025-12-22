/**
 * Expo Configuration File
 * 
 * TESTFLIGHT/PRODUCTION BUILD:
 * Environment variables are baked in at build time.
 * Set them when building:
 *   eas build -p ios --profile production
 * 
 * Required environment variables:
 *   EXPO_PUBLIC_API_DOMAIN - Your production API domain (e.g., your-app.replit.app:5000)
 */

export default {
  expo: {
    name: "FitForge",
    slug: "fitforge",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "fitforge",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    extra: {
      apiDomain: process.env.EXPO_PUBLIC_API_DOMAIN || process.env.EXPO_PUBLIC_DOMAIN || null,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || null,
      },
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.fitforge.app",
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSExceptionDomains: {
            "rapidapi.com": {
              NSIncludesSubdomains: true,
              NSExceptionAllowsInsecureHTTPLoads: false,
            },
            "exercisedb.p.rapidapi.com": {
              NSIncludesSubdomains: true,
              NSExceptionAllowsInsecureHTTPLoads: false,
            },
            "ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com": {
              NSIncludesSubdomains: true,
              NSExceptionAllowsInsecureHTTPLoads: false,
            },
            "wger.de": {
              NSIncludesSubdomains: true,
              NSExceptionAllowsInsecureHTTPLoads: false,
            },
            "openai.com": {
              NSIncludesSubdomains: true,
              NSExceptionAllowsInsecureHTTPLoads: false,
            },
          },
        },
        NSCameraUsageDescription: "FitForge needs camera access for exercise form tracking and analysis.",
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#0A0E1A",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.fitforge.app",
    },
    web: {
      output: "single",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#0A0E1A",
          dark: {
            backgroundColor: "#0A0E1A",
          },
        },
      ],
      "expo-web-browser",
      [
        "expo-camera",
        {
          cameraPermission: "FitForge needs camera access for exercise form tracking.",
        },
      ],
    ],
    experiments: {
      reactCompiler: true,
    },
  },
};

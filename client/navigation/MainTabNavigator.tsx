import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import DiscoverScreen from "@/screens/DiscoverScreen";
import GenerateScreen from "@/screens/GenerateScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

export type MainTabParamList = {
  Discover: undefined;
  Generate: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Discover"
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.accent,
        tabBarInactiveTintColor: Colors.dark.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: Colors.dark.backgroundDefault,
          }),
          borderTopWidth: 0,
          elevation: 0,
          height: 85,
          paddingTop: Spacing.sm,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginTop: Spacing.xs,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => (
            <Feather name="search" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Generate"
        component={GenerateScreen}
        options={{
          title: "Generate",
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={[
                styles.generateIconContainer,
                focused && styles.generateIconFocused,
              ]}
            >
              <Feather name="zap" size={size} color={focused ? "#FFF" : color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  generateIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  generateIconFocused: {
    backgroundColor: Colors.dark.accent,
  },
});

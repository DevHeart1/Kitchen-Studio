import React from "react";
import { Tabs } from "expo-router";
import { View, Text, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { Home, Compass, ChefHat, User, ScanLine } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const icons: Record<string, typeof Home> = {
    index: Home,
    discover: Compass,
    kitchen: ChefHat,
    profile: User,
  };

  const labels: Record<string, string> = {
    index: "Home",
    discover: "Discover",
    kitchen: "Kitchen",
    profile: "Profile",
  };

  const routes = state.routes;
  const middleIndex = Math.floor(routes.length / 2);

  const renderTabItem = (route: any, index: number, isFocused: boolean) => {
    const Icon = icons[route.name] || Home;
    const label = labels[route.name] || route.name;

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        style={styles.tabItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Icon
          size={22}
          color={isFocused ? Colors.primary : Colors.textMuted}
          fill={isFocused && route.name === "index" ? Colors.primary : "transparent"}
        />
        <Text style={[styles.tabLabelText, isFocused && styles.tabLabelTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.tabBarContainer, { bottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.tabBar}>
        {routes.slice(0, middleIndex).map((route: any, index: number) => {
          const isFocused = state.index === index;
          return renderTabItem(route, index, isFocused);
        })}

        <View style={styles.centerButtonWrapper}>
          <TouchableOpacity style={styles.centerButton} activeOpacity={0.8}>
            <ScanLine size={28} color={Colors.backgroundDark} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {routes.slice(middleIndex).map((route: any, index: number) => {
          const actualIndex = index + middleIndex;
          const isFocused = state.index === actualIndex;
          return renderTabItem(route, actualIndex, isFocused);
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="kitchen" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: Colors.cardGlass,
    borderRadius: 40,
    height: 72,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
      web: {
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
      } as any,
    }),
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    flex: 1,
  },
  tabLabelText: {
    fontSize: 10,
    fontWeight: "500" as const,
    color: Colors.textMuted,
    marginTop: 4,
  },
  tabLabelTextActive: {
    color: Colors.primary,
    fontWeight: "700" as const,
  },
  centerButtonWrapper: {
    marginTop: -40,
  },
  centerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor: Colors.backgroundDark,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: `0 4px 20px ${Colors.primary}50`,
      } as any,
    }),
  },
});

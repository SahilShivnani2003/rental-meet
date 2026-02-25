import React, { useRef, useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  LayoutChangeEvent,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import ClientDashboardScreen from "../screens/client/dashboard";
import BookingsScreen from "../screens/tabs/bookings";
import FavoritesScreen from "../screens/tabs/favorites";
import HomeScreen from "../screens/tabs/home";
import ProfileScreen from "../screens/tabs/profile";
import { Colors, TAB_BAR_HEIGHT, Typography, TAB_CENTER_SIZE } from "../theme/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export type ClientTabParamList = {
  dashboard: undefined;
  home:      undefined;   // browse venues
  bookings:  undefined;   // center hero
  favorites: undefined;
  profile:   undefined;
};

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { name: "dashboard", label: "Home",      icon: "grid",       iconOff: "grid-outline"           },
  { name: "home",      label: "Browse",    icon: "search",     iconOff: "search-outline"         },
  { name: "bookings",  label: "Bookings",  icon: "calendar",   iconOff: "calendar-outline", center: true },
  { name: "favorites", label: "Saved",     icon: "heart",      iconOff: "heart-outline"          },
  { name: "profile",   label: "Profile",   icon: "person",     iconOff: "person-outline"         },
];

// ─── Center hero tab ──────────────────────────────────────────────────────────
function CenterTab({ isFocused, onPress, tabWidth }: { isFocused: boolean; onPress: () => void; tabWidth: number }) {
  const scale     = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOp    = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale, { toValue: 1.3, duration: 1100, useNativeDriver: true }),
          Animated.timing(ringOp,    { toValue: 0,   duration: 1100, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale, { toValue: 1,   duration: 0, useNativeDriver: true }),
          Animated.timing(ringOp,    { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    Animated.spring(scale, { toValue: isFocused ? 1.1 : 1, useNativeDriver: true, speed: 24, bounciness: 12 }).start();
  }, [isFocused]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: isFocused ? 1.1 : 1, useNativeDriver: true, speed: 20, bounciness: 14 }),
    ]).start();
    onPress();
  };

  return (
    <View style={[styles.tabItem, { width: tabWidth }]}>
      <View style={styles.centerOuter}>
        <Animated.View pointerEvents="none" style={[styles.pingRing, { transform: [{ scale: ringScale }], opacity: ringOp }]} />
        <TouchableOpacity onPress={handlePress} activeOpacity={1}>
          <Animated.View style={[styles.centerButton, isFocused && styles.centerButtonActive, { transform: [{ scale }] }]}>
            <Ionicons name={isFocused ? "calendar" : "calendar-outline"} size={26} color={Colors.white} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Regular tab ──────────────────────────────────────────────────────────────
function RegularTab({ tab, isFocused, onPress, tabWidth }: { tab: typeof TABS[0]; isFocused: boolean; onPress: () => void; tabWidth: number }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const iconY   = useRef(new Animated.Value(0)).current;
  const labelOp = useRef(new Animated.Value(0)).current;
  const labelY  = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: isFocused ? 1.18 : 1, useNativeDriver: true, speed: 28, bounciness: 10 }),
      Animated.spring(iconY,   { toValue: isFocused ? -4 : 0,   useNativeDriver: true, speed: 28 }),
      Animated.timing(labelOp, { toValue: isFocused ? 1 : 0,    duration: 200, useNativeDriver: true }),
      Animated.timing(labelY,  { toValue: isFocused ? 0 : 6,    duration: 200, useNativeDriver: true }),
    ]).start();
  }, [isFocused]);

  return (
    <View style={[styles.tabItem, { width: tabWidth }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.tabTouchable}>
        <Animated.View style={{ transform: [{ scale }, { translateY: iconY }], alignItems: "center" }}>
          <Ionicons name={isFocused ? tab.icon : tab.iconOff} size={22} color={isFocused ? Colors.primary : Colors.charcoalWarm} />
        </Animated.View>
        <Animated.Text style={[styles.tabLabel, { opacity: labelOp, transform: [{ translateY: labelY }] }]}>
          {tab.label}
        </Animated.Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Custom tab bar ───────────────────────────────────────────────────────────
function ClientTabBar({ state, navigation }: any) {
  const [barWidth, setBarWidth] = useState(SCREEN_WIDTH - 32);
  const tabWidth  = barWidth / TABS.length;
  const orbX      = useRef(new Animated.Value(0)).current;
  const orbScaleX = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const targetX = state.index * tabWidth + tabWidth / 2 - 26;
    Animated.parallel([
      Animated.spring(orbX, { toValue: targetX, useNativeDriver: true, speed: 16, bounciness: 7 }),
      Animated.sequence([
        Animated.timing(orbScaleX, { toValue: 1.6, duration: 100, useNativeDriver: true }),
        Animated.spring(orbScaleX, { toValue: 1,   useNativeDriver: true, speed: 22 }),
      ]),
    ]).start();
  }, [state.index, tabWidth]);

  return (
    <View style={styles.outerWrapper}>
      <View style={styles.tabBar} onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)}>
        {state.index !== 2 && (
          <Animated.View pointerEvents="none"
            style={[styles.glowOrb, { transform: [{ translateX: orbX }, { scaleX: orbScaleX }] }]}
          />
        )}
        <View style={styles.innerLine} pointerEvents="none" />
        {state.routes.map((route: any, index: number) => {
          const tab       = TABS.find((t) => t.name === route.name)!;
          const isFocused = state.index === index;
          const onPress   = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return tab.center
            ? <CenterTab  key={route.key} isFocused={isFocused} onPress={onPress} tabWidth={tabWidth} />
            : <RegularTab key={route.key} tab={tab} isFocused={isFocused} onPress={onPress} tabWidth={tabWidth} />;
        })}
      </View>
    </View>
  );
}

// ─── Client navigator ─────────────────────────────────────────────────────────
const Tabs = createBottomTabNavigator<ClientTabParamList>();

export function ClientTabNavigation() {
  return (
    <Tabs.Navigator tabBar={(props) => <ClientTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="dashboard" component={ClientDashboardScreen} />
      <Tabs.Screen name="home"      component={HomeScreen}            />
      <Tabs.Screen name="bookings"  component={BookingsScreen}        />
      <Tabs.Screen name="favorites" component={FavoritesScreen}       />
      <Tabs.Screen name="profile"   component={ProfileScreen}         />
    </Tabs.Navigator>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  outerWrapper:       { position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center", overflow: "visible" },
  tabBar:             { flexDirection: "row", alignItems: "center", backgroundColor: Colors.tabBar, width: SCREEN_WIDTH - 32, height: TAB_BAR_HEIGHT, borderRadius: 38, marginBottom: Platform.OS === "ios" ? 30 : 18, overflow: "visible", borderWidth: 1, borderColor: Colors.tabBarBorder, shadowColor: Colors.charcoal, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.6, shadowRadius: 40, elevation: 28 },
  glowOrb:            { position: "absolute", top: TAB_BAR_HEIGHT / 2 - 26, left: 0, width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primaryDim, borderWidth: 1, borderColor: Colors.primaryGlow, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.75, shadowRadius: 18, elevation: 16, zIndex: 0 },
  innerLine:          { position: "absolute", top: 0, left: 32, right: 32, height: 1, backgroundColor: "rgba(245,166,35,0.08)", borderRadius: 1 },
  tabItem:            { height: "100%", alignItems: "center", justifyContent: "center", zIndex: 1, overflow: "visible" },
  tabTouchable:       { alignItems: "center", justifyContent: "center", gap: 3, paddingTop: 4, minWidth: 48, minHeight: 48 },
  tabLabel:           { fontSize: Typography.xs, fontWeight: Typography.extraBold, color: Colors.primary, letterSpacing: Typography.wide, textTransform: "uppercase" },
  centerOuter:        { alignItems: "center", justifyContent: "center", width: TAB_CENTER_SIZE + 20, height: TAB_CENTER_SIZE + 20, marginTop: -(TAB_CENTER_SIZE / 2 + 8), overflow: "visible" },
  pingRing:           { position: "absolute", width: TAB_CENTER_SIZE + 16, height: TAB_CENTER_SIZE + 16, borderRadius: (TAB_CENTER_SIZE + 16) / 2, borderWidth: 1.5, borderColor: Colors.primaryGlow, backgroundColor: "rgba(245,166,35,0.05)" },
  centerButton:       { width: TAB_CENTER_SIZE, height: TAB_CENTER_SIZE, borderRadius: TAB_CENTER_SIZE / 2, backgroundColor: "#2E2A1E", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(245,166,35,0.18)", shadowColor: Colors.black, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.55, shadowRadius: 18, elevation: 18 },
  centerButtonActive: { backgroundColor: Colors.primary, borderColor: "rgba(255,255,255,0.28)", shadowColor: Colors.primary, shadowOpacity: 0.65, shadowRadius: 22 },
});
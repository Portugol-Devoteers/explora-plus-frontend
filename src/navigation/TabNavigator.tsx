import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ExploreScreen } from "../screens/ExploreScreen";
import { PlacesScreen } from "../screens/PlacesScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { colors } from "../theme";
import type { RootTabParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_ICONS: Record<keyof RootTabParamList, IoniconName> = {
  Explore: "compass-outline",
  Places: "business-outline",
  Profile: "person-outline",
};

const TAB_LABELS: Record<keyof RootTabParamList, string> = {
  Explore: "Explorar",
  Places: "Lugares",
  Profile: "Perfil",
};

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.divider,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={TAB_ICONS[route.name]}
            size={size ?? 22}
            color={color}
          />
        ),
        tabBarLabel: TAB_LABELS[route.name],
      })}
    >
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Places" component={PlacesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

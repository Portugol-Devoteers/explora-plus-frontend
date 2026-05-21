import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PlaceDetailScreen } from "../screens/PlaceDetailScreen";
import { RouteScreen } from "../screens/RouteScreen";
import { TabNavigator } from "./TabNavigator";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="PlaceDetail"
        component={PlaceDetailScreen}
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="Route"
        component={RouteScreen}
        options={{ animation: "slide_from_right" }}
      />
    </Stack.Navigator>
  );
}

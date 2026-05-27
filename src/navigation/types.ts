import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type RootTabParamList = {
  Explore: undefined;
  MyRoutes: undefined;
  Tickets: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  PlaceDetail: { placeId: string };
  Route: { placeId: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type PlaceDetailProps = NativeStackScreenProps<
  RootStackParamList,
  "PlaceDetail"
>;

export type RouteScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Route"
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getAuth } from "./src/api/client";
import MealDetailScreen from "./src/screens/MealDetailScreen";
import MealsScreen from "./src/screens/MealsScreen";
import DeficienciesScreen from "./src/screens/onboarding/DeficienciesScreen";
import DoneScreen from "./src/screens/onboarding/DoneScreen";
import GoalsScreen from "./src/screens/onboarding/GoalsScreen";
import NameScreen from "./src/screens/onboarding/NameScreen";
import PasswordScreen from "./src/screens/onboarding/PasswordScreen";
import PantriesScreen from "./src/screens/PantriesScreen";
import TrackingScreen from "./src/screens/TrackingScreen";
import tw from "./src/tw";
import type {
  OnboardingStackParams,
  RootStackParams,
  TabParams,
} from "./src/types/navigation";

const OnboardingStack = createNativeStackNavigator<OnboardingStackParams>();
const Tab = createBottomTabNavigator<TabParams>();
const RootStack = createNativeStackNavigator<RootStackParams>();
const queryClient = new QueryClient();

function OnboardingNavigator({
  onComplete,
}: {
  onComplete: (userId: string) => void;
}) {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="Name" component={NameScreen} />
      <OnboardingStack.Screen name="Password" component={PasswordScreen} />
      <OnboardingStack.Screen name="Goals" component={GoalsScreen} />
      <OnboardingStack.Screen
        name="Deficiencies"
        component={DeficienciesScreen}
      />
      <OnboardingStack.Screen name="Done">
        {(props) => <DoneScreen {...props} onComplete={onComplete} />}
      </OnboardingStack.Screen>
    </OnboardingStack.Navigator>
  );
}

function TabNavigator({ userId }: { userId: string }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFF8E1",
          borderTopColor: "#FFF0B3",
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#3E2723",
        tabBarInactiveTintColor: "#9E9E9E",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}>
      <Tab.Screen
        name="Pantries"
        component={PantriesScreen}
        initialParams={{ userId }}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>📦</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Meals"
        component={MealsScreen}
        initialParams={{ userId }}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>🍽️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Tracking"
        component={TrackingScreen}
        initialParams={{ userId }}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>📊</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function MainNavigator({ userId }: { userId: string }) {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Tabs">
        {() => <TabNavigator userId={userId} />}
      </RootStack.Screen>
      <RootStack.Screen
        name="MealDetail"
        component={MealDetailScreen}
        options={{ presentation: "modal" }}
      />
    </RootStack.Navigator>
  );
}

export default function App() {
  const [state, setState] = useState<{
    loading: boolean;
    userId: string | null;
  }>({ loading: true, userId: null });

  useEffect(() => {
    getAuth()
      .then((auth) => {
        setState({ loading: false, userId: auth?.userId ?? null });
      })
      .catch(() => {
        setState({ loading: false, userId: null });
      });
  }, []);

  if (state.loading) {
    return (
      <View style={tw`flex-1 bg-cream items-center justify-center`}>
        <ActivityIndicator size="large" color="#F9A825" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          {state.userId ? (
            <MainNavigator userId={state.userId} />
          ) : (
            <OnboardingNavigator
              onComplete={(userId) => setState({ loading: false, userId })}
            />
          )}
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

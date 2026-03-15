import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { api, clearAuth, getAuth } from "./src/api/client";
import { useAuth } from "./src/api/hooks";
import AccountScreen from "./src/screens/AccountScreen";
import MealDetailScreen from "./src/screens/MealDetailScreen";
import MealsScreen from "./src/screens/MealsScreen";
import CuisinesScreen from "./src/screens/onboarding/CuisinesScreen";
import DeficienciesScreen from "./src/screens/onboarding/DeficienciesScreen";
import DietTypeScreen from "./src/screens/onboarding/DietTypeScreen";
import DoneScreen from "./src/screens/onboarding/DoneScreen";
import GoalsScreen from "./src/screens/onboarding/GoalsScreen";
import LoginScreen from "./src/screens/onboarding/LoginScreen";
import NameScreen from "./src/screens/onboarding/NameScreen";
import PasswordScreen from "./src/screens/onboarding/PasswordScreen";
import QuickSetupScreen from "./src/screens/onboarding/QuickSetupScreen";
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
      <OnboardingStack.Screen name="Login" component={LoginScreen} />
      <OnboardingStack.Screen name="Password" component={PasswordScreen} />
      <OnboardingStack.Screen name="QuickSetup" component={QuickSetupScreen} />
      <OnboardingStack.Screen name="DietType" component={DietTypeScreen} />
      <OnboardingStack.Screen name="Cuisines" component={CuisinesScreen} />
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
      <Tab.Screen
        name="Me"
        component={AccountScreen}
        initialParams={{ userId }}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>👤</Text>
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
        options={{ gestureEnabled: true, animation: "slide_from_right" }}
      />
    </RootStack.Navigator>
  );
}

function AppContent() {
  const [state, setState] = useState<{
    loading: boolean;
    userId: string | null;
  }>({ loading: true, userId: null });

  const auth = useAuth();

  // Initial load from SecureStore, then verify user still exists in DB
  useEffect(() => {
    getAuth()
      .then(async (a) => {
        if (!a?.userId) {
          setState({ loading: false, userId: null });
          return;
        }
        try {
          await api(`/diets/${a.userId}`);
          setState({ loading: false, userId: a.userId });
        } catch {
          await clearAuth();
          setState({ loading: false, userId: null });
        }
      })
      .catch(() => {
        setState({ loading: false, userId: null });
      });
  }, []);

  // Detect logout: auth query returns null but we still have a userId in state
  useEffect(() => {
    if (
      !auth.isLoading &&
      auth.data === null &&
      state.userId !== null &&
      !state.loading
    ) {
      setState({ loading: false, userId: null });
    }
  }, [auth.data, auth.isLoading, state.userId, state.loading]);

  if (state.loading) {
    return (
      <View style={tw`flex-1 bg-cream items-center justify-center`}>
        <ActivityIndicator size="large" color="#F9A825" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {state.userId ? (
        <MainNavigator userId={state.userId} />
      ) : (
        <OnboardingNavigator
          onComplete={(userId) => setState({ loading: false, userId })}
        />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <View
          style={
            Platform.OS === "web"
              ? { flex: 1, maxWidth: 600, width: "100%", alignSelf: "center" }
              : { flex: 1 }
          }>
          <AppContent />
        </View>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

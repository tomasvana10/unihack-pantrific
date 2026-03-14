import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useLogMealNutrition,
  useMealSuggestions,
  useTrackedNutrients,
} from "../api/hooks";
import { CUISINE_COLORS, colors, NUTRIENT_UNITS } from "../theme";
import tw from "../tw";
import type { TabParams } from "../types/navigation";

const LOADING_MESSAGES = [
  "Scanning your pantry...",
  "Checking nutrition goals...",
  "Finding perfect recipes...",
  "Balancing your macros...",
  "Cooking up ideas...",
  "Plating the suggestions...",
];

const INITIAL_SHOW = 5;

function LoadingAnimation() {
  const [msgIdx, setMsgIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    const createBounce = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: -8,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(600 - delay),
        ]),
      );
    createBounce(dot1, 0).start();
    createBounce(dot2, 200).start();
    createBounce(dot3, 400).start();

    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [pulseAnim, fadeAnim, dot1, dot2, dot3]);

  return (
    <View style={tw`flex-1 items-center justify-center`}>
      <Animated.Text
        style={[tw`text-6xl mb-6`, { transform: [{ scale: pulseAnim }] }]}>
        🧑‍🍳
      </Animated.Text>
      <Animated.Text
        style={[tw`text-brown text-base font-medium`, { opacity: fadeAnim }]}>
        {LOADING_MESSAGES[msgIdx]}
      </Animated.Text>
      <View style={tw`flex-row mt-4 gap-1.5`}>
        {[dot1, dot2, dot3].map((anim, i) => (
          <Animated.View
            key={i}
            style={[
              {
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.yellowDark,
              },
              { transform: [{ translateY: anim }] },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

type Props = BottomTabScreenProps<TabParams, "Meals">;

export default function MealsScreen({ route }: Props) {
  const { userId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { data, isLoading, isFetching, refetch } = useMealSuggestions(userId);
  const { data: nutrientsData } = useTrackedNutrients(userId);
  const logMeal = useLogMealNutrition(userId);
  const [showAll, setShowAll] = useState(false);

  const meals = data?.meals ?? [];
  const visibleMeals = showAll ? meals : meals.slice(0, INITIAL_SHOW);
  const hasMore = meals.length > INITIAL_SHOW && !showAll;

  const handleLogMeal = (
    mealName: string,
    nutrition: Record<string, number>,
  ) => {
    const tracked = nutrientsData?.nutrients ?? [];
    const matches = tracked
      .filter((n) => nutrition[n.name] !== undefined)
      .map((n) => ({ trackedNutrientId: n.id, amount: nutrition[n.name] }));

    if (matches.length === 0) {
      Alert.alert(
        "No Match",
        "This meal's nutrients don't match your tracked nutrients.",
      );
      return;
    }

    const details = tracked
      .filter((n) => nutrition[n.name] !== undefined)
      .map((n) => `  ${n.name}: ${nutrition[n.name]} ${n.unit}`)
      .join("\n");

    Alert.alert(
      "Log This Meal",
      `This will add the following to your daily tracking:\n\n${details}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Meal",
          onPress: () =>
            logMeal.mutate(matches, {
              onSuccess: () =>
                Alert.alert(
                  "Logged!",
                  `${mealName} has been added to your daily tracking.`,
                ),
            }),
        },
      ],
    );
  };

  const getCuisineStyle = (cuisine: string | null) => {
    if (!cuisine) return null;
    return CUISINE_COLORS[cuisine] ?? { bg: colors.yellow, text: colors.brown };
  };

  return (
    <View style={tw`flex-1 bg-cream`}>
      <View style={tw`px-6 pt-14 pb-2`}>
        <View style={tw`flex-row justify-between items-center`}>
          <Text style={tw`text-3xl font-bold text-brown`}>Meal Ideas</Text>
          {data?.meals && !isFetching && (
            <TouchableOpacity
              style={tw`bg-yellow rounded-full w-10 h-10 items-center justify-center`}
              onPress={() => {
                setShowAll(false);
                refetch();
              }}>
              <Text style={{ fontSize: 18 }}>↻</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={tw`text-base text-brown-light mt-2 mb-2`}>
          AI-powered suggestions based on your pantry & goals
        </Text>
      </View>

      {!data?.meals && !isLoading && !isFetching && (
        <View style={tw`flex-1 items-center justify-center px-4`}>
          <Text style={tw`text-6xl mb-4`}>🧑‍🍳</Text>
          <Text style={tw`text-brown font-semibold text-lg mb-2 text-center`}>
            No meal suggestions yet
          </Text>
          <Text style={tw`text-brown-light text-base text-center mb-8`}>
            Get personalised meal suggestions based on what's in your pantry and
            your nutrition goals.
          </Text>
          <TouchableOpacity
            style={tw`bg-yellow rounded-full px-10 py-4`}
            onPress={() => refetch()}>
            <Text style={tw`text-brown font-semibold text-lg`}>
              Generate Meals
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {(isLoading || isFetching) && <LoadingAnimation />}

      {data?.meals && !isFetching && (
        <ScrollView
          style={tw`flex-1 px-6`}
          contentContainerStyle={{ paddingBottom: 100 }}>
          {visibleMeals.map((meal, idx) => {
            const cuisineStyle = getCuisineStyle(meal.cuisine);
            return (
              <TouchableOpacity
                key={idx}
                style={tw`bg-white rounded-2xl mb-4 overflow-hidden border border-cream-dark`}
                onPress={() =>
                  navigation.navigate("MealDetail", { meal, userId })
                }>
                <View>
                  {meal.imageUrl ? (
                    <Image
                      source={{ uri: meal.imageUrl }}
                      style={tw`w-full h-48`}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={tw`w-full h-32 bg-cream-dark items-center justify-center`}>
                      <Text style={tw`text-5xl`}>🍲</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[
                      tw`absolute top-3 right-3 w-9 h-9 rounded-full items-center justify-center`,
                      {
                        backgroundColor: "rgba(0,0,0,0.45)",
                      },
                    ]}
                    onPress={() =>
                      navigation.navigate("MealDetail", { meal, userId })
                    }>
                    <Ionicons name="chevron-forward" size={18} color="white" />
                  </TouchableOpacity>
                </View>
                <View style={tw`p-4`}>
                  <View style={tw`flex-row items-center gap-2`}>
                    <Text style={tw`text-xl font-bold text-brown flex-1`}>
                      {meal.name}
                    </Text>
                    {meal.cuisine && cuisineStyle && (
                      <View
                        style={[
                          tw`rounded-full px-3 py-1`,
                          { backgroundColor: cuisineStyle.bg },
                        ]}>
                        <Text
                          style={[
                            tw`text-xs font-semibold`,
                            { color: cuisineStyle.text },
                          ]}>
                          {meal.cuisine}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={tw`text-brown-light mt-1`} numberOfLines={2}>
                    {meal.description}
                  </Text>
                  <View style={tw`flex-row flex-wrap gap-2 mt-3`}>
                    {Object.entries(meal.estimatedNutrition)
                      .slice(0, 4)
                      .map(([key, val]) => (
                        <View
                          key={key}
                          style={tw`bg-cream rounded-full px-3 py-1`}>
                          <Text style={tw`text-brown-light text-xs`}>
                            {val}
                            {NUTRIENT_UNITS[key] ?? ""} {key}
                          </Text>
                        </View>
                      ))}
                  </View>
                  <View
                    style={tw`border border-cream-dark rounded-xl px-3 py-2 mt-3`}>
                    <Text style={tw`text-brown-light text-sm`}>
                      ✨ {meal.benefits}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={tw`bg-green rounded-xl py-3 items-center mt-3`}
                    onPress={() =>
                      handleLogMeal(meal.name, meal.estimatedNutrition)
                    }>
                    <Text style={tw`text-white text-sm font-semibold`}>
                      Log This Meal
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}

          {hasMore && (
            <TouchableOpacity
              style={tw`bg-white rounded-2xl py-4 mb-4 items-center border border-cream-dark`}
              onPress={() => setShowAll(true)}>
              <Text style={tw`text-brown font-semibold`}>
                Show {meals.length - INITIAL_SHOW} More Meals
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

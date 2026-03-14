import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useRef } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLogMealNutrition, useTrackedNutrients } from "../api/hooks";
import { CUISINE_COLORS, colors, NUTRIENT_UNITS } from "../theme";
import tw from "../tw";
import type { RootStackParams } from "../types/navigation";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_HEIGHT = 300;

type Props = NativeStackScreenProps<RootStackParams, "MealDetail">;

export default function MealDetailScreen({ navigation, route }: Props) {
  const { meal, userId } = route.params;
  const scrollY = useRef(new Animated.Value(0)).current;
  const { data: nutrientsData } = useTrackedNutrients(userId);
  const logMeal = useLogMealNutrition(userId);

  const cuisineStyle = meal.cuisine
    ? (CUISINE_COLORS[meal.cuisine] ?? {
        bg: colors.yellow,
        text: colors.brown,
      })
    : null;

  const handleLogMeal = () => {
    const tracked = nutrientsData?.nutrients ?? [];
    const matches = tracked
      .filter((n) => meal.estimatedNutrition[n.name] !== undefined)
      .map((n) => ({
        trackedNutrientId: n.id,
        name: n.name,
        amount: meal.estimatedNutrition[n.name],
        unit: n.unit,
      }));

    if (matches.length === 0) {
      Alert.alert(
        "No Match",
        "This meal's nutrients don't match your tracked nutrients.",
      );
      return;
    }

    Alert.alert(
      "Log This Meal",
      `This will add the following to your daily tracking:\n\n${matches
        .map((m) => `  ${m.name}: ${m.amount} ${m.unit}`)
        .join("\n")}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Meal",
          onPress: () =>
            logMeal.mutate(
              matches.map(({ trackedNutrientId, amount }) => ({
                trackedNutrientId,
                amount,
              })),
              {
                onSuccess: () =>
                  Alert.alert(
                    "Logged!",
                    `${meal.name} has been added to your daily tracking.`,
                  ),
              },
            ),
        },
      ],
    );
  };

  const imageTranslateY = scrollY.interpolate({
    inputRange: [-IMAGE_HEIGHT, 0, IMAGE_HEIGHT],
    outputRange: [-IMAGE_HEIGHT / 2, 0, IMAGE_HEIGHT * 0.35],
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-IMAGE_HEIGHT, 0],
    outputRange: [2, 1],
    extrapolateRight: "clamp",
  });

  return (
    <View style={tw`flex-1 bg-cream`}>
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}>
        {/* Parallax Image */}
        <View>
          <Animated.View
            style={{
              height: IMAGE_HEIGHT,
              overflow: "hidden",
              transform: [
                { translateY: imageTranslateY },
                { scale: imageScale },
              ],
            }}>
            {meal.imageUrl ? (
              <Image
                source={{ uri: meal.imageUrl }}
                style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT + 50 }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  tw`items-center justify-center bg-cream-dark`,
                  { width: SCREEN_WIDTH, height: IMAGE_HEIGHT },
                ]}>
                <Text style={tw`text-8xl`}>🍲</Text>
              </View>
            )}
          </Animated.View>
          <TouchableOpacity
            style={[
              tw`absolute top-14 left-4 w-9 h-9 rounded-full items-center justify-center`,
              { backgroundColor: "rgba(0,0,0,0.45)" },
            ]}
            onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={18} color="white" />
          </TouchableOpacity>
        </View>

        {/* Content card overlapping image */}
        <View
          style={{
            marginTop: -30,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            backgroundColor: colors.cream,
            paddingTop: 24,
            paddingHorizontal: 24,
            paddingBottom: 40,
            minHeight: 600,
          }}>
          <Text style={tw`text-3xl font-bold text-brown mb-2`}>
            {meal.name}
          </Text>
          {meal.cuisine && cuisineStyle && (
            <View
              style={[
                tw`self-start rounded-full px-3 py-1 mb-2`,
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
          <Text style={tw`text-base text-brown-light mb-4`}>
            {meal.description}
          </Text>

          {/* Benefits with sparkle */}
          <View style={tw`border border-cream-dark rounded-xl px-4 py-3 mb-6`}>
            <Text style={tw`text-brown-light text-sm`}>✨ {meal.benefits}</Text>
          </View>

          {/* Nutrition */}
          <View
            style={tw`bg-white rounded-2xl p-4 mb-6 border border-cream-dark`}>
            <Text style={tw`text-lg font-bold text-brown mb-3`}>Nutrition</Text>
            <View style={tw`flex-row flex-wrap gap-3`}>
              {Object.entries(meal.estimatedNutrition).map(([key, val]) => (
                <View
                  key={key}
                  style={tw`bg-cream rounded-xl px-4 py-2 items-center min-w-[80]`}>
                  <Text style={tw`text-brown font-bold text-lg`}>
                    {val}
                    {NUTRIENT_UNITS[key] ? ` ${NUTRIENT_UNITS[key]}` : ""}
                  </Text>
                  <Text style={tw`text-brown-light text-xs`}>{key}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Log Meal Button */}
          <TouchableOpacity
            style={tw`bg-green rounded-2xl py-4 items-center mb-6`}
            onPress={handleLogMeal}
            disabled={logMeal.isPending}>
            <Text style={tw`text-white font-semibold text-base`}>
              {logMeal.isPending ? "Logging..." : "Log This Meal"}
            </Text>
          </TouchableOpacity>

          {/* Ingredients */}
          <View
            style={tw`bg-white rounded-2xl p-4 mb-6 border border-cream-dark`}>
            <Text style={tw`text-lg font-bold text-brown mb-3`}>
              Ingredients
            </Text>
            {meal.ingredients.map((ing, idx) => (
              <View key={idx} style={tw`py-2 border-b border-gray-light`}>
                <Text style={tw`text-brown text-base font-medium`}>
                  {ing.name}
                </Text>
                <Text style={tw`text-brown-light text-sm mt-0.5`}>
                  {ing.amount}
                </Text>
              </View>
            ))}
          </View>

          {/* Steps */}
          <View style={tw`bg-white rounded-2xl p-4 border border-cream-dark`}>
            <Text style={tw`text-lg font-bold text-brown mb-3`}>Steps</Text>
            {meal.steps.map((step, idx) => (
              <View key={idx} style={tw`flex-row mb-3`}>
                <View
                  style={tw`w-7 h-7 rounded-full bg-yellow items-center justify-center mr-3 mt-0.5`}>
                  <Text style={tw`text-brown font-bold text-sm`}>
                    {idx + 1}
                  </Text>
                </View>
                <Text style={tw`flex-1 text-brown text-base leading-6`}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

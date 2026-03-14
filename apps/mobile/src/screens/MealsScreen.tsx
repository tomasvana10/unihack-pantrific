import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMealSuggestions } from "../api/hooks";
import { colors } from "../theme";
import tw from "../tw";
import type { TabParams } from "../types/navigation";

type Props = BottomTabScreenProps<TabParams, "Meals">;

export default function MealsScreen({ route }: Props) {
  const { userId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { data, isLoading, isFetching, refetch } = useMealSuggestions(userId);

  return (
    <View style={tw`flex-1 bg-cream`}>
      <View style={tw`px-6 pt-14 pb-4`}>
        <Text style={tw`text-3xl font-bold text-brown`}>Meal Ideas</Text>
        <Text style={tw`text-base text-brown-light mt-1`}>
          AI-powered suggestions based on your pantry & goals
        </Text>
      </View>

      {!data?.meals && !isLoading && !isFetching && (
        <View style={tw`flex-1 items-center justify-center px-6`}>
          <Text style={tw`text-6xl mb-6`}>🧑‍🍳</Text>
          <Text style={tw`text-brown-light text-base text-center mb-8`}>
            Get personalised meal suggestions based on what's in your pantry and
            your nutrition goals
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

      {(isLoading || isFetching) && (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={colors.yellowDark} />
          <Text style={tw`text-brown-light mt-4`}>Cooking up ideas...</Text>
        </View>
      )}

      {data?.meals && !isFetching && (
        <ScrollView
          style={tw`flex-1 px-6`}
          contentContainerStyle={{ paddingBottom: 100 }}>
          <TouchableOpacity
            style={tw`bg-yellow rounded-full py-3 items-center mb-4`}
            onPress={() => refetch()}>
            <Text style={tw`text-brown font-semibold`}>
              Regenerate Suggestions
            </Text>
          </TouchableOpacity>

          {data.meals.map((meal, idx) => (
            <TouchableOpacity
              key={idx}
              style={tw`bg-white rounded-2xl mb-4 overflow-hidden border border-cream-dark`}
              onPress={() =>
                navigation.navigate("MealDetail", { meal, userId })
              }>
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
              <View style={tw`p-4`}>
                <Text style={tw`text-xl font-bold text-brown`}>
                  {meal.name}
                </Text>
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
                          {key}: {val}
                        </Text>
                      </View>
                    ))}
                </View>
                <Text style={tw`text-yellow-dark text-sm mt-2 font-medium`}>
                  {meal.benefits}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import tw from "../tw";
import type { RootStackParams } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParams, "MealDetail">;

export default function MealDetailScreen({ navigation, route }: Props) {
  const { meal } = route.params;

  return (
    <ScrollView style={tw`flex-1 bg-cream`}>
      {meal.imageUrl ? (
        <Image
          source={{ uri: meal.imageUrl }}
          style={tw`w-full h-64`}
          resizeMode="cover"
        />
      ) : (
        <View style={tw`w-full h-48 bg-cream-dark items-center justify-center`}>
          <Text style={tw`text-7xl`}>🍲</Text>
        </View>
      )}

      <View style={tw`px-6 pt-5 pb-10`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mb-3`}>
          <Text style={tw`text-brown-light text-base`}>← Back</Text>
        </TouchableOpacity>

        <Text style={tw`text-3xl font-bold text-brown mb-2`}>{meal.name}</Text>
        <Text style={tw`text-base text-brown-light mb-4`}>
          {meal.description}
        </Text>

        <Text style={tw`text-yellow-dark font-medium text-sm mb-6`}>
          {meal.benefits}
        </Text>

        <View
          style={tw`bg-white rounded-2xl p-4 mb-6 border border-cream-dark`}>
          <Text style={tw`text-lg font-bold text-brown mb-3`}>Nutrition</Text>
          <View style={tw`flex-row flex-wrap gap-3`}>
            {Object.entries(meal.estimatedNutrition).map(([key, val]) => (
              <View
                key={key}
                style={tw`bg-cream rounded-xl px-4 py-2 items-center min-w-[80]`}>
                <Text style={tw`text-brown font-bold text-lg`}>{val}</Text>
                <Text style={tw`text-brown-light text-xs`}>{key}</Text>
              </View>
            ))}
          </View>
        </View>

        <View
          style={tw`bg-white rounded-2xl p-4 mb-6 border border-cream-dark`}>
          <Text style={tw`text-lg font-bold text-brown mb-3`}>Ingredients</Text>
          {meal.ingredients.map((ing, idx) => (
            <View
              key={idx}
              style={tw`flex-row justify-between py-2 border-b border-gray-light`}>
              <Text style={tw`text-brown text-base`}>{ing.name}</Text>
              <Text style={tw`text-brown-light text-base`}>{ing.amount}</Text>
            </View>
          ))}
        </View>

        <View style={tw`bg-white rounded-2xl p-4 border border-cream-dark`}>
          <Text style={tw`text-lg font-bold text-brown mb-3`}>Steps</Text>
          {meal.steps.map((step, idx) => (
            <View key={idx} style={tw`flex-row mb-3`}>
              <View
                style={tw`w-7 h-7 rounded-full bg-yellow items-center justify-center mr-3 mt-0.5`}>
                <Text style={tw`text-brown font-bold text-sm`}>{idx + 1}</Text>
              </View>
              <Text style={tw`flex-1 text-brown text-base leading-6`}>
                {step}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

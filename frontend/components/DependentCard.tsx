import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Dependent {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  dependentType: string;
  guardianId: string;
  createdAt: string;
  updatedAt: string;
}

interface DependentCardProps {
  dependent: Dependent;
  onPress: (dependent: Dependent) => void;
}

const DependentCard: React.FC<DependentCardProps> = ({
  dependent,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(dependent)}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-3"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center">
        {/* Avatar */}
        <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
          <Text className="text-lg font-bold text-blue-600">
            {dependent.firstName.charAt(0)}
            {dependent.lastName.charAt(0)}
          </Text>
        </View>

        {/* Name and Relationship */}
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800 mb-1">
            {dependent.firstName} {dependent.lastName}
          </Text>
          <Text className="text-sm text-gray-600">
            Relationship: {dependent.dependentType}
          </Text>
        </View>

        {/* View More Icon */}
        <View className="ml-3">
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default DependentCard;

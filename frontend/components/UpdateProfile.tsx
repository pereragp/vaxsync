import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import userApi, { User } from "@/api/userApi";
import CustomAlert from "./CustomAlert";

interface UpdateProfileProps {
  user: User;
  visible: boolean;
  onClose: () => void;
  onUpdateSuccess: (updatedUser: User) => void;
}

interface EditForm {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  avatar?: string;
}

export default function UpdateProfile({
  user,
  visible,
  onClose,
  onUpdateSuccess,
}: UpdateProfileProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<EditForm>({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    bloodType: "",
  });

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Custom alert state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: any[];
    icon: 'success' | 'error' | 'warning' | 'info' | 'question';
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    icon: 'info'
  });

  // Helper function to show custom alert
  const showAlert = (
    title: string,
    message: string,
    buttons: any[] = [{ text: 'OK' }],
    icon: 'success' | 'error' | 'warning' | 'info' | 'question' = 'info'
  ) => {
    setCustomAlert({
      visible: true,
      title,
      message,
      buttons,
      icon
    });
  };

  //Initialize form when user data changes
  useEffect(() => {
    if (user) {
      setEditForm({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        bloodType: user.bloodType || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  //Submit form handling
  const handleSubmit = async () => {
    try {
      setLoading(true);

      //Validations
      if (!editForm.firstName.trim()) {
        showAlert("Error", "First name cannot be empty", [{ text: 'OK' }], 'warning');
        return;
      }
      if (!editForm.lastName.trim()) {
        showAlert("Error", "Last name cannot be empty", [{ text: 'OK' }], 'warning');
        return;
      }
      if (!editForm.phone.trim()) {
        showAlert("Error", "Phone number cannot be empty", [{ text: 'OK' }], 'warning');
        return;
      }

      //Prepare data for update
      const updateData = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        phone: editForm.phone.trim(),
        dateOfBirth: editForm.dateOfBirth,
        gender: editForm.gender,
        bloodType: editForm.bloodType,
      };

      //Call backend API
      const updatedUser = await userApi.updateProfile(updateData);

      // Show success alert first, then close modal
      showAlert(
        "Success", 
        "Profile updated successfully!", 
        [{ 
          text: 'OK',
          onPress: () => {
            onUpdateSuccess(updatedUser);
            onClose();
          }
        }], 
        'success'
      );
    } catch (error) {
      console.error("Error updating profile:", error);
      showAlert("Error", "Failed to update profile", [{ text: 'OK' }], 'error');
    } finally {
      setLoading(false);
    }
  };

  //Cancel update form
  const handleCancel = () => {
    // Reset form to original values
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      bloodType: user.bloodType || "",
    });
    onClose();
  };

  //Form validity
  const isFormValid = () => {
    return (
      editForm.firstName.trim() &&
      editForm.lastName.trim() &&
      editForm.phone.trim() &&
      editForm.dateOfBirth &&
      editForm.gender
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-5/6 overflow-hidden">
          {/* Gradient Header */}
          <LinearGradient
            colors={['#1e40af', '#3b82f6', '#60a5fa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="px-6 py-8"
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <View className="flex-row items-center mb-3">
                  <View className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-lg items-center justify-center mr-4 shadow-lg">
                    <Ionicons name="create" size={28} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-white">
                      Edit Profile
                    </Text>
                    <Text className="text-blue-100 text-sm mt-1">
                      Update your personal details
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleCancel}
                className="w-11 h-11 rounded-full bg-white items-center justify-center shadow-lg"
                style={{
                  elevation: 4,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 3.84,
                }}
              >
                <Ionicons name="close" size={24} color="#1e40af" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Form Content */}
          <ScrollView className="p-6 bg-gray-50" showsVerticalScrollIndicator={false}>
            <View className="space-y-6">
              {/* Account Information Section */}
              <View>
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center mr-3">
                    <Ionicons name="lock-closed" size={20} color="#6b7280" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">
                      Account Information
                    </Text>
                    <Text className="text-xs text-gray-500">
                      These fields cannot be modified
                    </Text>
                  </View>
                </View>

                {/* Username - Read Only */}
                <View className="mb-4">
                  <Text className="text-xs font-semibold text-gray-600 mb-2 ml-1">
                    USERNAME
                  </Text>
                  <View className="flex-row items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm">
                    <View className="w-10 h-10 rounded-lg bg-gray-200 items-center justify-center mr-3">
                      <Ionicons name="at" size={20} color="#6b7280" />
                    </View>
                    <Text className="text-gray-600 font-medium">@{user?.username}</Text>
                  </View>
                </View>

                {/* Email - Read Only */}
                <View>
                  <Text className="text-xs font-semibold text-gray-600 mb-2 ml-1">
                    EMAIL ADDRESS
                  </Text>
                  <View className="flex-row items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm">
                    <View className="w-10 h-10 rounded-lg bg-gray-200 items-center justify-center mr-3">
                      <Ionicons name="mail" size={20} color="#6b7280" />
                    </View>
                    <Text className="text-gray-600 font-medium">{user?.email}</Text>
                  </View>
                </View>
              </View>

              {/* Personal Details Section */}
              <View>
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 rounded-xl bg-blue-100 items-center justify-center mr-3">
                    <Ionicons name="person" size={20} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">
                      Personal Details
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Update your personal information
                    </Text>
                  </View>
                </View>

                {/* First Name */}
                <View className="mb-4">
                  <Text className="text-xs font-semibold text-gray-600 mb-2 ml-1">
                    FIRST NAME *
                  </Text>
                  <View className="flex-row items-center bg-white rounded-xl p-4 border-2 border-blue-100 shadow-sm">
                    <View className="w-10 h-10 rounded-lg bg-blue-100 items-center justify-center mr-3">
                      <Ionicons name="person" size={20} color="#3b82f6" />
                    </View>
                    <TextInput
                      className="flex-1 text-gray-800 font-medium text-base"
                      placeholder="Enter first name"
                      value={editForm.firstName}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, firstName: text })
                      }
                      placeholderTextColor="#9ca3af"
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Last Name */}
                <View className="mb-4">
                  <Text className="text-xs font-semibold text-gray-600 mb-2 ml-1">
                    LAST NAME *
                  </Text>
                  <View className="flex-row items-center bg-white rounded-xl p-4 border-2 border-blue-100 shadow-sm">
                    <View className="w-10 h-10 rounded-lg bg-blue-100 items-center justify-center mr-3">
                      <Ionicons name="person-outline" size={20} color="#3b82f6" />
                    </View>
                    <TextInput
                      className="flex-1 text-gray-800 font-medium text-base"
                      placeholder="Enter last name"
                      value={editForm.lastName}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, lastName: text })
                      }
                      placeholderTextColor="#9ca3af"
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Phone */}
                <View className="mb-4">
                  <Text className="text-xs font-semibold text-gray-600 mb-2 ml-1">
                    PHONE NUMBER *
                  </Text>
                  <View className="flex-row items-center bg-white rounded-xl p-4 border-2 border-blue-100 shadow-sm">
                    <View className="w-10 h-10 rounded-lg bg-green-100 items-center justify-center mr-3">
                      <Ionicons name="call" size={20} color="#10b981" />
                    </View>
                    <TextInput
                      className="flex-1 text-gray-800 font-medium text-base"
                      placeholder="Enter phone number"
                      value={editForm.phone}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, phone: text })
                      }
                      keyboardType="phone-pad"
                      placeholderTextColor="#9ca3af"
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Date of Birth with Native Picker */}
                <View className="mb-4">
                  <Text className="text-xs font-semibold text-gray-600 mb-2 ml-1">
                    DATE OF BIRTH *
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    disabled={loading}
                    className="bg-white rounded-xl p-4 flex-row items-center justify-between border-2 border-blue-100 shadow-sm"
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 rounded-lg bg-purple-100 items-center justify-center mr-3">
                        <Ionicons name="calendar" size={20} color="#8b5cf6" />
                      </View>
                      <Text className={`font-medium text-base ${editForm.dateOfBirth ? 'text-gray-800' : 'text-gray-400'}`}>
                        {editForm.dateOfBirth 
                          ? new Date(editForm.dateOfBirth).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                          : 'Tap to select date'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
                  </TouchableOpacity>

                {/* Native Date Picker */}
                {showDatePicker && Platform.OS === 'ios' && (
                  <Modal
                    transparent
                    animationType="slide"
                    visible={showDatePicker}
                    onRequestClose={() => setShowDatePicker(false)}
                  >
                    <View className="flex-1 bg-black/50 justify-end">
                      <View className="bg-white rounded-t-3xl p-4">
                        <View className="flex-row justify-between items-center mb-4">
                          <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text className="text-blue-500 text-lg">Cancel</Text>
                          </TouchableOpacity>
                          <Text className="text-lg font-semibold text-gray-800">Select Date</Text>
                          <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text className="text-blue-500 text-lg font-semibold">Done</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={selectedDate}
                          mode="date"
                          display="spinner"
                          onChange={(_event: any, date?: Date) => {
                            if (date) {
                              setSelectedDate(date);
                              setEditForm({
                                ...editForm,
                                dateOfBirth: date.toISOString().split('T')[0],
                              });
                            }
                          }}
                          maximumDate={new Date()}
                        />
                      </View>
                    </View>
                  </Modal>
                )}
                {showDatePicker && Platform.OS === 'android' && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={(_event: any, date?: Date) => {
                      setShowDatePicker(false);
                      if (date) {
                        setSelectedDate(date);
                        setEditForm({
                          ...editForm,
                          dateOfBirth: date.toISOString().split('T')[0],
                        });
                      }
                    }}
                    maximumDate={new Date()}
                  />
                )}
              </View>

                {/* Gender */}
                <View className="mb-4">
                  <Text className="text-xs font-semibold text-gray-600 mb-2 ml-1">
                    GENDER *
                  </Text>
                  <View className="flex-row justify-between">
                    {[
                      { label: 'Male', icon: 'male' },
                      { label: 'Female', icon: 'female' },
                      { label: 'Other', icon: 'transgender' }
                    ].map((option) => {
                      const isSelected = editForm.gender === option.label;
                      return (
                        <TouchableOpacity
                          key={option.label}
                          onPress={() =>
                            setEditForm({
                              ...editForm,
                              gender: option.label,
                            })
                          }
                          disabled={loading}
                          className="flex-1 mx-1"
                        >
                          {isSelected ? (
                            <LinearGradient
                              colors={['#3b82f6', '#2563eb']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 0, y: 1 }}
                              style={{
                                padding: 16,
                                borderRadius: 12,
                                borderWidth: 2,
                                borderColor: '#3b82f6',
                              }}
                            >
                              <View className="items-center">
                                <Ionicons 
                                  name={option.icon as any} 
                                  size={24} 
                                  color="white"
                                />
                                <Text className="text-center font-bold mt-2 text-white">
                                  {option.label}
                                </Text>
                              </View>
                            </LinearGradient>
                          ) : (
                            <View className="p-4 rounded-xl border-2 border-gray-200 bg-white shadow-sm">
                              <View className="items-center">
                                <Ionicons 
                                  name={option.icon as any} 
                                  size={24} 
                                  color="#6b7280"
                                />
                                <Text className="text-center font-bold mt-2 text-gray-700">
                                  {option.label}
                                </Text>
                              </View>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Medical Information Section */}
              <View>
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 rounded-xl bg-red-100 items-center justify-center mr-3">
                    <Ionicons name="medical" size={20} color="#ef4444" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">
                      Medical Information
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Important health details
                    </Text>
                  </View>
                </View>

                {/* Blood Type */}
                <View>
                  <Text className="text-xs font-semibold text-gray-600 mb-3 ml-1">
                    BLOOD TYPE *
                  </Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    className="-mx-1"
                    contentContainerStyle={{ paddingHorizontal: 4 }}
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                      (type) => {
                        const isSelected = editForm.bloodType === type;
                        return (
                          <TouchableOpacity
                            key={type}
                            onPress={() =>
                              setEditForm({ ...editForm, bloodType: type })
                            }
                            disabled={loading}
                            className="mx-1"
                          >
                            {isSelected ? (
                              <LinearGradient
                                colors={['#ef4444', '#dc2626']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={{
                                  paddingHorizontal: 20,
                                  paddingVertical: 16,
                                  borderRadius: 12,
                                  borderWidth: 2,
                                  borderColor: '#ef4444',
                                  minWidth: 75,
                                  alignItems: 'center',
                                }}
                              >
                                <Ionicons 
                                  name="water" 
                                  size={18} 
                                  color="white"
                                />
                                <Text className="font-bold text-lg mt-1 text-white">
                                  {type}
                                </Text>
                              </LinearGradient>
                            ) : (
                              <View className="px-5 py-4 rounded-xl border-2 border-gray-200 bg-white min-w-[75px] items-center shadow-sm">
                                <Ionicons 
                                  name="water" 
                                  size={18} 
                                  color="#ef4444"
                                />
                                <Text className="font-bold text-lg mt-1 text-gray-800">
                                  {type}
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      }
                    )}
                  </ScrollView>
                  <View className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <View className="flex-row items-center">
                      <Ionicons name="information-circle" size={16} color="#3b82f6" />
                      <Text className="text-xs text-blue-700 ml-2 flex-1">
                        Swipe to see all blood types • Tap to select
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="mt-8 mb-4">
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading || !isFormValid()}
                className={`rounded-2xl py-5 items-center shadow-xl mb-3 ${
                  loading || !isFormValid() ? "bg-gray-300" : "bg-blue-500"
                }`}
                style={{
                  shadowColor: loading || !isFormValid() ? '#9ca3af' : '#3b82f6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                    <Text className="text-white font-bold text-lg ml-2">Save Changes</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleCancel}
                className="bg-white rounded-2xl py-4 items-center border-2 border-gray-200"
                disabled={loading}
              >
                <View className="flex-row items-center">
                  <Ionicons name="close-circle-outline" size={22} color="#6b7280" />
                  <Text className="text-gray-700 font-semibold text-base ml-2">Cancel</Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Custom Alert */}
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        buttons={customAlert.buttons}
        icon={customAlert.icon}
        onClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
      />
    </Modal>
  );
}

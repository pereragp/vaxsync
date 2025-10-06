import React from "react";
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Vaccine } from '../api/scheduleApi';

// Vaccine type configurations
const vaccineTypeConfig = {
  routine: { color: '#10b981', bgColor: '#d1fae5', icon: 'shield-checkmark' },
  travel: { color: '#3b82f6', bgColor: '#dbeafe', icon: 'airplane' },
  emergency: { color: '#ef4444', bgColor: '#fee2e2', icon: 'medical' },
  seasonal: { color: '#f59e0b', bgColor: '#fef3c7', icon: 'snow' }
};

interface AddScheduleProps {
  visible: boolean;
  profile: any;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  loading: boolean;
  showAlert: (title: string, message: string, buttons?: any[], icon?: 'success' | 'error' | 'warning' | 'info' | 'question') => void;
  
  // Form state
  availableVaccines: Vaccine[];
  selectedVaccine: Vaccine | null;
  setSelectedVaccine: (vaccine: Vaccine | null) => void;
  vaccineSearchQuery: string;
  setVaccineSearchQuery: (query: string) => void;
  totalDoses: string;
  setTotalDoses: (doses: string) => void;
  interval: string;
  setInterval: (interval: string) => void;
  scheduleDate: string;
  setScheduleDate: (date: string) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  healthcareProvider: string;
  setHealthcareProvider: (provider: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  vaccinationType: 'routine' | 'travel' | 'occupational' | 'emergency';
  setVaccinationType: (type: 'routine' | 'travel' | 'occupational' | 'emergency') => void;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
}

export default function AddSchedule({
  visible,
  profile,
  onClose,
  onSubmit,
  loading,
  showAlert,
  availableVaccines,
  selectedVaccine,
  setSelectedVaccine,
  vaccineSearchQuery,
  setVaccineSearchQuery,
  totalDoses,
  setTotalDoses,
  interval,
  setInterval,
  scheduleDate,
  setScheduleDate,
  selectedDate,
  setSelectedDate,
  healthcareProvider,
  setHealthcareProvider,
  notes,
  setNotes,
  vaccinationType,
  setVaccinationType,
  showDatePicker,
  setShowDatePicker,
}: AddScheduleProps) {
  const [currentStep, setCurrentStep] = React.useState(1);

  // Validation for each step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Step 1: Vaccine Selection
        if (!selectedVaccine) {
          showAlert("Validation Error", "Please select a vaccine to continue", [{ text: 'OK' }], 'warning');
          return false;
        }
        return true;
      case 2:
        // Step 2: Schedule Details
        if (!scheduleDate.trim()) {
          showAlert("Validation Error", "Please select a schedule date", [{ text: 'OK' }], 'warning');
          return false;
        }
        const doses = parseInt(totalDoses);
        if (isNaN(doses) || doses < 1 || doses > 10) {
          showAlert("Validation Error", "Please select number of doses (1-10)", [{ text: 'OK' }], 'warning');
          return false;
        }
        if (doses > 1) {
          const intervalDays = parseInt(interval);
          if (isNaN(intervalDays) || intervalDays < 1 || intervalDays > 365) {
            showAlert("Validation Error", "Please select a valid interval between doses", [{ text: 'OK' }], 'warning');
            return false;
          }
        }
        return true;
      case 3:
        // Step 3: Additional Information (Optional fields, always valid)
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        onSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onClose();
    }
  };

  // Reset to step 1 when modal opens
  React.useEffect(() => {
    if (visible) {
      setCurrentStep(1);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible && !!profile}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl overflow-hidden" style={{ maxHeight: '90%' }}>
          {/* Gradient Header with Step Indicator */}
          <View className="px-6 pt-8 pb-6 bg-blue-500 rounded-t-3xl">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-white mb-2">
                  Create Vaccine Schedule
                </Text>
                <Text className="text-blue-100 text-sm">
                  For {profile?.name || 'selected user'}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={onClose}
                className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-lg items-center justify-center"
                style={{ marginLeft: 12 }}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Step Indicator */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
              {[1, 2, 3].map((step) => (
                <View key={step} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: step === currentStep ? 36 : 28,
                    height: step === currentStep ? 36 : 28,
                    borderRadius: step === currentStep ? 18 : 14,
                    backgroundColor: step <= currentStep ? 'white' : 'rgba(255,255,255,0.3)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: step === currentStep ? 3 : 0,
                    borderColor: 'rgba(255,255,255,0.5)',
                  }}>
                    {step < currentStep ? (
                      <Ionicons name="checkmark" size={16} color="#10b981" />
                    ) : (
                      <Text style={{
                        fontSize: step === currentStep ? 16 : 14,
                        fontWeight: '700',
                        color: step <= currentStep ? '#3b82f6' : 'rgba(255,255,255,0.7)',
                      }}>
                        {step}
                      </Text>
                    )}
                  </View>
                  {step < 3 && (
                    <View style={{
                      width: 40,
                      height: 2,
                      backgroundColor: step < currentStep ? 'white' : 'rgba(255,255,255,0.3)',
                      marginHorizontal: 8,
                    }} />
                  )}
                </View>
              ))}
            </View>
          </View>
        
        <ScrollView 
          className="p-6 bg-gray-50" 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {/* Step 1: Vaccine Selection */}
          {currentStep === 1 && (
          <View>
            <View className="mb-6">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-xl bg-blue-100 items-center justify-center mr-3">
                  <Ionicons name="medical" size={20} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-800">Vaccine Selection</Text>
                  <Text className="text-xs text-gray-500">Step 1 of 3</Text>
                </View>
              </View>
            
            {/* Search Input */}
            <View className="mb-4">
              <TextInput
                className="bg-gray-50 rounded-lg p-3 text-gray-800"
                placeholder="Search vaccines or type custom vaccine name..."
                value={vaccineSearchQuery}
                onChangeText={(text) => {
                  setVaccineSearchQuery(text);
                  // Clear selected vaccine if user is typing
                  if (text && selectedVaccine) {
                    setSelectedVaccine(null);
                  }
                }}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Vaccine List */}
            {(vaccineSearchQuery || availableVaccines.length > 0) && (
              <ScrollView 
                className="max-h-40 bg-gray-50 rounded-lg"
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {availableVaccines
                  .filter(vaccine => 
                    !vaccineSearchQuery || 
                    vaccine.name.toLowerCase().includes(vaccineSearchQuery.toLowerCase()) ||
                    vaccine.description.toLowerCase().includes(vaccineSearchQuery.toLowerCase())
                  )
                  .map((vaccine) => (
                    <TouchableOpacity
                      key={vaccine._id}
                      onPress={() => {
                        setSelectedVaccine(vaccine);
                        setVaccineSearchQuery(vaccine.name);
                      }}
                      className={`p-3 border-b border-gray-200 ${
                        selectedVaccine?._id === vaccine._id ? 'bg-blue-50' : 'bg-white'
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="font-medium text-gray-800">{vaccine.name}</Text>
                          <Text className="text-sm text-gray-600">{vaccine.description}</Text>
                          <View className="flex-row items-center mt-1">
                            <View 
                              className="px-2 py-1 rounded-full mr-2"
                              style={{ backgroundColor: vaccineTypeConfig[vaccine.type]?.bgColor || '#f3f4f6' }}
                            >
                              <Text 
                                className="text-xs font-medium capitalize"
                                style={{ color: vaccineTypeConfig[vaccine.type]?.color || '#6b7280' }}
                              >
                                {vaccine.type}
                              </Text>
                            </View>
                            {vaccine.manufacturer && (
                              <Text className="text-xs text-gray-500">{vaccine.manufacturer}</Text>
                            )}
                          </View>
                        </View>
                        {selectedVaccine?._id === vaccine._id && (
                          <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            )}

            {/* Selected Vaccine Display */}
            {selectedVaccine && (
              <View className="bg-blue-50 rounded-lg p-3 mt-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-medium text-blue-800">{selectedVaccine.name}</Text>
                    <Text className="text-sm text-blue-600">{selectedVaccine.description}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedVaccine(null);
                      setVaccineSearchQuery("");
                    }}
                    className="ml-2"
                  >
                    <Ionicons name="close-circle" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            </View>
          </View>
          )}

          {/* Step 2: Schedule Details */}
          {currentStep === 2 && (
          <View>
            <View className="mb-6">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-xl bg-green-100 items-center justify-center mr-3">
                  <Ionicons name="calendar" size={20} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-800">Schedule Details</Text>
                  <Text className="text-xs text-gray-500">Step 2 of 3</Text>
                </View>
              </View>
            
            <View className="space-y-4">
              {/* Native Schedule Date Picker */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Schedule Date *</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="bg-gray-50 rounded-lg p-3 flex-row items-center justify-between border-2 border-gray-200"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="bg-blue-100 rounded-lg p-2 mr-3">
                      <Ionicons name="calendar" size={20} color="#3b82f6" />
                    </View>
                    <Text className={`${scheduleDate ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                      {scheduleDate ? new Date(scheduleDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'Tap to open calendar'}
                    </Text>
                  </View>
                  <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
                </TouchableOpacity>
                <Text className="text-xs text-gray-500 mt-1">
                  Tap to open calendar and select first dose date
                </Text>

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
                              setScheduleDate(date.toISOString().split('T')[0]);
                            }
                          }}
                          minimumDate={new Date()}
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
                        setScheduleDate(date.toISOString().split('T')[0]);
                      }
                    }}
                    minimumDate={new Date()}
                  />
                )}
                          </View>

              {/* Simple Horizontal Scroll Total Doses Selector */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Total Doses *</Text>
                <View className="bg-gray-50 rounded-lg p-3 border-2 border-gray-200">
                  <View className="flex-row items-center mb-2">
                    <View className="bg-green-100 rounded-lg p-2 mr-2">
                      <Ionicons name="medical" size={18} color="#10b981" />
                    </View>
                    <Text className="text-gray-800 font-bold text-base">
                      {totalDoses} {totalDoses === "1" ? 'dose' : 'doses'}
                                  </Text>
                          </View>

                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={{ marginHorizontal: -4 }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <TouchableOpacity
                        key={num}
                        onPress={() => setTotalDoses(num.toString())}
                        style={{
                          width: 50,
                          height: 50,
                          marginHorizontal: 4,
                          borderRadius: 12,
                          backgroundColor: parseInt(totalDoses) === num ? '#10b981' : '#ffffff',
                          borderWidth: 2,
                          borderColor: parseInt(totalDoses) === num ? '#10b981' : '#d1d5db',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{
                          fontSize: 18,
                          fontWeight: 'bold',
                          color: parseInt(totalDoses) === num ? '#ffffff' : '#374151',
                        }}>
                          {num}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                <Text className="text-xs text-gray-500 mt-1">
                  Scroll and tap to select dose count
                </Text>

              </View>

              {/* Enhanced Interval Selector - Only show if doses > 1 */}
              {parseInt(totalDoses) > 1 && (
              <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Interval Between Doses *</Text>
                  
                  {/* Spinner Control */}
                  <View className="bg-gray-50 rounded-lg p-3 flex-row items-center justify-between border-2 border-gray-200 mb-3">
                    <View className="flex-row items-center flex-1">
                      <View className="bg-purple-100 rounded-lg p-2 mr-3">
                        <Ionicons name="time" size={20} color="#a855f7" />
                  </View>
                      <View>
                        <Text className="text-gray-800 font-bold text-lg">
                          {interval} days
                </Text>
                        <Text className="text-gray-500 text-xs">
                          {parseInt(interval) === 7 ? '1 week' : 
                           parseInt(interval) === 14 ? '2 weeks' : 
                           parseInt(interval) === 21 ? '3 weeks' : 
                           parseInt(interval) === 28 ? '4 weeks' : 
                           parseInt(interval) === 30 ? '1 month' : 
                           parseInt(interval) === 60 ? '2 months' : 
                           parseInt(interval) === 90 ? '3 months' : 
                           `${Math.floor(parseInt(interval) / 7)} weeks`}
                        </Text>
                        </View>
                      </View>
                      
                    {/* Spinner Controls */}
                    <View className="flex-row items-center space-x-2">
                              <TouchableOpacity
                                onPress={() => {
                          const current = parseInt(interval);
                          const newValue = Math.max(1, current - 1);
                          setInterval(newValue.toString());
                                }}
                        disabled={parseInt(interval) <= 1}
                        className={`w-10 h-10 rounded-lg items-center justify-center ${
                          parseInt(interval) <= 1 ? 'bg-gray-200' : 'bg-blue-500'
                                }`}
                              >
                                      <Ionicons 
                          name="remove" 
                          size={20} 
                          color={parseInt(interval) <= 1 ? '#9ca3af' : 'white'} 
                        />
                              </TouchableOpacity>
                      
                            <TouchableOpacity
                        onPress={() => {
                          const current = parseInt(interval);
                          const newValue = Math.min(365, current + 1);
                          setInterval(newValue.toString());
                        }}
                        disabled={parseInt(interval) >= 365}
                        className={`w-10 h-10 rounded-lg items-center justify-center ml-2 ${
                          parseInt(interval) >= 365 ? 'bg-gray-200' : 'bg-blue-500'
                        }`}
                      >
                        <Ionicons 
                          name="add" 
                          size={20} 
                          color={parseInt(interval) >= 365 ? '#9ca3af' : 'white'} 
                        />
                            </TouchableOpacity>
                          </View>
                        </View>

                  {/* Quick Presets */}
                <View>
                    <Text className="text-xs font-medium text-gray-600 mb-2">Quick Presets:</Text>
                    <View className="flex-row flex-wrap">
                      {[
                        { days: "7", label: "1 week" },
                        { days: "14", label: "2 weeks" },
                        { days: "21", label: "3 weeks" },
                        { days: "28", label: "4 weeks" },
                        { days: "30", label: "1 month" },
                        { days: "60", label: "2 months" },
                        { days: "90", label: "3 months" },
                      ].map((preset) => (
                        <TouchableOpacity
                          key={preset.days}
                          onPress={() => setInterval(preset.days)}
                          className={`mr-2 mb-2 px-3 py-2 rounded-lg border-2 ${
                            interval === preset.days 
                              ? 'bg-purple-500 border-purple-500' 
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          <Text className={`text-xs font-medium ${
                            interval === preset.days ? 'text-white' : 'text-gray-700'
                          }`}>
                            {preset.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  <Text className="text-xs text-gray-500 mt-2">
                    Use +/- to adjust day by day, or tap a preset for common intervals
                  </Text>
                </View>
                  )}
                </View>
              </View>
          </View>
          )}

          {/* Step 3: Additional Information */}
          {currentStep === 3 && (
          <View>
            <View className="mb-6">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-xl bg-purple-100 items-center justify-center mr-3">
                  <Ionicons name="document-text" size={20} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-800">Additional Details</Text>
                  <Text className="text-xs text-gray-500">Step 3 of 3 - Optional</Text>
                </View>
              </View>

              <View className="space-y-4">
                  {/* Vaccination Type Selection */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-3">Vaccination Type *</Text>
                
                {/* Simple Button Row */}
                <View style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        marginRight: 4,
                        padding: 12,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: vaccinationType === 'routine' ? '#3b82f6' : '#e5e7eb',
                        backgroundColor: vaccinationType === 'routine' ? '#eff6ff' : '#ffffff',
                        alignItems: 'center'
                      }}
                      onPress={() => setVaccinationType('routine')}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name="shield-checkmark" 
                        size={20} 
                        color={vaccinationType === 'routine' ? '#3b82f6' : '#6b7280'} 
                      />
                      <Text style={{ 
                        marginTop: 4, 
                        fontSize: 12, 
                        fontWeight: '600',
                        color: vaccinationType === 'routine' ? '#3b82f6' : '#6b7280'
                      }}>
                        Routine
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        marginLeft: 4,
                        padding: 12,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: vaccinationType === 'travel' ? '#3b82f6' : '#e5e7eb',
                        backgroundColor: vaccinationType === 'travel' ? '#eff6ff' : '#ffffff',
                        alignItems: 'center'
                      }}
                      onPress={() => setVaccinationType('travel')}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name="airplane" 
                        size={20} 
                        color={vaccinationType === 'travel' ? '#3b82f6' : '#6b7280'} 
                      />
                      <Text style={{ 
                        marginTop: 4, 
                        fontSize: 12, 
                        fontWeight: '600',
                        color: vaccinationType === 'travel' ? '#3b82f6' : '#6b7280'
                      }}>
                        Travel
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        marginRight: 4,
                        padding: 12,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: vaccinationType === 'occupational' ? '#3b82f6' : '#e5e7eb',
                        backgroundColor: vaccinationType === 'occupational' ? '#eff6ff' : '#ffffff',
                        alignItems: 'center'
                      }}
                      onPress={() => setVaccinationType('occupational')}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name="briefcase" 
                        size={20} 
                        color={vaccinationType === 'occupational' ? '#3b82f6' : '#6b7280'} 
                      />
                      <Text style={{ 
                        marginTop: 4, 
                        fontSize: 12, 
                        fontWeight: '600',
                        color: vaccinationType === 'occupational' ? '#3b82f6' : '#6b7280'
                      }}>
                        Work
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        marginLeft: 4,
                        padding: 12,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: vaccinationType === 'emergency' ? '#3b82f6' : '#e5e7eb',
                        backgroundColor: vaccinationType === 'emergency' ? '#eff6ff' : '#ffffff',
                        alignItems: 'center'
                      }}
                      onPress={() => setVaccinationType('emergency')}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name="medical" 
                        size={20} 
                        color={vaccinationType === 'emergency' ? '#3b82f6' : '#6b7280'} 
                      />
                      <Text style={{ 
                        marginTop: 4, 
                        fontSize: 12, 
                        fontWeight: '600',
                        color: vaccinationType === 'emergency' ? '#3b82f6' : '#6b7280'
                      }}>
                        Emergency
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text className="text-xs text-gray-500">
                  Select the category of vaccination
                </Text>
              </View>

              {/* Healthcare Provider */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Healthcare Provider (Optional)</Text>
                <TextInput
                  className="bg-gray-50 rounded-lg p-3 text-gray-800"
                  placeholder="e.g., Dr. Smith, City Hospital"
                  value={healthcareProvider}
                  onChangeText={setHealthcareProvider}
                  placeholderTextColor="#9ca3af"
                />
              </View>

                  {/* Notes */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Notes (Optional)</Text>
                    <TextInput
                      className="bg-gray-50 rounded-lg p-3 text-gray-800"
                      placeholder="Additional notes about this schedule..."
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={3}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>
              </View>

              {/* Schedule Preview */}
              {selectedVaccine && scheduleDate && totalDoses && (
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-xl bg-blue-100 items-center justify-center mr-3">
                    <Ionicons name="eye" size={20} color="#3b82f6" />
                  </View>
                  <Text className="text-lg font-bold text-gray-800">Schedule Preview</Text>
                </View>
                <View className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <View className="space-y-2">
                    <View className="flex-row items-center">
                      <Ionicons name="medical" size={16} color="#3b82f6" />
                      <Text className="text-sm text-blue-700 ml-2">
                        <Text className="font-bold">{selectedVaccine.name}</Text>
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="medical" size={16} color="#3b82f6" />
                      <Text className="text-sm text-blue-700 ml-2">
                        <Text className="font-bold">{totalDoses} dose{totalDoses !== "1" ? 's' : ''}</Text>
                        {parseInt(totalDoses) > 1 && (
                          <Text> • Every {interval} days</Text>
                        )}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="calendar" size={16} color="#3b82f6" />
                      <Text className="text-sm text-blue-700 ml-2">
                        <Text className="font-bold">Start:</Text> {scheduleDate ? new Date(scheduleDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        }) : 'Not selected'}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="shield-checkmark" size={16} color="#3b82f6" />
                      <Text className="text-sm text-blue-700 ml-2">
                        <Text className="font-bold">Type:</Text> {vaccinationType.charAt(0).toUpperCase() + vaccinationType.slice(1)}
                      </Text>
                    </View>
                    {healthcareProvider && (
                      <View className="flex-row items-center">
                        <Ionicons name="medkit" size={16} color="#3b82f6" />
                        <Text className="text-sm text-blue-700 ml-2">
                          <Text className="font-bold">Provider:</Text> {healthcareProvider}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              )}
            </View>
          )}

          {/* Navigation Buttons */}
          <View className="mt-6">
            {/* Main Action Button */}
            <TouchableOpacity
              onPress={handleNext}
              disabled={loading}
              className={`rounded-2xl py-5 items-center shadow-xl mb-3 ${
                loading ? 'bg-gray-300' : currentStep === 3 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{
                shadowColor: currentStep === 3 ? '#10b981' : '#3b82f6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              {loading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Creating Schedule...
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons 
                    name={currentStep === 3 ? "checkmark-circle" : "arrow-forward"} 
                    size={24} 
                    color="white" 
                  />
                  <Text className="text-white font-bold text-lg ml-2">
                    {currentStep === 3 ? 'Create Schedule' : 'Next Step'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            {/* Back/Cancel Button */}
            <TouchableOpacity
              onPress={handleBack}
              className="bg-white rounded-2xl py-4 items-center border-2 border-gray-200"
            >
              <View className="flex-row items-center">
                <Ionicons 
                  name={currentStep === 1 ? "close-circle-outline" : "arrow-back"} 
                  size={22} 
                  color="#6b7280" 
                />
                <Text className="text-gray-700 font-semibold text-base ml-2">
                  {currentStep === 1 ? 'Cancel' : 'Previous Step'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
    </Modal>
  );
}


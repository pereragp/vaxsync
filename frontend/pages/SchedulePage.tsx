import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  LayoutAnimation,
  UIManager,
  Platform,
  Animated,
  Dimensions,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import scheduleAPI, { VaccineSchedule, CreateScheduleRequest, Vaccine } from '../api/scheduleApi';
import healthCardAPI, { HealthCard } from '../api/healthCardApi';

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Profile {
  id: string;
  name: string;
  dob: string;
  relation: string;
  idNumber: string;
  lastUpdated: string;
  avatar?: string;
  healthCard?: HealthCard;
  isDependent?: boolean;
  dependentId?: string;
}

const { width } = Dimensions.get("window");

// Schedule status configurations
const scheduleConfig = {
  in_progress: { color: '#3b82f6', bgColor: '#dbeafe', icon: 'time' },
  completed: { color: '#10b981', bgColor: '#d1fae5', icon: 'checkmark-circle' },
  cancelled: { color: '#ef4444', bgColor: '#fee2e2', icon: 'close-circle' }
};

// Vaccine type configurations
const vaccineTypeConfig = {
  routine: { color: '#10b981', bgColor: '#d1fae5', icon: 'shield-checkmark' },
  travel: { color: '#3b82f6', bgColor: '#dbeafe', icon: 'airplane' },
  emergency: { color: '#ef4444', bgColor: '#fee2e2', icon: 'medical' },
  seasonal: { color: '#f59e0b', bgColor: '#fef3c7', icon: 'snow' }
};

// Dose status configurations
const doseConfig = {
  scheduled: { color: '#3b82f6', bgColor: '#dbeafe', icon: 'calendar' },
  completed: { color: '#10b981', bgColor: '#d1fae5', icon: 'checkmark-circle' },
  missed: { color: '#f59e0b', bgColor: '#fef3c7', icon: 'warning' },
  cancelled: { color: '#ef4444', bgColor: '#fee2e2', icon: 'close-circle' }
};

export default function SchedulePage() {
  // Sample user IDs - using the same ID from backend for testing
  const [profiles, setProfiles] = useState<Profile[]>([
    {
      id: "68cfcf945e1c53a931fa032e", // Real user ID from backend
      name: "Loading...",
      dob: "1988-08-12",
      relation: "User",
      idNumber: "NIC-19880812",
      lastUpdated: "2025-08-20",
      isDependent: false,
    },
  ]);

  const [schedules, setSchedules] = useState<VaccineSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const profile = profiles[selectedIdx];
  const scrollRef = useRef<ScrollView>(null);

  const [expandedSchedules, setExpandedSchedules] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDoseModal, setShowDoseModal] = useState(false);
  const [showUpdateScheduleModal, setShowUpdateScheduleModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<VaccineSchedule | null>(null);
  const [selectedDose, setSelectedDose] = useState<{ schedule: VaccineSchedule; doseNumber: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Create schedule form state
  const [availableVaccines, setAvailableVaccines] = useState<Vaccine[]>([]);
  const [selectedVaccine, setSelectedVaccine] = useState<Vaccine | null>(null);
  const [vaccineSearchQuery, setVaccineSearchQuery] = useState("");
  const [totalDoses, setTotalDoses] = useState("1");
  const [interval, setInterval] = useState("28"); // days
  const [scheduleDate, setScheduleDate] = useState("");
  const [healthcareProvider, setHealthcareProvider] = useState("");
  const [notes, setNotes] = useState("");
  const [vaccinationType, setVaccinationType] = useState<'routine' | 'travel' | 'occupational' | 'emergency'>('routine');

  // Update schedule form state
  const [updateVaccineName, setUpdateVaccineName] = useState("");
  const [updateHealthcareProvider, setUpdateHealthcareProvider] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [updateScheduleDate, setUpdateScheduleDate] = useState("");
  const [updateInterval, setUpdateInterval] = useState("");

  // Animations
  const cardAnimations = useRef<{[key: string]: Animated.Value}>({});
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const progressAnimations = useRef<{[key: string]: Animated.Value}>({});
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Load health card data to get user profiles
  const loadHealthCardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = "68cfcf945e1c53a931fa032e"; // Real user ID from backend
      const allHealthCards = await healthCardAPI.getAllHealthCards(userId);
      
      // Convert health cards to profiles
      const newProfiles: Profile[] = allHealthCards.map((healthCard) => ({
        id: healthCard._id,
        name: healthCard.fullName,
        dob: new Date(healthCard.dateOfBirth).toLocaleDateString(),
        relation: healthCard.cardType === 'dependent' ? 'Dependent' : 'User',
        idNumber: healthCard._id.slice(-8).toUpperCase(),
        lastUpdated: new Date(healthCard.updatedAt).toLocaleDateString(),
        healthCard: healthCard,
        isDependent: healthCard.cardType === 'dependent',
        dependentId: healthCard.cardType === 'dependent' ? healthCard._id : undefined,
      }));

      setProfiles(newProfiles);

    } catch (error: any) {
      console.error('Error loading health card data:', error);
      
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        setError('No health cards found. Would you like to create them?');
        Alert.alert(
          'No Health Cards Found',
          'No health cards exist for this user. Would you like to create them?',
          [
            { 
              text: 'Cancel', 
              style: 'cancel' 
            },
            { 
              text: 'Create Health Cards', 
              onPress: () => createAllHealthCards()
            }
          ]
        );
      } else {
        setError(error.message || 'Failed to load health cards');
      }
    } finally {
      setLoading(false);
    }
  };

  // Create all health cards for user and dependents
  const createAllHealthCards = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = "68cfcf945e1c53a931fa032e"; // Real user ID from backend
      await healthCardAPI.createAllHealthCards(userId);
      
      // Reload all health cards after creation
      await loadHealthCardData();

      Alert.alert(
        'Success',
        'Health cards created successfully for user and dependents.',
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      console.error('Error creating all health cards:', error);
      setError(error.message || 'Failed to create health cards');
      Alert.alert(
        'Error Creating Health Cards',
        error.message || 'Failed to create health cards. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Load schedules for current profile
  const loadSchedules = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      setError(null);

      // Get all schedules first
      const { schedules: allSchedules } = await scheduleAPI.getAllSchedules();
      
      // Filter schedules based on current profile
      let filteredSchedules: VaccineSchedule[] = [];
      
      if (profile.isDependent && profile.dependentId) {
        // For dependents, only show schedules where this dependent is included and not completed
        filteredSchedules = allSchedules.filter(schedule => 
          schedule.dependentIds?.includes(profile.dependentId!) &&
          schedule.overallStatus !== 'completed'
        );
      } else {
        // For main user, only show schedules where no dependents are specified (user's own schedules) and not completed
        filteredSchedules = allSchedules.filter(schedule => 
          (!schedule.dependentIds || schedule.dependentIds.length === 0) &&
          schedule.overallStatus !== 'completed'
        );
      }
      
      setSchedules(filteredSchedules);

    } catch (error: any) {
      console.error('Error loading schedules:', error);
      setError(error.message || 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  // Load health card data when component mounts
  useEffect(() => {
    loadHealthCardData();
  }, []);

  // Load schedules when profile changes
  useEffect(() => {
    if (profiles.length > 0) {
      loadSchedules();
    }
  }, [selectedIdx, profiles]);

  // Initialize animations
  useEffect(() => {
    schedules.forEach(schedule => {
      if (!cardAnimations.current[schedule._id]) {
        cardAnimations.current[schedule._id] = new Animated.Value(0);
      }
      if (!progressAnimations.current[schedule._id]) {
        progressAnimations.current[schedule._id] = new Animated.Value(0);
      }
    });

    // Start pulse animation for timeline
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    // Animate progress bars
    schedules.forEach(schedule => {
      const completionPercentage = scheduleAPI.getCompletionPercentage(schedule);
      Animated.timing(progressAnimations.current[schedule._id], {
        toValue: completionPercentage / 100,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    });
  }, [schedules, pulseAnim]);

  const toggleExpand = (scheduleId: string) => {
    LayoutAnimation.configureNext({
      ...LayoutAnimation.Presets.easeInEaseOut,
      duration: 300,
    });
    
    setExpandedSchedules(prev => {
      const isExpanding = !prev.includes(scheduleId);
      
      // Animate card
      Animated.timing(cardAnimations.current[scheduleId], {
        toValue: isExpanding ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      return isExpanding ? [...prev, scheduleId] : prev.filter(id => id !== scheduleId);
    });
  };

  const handleProfileSwitch = async (newIndex: number) => {
    if (newIndex === selectedIdx) return;

    // Start transition animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: newIndex > selectedIdx ? -50 : 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedIdx(newIndex);
      
      // Complete transition animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Load available vaccines
  const loadAvailableVaccines = async () => {
    try {
      const { vaccines } = await scheduleAPI.getAllVaccines({ isActive: true });
      setAvailableVaccines(vaccines);
    } catch (error: any) {
      console.error('Error loading vaccines:', error);
      Alert.alert('Error', 'Failed to load available vaccines');
    }
  };

  const handleCreateSchedule = () => {
    setShowCreateModal(true);
    loadAvailableVaccines();
  };

  const handleCreateScheduleSubmit = async () => {
    try {
      setLoading(true);

      // Validate form
      const vaccineName = selectedVaccine?.name || vaccineSearchQuery.trim();
      if (!vaccineName) {
        Alert.alert('Error', 'Please select a vaccine or enter a vaccine name');
        return;
      }

      if (!scheduleDate) {
        Alert.alert('Error', 'Please select a schedule date');
        return;
      }

      const totalDosesNum = parseInt(totalDoses);
      const intervalNum = parseInt(interval);

      if (totalDosesNum < 1) {
        Alert.alert('Error', 'Total doses must be at least 1');
        return;
      }

      if (totalDosesNum > 1 && intervalNum < 0) {
        Alert.alert('Error', 'Interval must be non-negative for multiple doses');
        return;
      }

      // Prepare schedule data
      const scheduleData: CreateScheduleRequest = {
        vaccineId: selectedVaccine ? selectedVaccine._id : undefined,
        vaccineName: vaccineName,
        totalDoses: totalDosesNum,
        interval: intervalNum,
        dependentId: profile?.isDependent ? profile.dependentId : undefined,
        healthcareProvider: healthcareProvider.trim() || undefined,
        notes: notes.trim() || undefined,
        scheduleDate: scheduleDate,
        vaccinationType: vaccinationType,
      };

      // Create schedule
      await scheduleAPI.createSchedule(scheduleData);

      // Reload schedules
      await loadSchedules();

      // Reset form
      resetCreateForm();

      // Close modal
      setShowCreateModal(false);

      Alert.alert('Success', 'Vaccine schedule created successfully!');

    } catch (error: any) {
      console.error('Error creating schedule:', error);
      Alert.alert('Error', error.message || 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    setSelectedVaccine(null);
    setVaccineSearchQuery("");
    setTotalDoses("1");
    setInterval("28");
    setScheduleDate("");
    setHealthcareProvider("");
    setNotes("");
    setVaccinationType('routine');
  };

  const handleDosePress = (schedule: VaccineSchedule, doseNumber: number) => {
    setSelectedDose({ schedule, doseNumber });
    setShowDoseModal(true);
  };

  const handleDoseStatusUpdate = async (scheduleId: string, doseNumber: number, newStatus: 'scheduled' | 'completed' | 'missed' | 'cancelled') => {
    try {
      setLoading(true);
      
      const updateData: any = {
        status: newStatus,
      };

      // If marking as completed, set the completion date
      if (newStatus === 'completed') {
        updateData.dateCompleted = new Date().toISOString();
      }

      await scheduleAPI.updateDoseStatus(scheduleId, doseNumber, updateData);

      // Reload schedules
      await loadSchedules();
      
      // Check if this was the last dose to be completed
      const currentSchedule = schedules.find(s => s._id === scheduleId);
      if (currentSchedule && newStatus === 'completed') {
        const completedDoses = currentSchedule.doses.filter(d => d.status === 'completed').length + 1; // +1 for the dose we just completed
        const totalDoses = currentSchedule.doses.length;
        
        if (completedDoses === totalDoses) {
          Alert.alert(
            'Schedule Completed! 🎉', 
            `All doses completed! This schedule has been moved to your health records.`,
            [{ text: 'OK', style: 'default' }]
          );
        } else {
          Alert.alert('Success', `Dose ${doseNumber} marked as ${newStatus} successfully!`);
        }
      } else {
        Alert.alert('Success', `Dose ${doseNumber} marked as ${newStatus} successfully!`);
      }
      
      setShowDoseModal(false);
      setSelectedDose(null);

    } catch (error: any) {
      console.error('Error updating dose status:', error);
      Alert.alert('Error', error.message || 'Failed to update dose status');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSchedule = (schedule: VaccineSchedule) => {
    setSelectedSchedule(schedule);
    setUpdateVaccineName(schedule.vaccineName);
    setUpdateHealthcareProvider(schedule.healthcareProvider?.name || "");
    setUpdateNotes(schedule.notes || "");
    
    // Set schedule date to the first dose's scheduled date
    const firstDose = schedule.doses.find(d => d.doseNumber === 1);
    if (firstDose) {
      setUpdateScheduleDate(new Date(firstDose.dateScheduled).toISOString().split('T')[0]);
    }
    
    setUpdateInterval(schedule.interval.toString());
    setShowUpdateScheduleModal(true);
  };

  const handleUpdateScheduleSubmit = async () => {
    if (!selectedSchedule) return;

    try {
      setLoading(true);

      const updateData = {
        vaccineName: updateVaccineName.trim(),
        healthcareProvider: updateHealthcareProvider.trim() ? { name: updateHealthcareProvider.trim() } : undefined,
        notes: updateNotes.trim() || undefined,
        scheduleDate: updateScheduleDate,
        interval: parseInt(updateInterval),
      };

      await scheduleAPI.updateSchedule(selectedSchedule._id, updateData);

      // Reload schedules
      await loadSchedules();

      // Reset form
      setSelectedSchedule(null);
      setUpdateVaccineName("");
      setUpdateHealthcareProvider("");
      setUpdateNotes("");
      setUpdateScheduleDate("");
      setUpdateInterval("");

      // Close modal
      setShowUpdateScheduleModal(false);

      Alert.alert('Success', 'Schedule updated successfully!');

    } catch (error: any) {
      console.error('Error updating schedule:', error);
      Alert.alert('Error', error.message || 'Failed to update schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string, vaccineName: string) => {
    Alert.alert(
      'Delete Schedule',
      `Are you sure you want to delete the schedule for ${vaccineName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await scheduleAPI.deleteSchedule(scheduleId);
              await loadSchedules();
              Alert.alert('Success', 'Schedule deleted successfully!');
            } catch (error: any) {
              console.error('Error deleting schedule:', error);
              Alert.alert('Error', error.message || 'Failed to delete schedule');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Calculate stats for progress display based on dose status
  const scheduleStats = {
    total: schedules.length,
    scheduled: schedules.filter(s => s.doses.some(d => d.status === 'scheduled')).length,
    completed: schedules.filter(s => s.doses.some(d => d.status === 'completed')).length,
    missed: schedules.filter(s => s.doses.some(d => d.status === 'missed')).length,
    cancelled: schedules.filter(s => s.doses.some(d => d.status === 'cancelled')).length,
  };

  // Filter schedules based on dose status
  const filteredSchedules = schedules.filter(schedule => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = schedule.vaccineName.toLowerCase().includes(searchLower) ||
      schedule.healthcareProvider?.name?.toLowerCase().includes(searchLower) ||
      schedule.notes?.toLowerCase().includes(searchLower);
    
    let matchesFilter = true;
    
    if (filterStatus !== 'all') {
      // Check if any dose in the schedule matches the filter status
      const hasMatchingDose = schedule.doses.some(dose => dose.status === filterStatus);
      matchesFilter = hasMatchingDose;
    }
    
    return matchesSearch && matchesFilter;
  });

  const CircularProgress = ({ percentage, size = 60, strokeWidth = 6, schedule }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    schedule: VaccineSchedule;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const config = scheduleConfig[schedule.overallStatus];
    const completedDoses = schedule.doses.filter(d => d.status === 'completed').length;
    const totalDoses = schedule.totalDoses;

    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={config.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-xs font-bold" style={{ color: config.color }}>
            {Math.round(percentage)}%
          </Text>
          <Text className="text-xs" style={{ color: config.color, fontSize: 8 }}>
            {completedDoses}/{totalDoses}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-blue-50 to-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header with Stats */}
      <View className="pt-4 pb-6 px-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-2xl font-bold text-gray-800">Vaccine Schedules</Text>
          <TouchableOpacity
            onPress={handleCreateSchedule}
            className="bg-blue-500 rounded-full p-3"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {loading && (
          <View className="bg-blue-50 rounded-xl p-3 mb-4 flex-row items-center">
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text className="ml-2 text-blue-700 text-sm">Loading schedules...</Text>
          </View>
        )}

        {error && (
          <View className="bg-red-50 rounded-xl p-3 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="warning" size={20} color="#ef4444" />
              <Text className="ml-2 text-red-700 text-sm flex-1">{error}</Text>
            </View>
            {error.includes('No health cards found') && (
              <TouchableOpacity 
                onPress={createAllHealthCards}
                className="bg-blue-500 rounded-lg px-4 py-2 self-start"
              >
                <Text className="text-white text-sm font-medium">Create Health Cards</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Stats Cards */}
        <View className="flex-row space-x-2 mb-4">
          <View className="flex-1 bg-white rounded-xl p-3 shadow-sm">
            <Text className="text-2xl font-bold text-blue-600">{scheduleStats.total}</Text>
            <Text className="text-sm text-gray-600">Total Schedules</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-3 shadow-sm">
            <Text className="text-2xl font-bold text-blue-500">{scheduleStats.scheduled}</Text>
            <Text className="text-sm text-gray-600">Scheduled</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-3 shadow-sm">
            <Text className="text-2xl font-bold text-green-600">{scheduleStats.completed}</Text>
            <Text className="text-sm text-gray-600">Completed</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-3 shadow-sm">
            <Text className="text-2xl font-bold text-yellow-600">{scheduleStats.missed}</Text>
            <Text className="text-sm text-gray-600">Missed</Text>
          </View>
        </View>
      </View>

      {/* Enhanced Profile Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
      >
        {profiles.map((p, index) => {
          const isSelected = index === selectedIdx;
          const profileSchedules = schedules.filter(s => 
            p.isDependent ? s.dependentIds?.includes(p.id) : !s.dependentIds?.length
          );
          const completedCount = profileSchedules.filter(s => s.doses.some(d => d.status === 'completed')).length;
          
          return (
            <TouchableOpacity
              key={p.id}
              onPress={() => handleProfileSwitch(index)}
              className={`mr-4 p-4 rounded-2xl shadow-md min-w-32 ${
                isSelected ? 'bg-blue-500' : 'bg-white'
              }`}
              style={{
                transform: isSelected ? [{ scale: 1.05 }] : [{ scale: 1 }],
              }}
            >
              <View className="items-center">
                <View className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                  isSelected ? 'bg-white/20' : 'bg-blue-100'
                }`}>
                  <Ionicons 
                    name="person" 
                    size={24} 
                    color={isSelected ? "white" : "#3b82f6"} 
                  />
                </View>
                <Text className={`font-semibold text-center ${
                  isSelected ? 'text-white' : 'text-gray-800'
                }`}>
                  {p.name.split(" ")[0]}
                </Text>
                <Text className={`text-xs text-center ${
                  isSelected ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {p.relation}
                </Text>
                <View className={`mt-1 px-2 py-1 rounded-full ${
                  isSelected ? 'bg-white/20' : 'bg-green-100'
                }`}>
                  <Text className={`text-xs font-medium ${
                    isSelected ? 'text-white' : 'text-green-700'
                  }`}>
                    {completedCount} complete
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Enhanced Search and Filter */}
      <View className="px-4 pb-4">
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-3">
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              className="flex-1 ml-3 text-gray-700 text-base"
              placeholder="Search schedules, vaccines, or providers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', 'scheduled', 'completed', 'missed', 'cancelled'].map(status => (
              <TouchableOpacity
                key={status}
                onPress={() => setFilterStatus(status)}
                className={`mr-2 px-3 py-1 rounded-full ${
                  filterStatus === status 
                    ? 'bg-blue-500' 
                    : 'bg-gray-100'
                }`}
              >
                <Text className={`text-sm capitalize ${
                  filterStatus === status ? 'text-white font-medium' : 'text-gray-600'
                }`}>
                  {status.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <Animated.View 
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        }}
      >
        <ScrollView 
          ref={scrollRef} 
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Enhanced Schedule Cards */}
          {filteredSchedules.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center shadow-sm">
              <Ionicons name="calendar" size={48} color="#94a3b8" />
              <Text className="text-lg font-semibold text-gray-600 mt-4">No schedules found</Text>
              <Text className="text-sm text-gray-500 text-center mt-2">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first vaccine schedule to get started'
                }
              </Text>
              {!searchQuery && filterStatus === 'all' && (
                <TouchableOpacity
                  onPress={handleCreateSchedule}
                  className="bg-blue-500 rounded-lg px-6 py-3 mt-4"
                >
                  <Text className="text-white font-medium">Create Schedule</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredSchedules.map((schedule, index) => {
              const completedDoses = schedule.doses.filter(d => d.status === 'completed');
              const nextDose = schedule.doses.find(d => d.status === 'scheduled');
              const isExpanded = expandedSchedules.includes(schedule._id);
              const completionPercentage = scheduleAPI.getCompletionPercentage(schedule);
              const config = scheduleConfig[schedule.overallStatus];
              const daysUntilNext = scheduleAPI.getDaysUntilNextDose(schedule);
              const isOverdue = scheduleAPI.isOverdue(schedule);

              return (
                <Animated.View
                  key={schedule._id}
                  style={{
                    transform: [{
                      scale: cardAnimations.current[schedule._id]?.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.02],
                      }) || 1
                    }],
                    marginBottom: 16,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => toggleExpand(schedule._id)}
                    className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
                    style={{
                      elevation: 3,
                    }}
                  >
                    {/* Card header with gradient accent */}
                    <View 
                      className="h-1" 
                      style={{ backgroundColor: config.color }}
                    />
                    
                    <View className="p-4">
                      <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-row items-center flex-1">
                          <View 
                            className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
                            style={{ backgroundColor: config.bgColor }}
                          >
                            <Ionicons 
                              name={config.icon as any} 
                              size={24} 
                              color={config.color} 
                            />
                          </View>
                          <View className="flex-1">
                            <View className="flex-row items-center">
                              <Text className="font-bold text-gray-800 text-lg">
                                {schedule.vaccineName}
                              </Text>
                              <View 
                                className="ml-2 px-2 py-1 rounded-full"
                                style={{ backgroundColor: config.bgColor }}
                              >
                                <Text 
                                  className="text-xs font-medium capitalize"
                                  style={{ color: config.color }}
                                >
                                  {schedule.overallStatus.replace('_', ' ')}
                                </Text>
                              </View>
                            </View>
                            <Text className="text-sm text-gray-500 mt-1">
                              {schedule.healthcareProvider?.name || 'No provider specified'}
                            </Text>
                            {nextDose && (
                              <Text className={`text-xs mt-1 ${
                                isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'
                              }`}>
                                {isOverdue 
                                  ? `Overdue by ${Math.abs(daysUntilNext || 0)} days`
                                  : daysUntilNext !== null 
                                    ? `Next dose in ${daysUntilNext} days`
                                    : 'Next dose scheduled'
                                }
                              </Text>
                            )}
                          </View>
                        </View>
                        
                        <View className="items-center ml-3">
                          <CircularProgress 
                            percentage={completionPercentage} 
                            schedule={schedule}
                            size={50}
                          />
                          <Ionicons 
                            name={isExpanded ? "chevron-up" : "chevron-down"} 
                            size={16} 
                            color="#94a3b8" 
                            style={{ marginTop: 4 }}
                          />
                        </View>
                      </View>

                      {/* Dose indicators */}
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          {Array.from({ length: schedule.totalDoses }, (_, i) => {
                            const dose = schedule.doses[i];
                            const doseConfigItem = doseConfig[dose?.status || 'scheduled'];
                            
                            return (
                              <View
                                key={i}
                                className={`w-3 h-3 rounded-full mr-1 ${
                                  dose?.status === 'completed' 
                                    ? 'border-2' 
                                    : dose?.status === 'scheduled'
                                    ? 'border border-dashed'
                                    : 'bg-gray-200'
                                }`}
                                style={{
                                  backgroundColor: dose?.status === 'completed' 
                                    ? doseConfigItem.color 
                                    : dose?.status === 'scheduled' 
                                    ? '#fef3c7' 
                                    : '#e5e7eb',
                                  borderColor: dose?.status === 'completed' 
                                    ? doseConfigItem.color 
                                    : dose?.status === 'scheduled' 
                                    ? '#f59e0b' 
                                    : 'transparent',
                                }}
                              />
                            );
                          })}
                        </View>
                        <Text className="text-sm font-medium text-gray-600">
                          {completedDoses.length}/{schedule.totalDoses} completed
                        </Text>
                      </View>

                      {/* Expanded dose details */}
                      {isExpanded && (
                        <View className="mt-4 space-y-3">
                          {schedule.doses.map((dose, doseIndex) => {
                            const doseConfigItem = doseConfig[dose.status];
                            
                            return (
                              <TouchableOpacity
                                key={dose.doseNumber}
                                onPress={() => handleDosePress(schedule, dose.doseNumber)}
                                className={`p-3 rounded-xl border ${
                                  dose.status === 'completed' 
                                    ? 'bg-gray-50 border-gray-100' 
                                    : dose.status === 'scheduled'
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-yellow-50 border-yellow-200'
                                }`}
                                style={{
                                  opacity: cardAnimations.current[schedule._id]?.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 1],
                                  }) || 1,
                                  transform: [{
                                    translateY: cardAnimations.current[schedule._id]?.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [20, 0],
                                    }) || 0
                                  }],
                                }}
                                activeOpacity={0.7}
                              >
                                <View className="flex-row justify-between items-center mb-2">
                                  <View className="flex-row items-center">
                                    <Text className={`font-semibold ${
                                      dose.status === 'completed' ? 'text-gray-800' : 'text-blue-800'
                                    }`}>
                                      Dose {dose.doseNumber}
                                    </Text>
                                    <Text className="ml-2 text-xs text-gray-500">(Tap to update)</Text>
                                  </View>
                                  <View className="flex-row items-center">
                                    <View 
                                      className="px-2 py-1 rounded-full"
                                      style={{ backgroundColor: doseConfigItem.bgColor }}
                                    >
                                      <Text 
                                        className="text-xs font-medium capitalize"
                                        style={{ color: doseConfigItem.color }}
                                      >
                                        {dose.status}
                                      </Text>
                                    </View>
                                    <View
                                      className={`ml-2 rounded-full p-1 ${
                                        dose.status === 'completed' ? 'bg-green-500' :
                                        dose.status === 'scheduled' ? 'bg-blue-500' :
                                        dose.status === 'missed' ? 'bg-yellow-500' :
                                        'bg-red-500'
                                      }`}
                                    >
                                      <Ionicons 
                                        name={
                                          dose.status === 'completed' ? 'checkmark' :
                                          dose.status === 'scheduled' ? 'calendar' :
                                          dose.status === 'missed' ? 'warning' :
                                          'close'
                                        } 
                                        size={12} 
                                        color="white" 
                                      />
                                    </View>
                                  </View>
                                </View>
                                <View className="space-y-1">
                                  <View className="flex-row">
                                    <Text className="text-xs text-gray-500 w-16">Scheduled:</Text>
                                    <Text className={`text-xs font-medium ${
                                      dose.status === 'completed' ? 'text-gray-700' : 'text-blue-700'
                                    }`}>
                                      {scheduleAPI.formatDate(dose.dateScheduled)}
                                    </Text>
                                  </View>
                                  {dose.dateCompleted && (
                                    <View className="flex-row">
                                      <Text className="text-xs text-gray-500 w-16">Completed:</Text>
                                      <Text className="text-xs font-medium text-gray-700">
                                        {scheduleAPI.formatDate(dose.dateCompleted)}
                                      </Text>
                                    </View>
                                  )}
                                  {dose.notes && (
                                    <View className="flex-row">
                                      <Text className="text-xs text-gray-500 w-16">Notes:</Text>
                                      <Text className="text-xs flex-1 text-gray-700">
                                        {dose.notes}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                          
                          {/* Action buttons */}
                          <View className="flex-row space-x-2 mt-4">
                            <TouchableOpacity
                              onPress={() => handleUpdateSchedule(schedule)}
                              className="flex-1 bg-blue-500 rounded-lg py-2 items-center"
                            >
                              <Text className="text-white font-medium">Update Schedule</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteSchedule(schedule._id, schedule.vaccineName)}
                              className="flex-1 bg-red-500 rounded-lg py-2 items-center"
                            >
                              <Text className="text-white font-medium">Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      </Animated.View>

      {/* Create Schedule Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-5/6">
            <View className="p-6 border-b border-gray-100">
              <View className="flex-row justify-between items-center">
                <Text className="text-xl font-bold text-gray-800">Create Vaccine Schedule</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                >
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-600 mt-2">
                Create a new vaccine schedule for {profile?.name || 'the selected user'}.
              </Text>
            </View>
            
            <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
              {/* Vaccine Selection */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-3">Vaccine Selection</Text>
                
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
                  <ScrollView className="max-h-40 bg-gray-50 rounded-lg">
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

              {/* Schedule Details */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-3">Schedule Details</Text>
                
                <View className="space-y-4">
                  {/* Schedule Date */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Schedule Date *</Text>
                    <View className="flex-row items-center bg-gray-50 rounded-lg p-3">
                      <TextInput
                        className="flex-1 text-gray-800"
                        placeholder="YYYY-MM-DD"
                        value={scheduleDate}
                        onChangeText={setScheduleDate}
                        placeholderTextColor="#9ca3af"
                      />
                      <TouchableOpacity
                        onPress={() => {
                          const today = new Date();
                          const formattedDate = today.toISOString().split('T')[0];
                          setScheduleDate(formattedDate);
                        }}
                        className="ml-2 bg-blue-500 rounded px-3 py-1"
                      >
                        <Text className="text-white text-sm">Today</Text>
                      </TouchableOpacity>
                    </View>
                    <Text className="text-xs text-gray-500 mt-1">
                      Date for the first dose
                    </Text>
                  </View>

                  {/* Total Doses */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Total Doses *</Text>
                    <TextInput
                      className="bg-gray-50 rounded-lg p-3 text-gray-800"
                      placeholder="1"
                      value={totalDoses}
                      onChangeText={setTotalDoses}
                      keyboardType="numeric"
                      placeholderTextColor="#9ca3af"
                    />
                    <Text className="text-xs text-gray-500 mt-1">
                      Number of doses required for this vaccine
                    </Text>
                  </View>

                  {/* Interval - Only show if doses > 1 */}
                  {parseInt(totalDoses) > 1 && (
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Interval (Days) *</Text>
                      <TextInput
                        className="bg-gray-50 rounded-lg p-3 text-gray-800"
                        placeholder="28"
                        value={interval}
                        onChangeText={setInterval}
                        keyboardType="numeric"
                        placeholderTextColor="#9ca3af"
                      />
                      <Text className="text-xs text-gray-500 mt-1">
                        Days between each dose
                      </Text>
                    </View>
                  )}

                  {/* Vaccination Type */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Vaccination Type *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                      {[
                        { value: 'routine', label: 'Routine', icon: 'shield-checkmark' },
                        { value: 'travel', label: 'Travel', icon: 'airplane' },
                        { value: 'occupational', label: 'Occupational', icon: 'briefcase' },
                        { value: 'emergency', label: 'Emergency', icon: 'medical' }
                      ].map((type) => (
                        <TouchableOpacity
                          key={type.value}
                          onPress={() => setVaccinationType(type.value as any)}
                          className={`mr-3 px-4 py-2 rounded-full border-2 ${
                            vaccinationType === type.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <View className="flex-row items-center">
                            <Ionicons 
                              name={type.icon as any} 
                              size={16} 
                              color={vaccinationType === type.value ? '#3b82f6' : '#6b7280'} 
                            />
                            <Text className={`ml-2 text-sm font-medium ${
                              vaccinationType === type.value ? 'text-blue-700' : 'text-gray-600'
                            }`}>
                              {type.label}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <Text className="text-xs text-gray-500">
                      Select the type of vaccination (default: Routine)
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

              {/* Action Buttons */}
              <View className="flex-row space-x-3 mb-6">
                <TouchableOpacity
                  onPress={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  className="flex-1 bg-gray-500 rounded-lg py-3 items-center"
                >
                  <Text className="text-white font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateScheduleSubmit}
                  disabled={loading}
                  className="flex-1 bg-blue-500 rounded-lg py-3 items-center"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-medium">Create Schedule</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Dose Management Modal */}
      <Modal
        visible={showDoseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDoseModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl mx-6 w-full max-w-sm">
            {selectedDose && (
              <>
                <View className="p-4 border-b border-gray-100">
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-lg font-bold text-gray-800">
                        Dose {selectedDose.doseNumber}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        {selectedDose.schedule.vaccineName}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => setShowDoseModal(false)}
                      className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                    >
                      <Ionicons name="close" size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View className="p-4">
                  <Text className="text-sm text-gray-600 mb-3 text-center">
                    Current status: <Text className="font-medium capitalize">{selectedDose.schedule.doses.find(d => d.doseNumber === selectedDose.doseNumber)?.status}</Text>
                  </Text>
                  
                  <Text className="text-sm font-medium text-gray-700 mb-3">Choose new status:</Text>
                  
                  <View className="space-y-2">
                    <TouchableOpacity
                      onPress={() => handleDoseStatusUpdate(selectedDose.schedule._id, selectedDose.doseNumber, 'completed')}
                      className="bg-green-500 rounded-lg py-2 items-center"
                    >
                      <Text className="text-white font-medium">✓ Completed</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => handleDoseStatusUpdate(selectedDose.schedule._id, selectedDose.doseNumber, 'scheduled')}
                      className="bg-blue-500 rounded-lg py-2 items-center"
                    >
                      <Text className="text-white font-medium">📅 Scheduled</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => handleDoseStatusUpdate(selectedDose.schedule._id, selectedDose.doseNumber, 'missed')}
                      className="bg-yellow-500 rounded-lg py-2 items-center"
                    >
                      <Text className="text-white font-medium">⚠️ Missed</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => handleDoseStatusUpdate(selectedDose.schedule._id, selectedDose.doseNumber, 'cancelled')}
                      className="bg-red-500 rounded-lg py-2 items-center"
                    >
                      <Text className="text-white font-medium">❌ Cancelled</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Update Schedule Modal */}
      <Modal
        visible={showUpdateScheduleModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowUpdateScheduleModal(false);
          setSelectedSchedule(null);
        }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-5/6">
            <View className="p-6 border-b border-gray-100">
              <View className="flex-row justify-between items-center">
                <Text className="text-xl font-bold text-gray-800">Update Schedule</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setShowUpdateScheduleModal(false);
                    setSelectedSchedule(null);
                  }}
                  className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                >
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-600 mt-2">
                Update the details for {selectedSchedule?.vaccineName || 'this schedule'}.
              </Text>
            </View>
            
            <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
              {/* Schedule Details */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-3">Schedule Details</Text>
                
                <View className="space-y-4">
                  {/* Vaccine Name */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Vaccine Name *</Text>
                    <TextInput
                      className="bg-gray-50 rounded-lg p-3 text-gray-800"
                      placeholder="Enter vaccine name"
                      value={updateVaccineName}
                      onChangeText={setUpdateVaccineName}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  {/* Healthcare Provider */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Healthcare Provider (Optional)</Text>
                    <TextInput
                      className="bg-gray-50 rounded-lg p-3 text-gray-800"
                      placeholder="e.g., Dr. Smith, City Hospital"
                      value={updateHealthcareProvider}
                      onChangeText={setUpdateHealthcareProvider}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  {/* Schedule Date */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Schedule Date *</Text>
                    <View className="flex-row items-center bg-gray-50 rounded-lg p-3">
                      <TextInput
                        className="flex-1 text-gray-800"
                        placeholder="YYYY-MM-DD"
                        value={updateScheduleDate}
                        onChangeText={setUpdateScheduleDate}
                        placeholderTextColor="#9ca3af"
                      />
                      <TouchableOpacity
                        onPress={() => {
                          const today = new Date();
                          const formattedDate = today.toISOString().split('T')[0];
                          setUpdateScheduleDate(formattedDate);
                        }}
                        className="ml-2 bg-blue-500 rounded px-3 py-1"
                      >
                        <Text className="text-white text-sm">Today</Text>
                      </TouchableOpacity>
                    </View>
                    <Text className="text-xs text-gray-500 mt-1">
                      Date for the first dose
                    </Text>
                  </View>

                  {/* Interval */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Interval (Days) *</Text>
                    <TextInput
                      className="bg-gray-50 rounded-lg p-3 text-gray-800"
                      placeholder="28"
                      value={updateInterval}
                      onChangeText={setUpdateInterval}
                      keyboardType="numeric"
                      placeholderTextColor="#9ca3af"
                    />
                    <Text className="text-xs text-gray-500 mt-1">
                      Days between each dose
                    </Text>
                  </View>

                  {/* Notes */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Notes (Optional)</Text>
                    <TextInput
                      className="bg-gray-50 rounded-lg p-3 text-gray-800"
                      placeholder="Additional notes about this schedule..."
                      value={updateNotes}
                      onChangeText={setUpdateNotes}
                      multiline
                      numberOfLines={3}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row space-x-3 mb-6">
                <TouchableOpacity
                  onPress={() => {
                    setShowUpdateScheduleModal(false);
                    setSelectedSchedule(null);
                  }}
                  className="flex-1 bg-gray-500 rounded-lg py-3 items-center"
                >
                  <Text className="text-white font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleUpdateScheduleSubmit}
                  disabled={loading || !updateVaccineName.trim() || !updateScheduleDate || !updateInterval}
                  className={`flex-1 rounded-lg py-3 items-center ${
                    loading || !updateVaccineName.trim() || !updateScheduleDate || !updateInterval ? 'bg-gray-400' : 'bg-blue-500'
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-medium">Update Schedule</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

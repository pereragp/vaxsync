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
import healthCardAPI, { HealthCard, HealthCardVaccination } from '../api/healthCardApi';

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface VaccineDose {
  doseNumber: number;
  date: string;
  batch: string;
  provider: string;
  verified: boolean;
  facility?: string;
  notes?: string;
}

interface Vaccine {
  id: string;
  name: string;
  doses: VaccineDose[];
  totalDoses: number;
  type: 'routine' | 'travel' | 'occupational' | 'emergency';
  icon: string;
}

interface Profile {
  id: string;
  name: string;
  dob: string;
  relation: string;
  idNumber: string;
  lastUpdated: string;
  vaccines: Vaccine[];
  avatar?: string;
  healthCard?: HealthCard;
  isDependent?: boolean;
  dependentId?: string;
}

const { width } = Dimensions.get("window");

// Vaccine type configurations
const vaccineConfig = {
  routine: { color: '#10b981', bgColor: '#d1fae5', icon: 'shield-checkmark' },
  travel: { color: '#3b82f6', bgColor: '#dbeafe', icon: 'airplane' },
  occupational: { color: '#f59e0b', bgColor: '#fef3c7', icon: 'briefcase' },
  emergency: { color: '#ef4444', bgColor: '#fee2e2', icon: 'medical' }
};

export default function VaxCardScreen() {
  // Sample user IDs - using the same ID from backend for testing
  const [profiles, setProfiles] = useState<Profile[]>([
    {
      id: "68cfcf945e1c53a931fa032e", // Real user ID from backend
      name: "Loading...",
      dob: "1988-08-12",
      relation: "User",
      idNumber: "NIC-19880812",
      lastUpdated: "2025-08-20",
      vaccines: [],
      isDependent: false,
    },
  ]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const profile = profiles[selectedIdx];
  const scrollRef = useRef<ScrollView>(null);

  const [expandedVaccines, setExpandedVaccines] = useState<string[]>([]);
  const [showVaccineModal, setShowVaccineModal] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState<Vaccine | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>('all');

  // Animations
  const cardAnimations = useRef<{[key: string]: Animated.Value}>({});
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const progressAnimations = useRef<{[key: string]: Animated.Value}>({});
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Load health card data from backend
  const loadHealthCardData = async (userId: string, profileIndex: number, isDependent: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      let healthCard: HealthCard;
      if (isDependent) {
        // For dependents, try to get their health card
        healthCard = await healthCardAPI.getDependentHealthCard(userId);
      } else {
        // For users, try to get their health card
        healthCard = await healthCardAPI.getHealthCard(userId);
      }
      
      const groupedVaccines = healthCard.completedVaccinations 
        ? healthCardAPI.groupVaccinationsByName(healthCard.completedVaccinations)
        : [];

      // Update the specific profile with health card data
      setProfiles(prevProfiles => {
        const updatedProfiles = [...prevProfiles];
        updatedProfiles[profileIndex] = {
          ...updatedProfiles[profileIndex],
          name: healthCard.fullName, // Update name from health card
          vaccines: groupedVaccines,
          healthCard: healthCard,
          lastUpdated: new Date(healthCard.updatedAt).toLocaleDateString()
        };
        return updatedProfiles;
      });

    } catch (error: any) {
      console.error('Error loading health card:', error);
      
      // Check if it's a 404 error (health card doesn't exist)
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        const profileName = profiles[profileIndex].name;
        setError(`Health card not found for ${profileName}. Would you like to create one?`);
        
        // Show alert with option to create health card
        Alert.alert(
          'Health Card Not Found',
          `No health card exists for ${profileName}. Would you like to create one?`,
          [
            { 
              text: 'Cancel', 
              style: 'cancel' 
            },
            { 
              text: 'Create Health Card', 
              onPress: () => createHealthCard(userId, profileIndex, isDependent)
            }
          ]
        );
      } else {
        setError(error.message || 'Failed to load vaccination data');
        Alert.alert(
          'Error Loading Data',
          error.message || 'Failed to load vaccination data from server.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Create health card for user/dependent
  const createHealthCard = async (userId: string, profileIndex: number, isDependent: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      let healthCard: HealthCard;
      if (isDependent) {
        healthCard = await healthCardAPI.createDependentHealthCard(userId);
      } else {
        healthCard = await healthCardAPI.createUserHealthCard(userId);
      }

      // Update the profile with the new health card
      setProfiles(prevProfiles => {
        const updatedProfiles = [...prevProfiles];
        updatedProfiles[profileIndex] = {
          ...updatedProfiles[profileIndex],
          name: healthCard.fullName, // Update name from health card
          healthCard: healthCard,
          lastUpdated: new Date(healthCard.updatedAt).toLocaleDateString()
        };
        return updatedProfiles;
      });

      Alert.alert(
        'Success',
        `Health card created successfully for ${profiles[profileIndex].name}`,
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      console.error('Error creating health card:', error);
      setError(error.message || 'Failed to create health card');
      Alert.alert(
        'Error Creating Health Card',
        error.message || 'Failed to create health card. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Load all health cards for user and dependents
  const loadAllHealthCards = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = "68cfcf945e1c53a931fa032e"; // Real user ID from backend
      const allHealthCards = await healthCardAPI.getAllHealthCards(userId);
      
      // Convert health cards to profiles
      const newProfiles: Profile[] = allHealthCards.map((healthCard, index) => ({
        id: healthCard._id,
        name: healthCard.fullName,
        dob: new Date(healthCard.dateOfBirth).toLocaleDateString(),
        relation: healthCard.cardType === 'dependent' ? 'Dependent' : 'User',
        idNumber: healthCard._id.slice(-8).toUpperCase(),
        lastUpdated: new Date(healthCard.updatedAt).toLocaleDateString(),
        vaccines: healthCard.completedVaccinations 
          ? healthCardAPI.groupVaccinationsByName(healthCard.completedVaccinations)
          : [],
        healthCard: healthCard,
        isDependent: healthCard.cardType === 'dependent',
        dependentId: healthCard.cardType === 'dependent' ? healthCard._id : undefined,
      }));

      setProfiles(newProfiles);

    } catch (error: any) {
      console.error('Error loading all health cards:', error);
      
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
      await loadAllHealthCards();

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

  // Load health card data when component mounts
  useEffect(() => {
    loadAllHealthCards();
  }, []);

  // Load health card data when profile changes
  useEffect(() => {
    if (profiles.length > 0) {
      const currentProfile = profiles[selectedIdx];
      if (currentProfile && !currentProfile.healthCard) {
        loadHealthCardData(currentProfile.id, selectedIdx, currentProfile.isDependent);
      }
    }
  }, [selectedIdx]);

  // Initialize animations
  useEffect(() => {
    profile.vaccines.forEach(vaccine => {
      if (!cardAnimations.current[vaccine.id]) {
        cardAnimations.current[vaccine.id] = new Animated.Value(0);
      }
      if (!progressAnimations.current[vaccine.id]) {
        progressAnimations.current[vaccine.id] = new Animated.Value(0);
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
    profile.vaccines.forEach(vaccine => {
      Animated.timing(progressAnimations.current[vaccine.id], {
        toValue: vaccine.doses.length / vaccine.totalDoses,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    });
  }, [profile, pulseAnim]);

  const toggleExpand = (vaccineId: string) => {
    LayoutAnimation.configureNext({
      ...LayoutAnimation.Presets.easeInEaseOut,
      duration: 300,
    });
    
    setExpandedVaccines(prev => {
      const isExpanding = !prev.includes(vaccineId);
      
      // Animate card
      Animated.timing(cardAnimations.current[vaccineId], {
        toValue: isExpanding ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      return isExpanding ? [...prev, vaccineId] : prev.filter(id => id !== vaccineId);
    });
  };

  const handleVaccinePress = (vaccine: Vaccine) => {
    setSelectedVaccine(vaccine);
    setShowVaccineModal(true);
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
      
      // Load data for new profile
      const newProfile = profiles[newIndex];
      if (newProfile && !newProfile.healthCard) {
        loadHealthCardData(newProfile.id, newIndex, newProfile.isDependent);
      }
      
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

  const handleDownload = async () => {
    const currentProfile = profiles[selectedIdx];
    if (currentProfile?.healthCard) {
      try {
        // In a real implementation, this would generate and download a PDF
        Alert.alert(
          "Download Health Card", 
          `Downloading vaccination certificate for ${currentProfile.name}...`,
          [{ text: "OK" }]
        );
        // TODO: Implement actual PDF generation and download
      } catch (error) {
        Alert.alert("Error", "Failed to download health card");
      }
    } else {
      Alert.alert("No Data", "No health card data available to download");
    }
  };

  const handleShare = async () => {
    const currentProfile = profiles[selectedIdx];
    if (currentProfile?.healthCard) {
      try {
        // In a real implementation, this would share the health card
        Alert.alert(
          "Share Health Card", 
          `Sharing vaccination certificate for ${currentProfile.name}...\n\nCard ID: ${currentProfile.healthCard._id}`,
          [{ text: "OK" }]
        );
        // TODO: Implement actual sharing functionality
      } catch (error) {
        Alert.alert("Error", "Failed to share health card");
      }
    } else {
      Alert.alert("No Data", "No health card data available to share");
    }
  };

  // Calculate completion stats for progress display
  const completionStats = {
    total: profile.vaccines.length,
    completed: profile.vaccines.filter(v => v.doses.length === v.totalDoses).length,
    verified: profile.vaccines.filter(v => v.doses.every(d => d.verified)).length,
  };

  // Function to add pending doses for incomplete vaccines
  const addPendingDoses = (vaccines: Vaccine[]): Vaccine[] => {
    return vaccines.map(vaccine => {
      const completedDoses = vaccine.doses.length;
      const pendingDoses: VaccineDose[] = [];
      
      // Add pending doses for missing ones
      for (let i = completedDoses + 1; i <= vaccine.totalDoses; i++) {
        pendingDoses.push({
          doseNumber: i,
          date: 'Pending',
          batch: 'N/A',
          provider: 'To be scheduled',
          verified: false,
          facility: 'TBD',
          notes: 'Dose not yet administered'
        });
      }
      
      return {
        ...vaccine,
        doses: [...vaccine.doses, ...pendingDoses]
      };
    });
  };

  // Filter vaccines with pending doses
  const vaccinesWithPending = addPendingDoses(profile.vaccines);
  const filteredVaccines = vaccinesWithPending.filter(vaccine => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = vaccine.name.toLowerCase().includes(searchLower) ||
      vaccine.doses.some(dose => 
        dose.date.toLowerCase().includes(searchLower) ||
        dose.batch.toLowerCase().includes(searchLower) ||
        dose.provider.toLowerCase().includes(searchLower)
      );
    
    const matchesFilter = filterType === 'all' || vaccine.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const CircularProgress = ({ percentage, size = 60, strokeWidth = 6, vaccine }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    vaccine: Vaccine;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const config = vaccineConfig[vaccine.type];
    const completedDoses = vaccine.doses.filter(d => d.verified).length;
    const totalDoses = vaccine.totalDoses;

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
          <Text className="text-2xl font-bold text-gray-800">My Vaccine Records</Text>
        </View>
        
        {loading && (
          <View className="bg-blue-50 rounded-xl p-3 mb-4 flex-row items-center">
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text className="ml-2 text-blue-700 text-sm">Loading vaccination data...</Text>
          </View>
        )}

        {error && (
          <View className="bg-red-50 rounded-xl p-3 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="warning" size={20} color="#ef4444" />
              <Text className="ml-2 text-red-700 text-sm flex-1">{error}</Text>
            </View>
            {(error.includes('Health card not found') || error.includes('No health cards found')) && (
              <TouchableOpacity 
                onPress={() => {
                  if (error.includes('No health cards found')) {
                    createAllHealthCards();
                  } else {
                    const currentProfile = profiles[selectedIdx];
                    if (currentProfile) {
                      createHealthCard(currentProfile.id, selectedIdx, currentProfile.isDependent);
                    }
                  }
                }}
                className="bg-blue-500 rounded-lg px-4 py-2 self-start"
              >
                <Text className="text-white text-sm font-medium">
                  {error.includes('No health cards found') ? 'Create Health Cards' : 'Create Health Card'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Enhanced Profile Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
      >
        {profiles.map((p, index) => {
          const isSelected = index === selectedIdx;
          const completedCount = p.vaccines.filter(v => v.doses.length === v.totalDoses).length;
          const hasHealthCard = !!p.healthCard;
          
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
                  {hasHealthCard && (
                    <View className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full items-center justify-center">
                      <Ionicons name="checkmark" size={10} color="white" />
                    </View>
                  )}
                </View>
                <Text className={`font-semibold text-center ${
                  isSelected ? 'text-white' : 'text-gray-800'
                }`}>
                  {p.healthCard ? p.healthCard.fullName.split(" ")[0] : p.name.split(" ")[0]}
                </Text>
                <Text className={`text-xs text-center ${
                  isSelected ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {p.healthCard ? (p.healthCard.cardType === 'dependent' ? 'Dependent' : 'User') : p.relation}
                </Text>
                {hasHealthCard ? (
                  <View className={`mt-1 px-2 py-1 rounded-full ${
                    isSelected ? 'bg-white/20' : 'bg-green-100'
                  }`}>
                    <Text className={`text-xs font-medium ${
                      isSelected ? 'text-white' : 'text-green-700'
                    }`}>
                      {completedCount} complete
                    </Text>
                  </View>
                ) : (
                  <View className={`mt-1 px-2 py-1 rounded-full ${
                    isSelected ? 'bg-white/20' : 'bg-yellow-100'
                  }`}>
                    <Text className={`text-xs font-medium ${
                      isSelected ? 'text-white' : 'text-yellow-700'
                    }`}>
                      Loading...
                    </Text>
                  </View>
                )}
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
              placeholder="Search vaccines, dates, or providers..."
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
            {['all', 'routine', 'travel', 'occupational', 'emergency'].map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => setFilterType(type)}
                className={`mr-2 px-3 py-1 rounded-full ${
                  filterType === type 
                    ? 'bg-blue-500' 
                    : 'bg-gray-100'
                }`}
              >
                <Text className={`text-sm capitalize ${
                  filterType === type ? 'text-white font-medium' : 'text-gray-600'
                }`}>
                  {type}
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
        {/* Enhanced Vaccine Cards */}
        {filteredVaccines.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center shadow-sm">
            <Ionicons name="search" size={48} color="#94a3b8" />
            <Text className="text-lg font-semibold text-gray-600 mt-4">No vaccines found</Text>
            <Text className="text-sm text-gray-500 text-center mt-2">
              Try adjusting your search or filter criteria
            </Text>
          </View>
        ) : (
          filteredVaccines.map((vaccine, index) => {
            const completedDoses = vaccine.doses.filter(d => d.verified);
            const latestDose = completedDoses[completedDoses.length - 1] || vaccine.doses[vaccine.doses.length - 1];
            const allVerified = completedDoses.length === vaccine.totalDoses;
            const isExpanded = expandedVaccines.includes(vaccine.id);
            const completionPercentage = (completedDoses.length / vaccine.totalDoses) * 100;
            const config = vaccineConfig[vaccine.type];

            return (
              <Animated.View
                key={vaccine.id}
                style={{
                  transform: [{
                    scale: cardAnimations.current[vaccine.id]?.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.02],
                    }) || 1
                  }],
                  marginBottom: 16,
                }}
              >
                <TouchableOpacity
                  onPress={() => toggleExpand(vaccine.id)}
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
                              {vaccine.name}
                            </Text>
                            {allVerified && (
                              <View className="ml-2 bg-green-100 rounded-full px-2 py-1">
                                <Text className="text-xs font-medium text-green-700">
                                  ✓ Verified
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-sm text-gray-500 mt-1">
                            {latestDose.provider} • {latestDose.date}
                          </Text>
                          <Text className="text-xs text-gray-400 mt-1 capitalize">
                            {vaccine.type} vaccination
                          </Text>
                        </View>
                      </View>
                      
                      <View className="items-center ml-3">
                        <CircularProgress 
                          percentage={completionPercentage} 
                          vaccine={vaccine}
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
                        {Array.from({ length: vaccine.totalDoses }, (_, i) => {
                          const dose = vaccine.doses[i];
                          const isCompleted = dose && dose.verified;
                          const isPending = dose && !dose.verified;
                          
                          return (
                            <View
                              key={i}
                              className={`w-3 h-3 rounded-full mr-1 ${
                                isCompleted 
                                  ? 'border-2' 
                                  : isPending
                                  ? 'border border-dashed'
                                  : 'bg-gray-200'
                              }`}
                              style={{
                                backgroundColor: isCompleted ? config.color : isPending ? '#fef3c7' : '#e5e7eb',
                                borderColor: isCompleted ? config.color : isPending ? '#f59e0b' : 'transparent',
                              }}
                            />
                          );
                        })}
                      </View>
                      <Text className="text-sm font-medium text-gray-600">
                        {completedDoses.length}/{vaccine.totalDoses} completed
                      </Text>
                    </View>

                    {/* Expanded dose details */}
                    {isExpanded && (
                      <View className="mt-4 space-y-3">
                        {vaccine.doses.map((dose, doseIndex) => (
                          <Animated.View
                            key={dose.doseNumber}
                            className={`p-3 rounded-xl border ${
                              dose.verified 
                                ? 'bg-gray-50 border-gray-100' 
                                : 'bg-yellow-50 border-yellow-200'
                            }`}
                            style={{
                              opacity: cardAnimations.current[vaccine.id]?.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 1],
                              }) || 1,
                              transform: [{
                                translateY: cardAnimations.current[vaccine.id]?.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [20, 0],
                                }) || 0
                              }],
                            }}
                          >
                            <View className="flex-row justify-between items-center mb-2">
                              <Text className={`font-semibold ${
                                dose.verified ? 'text-gray-800' : 'text-yellow-800'
                              }`}>
                                Dose {dose.doseNumber}
                              </Text>
                              <View className="flex-row items-center">
                                {dose.verified ? (
                                  <View className="bg-green-100 rounded-full px-2 py-1">
                                    <Text className="text-xs font-medium text-green-700">
                                      ✓ Completed
                                    </Text>
                                  </View>
                                ) : (
                                  <View className="bg-yellow-100 rounded-full px-2 py-1">
                                    <Text className="text-xs font-medium text-yellow-700">
                                      ⏳ Pending
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>
                            <View className="space-y-1">
                              <View className="flex-row">
                                <Text className="text-xs text-gray-500 w-16">Date:</Text>
                                <Text className={`text-xs font-medium ${
                                  dose.verified ? 'text-gray-700' : 'text-yellow-700'
                                }`}>
                                  {dose.date}
                                </Text>
                              </View>
                              <View className="flex-row">
                                <Text className="text-xs text-gray-500 w-16">Batch:</Text>
                                <Text className={`text-xs font-mono ${
                                  dose.verified ? 'text-gray-700' : 'text-yellow-700'
                                }`}>
                                  {dose.batch}
                                </Text>
                              </View>
                              <View className="flex-row">
                                <Text className="text-xs text-gray-500 w-16">Provider:</Text>
                                <Text className={`text-xs ${
                                  dose.verified ? 'text-gray-700' : 'text-yellow-700'
                                }`}>
                                  {dose.provider}
                                </Text>
                              </View>
                              {dose.facility && dose.facility !== 'TBD' && (
                                <View className="flex-row">
                                  <Text className="text-xs text-gray-500 w-16">Facility:</Text>
                                  <Text className={`text-xs ${
                                    dose.verified ? 'text-gray-700' : 'text-yellow-700'
                                  }`}>
                                    {dose.facility}
                                  </Text>
                                </View>
                              )}
                              {dose.notes && (
                                <View className="flex-row">
                                  <Text className="text-xs text-gray-500 w-16">Notes:</Text>
                                  <Text className={`text-xs flex-1 ${
                                    dose.verified ? 'text-gray-700' : 'text-yellow-700'
                                  }`}>
                                    {dose.notes}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </Animated.View>
                        ))}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}


        {/* Enhanced Timeline */}
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-800">Recent Activity</Text>
            <View className="bg-blue-100 rounded-full px-3 py-1">
              <Text className="text-xs font-medium text-blue-700">
                {profile.vaccines.flatMap(v => v.doses).length} total doses
              </Text>
            </View>
          </View>
          
          {profile.vaccines
            .flatMap(v => v.doses.map(dose => ({ vaccine: v, dose })))
            .sort((a, b) => new Date(b.dose.date).getTime() - new Date(a.dose.date).getTime())
            .slice(0, 5) // Show only recent 5
            .map((item, i, arr) => {
              const config = vaccineConfig[item.vaccine.type];
              
              return (
                <View key={`${item.vaccine.id}-${item.dose.doseNumber}`} className="flex-row items-start mb-4 last:mb-0">
                  <View className="items-center mr-4">
                    <Animated.View
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: config.color,
                        transform: i === 0 ? [
                          {
                            scale: pulseAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.3],
                            }),
                          },
                        ] : [],
                      }}
                    />
                    {i < arr.length - 1 && (
                      <View 
                        className="w-0.5 h-8 mt-2" 
                        style={{ backgroundColor: '#e5e7eb' }}
                      />
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="font-semibold text-gray-800">
                        {item.vaccine.name}
                      </Text>
                      <View 
                        className="ml-2 px-2 py-1 rounded-full"
                        style={{ backgroundColor: config.bgColor }}
                      >
                        <Text 
                          className="text-xs font-medium"
                          style={{ color: config.color }}
                        >
                          Dose {item.dose.doseNumber}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm text-gray-500 mt-1">
                      {item.dose.date} • {item.dose.provider}
                    </Text>
                    {i === 0 && (
                      <Text className="text-xs text-blue-600 font-medium mt-1">
                        Latest vaccination
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
        </View>
        </ScrollView>
      </Animated.View>

      {/* Enhanced Floating Action Buttons */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity
          onPress={handleShare}
          className="w-14 h-14 bg-blue-600 rounded-full shadow-lg items-center justify-center mb-3"
          style={{
            elevation: 5,
            shadowColor: '#3b82f6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
        >
          <Ionicons name="share-social" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDownload}
          className="w-14 h-14 bg-white rounded-full shadow-lg items-center justify-center"
          style={{
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          }}
        >
          <Ionicons name="download" size={24} color="#16a34a" />
        </TouchableOpacity>
      </View>

      {/* Enhanced Modal */}
      <Modal
        visible={showVaccineModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVaccineModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-5/6">
            {selectedVaccine && (
              <>
                <View className="p-6 border-b border-gray-100">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <View 
                        className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
                        style={{ backgroundColor: vaccineConfig[selectedVaccine.type].bgColor }}
                      >
                        <Ionicons 
                          name={vaccineConfig[selectedVaccine.type].icon as any} 
                          size={24} 
                          color={vaccineConfig[selectedVaccine.type].color} 
                        />
                      </View>
                      <View>
                        <Text className="text-xl font-bold text-gray-800">
                          {selectedVaccine.name}
                        </Text>
                        <Text className="text-sm text-gray-500 capitalize">
                          {selectedVaccine.type} vaccination
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      onPress={() => setShowVaccineModal(false)}
                      className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                    >
                      <Ionicons name="close" size={24} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
                  <View className="space-y-4">
                    {selectedVaccine.doses.map((dose, index) => (
                      <View 
                        key={dose.doseNumber} 
                        className="bg-gray-50 p-4 rounded-2xl border border-gray-100"
                      >
                        <View className="flex-row justify-between items-center mb-3">
                          <Text className="text-lg font-bold text-gray-800">
                            Dose {dose.doseNumber}
                          </Text>
                          {dose.verified ? (
                            <View className="bg-green-100 rounded-full px-3 py-1">
                              <Text className="text-sm font-medium text-green-700">
                                ✓ Verified
                              </Text>
                            </View>
                          ) : (
                            <View className="bg-yellow-100 rounded-full px-3 py-1">
                              <Text className="text-sm font-medium text-yellow-700">
                                ⏳ Pending
                              </Text>
                            </View>
                          )}
                        </View>
                        
                        <View className="space-y-2">
                          <View className="flex-row">
                            <Text className="text-sm text-gray-500 w-20">Date:</Text>
                            <Text className="text-sm text-gray-800 font-medium flex-1">
                              {dose.date}
                            </Text>
                          </View>
                          <View className="flex-row">
                            <Text className="text-sm text-gray-500 w-20">Batch:</Text>
                            <Text className="text-sm text-gray-800 font-mono flex-1">
                              {dose.batch}
                            </Text>
                          </View>
                          <View className="flex-row">
                            <Text className="text-sm text-gray-500 w-20">Provider:</Text>
                            <Text className="text-sm text-gray-800 flex-1">
                              {dose.provider}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
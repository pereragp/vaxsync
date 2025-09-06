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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

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
  const [profiles] = useState<Profile[]>([
    {
      id: "p-mother",
      name: "Lakshmi Perera",
      dob: "1988-08-12",
      relation: "Mother",
      idNumber: "NIC-19880812",
      lastUpdated: "2025-08-20",
      vaccines: [
        {
          id: "v1",
          name: "BCG",
          type: "routine",
          icon: "shield-checkmark",
          totalDoses: 1,
          doses: [
            { doseNumber: 1, date: "01 Jan 2010", batch: "B123", provider: "District Hospital", verified: true },
          ],
        },
        {
          id: "v2",
          name: "Hepatitis B",
          type: "routine",
          icon: "shield-checkmark",
          totalDoses: 3,
          doses: [
            { doseNumber: 1, date: "15 Mar 2010", batch: "H456", provider: "District Hospital", verified: true },
            { doseNumber: 2, date: "15 Apr 2010", batch: "H457", provider: "District Hospital", verified: true },
            { doseNumber: 3, date: "15 May 2010", batch: "H458", provider: "District Hospital", verified: true },
          ],
        },
      ],
    },
    {
      id: "p-child1",
      name: "Amal Perera",
      dob: "2020-01-15",
      relation: "Child",
      idNumber: "CH-001",
      lastUpdated: "2025-07-12",
      vaccines: [
        {
          id: "c1",
          name: "Polio",
          type: "routine",
          icon: "shield-checkmark",
          totalDoses: 4,
          doses: [
            { doseNumber: 1, date: "03 Feb 2020", batch: "P321", provider: "Vaccination Camp", verified: true },
            { doseNumber: 2, date: "03 Mar 2020", batch: "P322", provider: "Vaccination Camp", verified: true },
            { doseNumber: 3, date: "03 Apr 2020", batch: "P323", provider: "Vaccination Camp", verified: true },
            { doseNumber: 4, date: "03 May 2020", batch: "P324", provider: "Vaccination Camp", verified: true },
          ],
        },
      ],
    },
  ]);

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

  const handleDownload = () => Alert.alert("Download PDF", "Generate signed PDF (simulation)");
  const handleShare = () => Alert.alert("Share", "Native Share invoked (simulation)");

  // Calculate completion stats
  const completionStats = {
    total: profile.vaccines.length,
    completed: profile.vaccines.filter(v => v.doses.length === v.totalDoses).length,
    verified: profile.vaccines.filter(v => v.doses.every(d => d.verified)).length,
  };

  // Filter vaccines
  const filteredVaccines = profile.vaccines.filter(vaccine => {
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
    const config = vaccineConfig[vaccine.type];

    return (
      <View style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ position: 'absolute' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={config.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (percentage / 100) * circumference}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-xs font-bold" style={{ color: config.color }}>
            {Math.round(percentage)}%
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gradient-to-b from-blue-50 to-white">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header with Stats */}
      <View className="pt-12 pb-6 px-4">
        <Text className="text-2xl font-bold text-gray-800 mb-2">Vaccination Records</Text>
        <View className="flex-row justify-between">
          <View className="bg-white rounded-xl p-3 flex-1 mr-2 shadow-sm">
            <Text className="text-2xl font-bold text-green-600">{completionStats.completed}</Text>
            <Text className="text-xs text-gray-500">Completed Series</Text>
          </View>
          <View className="bg-white rounded-xl p-3 flex-1 mx-1 shadow-sm">
            <Text className="text-2xl font-bold text-blue-600">{completionStats.verified}</Text>
            <Text className="text-xs text-gray-500">Verified Records</Text>
          </View>
          <View className="bg-white rounded-xl p-3 flex-1 ml-2 shadow-sm">
            <Text className="text-2xl font-bold text-gray-600">{completionStats.total}</Text>
            <Text className="text-xs text-gray-500">Total Vaccines</Text>
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
          const completedCount = p.vaccines.filter(v => v.doses.length === v.totalDoses).length;
          
          return (
            <TouchableOpacity
              key={p.id}
              onPress={() => setSelectedIdx(index)}
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

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16 }}>
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
            const latestDose = vaccine.doses[vaccine.doses.length - 1];
            const allVerified = vaccine.doses.every(d => d.verified);
            const isExpanded = expandedVaccines.includes(vaccine.id);
            const completionPercentage = (vaccine.doses.length / vaccine.totalDoses) * 100;
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
                        {Array.from({ length: vaccine.totalDoses }, (_, i) => (
                          <View
                            key={i}
                            className={`w-3 h-3 rounded-full mr-1 ${
                              i < vaccine.doses.length 
                                ? 'border-2' 
                                : 'bg-gray-200'
                            }`}
                            style={{
                              backgroundColor: i < vaccine.doses.length ? config.color : '#e5e7eb',
                              borderColor: i < vaccine.doses.length ? config.color : 'transparent',
                            }}
                          />
                        ))}
                      </View>
                      <Text className="text-sm font-medium text-gray-600">
                        {vaccine.doses.length}/{vaccine.totalDoses} doses
                      </Text>
                    </View>

                    {/* Expanded dose details */}
                    {isExpanded && (
                      <View className="mt-4 space-y-3">
                        {vaccine.doses.map((dose, doseIndex) => (
                          <Animated.View
                            key={dose.doseNumber}
                            className="bg-gray-50 p-3 rounded-xl border border-gray-100"
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
                              <Text className="font-semibold text-gray-800">
                                Dose {dose.doseNumber}
                              </Text>
                              <View className="flex-row items-center">
                                {dose.verified ? (
                                  <View className="bg-green-100 rounded-full px-2 py-1">
                                    <Text className="text-xs font-medium text-green-700">
                                      ✓ Verified
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
                                <Text className="text-xs text-gray-700 font-medium">{dose.date}</Text>
                              </View>
                              <View className="flex-row">
                                <Text className="text-xs text-gray-500 w-16">Batch:</Text>
                                <Text className="text-xs text-gray-700 font-mono">{dose.batch}</Text>
                              </View>
                              <View className="flex-row">
                                <Text className="text-xs text-gray-500 w-16">Provider:</Text>
                                <Text className="text-xs text-gray-700">{dose.provider}</Text>
                              </View>
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
    </View>
  );
}
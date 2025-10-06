import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
  StatusBar,
  Animated,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import doctorApi, { Doctor, ApiError } from '../api/doctorApi';
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

export default function DoctorFinder() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique locations and specialties from doctors
  const getUniqueValues = (key: keyof Doctor): string[] => {
    const values = doctors.flatMap(doctor => 
      key === 'hospitals' ? doctor.hospitals : [doctor[key] as string]
    );
    return ['All', ...Array.from(new Set(values.filter(Boolean)))];
  };

  // Filter doctors based on search, location, and specialty
  const filterDoctors = () => {
    let filtered = doctors;

    // Search filter
    if (search.trim()) {
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(search.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Location filter
    if (selectedLocation !== 'All') {
      filtered = filtered.filter(doctor =>
        doctor.hospitals.some(hospital => 
          hospital.toLowerCase().includes(selectedLocation.toLowerCase())
        )
      );
    }

    // Specialty filter
    if (selectedSpecialty !== 'All') {
      filtered = filtered.filter(doctor =>
        doctor.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase())
      );
    }

    setFilteredDoctors(filtered);
  };

  // Fetch all doctors
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await doctorApi.getAllDoctors('');
      setDoctors(data);
      setFilteredDoctors(data);

      // Animate in results
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctor by ID for modal
  const fetchDoctorById = async (id: string) => {
    try {
      setLoading(true);
      const data = await doctorApi.getDoctorById(id);
      setSelectedDoctor(data);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle phone call
  const handlePhoneCall = (phoneNumber: string) => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.openURL(phoneUrl).catch(err => {
      console.error("Failed to open phone dialer:", err);
      alert('Could not open phone dialer.');
    });
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [search, selectedLocation, selectedSpecialty, doctors]);

  // Render filter chip
  const renderFilterChip = (
    label: string,
    value: string,
    selected: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selected && styles.filterChipSelected
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.filterChipText,
        selected && styles.filterChipTextSelected
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Render search and filters
  const renderSearchHeader = () => (
    <View style={styles.searchSection}>
      {/* Search Input with Filter Button */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={20} color="#64748B" style={{ marginRight: 12 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search centers, districts..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>
        
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter-outline" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          {/* Location Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>
              <Ionicons name="location-outline" size={18} color="#2563EB" /> Location
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterListContainer}
            >
              {getUniqueValues('hospitals').map((location) => (
                <View key={location}>
                  {renderFilterChip(
                    location,
                    location,
                    selectedLocation === location,
                    () => setSelectedLocation(location)
                  )}
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Specialty Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>
              <Ionicons name="medkit-outline" size={18} color="#2563EB" /> Specialty
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterListContainer}
            >
              {getUniqueValues('specialty').map((specialty) => (
                <View key={specialty}>
                  {renderFilterChip(
                    specialty,
                    specialty,
                    selectedSpecialty === specialty,
                    () => setSelectedSpecialty(specialty)
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found
        </Text>
        {(selectedLocation !== 'All' || selectedSpecialty !== 'All') && (
          <TouchableOpacity
            onPress={() => {
              setSelectedLocation('All');
              setSelectedSpecialty('All');
            }}
            style={styles.clearFilters}
          >
            <Ionicons name="close-circle-outline" size={16} color="#2563EB" />
            <Text style={styles.clearFiltersText}>× Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Render each doctor card
  const renderDoctorItem = ({ item }: { item: Doctor }) => (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })
          }]
        }
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.95}
        onPress={() => fetchDoctorById(item._id)}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            {item.imageUrls && item.imageUrls.length > 0 ? (
              <Image
                source={{ uri: item.imageUrls[0] }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>
            )}
          </View>

          <View style={styles.cardRight}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
                <Text style={styles.ratingValue}>{item.rating.toFixed(1)}</Text>
              </View>
            </View>

            <Text style={styles.cardSpecialty} numberOfLines={1}>{item.specialty}</Text>

            <View style={styles.cardInfo}>
              <View style={styles.infoItem}>
              <Ionicons name="business-outline" size={14} color="#64748B" style={{ marginRight: 8 }} />
                <Text style={styles.infoText} numberOfLines={1}>
                  {item.hospitals.slice(0, 2).join(', ')}
                  {item.hospitals.length > 2 && ` +${item.hospitals.length - 2} more`}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={14} color="#059669" style={{ marginRight: 8 }} />
                <Text style={styles.availabilityText} numberOfLines={1}>{item.availability}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderModalContent = () => {
    if (!selectedDoctor) return null;

    const { name, specialty, imageUrls, hospitals, rating, availability, doc990Link, phoneNumber } = selectedDoctor;

    const handleBookAppointment = () => {
      if (doc990Link) {
        Linking.openURL(doc990Link).catch(err => {
          console.error("Failed to open URL:", err);
          alert('Could not open the booking link.');
        });
      } else {
        alert('Booking link not available.');
      }
    };
    
    return (
      <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.modalContent}>
          {imageUrls && imageUrls.length > 0 && (
            <View style={styles.modalImageContainer}>
              <Image
                source={{ uri: imageUrls[0] }}
                style={styles.doctorImage}
                resizeMode="cover"
              />
            </View>
          )}

          <View style={styles.modalHeaderSection}>
            <Text style={styles.modalName}>{name}</Text>
            <View style={styles.specialtyBadge}>
              <Text style={styles.modalSpecialty}>{specialty}</Text>
            </View>
          </View>

          <View style={styles.modalInfoSection}>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="business-outline" size={20} color="#2563EB" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Hospitals</Text>
                  <Text style={styles.modalInfoText}>{hospitals.join(', ')}</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="star" size={20} color="#F59E0B" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Rating</Text>
                  <Text style={styles.modalInfoText}>{rating.toFixed(1)} out of 5</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.infoRow}
                onPress={() => handlePhoneCall(phoneNumber)}
              >
                <View style={styles.infoIconContainer}>
                  <Ionicons name="call-outline" size={20} color="#2563EB" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone Number</Text>
                  <Text style={styles.modalInfoTextClickable}>{phoneNumber}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="time-outline" size={20} color="#2563EB" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Availability</Text>
                  <Text style={styles.modalInfoText}>{availability}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.bookButton} onPress={handleBookAppointment}>
              <Ionicons name="calendar-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.bookButtonText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Doctor</Text>
        <Text style={styles.subtitle}>Discover healthcare professionals near you</Text>
      </View>

      {/* Search and Filters */}
      {renderSearchHeader()}

      {/* Refresh Button */}
      {loading && (
        <View style={styles.refreshContainer}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.refreshText}>Refreshing...</Text>
        </View>
      )}

      {/* Doctor List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredDoctors.length === 0 ? (
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>⚕</Text>
              <Text style={styles.emptyTitle}>No doctors found</Text>
              <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
            </View>
          )
        ) : (
          filteredDoctors.map((doctor) => (
            <View key={doctor._id}>
              {renderDoctorItem({ item: doctor })}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={!!selectedDoctor}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'formSheet'}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setSelectedDoctor(null)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}><Ionicons name="medkit-outline" size={18} color="#2563EB" /> Doctor Profile</Text>
            <View style={{ width: 32 }} />
          </View>

          {renderModalContent()}
        </SafeAreaView>
      </Modal>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={18} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              fetchDoctors();
            }}
          >
            <Text style={styles.retryText}>↻ Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header Styles
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },

  // Search Section
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
    color: '#64748B',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  filterToggle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: 24,
    color: '#2563EB',
    fontWeight: '600',
  },

  // Filters
  filtersContainer: {
    marginTop: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  filterScrollView: {
    flexGrow: 0,
  },
  filterListContainer: {
    paddingRight: 16,
  },
  filterChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },

  // Results Header
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  refreshContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
  },
  refreshText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  resultsCount: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  clearFilters: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },

  // List Styles
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },

  // Card Styles
  cardContainer: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardLeft: {
    marginRight: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  cardRight: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    marginRight: 4,
    color: '#F59E0B',
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  cardSpecialty: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '600',
    marginBottom: 12,
  },
  cardInfo: {
    gap: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 16,
    color: '#64748B',
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  availabilityText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    flex: 1,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#64748B',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    paddingBottom: 20,
  },
  modalImageContainer: {
    padding: 20,
    alignItems: 'center',
  },
  doctorImage: {
    width: width - 40,
    height: 240,
    borderRadius: 20,
    backgroundColor: '#2563EB',
  },
  modalHeaderSection: {
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  modalName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  specialtyBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalSpecialty: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  modalInfoSection: {
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalInfoIcon: {
    fontSize: 18,
    color: '#2563EB',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  modalInfoText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  modalInfoTextClickable: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  bookButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    color: '#94A3B8',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 120,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
    fontWeight: '500',
  },

  // Error Styles
  errorContainer: {
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
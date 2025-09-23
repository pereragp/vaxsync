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
} from 'react-native';
import doctorApi, { Doctor } from '../api/doctorApi';

const { width, height } = Dimensions.get('window');

export default function DoctorFinder() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Fetch all doctors or search query
  const fetchDoctors = async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await doctorApi.getAllDoctors(query);
      setDoctors(data);
      
      // Animate in results
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (err: any) {
      setError(err.message);
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors('');
  }, []);

  // Render search header
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Doctor</Text>
        <Text style={styles.subtitle}>Discover healthcare professionals near you</Text>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or specialty"
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => fetchDoctors(search)}
              returnKeyType="search"
            />
          </View>
        </View>
      </View>
    </View>
  );

  // Render each doctor card with enhanced design
  const renderDoctorItem = ({ item, index }: { item: Doctor; index: number }) => (
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
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
          </View>
          
          <View style={styles.cardRight}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingText}>⭐</Text>
                <Text style={styles.ratingValue}>{item.rating.toFixed(1)}</Text>
              </View>
            </View>
            
            <Text style={styles.cardSpecialty} numberOfLines={1}>{item.specialty}</Text>
            
            <View style={styles.cardInfo}>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>📍</Text>
                <Text style={styles.infoText} numberOfLines={1}>
                  {item.location} {item.distance ? `• ${item.distance}` : ''}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>🕒</Text>
                <Text style={styles.availabilityText} numberOfLines={1}>{item.availability}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.cardFooter}>
          <TouchableOpacity style={styles.viewProfileButton}>
            <Text style={styles.viewProfileText}>View Profile</Text>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  // Enhanced modal content using FlatList data structure
  const modalData = selectedDoctor ? [
    { type: 'image', data: selectedDoctor.imageUrl },
    { type: 'header', data: { name: selectedDoctor.name, specialty: selectedDoctor.specialty } },
    { type: 'info', data: selectedDoctor }
  ] : [];

  const renderModalItem = ({ item }: any) => {
    switch (item.type) {
      case 'image':
        return (
          <View style={styles.modalImageContainer}>
            <Image
              source={{ uri: item.data }}
              style={styles.doctorImage}
              resizeMode="cover"
            />
          </View>
        );
      
      case 'header':
        return (
          <View style={styles.modalHeaderSection}>
            <Text style={styles.modalName}>{item.data.name}</Text>
            <View style={styles.specialtyBadge}>
              <Text style={styles.modalSpecialty}>{item.data.specialty}</Text>
            </View>
          </View>
        );
      
      case 'info':
        return (
          <View style={styles.modalInfoSection}>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Text style={styles.modalInfoIcon}>📍</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.modalInfoText}>{item.data.location}</Text>
                </View>
              </View>
              
              {item.data.distance && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Text style={styles.modalInfoIcon}>🛣</Text>
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Distance</Text>
                    <Text style={styles.modalInfoText}>{item.data.distance}</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Text style={styles.modalInfoIcon}>⭐</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Rating</Text>
                  <Text style={styles.modalInfoText}>{item.data.rating.toFixed(1)} out of 5</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Text style={styles.modalInfoIcon}>🕒</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Availability</Text>
                  <Text style={styles.modalInfoText}>{item.data.availability}</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity style={styles.bookButton}>
              <Text style={styles.bookButtonText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <FlatList
        data={doctors}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        renderItem={renderDoctorItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👨‍⚕️</Text>
              <Text style={styles.emptyTitle}>No doctors found</Text>
              <Text style={styles.emptyText}>Try adjusting your search criteria</Text>
            </View>
          )
        )}
        refreshing={loading}
        onRefresh={() => fetchDoctors(search)}
      />

      {/* Enhanced Modal with FlatList */}
      <Modal 
        visible={!!selectedDoctor} 
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setSelectedDoctor(null)} 
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Doctor Profile</Text>
            <View style={{ width: 32 }} />
          </View>

          {selectedDoctor && (
            <FlatList
              data={modalData}
              keyExtractor={(item, index) => `modal-${index}`}
              renderItem={renderModalItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalContent}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchDoctors(search)}
          >
            <Text style={styles.retryText}>Retry</Text>
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
  headerContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  header: {
    padding: 20,
    paddingBottom: 24,
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
    marginBottom: 20,
  },
  searchContainer: {
    marginTop: 8,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  
  // List Styles
  listContainer: {
    paddingBottom: 20,
  },
  
  // Card Styles
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
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
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  cardSpecialty: {
    fontSize: 15,
    color: '#4F46E5',
    fontWeight: '600',
    marginBottom: 12,
  },
  cardInfo: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 16,
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
  cardFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  viewProfileButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  viewProfileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    marginRight: 8,
  },
  arrowIcon: {
    fontSize: 16,
    color: '#4F46E5',
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
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
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
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalSpecialty: {
    fontSize: 16,
    color: '#4F46E5',
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
  bookButton: {
    backgroundColor: '#4F46E5',
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
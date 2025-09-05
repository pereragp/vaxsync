import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { scheduleService, scheduleUtils, VaccinationSchedule } from '../api/scheduleApi';

// Icons as Text Components
const IconText = ({ name, size = 20, color = "#000", style }: any) => {
  const getIcon = (iconName: string) => {
    const icons: { [key: string]: string } = {
      'syringe': '💉',
      'refresh': '🔄',
      'chevron-down': '⌄',
      'chevron-up': '⌃',
      'calendar': '📅',
      'shield': '🛡',
      'check': '✓',
    };
    return icons[iconName] || '•';
  };

  return (
    <Text style={[{ fontSize: size, color }, style]}>
      {getIcon(name)}
    </Text>
  );
};

interface CompletedVaccine {
  id: string;
  vaccineName: string;
  dateAdministered: string;
  batchNumber?: string;
  administrator?: string;
  location?: string;
  notes?: string;
  doseNumber: number;
  totalDoses: number;
  certificateNumber?: string;
}

const DigitalVaccinationCardScreen = () => {
  // State management
  const [completedVaccines, setCompletedVaccines] = useState<CompletedVaccine[]>([]);
  const [schedules, setSchedules] = useState<VaccinationSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState<CompletedVaccine | null>(null);

  // Mock user info - in real app, this would come from user context
  const userInfo = {
    name: 'John Doe',
    dateOfBirth: '1990-05-15',
    id: 'ID123456789',
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load schedules to get completed doses
      const schedulesResponse = await scheduleService.getSchedules();
      const allSchedules = schedulesResponse.data || [];
      setSchedules(allSchedules);

      // Extract completed doses from schedules
      const completedDoses: CompletedVaccine[] = [];
      allSchedules.forEach(schedule => {
        schedule.doses.forEach(dose => {
          if (dose.status === 'completed') {
            completedDoses.push({
              id: `${schedule._id}-${dose.doseNumber}`,
              vaccineName: schedule.vaccineName,
              dateAdministered: dose.dateCompleted || dose.dateScheduled,
              batchNumber: `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
              administrator: schedule.healthcareProvider?.name || 'Unknown Provider',
              location: schedule.healthcareProvider?.facility || 'Unknown Facility',
              notes: dose.notes || schedule.notes,
              doseNumber: dose.doseNumber,
              totalDoses: schedule.totalDoses,
              certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            });
          }
        });
      });

      // Sort by date (most recent first)
      completedDoses.sort((a, b) => new Date(b.dateAdministered).getTime() - new Date(a.dateAdministered).getTime());
      setCompletedVaccines(completedDoses);
    } catch (error) {
      console.error('Error loading vaccination data:', error);
      Alert.alert('Error', 'Failed to load vaccination data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSyncHealthCard = async () => {
    try {
      setLoading(true);
      await scheduleService.syncHealthCard();
      Alert.alert('Success', 'Health card synced successfully!');
      await loadData(); // Reload data after sync
    } catch (error) {
      console.error('Error syncing health card:', error);
      Alert.alert('Error', 'Failed to sync health card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getVaccineIcon = (vaccineName: string) => {
    if (vaccineName.toLowerCase().includes('covid')) return '🦠';
    if (vaccineName.toLowerCase().includes('influenza') || vaccineName.toLowerCase().includes('flu')) return '🤧';
    if (vaccineName.toLowerCase().includes('hepatitis')) return '🩺';
    if (vaccineName.toLowerCase().includes('tetanus')) return '⚡';
    if (vaccineName.toLowerCase().includes('measles')) return '🔴';
    if (vaccineName.toLowerCase().includes('polio')) return '🦵';
    return '💉';
  };

  const renderVaccineCard = ({ item }: { item: CompletedVaccine }) => (
    <TouchableOpacity
      style={styles.vaccineCard}
      onPress={() => setSelectedVaccine(selectedVaccine?.id === item.id ? null : item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.vaccineInfo}>
          <Text style={styles.vaccineIcon}>{getVaccineIcon(item.vaccineName)}</Text>
          <View style={styles.vaccineDetails}>
            <Text style={styles.vaccineName}>{item.vaccineName}</Text>
            <Text style={styles.doseInfo}>
              Dose {item.doseNumber} of {item.totalDoses}
            </Text>
          </View>
        </View>
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>✓ COMPLETED</Text>
        </View>
      </View>
      
      <Text style={styles.dateText}>
        Administered: {scheduleUtils.formatDate(item.dateAdministered)}
      </Text>
      
      {selectedVaccine?.id === item.id && (
        <View style={styles.expandedDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Batch Number:</Text>
            <Text style={styles.detailValue}>{item.batchNumber || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Administrator:</Text>
            <Text style={styles.detailValue}>{item.administrator || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{item.location || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Certificate:</Text>
            <Text style={styles.detailValue}>{item.certificateNumber || 'N/A'}</Text>
          </View>
          
          {item.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes:</Text>
              <Text style={styles.detailValue}>{item.notes}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const calculateStats = () => {
    const totalVaccines = completedVaccines.length;
    const uniqueVaccines = new Set(completedVaccines.map(v => v.vaccineName)).size;
    const completedSeries = completedVaccines.filter(v => v.doseNumber === v.totalDoses).length;
    const yearsActive = completedVaccines.length > 0 ? 
      new Date().getFullYear() - new Date(completedVaccines[completedVaccines.length - 1]?.dateAdministered || '2024').getFullYear() + 1 : 1;

    return { totalVaccines, uniqueVaccines, completedSeries, yearsActive };
  };

  const stats = calculateStats();

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading vaccination data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Digital Vaccination Card</Text>
        <Text style={styles.subtitle}>Official Health Record</Text>
        <TouchableOpacity style={styles.syncButton} onPress={handleSyncHealthCard} disabled={loading}>
          <IconText name="refresh" size={16} color="white" />
          <Text style={styles.syncButtonText}>Sync Health Card</Text>
        </TouchableOpacity>
      </View>

      {/* User Information Card */}
      <View style={styles.userInfoCard}>
        <View style={styles.userInfoHeader}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{userInfo.name.charAt(0)}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{userInfo.name}</Text>
            <Text style={styles.userDetail}>DOB: {userInfo.dateOfBirth}</Text>
            <Text style={styles.userDetail}>ID: {userInfo.id}</Text>
          </View>
        </View>
        
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalVaccines}</Text>
            <Text style={styles.statLabel}>Total Doses</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.uniqueVaccines}</Text>
            <Text style={styles.statLabel}>Vaccines</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.completedSeries}</Text>
            <Text style={styles.statLabel}>Complete Series</Text>
          </View>
        </View>
      </View>

      {/* QR Code Placeholder */}
      <View style={styles.qrSection}>
        <Text style={styles.qrTitle}>Verification QR Code</Text>
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrText}>QR CODE</Text>
          <Text style={styles.qrSubtext}>Scan to verify vaccination status</Text>
        </View>
      </View>

      {/* Vaccination History */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Vaccination History</Text>
        <Text style={styles.sectionSubtitle}>Tap on any vaccine for more details</Text>
        
        {completedVaccines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconText name="syringe" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No completed vaccinations found</Text>
            <Text style={styles.emptySubtext}>Complete some vaccine doses to see them here</Text>
          </View>
        ) : (
          <FlatList
            data={completedVaccines}
            renderItem={renderVaccineCard}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.vaccineList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          This digital vaccination card contains official health records.
        </Text>
        <Text style={styles.footerSubtext}>
          Last updated: {new Date().toLocaleDateString()}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 16,
  },
  syncButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'center',
  },
  syncButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  userInfoCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
  },
  qrSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  qrText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
  },
  qrSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  historySection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  vaccineList: {
    paddingBottom: 20,
  },
  vaccineCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  vaccineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vaccineIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  vaccineDetails: {
    flex: 1,
  },
  vaccineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  doseInfo: {
    fontSize: 12,
    color: '#666',
  },
  completedBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  expandedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  footer: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
});

export default DigitalVaccinationCardScreen;
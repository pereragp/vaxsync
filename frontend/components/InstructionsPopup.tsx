import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface InstructionsPopupProps {
  visible: boolean;
  onClose: () => void;
  instructions: string;
  vaccineName: string;
  completedDoseNo: number;
  totalDoses: number;
  loading?: boolean;
}

const { width, height } = Dimensions.get('window');

export const InstructionsPopup: React.FC<InstructionsPopupProps> = ({
  visible,
  onClose,
  instructions,
  vaccineName,
  completedDoseNo,
  totalDoses,
  loading = false,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popupContainer}>
          <LinearGradient
            colors={['#3b82f6', '#1d4ed8']}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="checkmark-circle" size={32} color="white" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>Vaccination Complete!</Text>
                <Text style={styles.subtitle}>
                  {vaccineName} - Dose {completedDoseNo} of {totalDoses}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Asking Gemini AI... Please wait while response is generated</Text>
              </View>
            ) : (
              <View style={styles.instructionsContainer}>
                <View style={styles.instructionsHeader}>
                  <Ionicons name="medical" size={20} color="#3b82f6" />
                  <Text style={styles.instructionsTitle}>Post Vaccination Care Tips by AI</Text>
                </View>
                
                <View style={styles.instructionsBox}>
                  <Text style={styles.instructionsText}>{instructions}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupContainer: {
    width: width * 0.95,
    height: height * 0.85,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
  },
  instructionsContainer: {
    flex: 1,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  instructionsBox: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginBottom: 20,
    minHeight: 200,
  },
  instructionsText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#374151',
    textAlign: 'left',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  doneButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default InstructionsPopup;

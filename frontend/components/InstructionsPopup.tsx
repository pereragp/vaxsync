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

// Helper function to format AI-generated instructions
const formatInstructions = (text: string) => {
  if (!text) return null;

  const lines = text.split('\n').filter(line => line.trim());
  const formattedContent: JSX.Element[] = [];

  lines.forEach((line, index) => {
    let trimmedLine = line.trim();
    
    // Check if it's a markdown bold heading (**text**)
    const boldHeadingMatch = trimmedLine.match(/^\*\*(.*?)\*\*:?$/);
    if (boldHeadingMatch) {
      const headingText = boldHeadingMatch[1];
      formattedContent.push(
        <View key={index} style={styles.markdownHeadingContainer}>
          <LinearGradient
            colors={['#dbeafe', '#eff6ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.markdownHeadingGradient}
          >
            <View style={styles.markdownHeadingIconBadge}>
              <Ionicons name="clipboard" size={16} color="#3b82f6" />
            </View>
            <Text style={styles.markdownHeadingText}>{headingText}</Text>
          </LinearGradient>
        </View>
      );
      return;
    }
    
    // Check if it's a numbered list item
    if (/^\d+\./.test(trimmedLine)) {
      const [number, ...contentParts] = trimmedLine.split(/\.\s+/);
      let content = contentParts.join('. ');
      
      // Remove ** from content if present
      content = content.replace(/\*\*(.*?)\*\*/g, '$1');
      
      formattedContent.push(
        <View key={index} style={styles.numberedItem}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{number}</Text>
          </View>
          <Text style={styles.listItemText}>{content}</Text>
        </View>
      );
    }
    // Check if it's a bullet point (but not ** which is heading)
    else if ((trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) && !trimmedLine.startsWith('**')) {
      let content = trimmedLine.substring(1).trim();
      
      // Remove ** from content if present
      content = content.replace(/\*\*(.*?)\*\*/g, '$1');
      
      formattedContent.push(
        <View key={index} style={styles.bulletItem}>
          <View style={styles.bulletPoint} />
          <Text style={styles.listItemText}>{content}</Text>
        </View>
      );
    }
    // Check if it's a heading (all caps or ends with :)
    else if (trimmedLine === trimmedLine.toUpperCase() || trimmedLine.endsWith(':')) {
      formattedContent.push(
        <View key={index} style={styles.headingContainer}>
          <Text style={styles.headingText}>{trimmedLine.replace(':', '')}</Text>
        </View>
      );
    }
    // Regular paragraph
    else {
      // Remove ** from paragraph content if present
      trimmedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '$1');
      
      formattedContent.push(
        <Text key={index} style={styles.paragraphText}>
          {trimmedLine}
        </Text>
      );
    }
  });

  return <>{formattedContent}</>;
};

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
                <View style={styles.aiIconContainer}>
                  <LinearGradient
                    colors={['#8b5cf6', '#6366f1']}
                    style={styles.aiIconGradient}
                  >
                    <Ionicons name="sparkles" size={32} color="white" />
                  </LinearGradient>
                </View>
                <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 16 }} />
                <Text style={styles.loadingText}>Gemini AI is generating personalized care instructions...</Text>
                <View style={styles.loadingDots}>
                  <View style={[styles.dot, { backgroundColor: '#3b82f6' }]} />
                  <View style={[styles.dot, { backgroundColor: '#60a5fa' }]} />
                  <View style={[styles.dot, { backgroundColor: '#93c5fd' }]} />
                </View>
              </View>
            ) : (
              <View style={styles.instructionsContainer}>
                {/* AI Badge */}
                <View style={styles.aiBadge}>
                  <LinearGradient
                    colors={['#8b5cf6', '#6366f1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.aiBadgeGradient}
                  >
                    <Ionicons name="sparkles" size={16} color="white" />
                    <Text style={styles.aiBadgeText}>Powered by Gemini AI</Text>
                  </LinearGradient>
                </View>

                <View style={styles.instructionsHeader}>
                  <View style={styles.instructionsIconBadge}>
                    <Ionicons name="medical" size={24} color="#3b82f6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.instructionsTitle}>Post-Vaccination Care</Text>
                    <Text style={styles.instructionsSubtitle}>Personalized recommendations for you</Text>
                  </View>
                </View>
                
                {/* Formatted Instructions Content */}
                <View style={styles.instructionsBox}>
                  {formatInstructions(instructions)}
                </View>

                {/* Disclaimer */}
                <View style={styles.disclaimer}>
                  <Ionicons name="information-circle" size={18} color="#6b7280" />
                  <Text style={styles.disclaimerText}>
                    These are AI-generated suggestions. Always consult your healthcare provider for medical advice.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.doneButton}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="checkmark-circle" size={22} color="white" />
                <Text style={styles.doneButtonText}>Got it, Thanks!</Text>
              </View>
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
  aiIconContainer: {
    marginBottom: 8,
  },
  aiIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  instructionsContainer: {
    flex: 1,
  },
  aiBadge: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  aiBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  instructionsIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  instructionsSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  instructionsBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  numberedItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  numberText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginRight: 12,
    marginTop: 8,
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
  },
  markdownHeadingContainer: {
    marginTop: 20,
    marginBottom: 12,
  },
  markdownHeadingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bfdbfe',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  markdownHeadingIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  markdownHeadingText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e40af',
    flex: 1,
    letterSpacing: 0.3,
  },
  headingContainer: {
    marginTop: 16,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  headingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0.5,
  },
  paragraphText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4b5563',
    marginBottom: 12,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#92400e',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  doneButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
  },
});

export default InstructionsPopup;

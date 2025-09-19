// Health Card API service for connecting to backend
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export interface HealthCardVaccination {
  vaccineName: string;
  manufacturer: string;
  batchNumber: string;
  doseNumber: number;
  totalDoses: number;
  dateScheduled: Date | string;
  administeredBy: string;
  facility: string;
  certificateNumber: string;
  nextDueDate?: Date | string;
}

export interface HealthCardUserInfo {
  fullName: string;
  dateOfBirth: Date | string;
  profilePicture?: string;
  bloodType?: string;
  emergencyContact?: {
    name: string;
    phone: string;
  };
}

export interface HealthCardStatistics {
  totalVaccinations: number;
  lastVaccinationDate?: Date | string;
  upcomingVaccinations: number;
  complianceScore: number;
}

export interface HealthCard {
  _id: string;
  cardId: string;
  userId: string;
  cardNumber: string;
  issuedDate: Date | string;
  lastUpdated: Date | string;
  status: 'active' | 'inactive';
  userInfo: HealthCardUserInfo;
  completedVaccinations: HealthCardVaccination[];
  statistics: HealthCardStatistics;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface HealthCardStats {
  statistics: HealthCardStatistics & {
    upcomingVaccinations: number;
    cardStatus: string;
    cardAge: number;
    recentVaccinations: HealthCardVaccination[];
  };
  upcomingVaccinations: any[];
}

class HealthCardAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/health-card`;
  }

  // Get user's digital health card
  async getHealthCard(userId: string): Promise<HealthCard> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<{ healthCard: HealthCard }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch health card');
      }

      return result.data!.healthCard;
    } catch (error) {
      console.error('Error fetching health card:', error);
      throw error;
    }
  }

  // Update health card with latest vaccination data
  async updateHealthCard(userId: string): Promise<HealthCard> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<{ healthCard: HealthCard }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update health card');
      }

      return result.data!.healthCard;
    } catch (error) {
      console.error('Error updating health card:', error);
      throw error;
    }
  }

  // Get health card by card ID (for verification/sharing)
  async getHealthCardByCardId(cardId: string): Promise<Partial<HealthCard>> {
    try {
      const response = await fetch(`${this.baseUrl}/card/${cardId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<{ healthCard: Partial<HealthCard> }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch health card');
      }

      return result.data!.healthCard;
    } catch (error) {
      console.error('Error fetching health card by ID:', error);
      throw error;
    }
  }

  // Get health card statistics
  async getHealthCardStats(userId: string): Promise<HealthCardStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<HealthCardStats> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch health card statistics');
      }

      return result.data!;
    } catch (error) {
      console.error('Error fetching health card statistics:', error);
      throw error;
    }
  }

  // Update user info on health card
  async updateUserInfo(
    userId: string, 
    userInfo: {
      fullName?: string;
      bloodType?: string;
      emergencyContact?: {
        name: string;
        phone: string;
      };
      profilePicture?: string;
    }
  ): Promise<HealthCard> {
    try {
      const response = await fetch(`${this.baseUrl}/user-info/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userInfo),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<{ healthCard: HealthCard }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update user info');
      }

      return result.data!.healthCard;
    } catch (error) {
      console.error('Error updating user info:', error);
      throw error;
    }
  }

  // Helper method to transform backend vaccination data to frontend format
  transformVaccinationData(backendVaccination: HealthCardVaccination): {
    id: string;
    name: string;
    doses: Array<{
      doseNumber: number;
      date: string;
      batch: string;
      provider: string;
      verified: boolean;
    }>;
    totalDoses: number;
    type: 'routine' | 'travel' | 'occupational' | 'emergency';
    icon: string;
  } {
    // Map vaccine names to types (you can expand this mapping)
    const vaccineTypeMap: { [key: string]: 'routine' | 'travel' | 'occupational' | 'emergency' } = {
      'BCG': 'routine',
      'Hepatitis B': 'routine',
      'Polio': 'routine',
      'DPT': 'routine',
      'MMR': 'routine',
      'Yellow Fever': 'travel',
      'Typhoid': 'travel',
      'COVID-19': 'emergency',
      'Influenza': 'routine',
      'Tetanus': 'occupational'
    };

    const type = vaccineTypeMap[backendVaccination.vaccineName] || 'routine';
    const iconMap = {
      routine: 'shield-checkmark',
      travel: 'airplane',
      occupational: 'briefcase',
      emergency: 'medical'
    };

    return {
      id: backendVaccination.certificateNumber,
      name: backendVaccination.vaccineName,
      doses: [{
        doseNumber: backendVaccination.doseNumber,
        date: new Date(backendVaccination.dateScheduled).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        batch: backendVaccination.batchNumber,
        provider: backendVaccination.facility,
        verified: true // Backend vaccinations are considered verified
      }],
      totalDoses: backendVaccination.totalDoses,
      type,
      icon: iconMap[type]
    };
  }

  // Delete a specific vaccination
  async deleteVaccination(userId: string, vaccinationId: string): Promise<HealthCard> {
    try {
      const response = await fetch(`${this.baseUrl}/vaccination/${userId}/${vaccinationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<{ healthCard: HealthCard; deletedVaccinationId: string }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete vaccination');
      }

      return result.data!.healthCard;
    } catch (error) {
      console.error('Error deleting vaccination:', error);
      throw error;
    }
  }

  // Delete multiple vaccinations
  async deleteMultipleVaccinations(userId: string, vaccinationIds: string[]): Promise<HealthCard> {
    try {
      const response = await fetch(`${this.baseUrl}/vaccinations/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vaccinationIds }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<{ healthCard: HealthCard; deletedCount: number; deletedVaccinationIds: string[] }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete vaccinations');
      }

      return result.data!.healthCard;
    } catch (error) {
      console.error('Error deleting multiple vaccinations:', error);
      throw error;
    }
  }

  // Helper method to group vaccinations by vaccine name
  groupVaccinationsByName(vaccinations: HealthCardVaccination[]): Array<{
    id: string;
    name: string;
    doses: Array<{
      doseNumber: number;
      date: string;
      batch: string;
      provider: string;
      verified: boolean;
    }>;
    totalDoses: number;
    type: 'routine' | 'travel' | 'occupational' | 'emergency';
    icon: string;
  }> {
    const grouped = vaccinations.reduce((acc, vaccination) => {
      const name = vaccination.vaccineName;
      if (!acc[name]) {
        acc[name] = [];
      }
      acc[name].push(vaccination);
      return acc;
    }, {} as { [key: string]: HealthCardVaccination[] });

    return Object.entries(grouped).map(([name, vaccinationGroup]) => {
      const firstVaccination = vaccinationGroup[0];
      const transformed = this.transformVaccinationData(firstVaccination);
      
      return {
        ...transformed,
        id: name.toLowerCase().replace(/\s+/g, '-'),
        doses: vaccinationGroup.map(v => ({
          doseNumber: v.doseNumber,
          date: new Date(v.dateScheduled).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),
          batch: v.batchNumber,
          provider: v.facility,
          verified: true
        })).sort((a, b) => a.doseNumber - b.doseNumber)
      };
    });
  }

  // Send vaccine completion notification with AI instructions
  async sendVaccineInstructions(userId: string, vaccinationId?: string): Promise<{
    vaccinationRecord: any;
    instructions: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/instructions/${userId}/${vaccinationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<{
        vaccinationRecord: any;
        instructions: string;
      }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to send vaccine instructions');
      }

      return result.data!;
    } catch (error) {
      console.error('Error sending vaccine instructions:', error);
      throw error;
    }
  }

  // Get AI-generated instructions for a specific vaccination (alias method)
  async getVaccineInstructions(userId: string, vaccinationId: string): Promise<{
    vaccinationRecord: any;
    instructions: string;
  }> {
    // Use the same method as sendVaccineInstructions
    return await this.sendVaccineInstructions(userId, vaccinationId);
  }
}

export default new HealthCardAPI();

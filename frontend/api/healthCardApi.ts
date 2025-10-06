const API_BASE_URL = "http://192.168.1.32:5000"; //Pramod URL
//const API_BASE_URL = 'http://192.168.1.32:5000/api/users'; // Mishen URL

// Helper function to get authentication token
const getAuthToken = async (): Promise<string | null> => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem('userToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

// Types for Health Card API
export interface HealthCardVaccination {
  vaccineName: string;
  manufacturer?: string;
  doseNumber: number;
  totalDoses: number;
  dateCompleted: Date;
  administeredBy?: string;
  facility?: string;
  certificateNumber?: string;
  notes?: string;
  vaccinationType?: "routine" | "travel" | "occupational" | "emergency";
  status?: "completed" | "cancelled";
}

export interface HealthCard {
  _id: string;
  fullName: string;
  gender: string;
  dateOfBirth: Date;
  userId?: string;
  dependentId?: string;
  cardType: "user" | "dependent";
  dependents?: {
    _id: string;
    dependentId: string;
    fullName: string;
    dateOfBirth: Date;
    gender: string;
    dependentType: string;
  }[];
  completedVaccinations?: HealthCardVaccination[];
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthCardResponse {
  message: string;
  healthCard: HealthCard;
}

export interface AllHealthCardsResponse {
  message: string;
  healthCards: HealthCard[];
  count: number;
}

// Health Card API service
const healthCardAPI = {
  // Get health card by user ID
  async getHealthCard(userId: string): Promise<HealthCard> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/health-card/user/${userId}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch health card: ${response.statusText}`);
    }
    const data: HealthCardResponse = await response.json();
    return data.healthCard;
  },

  // Get health card by dependent ID
  async getDependentHealthCard(dependentId: string): Promise<HealthCard> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/health-card/dependent/${dependentId}`
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch dependent health card: ${response.statusText}`
      );
    }
    const data: HealthCardResponse = await response.json();
    return data.healthCard;
  },

  // Get all health cards for a user and their dependents
  async getAllHealthCards(): Promise<HealthCard[]> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/health-card/all`
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch all health cards: ${response.statusText}`
      );
    }
    const data: AllHealthCardsResponse = await response.json();
    return data.healthCards;
  },

  // Sync completed vaccines from schedule to health cards
  async syncVaccines(userId: string): Promise<any> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/health-card/sync-vaccines/${userId}`,
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to sync vaccines: ${response.statusText}`);
    }
    return await response.json();
  },

  // Create health card for user
  async createUserHealthCard(userId: string): Promise<HealthCard> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/health-card/create/user/${userId}`,
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      throw new Error(
        `Failed to create user health card: ${response.statusText}`
      );
    }
    const data: HealthCardResponse = await response.json();
    return data.healthCard;
  },

  // Create health card for dependent
  async createDependentHealthCard(dependentId: string): Promise<HealthCard> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/health-card/create/dependent/${dependentId}`,
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      throw new Error(
        `Failed to create dependent health card: ${response.statusText}`
      );
    }
    const data: HealthCardResponse = await response.json();
    return data.healthCard;
  },

  // Create all health cards for user and dependents
  async createAllHealthCards(userId: string): Promise<any> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/health-card/create/all/${userId}`,
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      throw new Error(
        `Failed to create all health cards: ${response.statusText}`
      );
    }
    return await response.json();
  },

  // Delete a specific vaccination from health card
  async deleteVaccination(
    cardId: string,
    vaccineName: string,
    doseNumber: number
  ): Promise<any> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/health-card/delete-vaccination/${cardId}/${encodeURIComponent(
        vaccineName
      )}/${doseNumber}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(`Failed to delete vaccination: ${errorMessage}`);
    }

    return await response.json();
  },

  // Download vaccination certificate as PDF
  async downloadVaccinationCertificate(cardId: string): Promise<Blob> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/health-card/download-certificate/${cardId}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(`Failed to download certificate: ${errorMessage}`);
    }

    return await response.blob();
  },

  // Group vaccinations by vaccine name for UI display
  groupVaccinationsByName(vaccinations: HealthCardVaccination[]): any[] {
    const grouped: { [key: string]: any } = {};

    vaccinations.forEach((vaccination, idx) => {
      const key = vaccination.vaccineName;
      if (!grouped[key]) {
        grouped[key] = {
          id: `${key.toLowerCase().replace(/\s+/g, "-")}-${idx}`,
          name: vaccination.vaccineName,
          doses: [],
          totalDoses: vaccination.totalDoses,
          type:
            vaccination.vaccinationType ||
            this.getVaccineType(vaccination.vaccineName),
          icon: this.getVaccineIcon(vaccination.vaccineName),
          manufacturer: vaccination.manufacturer,
        };
      }

      // Check if dose already exists (prevent duplicates)
      const doseExists = grouped[key].doses.some((d: any) => d.doseNumber === vaccination.doseNumber);
      
      if (!doseExists) {
      grouped[key].doses.push({
        doseNumber: vaccination.doseNumber,
        date: vaccination.dateCompleted, // Keep as ISO string or Date object for proper parsing
        batch: vaccination.certificateNumber || "N/A",
        provider: vaccination.administeredBy || "Unknown",
        verified: vaccination.status !== 'cancelled', // Cancelled doses are not verified
        facility: vaccination.facility,
        notes: vaccination.notes,
        status: vaccination.status || 'completed', // Default to completed for backward compatibility
      });
      }
    });

    return Object.values(grouped);
  },

  // Helper function to determine vaccine type
  getVaccineType(
    vaccineName: string
  ): "routine" | "travel" | "occupational" | "emergency" {
    const name = vaccineName.toLowerCase();
    if (
      name.includes("travel") ||
      name.includes("yellow fever") ||
      name.includes("typhoid")
    ) {
      return "travel";
    }
    if (
      name.includes("hepatitis") ||
      name.includes("tetanus") ||
      name.includes("influenza")
    ) {
      return "occupational";
    }
    if (name.includes("covid")) {
      return "routine"; // COVID-19 vaccines use routine (green) color
    }
    if (name.includes("emergency")) {
      return "emergency";
    }
    return "routine";
  },

  // Helper function to get vaccine icon
  getVaccineIcon(vaccineName: string): string {
    const name = vaccineName.toLowerCase();
    if (name.includes("covid")) return "medical";
    if (name.includes("hepatitis")) return "heart";
    if (name.includes("flu") || name.includes("influenza")) return "snow";
    if (
      name.includes("measles") ||
      name.includes("mumps") ||
      name.includes("rubella")
    )
      return "thermometer";
    return "shield-checkmark";
  },
};

export default healthCardAPI;

// Simple API service to fetch user data from backend for testing
//<<<<<<< devMikki
// const API_BASE_URL = 'http://192.168.1.32:5000/api/users'; // Using same URL as healthCardApi
//const API_BASE_URL = 'http://172.20.10.2:5000/api/users'; // Mishen URL
//=======
//const API_BASE_URL = 'http://172.20.10.2:5000/api/users'; // Using same URL as healthCardApi
//>>>>>>> mergeAll

export interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  avatar?: string;
  dependents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Dependent {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  dependentType: string;
  guardianId: string;
  createdAt: string;
  updatedAt: string;
}

class UserAPI {
  private async makeRequest<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User> {
    const userData = await this.makeRequest<any>(`/${userId}`);
    
    // Transform backend response to match our User interface
    return {
      _id: userData._id,
      username: userData.username || 'unknown',
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender,
      phone: userData.phone,
      avatar: userData.avatar || '',
      dependents: userData.dependents || [],
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString()
    };
  }

  // Get dependents by guardian ID
  async getDependents(guardianId: string): Promise<Dependent[]> {
    try {
      const response = await this.makeRequest<any>(`/dependents/${guardianId}`);
      return response.dependents || [];
    } catch (error) {
      console.log('No dependents endpoint available, returning empty array');
      return [];
    }
  }
}

export default new UserAPI();

import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://192.168.1.32:5000/api/users"; // Pramod URL

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
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

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

  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getStoredToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    return this.makeRequest<T>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private async getStoredToken(): Promise<string | null> {
    // For React Native with AsyncStorage
    try {
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      return await AsyncStorage.getItem("userToken");
    } catch (error) {
      console.error("Error getting stored token:", error);
      return null;
    }
  }

  //Login Method
  async login(email: string, password: string): Promise<any> {
    return this.makeRequest<any>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  //Register Method
  async register(userData: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
  }): Promise<any> {
    return this.makeRequest<any>("/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  //Logout Method
  async logout(): Promise<void> {
    try {
      //backend logout endpoint
      await this.makeAuthenticatedRequest<any>("/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Error while logging out: ", error);
    } finally {
      try {
        await AsyncStorage.removeItem("userToken");
      } catch (error) {
        console.error("Error removing token from storage: ", error);
      }
    }
  }

  // Get current user's profile (protected route)
  async getCurrentUser(): Promise<User> {
    const userData = await this.makeAuthenticatedRequest<any>("/profile");

    // Transform backend response to match our User interface
    return {
      _id: userData._id,
      username: userData.username || "unknown",
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender,
      phone: userData.phone,
      avatar: userData.avatar || "",
      dependents: userData.dependents || [],
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString(),
    };
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User> {
    const userData = await this.makeRequest<any>(`/${userId}`);

    // Transform backend response to match our User interface
    return {
      _id: userData._id,
      username: userData.username || "unknown",
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender,
      phone: userData.phone,
      avatar: userData.avatar || "",
      dependents: userData.dependents || [],
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString(),
    };
  }

  // Get dependents by guardian ID
  async getDependents(guardianId: string): Promise<Dependent[]> {
    try {
      const response = await this.makeAuthenticatedRequest<any>(
        `/dependents/${guardianId}`
      );
      return response.dependents || [];
    } catch (error) {
      console.log(
        "No dependents endpoint available, returning empty array",
        error
      );
      return [];
    }
  }
}

export default new UserAPI();

import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://192.168.1.3:5000/api/users"; // Pramod URL

export interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
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
        // eslint-disable-next-line @typescript-eslint/no-require-imports
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
    bloodType: string;
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
      bloodType: userData.bloodType || "",
      phone: userData.phone,
      avatar: userData.avatar || "",
      dependents: userData.dependents || [],
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString(),
    };
  }

  //Update user profile
  async updateProfile(profileData: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
    bloodType?: string;
    phone?: string;
  }): Promise<User> {
    const response = await this.makeAuthenticatedRequest<any>(
      "/profile/update",
      {
        method: "PUT",
        body: JSON.stringify(profileData),
      }
    );

    //Match backend response to UI
    return {
      _id: response.user._id,
      username: response.user.username || "unknown",
      firstName: response.user.firstName,
      lastName: response.user.lastName,
      email: response.user.email,
      dateOfBirth: response.user.dateOfBirth,
      gender: response.user.gender,
      bloodType: response.user.bloodType || "",
      phone: response.user.phone,
      avatar: response.user.avatar || "",
      dependents: response.user.dependents || [],
      createdAt: response.user.createdAt || new Date().toISOString(),
      updatedAt: response.user.updatedAt || new Date().toISOString(),
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
      bloodType: userData.bloodType || "",
      phone: userData.phone,
      avatar: userData.avatar || "",
      dependents: userData.dependents || [],
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString(),
    };
  }

  //Add new dependent
  async addDependent(dependentData: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    dependentType: string;
    guardianId: string;
  }): Promise<Dependent> {
    try {
      const response = await this.makeAuthenticatedRequest<any>(
        "/new-dependent",
        {
          method: "POST",
          body: JSON.stringify(dependentData),
        }
      );
      return response.dependent;
    } catch (error) {
      console.error("Error adding dependent: ", error);
      throw error;
    }
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

  // Remove dependent
  async removeDependent(
    guardianId: string,
    dependentId: string
  ): Promise<void> {
    try {
      await this.makeAuthenticatedRequest<any>(
        `/dependents/${guardianId}/${dependentId}`,
        {
          method: "DELETE",
        }
      );
    } catch (error) {
      console.error("Error removing dependent: ", error);
      throw error;
    }
  }
}

export default new UserAPI();

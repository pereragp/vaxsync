const BASE_URL = 'http://localhost:5000/api/v1/schedule';

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Vaccine {
  _id: string;
  vaccineId: string;
  name: string;
  description: string;
  manufacturer: string;
  type: 'routine' | 'travel' | 'emergency' | 'seasonal';
  ageGroups: {
    minAge: number;
    maxAge: number;
    doses: number;
    interval: number;
  }[];
  sideEffects: string[];
  contraindications: string[];
  isActive: boolean;
  createdAt: string;
}

export interface VaccinationSchedule {
  _id: string;
  recordId: string;
  userId: string;
  vaccineId?: string;
  vaccineName: string;
  totalDoses: number;
  interval: number;
  doses: {
    doseNumber: number;
    dateScheduled: string;
    dateCompleted?: string;
    status: 'scheduled' | 'completed' | 'missed' | 'cancelled';
    notes?: string;
  }[];
  overallStatus: 'in_progress' | 'completed' | 'cancelled';
  healthcareProvider: {
    name: string;
    facility: string;
    contact: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleRequest {
  // For suggested vaccines
  vaccineId?: string;
  
  // For manual entry
  vaccineName?: string;
  manufacturer?: string;
  totalDoses?: number;
  interval?: number;
  
  // Common fields
  dateScheduled: string;
  notes?: string;
  healthcareProvider?: {
    name?: string;
    facility?: string;
    contact?: string;
  };
}

export interface UpdateScheduleRequest {
  notes?: string;
  healthcareProvider?: {
    name?: string;
    facility?: string;
    contact?: string;
  };
}

export interface UpdateDoseStatusRequest {
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled';
  notes?: string;
  dateCompleted?: string;
}

export interface GetVaccinesParams {
  page?: number;
  limit?: number;
  type?: 'routine' | 'travel' | 'emergency' | 'seasonal';
  search?: string;
}

export interface GetSchedulesParams {
  page?: number;
  limit?: number;
  status?: 'scheduled' | 'completed' | 'missed' | 'cancelled';
  vaccineName?: string;
}

export interface GetUpcomingSchedulesParams {
  days?: number;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  // In a real app, you'd get this from secure storage
  return localStorage.getItem('authToken') || null;
};

// Helper function to make API requests
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Vaccine API functions
export const vaccineApi = {
  /**
   * Get all available vaccines
   */
  getVaccines: async (params: GetVaccinesParams = {}): Promise<ApiResponse<Vaccine[]>> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.type) queryParams.append('type', params.type);
    if (params.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    return apiRequest<Vaccine[]>(`/vaccines${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get specific vaccine by ID
   */
  getVaccineById: async (vaccineId: string): Promise<ApiResponse<Vaccine>> => {
    return apiRequest<Vaccine>(`/vaccines/${vaccineId}`);
  },
};

// Schedule API functions
export const scheduleApi = {
  /**
   * Create vaccination schedule (supports both suggested vaccines and manual entry)
   */
  createSchedule: async (
    data: CreateScheduleRequest
  ): Promise<ApiResponse<{ schedules: VaccinationSchedule[]; vaccine: any }>> => {
    return apiRequest('/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get user's vaccination schedules
   */
  getSchedules: async (params: GetSchedulesParams = {}): Promise<ApiResponse<VaccinationSchedule[]>> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.vaccineName) queryParams.append('vaccineName', params.vaccineName);
    
    const queryString = queryParams.toString();
    return apiRequest<VaccinationSchedule[]>(`${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get specific vaccination schedule by ID
   */
  getScheduleById: async (scheduleId: string): Promise<ApiResponse<VaccinationSchedule>> => {
    return apiRequest<VaccinationSchedule>(`/${scheduleId}`);
  },

  /**
   * Get upcoming vaccination schedules
   */
  getUpcomingSchedules: async (
    params: GetUpcomingSchedulesParams = {}
  ): Promise<ApiResponse<VaccinationSchedule[]>> => {
    const queryParams = new URLSearchParams();
    
    if (params.days) queryParams.append('days', params.days.toString());
    
    const queryString = queryParams.toString();
    return apiRequest<VaccinationSchedule[]>(`/upcoming${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Update vaccination schedule
   */
  updateSchedule: async (
    scheduleId: string,
    data: UpdateScheduleRequest
  ): Promise<ApiResponse<VaccinationSchedule>> => {
    return apiRequest<VaccinationSchedule>(`/${scheduleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update individual dose status
   */
  updateDoseStatus: async (
    scheduleId: string,
    doseNumber: number,
    data: UpdateDoseStatusRequest
  ): Promise<ApiResponse<{ schedule: VaccinationSchedule; updatedDose: any }>> => {
    return apiRequest(`/${scheduleId}/dose/${doseNumber}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete vaccination schedule
   */
  deleteSchedule: async (scheduleId: string): Promise<ApiResponse<VaccinationSchedule>> => {
    return apiRequest<VaccinationSchedule>(`/${scheduleId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Sync all completed doses to health card
   */
  syncHealthCard: async (): Promise<ApiResponse<{ syncedCount: number }>> => {
    return apiRequest<{ syncedCount: number }>('/sync-health-card', {
      method: 'POST',
    });
  },
};

// Combined API object for easy imports
export const scheduleService = {
  ...vaccineApi,
  ...scheduleApi,
};

// Utility functions
export const scheduleUtils = {
  /**
   * Format date for display
   */
  formatDate: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  /**
   * Format date and time for display
   */
  formatDateTime: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /**
   * Get status color for UI
   */
  getStatusColor: (status: string): string => {
    switch (status) {
      case 'scheduled':
        return '#3b82f6'; // blue
      case 'completed':
        return '#10b981'; // green
      case 'missed':
        return '#ef4444'; // red
      case 'cancelled':
        return '#6b7280'; // gray
      default:
        return '#6b7280';
    }
  },

  /**
   * Get status icon for UI
   */
  getStatusIcon: (status: string): string => {
    switch (status) {
      case 'scheduled':
        return '📅';
      case 'completed':
        return '✅';
      case 'missed':
        return '❌';
      case 'cancelled':
        return '🚫';
      default:
        return '❓';
    }
  },

  /**
   * Check if schedule is overdue
   */
  isOverdue: (dateScheduled: string, status: string): boolean => {
    if (status !== 'scheduled') return false;
    const scheduledDate = new Date(dateScheduled);
    const now = new Date();
    return scheduledDate < now;
  },

  /**
   * Get days until scheduled date
   */
  getDaysUntil: (dateScheduled: string): number => {
    const scheduledDate = new Date(dateScheduled);
    const now = new Date();
    const diffTime = scheduledDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Get overall status color for UI
   */
  getOverallStatusColor: (status: string): string => {
    switch (status) {
      case 'in_progress':
        return '#3b82f6'; // blue
      case 'completed':
        return '#10b981'; // green
      case 'cancelled':
        return '#6b7280'; // gray
      default:
        return '#6b7280';
    }
  },

  /**
   * Get overall status icon for UI
   */
  getOverallStatusIcon: (status: string): string => {
    switch (status) {
      case 'in_progress':
        return '🔄';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '🚫';
      default:
        return '❓';
    }
  },

  /**
   * Get progress percentage for a schedule
   */
  getProgressPercentage: (schedule: VaccinationSchedule): number => {
    const completedDoses = schedule.doses.filter(dose => dose.status === 'completed').length;
    return Math.round((completedDoses / schedule.totalDoses) * 100);
  },

  /**
   * Get next due dose for a schedule
   */
  getNextDueDose: (schedule: VaccinationSchedule) => {
    return schedule.doses.find(dose => dose.status === 'scheduled');
  },
};

export default scheduleService;

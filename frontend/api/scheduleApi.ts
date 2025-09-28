// Schedule API service for connecting to backend
//const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.2:5000';
//<<<<<<< devMikki
//const API_BASE_URL = 'http://172.20.10.2:5000/api/users'; // Mishen URL
//=======
//>>>>>>> mergeAll

// Types for Schedule API
export interface VaccineDose {
  doseNumber: number;
  dateScheduled: Date;
  dateCompleted?: Date;
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled';
  notes?: string;
}

export interface VaccineSchedule {
  _id: string;
  recordId: string;
  userId: string;
  dependentIds?: string[];
  vaccineId?: string;
  vaccineName: string;
  totalDoses: number;
  interval: number;
  doses: VaccineDose[];
  overallStatus: 'in_progress' | 'completed' | 'cancelled';
  vaccinationType?: 'routine' | 'travel' | 'occupational' | 'emergency';
  healthcareProvider?: {
    name?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Populated fields
  vaccine?: {
    _id: string;
    name: string;
    manufacturer?: string;
    type: 'routine' | 'travel' | 'emergency' | 'seasonal';
  };
  dependents?: {
    _id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: string;
    dependentType: string;
  }[];
}

export interface CreateScheduleRequest {
  vaccineId?: string;
  vaccineName?: string;
  totalDoses: number;
  interval: number;
  dependentId?: string;
  healthcareProvider?: string;
  notes?: string;
  scheduleDate?: string; // ISO date string for the first dose
  vaccinationType?: 'routine' | 'travel' | 'occupational' | 'emergency';
}

export interface UpdateDoseRequest {
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled';
  dateCompleted?: string;
  notes?: string;
}

export interface ScheduleResponse {
  success: boolean;
  message: string;
  data: VaccineSchedule;
}

export interface SchedulesResponse {
  success: boolean;
  message: string;
  data: VaccineSchedule[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Vaccine types
export interface Vaccine {
  _id: string;
  vaccineId: string;
  name: string;
  description: string;
  manufacturer?: string;
  type: 'routine' | 'travel' | 'emergency' | 'seasonal';
  targetPopulation: 'all' | 'female' | 'male' | 'pregnant';
  ageGroups?: {
    minAge: number;
    maxAge: number;
    doses: number;
    interval: number;
  }[];
  doseSchedule?: {
    pregnancyNumber: number;
    doseNumber: number;
    weeksAfterPOA?: number;
    weeksAfterPreviousDose?: number;
  }[];
  sideEffects?: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface VaccinesResponse {
  success: boolean;
  message: string;
  data: Vaccine[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Schedule API service
const scheduleAPI = {
  // Get all vaccine schedules for user and dependents
  async getAllSchedules(params?: {
    page?: number;
    limit?: number;
    dependentId?: string;
    overallStatus?: string;
    vaccineName?: string;
  }): Promise<{ schedules: VaccineSchedule[]; pagination?: any }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.dependentId) queryParams.append('dependentId', params.dependentId);
    if (params?.overallStatus) queryParams.append('overallStatus', params.overallStatus);
    if (params?.vaccineName) queryParams.append('vaccineName', params.vaccineName);

    const url = `${API_BASE_URL}/api/v1/schedule${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch schedules: ${response.statusText}`);
    }
    
    const data: SchedulesResponse = await response.json();
    return {
      schedules: data.data,
      pagination: data.pagination
    };
  },

  // Create new vaccine schedule
  async createSchedule(scheduleData: CreateScheduleRequest): Promise<VaccineSchedule> {
    const response = await fetch(`${API_BASE_URL}/api/v1/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create schedule: ${response.statusText}`);
    }
    
    const data: ScheduleResponse = await response.json();
    return data.data;
  },

  // Update vaccine schedule
  async updateSchedule(scheduleId: string, updateData: Partial<VaccineSchedule>): Promise<VaccineSchedule> {
    const response = await fetch(`${API_BASE_URL}/api/v1/schedule/${scheduleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update schedule: ${response.statusText}`);
    }
    
    const data: ScheduleResponse = await response.json();
    return data.data;
  },

  // Update dose status
  async updateDoseStatus(scheduleId: string, doseNumber: number, doseData: UpdateDoseRequest): Promise<VaccineSchedule> {
    const response = await fetch(`${API_BASE_URL}/api/v1/schedule/${scheduleId}/doses/${doseNumber}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(doseData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update dose status: ${response.statusText}`);
    }
    
    const data: ScheduleResponse = await response.json();
    return data.data;
  },

  // Delete vaccine schedule
  async deleteSchedule(scheduleId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/schedule/${scheduleId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete schedule: ${response.statusText}`);
    }
  },

  // Helper function to get schedule status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#10b981'; // green
      case 'in_progress':
        return '#3b82f6'; // blue
      case 'cancelled':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  },

  // Helper function to get dose status color
  getDoseStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#10b981'; // green
      case 'scheduled':
        return '#3b82f6'; // blue
      case 'missed':
        return '#f59e0b'; // yellow
      case 'cancelled':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  },

  // Helper function to get status icon
  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'in_progress':
        return 'time';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  },

  // Helper function to get dose status icon
  getDoseStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'scheduled':
        return 'calendar';
      case 'missed':
        return 'warning';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  },

  // Helper function to format date
  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Helper function to format time
  formatTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Helper function to get next due date
  getNextDueDate(schedule: VaccineSchedule): Date | null {
    const nextDose = schedule.doses.find(dose => dose.status === 'scheduled');
    return nextDose ? new Date(nextDose.dateScheduled) : null;
  },

  // Helper function to calculate completion percentage
  getCompletionPercentage(schedule: VaccineSchedule): number {
    const completedDoses = schedule.doses.filter(dose => dose.status === 'completed').length;
    return Math.round((completedDoses / schedule.totalDoses) * 100);
  },

  // Helper function to check if schedule is overdue
  isOverdue(schedule: VaccineSchedule): boolean {
    const nextDue = this.getNextDueDate(schedule);
    if (!nextDue) return false;
    return nextDue < new Date();
  },

  // Helper function to get days until next dose
  getDaysUntilNextDose(schedule: VaccineSchedule): number | null {
    const nextDue = this.getNextDueDate(schedule);
    if (!nextDue) return null;
    
    const today = new Date();
    const diffTime = nextDue.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // Get all available vaccines
  async getAllVaccines(params?: {
    page?: number;
    limit?: number;
    type?: string;
    targetPopulation?: string;
    isActive?: boolean;
  }): Promise<{ vaccines: Vaccine[]; pagination?: any }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.targetPopulation) queryParams.append('targetPopulation', params.targetPopulation);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const url = `${API_BASE_URL}/api/vaccines${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch vaccines: ${response.statusText}`);
    }
    
    const data: VaccinesResponse = await response.json();
    return {
      vaccines: data.data,
      pagination: data.pagination
    };
  },

  // Get vaccine by ID
  async getVaccineById(vaccineId: string): Promise<Vaccine> {
    const response = await fetch(`${API_BASE_URL}/api/vaccines/${vaccineId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch vaccine: ${response.statusText}`);
    }
    
    const data: { success: boolean; message: string; data: Vaccine } = await response.json();
    return data.data;
  }
};

export default scheduleAPI;

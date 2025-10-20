import { Document, Types } from "mongoose";
import { Request } from "express";

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  firstName: string;
  lastName: string;

  email: string;
  password: string;
  dateOfBirth: Date;
  gender: string;
  bloodType: string;
  phone: string;
  avatar?: string;
  dependents: Types.ObjectId[];
  guardians: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IDependent extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  dependentType: string;
  guardianId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVaccine extends Document {
  _id: Types.ObjectId;
  vaccineId: string;
  name: string;
  description: string;
  manufacturer: string;
  type: "routine" | "travel" | "emergency" | "seasonal";
  targetPopulation: "all" | "female" | "male" | "pregnant" | "newborns" | "infants" | "children" | "adolescents" | "adults" | "elderly";
  ageGroups: {
    minAge: number;
    maxAge: number;
    doses: number;
    interval: number;
  }[];
  doseSchedule: {
    pregnancyNumber: number;
    doseNumber: number;
    weeksAfterPOA?: number; // optional, only for first dose of that pregnancy
    weeksAfterPreviousDose?: number; // optional, for 2nd dose
  }[];
  sideEffects: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface IVaccinationRecord extends Document {
  _id: Types.ObjectId;
  recordId: string;
  userId: Types.ObjectId;
  dependentIds?: Types.ObjectId[]; // Array of dependent IDs
  vaccineId?: Types.ObjectId; // Made optional for manual entries
  vaccineName: string;
  totalDoses: number;
  interval: number;
  doses: {
    doseNumber: number;
    dateScheduled: Date;
    dateCompleted?: Date;
    status: "scheduled" | "completed" | "missed" | "cancelled";
    notes?: string;
  }[];
  overallStatus: "in_progress" | "completed" | "cancelled";
  vaccinationType?: "routine" | "travel" | "occupational" | "emergency";
  healthcareProvider?: {
    name?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHealthCard extends Document {
  _id: Types.ObjectId;
  fullName: string;
  gender: string;
  dateOfBirth: Date;
  userId?: Types.ObjectId; // For main user
  dependentId?: Types.ObjectId; // For dependent
  cardType: "user" | "dependent";
  dependents?: {
    _id: Types.ObjectId;
    dependentId: Types.ObjectId;
    fullName: string;
    dateOfBirth: Date;
    gender: string;
    dependentType: string;
  }[];
  completedVaccinations?: {
    vaccineName: string;
    manufacturer?: string;
    doseNumber: number;
    totalDoses: number;
    dateCompleted: Date;
    administeredBy?: string;
    facility?: string;
    certificateNumber?: string;
    notes?: string;
    status?: "completed" | "cancelled";
    vaccinationType?: "routine" | "travel" | "occupational" | "emergency";
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IDigitalHealthCard extends Document {
  _id: Types.ObjectId;
  cardId: string;
  userId: Types.ObjectId;
  cardNumber: string;
  qrCode: string;
  issuedDate: Date;
  lastUpdated: Date;
  status: "active" | "inactive";

  // User basic info for the card
  userInfo: {
    fullName: string;
    dateOfBirth: Date;
    profilePicture?: string;
    bloodType?: string;
    emergencyContact?: {
      name: string;
      phone: string;
    };
  };

  // All completed vaccinations
  completedVaccinations: {
    vaccineName: string;
    manufacturer: string;
    batchNumber: string;
    doseNumber: number;
    totalDoses: number;
    dateScheduled: Date;
    administeredBy: string;
    facility: string;
    certificateNumber: string;
    nextDueDate?: Date;
  }[];

  // Card statistics
  statistics: {
    totalVaccinations: number;
    lastVaccinationDate?: Date;
    upcomingVaccinations: number;
    complianceScore: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface IReport extends Document {
  _id: Types.ObjectId;
  reportId: string;
  userId: Types.ObjectId;
  reportType:
    | "vaccination_history"
    | "travel_certificate"
    | "medical_report"
    | "compliance_report";
  title: string;
  generatedAt: Date;
  dateRange?: {
    from: Date;
    to: Date;
  };
  includeRecords: Types.ObjectId[];
  format: "pdf" | "json" | "csv";
  filePath?: string;
  downloadCount: number;
  sharedWith: {
    email: string;
    sharedAt: Date;
    accessLevel: "read" | "download";
  }[];
  isActive: boolean;
  expiresAt: Date;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface VaccinationAnalytics {
  totalVaccinations: number;
  completedVaccinations: number;
  pendingVaccinations: number;
  missedVaccinations: number;
  upcomingVaccinations: number;
  vaccinationsByYear: { year: number; count: number }[];
  vaccinationsByType: { type: string; count: number }[];
  complianceRate: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IDoctor extends Document {
  name: string;
  specialty: string;
  hospitals: string[];
  phoneNumber: string;
  rating: number;
  availability: string;
  imageUrls: string[];
  doc990Id: string;
  doc990Link: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVaccinationCenter extends Document {
  _id: Types.ObjectId;
  name: string;
  address: string;
  district: string;
  phone: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  vaccineTypes: string[];
  availability: Record<string, number>; // { covid: 50, hepB: 20 }
  openingHours: Record<string, string>; // { mon-fri: "08:00-17:00" }
  createdAt: Date;
  updatedAt: Date;
}

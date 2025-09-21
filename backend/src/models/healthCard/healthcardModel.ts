import mongoose, { Schema } from 'mongoose';
import { IDigitalHealthCard } from '../../types';

const digitalHealthCardSchema = new Schema<IDigitalHealthCard>({
  cardId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'DHC' + Date.now() + Math.random().toString(36).substring(2, 6).toUpperCase();
    }
  },
  
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One card per user
    index: true
  },
  
  cardNumber: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      const year = new Date().getFullYear();
      const random = Math.random().toString().substring(2, 10);
      return `VXS-${year}-${random.substring(0, 4)}-${random.substring(4, 8)}`;
    }
  },
  
  
  issuedDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },

  // User basic info for the card display
  userInfo: {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    Gender: {
      type: String,
      required: true,
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    profilePicture: {
      type: String,
      default: ''
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
      default: ''
    },
    emergencyContact: {
      name: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      }
    }
  },

  // All completed vaccinations
  completedVaccinations: [{
    vaccineName: {
      type: String,
      required: true,
      trim: true
    },
    manufacturer: {
      type: String,
      required: true,
      trim: true
    },
    batchNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    doseNumber: {
      type: Number,
      required: true,
      min: 1
    },
    totalDoses: {
      type: Number,
      required: true,
      min: 1
    },
    dateScheduled: {
      type: Date,
      required: true
    },
    administeredBy: {
      type: String,
      required: true,
      trim: true
    },
    facility: {
      type: String,
      required: true,
      trim: true
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    nextDueDate: {
      type: Date
    }
  }],

  // Card statistics
  statistics: {
    totalVaccinations: {
      type: Number,
      default: 0
    },
    lastVaccinationDate: {
      type: Date
    },
    upcomingVaccinations: {
      type: Number,
      default: 0
    },
    complianceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update statistics before saving
digitalHealthCardSchema.pre('save', async function(next) {
  try {
    if (this.isNew || this.isModified('completedVaccinations') || this.isModified('userInfo')) {
      // Update statistics
      this.statistics.totalVaccinations = this.completedVaccinations.length;
      
      if (this.completedVaccinations.length > 0) {
        // Find last vaccination date
        const lastVaccination = this.completedVaccinations
          .sort((a, b) => new Date(b.dateScheduled).getTime() - new Date(a.dateScheduled).getTime())[0];
        this.statistics.lastVaccinationDate = lastVaccination.dateScheduled;
        
        // Calculate compliance score (simple: 20 points per completed vaccination, max 100)
        this.statistics.complianceScore = Math.min(this.completedVaccinations.length * 20, 100);
      }
      
      this.lastUpdated = new Date();
    }
    
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to add a completed vaccination
digitalHealthCardSchema.methods.addCompletedVaccination = function(vaccinationData: any) {
  // Check if vaccination already exists
  const existingIndex = this.completedVaccinations.findIndex(
    (v: any) => v.certificateNumber === vaccinationData.certificateNumber
  );

  const vaccination = {
    vaccineName: vaccinationData.vaccineName,
    manufacturer: vaccinationData.manufacturer || 'Unknown',
    batchNumber: vaccinationData.batchNumber,
    doseNumber: vaccinationData.doseNumber,
    totalDoses: vaccinationData.totalDoses,
    dateScheduled: vaccinationData.dateScheduled,
    administeredBy: vaccinationData.healthcareProvider?.name || vaccinationData.administeredBy,
    facility: vaccinationData.healthcareProvider?.facility || vaccinationData.facility,
    certificateNumber: vaccinationData.certificate?.certificateNumber || vaccinationData.certificateNumber,
    nextDueDate: vaccinationData.nextDueDate
  };

  if (existingIndex >= 0) {
    // Update existing vaccination
    this.completedVaccinations[existingIndex] = vaccination;
  } else {
    // Add new vaccination
    this.completedVaccinations.push(vaccination);
  }

  this.markModified('completedVaccinations');
};

// Method to remove a vaccination
digitalHealthCardSchema.methods.removeVaccination = function(certificateNumber: string) {
  this.completedVaccinations = this.completedVaccinations.filter(
    (v: any) => v.certificateNumber !== certificateNumber
  );
  this.markModified('completedVaccinations');
};

// Index for better performance
digitalHealthCardSchema.index({ status: 1 });

export default mongoose.model<IDigitalHealthCard>('DigitalHealthCard', digitalHealthCardSchema);
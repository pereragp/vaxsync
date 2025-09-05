import mongoose, { Schema } from 'mongoose';
import { IVaccinationRecord } from '../../types';

const vaccinationRecordSchema = new Schema<IVaccinationRecord>({
  recordId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'REC' + Date.now() + Math.random().toString(36).substring(2, 7).toUpperCase();
    }
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  vaccineId: {
    type: Schema.Types.ObjectId,
    ref: 'Vaccine',
    required: [true, 'Vaccine ID is required']
  },
  vaccineName: {
    type: String,
    required: [true, 'Vaccine name is required'],
    trim: true
  },
  doseNumber: {
    type: Number,
    required: [true, 'Dose number is required'],
    min: [1, 'Dose number must be at least 1']
  },
  totalDoses: {
    type: Number,
    required: [true, 'Total doses is required'],
    min: [1, 'Total doses must be at least 1'],
    validate: {
      validator: function(this: any, value: number) {
        return value >= this.doseNumber;
      },
      message: 'Total doses must be greater than or equal to current dose number'
    }
  },
  dateAdministered: {
    type: Date,
    required: [true, 'Date administered is required']
  },
  dateScheduled: {
    type: Date,
    required: [true, 'Date scheduled is required']
  },
  nextDueDate: {
    type: Date,
    validate: {
      validator: function(this: any, value: Date) {
        return !value || value > this.dateAdministered;
      },
      message: 'Next due date must be after the administration date'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['scheduled', 'completed', 'missed', 'cancelled'],
      message: 'Status must be one of: scheduled, completed, missed, cancelled'
    },
    default: 'scheduled'
  },
  healthcareProvider: {
    name: { 
      type: String, 
      required: [true, 'Healthcare provider name is required'],
      trim: true 
    },
    facility: { 
      type: String, 
      required: [true, 'Healthcare facility is required'],
      trim: true 
    },
    license: { 
      type: String, 
      required: [true, 'Healthcare provider license is required'],
      trim: true 
    },
    contact: { 
      type: String, 
      required: [true, 'Healthcare provider contact is required'],
      trim: true 
    }
  },
  location: {
    name: { 
      type: String, 
      required: [true, 'Location name is required'],
      trim: true 
    },
    address: { 
      type: String, 
      required: [true, 'Location address is required'],
      trim: true 
    },
    coordinates: {
      latitude: { 
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: { 
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true,
    uppercase: true
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
    validate: {
      validator: function(this: any, value: Date) {
        return value > this.dateAdministered;
      },
      message: 'Expiry date must be after the administration date'
    }
  },
  reactions: [{
    type: { 
      type: String,
      required: true,
      trim: true
    },
    severity: { 
      type: String, 
      enum: {
        values: ['mild', 'moderate', 'severe'],
        message: 'Severity must be one of: mild, moderate, severe'
      },
      required: true
    },
    description: { 
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Reaction description cannot exceed 500 characters']
    },
    reportedAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  certificate: {
    issueDate: { 
      type: Date, 
      default: Date.now 
    },
    certificateNumber: { 
      type: String,
      sparse: true,
      unique: true,
      uppercase: true
    },
    isVerified: { 
      type: Boolean, 
      default: false 
    }
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    trim: true
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

// Generate certificate number before saving
vaccinationRecordSchema.pre('save', function(next) {
  if (this.isNew && this.status === 'completed' && !this.certificate.certificateNumber) {
    this.certificate.certificateNumber = 'CERT' + Date.now() + Math.random().toString(36).substring(2, 7).toUpperCase();
  }
  next();
});

// Indexes for better performance
vaccinationRecordSchema.index({ userId: 1, dateAdministered: -1 });
vaccinationRecordSchema.index({ status: 1 });
vaccinationRecordSchema.index({ dateScheduled: 1 });

export default mongoose.model<IVaccinationRecord>('VaccineSchedule', vaccinationRecordSchema);
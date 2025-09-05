import mongoose, { Schema } from 'mongoose';
import { IReport } from '../../types';

const reportSchema = new Schema<IReport>({
  reportId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'RPT' + Date.now() + Math.random().toString(36).substring(2, 7).toUpperCase();
    }
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  reportType: {
    type: String,
    enum: {
      values: ['vaccination_history', 'travel_certificate', 'medical_report', 'compliance_report'],
      message: 'Report type must be one of: vaccination_history, travel_certificate, medical_report, compliance_report'
    },
    required: [true, 'Report type is required']
  },
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true,
    maxlength: [200, 'Report title cannot exceed 200 characters']
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  dateRange: {
    from: { 
      type: Date,
      validate: {
        validator: function(this: any, value: Date) {
          return !this.dateRange?.to || value <= this.dateRange.to;
        },
        message: 'From date must be before or equal to To date'
      }
    },
    to: { 
      type: Date,
      validate: {
        validator: function(this: any, value: Date) {
          return !this.dateRange?.from || value >= this.dateRange.from;
        },
        message: 'To date must be after or equal to From date'
      }
    }
  },
  includeRecords: [{
    type: Schema.Types.ObjectId,
    ref: 'VaccineSchedule'
  }],
  format: {
    type: String,
    enum: {
      values: ['pdf', 'json', 'csv'],
      message: 'Format must be one of: pdf, json, csv'
    },
    default: 'pdf'
  },
  filePath: {
    type: String,
    trim: true
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: [0, 'Download count cannot be negative']
  },
  sharedWith: [{
    email: { 
      type: String,
      required: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    sharedAt: { 
      type: Date, 
      default: Date.now 
    },
    accessLevel: { 
      type: String, 
      enum: {
        values: ['read', 'download'],
        message: 'Access level must be either read or download'
      },
      default: 'read' 
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    },
    validate: {
      validator: function(this: any, value: Date) {
        return value > this.generatedAt;
      },
      message: 'Expiry date must be after generation date'
    }
  }
}, {
  timestamps: true
});

// Indexes
reportSchema.index({ userId: 1, generatedAt: -1 });
reportSchema.index({ reportType: 1 });
reportSchema.index({ isActive: 1 });

// TTL index to automatically delete expired reports
reportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IReport>('Report', reportSchema);

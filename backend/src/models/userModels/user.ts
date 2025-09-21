import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../../types';

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [10, 'Username cannot exceed 30 characters']
  },

  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
  },

  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(value: Date) {
        return value <= new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'parent', 'healthcare_provider', 'admin'],
      message: 'Role must be one of: user, parent, healthcare_provider, admin'
    },
    default: 'user'
  },
  verificationCode: {
    type: String,
    default: function() {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
  },
  dependents: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  guardians: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
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
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete (ret as any).password;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// // Hash password before saving
// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
  
//   try {
//     const salt = await bcrypt.genSalt(12);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error: any) {
//     next(error);
//   }
// });

// // Compare password method
// userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
//   try {
//     return await bcrypt.compare(candidatePassword, this.password);
//   } catch (error) {
//     throw new Error('Password comparison failed');
//   }
// };

// // Update timestamp before saving
// userSchema.pre('save', function(next) {
//   if (!this.isNew) {
//     this.updatedAt = new Date();
//   }
//   next();
// });

// Indexes for better performance
userSchema.index({ phone: 1 });

export default mongoose.model<IUser>('User', userSchema);
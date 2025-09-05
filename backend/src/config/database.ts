import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = 'mongodb+srv://vaxsyncdb:vaxsyncdb%4001@cluster2.xd0c4vr.mongodb.net/';

    if (!mongoURI) {
      throw new Error('MONGODB_URI is not set. Create a .env file or set the environment variable.');
    }

    await mongoose.connect(mongoURI);

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error);
  }
};
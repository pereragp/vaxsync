"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const mongoURI = 'mongodb+srv://vaxsyncdb:vaxsyncdb%4001@cluster2.xd0c4vr.mongodb.net/';
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not set. Create a .env file or set the environment variable.');
        }
        await mongoose_1.default.connect(mongoURI);
        console.log('✅ MongoDB connected successfully');
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        await mongoose_1.default.disconnect();
        console.log('✅ MongoDB disconnected successfully');
    }
    catch (error) {
        console.error('❌ MongoDB disconnection error:', error);
    }
};
exports.disconnectDB = disconnectDB;
//# sourceMappingURL=database.js.map
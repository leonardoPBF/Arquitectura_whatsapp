import mongoose from 'mongoose';
import { config } from "dotenv";
config();

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect((process.env.MONGODB_URI as string));
    
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    
    // Event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB desconectado');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconectado');
    });
    
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;
import mongoose from 'mongoose';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message);
    });
  } catch (error) {
    isConnected = false;
    const message = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`Failed to connect to MongoDB: ${message}`);
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('🔌 MongoDB disconnected gracefully');
}

export function getDatabaseStatus(): { connected: boolean; host?: string } {
  return {
    connected: isConnected,
    host: isConnected ? mongoose.connection.host : undefined,
  };
}

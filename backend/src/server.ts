import 'dotenv/config';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function bootstrap(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Create and start Express app
    const app = createApp();
    const server = app.listen(PORT, () => {
      console.log(`🚀 VastuPlan API running on http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received — shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        console.log('✅ Server closed');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to start server: ${message}`);
    process.exit(1);
  }
}

bootstrap();

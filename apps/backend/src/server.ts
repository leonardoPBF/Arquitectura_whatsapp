import app from './app';
import connectDB from './config/database';
import { config } from './config/environment';
import { createServer } from 'http';
import { initializeSocketIO } from './sockets/socketManager';

const httpServer = createServer(app);

// Inicializar Socket.IO
initializeSocketIO(httpServer);

const startServer = async () => {
  try {
    // Conectar a MongoDB
    await connectDB();
    
    // Iniciar servidor
    httpServer.listen(config.port, () => {
      console.log('🚀 ====================================');
      console.log(`🚀 Servidor corriendo en modo ${config.nodeEnv}`);
      console.log(`🚀 Puerto: ${config.port}`);
      console.log(`🚀 API: http://localhost:${config.port}${config.apiPrefix}`);
      console.log('🚀 ====================================');
    });
    
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Rejection:', err);
  httpServer.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM recibido, cerrando servidor...');
  httpServer.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});

startServer();
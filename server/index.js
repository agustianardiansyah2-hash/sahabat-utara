import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRouter from './routes/auth.js';
import monitoringPointsRouter from './routes/monitoring-points.js';
import reportsRouter from './routes/reports.js';
import statisticsRouter from './routes/statistics.js';
import sensorReadingsRouter from './routes/sensor-readings.js';
import settingsRouter from './routes/settings.js';
import evacuationCentersRouter from './routes/evacuation-centers.js';
import evacueesRouter from './routes/evacuees.js';
import populationRouter from './routes/population.js';

// Import database
import { initDatabase, closeDatabase } from './db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'production';

// CORS configuration - cPanel deployment
const corsOptions = {
  origin: function (origin, callback) {
    // Development mode - allow all localhost
    if (NODE_ENV !== 'production') {
      callback(null, true);
      return;
    }

    // Production mode - allow same domain (cPanel)
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
    ];

    // Allow requests with no origin (like curl requests)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Check if origin matches allowed patterns
    const isAllowed = allowedOrigins.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(origin);
      }
      return pattern === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      // In production, allow all (frontend and backend on same domain)
      callback(null, true);
    }
  },
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const uploadsDir = join(__dirname, 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/monitoring-points', monitoringPointsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/sensor-readings', sensorReadingsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/evacuation-centers', evacuationCentersRouter);
app.use('/api/evacuees', evacueesRouter);
app.use('/api/population', populationRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SAHABAT UTARA API is running', env: NODE_ENV });
});

// Serve static frontend in production
if (NODE_ENV === 'production') {
  // Try multiple possible locations for the built frontend
  const possiblePaths = [
    join(__dirname, 'client', 'dist'),
    join(__dirname, 'dist'),
    join(__dirname, '..', 'client', 'dist'),
  ];

  let clientDistPath = null;
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      clientDistPath = path;
      break;
    }
  }

  if (clientDistPath) {
    app.use(express.static(clientDistPath));
    console.log(`Serving static files from: ${clientDistPath}`);
  } else {
    console.warn('Warning: Frontend dist folder not found. Build frontend first.');
  }

  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      if (clientDistPath) {
        res.sendFile(join(clientDistPath, 'index.html'));
      } else {
        res.status(503).json({ success: false, error: 'Frontend not built. Run: npm run build:client' });
      }
    } else {
      res.status(404).json({ success: false, error: 'Endpoint not found' });
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing database connections...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Closing database connections...');
  await closeDatabase();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await initDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🏠 SAHABAT UTARA - Backend API                             ║
║   Sistem Antisipasi Hadapi Banjir Terpadu                      ║
║   Kecamatan Bekasi Utara                                       ║
║                                                               ║
║   🚀 Server running on http://localhost:${PORT}                  ║
║   📡 API base URL: http://localhost:${PORT}/api                  ║
║   🌐 Mode: ${NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'}
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;

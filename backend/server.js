require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const osintRoutes = require('./routes/osint');
const toolsRoutes = require('./routes/tools');
const realOsintRoutes = require('./routes/realOsint');

const app = express();
const PORT = process.env.PORT || 5000;
const projectRoot = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(projectRoot, 'logs'), { recursive: true });

const developmentOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

const additionalOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set(
  process.env.NODE_ENV === 'production' ? additionalOrigins : [...developmentOrigins, ...additionalOrigins]
);

const devTunnelOriginRegex = /^https:\/\/[a-z0-9-]+-3000\.asse\.devtunnels\.ms$/;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin) || devTunnelOriginRegex.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  },
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', osintRoutes);
app.use('/api/tools', toolsRoutes);

// Real OSINT - try to load, but fallback if fails
try {
  app.use('/api/real-osint', realOsintRoutes);
  console.log('[Route] /api/real-osint loaded successfully');
} catch (e) {
  console.log('[Route] /api/real-osint failed to load:', e.message);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.status ? err.message : 'Internal Server Error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║  OSINT Intelligence Platform Backend   ║
║  Server running on port ${PORT}           ║
║  Environment: ${process.env.NODE_ENV || 'development'}       ║
╚════════════════════════════════════════╝
  `);
  console.log(`Endpoints:`);
  console.log(`  POST /api/analyze - Analyze target`);
  console.log(`  GET /api/tools - Get available tools`);
  console.log(`  GET /health - Health check`);
});

module.exports = app;


const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

// Import your Express app setup
const { registerRoutes } = require('../../server/routes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://cerulean-entremet-0a91fd.netlify.app'] 
    : ['http://localhost:5000', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Register API routes
registerRoutes(app).then(() => {
  console.log('API routes registered successfully');
}).catch(console.error);

// Export the serverless function
module.exports.handler = serverless(app);

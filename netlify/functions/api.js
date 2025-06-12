
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://cerulean-entremet-0a91fd.netlify.app']
    : ['http://localhost:5000', 'http://0.0.0.0:5000'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Placeholder for other routes
app.get('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.post('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

module.exports.handler = serverless(app);

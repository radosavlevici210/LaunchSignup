
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://cerulean-entremet-0a91fd.netlify.app']
    : ['http://localhost:5000', 'http://0.0.0.0:5000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple health check
app.get('/.netlify/functions/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Waitlist signup endpoint
app.post('/.netlify/functions/api/waitlist', async (req, res) => {
  try {
    // Basic validation
    const { fullName, email } = req.body;
    
    if (!fullName || !email) {
      return res.status(400).json({ 
        message: 'Full name and email are required' 
      });
    }

    // For now, just return success - integrate with database later
    res.status(201).json({ 
      message: "Successfully joined the waitlist! Check your email for verification.",
      signup: {
        fullName,
        email,
        timestamp: new Date().toISOString(),
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Waitlist signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin auth endpoint
app.post('/.netlify/functions/api/admin/auth', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    const adminEmail = process.env.ADMIN_EMAIL || "ervin210@icloud.com";
    
    if (email.toLowerCase() === adminEmail.toLowerCase()) {
      const token = Buffer.from(`${email}:${Date.now()}:${Math.random()}`).toString('base64');
      
      res.json({ 
        message: "Admin access granted",
        authenticated: true,
        token: token
      });
    } else {
      res.status(401).json({ 
        message: "Access denied",
        authenticated: false 
      });
    }
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Catch-all for undefined routes
app.use('/.netlify/functions/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

module.exports.handler = serverless(app);

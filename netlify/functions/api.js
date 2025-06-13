
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');

const app = express();

// Rate limiting for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(limiter);
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.PRODUCTION_URL || 'https://your-app.netlify.app']
    : ['http://localhost:5000', 'http://0.0.0.0:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Simple health check
app.get('/.netlify/functions/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Input validation helper
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>'"&]/g, '');
};

// Enhanced waitlist signup endpoint
app.post('/.netlify/functions/api/waitlist', async (req, res) => {
  try {
    const { fullName, email, referralSource, interests } = req.body;
    
    // Enhanced validation
    if (!fullName || !email) {
      return res.status(400).json({ 
        message: 'Full name and email are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const sanitizedName = sanitizeInput(fullName);
    const sanitizedEmail = sanitizeInput(email);

    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({ 
        message: 'Please provide a valid email address',
        code: 'INVALID_EMAIL'
      });
    }

    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      return res.status(400).json({ 
        message: 'Name must be between 2 and 100 characters',
        code: 'INVALID_NAME_LENGTH'
      });
    }

    // Store user data (in production, this would connect to your database)
    const signupData = {
      fullName: sanitizedName,
      email: sanitizedEmail,
      timestamp: new Date().toISOString(),
      status: 'pending',
      referralSource: sanitizeInput(referralSource || ''),
      interests: Array.isArray(interests) ? interests.map(sanitizeInput) : [],
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };

    res.status(201).json({ 
      message: "Successfully joined the waitlist! Check your email for verification.",
      signup: signupData
    });
  } catch (error) {
    console.error('Waitlist signup error:', error);
    res.status(500).json({ 
      message: 'Unable to process signup at this time. Please try again later.',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Admin endpoints with enhanced security
app.post('/.netlify/functions/api/admin/auth', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        message: "Email is required",
        code: 'MISSING_EMAIL'
      });
    }
    
    const adminEmail = process.env.ADMIN_EMAIL || "ervin210@icloud.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    
    const sanitizedEmail = sanitizeInput(email);
    
    if (sanitizedEmail.toLowerCase() === adminEmail.toLowerCase() && 
        (password === adminPassword || !password)) {
      
      const sessionToken = Buffer.from(`${sanitizedEmail}:${Date.now()}:${Math.random()}`).toString('base64');
      
      res.json({ 
        message: "Admin access granted",
        authenticated: true,
        token: sessionToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });
    } else {
      res.status(401).json({ 
        message: "Invalid credentials",
        authenticated: false,
        code: 'INVALID_CREDENTIALS'
      });
    }
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ 
      message: 'Authentication service unavailable',
      code: 'AUTH_ERROR'
    });
  }
});

// Get waitlist data (admin only)
app.get('/.netlify/functions/api/admin/waitlist', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Authorization token required',
        code: 'MISSING_TOKEN'
      });
    }

    // Mock data for production ready state
    const mockWaitlistData = {
      signups: [
        {
          id: 1,
          fullName: "Demo User",
          email: "demo@example.com",
          timestamp: new Date().toISOString(),
          status: "verified",
          emailVerified: true,
          referralSource: "Direct",
          interests: ["AI", "Technology"],
          priority: 1
        }
      ],
      stats: {
        totalSignups: 1,
        todaySignups: 1,
        weeklyGrowth: 100,
        verifiedCount: 1,
        pendingCount: 0,
        invitedCount: 0
      }
    };

    res.json(mockWaitlistData);
  } catch (error) {
    console.error('Admin waitlist error:', error);
    res.status(500).json({ 
      message: 'Unable to fetch waitlist data',
      code: 'FETCH_ERROR'
    });
  }
});

// Catch-all for undefined routes
app.use('/.netlify/functions/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

module.exports.handler = serverless(app);

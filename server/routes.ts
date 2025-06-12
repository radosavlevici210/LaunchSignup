import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, StorageError } from "./storage";
import { insertWaitlistSignupSchema, updateWaitlistSignupSchema, emailVerificationSchema } from "@shared/schema";
import { z } from "zod";

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting middleware
function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const key = `${ip}:${req.path}`;
    
    const current = rateLimitStore.get(key);
    
    if (!current || now > current.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (current.count >= maxRequests) {
      return res.status(429).json({
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
    }
    
    current.count++;
    next();
  };
}

// Input sanitization
function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}

// Error handler middleware
function handleError(error: any, res: Response) {
  if (error instanceof StorageError) {
    switch (error.code) {
      case 'EMAIL_EXISTS':
        return res.status(409).json({ message: error.message });
      case 'INVALID_TOKEN':
        return res.status(400).json({ message: error.message });
      case 'WAITLIST_NOT_FOUND':
        return res.status(404).json({ message: error.message });
      default:
        console.error('Storage error:', error);
        return res.status(500).json({ message: 'Database operation failed' });
    }
  }
  
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      message: "Invalid input data",
      errors: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }
  
  console.error('Unexpected error:', error);
  return res.status(500).json({ message: 'Internal server error' });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Waitlist signup endpoint with rate limiting
  app.post("/api/waitlist", rateLimit(5, 15 * 60 * 1000), async (req, res) => {
    try {
      const signupData = insertWaitlistSignupSchema.parse(req.body);
      
      // Sanitize input
      const sanitizedData = {
        fullName: sanitizeString(signupData.fullName),
        email: signupData.email.toLowerCase().trim(),
        referralSource: signupData.referralSource ? sanitizeString(signupData.referralSource) : undefined,
        interests: signupData.interests || [],
      };
      
      const ipAddress = req.ip || req.connection.remoteAddress || undefined;
      const userAgent = req.get('User-Agent') || undefined;
      
      const signup = await storage.createWaitlistSignup(sanitizedData, ipAddress, userAgent);
      
      res.status(201).json({ 
        message: "Successfully joined the waitlist! Check your email for verification.",
        signup: {
          id: signup.id,
          fullName: signup.fullName,
          email: signup.email,
          timestamp: signup.timestamp,
          status: signup.status
        }
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Email verification endpoint
  app.post("/api/waitlist/verify", rateLimit(10, 15 * 60 * 1000), async (req, res) => {
    try {
      const { token } = emailVerificationSchema.parse(req.body);
      const signup = await storage.verifyEmail(token);
      
      res.json({
        message: "Email verified successfully!",
        signup: {
          id: signup.id,
          fullName: signup.fullName,
          email: signup.email,
          status: signup.status
        }
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Get all waitlist signups (admin only)
  app.get("/api/waitlist", rateLimit(20, 60 * 1000), async (req, res) => {
    try {
      const { status } = req.query;
      const signups = await storage.getAllWaitlistSignups(status as string);
      const stats = await storage.getWaitlistStats();
      
      res.json({
        signups,
        stats
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Update waitlist signup (admin only)
  app.patch("/api/waitlist/:id", rateLimit(30, 60 * 1000), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid signup ID" });
      }

      const updates = updateWaitlistSignupSchema.parse(req.body);
      const signup = await storage.updateWaitlistSignup(id, updates);
      
      res.json({
        message: "Signup updated successfully",
        signup
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Bulk update signups (admin only)
  app.post("/api/waitlist/bulk-update", rateLimit(10, 60 * 1000), async (req, res) => {
    try {
      const { signupIds, updates } = req.body;
      
      if (!Array.isArray(signupIds) || signupIds.length === 0) {
        return res.status(400).json({ message: "Invalid signup IDs" });
      }

      const validatedUpdates = updateWaitlistSignupSchema.parse(updates);
      await storage.bulkUpdateSignups(signupIds, validatedUpdates);
      
      res.json({ message: `Updated ${signupIds.length} signups successfully` });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Export waitlist data (admin only)
  app.get("/api/waitlist/export", rateLimit(5, 60 * 1000), async (req, res) => {
    try {
      const signups = await storage.exportWaitlistData();
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="waitlist-export.csv"');
      
      // Generate CSV content
      const csvHeader = 'ID,Full Name,Email,Status,Verified,Priority,Signup Date,Referral Source,Interests,Notes\n';
      const csvRows = signups.map(signup => 
        [
          signup.id,
          `"${signup.fullName}"`,
          signup.email,
          signup.status,
          signup.emailVerified,
          signup.priority,
          signup.timestamp?.toISOString(),
          `"${signup.referralSource || ''}"`,
          `"${signup.interests?.join(';') || ''}"`,
          `"${signup.notes || ''}"`
        ].join(',')
      ).join('\n');
      
      res.send(csvHeader + csvRows);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Admin authentication endpoint
  app.post("/api/admin/auth", rateLimit(5, 15 * 60 * 1000), async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email is required" });
      }
      
      if (email === "ervin210@icloud.com") {
        res.json({ 
          message: "Admin access granted",
          authenticated: true 
        });
      } else {
        res.status(401).json({ 
          message: "Access denied. Only root user can access admin dashboard.",
          authenticated: false 
        });
      }
    } catch (error) {
      handleError(error, res);
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}

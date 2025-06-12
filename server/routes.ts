import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWaitlistSignupSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Waitlist signup endpoint
  app.post("/api/waitlist", async (req, res) => {
    try {
      const signupData = insertWaitlistSignupSchema.parse(req.body);
      
      // Check if email already exists
      const existingSignup = await storage.getWaitlistSignupByEmail(signupData.email);
      if (existingSignup) {
        return res.status(400).json({ 
          message: "Email address is already registered in our waitlist" 
        });
      }
      
      const signup = await storage.createWaitlistSignup(signupData);
      res.status(201).json({ 
        message: "Successfully joined the waitlist!",
        signup: {
          id: signup.id,
          fullName: signup.fullName,
          email: signup.email,
          timestamp: signup.timestamp
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input data",
          errors: error.errors 
        });
      }
      console.error("Waitlist signup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all waitlist signups (admin only)
  app.get("/api/waitlist", async (req, res) => {
    try {
      const signups = await storage.getAllWaitlistSignups();
      const stats = await storage.getWaitlistStats();
      
      res.json({
        signups,
        stats
      });
    } catch (error) {
      console.error("Get waitlist error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin authentication endpoint
  app.post("/api/admin/auth", async (req, res) => {
    try {
      const { email } = req.body;
      
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
      console.error("Admin auth error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

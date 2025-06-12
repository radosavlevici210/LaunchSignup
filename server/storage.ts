import { users, waitlistSignups, type User, type InsertUser, type WaitlistSignup, type InsertWaitlistSignup, type UpdateWaitlistSignup } from "@shared/schema";
import { db } from "./db";
import { eq, count, gte, desc, and, isNull, or } from "drizzle-orm";
import crypto from "crypto";

export class StorageError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "StorageError";
  }
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUserLastLogin(id: number): Promise<void>;
  
  getWaitlistSignupByEmail(email: string): Promise<WaitlistSignup | undefined>;
  getWaitlistSignupByToken(token: string): Promise<WaitlistSignup | undefined>;
  createWaitlistSignup(insertSignup: InsertWaitlistSignup, ipAddress?: string, userAgent?: string): Promise<WaitlistSignup>;
  updateWaitlistSignup(id: number, updates: Partial<UpdateWaitlistSignup>): Promise<WaitlistSignup>;
  verifyEmail(token: string): Promise<WaitlistSignup>;
  getAllWaitlistSignups(status?: string): Promise<WaitlistSignup[]>;
  getWaitlistStats(): Promise<{
    totalSignups: number;
    todaySignups: number;
    weeklyGrowth: number;
    verifiedCount: number;
    pendingCount: number;
    invitedCount: number;
  }>;
  exportWaitlistData(): Promise<WaitlistSignup[]>;
  bulkUpdateSignups(signupIds: number[], updates: Partial<UpdateWaitlistSignup>): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      throw new StorageError(`Failed to get user: ${error}`, 'USER_GET_ERROR');
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user || undefined;
    } catch (error) {
      throw new StorageError(`Failed to get user by username: ${error}`, 'USER_GET_ERROR');
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(insertUser)
        .returning();
      return user;
    } catch (error) {
      throw new StorageError(`Failed to create user: ${error}`, 'USER_CREATE_ERROR');
    }
  }

  async updateUserLastLogin(id: number): Promise<void> {
    try {
      await db
        .update(users)
        .set({ lastLogin: new Date() })
        .where(eq(users.id, id));
    } catch (error) {
      throw new StorageError(`Failed to update user login: ${error}`, 'USER_UPDATE_ERROR');
    }
  }

  async getWaitlistSignupByEmail(email: string): Promise<WaitlistSignup | undefined> {
    try {
      const [signup] = await db.select().from(waitlistSignups).where(eq(waitlistSignups.email, email.toLowerCase()));
      return signup || undefined;
    } catch (error) {
      throw new StorageError(`Failed to get waitlist signup: ${error}`, 'WAITLIST_GET_ERROR');
    }
  }

  async getWaitlistSignupByToken(token: string): Promise<WaitlistSignup | undefined> {
    try {
      const [signup] = await db.select().from(waitlistSignups)
        .where(and(
          eq(waitlistSignups.verificationToken, token),
          gte(waitlistSignups.verificationExpiry, new Date())
        ));
      return signup || undefined;
    } catch (error) {
      throw new StorageError(`Failed to get waitlist signup by token: ${error}`, 'WAITLIST_GET_ERROR');
    }
  }

  async createWaitlistSignup(insertSignup: InsertWaitlistSignup, ipAddress?: string, userAgent?: string): Promise<WaitlistSignup> {
    try {
      // Check for existing email
      const existing = await this.getWaitlistSignupByEmail(insertSignup.email);
      if (existing) {
        throw new StorageError('Email already registered', 'EMAIL_EXISTS');
      }

      const verificationToken = this.generateVerificationToken();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const [signup] = await db
        .insert(waitlistSignups)
        .values({
          ...insertSignup,
          email: insertSignup.email.toLowerCase(),
          verificationToken,
          verificationExpiry,
          ipAddress,
          userAgent,
        })
        .returning();
      return signup;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(`Failed to create waitlist signup: ${error}`, 'WAITLIST_CREATE_ERROR');
    }
  }

  async updateWaitlistSignup(id: number, updates: Partial<UpdateWaitlistSignup>): Promise<WaitlistSignup> {
    try {
      const [signup] = await db
        .update(waitlistSignups)
        .set(updates)
        .where(eq(waitlistSignups.id, id))
        .returning();
      
      if (!signup) {
        throw new StorageError('Waitlist signup not found', 'WAITLIST_NOT_FOUND');
      }
      
      return signup;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(`Failed to update waitlist signup: ${error}`, 'WAITLIST_UPDATE_ERROR');
    }
  }

  async verifyEmail(token: string): Promise<WaitlistSignup> {
    try {
      const signup = await this.getWaitlistSignupByToken(token);
      if (!signup) {
        throw new StorageError('Invalid or expired verification token', 'INVALID_TOKEN');
      }

      return await this.updateWaitlistSignup(signup.id, {
        status: 'verified',
      });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(`Failed to verify email: ${error}`, 'EMAIL_VERIFY_ERROR');
    }
  }

  async getAllWaitlistSignups(): Promise<WaitlistSignup[]> {
    return await db.select().from(waitlistSignups).orderBy(desc(waitlistSignups.timestamp));
  }

  async getWaitlistStats(): Promise<{
    totalSignups: number;
    todaySignups: number;
    weeklyGrowth: number;
  }> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [totalResult] = await db.select({ count: count() }).from(waitlistSignups);
    const [todayResult] = await db.select({ count: count() }).from(waitlistSignups)
      .where(gte(waitlistSignups.timestamp, today));
    const [thisWeekResult] = await db.select({ count: count() }).from(waitlistSignups)
      .where(gte(waitlistSignups.timestamp, weekAgo));
    const [lastWeekResult] = await db.select({ count: count() }).from(waitlistSignups)
      .where(gte(waitlistSignups.timestamp, twoWeeksAgo));

    const totalSignups = totalResult.count;
    const todaySignups = todayResult.count;
    const thisWeekSignups = thisWeekResult.count;
    const lastWeekSignups = lastWeekResult.count - thisWeekSignups;

    const weeklyGrowth = lastWeekSignups > 0 
      ? Math.round(((thisWeekSignups - lastWeekSignups) / lastWeekSignups) * 100)
      : thisWeekSignups > 0 ? 100 : 0;

    return {
      totalSignups,
      todaySignups,
      weeklyGrowth
    };
  }
}

export const storage = new DatabaseStorage();
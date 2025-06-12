import { users, waitlistSignups, type User, type InsertUser, type WaitlistSignup, type InsertWaitlistSignup } from "@shared/schema";
import { db } from "./db";
import { eq, count, gte, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getWaitlistSignupByEmail(email: string): Promise<WaitlistSignup | undefined>;
  createWaitlistSignup(insertSignup: InsertWaitlistSignup): Promise<WaitlistSignup>;
  getAllWaitlistSignups(): Promise<WaitlistSignup[]>;
  getWaitlistStats(): Promise<{
    totalSignups: number;
    todaySignups: number;
    weeklyGrowth: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getWaitlistSignupByEmail(email: string): Promise<WaitlistSignup | undefined> {
    const [signup] = await db.select().from(waitlistSignups).where(eq(waitlistSignups.email, email));
    return signup || undefined;
  }

  async createWaitlistSignup(insertSignup: InsertWaitlistSignup): Promise<WaitlistSignup> {
    const [signup] = await db
      .insert(waitlistSignups)
      .values(insertSignup)
      .returning();
    return signup;
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
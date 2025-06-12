import { pgTable, text, serial, timestamp, boolean, varchar, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const waitlistSignups = pgTable("waitlist_signups", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  status: text("status").default("pending").notNull(), // pending, verified, invited, declined
  emailVerified: boolean("email_verified").default(false).notNull(),
  verificationToken: text("verification_token"),
  verificationExpiry: timestamp("verification_expiry"),
  referralSource: text("referral_source"), // how they found us
  interests: text("interests").array(), // areas of interest
  ipAddress: varchar("ip_address", { length: 45 }), // IPv6 support
  userAgent: text("user_agent"),
  notes: text("notes"), // admin notes
  priority: integer("priority").default(0).notNull(), // for prioritizing invites
  invitedAt: timestamp("invited_at"),
  declinedAt: timestamp("declined_at"),
}, (table) => ({
  emailIdx: index("waitlist_email_idx").on(table.email),
  statusIdx: index("waitlist_status_idx").on(table.status),
  timestampIdx: index("waitlist_timestamp_idx").on(table.timestamp),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertWaitlistSignupSchema = createInsertSchema(waitlistSignups).pick({
  fullName: true,
  email: true,
  referralSource: true,
  interests: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  referralSource: z.string().optional(),
  interests: z.array(z.string()).optional(),
});

export const updateWaitlistSignupSchema = createInsertSchema(waitlistSignups).pick({
  status: true,
  priority: true,
  notes: true,
}).extend({
  status: z.enum(["pending", "verified", "invited", "declined"]),
  priority: z.number().min(0).max(10),
});

export const emailVerificationSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWaitlistSignup = z.infer<typeof insertWaitlistSignupSchema>;
export type UpdateWaitlistSignup = z.infer<typeof updateWaitlistSignupSchema>;
export type WaitlistSignup = typeof waitlistSignups.$inferSelect;
export type EmailVerification = z.infer<typeof emailVerificationSchema>;

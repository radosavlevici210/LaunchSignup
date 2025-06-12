export interface WaitlistSignup {
  id: number;
  fullName: string;
  email: string;
  timestamp: string;
  status: string;
  emailVerified: boolean;
  verificationToken?: string;
  verificationExpiry?: string;
  referralSource?: string;
  interests?: string[];
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
  priority: number;
  invitedAt?: string;
  declinedAt?: string;
}

export interface WaitlistStats {
  totalSignups: number;
  todaySignups: number;
  weeklyGrowth: number;
  verifiedCount: number;
  pendingCount: number;
  invitedCount: number;
}

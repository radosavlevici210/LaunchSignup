export interface WaitlistSignup {
  id: number;
  fullName: string;
  email: string;
  timestamp: string;
  status: string;
}

export interface WaitlistStats {
  totalSignups: number;
  todaySignups: number;
  weeklyGrowth: number;
}

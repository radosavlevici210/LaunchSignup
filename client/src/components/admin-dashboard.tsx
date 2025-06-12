import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import type { WaitlistSignup } from "@/lib/types";

interface WaitlistResponse {
  signups: WaitlistSignup[];
  stats: {
    totalSignups: number;
    todaySignups: number;
    weeklyGrowth: number;
  };
}

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery<WaitlistResponse>({
    queryKey: ["/api/waitlist"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Waitlist Dashboard</h1>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Dashboard</h2>
        <p className="text-muted-foreground">Please try refreshing the page</p>
      </div>
    );
  }

  const signups = data?.signups || [];
  const stats = data?.stats || { totalSignups: 0, todaySignups: 0, weeklyGrowth: 0 };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Waitlist Dashboard</h1>
        <p className="text-muted-foreground">Manage and view all waitlist signups</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Signups</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalSignups}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-success" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Today</p>
                <p className="text-3xl font-bold text-foreground">{stats.todaySignups}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Weekly Growth</p>
                <p className="text-3xl font-bold text-foreground">+{stats.weeklyGrowth}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signups Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Signups</CardTitle>
        </CardHeader>
        <CardContent>
          {signups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No signups yet</h3>
              <p className="text-muted-foreground">Waitlist signups will appear here when users join.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {signups.map((signup) => (
                    <tr key={signup.id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{signup.fullName}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{signup.email}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(signup.timestamp), 'MMM d, yyyy HH:mm')}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          Active
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

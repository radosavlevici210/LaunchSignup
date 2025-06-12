import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Calendar, TrendingUp, Download, Mail, CheckCircle, Clock, UserPlus, Edit } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { WaitlistSignup } from "@/lib/types";

interface WaitlistResponse {
  signups: WaitlistSignup[];
  stats: {
    totalSignups: number;
    todaySignups: number;
    weeklyGrowth: number;
    verifiedCount: number;
    pendingCount: number;
    invitedCount: number;
  };
}

export default function AdminDashboard() {
  const [selectedSignups, setSelectedSignups] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingSignup, setEditingSignup] = useState<WaitlistSignup | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<WaitlistResponse>({
    queryKey: ["/api/waitlist", statusFilter],
    queryFn: async () => {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      return await fetch(`/api/waitlist${params}`).then(res => res.json());
    },
    refetchInterval: 30000,
  });

  const updateSignupMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return await apiRequest(`/api/waitlist/${id}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist"] });
      toast({ title: "Signup updated successfully" });
      setEditingSignup(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Update failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ signupIds, updates }: { signupIds: number[]; updates: any }) => {
      return await apiRequest("/api/waitlist/bulk-update", "POST", { signupIds, updates });
    },
    onSuccess: (_, { signupIds }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist"] });
      toast({ title: `Updated ${signupIds.length} signups successfully` });
      setSelectedSignups([]);
    },
    onError: (error: any) => {
      toast({ 
        title: "Bulk update failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleExport = async () => {
    try {
      const response = await fetch("/api/waitlist/export");
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "waitlist-export.csv";
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Export completed successfully" });
    } catch (error) {
      toast({ 
        title: "Export failed", 
        description: "Failed to download export file",
        variant: "destructive" 
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified": return <CheckCircle className="h-4 w-4" />;
      case "invited": return <Mail className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified": return "bg-green-500/10 text-green-700 border-green-500/20";
      case "invited": return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "pending": return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "declined": return "bg-red-500/10 text-red-700 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Waitlist Dashboard</h1>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
  const stats = data?.stats || { 
    totalSignups: 0, 
    todaySignups: 0, 
    weeklyGrowth: 0,
    verifiedCount: 0,
    pendingCount: 0,
    invitedCount: 0
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Waitlist Dashboard</h1>
          <p className="text-muted-foreground">Manage and view all waitlist signups</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
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
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Weekly Growth</p>
                <p className="text-3xl font-bold text-foreground">+{stats.weeklyGrowth}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Verified</p>
                <p className="text-3xl font-bold text-foreground">{stats.verifiedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-foreground">{stats.pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Invited</p>
                <p className="text-3xl font-bold text-foreground">{stats.invitedCount}</p>
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

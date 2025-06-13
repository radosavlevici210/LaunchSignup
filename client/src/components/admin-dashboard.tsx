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
    queryKey: ["/api/admin/waitlist", statusFilter],
    queryFn: async () => {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const response = await fetch(`/api/admin/waitlist${params}`, { headers });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('admin_token');
          throw new Error('Authentication required');
        }
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      
      return response.json();
    },
    refetchInterval: 30000,
    retry: (failureCount, error: any) => {
      if (error.message?.includes('Authentication required')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const updateSignupMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/waitlist/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Request failed');
      }
      
      return response.json();
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
      return await apiRequest("POST", "/api/waitlist/bulk-update", { signupIds, updates });
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

      {/* Enhanced Signups Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Waitlist Signups</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
              {selectedSignups.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedSignups.length} selected
                  </span>
                  <Button
                    size="sm"
                    onClick={() => bulkUpdateMutation.mutate({
                      signupIds: selectedSignups,
                      updates: { status: "invited" }
                    })}
                    disabled={bulkUpdateMutation.isPending}
                  >
                    Mark as Invited
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {signups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No signups found</h3>
              <p className="text-muted-foreground">
                {statusFilter !== "all" 
                  ? `No signups with ${statusFilter} status found.`
                  : "Waitlist signups will appear here when users join."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedSignups.length === signups.length && signups.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSignups(signups.map(s => s.id));
                          } else {
                            setSelectedSignups([]);
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {signups.map((signup) => (
                    <tr key={signup.id} className="hover:bg-muted/50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedSignups.includes(signup.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSignups([...selectedSignups, signup.id]);
                            } else {
                              setSelectedSignups(selectedSignups.filter(id => id !== signup.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{signup.fullName}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{signup.email}</div>
                        {signup.emailVerified && (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600">Verified</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge className={`flex items-center gap-1 ${getStatusColor(signup.status)}`}>
                          {getStatusIcon(signup.status)}
                          {signup.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-muted-foreground">{signup.priority || 0}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(signup.timestamp), 'MMM d, yyyy HH:mm')}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingSignup(signup)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Signup</DialogTitle>
                            </DialogHeader>
                            <EditSignupForm
                              signup={editingSignup}
                              onUpdate={(updates) => {
                                if (editingSignup) {
                                  updateSignupMutation.mutate({ id: editingSignup.id, updates });
                                }
                              }}
                              isLoading={updateSignupMutation.isPending}
                            />
                          </DialogContent>
                        </Dialog>
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

function EditSignupForm({ 
  signup, 
  onUpdate, 
  isLoading 
}: { 
  signup: WaitlistSignup | null; 
  onUpdate: (updates: any) => void; 
  isLoading: boolean;
}) {
  const [status, setStatus] = useState(signup?.status || "pending");
  const [priority, setPriority] = useState(signup?.priority?.toString() || "0");
  const [notes, setNotes] = useState(signup?.notes || "");

  if (!signup) return null;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Status</label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm font-medium">Priority (0-10)</label>
        <Input
          type="number"
          min="0"
          max="10"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this signup..."
        />
      </div>
      
      <Button
        onClick={() => onUpdate({
          status,
          priority: parseInt(priority) || 0,
          notes: notes.trim() || null
        })}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? "Updating..." : "Update Signup"}
      </Button>
    </div>
  );
}

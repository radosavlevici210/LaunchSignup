import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Rocket, ArrowLeft, LogOut } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminDashboard from "@/components/admin-dashboard";

export default function Admin() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { toast } = useToast();

  // Check for existing token on component mount
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      verifyToken(token);
    } else {
      setIsCheckingAuth(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      
      if (data.authenticated) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('admin_token');
      }
    } catch (error) {
      localStorage.removeItem('admin_token');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/admin/auth", { email });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authenticated && data.token) {
        localStorage.setItem('admin_token', data.token);
        setIsAuthenticated(true);
        toast({
          title: "Success",
          description: "Admin access granted",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Access denied. Only root user can access admin dashboard.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    loginMutation.mutate(email.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center mx-auto mb-4">
            <Rocket className="h-4 w-4 text-white animate-pulse" />
          </div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                <Rocket className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">InnovateLab</span>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Landing
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {!isAuthenticated ? (
            /* Admin Authentication */
            <div className="max-w-md mx-auto">
              <Card className="shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="admin-email">Admin Email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ervin210@icloud.com"
                        required
                        className="mt-2"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full gradient-bg hover-lift"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Authenticating..." : "Access Dashboard"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Admin Dashboard */
            <AdminDashboard />
          )}
        </div>
      </div>
    </div>
  );
}

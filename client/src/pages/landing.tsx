import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Rocket, CloudLightning, Shield, Users } from "lucide-react";
import WaitlistForm from "@/components/waitlist-form";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [signupData, setSignupData] = useState<{ fullName: string; email: string } | null>(null);

  const handleSignupSuccess = (data: { fullName: string; email: string }) => {
    setSignupData(data);
    setShowSuccess(true);
  };

  const resetForm = () => {
    setShowSuccess(false);
    setSignupData(null);
  };

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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/admin")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Admin View
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="slide-up">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              The Future of{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Innovation
              </span>
              {' '}Starts Here
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands of forward-thinking professionals who are revolutionizing their industry with our cutting-edge platform. Be the first to experience the next generation of productivity tools.
            </p>
            
            {/* Key Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
              <div className="flex items-center space-x-3 text-left">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CloudLightning className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">CloudLightning Fast</h3>
                  <p className="text-sm text-muted-foreground">10x faster workflows</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Enterprise Ready</h3>
                  <p className="text-sm text-muted-foreground">Bank-level security</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Team-First</h3>
                  <p className="text-sm text-muted-foreground">Built for collaboration</p>
                </div>
              </div>
            </div>
          </div>

          {/* Waitlist Form */}
          <div className="max-w-md mx-auto">
            {!showSuccess ? (
              <WaitlistForm onSuccess={handleSignupSuccess} />
            ) : (
              <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">You're on the list!</h2>
                  <p className="text-muted-foreground mb-6">
                    Thanks for joining our waitlist, {signupData?.fullName}. We'll notify you as soon as we launch.
                  </p>
                  <div className="bg-muted rounded-lg p-4 mb-6">
                    <p className="text-sm text-muted-foreground text-left">
                      <strong className="text-foreground">What's next?</strong><br />
                      • You'll receive a confirmation email shortly<br />
                      • We'll send you exclusive updates on our progress<br />
                      • Early access when we launch
                    </p>
                  </div>
                  <Button 
                    variant="ghost"
                    onClick={resetForm}
                    className="text-primary hover:text-secondary transition-colors font-medium"
                  >
                    Sign up someone else →
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Trusted by industry leaders</h2>
            <p className="text-muted-foreground">Join professionals already on our waitlist</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
            {['TechCorp', 'StartupX', 'InnovateCo', 'FutureLab'].map((company) => (
              <div key={company} className="text-center">
                <div className="h-12 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground font-semibold">{company}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                <Rocket className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground">InnovateLab</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} InnovateLab. All rights reserved. • Built with passion by our team
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Shield } from "lucide-react";

const waitlistSchema = z.object({
  fullName: z.string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
  email: z.string()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  referralSource: z.string().optional(),
  interests: z.array(z.string()).optional(),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

interface WaitlistFormProps {
  onSuccess: (data: WaitlistFormData) => void;
}

export default function WaitlistForm({ onSuccess }: WaitlistFormProps) {
  const { toast } = useToast();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  const form = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      fullName: "",
      email: "",
      referralSource: "",
      interests: [],
    },
  });

  const interestOptions = [
    "Product Updates",
    "Beta Testing",
    "Industry News",
    "Technical Documentation",
    "Community Events",
    "Partnership Opportunities"
  ];

  const referralSources = [
    "Search Engine",
    "Social Media",
    "Friend/Colleague",
    "Blog/Article",
    "Conference/Event",
    "Other"
  ];

  const signupMutation = useMutation({
    mutationFn: async (data: WaitlistFormData) => {
      const response = await apiRequest("POST", "/api/waitlist", data);
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success!",
        description: data.message || "Successfully joined the waitlist!",
      });
      onSuccess(variables);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join waitlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WaitlistFormData) => {
    const formData = {
      ...data,
      interests: selectedInterests,
    };
    signupMutation.mutate(formData);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <Card className="shadow-xl max-w-md mx-auto w-full">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Join the Waitlist
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Be among the first to access our revolutionary platform
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                className="mt-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                {...form.register("fullName")}
              />
              {form.formState.errors.fullName && (
                <p className="text-destructive text-sm mt-1 flex items-center gap-1">
                  <span className="text-xs">⚠</span>
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                className="mt-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-destructive text-sm mt-1 flex items-center gap-1">
                  <span className="text-xs">⚠</span>
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">How did you hear about us?</Label>
              <Select onValueChange={(value) => form.setValue("referralSource", value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {referralSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Areas of Interest</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Select topics you'd like updates about (optional)
              </p>
              <div className="grid grid-cols-1 gap-3">
                {interestOptions.map((interest) => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox
                      id={interest}
                      checked={selectedInterests.includes(interest)}
                      onCheckedChange={() => toggleInterest(interest)}
                      className="rounded border-gray-300"
                    />
                    <Label 
                      htmlFor={interest} 
                      className="text-sm cursor-pointer hover:text-foreground transition-colors"
                    >
                      {interest}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            disabled={signupMutation.isPending}
          >
            {signupMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining Waitlist...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Join Waitlist
              </>
            )}
          </Button>
        </form>
        
        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="font-medium">Privacy Protected</span>
          </div>
          <p className="text-xs text-muted-foreground">
            We respect your privacy. Your email will only be used for waitlist updates and product announcements. 
            No spam, unsubscribe anytime.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const waitlistSchema = z.object({
  fullName: z.string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
  email: z.string()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

interface WaitlistFormProps {
  onSuccess: (data: WaitlistFormData) => void;
}

export default function WaitlistForm({ onSuccess }: WaitlistFormProps) {
  const { toast } = useToast();
  
  const form = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      fullName: "",
      email: "",
    },
  });

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
    signupMutation.mutate(data);
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Join the Waitlist</CardTitle>
        <p className="text-muted-foreground">Be among the first to access our revolutionary platform</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              className="mt-2 form-input"
              {...form.register("fullName")}
            />
            {form.formState.errors.fullName && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              className="mt-2 form-input"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full mt-6 gradient-bg hover-lift"
            disabled={signupMutation.isPending}
          >
            {signupMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Waitlist"
            )}
          </Button>
        </form>
        
        <p className="text-xs text-muted-foreground mt-4 text-center">
          By joining, you agree to our privacy policy. We'll only send you important updates.
        </p>
      </CardContent>
    </Card>
  );
}

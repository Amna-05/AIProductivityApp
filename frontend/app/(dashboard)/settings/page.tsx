"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, User, Lock, LogOut, KeyRound, Eye, EyeOff } from "lucide-react";

import { useAuthStore } from "@/lib/store/authStore";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

// Password change schema
const passwordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password form
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      // Note: You'll need to add this endpoint to your auth API
      return authApi.changePassword(data.current_password, data.new_password);
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
      form.reset();
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast.error(axiosError.response?.data?.detail || "Failed to change password");
    },
  });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
      logout();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch {
      toast.error("Failed to logout");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const onSubmit = (data: PasswordFormValues) => {
    changePasswordMutation.mutate(data);
  };

  // Get user initials
  const getUserInitials = () => {
    if (!user?.username) return "U";
    const names = user.username.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 animate-fade-in-up bg-background min-h-full">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground font-medium">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card className="border-border bg-card hover:shadow-lg transition-shadow">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-primary/20 flex-shrink-0">
              {getUserInitials()}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground break-words">{user?.username || "User"}</p>
              <p className="text-sm text-muted-foreground break-all">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Section */}
      <Card className="border-border bg-card hover:shadow-lg transition-shadow">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            Change Password
          </CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="current_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card className="border-border bg-card hover:shadow-lg transition-shadow">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <KeyRound className="h-4 w-4 text-primary" />
            </div>
            Account Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {/* Forgot Password Link */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors">
            <div>
              <p className="font-semibold text-foreground">Forgot Password?</p>
              <p className="text-sm text-muted-foreground">Reset your password via email</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/forgot-password")}
              className="hover:shadow-md transition-all"
            >
              Reset
            </Button>
          </div>

          <Separator className="bg-border/30" />

          {/* Logout */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors">
            <div>
              <p className="font-semibold text-foreground">Logout</p>
              <p className="text-sm text-muted-foreground">Sign out of your account</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

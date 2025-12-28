"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, Loader2, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if already logged in - redirect to dashboard
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const userData = await authApi.getCurrentUser();
        if (userData) {
          setUser(userData);
          router.replace("/dashboard");
          return;
        }
      } catch {
        // Not logged in, show login form
      }
      setCheckingAuth(false);
    };
    checkExistingAuth();
  }, [router, setUser]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(data.email, data.password);

      // Set user data (tokens are in httpOnly cookies)
      setUser(response.user);

      toast.success("Welcome back! 🎉");
      setIsRedirecting(true);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.detail || "Invalid credentials");
      setIsLoading(false);
    }
  };

  // Show checking auth state
  if (checkingAuth) {
    return (
      <Card className="w-full shadow-lg border">
        <CardContent className="py-16">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-sm text-gray-500">Checking session...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show redirecting state
  if (isRedirecting) {
    return (
      <Card className="w-full shadow-lg border">
        <CardContent className="py-16">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mx-auto">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">Welcome back!</p>
              <p className="text-sm text-gray-500 mt-1">Redirecting to dashboard...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border">
      <CardHeader className="p-10 pb-8">
        {/* ELEVATE Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary shadow-sm">
              <ArrowUp className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">ELEVATE</h1>
              <p className="text-xs text-muted-foreground">Lift Your Productivity</p>
            </div>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold mb-2">Welcome back</CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="px-10 pb-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...register("email")}
              disabled={isLoading}
              className="h-12 border-2 focus:ring-2"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="password" className="text-sm font-semibold">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...register("password")}
                disabled={isLoading}
                className="h-12 border-2 focus:ring-2 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="px-10 pb-10 flex flex-col gap-4 pt-2">
          <Button type="submit" className="w-full h-12 font-semibold" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">
                Don't have an account?
              </span>
            </div>
          </div>
          <Link href="/register" className="w-full">
            <Button variant="outline" className="w-full h-12 font-semibold" type="button">
              Create new account
            </Button>
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

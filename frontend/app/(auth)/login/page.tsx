"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";

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
    } catch (error) {
      console.error("Login error:", error);
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast.error(axiosError.response?.data?.detail || "Invalid credentials");
      setIsLoading(false);
    }
  };

  // Show checking auth state
  if (checkingAuth) {
    return (
      <Card variant="elevated" className="w-full">
        <CardContent className="py-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-4"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Checking session...</p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  // Show redirecting state
  if (isRedirecting) {
    return (
      <Card variant="elevated" className="w-full">
        <CardContent className="py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mx-auto">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Welcome back!</p>
              <p className="text-sm text-muted-foreground mt-1">Redirecting to dashboard...</p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="w-full">
      <CardHeader className="p-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <CardTitle className="text-2xl font-bold mb-2">Welcome back</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to continue to ELEVATE
          </CardDescription>
        </motion.div>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="px-8 pb-6 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-2"
          >
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:text-accent transition-colors"
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
          </motion.div>
        </CardContent>

        <CardFooter className="px-8 pb-8 flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="w-full"
          >
            <Button type="submit" className="w-full h-11 font-semibold" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="relative my-2"
          >
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">
                New here?
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="w-full"
          >
            <Link href="/register" className="w-full block">
              <Button variant="outline" className="w-full h-11 font-semibold" type="button">
                Create new account
              </Button>
            </Link>
          </motion.div>
        </CardFooter>
      </form>
    </Card>
  );
}

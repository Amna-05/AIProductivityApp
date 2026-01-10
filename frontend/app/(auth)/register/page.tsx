"use client";

import { useState } from "react";
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

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      const response = await authApi.register(data);

      // User is auto-logged in after registration
      setUser(response.user);

      toast.success(response.message || "Account created successfully!");
      setIsRedirecting(true);
      router.push("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast.error(axiosError.response?.data?.detail || "Registration failed");
      setIsLoading(false);
    }
  };

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
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-success/20 mx-auto">
              <Loader2 className="h-8 w-8 animate-spin text-success" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Account created!</p>
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
          <CardTitle className="text-2xl font-bold mb-2">Create an account</CardTitle>
          <CardDescription className="text-muted-foreground">
            Join ELEVATE and boost your productivity
          </CardDescription>
        </motion.div>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="px-8 pb-6 space-y-4">
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
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="johndoe"
              {...register("username")}
              disabled={isLoading}
            />
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-2"
          >
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password (min 8 chars)"
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
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters
            </p>
          </motion.div>
        </CardContent>

        <CardFooter className="px-8 pb-8 flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="w-full"
          >
            <Button type="submit" className="w-full h-11 font-semibold" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="relative my-2"
          >
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">
                Already a member?
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="w-full"
          >
            <Link href="/login" className="w-full block">
              <Button variant="outline" className="w-full h-11 font-semibold" type="button">
                Sign in instead
              </Button>
            </Link>
          </motion.div>
        </CardFooter>
      </form>
    </Card>
  );
}

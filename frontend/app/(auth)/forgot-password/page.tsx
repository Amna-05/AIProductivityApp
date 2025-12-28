"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, Loader2, Mail, CheckCircle2 } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      const response = await authApi.forgotPassword(data.email);

      toast.success(response.message || "Password reset instructions sent!");
      setEmailSent(true);
    } catch (error: unknown) {
      console.error("Forgot password error:", error);
      toast.error(error.response?.data?.detail || "Failed to send reset instructions");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
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
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold mb-2 text-center">Check your email</CardTitle>
          <CardDescription className="text-muted-foreground text-center">
            If an account exists with that email, you will receive password reset instructions.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 pb-6">
          <p className="text-sm text-muted-foreground text-center">
            Please check your email inbox (and spam folder) for the password reset link.
          </p>
        </CardContent>
        <CardFooter className="px-10 pb-10">
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full h-12 font-semibold">
              Back to login
            </Button>
          </Link>
        </CardFooter>
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
        <CardTitle className="text-2xl font-bold mb-2">Forgot password?</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your email address and we will send you instructions to reset your password.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="px-10 pb-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register("email")}
                disabled={isLoading}
                className="h-12 border-2 focus:ring-2 pl-10"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="px-10 pb-10 flex flex-col gap-4 pt-2">
          <Button type="submit" className="w-full h-12 font-semibold" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending instructions...
              </>
            ) : (
              "Send reset instructions"
            )}
          </Button>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">
                Remember your password?
              </span>
            </div>
          </div>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full h-12 font-semibold" type="button">
              Back to login
            </Button>
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

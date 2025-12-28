"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUp, Sparkles, Grid2x2, BarChart3, TrendingUp, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
        router.replace("/dashboard");
      } catch {
        setUser(null);
        setIsCheckingAuth(false);
      }
    };

    checkAuthAndRedirect();
  }, [router, setUser]);

  // Show landing page content immediately, with subtle auth check indicator
  return (
    <div className="min-h-screen bg-white">
      {/* Auth check overlay - only shows briefly if logged in */}
      {isCheckingAuth && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm border border-gray-100">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          <span className="text-xs text-gray-600">Checking session...</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Logo & Branding */}
          <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-100">
              <ArrowUp className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ELEVATE</h1>
              <p className="text-sm text-gray-500">Lift Your Productivity to New Heights</p>
            </div>
          </div>

          {/* Hero Headline */}
          <div className="text-center mb-8 space-y-4 animate-fade-in">
            <h2 className="text-5xl font-bold text-gray-900 leading-tight">
              ELEVATE Your Productivity
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              AI-powered task management that helps you achieve more with intelligent insights and effortless organization
            </p>
          </div>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4 mb-16 animate-fade-in">
            <Link href="/register">
              <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 px-8 h-12">
                <ArrowUp className="h-5 w-5" />
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8 h-12">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Product Preview */}
          <div className="relative max-w-5xl mx-auto animate-fade-in">
            <div className="relative rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden bg-white">
              <div className="aspect-video bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <div className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mx-auto">
                    <ArrowUp className="h-10 w-10 text-emerald-600 animate-float-up" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700">
                    Clean, Intuitive Dashboard
                  </p>
                  <p className="text-sm text-gray-500 max-w-md">
                    Your productivity workspace with AI-powered task parsing, priority matrix, and analytics
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Feature Badges */}
            <div className="absolute -top-6 -left-6 hidden lg:block">
              <Card className="p-4 shadow-lg animate-float-up bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">AI Task Parser</p>
                    <p className="text-xs text-gray-500">Natural language</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="absolute -top-6 -right-6 hidden lg:block">
              <Card className="p-4 shadow-lg animate-float-up bg-white" style={{ animationDelay: "0.5s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Grid2x2 className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Priority Matrix</p>
                    <p className="text-xs text-gray-500">Eisenhower method</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="absolute -bottom-6 -left-6 hidden lg:block">
              <Card className="p-4 shadow-lg animate-float-up bg-white" style={{ animationDelay: "1s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Analytics</p>
                    <p className="text-xs text-gray-500">Track progress</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="absolute -bottom-6 -right-6 hidden lg:block">
              <Card className="p-4 shadow-lg animate-float-up bg-white" style={{ animationDelay: "1.5s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Smart Insights</p>
                    <p className="text-xs text-gray-500">Productivity trends</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to stay productive
            </h3>
            <p className="text-lg text-gray-600">
              Powerful features designed to help you achieve more
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-white">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-emerald-600" />
              </div>
              <h4 className="font-semibold text-lg mb-2 text-gray-900">AI Task Parsing</h4>
              <p className="text-sm text-gray-600">
                Describe tasks in natural language and let AI extract all the details automatically
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-white">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mb-4">
                <Grid2x2 className="h-6 w-6 text-amber-600" />
              </div>
              <h4 className="font-semibold text-lg mb-2 text-gray-900">Priority Matrix</h4>
              <p className="text-sm text-gray-600">
                Organize tasks using the Eisenhower Matrix for clear prioritization
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-white">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-lg mb-2 text-gray-900">Analytics & Insights</h4>
              <p className="text-sm text-gray-600">
                Visualize your productivity with comprehensive analytics and trends
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-white">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <h4 className="font-semibold text-lg mb-2 text-gray-900">Productivity Tracking</h4>
              <p className="text-sm text-gray-600">
                Track your progress with streaks, completion rates, and time insights
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUp className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold text-gray-900">ELEVATE</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="#" className="hover:text-gray-900 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-gray-900 transition-colors">Terms</Link>
              <Link href="#" className="hover:text-gray-900 transition-colors">Contact</Link>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            © 2025 ELEVATE. Lift Your Productivity to New Heights.
          </p>
        </div>
      </footer>
    </div>
  );
}

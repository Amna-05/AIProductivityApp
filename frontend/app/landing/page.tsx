"use client";

import Link from "next/link";
import { ArrowUp, Sparkles, Grid2x2, BarChart3, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Logo & Branding */}
          <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10">
              <ArrowUp className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">ELEVATE</h1>
              <p className="text-sm text-muted-foreground">Lift Your Productivity to New Heights</p>
            </div>
          </div>

          {/* Hero Headline */}
          <div className="text-center mb-8 space-y-4 animate-fade-in">
            <h2 className="text-5xl font-bold text-foreground leading-tight">
              ELEVATE Your Productivity
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AI-powered task management that helps you achieve more with intelligent insights and effortless organization
            </p>
          </div>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4 mb-16 animate-fade-in">
            <Link href="/register">
              <Button size="xl" className="gap-2">
                <ArrowUp className="h-5 w-5" />
                Create Account
              </Button>
            </Link>
            <Link href="/login">
              <Button size="xl" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Product Preview */}
          <div className="relative max-w-5xl mx-auto animate-fade-in">
            <div className="relative rounded-xl shadow-2xl border-2 border-border overflow-hidden bg-card">
              {/* Placeholder for dashboard screenshot */}
              <div className="aspect-video bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mx-auto">
                    <ArrowUp className="h-10 w-10 text-primary animate-float-up" />
                  </div>
                  <p className="text-lg font-semibold text-muted-foreground">
                    Clean, Intuitive Dashboard
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Your productivity workspace with AI-powered task parsing, priority matrix, and analytics
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Feature Badges */}
            <div className="absolute -top-6 -left-6 hidden lg:block">
              <Card className="p-4 shadow-lg animate-float-up">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">AI Task Parser</p>
                    <p className="text-xs text-muted-foreground">Natural language</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="absolute -top-6 -right-6 hidden lg:block">
              <Card className="p-4 shadow-lg animate-float-up" style={{ animationDelay: "0.5s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Grid2x2 className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Priority Matrix</p>
                    <p className="text-xs text-muted-foreground">Eisenhower method</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="absolute -bottom-6 -left-6 hidden lg:block">
              <Card className="p-4 shadow-lg animate-float-up" style={{ animationDelay: "1s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Analytics</p>
                    <p className="text-xs text-muted-foreground">Track progress</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="absolute -bottom-6 -right-6 hidden lg:block">
              <Card className="p-4 shadow-lg animate-float-up" style={{ animationDelay: "1.5s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Smart Insights</p>
                    <p className="text-xs text-muted-foreground">Productivity trends</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Everything you need to stay productive
            </h3>
            <p className="text-lg text-muted-foreground">
              Powerful features designed to help you achieve more
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-lg mb-2">AI Task Parsing</h4>
              <p className="text-sm text-muted-foreground">
                Describe tasks in natural language and let AI extract all the details automatically
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center mb-4">
                <Grid2x2 className="h-6 w-6 text-warning" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Priority Matrix</h4>
              <p className="text-sm text-muted-foreground">
                Organize tasks using the Eisenhower Matrix for clear prioritization
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-info/20 to-info/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-info" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Analytics & Insights</h4>
              <p className="text-sm text-muted-foreground">
                Visualize your productivity with comprehensive analytics and trends
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Productivity Tracking</h4>
              <p className="text-sm text-muted-foreground">
                Track your progress with streaks, completion rates, and time insights
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUp className="h-5 w-5 text-primary" />
              <span className="font-semibold">ELEVATE</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            © 2025 ELEVATE. Lift Your Productivity to New Heights.
          </p>
        </div>
      </footer>
    </div>
  );
}

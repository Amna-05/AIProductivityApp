"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUp, Sparkles, Grid2x2, BarChart3, TrendingUp, CheckCircle2, ArrowRight, Star, Users, Target, Loader2, Zap } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { cardContainerVariants, cardItemVariants } from "@/lib/animations/variants";

export default function HomePage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [navigating, setNavigating] = useState<string | null>(null);

  // Silent auth check - if logged in, go to dashboard
  useEffect(() => {
    authApi.getCurrentUser()
      .then(userData => {
        setUser(userData);
        setNavigating("dashboard");
        router.replace("/dashboard");
      })
      .catch(() => {
        setCheckingAuth(false);
      });
  }, [router, setUser]);

  const handleNavigate = (path: string) => {
    setNavigating(path);
    router.push(path);
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg mx-auto">
            <ArrowUp className="h-8 w-8 text-white" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        </motion.div>
      </div>
    );
  }

  // Show navigating state
  if (navigating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg mx-auto">
            <ArrowUp className="h-8 w-8 text-white" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">
            {navigating === "dashboard" ? "Redirecting to dashboard..." : `Loading ${navigating}...`}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 flex-shrink-0">
              <ArrowUp className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
            </div>
            <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">ELEVATE</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" className="text-sm sm:text-base font-medium hover:bg-secondary hover:text-primary px-2 sm:px-4" onClick={() => handleNavigate("/login")}>
              Sign In
            </Button>
            <Button className="text-sm sm:text-base bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 font-semibold px-3 sm:px-4" onClick={() => handleNavigate("/register")}>
              Get Started
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 overflow-x-clip bg-background">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-background" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

        {/* Floating Elements */}
        <motion.div
          className="absolute top-32 left-[10%] animate-float z-20 hidden lg:block"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="bg-card rounded-2xl shadow-xl p-4 border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Task Completed!</p>
                <p className="text-xs text-muted-foreground">+10 productivity points</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute top-48 right-[8%] animate-float z-20 hidden lg:block"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="bg-card rounded-2xl shadow-xl p-4 border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">7 Day Streak!</p>
                <p className="text-xs text-muted-foreground">Keep it up!</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-32 left-[15%] animate-float z-20 hidden lg:block"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="bg-card rounded-2xl shadow-xl p-4 border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Productivity Up</p>
                <p className="text-xs text-primary font-medium">+23% this week</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-40 right-[12%] animate-float z-20 hidden lg:block"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="bg-card rounded-2xl shadow-xl p-4 border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-background" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary border-2 border-background" />
                <div className="w-8 h-8 rounded-full bg-primary/80 border-2 border-background" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">2k+ users</p>
            </div>
          </div>
        </motion.div>

        <div className="container mx-auto max-w-6xl relative z-10">
          {/* Badge */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-5 py-2 hover:bg-primary/15 transition-colors">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">AI-Powered Task Management</span>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            className="text-center mb-6 sm:mb-8 space-y-4 sm:space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">ELEVATE</span>
              <br />
              Your Productivity
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              The all-in-one task management platform that helps you
              <span className="font-semibold text-primary"> organize, prioritize, </span>
              and <span className="font-semibold text-accent">achieve</span> — effortlessly.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 w-full px-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg font-bold shadow-xl transition-all duration-300 w-full sm:w-auto" onClick={() => handleNavigate("/register")}>
              <Sparkles className="h-4 sm:h-5 w-4 sm:w-5 hidden sm:block" />
              <span>Start Free Trial</span>
            </Button>
            <Button size="lg" variant="outline" className="px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg font-semibold border-2 border-border hover:border-primary hover:bg-secondary hover:text-primary transition-all duration-300 w-full sm:w-auto" onClick={() => handleNavigate("/login")}>
              Sign In
            </Button>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="text-center">
              <p className="text-4xl font-black text-foreground">2K+</p>
              <p className="text-sm text-muted-foreground font-medium">Active Users</p>
            </div>
            <div className="w-px h-12 bg-border hidden md:block" />
            <div className="text-center">
              <p className="text-4xl font-black text-foreground">50K+</p>
              <p className="text-sm text-muted-foreground font-medium">Tasks Completed</p>
            </div>
            <div className="w-px h-12 bg-border hidden md:block" />
            <div className="text-center">
              <p className="text-4xl font-black text-primary">4.9</p>
              <p className="text-sm text-muted-foreground font-medium">User Rating</p>
            </div>
          </motion.div>

          {/* App Preview - Hidden on mobile */}
          <motion.div
            className="relative max-w-5xl mx-auto hidden lg:block"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-3xl blur-2xl opacity-15 transform scale-95" />
            <div className="relative bg-card rounded-3xl shadow-2xl border border-border overflow-hidden">
              <div className="bg-secondary px-4 py-3 flex items-center gap-2 border-b border-border">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <div className="w-3 h-3 rounded-full bg-success" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-card rounded-lg px-4 py-1 text-sm text-muted-foreground border border-border">app.elevate.io/dashboard</div>
                </div>
              </div>
              <div className="aspect-video bg-background p-8">
                <div className="h-full grid grid-cols-3 gap-4">
                  {/* Sidebar Mock */}
                  <div className="col-span-1 bg-card rounded-2xl shadow-lg p-4 space-y-3 border border-border">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent" />
                      <div className="h-4 w-20 bg-secondary rounded" />
                    </div>
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${i === 1 ? 'bg-primary/20' : 'hover:bg-secondary/50'}`}>
                        <div className={`w-6 h-6 rounded ${i === 1 ? 'bg-primary' : 'bg-secondary'}`} />
                        <div className={`h-3 w-16 rounded ${i === 1 ? 'bg-primary/40' : 'bg-secondary'}`} />
                      </div>
                    ))}
                  </div>
                  {/* Main Content Mock */}
                  <div className="col-span-2 space-y-4">
                    <div className="flex gap-4">
                      {[
                        { bg: 'from-primary to-accent', label: 'Tasks' },
                        { bg: 'from-blue-600 to-blue-500', label: 'In Progress' },
                        { bg: 'from-purple-600 to-purple-500', label: 'Done' },
                        { bg: 'from-amber-500 to-orange-500', label: 'Urgent' }
                      ].map((item, i) => (
                        <div key={i} className={`flex-1 bg-card rounded-xl shadow-lg p-4 border-l-4 border-transparent hover:border-primary transition-all`}>
                          <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${item.bg} mb-2`} />
                          <div className="h-3 w-12 bg-secondary rounded mb-1" />
                          <div className="h-6 w-8 bg-secondary rounded font-bold" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4 h-48">
                      <div className="bg-card rounded-xl shadow-lg p-4 border border-border">
                        <div className="h-3 w-24 bg-secondary rounded mb-4" />
                        <div className="grid grid-cols-2 gap-2 h-32">
                          <div className="bg-destructive/20 rounded-lg p-2 border border-destructive/30">
                            <div className="h-2 w-12 bg-destructive/40 rounded mb-1" />
                            <div className="h-2 w-8 bg-destructive/30 rounded" />
                          </div>
                          <div className="bg-warning/20 rounded-lg p-2 border border-warning/30">
                            <div className="h-2 w-12 bg-warning/40 rounded mb-1" />
                            <div className="h-2 w-8 bg-warning/30 rounded" />
                          </div>
                          <div className="bg-success/20 rounded-lg p-2 border border-success/30">
                            <div className="h-2 w-12 bg-success/40 rounded mb-1" />
                            <div className="h-2 w-8 bg-success/30 rounded" />
                          </div>
                          <div className="bg-info/20 rounded-lg p-2 border border-info/30">
                            <div className="h-2 w-12 bg-info/40 rounded mb-1" />
                            <div className="h-2 w-8 bg-info/30 rounded" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-card rounded-xl shadow-lg p-4 border border-border">
                        <div className="h-3 w-20 bg-secondary rounded mb-4" />
                        <div className="flex items-end gap-2 h-32">
                          {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                            <div key={i} className="flex-1 bg-gradient-to-t from-primary to-accent rounded-t" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-background relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />

        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-5 py-2 mb-6 hover:bg-primary/15 transition-colors">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">
              Everything You Need to
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Succeed</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Supercharge your workflow with intelligent features designed for maximum productivity
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={cardContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Feature Card 1 */}
            <motion.div
              variants={cardItemVariants}
              className="group relative bg-card rounded-3xl p-8 shadow-lg border border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-300">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">AI Task Parser</h3>
                <p className="text-muted-foreground">
                  Describe tasks naturally and let AI extract dates, priorities, and categories instantly.
                </p>
              </div>
            </motion.div>

            {/* Feature Card 2 */}
            <motion.div
              variants={cardItemVariants}
              className="group relative bg-card rounded-3xl p-8 shadow-lg border border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-300">
                  <Grid2x2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Priority Matrix</h3>
                <p className="text-muted-foreground">
                  Eisenhower method visualization to focus on what truly matters.
                </p>
              </div>
            </motion.div>

            {/* Feature Card 3 */}
            <motion.div
              variants={cardItemVariants}
              className="group relative bg-card rounded-3xl p-8 shadow-lg border border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-300">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Smart Analytics</h3>
                <p className="text-muted-foreground">
                  Comprehensive insights with charts, trends, and productivity scores.
                </p>
              </div>
            </motion.div>

            {/* Feature Card 4 */}
            <motion.div
              variants={cardItemVariants}
              className="group relative bg-card rounded-3xl p-8 shadow-lg border border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-300">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Progress Tracking</h3>
                <p className="text-muted-foreground">
                  Daily streaks, completion rates, and achievement badges to stay motivated.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-background via-secondary/20 to-background relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">
              Get Started in
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Seconds</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to transform your productivity
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={cardContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { num: "01", icon: Users, title: "Create Account", desc: "Sign up free in 30 seconds. No credit card required." },
              { num: "02", icon: Target, title: "Add Your Tasks", desc: "Use AI or manual input to capture everything you need to do." },
              { num: "03", icon: TrendingUp, title: "Get Productive", desc: "Watch your productivity soar with smart prioritization." },
            ].map((step, i) => (
              <motion.div
                key={i}
                variants={cardItemVariants}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                <div className="relative bg-card rounded-3xl p-8 border border-border hover:border-primary/40 transition-all duration-500">
                  <div className="text-6xl font-black text-muted-foreground mb-4">{step.num}</div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
                    <step.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="py-16 px-6 bg-background border-t border-border/50">
        <div className="container mx-auto max-w-6xl">
          {/* Footer Top */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                  <ArrowUp className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-foreground">ELEVATE</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered task management for maximum productivity.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Security</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm">Resources</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Documentation</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Support</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/30 my-8" />

          {/* Footer Bottom */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 ELEVATE. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Twitter</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">GitHub</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">LinkedIn</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

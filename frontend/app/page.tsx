"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUp, Sparkles, Grid2x2, BarChart3, TrendingUp, Zap, CheckCircle2, ArrowRight, Star, Users, Clock, Target } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  // Silent auth check - if logged in, go to dashboard
  useEffect(() => {
    authApi.getCurrentUser()
      .then(userData => {
        setUser(userData);
        router.replace("/dashboard");
      })
      .catch(() => {
        // Not logged in - stay on landing page
      });
  }, [router, setUser]);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
              <ArrowUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">ELEVATE</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-medium hover:bg-emerald-50 hover:text-emerald-700">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/30 font-semibold">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-x-clip">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-cyan-50/30" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

        {/* Floating Elements */}
        <div className="absolute top-32 left-[10%] animate-float z-20 hidden lg:block">
          <div className="bg-white rounded-2xl shadow-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Task Completed!</p>
                <p className="text-xs text-gray-500">+10 productivity points</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-48 right-[8%] animate-float z-20 hidden lg:block" style={{ animationDelay: "0.5s" }}>
          <div className="bg-white rounded-2xl shadow-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">7 Day Streak!</p>
                <p className="text-xs text-gray-500">Keep it up!</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-32 left-[15%] animate-float z-20 hidden lg:block" style={{ animationDelay: "1s" }}>
          <div className="bg-white rounded-2xl shadow-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Productivity Up</p>
                <p className="text-xs text-emerald-600 font-medium">+23% this week</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-40 right-[12%] animate-float z-20 hidden lg:block" style={{ animationDelay: "1.5s" }}>
          <div className="bg-white rounded-2xl shadow-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 border-2 border-white" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 border-2 border-white" />
              </div>
              <p className="text-xs text-gray-600 font-medium">2k+ users</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          {/* Badge */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200 rounded-full px-5 py-2">
              <Zap className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">AI-Powered Task Management</span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center mb-8 space-y-6 animate-fade-in">
            <h1 className="text-6xl md:text-7xl font-black text-gray-900 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">ELEVATE</span>
              <br />
              Your Productivity
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              The all-in-one task management platform that helps you
              <span className="font-semibold text-emerald-600"> organize, prioritize, </span>
              and <span className="font-semibold text-teal-600">achieve</span> — effortlessly.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in">
            <Link href="/register">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-8 h-14 text-lg font-bold shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-300">
                <Sparkles className="h-5 w-5" />
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8 h-14 text-lg font-semibold border-2 border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-300">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mb-16 animate-fade-in">
            <div className="text-center">
              <p className="text-4xl font-black text-gray-900">2K+</p>
              <p className="text-sm text-gray-500 font-medium">Active Users</p>
            </div>
            <div className="w-px h-12 bg-gray-200 hidden md:block" />
            <div className="text-center">
              <p className="text-4xl font-black text-gray-900">50K+</p>
              <p className="text-sm text-gray-500 font-medium">Tasks Completed</p>
            </div>
            <div className="w-px h-12 bg-gray-200 hidden md:block" />
            <div className="text-center">
              <p className="text-4xl font-black text-emerald-600">4.9</p>
              <p className="text-sm text-gray-500 font-medium">User Rating</p>
            </div>
          </div>

          {/* App Preview */}
          <div className="relative max-w-5xl mx-auto animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl blur-2xl opacity-20 transform scale-95" />
            <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 flex items-center gap-2 border-b">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white rounded-lg px-4 py-1 text-sm text-gray-500 border">app.elevate.io/dashboard</div>
                </div>
              </div>
              <div className="aspect-video bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/50 p-8">
                <div className="h-full grid grid-cols-3 gap-4">
                  {/* Sidebar Mock */}
                  <div className="col-span-1 bg-white rounded-2xl shadow-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600" />
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                    </div>
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${i === 1 ? 'bg-emerald-100' : ''}`}>
                        <div className={`w-6 h-6 rounded ${i === 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                        <div className={`h-3 w-16 rounded ${i === 1 ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                      </div>
                    ))}
                  </div>
                  {/* Main Content Mock */}
                  <div className="col-span-2 space-y-4">
                    <div className="flex gap-4">
                      {['emerald', 'blue', 'purple', 'amber'].map((color, i) => (
                        <div key={i} className={`flex-1 bg-white rounded-xl shadow-lg p-4 border-l-4 border-${color}-500`}>
                          <div className={`h-8 w-8 rounded-lg bg-${color}-100 mb-2`} />
                          <div className="h-3 w-12 bg-gray-200 rounded mb-1" />
                          <div className="h-6 w-8 bg-gray-300 rounded font-bold" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4 h-48">
                      <div className="bg-white rounded-xl shadow-lg p-4">
                        <div className="h-3 w-24 bg-gray-200 rounded mb-4" />
                        <div className="grid grid-cols-2 gap-2 h-32">
                          <div className="bg-red-100 rounded-lg p-2">
                            <div className="h-2 w-12 bg-red-300 rounded mb-1" />
                            <div className="h-2 w-8 bg-red-200 rounded" />
                          </div>
                          <div className="bg-blue-100 rounded-lg p-2">
                            <div className="h-2 w-12 bg-blue-300 rounded mb-1" />
                            <div className="h-2 w-8 bg-blue-200 rounded" />
                          </div>
                          <div className="bg-purple-100 rounded-lg p-2">
                            <div className="h-2 w-12 bg-purple-300 rounded mb-1" />
                            <div className="h-2 w-8 bg-purple-200 rounded" />
                          </div>
                          <div className="bg-gray-100 rounded-lg p-2">
                            <div className="h-2 w-12 bg-gray-300 rounded mb-1" />
                            <div className="h-2 w-8 bg-gray-200 rounded" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-lg p-4">
                        <div className="h-3 w-20 bg-gray-200 rounded mb-4" />
                        <div className="flex items-end gap-2 h-32">
                          {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                            <div key={i} className="flex-1 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-200 rounded-full px-5 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-violet-600" />
              <span className="text-sm font-semibold text-violet-700">Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Everything You Need to
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent"> Succeed</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Supercharge your workflow with intelligent features designed for maximum productivity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature Card 1 */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30 group-hover:bg-white group-hover:shadow-white/30 transition-all duration-500">
                  <Sparkles className="h-8 w-8 text-white group-hover:text-emerald-600 transition-colors duration-500" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-white transition-colors duration-500">AI Task Parser</h3>
                <p className="text-gray-600 group-hover:text-white/90 transition-colors duration-500">
                  Describe tasks naturally and let AI extract dates, priorities, and categories instantly.
                </p>
              </div>
            </div>

            {/* Feature Card 2 */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30 group-hover:bg-white group-hover:shadow-white/30 transition-all duration-500">
                  <Grid2x2 className="h-8 w-8 text-white group-hover:text-amber-600 transition-colors duration-500" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-white transition-colors duration-500">Priority Matrix</h3>
                <p className="text-gray-600 group-hover:text-white/90 transition-colors duration-500">
                  Eisenhower method visualization to focus on what truly matters.
                </p>
              </div>
            </div>

            {/* Feature Card 3 */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 group-hover:bg-white group-hover:shadow-white/30 transition-all duration-500">
                  <BarChart3 className="h-8 w-8 text-white group-hover:text-blue-600 transition-colors duration-500" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-white transition-colors duration-500">Smart Analytics</h3>
                <p className="text-gray-600 group-hover:text-white/90 transition-colors duration-500">
                  Comprehensive insights with charts, trends, and productivity scores.
                </p>
              </div>
            </div>

            {/* Feature Card 4 */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/30 group-hover:bg-white group-hover:shadow-white/30 transition-all duration-500">
                  <TrendingUp className="h-8 w-8 text-white group-hover:text-violet-600 transition-colors duration-500" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-white transition-colors duration-500">Progress Tracking</h3>
                <p className="text-gray-600 group-hover:text-white/90 transition-colors duration-500">
                  Daily streaks, completion rates, and achievement badges to stay motivated.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Get Started in
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent"> Seconds</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Three simple steps to transform your productivity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: "01", icon: Users, title: "Create Account", desc: "Sign up free in 30 seconds. No credit card required.", color: "emerald" },
              { num: "02", icon: Target, title: "Add Your Tasks", desc: "Use AI or manual input to capture everything you need to do.", color: "teal" },
              { num: "03", icon: TrendingUp, title: "Get Productive", desc: "Watch your productivity soar with smart prioritization.", color: "cyan" },
            ].map((step, i) => (
              <div key={i} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
                <div className="relative bg-gray-800 rounded-3xl p-8 border border-gray-700 hover:border-emerald-500/50 transition-all duration-500">
                  <div className="text-6xl font-black text-gray-700 mb-4">{step.num}</div>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 flex items-center justify-center mb-4 shadow-lg shadow-${step.color}-500/30`}>
                    <step.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTItNCAwLTQgMi0yIDQtMiA0IDIgMiA0IDIgNC0yIDQtMiAwLTQgMC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            Ready to ELEVATE?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Join thousands of productive people who've transformed their workflow. Start your journey today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2 bg-white text-emerald-600 hover:bg-gray-100 px-10 h-16 text-xl font-bold shadow-2xl hover:scale-105 transition-all duration-300">
                <Sparkles className="h-6 w-6" />
                Get Started Free
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-white/70 text-sm">No credit card required • Free forever plan available</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                <ArrowUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ELEVATE</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-gray-400">
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-8">
            © 2025 ELEVATE. Lift Your Productivity to New Heights.
          </p>
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

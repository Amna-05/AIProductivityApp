"use client";

import { ReactNode } from "react";
import { ArrowUp } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-primary via-accent to-primary/80 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
        </div>

        {/* Branding content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            {/* Logo */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur shadow-xl">
                <ArrowUp className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">ELEVATE</h1>
                <p className="text-white/80 text-sm mt-2 font-medium">Your AI-Powered Productivity</p>
              </div>
            </div>

            {/* Tagline */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white">
                Lift Your Productivity
              </h2>
              <p className="text-white/70 text-base max-w-xs mx-auto">
                AI-powered task management with smart prioritization and analytics
              </p>
            </div>

            {/* Feature highlights */}
            <div className="space-y-3 pt-4">
              {[
                "🤖 AI Task Parser",
                "📊 Smart Analytics",
                "⚡ Priority Matrix",
              ].map((feature, idx) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + idx * 0.1 }}
                  className="text-white/80 text-sm font-medium"
                >
                  {feature}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-gradient-to-b from-background to-secondary/30">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

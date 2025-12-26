"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { authApi } from "@/lib/api/auth";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Try to get current user from backend
        const userData = await authApi.getCurrentUser();
        setUser(userData);
        // Authenticated → Dashboard
        router.replace("/dashboard");
      } catch (error) {
        // Not authenticated → Landing Page
        setUser(null);
        router.replace("/landing");
      }
    };

    checkAuthAndRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading ELEVATE...</p>
      </div>
    </div>
  );
}

import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-background to-secondary/10 p-4 md:p-6">
      <div className="w-full max-w-6xl">
        {children}
      </div>
    </div>
  );
}

"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface AuthStatusProps {
  variant?: "minimal" | "full";
  className?: string;
}

export function AuthStatus({
  variant = "full",
  className = "",
}: AuthStatusProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Loading state
  if (status === "loading") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // Authenticated state
  if (status === "authenticated") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {variant === "full" && (
          <span className="text-sm font-medium">
            Welcome, {session.user.name || session.user.email}
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            signOut({ redirect: true, callbackUrl: "/" });
          }}
        >
          Sign out
        </Button>
      </div>
    );
  }

  // Unauthenticated state
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Link href="/login">
        <Button variant="outline" size="sm">
          Sign in
        </Button>
      </Link>
      <Link href="/register">
        <Button variant="gradient" size="sm">
          Register
        </Button>
      </Link>
    </div>
  );
}

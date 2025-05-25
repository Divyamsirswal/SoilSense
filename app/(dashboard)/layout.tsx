"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  CloudSun,
  Thermometer,
  Leaf,
  Cpu,
  Settings,
  BarChart,
  Menu,
  X,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // Use client-side session check instead of server-side
  const { data: session, status } = useSession();

  // If not authenticated and the page is fully loaded, redirect to login
  if (status === "unauthenticated") {
    // Show a friendly message instead of immediate redirect
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <div className="mb-4 p-2 rounded-full bg-primary/10">
          <User className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          You need to be logged in to access the dashboard and farm management
          features.
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-between flex-col">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <MobileNav />
        <Link href="/" className="flex items-center gap-2 md:gap-3">
          <span className="text-xl font-bold tracking-tight">SoilGuardian</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <ThemeToggle />
          <UserDropdown
            name={session?.user?.name || "User"}
            email={session?.user?.email || ""}
          />
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 shrink-0 border-r bg-background md:flex md:flex-col h-[calc(100vh-4rem)]">
          <div className="flex flex-col gap-2 p-4 overflow-y-auto">
            <NavItem
              href="/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
            />
            <NavItem href="/farms" icon={Leaf} label="Farms & Zones" />
            <NavItem href="/devices" icon={Cpu} label="Devices" />
            <NavItem href="/soil-data" icon={Thermometer} label="Soil Data" />
            <NavItem href="/weather" icon={CloudSun} label="Weather" />
            <NavItem href="/analytics" icon={BarChart} label="Analytics" />
            <NavItem href="/settings" icon={Settings} label="Settings" />
            <div className="mt-10">
              <form action="/api/auth/signout" method="post">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  type="submit"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="container mx-auto p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: any;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

// Simple mobile navigation
function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 z-50 h-full w-3/4 max-w-xs bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-2"
                onClick={() => setOpen(false)}
              >
                <span className="text-xl font-bold">SoilGuardian</span>
              </Link>
              <div className="flex flex-col gap-2">
                <NavItem
                  href="/dashboard"
                  icon={LayoutDashboard}
                  label="Dashboard"
                />
                <NavItem href="/farms" icon={Leaf} label="Farms & Zones" />
                <NavItem href="/devices" icon={Cpu} label="Devices" />
                <NavItem
                  href="/soil-data"
                  icon={Thermometer}
                  label="Soil Data"
                />
                <NavItem href="/weather" icon={CloudSun} label="Weather" />
                <NavItem href="/analytics" icon={BarChart} label="Analytics" />
                <NavItem href="/settings" icon={Settings} label="Settings" />
              </div>
              <div className="mt-auto">
                <form action="/api/auth/signout" method="post">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    type="submit"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// User dropdown menu for better UX
function UserDropdown({ name, email }: { name: string; email: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action="/api/auth/signout" method="post" className="w-full">
            <button type="submit" className="w-full text-left">
              Logout
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

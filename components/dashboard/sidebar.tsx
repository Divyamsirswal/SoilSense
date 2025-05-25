"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  BarChart2,
  Cloud,
  Home,
  Leaf,
  LogOut,
  Map,
  Settings,
  Thermometer,
  Wifi,
  Sprout,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: SidebarNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Farms",
    href: "/farms",
    icon: Map,
  },
  {
    title: "Devices",
    href: "/devices",
    icon: Wifi,
  },
  {
    title: "Soil Data",
    href: "/soil-data",
    icon: Leaf,
  },
  {
    title: "Crop Recommendations",
    href: "/recommendations",
    icon: Sprout,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart2,
  },
  {
    title: "Weather",
    href: "/weather",
    icon: Cloud,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!session?.user?.name) return "U";

    const nameParts = session.user.name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${
        nameParts[nameParts.length - 1][0]
      }`.toUpperCase();
    }
    return session.user.name.substring(0, 2).toUpperCase();
  };

  return (
    <div className={cn("flex h-full flex-col bg-background", className)}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Image
          src="/logo.png"
          alt="SoilGuardian Logo"
          width={32}
          height={32}
          className="h-8 w-8"
        />
        <span className="text-lg font-semibold">SoilGuardian</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-6 px-4">
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md overflow-hidden"
              >
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start h-11",
                    isActive
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : ""
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.title}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={session?.user?.image || ""}
                alt={session?.user?.name || "User"}
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {session?.user?.name || session?.user?.email || "User"}
              </p>
              <p className="text-xs text-muted-foreground">
                {session?.user?.role || "User"}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive mt-2"
          onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

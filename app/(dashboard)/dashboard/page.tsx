import {
  Activity,
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  Cloud,
  Droplet,
  ArrowUpRight,
  Leaf,
  ThermometerSun,
  Zap,
  MapPin,
  BarChart3,
  TrendingUp,
  Layers,
  Plus,
  RefreshCw,
  TrendingDown,
  Clock,
  Calendar,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDate, formatNumber } from "@/lib/utils";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OverviewCard } from "@/components/dashboard/overview-card";
import { FarmMap } from "@/components/dashboard/farm-map";
import { SoilDataChart } from "@/components/dashboard/soil-data-chart";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MLInsightsWidget } from "@/components/dashboard/ml-insights-widget";
import { RealTimeNPKChart } from "@/components/real-time-npk-chart";

// Define types
interface FarmWithCounts {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
  devices: number;
  soilData: number;
  lastReading?: Date;
}

interface FormattedAlert {
  id: string;
  type: string;
  message: string;
  severity: string;
  isRead: boolean;
  createdAt: string;
}

interface FormattedRecommendation {
  id: string;
  cropName: string;
  reasoning: string;
  confidenceScore: number;
  createdAt: Date;
}

async function getData() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  // Get user with farms
  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      farms: {
        include: {
          devices: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Get soil data count for all farms
  const soilDataCount = await prisma.soilData.count({
    where: {
      device: {
        farm: {
          userId: user.id,
        },
      },
    },
  });

  // Get alerts
  const alerts = await prisma.alert.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  // Get recent soil data readings for all farms
  const recentSoilData = await prisma.soilData.findMany({
    where: {
      device: {
        farm: {
          userId: user.id,
        },
      },
    },
    include: {
      device: {
        include: {
          farm: true,
        },
      },
    },
    orderBy: {
      timestamp: "desc",
    },
    take: 20,
  });

  // Format for use in components
  const formattedFarms: FarmWithCounts[] = user.farms.map((farm) => ({
    id: farm.id,
    name: farm.name,
    location: farm.location,
    latitude: farm.latitude,
    longitude: farm.longitude,
    createdAt: farm.createdAt,
    devices: farm.devices.length,
    soilData: 0, // Will be calculated below
    lastReading: undefined,
  }));

  // Count soil data per farm and find last reading date
  for (const data of recentSoilData) {
    const farmIndex = formattedFarms.findIndex(
      (farm) => farm.id === data.device.farmId
    );
    if (farmIndex !== -1) {
      formattedFarms[farmIndex].soilData += 1;

      // Update last reading if it's more recent
      if (
        !formattedFarms[farmIndex].lastReading ||
        data.timestamp > formattedFarms[farmIndex].lastReading
      ) {
        formattedFarms[farmIndex].lastReading = data.timestamp;
      }
    }
  }

  // Format alerts for the notifications component
  const formattedAlerts: FormattedAlert[] = alerts.map((alert) => ({
    id: alert.id,
    type: alert.type,
    message: alert.message,
    severity: alert.severity,
    isRead: alert.isRead,
    createdAt: alert.createdAt.toISOString(),
  }));

  // Calculate key metrics
  const totalDevices = user.farms.reduce(
    (sum, farm) => sum + farm.devices.length,
    0
  );
  const totalFarms = user.farms.length;

  // Calculate average soil metrics
  let avgMoisture = 0;
  let avgTemperature = 0;
  let avgPh = 0;
  let avgNutrients = 0;

  if (recentSoilData.length > 0) {
    avgMoisture =
      recentSoilData.reduce((sum, data) => sum + data.moisture, 0) /
      recentSoilData.length;
    avgTemperature =
      recentSoilData.reduce((sum, data) => sum + data.temperature, 0) /
      recentSoilData.length;
    avgPh =
      recentSoilData.reduce((sum, data) => sum + data.pH, 0) /
      recentSoilData.length;
    avgNutrients =
      recentSoilData.reduce(
        (sum, data) =>
          sum + (data.nitrogen + data.phosphorus + data.potassium) / 3,
        0
      ) / recentSoilData.length;
  }

  // Get recommendations if any
  const recommendations = await prisma.recommendation.findMany({
    where: {
      soilData: {
        device: {
          farm: {
            userId: user.id,
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 3,
    include: {
      soilData: true,
    },
  });

  const formattedRecommendations: FormattedRecommendation[] =
    recommendations.map((rec) => ({
      id: rec.id,
      cropName: rec.crops[0] || "Recommended Crop",
      reasoning: rec.remarks || "",
      confidenceScore: rec.score,
      createdAt: rec.createdAt,
    }));

  return {
    user,
    farms: formattedFarms,
    alerts: formattedAlerts,
    soilData: recentSoilData,
    recommendations: formattedRecommendations,
    metrics: {
      totalFarms,
      totalDevices,
      totalReadings: soilDataCount,
      avgMoisture,
      avgTemperature,
      avgPh,
      avgNutrients,
    },
  };
}

export default async function DashboardPage() {
  const data = await getData();
  const { user, farms, alerts, soilData, recommendations, metrics } = data;

  // User has no farms yet - show onboarding
  if (farms.length === 0) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
        <div className="mb-4 p-3 rounded-full bg-primary/10">
          <Leaf className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Welcome to SoilGuardian</h1>
        <p className="text-muted-foreground mb-8 max-w-md text-base">
          Let's get started by creating your first farm to begin monitoring your
          soil health and optimizing crop yields.
        </p>
        <Button asChild size="lg" className="rounded-full px-8">
          <Link href="/farms/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Farm
          </Link>
        </Button>
      </div>
    );
  }

  const hasDevices = metrics.totalDevices > 0;
  const hasSoilData = metrics.totalReadings > 0;
  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(currentDate);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-2 border-b">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center text-muted-foreground gap-2 mt-1">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-full"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button asChild size="sm" className="h-8 gap-1 rounded-full">
              <Link href="/farms/new">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New Farm</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Time Period Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList className="rounded-full h-10">
            <TabsTrigger value="overview" className="rounded-full">
              Overview
            </TabsTrigger>
            <TabsTrigger value="daily" className="rounded-full">
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="rounded-full">
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="rounded-full">
              Monthly
            </TabsTrigger>
            <TabsTrigger value="npk" className="rounded-full">
              NPK
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="flex items-center gap-1 rounded-full"
            >
              <Clock className="h-3 w-3" />
              <span>Last updated: {currentDate.toLocaleTimeString()}</span>
            </Badge>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-400">
                    Farms
                  </CardTitle>
                  <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-300">
                  {metrics.totalFarms}
                </div>
                <p className="text-xs mt-1 text-blue-800/70 dark:text-blue-400/70">
                  Active farms in your account
                </p>
                <div className="mt-4 flex items-center text-xs text-blue-800 dark:text-blue-400">
                  <Link
                    href="/farms"
                    className="flex items-center hover:underline"
                  >
                    View all farms
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-none shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-sm font-medium text-green-800 dark:text-green-400">
                    Devices
                  </CardTitle>
                  <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900 dark:text-green-300">
                  {metrics.totalDevices}
                </div>
                <p className="text-xs mt-1 text-green-800/70 dark:text-green-400/70">
                  Connected IoT sensors
                </p>
                <div className="mt-4 flex items-center text-xs text-green-800 dark:text-green-400">
                  <Link
                    href="/devices"
                    className="flex items-center hover:underline"
                  >
                    Manage devices
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-none shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-400">
                    Readings
                  </CardTitle>
                  <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900 dark:text-purple-300">
                  {formatNumber(metrics.totalReadings)}
                </div>
                <p className="text-xs mt-1 text-purple-800/70 dark:text-purple-400/70">
                  Total data points collected
                </p>
                <div className="mt-4 flex items-center text-xs text-purple-800 dark:text-purple-400">
                  <Link
                    href="/soil-data"
                    className="flex items-center hover:underline"
                  >
                    View soil data
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-none shadow-sm bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-400">
                    Alerts
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-900 dark:text-amber-300">
                  {alerts.filter((a) => !a.isRead).length}
                </div>
                <p className="text-xs mt-1 text-amber-800/70 dark:text-amber-400/70">
                  Unread alerts
                </p>
                <div className="mt-4 flex items-center text-xs text-amber-800 dark:text-amber-400">
                  <Link
                    href="/alerts"
                    className="flex items-center hover:underline"
                  >
                    View all alerts
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Soil Metrics */}
          {hasSoilData && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>Soil Analytics</CardTitle>
                    <Link
                      href="/soil-data"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center"
                    >
                      View All
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                  <CardDescription>
                    Recent soil health indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SoilDataChart data={soilData} height="250px" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium">
                      Soil Health
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="text-xs rounded-full bg-green-50 text-green-700 border-green-200"
                    >
                      Good
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <div className="text-sm font-medium">Moisture</div>
                      <div className="text-sm font-semibold">
                        {metrics.avgMoisture.toFixed(1)}%
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${Math.min(metrics.avgMoisture, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <div className="text-sm font-medium">Temperature</div>
                      <div className="text-sm font-semibold">
                        {metrics.avgTemperature.toFixed(1)}°C
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-orange-100">
                      <div
                        className="h-full bg-orange-500"
                        style={{
                          width: `${Math.min(
                            (metrics.avgTemperature / 40) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <div className="text-sm font-medium">pH Level</div>
                      <div className="text-sm font-semibold">
                        {metrics.avgPh.toFixed(1)}
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-green-100">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${Math.min(
                            (metrics.avgPh / 14) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <div className="text-sm font-medium">Nutrient Index</div>
                      <div className="text-sm font-semibold">
                        {metrics.avgNutrients.toFixed(1)}
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-purple-100">
                      <div
                        className="h-full bg-purple-500"
                        style={{
                          width: `${Math.min(
                            (metrics.avgNutrients / 10) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Farm Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[250px] px-6">
                    <div className="space-y-5 pt-1 pb-4">
                      {farms.map((farm) => (
                        <div key={farm.id} className="relative">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3 border">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {farm.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-0.5 flex-1 overflow-hidden">
                              <p className="text-sm font-semibold truncate">
                                {farm.name}
                              </p>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <div className="flex items-center">
                                  <Zap className="h-3 w-3 mr-1" />
                                  <span>{farm.devices} devices</span>
                                </div>
                                <span className="mx-1.5">•</span>
                                <div className="flex items-center">
                                  <Activity className="h-3 w-3 mr-1" />
                                  <span>{farm.soilData} readings</span>
                                </div>
                              </div>
                            </div>
                            <Link
                              href={`/farms/${farm.id}`}
                              className="ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                          {farm.lastReading && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              Last update: {formatDate(farm.lastReading)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Two-Column Layout */}
          <div className="grid gap-4 md:grid-cols-7">
            {/* Map Section - 4/7 width */}
            <Card className="md:col-span-4 overflow-hidden">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle>Farm Locations</CardTitle>
                  <Link
                    href="/farms"
                    className="text-xs text-muted-foreground hover:text-primary flex items-center"
                  >
                    View All
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <FarmMap farms={farms} height="330px" />
              </CardContent>
            </Card>

            {/* Recommendations and Alerts - 3/7 width */}
            <div className="md:col-span-3 space-y-4">
              {/* ML Insights Widget */}
              <MLInsightsWidget />

              {/* Notifications */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Alerts</CardTitle>
                    <Badge variant="outline" className="rounded-full">
                      {alerts.filter((a) => !a.isRead).length} Unread
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <NotificationsPanel notifications={alerts} />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity */}
          {hasSoilData && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Activity</CardTitle>
                  <Badge variant="outline" className="text-xs rounded-full">
                    Last 24 hours
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {soilData.slice(0, 6).map((data, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-8 w-8 border">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {data.device.farm.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1 overflow-hidden">
                        <p className="text-sm font-medium leading-none truncate">
                          {data.device.farm.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          New soil reading from {data.device.name}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(new Date(data.timestamp))}
                      </div>
                    </div>
                  ))}
                </div>

                {soilData.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">
                      No recent activity to display
                    </p>
                  </div>
                )}
              </CardContent>
              {soilData.length > 0 && (
                <CardFooter className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href="/soil-data">View All Soil Data</Link>
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="daily" className="h-full flex flex-col space-y-4">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Daily Stats</CardTitle>
              <CardDescription>
                Showing soil data trends for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">
                  Select a different time period to see more data
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="h-full flex flex-col space-y-4">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Weekly Stats</CardTitle>
              <CardDescription>
                Showing soil data trends for this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">
                  Select a different time period to see more data
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="h-full flex flex-col space-y-4">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Monthly Stats</CardTitle>
              <CardDescription>
                Showing soil data trends for this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">
                  Select a different time period to see more data
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="npk" className="space-y-4">
          <Suspense fallback={<div>Loading real-time data...</div>}>
            <RealTimeNPKChart
              farmId={data.farms[0]?.id || ""}
              deviceId={data.farms[0]?.devices > 0 ? undefined : undefined}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FarmMap } from "@/components/farm-map";
import Link from "next/link";
import {
  PlusCircle,
  MapPin,
  Wheat,
  Ruler,
  Calendar,
  Tractor,
  Sprout,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useState, useEffect } from "react";

// Types
interface FarmWithCounts {
  id: string;
  name: string;
  location: string;
  size: number;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  imageUrl: string | null;
  address: string | null;
  country: string | null;
  region: string | null;
  soilType: string | null;
  climate: string | null;
  elevation: number | null;
  description: string | null;
  lastReading?: Date | null;
  _count: {
    devices: number;
    soilData: number;
    zones: number;
    crops?: number;
  };
}

export default function FarmsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [farms, setFarms] = useState<FarmWithCounts[]>([]);
  const [stats, setStats] = useState({
    totalFarms: 0,
    totalArea: 0,
    totalDevices: 0,
    averageSize: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Use effect to fetch data
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/farms");
        const data = await response.json();

        if (data.farms) {
          // Process the farms data to add last readings
          const processedFarms = await processLastReadings(data.farms);
          setFarms(processedFarms);

          // Set stats from API
          if (data.stats) {
            setStats(data.stats);
          } else {
            // Calculate stats if not provided
            const totalFarms = processedFarms.length;
            const totalArea = processedFarms.reduce(
              (total: number, farm: any) => total + (farm.size || 0),
              0
            );
            const totalDevices = processedFarms.reduce(
              (total: number, farm: any) => total + farm._count.devices,
              0
            );
            const averageSize = totalFarms > 0 ? totalArea / totalFarms : 0;

            setStats({
              totalFarms,
              totalArea,
              totalDevices,
              averageSize,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching farms:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Process farms to add last readings
  async function processLastReadings(farms: any[]) {
    try {
      // Fetch recent soil data for each farm
      const soilDataResponse = await fetch("/api/soil-data/recent");
      const soilData = await soilDataResponse.json();

      // Create a map of farmId to last reading
      const lastReadingMap = new Map();
      if (soilData.data) {
        soilData.data.forEach((data: any) => {
          lastReadingMap.set(data.farmId, data.timestamp);
        });
      }

      // Add last readings to farms
      return farms.map((farm: any) => ({
        ...farm,
        lastReading: lastReadingMap.get(farm.id) || null,
      }));
    } catch (error) {
      console.error("Error processing last readings:", error);
      return farms;
    }
  }

  // Filter farms based on search query
  const filteredFarms = farms.filter((farm) => {
    const matchesSearch =
      farm.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.soilType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Farms</h1>
          <p className="text-muted-foreground">Manage your farms and fields</p>
        </div>
        <Button asChild>
          <Link href="/farms/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Farm
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium">Total Farms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalFarms}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium">Total Area</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.totalArea.toFixed(1)} ha
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalDevices}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium">Average Size</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.averageSize.toFixed(1)} ha
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search farms..."
            className="w-full px-3 py-2 border rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      {isLoading ? (
        <div className="py-10 text-center">
          <p className="text-muted-foreground">Loading farms data...</p>
        </div>
      ) : (
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFarms.map((farm) => (
                <Card key={farm.id}>
                  <CardHeader>
                    <CardTitle>{farm.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {farm.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-1">
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">
                          <span className="font-medium">Size:</span>{" "}
                          {farm.size || 0} ha
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tractor className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">
                          <span className="font-medium">Devices:</span>{" "}
                          {farm._count.devices}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-1">
                        <Sprout className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">
                          <span className="font-medium">Crops:</span>{" "}
                          {farm._count.crops || 0}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Wheat className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">
                          <span className="font-medium">Data:</span>{" "}
                          {farm._count.soilData}
                        </p>
                      </div>
                    </div>
                    {farm.soilType && (
                      <div>
                        <p className="text-sm font-medium">Soil Type:</p>
                        <p className="text-sm text-muted-foreground">
                          {farm.soilType}
                        </p>
                      </div>
                    )}
                    {farm.lastReading && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        Last reading: {formatDate(farm.lastReading)}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button size="sm" className="w-full" asChild>
                      <Link href={`/farms/${farm.id}`}>View Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {filteredFarms.length === 0 && (
                <div className="col-span-full flex justify-center py-10">
                  <p className="text-muted-foreground">
                    No farms found matching your criteria.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="map">
            <FarmMap
              farms={filteredFarms}
              height="600px"
              title="Farm Locations"
              description="Geographic distribution of your farms"
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

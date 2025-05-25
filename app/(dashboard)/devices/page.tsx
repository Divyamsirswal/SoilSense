"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DeviceStatusCard } from "@/components/device-status-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import { PlusCircle, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

// Device type definition
interface Device {
  id: string;
  name: string;
  deviceId: string;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  lastActive: string;
  batteryLevel?: number;
  signalStrength?: number;
  farmId: string;
  farm?: {
    id: string;
    name: string;
  };
  _count?: {
    soilData: number;
  };
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Fetch devices from API
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/api/devices");
        setDevices(response.data.devices);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching devices:", err);
        setError(err.response?.data?.error || "Failed to load devices");
        toast({
          title: "Error",
          description: "Failed to load devices",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();
  }, [toast]);

  // Filter devices based on status and search query
  const filteredDevices = devices.filter((device) => {
    const matchesStatus = filterStatus ? device.status === filterStatus : true;
    const matchesSearch =
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.farm?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Group by farm
  const devicesByFarm = filteredDevices.reduce((acc, device) => {
    const farmId = device.farmId || "uncategorized";
    if (!acc[farmId]) {
      acc[farmId] = {
        farmName: device.farm?.name || "Uncategorized",
        devices: [],
      };
    }
    acc[farmId].devices.push(device);
    return acc;
  }, {} as Record<string, { farmName: string; devices: Device[] }>);

  // Stats
  const stats = {
    total: devices.length,
    active: devices.filter((d) => d.status === "ACTIVE").length,
    inactive: devices.filter((d) => d.status === "INACTIVE").length,
    maintenance: devices.filter((d) => d.status === "MAINTENANCE").length,
    lowBattery: devices.filter(
      (d) => d.batteryLevel !== undefined && d.batteryLevel < 20
    ).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading devices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="mt-2 text-destructive">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Devices</h1>
          <p className="text-muted-foreground">
            Manage your IoT devices and sensors
          </p>
        </div>
        <Button asChild>
          <Link href="/devices/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Device
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-500">
              {stats.inactive}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-500">
              {stats.maintenance}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium">Low Battery</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {stats.lowBattery}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search devices..."
            className="w-full px-3 py-2 border rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === null ? "default" : "outline"}
            onClick={() => setFilterStatus(null)}
          >
            All
          </Button>
          <Button
            variant={filterStatus === "ACTIVE" ? "default" : "outline"}
            onClick={() => setFilterStatus("ACTIVE")}
          >
            Active
          </Button>
          <Button
            variant={filterStatus === "INACTIVE" ? "default" : "outline"}
            onClick={() => setFilterStatus("INACTIVE")}
          >
            Inactive
          </Button>
          <Button
            variant={filterStatus === "MAINTENANCE" ? "default" : "outline"}
            onClick={() => setFilterStatus("MAINTENANCE")}
          >
            Maintenance
          </Button>
        </div>
      </div>

      {/* Devices by Farm */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Farms</TabsTrigger>
          {Object.entries(devicesByFarm).map(([farmId, { farmName }]) => (
            <TabsTrigger key={farmId} value={farmId}>
              {farmName}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredDevices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No devices found.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDevices.map((device) => (
                <DeviceStatusCard
                  key={device.id}
                  id={device.id}
                  name={device.name}
                  deviceId={device.deviceId}
                  status={device.status}
                  lastActive={device.lastActive}
                  batteryLevel={device.batteryLevel}
                  signalStrength={device.signalStrength}
                  farmName={device.farm?.name || "Unknown Farm"}
                  readingsCount={device._count?.soilData || 0}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {Object.entries(devicesByFarm).map(
          ([farmId, { farmName, devices }]) => (
            <TabsContent key={farmId} value={farmId} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {devices.map((device) => (
                  <DeviceStatusCard
                    key={device.id}
                    id={device.id}
                    name={device.name}
                    deviceId={device.deviceId}
                    status={device.status}
                    lastActive={device.lastActive}
                    batteryLevel={device.batteryLevel}
                    signalStrength={device.signalStrength}
                    farmName={device.farm?.name || "Unknown Farm"}
                    readingsCount={device._count?.soilData || 0}
                  />
                ))}
              </div>
            </TabsContent>
          )
        )}
      </Tabs>
    </div>
  );
}

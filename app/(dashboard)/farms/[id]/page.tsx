"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  ArrowLeft,
  MapPin,
  Wheat,
  Ruler,
  Calendar,
  Trash,
  Edit,
  Sprout,
  Tractor,
  Zap,
  Plus,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DeviceRegistration } from "@/components/device-registration";
import { Badge } from "@/components/ui/badge";

// Farm data interface
interface Farm {
  id: string;
  name: string;
  location: string;
  size: number;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  imageUrl: string | null;
  address: string | null;
  country: string | null;
  region: string | null;
  soilType: string | null;
  climate: string | null;
  elevation: number | null;
  description: string | null;
  lastReading?: string | null;
  _count: {
    devices: number;
    soilData: number;
    zones: number;
    crops: number;
  };
}

// Device interface
interface Device {
  id: string;
  deviceId: string;
  name: string;
  status: string;
  deviceType: string;
  lastActive: string | null;
  batteryLevel: number | null;
  signalStrength: number | null;
  createdAt: string;
  updatedAt: string;
}

// Zone interface
interface Zone {
  id: string;
  name: string;
}

export default function FarmDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [soilData, setSoilData] = useState([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [crops, setCrops] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Server URL for API endpoint
  const serverUrl = process.env.NEXT_PUBLIC_API_URL || `${window.location.origin}/api/devices/connect`;

  useEffect(() => {
    const fetchFarm = async () => {
      setIsLoading(true);
      try {
        // Fetch farm data
        const response = await fetch(`/api/farms/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Farm not found");
            router.push("/farms");
            return;
          }
          throw new Error(`Error fetching farm: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && data.farm) {
          setFarm(data.farm);
          
          // Fetch additional data in parallel
          Promise.all([
            fetch(`/api/farms/${params.id}/soil-data`).then(res => res.json()),
            fetch(`/api/farms/${params.id}/devices`).then(res => res.json()),
            fetch(`/api/farms/${params.id}/zones`).then(res => res.json()),
            fetch(`/api/farms/${params.id}/crops`).then(res => res.json())
          ]).then(([soilDataRes, devicesRes, zonesRes, cropsRes]) => {
            setSoilData(soilDataRes.data || []);
            setDevices(devicesRes.devices || []);
            setZones(zonesRes.zones || []);
            setCrops(cropsRes.crops || []);
          }).catch(err => {
            console.error("Error fetching related data:", err);
          });
        } else {
          setError("Farm data not found");
        }
      } catch (err) {
        console.error("Failed to load farm data:", err);
        setError("Failed to load farm data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFarm();
  }, [params.id, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading farm details...</p>
      </div>
    );
  }

  if (error || !farm) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/farms")}
        >
          Return to Farms
        </Button>
      </div>
    );
  }

  // Get status badge variant based on device status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'secondary';
      case 'MAINTENANCE':
        return 'warning';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">{farm.name}</h1>
          </div>
          <p className="text-muted-foreground flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {farm.location}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={`/farms/${farm.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </a>
          </Button>
          <Button variant="destructive" size="icon">
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="crops">Crops</TabsTrigger>
          <TabsTrigger value="soil-data">Soil Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Farm Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Size</p>
                    <p className="text-lg font-medium">{farm.size || 0} hectares</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Devices</p>
                    <p className="text-lg font-medium">{farm._count.devices} sensors</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-lg font-medium">
                      {formatDate(farm.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Reading</p>
                    <p className="text-lg font-medium">
                      {farm.lastReading ? formatDate(farm.lastReading) : "No readings yet"}
                    </p>
                  </div>
                </div>
                
                {farm.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-base">{farm.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[250px]">
                <FarmMap farms={[farm]} />
              </CardContent>
            </Card>
          </div>
          
          {/* Rest of the overview tab content... */}
        </TabsContent>
        
        <TabsContent value="devices" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Connected Devices</CardTitle>
                <CardDescription>
                  IoT sensors and devices connected to this farm
                </CardDescription>
              </CardHeader>
              <CardContent>
                {devices.length > 0 ? (
                  <div className="space-y-4">
                    {devices.map((device) => (
                      <div key={device.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <Zap className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{device.name}</h3>
                            <p className="text-xs text-muted-foreground">ID: {device.deviceId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(device.status) as any}>
                            {device.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/devices/${device.id}`)}
                          >
                            Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No devices connected to this farm yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => setActiveTab("register-device")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Register Device
                    </Button>
                  </div>
                )}
              </CardContent>
              {devices.length > 0 && (
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab("register-device")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Register New Device
                  </Button>
                </CardFooter>
              )}
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Device Status</CardTitle>
                <CardDescription>
                  Current status of farm devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Status Summary</p>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                        <p className="text-xs text-green-800 dark:text-green-400">Active</p>
                        <p className="text-xl font-bold text-green-700 dark:text-green-500">
                          {devices.filter(d => d.status === 'ACTIVE').length}
                        </p>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-lg">
                        <p className="text-xs text-yellow-800 dark:text-yellow-400">Maintenance</p>
                        <p className="text-xl font-bold text-yellow-700 dark:text-yellow-500">
                          {devices.filter(d => d.status === 'MAINTENANCE').length}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg">
                        <p className="text-xs text-gray-800 dark:text-gray-400">Inactive</p>
                        <p className="text-xl font-bold text-gray-700 dark:text-gray-500">
                          {devices.filter(d => d.status === 'INACTIVE').length}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Device Types</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                        <p className="text-xs text-blue-800 dark:text-blue-400">Soil Sensors</p>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-500">
                          {devices.filter(d => d.deviceType === 'SOIL_SENSOR').length}
                        </p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg">
                        <p className="text-xs text-purple-800 dark:text-purple-400">Other Devices</p>
                        <p className="text-xl font-bold text-purple-700 dark:text-purple-500">
                          {devices.filter(d => d.deviceType !== 'SOIL_SENSOR').length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="register-device" className="space-y-4">
          <DeviceRegistration 
            farmId={farm.id} 
            farmName={farm.name} 
            zones={zones}
            serverUrl={serverUrl}
          />
        </TabsContent>
        
        {/* Other tab contents can remain unchanged */}
      </Tabs>
    </div>
  );
}

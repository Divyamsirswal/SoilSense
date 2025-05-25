"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import axios from "axios";

export default function NewDevicePage() {
  const [name, setName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [deviceType, setDeviceType] = useState("SOIL_SENSOR");
  const [status, setStatus] = useState("INACTIVE");
  const [farmId, setFarmId] = useState("");
  const [firmwareVersion, setFirmwareVersion] = useState("");
  const [macAddress, setMacAddress] = useState("");
  
  const [farms, setFarms] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFarms, setIsLoadingFarms] = useState(true);
  
  const router = useRouter();
  const { toast } = useToast();

  // Fetch farms on component mount
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const response = await axios.get("/api/farms");
        if (response.data.farms) {
          setFarms(response.data.farms);
          
          // Set default farm if available
          if (response.data.farms.length > 0) {
            setFarmId(response.data.farms[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching farms:", error);
        toast({
          title: "Error",
          description: "Failed to load farms. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingFarms(false);
      }
    };

    fetchFarms();
  }, [toast]);

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name || !deviceId || !deviceType || !farmId || !status) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await axios.post("/api/devices", {
        name,
        deviceId,
        deviceType,
        farmId,
        status,
        firmwareVersion: firmwareVersion || undefined,
        macAddress: macAddress || undefined,
      });
      
      toast({
        title: "Success",
        description: "Device added successfully",
      });
      
      // Redirect to device page
      router.push(`/devices/${response.data.id}`);
    } catch (error: any) {
      console.error("Error adding device:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to add device",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link href="/devices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Devices
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Add New Device</CardTitle>
          <CardDescription>
            Connect a new IoT device or sensor to your SoilGuardian system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Device Name *</Label>
                <Input 
                  id="name" 
                  placeholder="Field Sensor 1" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  A descriptive name for your device
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deviceId">Device ID *</Label>
                <Input 
                  id="deviceId" 
                  placeholder="SG-001" 
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier for this device
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deviceType">Device Type *</Label>
                <select 
                  id="deviceType"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value)}
                  required
                >
                  <option value="SOIL_SENSOR">Soil Sensor</option>
                  <option value="WEATHER_STATION">Weather Station</option>
                  <option value="IRRIGATION_CONTROLLER">Irrigation Controller</option>
                  <option value="CAMERA">Camera</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="farmId">Farm *</Label>
                <select 
                  id="farmId"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={farmId}
                  onChange={(e) => setFarmId(e.target.value)}
                  disabled={isLoadingFarms}
                  required
                >
                  {isLoadingFarms ? (
                    <option>Loading farms...</option>
                  ) : farms.length === 0 ? (
                    <option value="">No farms available</option>
                  ) : (
                    farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>
                        {farm.name}
                      </option>
                    ))
                  )}
                </select>
                {farms.length === 0 && !isLoadingFarms && (
                  <p className="text-xs text-amber-500">
                    Please create a farm first before adding devices.
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select 
                  id="status"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="firmwareVersion">Firmware Version (Optional)</Label>
                <Input 
                  id="firmwareVersion" 
                  placeholder="1.0.0" 
                  value={firmwareVersion}
                  onChange={(e) => setFirmwareVersion(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="macAddress">MAC Address (Optional)</Label>
                <Input 
                  id="macAddress" 
                  placeholder="AA:BB:CC:DD:EE:FF" 
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/devices")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isLoadingFarms || farms.length === 0}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Device
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

// Mock implementation of useFarmChannel when Pusher is not configured
const useFarmChannel = (farmId: string) => {
  return {
    bind: (event: string, callback: Function) => {},
    unbind: (event: string) => {},
  };
};

// For farm summary display on main dashboard
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

interface MapProps {
  farmId?: string;
  farmName?: string;
  centerLat?: number;
  centerLng?: number;
  devices?: Array<{
    id: string;
    name: string;
    status: string;
    deviceType: string;
    latitude: number | null;
    longitude: number | null;
    lastActive: string | null;
    batteryLevel: number | null;
  }>;
  zones?: Array<{
    id: string;
    name: string;
    boundaries: any; // GeoJSON
  }>;
  // New props for dashboard overview
  farms?: FarmWithCounts[];
  height?: string;
  title?: string;
  description?: string;
}

export function FarmMap({
  farmId,
  farmName,
  centerLat,
  centerLng,
  devices = [],
  zones = [],
  farms = [],
  height = "500px",
  title,
  description,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"satellite" | "map">("satellite");
  const markersRef = useRef<any[]>([]);
  const leafletLoadedRef = useRef(false);
  const farmChannel = farmId ? useFarmChannel(farmId) : null;

  // Load Leaflet scripts once
  useEffect(() => {
    if (typeof window !== "undefined" && !window.L && !leafletLoadedRef.current) {
      leafletLoadedRef.current = true;
      
      // Load Leaflet CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      // Load Leaflet JS
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      document.head.appendChild(script);
    }
  }, []);

  // Initialize the map
  useEffect(() => {
    // Wait for Leaflet to be loaded
    if (typeof window === "undefined" || !window.L) {
      const checkLeaflet = setInterval(() => {
        if (window.L) {
          clearInterval(checkLeaflet);
          initMap();
        }
      }, 100);
      
      // Cleanup interval
      return () => clearInterval(checkLeaflet);
    } else {
      initMap();
    }

    function initMap() {
      if (!mapRef.current || !window.L) return;
      
      // If map already initialized, clean it up first
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Determine center coordinates
      let lat = 0, lng = 0;

      if (centerLat && centerLng) {
        // Single farm view
        lat = centerLat;
        lng = centerLng;
      } else if (farms.length > 0) {
        // Dashboard view with multiple farms
        const validFarms = farms.filter(
          (f) => !isNaN(f.latitude) && !isNaN(f.longitude)
        );

        if (validFarms.length > 0) {
          // Average all farm coordinates
          lat =
            validFarms.reduce((sum, farm) => sum + farm.latitude, 0) /
            validFarms.length;
          lng =
            validFarms.reduce((sum, farm) => sum + farm.longitude, 0) /
            validFarms.length;
        } else {
          // Default coordinates if no valid farms
          lat = 20;
          lng = 0;
        }
      } else {
        // Default world view
        lat = 20;
        lng = 0;
      }

      const L = window.L;
      
      // Create the map
      const zoom = farms.length > 1 ? 2 : 15;
      const newMap = L.map(mapRef.current).setView([lat, lng], zoom);
      mapInstanceRef.current = newMap;

      // Add tile layer based on view mode
      if (viewMode === "satellite") {
        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution:
              "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          }
        ).addTo(newMap);
      } else {
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(newMap);
      }

      // Add markers and boundaries
      addMarkersToMap();
    }
    
    // Cleanup map on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [centerLat, centerLng, viewMode, farms.length]);

  // Function to add markers to the map
  const addMarkersToMap = () => {
    if (!mapInstanceRef.current || !window.L) return;
    
    const L = window.L;
    const map = mapInstanceRef.current;
    
    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    
    if (farms.length > 0) {
      // Add farm markers for dashboard overview
      const newMarkers = farms
        .filter((farm) => !isNaN(farm.latitude) && !isNaN(farm.longitude))
        .map((farm) => {
          // Create custom icon
          const icon = L.divIcon({
            className: "farm-marker",
            html: `<div class="flex items-center justify-center rounded-full w-10 h-10 bg-primary text-white font-bold shadow-lg">
                     ${farm.name.substring(0, 1)}
                   </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          });

          // Create marker
          const marker = L.marker([farm.latitude, farm.longitude], {
            icon,
          }).addTo(map).bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold">${farm.name}</h3>
              <p class="text-xs">Location: ${farm.location}</p>
              <p class="text-xs">Devices: ${farm.devices}</p>
              <p class="text-xs">Soil Readings: ${farm.soilData}</p>
              ${
                farm.lastReading
                  ? `<p class="text-xs">Last Reading: ${new Date(
                      farm.lastReading
                    ).toLocaleDateString()}</p>`
                  : ""
              }
            </div>
          `);

          return marker;
        });
        
      markersRef.current = newMarkers;
    } else if (devices.length > 0) {
      // Add device markers
      const newMarkers = devices
        .filter((device) => device.latitude && device.longitude)
        .map((device) => {
          // Determine icon based on device type and status
          const getMarkerColor = () => {
            if (device.status === "INACTIVE") return "gray";
            if (device.status === "MAINTENANCE") return "orange";
            if (device.batteryLevel && device.batteryLevel < 20) return "red";
            return "green";
          };

          const markerColor = getMarkerColor();

          // Create custom icon
          const icon = L.divIcon({
            className: "custom-marker",
            html: `<div class="flex items-center justify-center rounded-full w-8 h-8 bg-white border-2 border-${markerColor}-500 text-${markerColor}-500">
                     <span class="text-xs font-bold">
                       ${
                         device.deviceType === "SOIL_SENSOR"
                           ? "S"
                           : device.deviceType === "WEATHER_STATION"
                           ? "W"
                           : device.deviceType === "IRRIGATION_CONTROLLER"
                           ? "I"
                           : device.deviceType === "CAMERA"
                           ? "C"
                           : "D"
                       }
                     </span>
                   </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          // Create marker
          const marker = L.marker([device.latitude!, device.longitude!], {
            icon,
          }).addTo(map).bindPopup(`
              <div class="p-2">
                <h3 class="font-semibold">${device.name}</h3>
                <p class="text-xs">Status: ${device.status}</p>
                ${
                  device.batteryLevel
                    ? `<p class="text-xs">Battery: ${device.batteryLevel}%</p>`
                    : ""
                }
                ${
                  device.lastActive
                    ? `<p class="text-xs">Last active: ${new Date(
                        device.lastActive
                      ).toLocaleString()}</p>`
                    : ""
                }
              </div>
            `);

          // Add click event
          marker.on("click", () => {
            setSelectedDevice(device.id);
          });

          return marker;
        });
      
      markersRef.current = newMarkers;

      // Draw zone boundaries if available
      zones.forEach((zone) => {
        if (zone.boundaries) {
          try {
            const geoJSON =
              typeof zone.boundaries === "string"
                ? JSON.parse(zone.boundaries)
                : zone.boundaries;

            L.geoJSON(geoJSON, {
              style: {
                color: "#3B82F6",
                weight: 2,
                opacity: 0.7,
                fillOpacity: 0.1,
              },
            })
              .addTo(map)
              .bindTooltip(zone.name);
          } catch (error) {
            console.error("Error parsing zone boundaries:", error);
          }
        }
      });
    }
  };

  // Update markers when devices or farms change
  useEffect(() => {
    if (mapInstanceRef.current) {
      addMarkersToMap();
    }
  }, [devices, farms, zones]);

  // Listen for real-time device updates
  useEffect(() => {
    if (!farmChannel) return;

    // When a device is added
    farmChannel.bind("device-added", (data: any) => {
      toast({
        title: "New device added",
        description: `${data.device.name} has been added to the farm`,
      });
    });

    // When a device status changes
    farmChannel.bind("device-status-updated", (data: any) => {
      // Refresh markers
      addMarkersToMap();
    });

    return () => {
      farmChannel.unbind("device-added");
      farmChannel.unbind("device-status-updated");
    };
  }, [farmChannel]);

  const toggleViewMode = () => {
    const newMode = viewMode === "satellite" ? "map" : "satellite";
    setViewMode(newMode);

    if (mapInstanceRef.current && window.L) {
      const map = mapInstanceRef.current;
      
      // Remove current tile layer
      map.eachLayer((layer: any) => {
        if (layer instanceof window.L.TileLayer) {
          map.removeLayer(layer);
        }
      });

      // Add new tile layer
      if (newMode === "satellite") {
        window.L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution:
              "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          }
        ).addTo(map);
      } else {
        window.L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }
        ).addTo(map);
      }
    }
  };

  return (
    <Card>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div ref={mapRef} style={{ height, width: "100%" }} />
      </CardContent>
    </Card>
  );
}

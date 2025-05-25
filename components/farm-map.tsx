"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Farm {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  location?: string;
}

interface FarmMapProps {
  farms: Farm[];
  height?: string;
  title?: string;
  description?: string;
}

export function FarmMap({
  farms,
  height = "400px",
  title,
  description,
}: FarmMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);

  // In a real implementation, this would integrate with a mapping library like Leaflet or Google Maps
  // For this demo, we'll just display a static visualization

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="overflow-hidden">
      {(title || description) && (
        <CardHeader className="pb-2">
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div
          className="bg-muted relative flex items-center justify-center"
          style={{ height }}
        >
          {!mapLoaded ? (
            <p className="text-muted-foreground">Loading map...</p>
          ) : (
            <div className="relative w-full h-full bg-[#e8f4f8] p-2">
              {/* Simplified map visualization */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full relative">
                  {farms.map((farm) => (
                    <div
                      key={farm.id}
                      className="absolute w-4 h-4 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-150 transition-transform"
                      style={{
                        // Use relative positioning within the container
                        left: `${((farm.longitude + 180) / 360) * 100}%`,
                        top: `${((90 - farm.latitude) / 180) * 100}%`,
                      }}
                      title={`${farm.name} (${farm.location || ""})`}
                    >
                      <div className="absolute w-4 h-4 bg-primary/30 rounded-full animate-ping" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 p-1 rounded">
                <p>
                  Map: {farms.length} farm{farms.length !== 1 ? "s" : ""}{" "}
                  displayed
                </p>
                <p className="text-[10px]">
                  Note: In production, this would use a real mapping library
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

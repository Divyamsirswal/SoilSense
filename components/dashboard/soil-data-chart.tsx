"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SoilDataChartProps {
  data?: any[];
  farmId?: string;
  height?: string;
  className?: string;
}

export function SoilDataChart({
  data = [],
  farmId,
  height = "300px",
  className,
}: SoilDataChartProps) {
  const [metric, setMetric] = useState<"ph" | "moisture" | "temperature" | "nutrients">("moisture");

  // This is a placeholder component until we implement actual charts
  // In a real implementation, you would use a charting library like Chart.js, Recharts, etc.

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Soil Metrics</CardTitle>
          <Tabs defaultValue="moisture" className="h-8" onValueChange={(value) => setMetric(value as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="moisture" className="h-8 px-3 text-xs">
                Moisture
              </TabsTrigger>
              <TabsTrigger value="ph" className="h-8 px-3 text-xs">
                pH
              </TabsTrigger>
              <TabsTrigger value="temperature" className="h-8 px-3 text-xs">
                Temperature
              </TabsTrigger>
              <TabsTrigger value="nutrients" className="h-8 px-3 text-xs">
                Nutrients
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height, position: "relative" }} className="flex items-center justify-center">
          {data.length > 0 ? (
            <div className="text-center text-muted-foreground">
              Chart visualization would appear here
              <p className="text-sm mt-2">
                {metric === "moisture" && "Displaying soil moisture data over time"}
                {metric === "ph" && "Displaying soil pH levels over time"}
                {metric === "temperature" && "Displaying soil temperature data over time"}
                {metric === "nutrients" && "Displaying soil nutrient levels over time"}
              </p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <p>No soil data available to display</p>
              <p className="text-sm mt-2">Add soil sensors to your farm to see data</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

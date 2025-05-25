"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { pusherClient } from "@/lib/pusher";

interface SoilData {
  id: string;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  moisture: number;
  temperature: number;
  pH: number;
  timestamp: string;
}

interface RealTimeNPKChartProps {
  farmId: string;
  initialData?: SoilData[];
  limit?: number;
}

export function RealTimeNPKChart({
  farmId,
  initialData = [],
  limit = 20,
}: RealTimeNPKChartProps) {
  const [data, setData] = useState<SoilData[]>(initialData);
  const [activeTab, setActiveTab] = useState("npk");
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);

  // Format data for charts
  const formatData = (data: SoilData[]) => {
    return data.map((reading) => ({
      ...reading,
      time: new Date(reading.timestamp).toLocaleTimeString(),
    }));
  };

  // Use Pusher for real-time updates
  useEffect(() => {
    if (!farmId) return;

    // Subscribe to soil data updates channel
    const channel = pusherClient.subscribe(`farm-${farmId}`);

    // Handle new data arrival
    channel.bind("soil-data-update", (newReading: { soilData: SoilData }) => {
      if (!newReading || !newReading.soilData) return;

      setData((currentData) => {
        // Add new reading to the front of the array
        const updatedData = [newReading.soilData, ...currentData];

        // Limit the number of readings shown
        if (updatedData.length > limit) {
          return updatedData.slice(0, limit);
        }

        return updatedData;
      });

      setLastUpdate(new Date().toLocaleString());
    });

    // Cleanup on component unmount
    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(`farm-${farmId}`);
    };
  }, [farmId, limit]);

  // Load initial data if none was provided
  useEffect(() => {
    if (initialData.length === 0) {
      fetchLatestData();
    } else {
      setData(initialData);
    }

    // Setup interval to fetch data when not receiving real-time updates
    const intervalId = setInterval(() => {
      if (!isLive) {
        fetchLatestData();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [initialData, isLive]);

  const fetchLatestData = async () => {
    try {
      const response = await fetch(
        `/api/farms/${farmId}/soil-data?limit=${limit}`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.data && Array.isArray(result.data)) {
          setData(result.data);
          setLastUpdate(new Date().toLocaleString());
        }
      }
    } catch (error) {
      console.error("Error fetching soil data:", error);
    }
  };

  const formattedData = formatData(data);

  // Format values for display
  const getLatestReadings = () => {
    if (data.length === 0) return null;
    return data[0];
  };

  const latest = getLatestReadings();

  // Value status indicators
  const getStatusColor = (value: number, type: string) => {
    switch (type) {
      case "nitrogen":
        return value < 20
          ? "text-red-500"
          : value < 40
          ? "text-amber-500"
          : "text-green-500";
      case "phosphorus":
        return value < 15
          ? "text-red-500"
          : value < 30
          ? "text-amber-500"
          : "text-green-500";
      case "potassium":
        return value < 150
          ? "text-red-500"
          : value < 200
          ? "text-amber-500"
          : "text-green-500";
      case "moisture":
        return value < 30
          ? "text-red-500"
          : value > 70
          ? "text-blue-500"
          : "text-green-500";
      case "temperature":
        return value < 15
          ? "text-blue-500"
          : value > 30
          ? "text-red-500"
          : "text-green-500";
      case "pH":
        return value < 6
          ? "text-red-500"
          : value > 7.5
          ? "text-amber-500"
          : "text-green-500";
      default:
        return "text-foreground";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Real-Time Soil Data</CardTitle>
        <div className="flex items-center gap-2">
          <Badge
            variant={isLive ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? "LIVE" : "PAUSED"}
          </Badge>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Last update: {lastUpdate}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!latest ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">No soil data available</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Nitrogen
                </div>
                <div
                  className={`text-2xl font-bold ${getStatusColor(
                    latest.nitrogen,
                    "nitrogen"
                  )}`}
                >
                  {latest.nitrogen.toFixed(1)} mg/kg
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Phosphorus
                </div>
                <div
                  className={`text-2xl font-bold ${getStatusColor(
                    latest.phosphorus,
                    "phosphorus"
                  )}`}
                >
                  {latest.phosphorus.toFixed(1)} mg/kg
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Potassium
                </div>
                <div
                  className={`text-2xl font-bold ${getStatusColor(
                    latest.potassium,
                    "potassium"
                  )}`}
                >
                  {latest.potassium.toFixed(1)} mg/kg
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Moisture
                </div>
                <div
                  className={`text-2xl font-bold ${getStatusColor(
                    latest.moisture,
                    "moisture"
                  )}`}
                >
                  {latest.moisture.toFixed(1)}%
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Temperature
                </div>
                <div
                  className={`text-2xl font-bold ${getStatusColor(
                    latest.temperature,
                    "temperature"
                  )}`}
                >
                  {latest.temperature.toFixed(1)}°C
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  pH
                </div>
                <div
                  className={`text-2xl font-bold ${getStatusColor(
                    latest.pH,
                    "pH"
                  )}`}
                >
                  {latest.pH.toFixed(1)}
                </div>
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="npk">NPK Values</TabsTrigger>
                <TabsTrigger value="conditions">Soil Conditions</TabsTrigger>
              </TabsList>

              <TabsContent value="npk" className="mt-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedData.slice().reverse()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="nitrogen"
                        stroke="#3b82f6"
                        name="Nitrogen (mg/kg)"
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="phosphorus"
                        stroke="#10b981"
                        name="Phosphorus (mg/kg)"
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="potassium"
                        stroke="#f59e0b"
                        name="Potassium (mg/kg)"
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="conditions" className="mt-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedData.slice().reverse()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="moisture"
                        stroke="#0ea5e9"
                        name="Moisture (%)"
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="temperature"
                        stroke="#ef4444"
                        name="Temperature (°C)"
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="pH"
                        stroke="#8b5cf6"
                        name="pH"
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}

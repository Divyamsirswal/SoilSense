"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { pusherClient } from "@/lib/pusher";

interface HardwareSimulationProps {
  farmId: string;
  deviceId?: string;
}

export function HardwareSimulation({
  farmId,
  deviceId,
}: HardwareSimulationProps) {
  const [nitrogen, setNitrogen] = useState(35.2);
  const [phosphorus, setPhosphorus] = useState(24.7);
  const [potassium, setPotassium] = useState(195.3);
  const [moisture, setMoisture] = useState(52.8);
  const [temperature, setTemperature] = useState(23.4);
  const [pH, setPH] = useState(6.8);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [signalStrength, setSignalStrength] = useState(95);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Connect to Pusher for real-time updates
  useEffect(() => {
    if (!farmId) return;

    const channel = pusherClient.subscribe(`farm-${farmId}`);

    channel.bind("soil-data-update", (data: any) => {
      if (deviceId && data.deviceId !== deviceId) return;

      if (data.soilData) {
        setNitrogen(data.soilData.nitrogen);
        setPhosphorus(data.soilData.phosphorus);
        setPotassium(data.soilData.potassium);
        setMoisture(data.soilData.moisture);
        setTemperature(data.soilData.temperature);
        setPH(data.soilData.pH);
        setLastUpdate(new Date());
      }

      if (data.batteryLevel) {
        setBatteryLevel(data.batteryLevel);
      }

      if (data.signalStrength) {
        setSignalStrength(data.signalStrength);
      }
    });

    return () => {
      pusherClient.unsubscribe(`farm-${farmId}`);
    };
  }, [farmId, deviceId]);

  // Simulate LED blinking to indicate data transmission
  const [ledActive, setLedActive] = useState(false);

  useEffect(() => {
    // Blink LED whenever new data arrives
    setLedActive(true);
    const timeout = setTimeout(() => setLedActive(false), 500);
    return () => clearTimeout(timeout);
  }, [lastUpdate]);

  // Calculate time since last update
  const [timeSinceUpdate, setTimeSinceUpdate] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = Math.floor(
        (new Date().getTime() - lastUpdate.getTime()) / 1000
      );
      if (seconds < 60) {
        setTimeSinceUpdate(`${seconds} seconds ago`);
      } else if (seconds < 3600) {
        setTimeSinceUpdate(`${Math.floor(seconds / 60)} minutes ago`);
      } else {
        setTimeSinceUpdate(`${Math.floor(seconds / 3600)} hours ago`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">NPK Sensor Simulation</CardTitle>
        <Badge variant={isConnected ? "default" : "destructive"}>
          {isConnected ? "CONNECTED" : "DISCONNECTED"}
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hardware Visualization */}
          <div className="relative border rounded-md p-4 bg-black text-white">
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <div className="text-xs">Status</div>
              <div
                className={`h-3 w-3 rounded-full ${
                  ledActive ? "bg-green-500" : "bg-green-900"
                }`}
              />
            </div>

            <div className="text-center mb-4">
              <div className="text-xs text-muted-foreground">
                ESP32 NPK SENSOR
              </div>
              <div className="text-lg font-bold">
                {deviceId || "DEMO_ESP32"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs mb-1">Battery</div>
                <Progress value={batteryLevel} className="h-2" />
                <div className="text-right text-xs mt-1">{batteryLevel}%</div>
              </div>

              <div>
                <div className="text-xs mb-1">Signal</div>
                <Progress value={signalStrength} className="h-2" />
                <div className="text-right text-xs mt-1">{signalStrength}%</div>
              </div>
            </div>

            <div className="border border-gray-700 rounded-md p-3 mb-4 bg-gray-900">
              <div className="text-xs mb-2 text-center">SENSOR DISPLAY</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center">
                  <div className="text-xs">Nitrogen</div>
                  <div className="font-mono text-green-400">
                    {nitrogen.toFixed(1)}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xs">Phosphorus</div>
                  <div className="font-mono text-blue-400">
                    {phosphorus.toFixed(1)}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xs">Potassium</div>
                  <div className="font-mono text-yellow-400">
                    {potassium.toFixed(1)}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xs">Moisture</div>
                  <div className="font-mono text-blue-300">
                    {moisture.toFixed(1)}%
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xs">Temp</div>
                  <div className="font-mono text-red-400">
                    {temperature.toFixed(1)}°C
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xs">pH</div>
                  <div className="font-mono text-purple-400">
                    {pH.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-center text-muted-foreground">
              Last update: {timeSinceUpdate}
            </div>
          </div>

          {/* Sensor Diagram */}
          <div className="border rounded-md p-4 flex flex-col justify-center">
            <h3 className="text-center text-sm font-medium mb-4">
              Hardware Connection Diagram
            </h3>

            <div className="text-center mb-4">
              <div className="inline-block border border-gray-300 rounded-md p-2 mb-1">
                ESP32
              </div>
              <div className="h-6 w-px mx-auto bg-gray-300"></div>
              <div className="inline-block border border-gray-300 rounded-md p-2 mb-1">
                RS485 Converter
              </div>
              <div className="h-6 w-px mx-auto bg-gray-300"></div>
              <div className="inline-block border border-gray-300 rounded-md p-2">
                NPK Soil Sensor
              </div>
            </div>

            <div className="text-xs text-muted-foreground mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div>ESP32 GPIO16 → RS485 RO</div>
                <div>RS485 A+ → Sensor A+</div>
                <div>ESP32 GPIO17 → RS485 DI</div>
                <div>RS485 B- → Sensor B-</div>
                <div>ESP32 GPIO4 → RS485 DE/RE</div>
                <div>Power → Sensor VCC</div>
              </div>
            </div>

            <div className="text-center text-xs">
              <Badge variant="outline" className="mb-2">
                Demo Mode
              </Badge>
              <p>
                This simulation shows how the physical hardware would work if
                connected.
              </p>
              <p>Data is being generated by the simulator script.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

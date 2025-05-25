"use client";

import { useState, useEffect } from "react";
import { HardwareSimulation } from "@/components/hardware-simulation";
import { RealTimeNPKChart } from "@/components/real-time-npk-chart";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Terminal, Play, PauseCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function DemoPage() {
  const { toast } = useToast();
  const [farmId, setFarmId] = useState<string>("");
  const [deviceId, setDeviceId] = useState<string>("DEMO_ESP32_001");
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [commandOutput, setCommandOutput] = useState<string[]>([]);

  useEffect(() => {
    // Check URL parameters for farmId
    const params = new URLSearchParams(window.location.search);
    const farmIdParam = params.get("farmId");
    if (farmIdParam) {
      setFarmId(farmIdParam);
    }
  }, []);

  const startSimulation = () => {
    if (!farmId) {
      toast({
        title: "Farm ID Required",
        description: "Please enter a farm ID to start the simulation.",
        variant: "destructive",
      });
      return;
    }

    setIsSimulationRunning(true);

    // Add simulation start message to terminal
    const timestamp = new Date().toLocaleTimeString();
    setCommandOutput((prev) => [
      ...prev,
      `[${timestamp}] Starting hardware simulation...`,
      `[${timestamp}] Device ID: ${deviceId}`,
      `[${timestamp}] Farm ID: ${farmId}`,
      `[${timestamp}] Connecting to API...`,
      `[${timestamp}] Generating mock NPK sensor data...`,
      `[${timestamp}] First data point sent successfully!`,
    ]);

    // Show success toast
    toast({
      title: "Simulation Started",
      description: "Hardware simulation is now running and sending data.",
    });
  };

  const stopSimulation = () => {
    setIsSimulationRunning(false);

    // Add simulation stop message to terminal
    const timestamp = new Date().toLocaleTimeString();
    setCommandOutput((prev) => [
      ...prev,
      `[${timestamp}] Stopping hardware simulation...`,
      `[${timestamp}] Simulation stopped.`,
    ]);

    // Show info toast
    toast({
      title: "Simulation Stopped",
      description: "Hardware simulation has been stopped.",
      variant: "default",
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hardware Demo</h1>
          <p className="text-muted-foreground">
            Simulate the ESP32 NPK sensor hardware for your hackathon
            presentation
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <label htmlFor="farmId" className="text-sm">
              Farm ID
            </label>
            <input
              type="text"
              id="farmId"
              value={farmId}
              onChange={(e) => setFarmId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Enter your farm ID"
            />
          </div>

          {!isSimulationRunning ? (
            <Button onClick={startSimulation} className="gap-2">
              <Play className="h-4 w-4" />
              Start Simulation
            </Button>
          ) : (
            <Button
              onClick={stopSimulation}
              variant="destructive"
              className="gap-2"
            >
              <PauseCircle className="h-4 w-4" />
              Stop Simulation
            </Button>
          )}
        </div>
      </div>

      {!farmId && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Please enter your farm ID to start the simulation. You can find
                this in the URL when viewing your farm (farms/YOUR_FARM_ID).
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <HardwareSimulation farmId={farmId} deviceId={deviceId} />

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Simulation Terminal</CardTitle>
            <CardDescription>
              Output from the hardware simulation process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-md h-[350px] overflow-y-auto">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-800">
                <Terminal className="h-4 w-4" />
                <span className="text-white">
                  SoilGuardian Hardware Simulator
                </span>
              </div>

              {commandOutput.length === 0 ? (
                <div className="text-gray-500 italic">
                  Start the simulation to see output here...
                </div>
              ) : (
                commandOutput.map((line, index) => (
                  <div key={index} className="mb-1">
                    {line}
                  </div>
                ))
              )}

              {isSimulationRunning && (
                <div className="text-white mt-2">
                  • Simulation running - sending data every 5 seconds...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <Tabs defaultValue="realtime" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="realtime">Real-time Data</TabsTrigger>
            <TabsTrigger value="presentation">Presentation Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="realtime" className="space-y-4 pt-4">
            <RealTimeNPKChart farmId={farmId} limit={10} />

            <Card>
              <CardHeader>
                <CardTitle>How This Works</CardTitle>
                <CardDescription>
                  The complete data flow from hardware to dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2">
                  <li>
                    The ESP32 hardware (simulated) reads NPK soil data via RS485
                    protocol
                  </li>
                  <li>Data is processed and packaged into JSON format</li>
                  <li>ESP32 sends HTTP requests to your API endpoint</li>
                  <li>Your Next.js backend processes and stores the data</li>
                  <li>
                    Pusher real-time channels broadcast the data to all
                    connected clients
                  </li>
                  <li>
                    The charts and hardware simulation update in real time
                  </li>
                </ol>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    For your hackathon presentation, this simulation shows the
                    complete workflow exactly as it would work with physical
                    hardware. The only difference is that we're generating the
                    sensor data rather than reading from a physical sensor.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="presentation" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Hackathon Presentation Guide</CardTitle>
                <CardDescription>
                  How to demo SoilGuardian effectively
                </CardDescription>
              </CardHeader>
              <CardContent>
                <h3 className="text-lg font-medium mb-2">Demo Script</h3>

                <ol className="list-decimal list-inside space-y-3 mb-6">
                  <li>
                    <strong>Introduction (30 sec):</strong> "SoilGuardian is a
                    smart farming solution that helps farmers make data-driven
                    decisions using real-time soil monitoring and AI crop
                    recommendations."
                  </li>
                  <li>
                    <strong>Problem Statement (30 sec):</strong> "Traditional
                    farming relies on guesswork for soil health. Our solution
                    provides precise, real-time soil data to optimize crop yield
                    and reduce fertilizer waste."
                  </li>
                  <li>
                    <strong>Hardware Demo (1 min):</strong> "Our system uses
                    ESP32 microcontrollers connected to NPK sensors. Here you
                    can see the real-time data flow from sensor to dashboard."
                  </li>
                  <li>
                    <strong>Data Visualization (1 min):</strong> "The dashboard
                    shows real-time soil metrics with historical trends. Notice
                    how the values fluctuate as new readings come in."
                  </li>
                  <li>
                    <strong>AI Recommendations (1 min):</strong> "Based on this
                    soil data, our AI model recommends optimal crops and
                    fertilizer treatments customized for each farm."
                  </li>
                  <li>
                    <strong>Conclusion (30 sec):</strong> "SoilGuardian brings
                    precision agriculture to farmers of all sizes, increasing
                    yields while reducing environmental impact."
                  </li>
                </ol>

                <h3 className="text-lg font-medium mb-2">Demo Tips</h3>

                <ul className="list-disc list-inside space-y-2">
                  <li>Start the simulation before your presentation begins</li>
                  <li>
                    Have both the hardware simulation and data chart visible
                  </li>
                  <li>
                    Point out the blinking LED that indicates data transmission
                  </li>
                  <li>Highlight the real-time updates in the chart</li>
                  <li>
                    Mention that in production, multiple sensors would be
                    deployed across a farm
                  </li>
                  <li>
                    Be ready to answer questions about scalability and future
                    plans
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

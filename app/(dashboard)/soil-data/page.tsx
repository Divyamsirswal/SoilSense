"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SoilDataChart } from "@/components/soil-data-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, soilHealthStatus } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Eye, Leaf } from "lucide-react";
import Link from "next/link";
import { MLRecommendationCard } from "@/components/ml-recommendation-card";

interface SoilDataRecord {
  id: string;
  timestamp: string;
  pH: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  moisture: number;
  temperature: number;
  deviceId: string;
  device?: {
    name: string;
    farmId: string;
  };
  farm?: {
    name: string;
    id: string;
  };
}

interface Farm {
  id: string;
  name: string;
}

export default function SoilDataPage() {
  const [selectedFarm, setSelectedFarm] = useState<string | null>(null);
  const [soilData, setSoilData] = useState<SoilDataRecord[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch farms
        const farmsResponse = await fetch("/api/farms");
        if (!farmsResponse.ok) {
          throw new Error("Failed to fetch farms");
        }
        const farmsData = await farmsResponse.json();
        setFarms(farmsData.farms);

        // Fetch soil data
        const soilDataResponse = await fetch("/api/soil-data");
        if (!soilDataResponse.ok) {
          throw new Error("Failed to fetch soil data");
        }
        const soilDataResult = await soilDataResponse.json();
        setSoilData(soilDataResult.soilData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter soil data by selected farm
  const filteredSoilData = selectedFarm
    ? soilData.filter((data) => data.farm?.id === selectedFarm)
    : soilData;

  // Get latest soil data reading for each farm for health status cards
  const latestData =
    filteredSoilData.length > 0
      ? filteredSoilData[filteredSoilData.length - 1]
      : null;

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "low":
        return "text-amber-500";
      case "high":
        return "text-red-500";
      case "optimal":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Soil Data</h1>
        <p className="text-muted-foreground">
          View and analyze your soil measurements
        </p>
      </div>

      {/* Farm selector */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedFarm(null)}
          className={`px-3 py-1 text-sm rounded-full ${
            selectedFarm === null
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          All Farms
        </button>
        {farms.map((farm) => (
          <button
            key={farm.id}
            onClick={() => setSelectedFarm(farm.id)}
            className={`px-3 py-1 text-sm rounded-full ${
              selectedFarm === farm.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {farm.name}
          </button>
        ))}
      </div>

      {latestData ? (
        <>
          {/* Health status cards */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">pH Level</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-2xl font-bold">{latestData.pH.toFixed(1)}</p>
                <p
                  className={`text-xs font-medium ${getStatusColor(
                    soilHealthStatus(latestData.pH, "ph")
                  )}`}
                >
                  {soilHealthStatus(latestData.pH, "ph").toUpperCase()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">
                  Nitrogen (N)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-2xl font-bold">{latestData.nitrogen} ppm</p>
                <p
                  className={`text-xs font-medium ${getStatusColor(
                    soilHealthStatus(latestData.nitrogen, "n")
                  )}`}
                >
                  {soilHealthStatus(latestData.nitrogen, "n").toUpperCase()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">
                  Phosphorus (P)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-2xl font-bold">
                  {latestData.phosphorus} ppm
                </p>
                <p
                  className={`text-xs font-medium ${getStatusColor(
                    soilHealthStatus(latestData.phosphorus, "p")
                  )}`}
                >
                  {soilHealthStatus(latestData.phosphorus, "p").toUpperCase()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">
                  Potassium (K)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-2xl font-bold">{latestData.potassium} ppm</p>
                <p
                  className={`text-xs font-medium ${getStatusColor(
                    soilHealthStatus(latestData.potassium, "k")
                  )}`}
                >
                  {soilHealthStatus(latestData.potassium, "k").toUpperCase()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">Moisture</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-2xl font-bold">{latestData.moisture}%</p>
                <p
                  className={`text-xs font-medium ${getStatusColor(
                    soilHealthStatus(latestData.moisture, "moisture")
                  )}`}
                >
                  {soilHealthStatus(
                    latestData.moisture,
                    "moisture"
                  ).toUpperCase()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">
                  Temperature
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-2xl font-bold">{latestData.temperature}°C</p>
                <p className="text-xs font-medium text-muted-foreground">
                  {formatDate(latestData.timestamp)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="ph" className="space-y-4">
            <TabsList className="w-full flex justify-start overflow-x-auto">
              <TabsTrigger value="ph">pH</TabsTrigger>
              <TabsTrigger value="npk">NPK</TabsTrigger>
              <TabsTrigger value="moisture">Moisture</TabsTrigger>
              <TabsTrigger value="temperature">Temperature</TabsTrigger>
              <TabsTrigger value="all">All Parameters</TabsTrigger>
            </TabsList>

            <TabsContent value="ph" className="space-y-4">
              <SoilDataChart
                data={filteredSoilData}
                parameter="pH"
                title="Soil pH Levels"
                description="Optimal range: 5.5 - 7.5"
              />
            </TabsContent>

            <TabsContent
              value="npk"
              className="space-y-4 grid gap-4 md:grid-cols-3"
            >
              <SoilDataChart
                data={filteredSoilData}
                parameter="nitrogen"
                title="Nitrogen (N)"
                description="Optimal range: 30 - 60 ppm"
              />
              <SoilDataChart
                data={filteredSoilData}
                parameter="phosphorus"
                title="Phosphorus (P)"
                description="Optimal range: 20 - 40 ppm"
              />
              <SoilDataChart
                data={filteredSoilData}
                parameter="potassium"
                title="Potassium (K)"
                description="Optimal range: 150 - 250 ppm"
              />
            </TabsContent>

            <TabsContent value="moisture" className="space-y-4">
              <SoilDataChart
                data={filteredSoilData}
                parameter="moisture"
                title="Soil Moisture"
                description="Optimal range: 50 - 75%"
              />
            </TabsContent>

            <TabsContent value="temperature" className="space-y-4">
              <SoilDataChart
                data={filteredSoilData}
                parameter="temperature"
                title="Soil Temperature"
                description="Optimal range: 18 - 24°C"
              />
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              <SoilDataChart
                data={filteredSoilData}
                parameter="pH"
                title="All Soil Parameters"
                description="Overview of all soil health indicators"
              />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <SoilDataChart
                  data={filteredSoilData}
                  parameter="nitrogen"
                  title="Nitrogen (N)"
                  description="Optimal range: 30 - 60 ppm"
                />
                <SoilDataChart
                  data={filteredSoilData}
                  parameter="phosphorus"
                  title="Phosphorus (P)"
                  description="Optimal range: 20 - 40 ppm"
                />
                <SoilDataChart
                  data={filteredSoilData}
                  parameter="potassium"
                  title="Potassium (K)"
                  description="Optimal range: 150 - 250 ppm"
                />
                <SoilDataChart
                  data={filteredSoilData}
                  parameter="moisture"
                  title="Soil Moisture"
                  description="Optimal range: 50 - 75%"
                />
                <SoilDataChart
                  data={filteredSoilData}
                  parameter="temperature"
                  title="Soil Temperature"
                  description="Optimal range: 18 - 24°C"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Recent Soil Data & ML Recommendations */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Soil Data</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredSoilData
                .sort(
                  (a, b) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime()
                )
                .slice(0, 6)
                .map((data) => (
                  <Card key={data.id} className="overflow-hidden">
                    <CardHeader className="p-4">
                      <CardTitle className="text-md">
                        {data.farm?.name || "Unknown Farm"}
                      </CardTitle>
                      <CardDescription>
                        {data.device?.name || "Unknown Device"} •{" "}
                        {formatDate(data.timestamp)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-sm text-muted-foreground">pH</p>
                          <p
                            className={`font-medium ${getStatusColor(
                              soilHealthStatus(data.pH, "ph")
                            )}`}
                          >
                            {data.pH.toFixed(1)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Moisture
                          </p>
                          <p
                            className={`font-medium ${getStatusColor(
                              soilHealthStatus(data.moisture, "moisture")
                            )}`}
                          >
                            {data.moisture}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Temp</p>
                          <p className="font-medium">{data.temperature}°C</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <Link href={`/soil-data/${data.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </Link>
                        <Link
                          href={`/soil-data/${data.id}`}
                          className="flex items-center text-primary text-sm font-medium"
                        >
                          <Leaf className="mr-1 h-4 w-4 text-green-500" />
                          Get Crop Recommendation
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-10 bg-muted rounded-lg">
          <Leaf className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No Soil Data Yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Connect your soil monitoring devices to start collecting data and
            receiving crop recommendations.
          </p>
        </div>
      )}
    </div>
  );
}

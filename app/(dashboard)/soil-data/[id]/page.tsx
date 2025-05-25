"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SoilDataChart } from "@/components/soil-data-chart";
import { MLCropRecommendation } from "@/components/ml-crop-recommendation";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Leaf } from "lucide-react";
import { formatDate, soilHealthStatus } from "@/lib/utils";
import axios from "axios";
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

export default function SoilDataDetailPage() {
  const { id } = useParams();
  const [soilData, setSoilData] = useState<SoilDataRecord | null>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [mlRecommendation, setMlRecommendation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  // Fetch soil data and recommendations
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch soil data
        const soilResponse = await axios.get(`/api/soil-data/${id}`);
        setSoilData(soilResponse.data.soilData);

        // Fetch standard recommendation (if exists)
        try {
          const recommendationResponse = await axios.get(
            `/api/recommendations/${id}`
          );
          if (recommendationResponse.data.recommendation) {
            setRecommendation(recommendationResponse.data.recommendation);
          }
        } catch (error) {
          console.log("No standard recommendation found");
        }

        // Fetch ML recommendation (if exists)
        try {
          const mlRecommendationResponse = await axios.get(
            `/api/ml-recommendation?soilDataId=${id}`
          );
          if (mlRecommendationResponse.data.recommendations?.length > 0) {
            setMlRecommendation(
              mlRecommendationResponse.data.recommendations[0]
            );
          }
        } catch (error) {
          console.log("No ML recommendation found");
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description:
            error.response?.data?.error || "Failed to load soil data",
          variant: "destructive",
        });
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, toast]);

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
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/soil-data">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Skeleton className="h-8 w-[200px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  if (error || !soilData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/soil-data">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Soil Data Not Found
          </h1>
        </div>
        <p className="text-muted-foreground">
          {error || "The requested soil data could not be found."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link href="/soil-data">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Soil Data Details
          </h1>
          <p className="text-muted-foreground">
            {soilData.farm?.name} • {soilData.device?.name || "Unknown device"} • {formatDate(soilData.timestamp)}
          </p>
        </div>
      </div>

      {/* Soil parameters display */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm font-medium">pH Level</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold">{soilData.pH.toFixed(1)}</p>
            <p
              className={`text-xs font-medium ${getStatusColor(
                soilHealthStatus(soilData.pH, "ph")
              )}`}
            >
              {soilHealthStatus(soilData.pH, "ph").toUpperCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm font-medium">Nitrogen (N)</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold">{soilData.nitrogen} ppm</p>
            <p
              className={`text-xs font-medium ${getStatusColor(
                soilHealthStatus(soilData.nitrogen, "n")
              )}`}
            >
              {soilHealthStatus(soilData.nitrogen, "n").toUpperCase()}
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
            <p className="text-2xl font-bold">{soilData.phosphorus} ppm</p>
            <p
              className={`text-xs font-medium ${getStatusColor(
                soilHealthStatus(soilData.phosphorus, "p")
              )}`}
            >
              {soilHealthStatus(soilData.phosphorus, "p").toUpperCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm font-medium">Potassium (K)</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold">{soilData.potassium} ppm</p>
            <p
              className={`text-xs font-medium ${getStatusColor(
                soilHealthStatus(soilData.potassium, "k")
              )}`}
            >
              {soilHealthStatus(soilData.potassium, "k").toUpperCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm font-medium">Moisture</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold">{soilData.moisture}%</p>
            <p
              className={`text-xs font-medium ${getStatusColor(
                soilHealthStatus(soilData.moisture, "moisture")
              )}`}
            >
              {soilHealthStatus(soilData.moisture, "moisture").toUpperCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold">{soilData.temperature}°C</p>
            <p className="text-xs font-medium text-muted-foreground">
              {soilData.device?.name || "Unknown device"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations and charts */}
      <Tabs defaultValue="ml-recommendation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ml-recommendation">
            <Leaf className="mr-2 h-4 w-4" />
            ML Recommendation
          </TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          {recommendation && (
            <TabsTrigger value="ai-recommendation">
              AI Recommendation
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="ml-recommendation" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <MLCropRecommendation
              soilDataId={id as string}
              existingRecommendation={mlRecommendation}
              onRecommendationGenerated={setMlRecommendation}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How It Works</CardTitle>
                <CardDescription>
                  Understanding our machine learning recommendation system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Advanced ML Models</h4>
                    <p className="text-sm text-muted-foreground">
                      Our system uses machine learning models trained on
                      thousands of soil samples and crop performance data to
                      provide accurate recommendations.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium">Soil Parameter Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      We analyze your soil pH, NPK levels, moisture, and
                      temperature to find the ideal crop matches for your
                      specific conditions.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium">Growing Advice</h4>
                    <p className="text-sm text-muted-foreground">
                      Along with crop recommendations, we provide tailored
                      advice for fertilization, irrigation, and soil amendments
                      to maximize yield.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SoilDataChart
              data={[soilData]}
              parameter="pH"
              title="Soil pH Level"
              description="Optimal range: 5.5 - 7.5"
            />

            <SoilDataChart
              data={[soilData]}
              parameter="nitrogen"
              title="Nitrogen (N)"
              description="Optimal range: 30 - 60 ppm"
            />

            <SoilDataChart
              data={[soilData]}
              parameter="phosphorus"
              title="Phosphorus (P)"
              description="Optimal range: 20 - 40 ppm"
            />

            <SoilDataChart
              data={[soilData]}
              parameter="potassium"
              title="Potassium (K)"
              description="Optimal range: 150 - 250 ppm"
            />
          </div>
        </TabsContent>

        {recommendation && (
          <TabsContent value="ai-recommendation">
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Recommendation</CardTitle>
                <CardDescription>
                  GPT-based recommendation for your soil data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendation.crops && (
                  <div>
                    <h4 className="font-medium">Recommended Crops</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {recommendation.crops.map(
                        (crop: string, index: number) => (
                          <div
                            key={index}
                            className="bg-secondary rounded-md px-3 py-1 text-sm"
                          >
                            {crop}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {recommendation.remarks && (
                  <div>
                    <h4 className="font-medium">Remarks</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {recommendation.remarks}
                    </p>
                  </div>
                )}

                {recommendation.fertilizers && (
                  <div>
                    <h4 className="font-medium">Fertilizer Recommendations</h4>
                    <pre className="text-xs bg-muted p-2 rounded-md mt-2 overflow-auto">
                      {JSON.stringify(recommendation.fertilizers, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <div className="mt-6">
        <MLRecommendationCard soilDataId={Array.isArray(id) ? id[0] : id} isDetailView={true} />
      </div>
    </div>
  );
}

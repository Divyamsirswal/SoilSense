"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Leaf, CalendarDays, Eye, Filter } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Recommendation {
  id: string;
  soilDataId: string;
  recommendedCrop: string;
  confidence: number;
  alternatives: string[];
  advice: {
    growing: string;
    fertilization: string;
    irrigation: string;
  };
  modelType: string;
  timestamp: string;
  soilData: {
    id: string;
    timestamp: string;
    pH: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    moisture: number;
    temperature: number;
    device: {
      name: string;
      farmId: string;
    };
    farm: {
      name: string;
      id: string;
    };
  };
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFarm, setSelectedFarm] = useState<string | null>(null);
  const [farms, setFarms] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch farms
        const farmsResponse = await fetch('/api/farms');
        if (!farmsResponse.ok) {
          throw new Error('Failed to fetch farms');
        }
        const farmsData = await farmsResponse.json();
        setFarms(farmsData.farms);

        // Fetch ML recommendations
        const recommendationsResponse = await fetch('/api/ml-recommendation');
        if (!recommendationsResponse.ok) {
          throw new Error('Failed to fetch recommendations');
        }
        const data = await recommendationsResponse.json();
        setRecommendations(data.recommendations || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter recommendations by selected farm
  const filteredRecommendations = selectedFarm 
    ? recommendations.filter(rec => rec.soilData.farm.id === selectedFarm)
    : recommendations;

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Crop Recommendations</h1>
          <p className="text-muted-foreground">
            AI-powered crop recommendations based on your soil data
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter by Farm
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedFarm(null)}>
              All Farms
            </DropdownMenuItem>
            {farms.map(farm => (
              <DropdownMenuItem 
                key={farm.id} 
                onClick={() => setSelectedFarm(farm.id)}
              >
                {farm.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredRecommendations.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecommendations.map((recommendation) => (
            <Card key={recommendation.id} className="overflow-hidden">
              <CardHeader className="bg-primary/5 p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Leaf className="h-5 w-5 text-green-500" />
                    {recommendation.recommendedCrop}
                  </CardTitle>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {recommendation.confidence}% confidence
                  </span>
                </div>
                <CardDescription>
                  {recommendation.soilData.farm.name} • {recommendation.soilData.device.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Alternative Crops</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {recommendation.alternatives.slice(0, 3).map((crop, index) => (
                      <span key={index} className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {crop}
                      </span>
                    ))}
                    {recommendation.alternatives.length > 3 && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                        +{recommendation.alternatives.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">pH</p>
                    <p className="font-medium">{recommendation.soilData.pH.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Moisture</p>
                    <p className="font-medium">{recommendation.soilData.moisture}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Nitrogen</p>
                    <p className="font-medium">{recommendation.soilData.nitrogen} ppm</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phosphorus</p>
                    <p className="font-medium">{recommendation.soilData.phosphorus} ppm</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <div className="flex items-center text-xs text-muted-foreground">
                  <CalendarDays className="mr-1 h-3 w-3" />
                  {formatDate(recommendation.timestamp)}
                </div>
                <Link href={`/soil-data/${recommendation.soilDataId}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-10 bg-muted rounded-lg">
          <Leaf className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No Recommendations Yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            View your soil data and generate AI-powered crop recommendations to see them here.
          </p>
          <Link href="/soil-data">
            <Button>
              View Soil Data
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
} 
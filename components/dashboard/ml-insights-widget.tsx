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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Leaf, Sprout, AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import axios from "axios";

export function MLInsightsWidget() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMLRecommendations = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/api/ml-recommendation?limit=5");
        setRecommendations(response.data.recommendations || []);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching ML recommendations:", err);
        setError(
          err.response?.data?.error || "Failed to load ML recommendations"
        );
        toast({
          title: "Error",
          description: "Failed to load ML recommendations",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMLRecommendations();
  }, []);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const viewSoilData = (soilDataId: string) => {
    router.push(`/soil-data/${soilDataId}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sprout className="mr-2 h-5 w-5 text-primary" />
            ML Crop Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered crop suggestions based on soil data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sprout className="mr-2 h-5 w-5 text-primary" />
            ML Crop Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered crop suggestions based on soil data
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-2" />
            <p className="text-muted-foreground">
              Failed to load ML recommendations
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sprout className="mr-2 h-5 w-5 text-primary" />
            ML Crop Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered crop suggestions based on soil data
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Leaf className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No ML recommendations yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add soil data and generate recommendations from the soil data
              detail page
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sprout className="mr-2 h-5 w-5 text-primary" />
          ML Crop Recommendations
        </CardTitle>
        <CardDescription>
          AI-powered crop suggestions based on soil data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.slice(0, 3).map((rec) => (
          <div key={rec.id} className="border rounded-md p-3 space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{rec.recommendedCrop}</h3>
              <Badge className={getConfidenceColor(rec.confidence)}>
                {Math.round(rec.confidence)}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Farm: {rec.soilData.farm.name}
            </p>
            <p className="text-xs text-muted-foreground">
              Date: {new Date(rec.timestamp).toLocaleDateString()}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => viewSoilData(rec.soilDataId)}
            >
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
      {recommendations.length > 3 && (
        <CardFooter>
          <Button
            variant="link"
            className="w-full"
            onClick={() => router.push("/soil-data")}
          >
            View all recommendations
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

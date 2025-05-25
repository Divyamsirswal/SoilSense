"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Loader2, Info, TreePine, Leaf } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import axios from "axios";

interface MLCropRecommendationProps {
  soilDataId: string;
  existingRecommendation?: any;
  onRecommendationGenerated?: (recommendation: any) => void;
}

export function MLCropRecommendation({
  soilDataId,
  existingRecommendation,
  onRecommendationGenerated,
}: MLCropRecommendationProps) {
  const [recommendation, setRecommendation] = useState(existingRecommendation);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const generateRecommendation = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post("/api/ml-recommendation", {
        soilDataId,
      });
      setRecommendation(response.data.recommendation);
      toast({
        title: "Recommendation Generated",
        description: "ML crop recommendation has been generated successfully.",
      });

      if (onRecommendationGenerated) {
        onRecommendationGenerated(response.data.recommendation);
      }
    } catch (error: any) {
      console.error("Error generating ML recommendation:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.error || "Failed to generate recommendation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!recommendation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ML Crop Recommendation</CardTitle>
          <CardDescription>
            Use machine learning to get personalized crop recommendations based
            on your soil data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Our advanced machine learning model will analyze your soil
            parameters and provide tailored crop recommendations with detailed
            growing advice.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={generateRecommendation} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Recommendation"
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">ML Crop Recommendation</CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {recommendation.modelType}
          </Badge>
        </div>
        <CardDescription>
          Personalized recommendation based on your soil parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center">
              <TreePine className="mr-2 h-5 w-5 text-green-600" />
              {recommendation.recommendedCrop}
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Badge
                      className={`${getConfidenceColor(
                        recommendation.confidence
                      )}`}
                    >
                      {Math.round(recommendation.confidence)}% Confidence
                    </Badge>
                    <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Confidence score indicates how well this crop matches your
                    soil conditions.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {recommendation.alternatives &&
            Array.isArray(recommendation.alternatives) &&
            recommendation.alternatives.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-1">
                  Alternative options:
                </p>
                <div className="flex flex-wrap gap-2">
                  {recommendation.alternatives.map(
                    (alt: any, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {alt.crop || alt.name || `Option ${index + 1}`}(
                        {Math.round(alt.confidence || alt.probability || 0)}%)
                      </Badge>
                    )
                  )}
                </div>
              </div>
            )}
        </div>

        {recommendation.advice && (
          <div
            className={`mt-4 space-y-3 ${
              isExpanded ? "" : "max-h-[200px] overflow-hidden relative"
            }`}
          >
            <h4 className="font-medium flex items-center">
              <Leaf className="mr-2 h-4 w-4 text-green-600" />
              Growing Advice
            </h4>

            {Object.entries(recommendation.advice).map(
              ([key, value]: [string, any]) => (
                <div
                  key={key}
                  className="ml-2 border-l-2 border-muted pl-3 py-1"
                >
                  <p className="text-sm font-medium capitalize">{key}:</p>
                  {typeof value === "string" ? (
                    <p className="text-sm text-muted-foreground">{value}</p>
                  ) : value && typeof value === "object" ? (
                    <div className="text-sm text-muted-foreground">
                      {Object.entries(value).map(
                        ([subKey, subValue]: [string, any]) => (
                          <div key={subKey} className="mt-1">
                            <p className="text-xs font-medium capitalize">
                              {subKey}:
                            </p>
                            <p>
                              {typeof subValue === "string"
                                ? subValue
                                : JSON.stringify(subValue)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {String(value)}
                    </p>
                  )}
                </div>
              )
            )}

            {!isExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent" />
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show Less" : "Show More"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Generated: {new Date(recommendation.timestamp).toLocaleString()}
        </p>
      </CardFooter>
    </Card>
  );
}

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Leaf, Info } from "lucide-react";
import { useState } from "react";

interface MLRecommendationCardProps {
  soilDataId: string;
  isDetailView?: boolean;
}

interface Alternative {
  crop: string;
  confidence: number;
}

interface Recommendation {
  id: string;
  soilDataId: string;
  recommendedCrop: string;
  confidence: number;
  alternatives: Alternative[];
  advice: {
    growing?: string;
    fertilization?: string;
    irrigation?: string;
    [key: string]: any;
  };
  modelType: string;
  timestamp: string;
}

export function MLRecommendationCard({ soilDataId, isDetailView = false }: MLRecommendationCardProps) {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First check if a recommendation already exists
      const getResponse = await fetch(`/api/ml-recommendation?soilDataId=${soilDataId}`);
      const getData = await getResponse.json();
      
      if (getData.recommendations && getData.recommendations.length > 0) {
        setRecommendation(getData.recommendations[0]);
      } else {
        // Generate a new recommendation
        const response = await fetch('/api/ml-recommendation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ soilDataId }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate recommendation');
        }
        
        const data = await response.json();
        setRecommendation(data.recommendation);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recommendation');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to safely render advice fields
  const renderAdviceField = (field: string, title: string) => {
    if (!recommendation?.advice) return null;
    
    const value = recommendation.advice[field];
    if (!value) return null;
    
    return (
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm mt-1">
          {typeof value === 'string' 
            ? value 
            : typeof value === 'object' && value !== null
              ? Object.entries(value).map(([k, v]) => (
                  <div key={k} className="mt-1">
                    <span className="font-medium">{k}: </span>
                    <span>{typeof v === 'string' ? v : JSON.stringify(v)}</span>
                  </div>
                ))
              : JSON.stringify(value)
          }
        </p>
      </div>
    );
  };

  return (
    <Card className={isDetailView ? "w-full" : "w-full max-w-md"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-green-500" />
          Crop Recommendation
        </CardTitle>
        <CardDescription>
          Get AI-powered crop recommendations based on soil analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recommendation ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Recommended Crop</h3>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xl font-bold">{recommendation.recommendedCrop}</p>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {Math.round(recommendation.confidence)}% confidence
                </span>
              </div>
            </div>

            {isDetailView && (
              <>
                {recommendation.alternatives && recommendation.alternatives.length > 0 && (
                  <div>
                    <h3 className="font-semibold">Alternative Crops</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {recommendation.alternatives.map((alt, index) => (
                        <span key={index} className="bg-gray-100 px-2.5 py-0.5 rounded text-sm">
                          {typeof alt === 'string' 
                            ? alt 
                            : `${alt.crop || `Option ${index+1}`} (${Math.round(alt.confidence || 0)}%)`
                          }
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {renderAdviceField('growing', 'Growing Advice')}
                {renderAdviceField('fertilization', 'Fertilization Tips')}
                {renderAdviceField('irrigation', 'Irrigation Schedule')}
                
                {/* Render any other advice fields */}
                {recommendation.advice && Object.entries(recommendation.advice)
                  .filter(([key]) => !['growing', 'fertilization', 'irrigation'].includes(key))
                  .map(([key, value]) => renderAdviceField(key, key.charAt(0).toUpperCase() + key.slice(1)))}
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            {error ? (
              <div className="text-red-500 flex flex-col items-center gap-2">
                <Info className="h-10 w-10" />
                <p>{error}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Click the button below to get AI-powered crop recommendations based on this soil data.
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!recommendation && (
          <Button 
            onClick={fetchRecommendation} 
            disabled={isLoading} 
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Analyzing Soil Data..." : "Get Crop Recommendation"}
          </Button>
        )}
        {recommendation && isDetailView && (
          <div className="text-xs text-muted-foreground w-full text-right">
            Model: {recommendation.modelType} • Generated on {new Date(recommendation.timestamp).toLocaleDateString()}
          </div>
        )}
      </CardFooter>
    </Card>
  );
} 
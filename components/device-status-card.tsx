"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Battery, Signal, Clock, MoreVertical, Settings, Trash2, AlertTriangle, Leaf, ChevronRight, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";

interface DeviceStatusCardProps {
    id: string;
    name: string;
    deviceId: string;
    status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  lastActive: string;
    batteryLevel?: number;
    signalStrength?: number;
  farmName: string;
  readingsCount?: number;
}

export function DeviceStatusCard({
  id,
  name,
  deviceId,
  status,
  lastActive,
  batteryLevel,
  signalStrength,
  farmName,
  readingsCount = 0,
}: DeviceStatusCardProps) {
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false);
  const [latestRecommendation, setLatestRecommendation] = useState<any>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500";
      case "INACTIVE":
        return "bg-amber-500";
      case "MAINTENANCE":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getBatteryColor = (level?: number) => {
    if (level === undefined) return "text-muted-foreground";
    if (level < 20) return "text-red-500";
    if (level < 50) return "text-amber-500";
    return "text-green-500";
  };

  const getSignalColor = (strength?: number) => {
    if (strength === undefined) return "text-muted-foreground";
    if (strength < 30) return "text-red-500";
    if (strength < 70) return "text-amber-500";
    return "text-green-500";
  };

  const formatLastActive = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return "Unknown";
    }
  };

  // Fetch the latest ML recommendation for this device's soil data
  const fetchLatestRecommendation = async () => {
    try {
      setIsLoadingRecommendation(true);
      // Fetch the latest soil data for this device
      const response = await axios.get(`/api/soil-data?deviceId=${id}&limit=1`);
      
      if (response.data.soilData && response.data.soilData.length > 0) {
        const soilDataId = response.data.soilData[0].id;
        
        // Check if there's an ML recommendation for this soil data
        const recResponse = await axios.get(`/api/ml-recommendation?soilDataId=${soilDataId}`);
        
        if (recResponse.data.recommendations && recResponse.data.recommendations.length > 0) {
          setLatestRecommendation(recResponse.data.recommendations[0]);
        } else {
          setLatestRecommendation(null);
        }
    } else {
        toast({
          title: "No Soil Data",
          description: "This device doesn't have any soil data yet.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching recommendation:", error);
      toast({
        title: "Error",
        description: "Failed to fetch ML recommendation",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRecommendation(false);
    }
  };

  // Generate a new ML recommendation for the latest soil data
  const generateRecommendation = async () => {
    try {
      setIsGeneratingRecommendation(true);
      
      // Fetch the latest soil data for this device
      const response = await axios.get(`/api/soil-data?deviceId=${id}&limit=1`);
      
      if (response.data.soilData && response.data.soilData.length > 0) {
        const soilDataId = response.data.soilData[0].id;
        
        // Generate an ML recommendation
        const recResponse = await axios.post('/api/ml-recommendation', {
          soilDataId
        });
        
        if (recResponse.data.recommendation) {
          setLatestRecommendation(recResponse.data.recommendation);
          toast({
            title: "Success",
            description: "ML recommendation generated successfully",
          });
        }
      } else {
        toast({
          title: "No Soil Data",
          description: "This device doesn't have any soil data yet.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating recommendation:", error);
      toast({
        title: "Error",
        description: "Failed to generate ML recommendation",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingRecommendation(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge className={getStatusColor(status)}>{status}</Badge>
        </div>
        <CardDescription>ID: {deviceId}</CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-muted-foreground">Last active:</span>
            </div>
            <span>{formatLastActive(lastActive)}</span>
          </div>

          {batteryLevel !== undefined && (
            <div className="flex justify-between text-sm">
              <div className="flex items-center">
                <Battery className={`h-4 w-4 mr-1 ${getBatteryColor(batteryLevel)}`} />
                <span className="text-muted-foreground">Battery:</span>
              </div>
              <span className={getBatteryColor(batteryLevel)}>
                {batteryLevel}%
              </span>
            </div>
          )}

          {signalStrength !== undefined && (
            <div className="flex justify-between text-sm">
              <div className="flex items-center">
                <Signal className={`h-4 w-4 mr-1 ${getSignalColor(signalStrength)}`} />
                <span className="text-muted-foreground">Signal:</span>
              </div>
              <span className={getSignalColor(signalStrength)}>
                {signalStrength}%
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Farm:</span>
            <span>{farmName}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Readings:</span>
            <span>{readingsCount}</span>
        </div>

          {latestRecommendation && (
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center mb-2">
                <Leaf className="h-4 w-4 mr-1 text-green-500" />
                <span className="font-medium">Latest ML Recommendation:</span>
              </div>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recommended Crop:</span>
                  <span className="font-medium">{latestRecommendation.recommendedCrop}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confidence:</span>
                  <span>{Math.round(latestRecommendation.confidence)}%</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => router.push(`/soil-data/${latestRecommendation.soilDataId}`)}
                >
                  View Details
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/devices/${id}`}>Manage</Link>
        </Button>
        
        {readingsCount > 0 && !latestRecommendation && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={isLoadingRecommendation ? undefined : fetchLatestRecommendation}
            disabled={isLoadingRecommendation}
          >
            {isLoadingRecommendation && (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            )}
            Check ML Insights
          </Button>
        )}
        
        {readingsCount > 0 && !latestRecommendation && !isLoadingRecommendation && (
          <Button 
            variant="default" 
            size="sm"
            onClick={generateRecommendation}
            disabled={isGeneratingRecommendation}
          >
            {isGeneratingRecommendation && (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            )}
            Generate Recommendation
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
        </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/devices/${id}`}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}

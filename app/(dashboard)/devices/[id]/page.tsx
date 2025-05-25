"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Battery,
  Signal,
  Wifi,
  Leaf,
  BarChart3,
  Settings,
  Trash2,
  Clock,
  Loader2,
  ServerCrash,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";

interface SoilData {
  id: string;
  timestamp: string;
  pH: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  moisture: number;
  temperature: number;
}

interface MLRecommendation {
  id: string;
  recommendedCrop: string;
  confidence: number;
  alternatives: any[];
  advice: {
    growing: string;
    fertilization: string;
    irrigation: string;
  };
  timestamp: string;
}

export default function DeviceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [device, setDevice] = useState<any>(null);
  const [soilData, setSoilData] = useState<SoilData[]>([]);
  const [recommendations, setRecommendations] = useState<MLRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load device data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch device details
        const deviceResponse = await axios.get(`/api/devices/${id}`);
        if (deviceResponse.data.device) {
          setDevice(deviceResponse.data.device);
          
          // If it's a soil sensor, fetch soil data
          if (deviceResponse.data.device.deviceType === "SOIL_SENSOR") {
            // Fetch soil data for this device
            const soilDataResponse = await axios.get(`/api/soil-data?deviceId=${id}&limit=5`);
            if (soilDataResponse.data.soilData) {
              setSoilData(soilDataResponse.data.soilData);
              
              // If there's soil data, check for ML recommendations
              if (soilDataResponse.data.soilData.length > 0) {
                const latestSoilDataId = soilDataResponse.data.soilData[0].id;
                const recResponse = await axios.get(`/api/ml-recommendation?soilDataId=${latestSoilDataId}`);
                if (recResponse.data.recommendations) {
                  setRecommendations(recResponse.data.recommendations);
                }
              }
            }
          }
        }
      } catch (error: any) {
        console.error("Error fetching device details:", error);
        setError(error.response?.data?.error || "Failed to load device details");
        toast({
          title: "Error",
          description: "Failed to load device details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id, toast]);
  
  const generateRecommendation = async () => {
    if (!soilData.length) {
      toast({
        title: "No Soil Data",
        description: "This device doesn't have any soil data yet",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsGeneratingRecommendation(true);
      
      // Generate recommendation for the latest soil data
      const latestSoilDataId = soilData[0].id;
      const response = await axios.post('/api/ml-recommendation', {
        soilDataId: latestSoilDataId
      });
      
      if (response.data.recommendation) {
        // Add the new recommendation to the list
        setRecommendations([response.data.recommendation, ...recommendations]);
        
        toast({
          title: "Success",
          description: "ML recommendation generated successfully",
        });
      }
    } catch (error: any) {
      console.error("Error generating recommendation:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to generate ML recommendation",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingRecommendation(false);
    }
  };
  
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
  
  const formatLastActive = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return "Unknown";
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/devices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Devices
            </Link>
          </Button>
          <Skeleton className="h-8 w-[250px]" />
        </div>
        
        <div className="grid gap-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }
  
  if (error || !device) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/devices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Devices
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ServerCrash className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Device Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || "The requested device could not be found."}
            </p>
            <Button onClick={() => router.push("/devices")}>
              Return to Devices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link href="/devices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Devices
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{device.name}</h1>
          <p className="text-muted-foreground">
            ID: {device.deviceId} • {device.farm?.name || "Unknown Farm"}
          </p>
        </div>
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Device Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Device Information</CardTitle>
              <Badge className={getStatusColor(device.status)}>{device.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Type:</span>
                <span>{device.deviceType?.replace(/_/g, ' ') || "Unknown"}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Last Active:</span>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{device.lastActive ? formatLastActive(device.lastActive) : "Never"}</span>
                </div>
              </div>
              
              {device.batteryLevel !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Battery:</span>
                  <div className="flex items-center">
                    <Battery className={`h-4 w-4 mr-1 ${getBatteryColor(device.batteryLevel)}`} />
                    <span className={getBatteryColor(device.batteryLevel)}>
                      {device.batteryLevel}%
                    </span>
                  </div>
                </div>
              )}
              
              {device.signalStrength !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Signal:</span>
                  <div className="flex items-center">
                    <Signal className="h-4 w-4 mr-1" />
                    <span>{device.signalStrength}%</span>
                  </div>
                </div>
              )}
              
              {device.macAddress && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">MAC Address:</span>
                  <span className="font-mono text-xs">{device.macAddress}</span>
                </div>
              )}
              
              {device.firmwareVersion && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Firmware:</span>
                  <span>{device.firmwareVersion}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </CardFooter>
        </Card>
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {device.deviceType === "SOIL_SENSOR" ? (
            <>
              {/* Soil Data Section */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                      Soil Data
                    </CardTitle>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  <CardDescription>
                    Recent soil measurements from this sensor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {soilData.length > 0 ? (
                    <div className="space-y-4">
                      {/* Latest Reading Summary */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <div className="text-2xl font-bold">{soilData[0].pH.toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground">pH</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <div className="text-2xl font-bold">{soilData[0].moisture}%</div>
                          <div className="text-xs text-muted-foreground">Moisture</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <div className="text-2xl font-bold">{soilData[0].temperature}°C</div>
                          <div className="text-xs text-muted-foreground">Temperature</div>
                        </div>
                      </div>
                      
                      {/* NPK Values */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">NPK Values</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 bg-muted/50 rounded-lg text-center">
                            <div className="text-lg font-bold">{soilData[0].nitrogen}</div>
                            <div className="text-xs text-muted-foreground">Nitrogen</div>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg text-center">
                            <div className="text-lg font-bold">{soilData[0].phosphorus}</div>
                            <div className="text-xs text-muted-foreground">Phosphorus</div>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg text-center">
                            <div className="text-lg font-bold">{soilData[0].potassium}</div>
                            <div className="text-xs text-muted-foreground">Potassium</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* View All Button */}
                      <div className="flex justify-center">
                        <Button variant="link" size="sm" asChild>
                          <Link href={`/soil-data?deviceId=${id}`}>
                            View All Soil Data
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <HelpCircle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No soil data available for this device yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* ML Recommendations Section */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      <Leaf className="h-5 w-5 mr-2 text-green-600" />
                      ML Crop Recommendations
                    </CardTitle>
                    {soilData.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={generateRecommendation}
                        disabled={isGeneratingRecommendation}
                      >
                        {isGeneratingRecommendation && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Generate New
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    AI-powered crop suggestions based on soil analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recommendations.length > 0 ? (
                    <Tabs defaultValue={recommendations[0].id} className="w-full">
                      <TabsList className="mb-4 w-full">
                        {recommendations.slice(0, 3).map((rec, index) => (
                          <TabsTrigger key={rec.id} value={rec.id}>
                            {index === 0 ? "Latest" : `Recommendation ${index + 1}`}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      
                      {recommendations.slice(0, 3).map((rec) => (
                        <TabsContent key={rec.id} value={rec.id} className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">{rec.recommendedCrop}</h3>
                            <Badge className={`${rec.confidence >= 80 ? 'bg-green-500' : rec.confidence >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}>
                              {Math.round(rec.confidence)}% Confidence
                            </Badge>
                          </div>
                          
                          {rec.alternatives && rec.alternatives.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Alternative Crops</h4>
                              <div className="flex flex-wrap gap-2">
                                {rec.alternatives.slice(0, 3).map((alt: any, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {typeof alt === 'string' ? alt : alt.crop}
                                    {typeof alt !== 'string' && alt.probability && ` (${Math.round(alt.probability)}%)`}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {rec.advice && (
                            <div className="space-y-4 mt-4">
                              <h4 className="text-sm font-medium">Growing Advice</h4>
                              
                              {rec.advice.growing && (
                                <div className="p-3 bg-muted/50 rounded-lg">
                                  <p className="text-sm">{rec.advice.growing}</p>
                                </div>
                              )}
                              
                              {rec.advice.fertilization && (
                                <>
                                  <h4 className="text-sm font-medium">Fertilization Tips</h4>
                                  <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="text-sm">{rec.advice.fertilization}</p>
                                  </div>
                                </>
                              )}
                              
                              {rec.advice.irrigation && (
                                <>
                                  <h4 className="text-sm font-medium">Irrigation Schedule</h4>
                                  <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="text-sm">{rec.advice.irrigation}</p>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                          
                          <div className="text-right text-xs text-muted-foreground mt-4">
                            Generated: {new Date(rec.timestamp).toLocaleString()}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  ) : soilData.length > 0 ? (
                    <div className="text-center py-6">
                      <Leaf className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground mb-4">No ML recommendations available yet.</p>
                      <Button 
                        onClick={generateRecommendation}
                        disabled={isGeneratingRecommendation}
                      >
                        {isGeneratingRecommendation && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Generate Recommendation
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <AlertTriangle className="h-10 w-10 mx-auto text-amber-500 mb-2" />
                      <p className="text-muted-foreground">
                        No soil data available. ML recommendations require soil data.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Device Data</CardTitle>
                <CardDescription>
                  {device.deviceType?.replace(/_/g, ' ')} data visualization
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <HelpCircle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-1">
                    Data visualization for {device.deviceType?.replace(/_/g, ' ')} is not available yet.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Check back later for updates.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 
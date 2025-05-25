"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import {
  AlertTriangle,
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  Droplets,
  Loader2,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

// Define types for weather data
interface Farm {
  id: string;
  name: string;
  location: string;
}

interface WeatherAlert {
  id: string;
  type: string;
  severity: string;
  message: string;
  details: string;
}

interface CurrentWeather {
  id: string;
  farmId: string;
  date: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  conditions: string;
  icon: string;
  farm: {
    name: string;
    location: string;
  };
}

interface ForecastDay {
  id: string;
  date: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  conditions: string;
  icon: string;
  maxTemp: number;
  minTemp: number;
}

interface HistoricalDay {
  id: string;
  date: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  avgTemp: number;
}

// Function to render weather icon
const WeatherIcon = ({ icon }: { icon: string }) => {
  switch (icon) {
    case "sun":
      return <Sun className="h-10 w-10 text-yellow-500" />;
    case "cloud":
      return <Cloud className="h-10 w-10 text-gray-400" />;
    case "cloud-rain":
      return <CloudRain className="h-10 w-10 text-blue-400" />;
    case "cloud-drizzle":
      return <CloudDrizzle className="h-10 w-10 text-blue-300" />;
    case "cloud-lightning":
      return <CloudLightning className="h-10 w-10 text-purple-400" />;
    default:
      return <Cloud className="h-10 w-10 text-gray-400" />;
  }
};

export default function WeatherPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [weatherData, setWeatherData] = useState<{
    current: CurrentWeather | null;
    forecast: ForecastDay[];
    historical: HistoricalDay[];
    alerts: WeatherAlert[];
  }>({
    current: null,
    forecast: [],
    historical: [],
    alerts: [],
  });

  const { toast } = useToast();

  // Fetch farms
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const response = await axios.get("/api/farms");
        if (response.data.farms && response.data.farms.length > 0) {
          setFarms(response.data.farms);
          setSelectedFarm(response.data.farms[0].id);
        }
      } catch (error) {
        console.error("Error fetching farms:", error);
        toast({
          title: "Error",
          description: "Failed to fetch farms data",
          variant: "destructive",
        });
      }
    };

    fetchFarms();
  }, [toast]);

  // Fetch weather data when selected farm changes
  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!selectedFarm) return;

      try {
        setIsLoading(true);
        const response = await axios.get(`/api/weather-data?farmId=${selectedFarm}`);
        setWeatherData({
          current: response.data.current,
          forecast: response.data.forecast || [],
          historical: response.data.historical || [],
          alerts: response.data.alerts || [],
        });
      } catch (error) {
        console.error("Error fetching weather data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch weather data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeatherData();
  }, [selectedFarm, toast]);

  // Get selected farm name and location
  const selectedFarmData = farms.find((farm) => farm.id === selectedFarm);
  const farmName = selectedFarmData?.name || "All Farms";
  const farmLocation = selectedFarmData?.location || "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Weather</h1>
        <p className="text-muted-foreground">
          View weather forecasts for your farms
        </p>
      </div>

      {/* Farm selector */}
      <div className="flex flex-wrap gap-2">
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

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : weatherData.current ? (
        <>
          {/* Current weather */}
          <Card className="bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-950 dark:to-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Weather</span>
                <WeatherIcon icon={weatherData.current.icon} />
              </CardTitle>
              <CardDescription>
                {farmName}, {farmLocation} • {formatDate(weatherData.current.date)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col items-center">
                  <Thermometer className="h-6 w-6 text-red-500 mb-1" />
                  <p className="text-3xl font-bold">
                    {weatherData.current.temperature}°C
                  </p>
                  <p className="text-sm text-muted-foreground">Temperature</p>
                </div>
                <div className="flex flex-col items-center">
                  <Droplets className="h-6 w-6 text-blue-500 mb-1" />
                  <p className="text-3xl font-bold">
                    {weatherData.current.humidity}%
                  </p>
                  <p className="text-sm text-muted-foreground">Humidity</p>
                </div>
                <div className="flex flex-col items-center">
                  <Wind className="h-6 w-6 text-gray-500 mb-1" />
                  <p className="text-3xl font-bold">
                    {weatherData.current.windSpeed} km/h
                  </p>
                  <p className="text-sm text-muted-foreground">Wind Speed</p>
                </div>
                <div className="flex flex-col items-center">
                  <CloudRain className="h-6 w-6 text-blue-500 mb-1" />
                  <p className="text-3xl font-bold">
                    {weatherData.current.precipitation}%
                  </p>
                  <p className="text-sm text-muted-foreground">Precipitation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weather tabs */}
          <Tabs defaultValue="forecast" className="space-y-4">
            <TabsList>
              <TabsTrigger value="forecast">7-Day Forecast</TabsTrigger>
              <TabsTrigger value="historical">Historical Data</TabsTrigger>
            </TabsList>

            <TabsContent value="forecast" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
                {weatherData.forecast.length > 0 ? (
                  weatherData.forecast.map((day, index) => (
                    <Card key={day.id || index} className="overflow-hidden">
                      <CardHeader className="p-3 bg-muted/50">
                        <CardTitle className="text-sm font-medium">
                          {index === 0
                            ? "Tomorrow"
                            : formatDate(day.date).split(",")[0]}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 text-center">
                        <WeatherIcon icon={day.icon} />
                        <p className="mt-2 font-medium">{day.conditions}</p>
                        <div className="flex justify-between items-center mt-3">
                          <p className="text-red-500">{day.maxTemp}°</p>
                          <span className="text-xs text-muted-foreground">|</span>
                          <p className="text-blue-500">{day.minTemp}°</p>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Humidity</p>
                            <p>{day.humidity}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rain</p>
                            <p>{day.precipitation}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Cloud className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <p className="text-muted-foreground">No forecast data available</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="historical" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historical Weather Data</CardTitle>
                  <CardDescription>Past 7 days weather trends</CardDescription>
                </CardHeader>
                <CardContent>
                  {weatherData.historical.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 px-4 text-left font-medium">Date</th>
                            <th className="py-2 px-4 text-left font-medium">
                              Avg Temp (°C)
                            </th>
                            <th className="py-2 px-4 text-left font-medium">
                              Humidity (%)
                            </th>
                            <th className="py-2 px-4 text-left font-medium">
                              Precipitation (%)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {weatherData.historical.map((day, index) => (
                            <tr key={day.id || index} className="border-b">
                              <td className="py-2 px-4">
                                {index === 0 ? "Yesterday" : formatDate(day.date)}
                              </td>
                              <td className="py-2 px-4">{day.avgTemp}°C</td>
                              <td className="py-2 px-4">{day.humidity}%</td>
                              <td className="py-2 px-4">{day.precipitation}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Cloud className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                      <p className="text-muted-foreground">No historical data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Placeholder for a chart - in a real app, you would use Chart.js or similar */}
              <Card>
                <CardHeader>
                  <CardTitle>Temperature Trends</CardTitle>
                  <CardDescription>
                    Average temperature for the past 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center bg-muted/20">
                  <p className="text-muted-foreground">
                    Temperature chart would be displayed here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Weather alerts */}
          {weatherData.alerts.length > 0 && (
            <Card className="border-amber-500">
              <CardHeader className="bg-amber-50 dark:bg-amber-950/30">
                <CardTitle className="flex items-center text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Weather Alert
                </CardTitle>
                <CardDescription>
                  {weatherData.alerts[0].message}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm">
                  {weatherData.alerts[0].details}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center">
            <Cloud className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Weather Data Available</h3>
            <p className="text-muted-foreground mb-6">
              We couldn't find any weather data for this farm location.
            </p>
            <p className="text-sm text-muted-foreground">
              Weather data is automatically updated daily.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

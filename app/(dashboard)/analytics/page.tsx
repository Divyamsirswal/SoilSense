"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SoilDataChart } from "@/components/soil-data-chart";
import { 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  TrendingDown, 
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

// Define types for analytics data
interface SoilTrend {
  id: string;
  parameter: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: string;
  optimal: boolean;
}

interface FarmPerformance {
  id: string;
  name: string;
  soilHealth: number;
  previousSoilHealth: number;
  soilHealthChange: number;
  recommendationAccuracy: number;
  deviceReliability: number;
}

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

interface Insight {
  id: string;
  title: string;
  description: string;
  priority: string;
}

interface AnalyticsData {
  overallHealth: {
    score: number;
    previousScore: number;
    change: string;
    changePercent: string;
  };
  soilTrends: SoilTrend[];
  farmPerformance: FarmPerformance[];
  soilData: SoilData[];
  insights: Insight[];
}

export default function AnalyticsPage() {
  const [selectedFarm, setSelectedFarm] = useState<string>("");
  const [period, setPeriod] = useState<string>("month");
  const [isLoading, setIsLoading] = useState(true);
  const [farms, setFarms] = useState<{ id: string; name: string }[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    overallHealth: {
      score: 0,
      previousScore: 0,
      change: "0",
      changePercent: "0",
    },
    soilTrends: [],
    farmPerformance: [],
    soilData: [],
    insights: [],
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

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!selectedFarm) return;

      try {
        setIsLoading(true);
        const response = await axios.get(
          `/api/analytics?farmId=${selectedFarm}&period=${period}`
        );
        setAnalyticsData(response.data);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch analytics data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedFarm) {
      fetchAnalyticsData();
    }
  }, [selectedFarm, period, toast]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Get insights from your soil data
        </p>
      </div>

      {/* Farm selector and period selector */}
      <div className="flex flex-wrap justify-between gap-4">
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

        <div className="flex gap-2">
          <button
            onClick={() => handlePeriodChange("week")}
            className={`px-3 py-1 text-sm rounded-full ${
              period === "week"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => handlePeriodChange("month")}
            className={`px-3 py-1 text-sm rounded-full ${
              period === "month"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => handlePeriodChange("year")}
            className={`px-3 py-1 text-sm rounded-full ${
              period === "year"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {analyticsData.soilData.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent className="pt-6">
            <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">No Soil Data Available</h3>
            <p className="text-muted-foreground mb-2">
              We couldn't find any soil data for the selected farm and time period.
            </p>
            <p className="text-sm text-muted-foreground">
              Try selecting a different farm or time period, or add soil data readings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
      {/* Soil Health Score */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle>Overall Soil Health Score</CardTitle>
          <CardDescription>
            Aggregated score based on all soil parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                className="text-muted stroke-current"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
              <circle
                className="text-primary stroke-current"
                strokeWidth="10"
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
                    strokeDasharray={`${
                      2 * Math.PI * 40 * (analyticsData.overallHealth.score / 100)
                    }, ${2 * Math.PI * 40}`}
                strokeDashoffset="0"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-bold">
                    {analyticsData.overallHealth.score}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {analyticsData.overallHealth.score >= 90
                      ? "Excellent"
                      : analyticsData.overallHealth.score >= 75
                      ? "Very Good"
                      : analyticsData.overallHealth.score >= 60
                      ? "Good"
                      : analyticsData.overallHealth.score >= 40
                      ? "Fair"
                      : "Poor"}
                  </span>
                  <div
                    className={`flex items-center ${
                      parseFloat(analyticsData.overallHealth.change) > 0
                        ? "text-green-500"
                        : parseFloat(analyticsData.overallHealth.change) < 0
                        ? "text-red-500"
                        : "text-muted-foreground"
                    } mt-1`}
                  >
                    {parseFloat(analyticsData.overallHealth.change) > 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
                    ) : parseFloat(analyticsData.overallHealth.change) < 0 ? (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    ) : null}
                    <span className="text-xs">
                      {parseFloat(analyticsData.overallHealth.change) > 0
                        ? "+"
                        : ""}
                      {analyticsData.overallHealth.change}%
                    </span>
              </div>
            </div>
          </div>

              {analyticsData.soilTrends.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mt-6 w-full">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                pH Balance
              </p>
                    <p className="font-semibold">
                      {analyticsData.soilTrends.find(
                        (t) => t.parameter === "pH"
                      )?.optimal
                        ? "92%"
                        : "70%"}
                    </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Nutrient Level
              </p>
                    <p className="font-semibold">
                      {analyticsData.soilTrends.filter(
                        (t) =>
                          (t.parameter === "nitrogen" ||
                            t.parameter === "phosphorus" ||
                            t.parameter === "potassium") &&
                          t.optimal
                      ).length >= 2
                        ? "88%"
                        : "65%"}
                    </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Moisture
              </p>
                    <p className="font-semibold">
                      {analyticsData.soilTrends.find(
                        (t) => t.parameter === "moisture"
                      )?.optimal
                        ? "78%"
                        : "60%"}
                    </p>
            </div>
          </div>
              )}
        </CardContent>
      </Card>

      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Soil Parameter Trends</CardTitle>
          <CardDescription>
                Changes in soil parameters over the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {analyticsData.soilTrends.map((trend) => (
              <div
                key={trend.id}
                className="p-4 border rounded-lg flex items-center justify-between"
              >
                <div>
                      <p className="text-sm font-medium">
                        {trend.parameter.charAt(0).toUpperCase() +
                          trend.parameter.slice(1)}
                      </p>
                  <p className="text-2xl font-bold">
                    {trend.currentValue}
                    {trend.parameter === "pH"
                      ? ""
                          : trend.parameter === "temperature"
                      ? "°C"
                          : trend.parameter === "moisture"
                          ? "%"
                      : " ppm"}
                  </p>
                </div>
                <div
                  className={`text-right ${
                    trend.trend === "up"
                      ? trend.optimal
                        ? "text-green-500"
                        : "text-red-500"
                      : trend.optimal
                      ? "text-green-500"
                      : "text-amber-500"
                  }`}
                >
                  <div className="flex items-center">
                    {trend.trend === "up" ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                    <span className="font-medium">
                      {Math.abs(trend.changePercent)}%
                    </span>
                  </div>
                      <p className="text-xs text-muted-foreground">
                        vs last {period}
                      </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Farm Performance */}
          {analyticsData.farmPerformance.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle>Farm Performance</CardTitle>
          <CardDescription>
            Comparative performance metrics for your farms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4 text-left font-medium">Farm</th>
                  <th className="py-3 px-4 text-left font-medium">
                    Soil Health
                  </th>
                  <th className="py-3 px-4 text-left font-medium">Change</th>
                  <th className="py-3 px-4 text-left font-medium">
                    Recommendation Accuracy
                  </th>
                  <th className="py-3 px-4 text-left font-medium">
                    Device Reliability
                  </th>
                </tr>
              </thead>
              <tbody>
                      {analyticsData.farmPerformance.map((farm) => (
                  <tr key={farm.id} className="border-b">
                    <td className="py-3 px-4 font-medium">{farm.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span
                          className={`w-3 h-3 rounded-full mr-2 ${
                            farm.soilHealth >= 90
                              ? "bg-green-500"
                              : farm.soilHealth >= 70
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                        ></span>
                        {farm.soilHealth}%
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div
                        className={`flex items-center ${
                          farm.soilHealthChange > 0
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {farm.soilHealthChange > 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {Math.abs(farm.soilHealthChange)}%
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {farm.recommendationAccuracy}%
                    </td>
                    <td className="py-3 px-4">{farm.deviceReliability}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
          )}

      {/* Data Visualizations */}
      <Tabs defaultValue="parameters" className="space-y-4">
        <TabsList>
          <TabsTrigger value="parameters">Parameter Trends</TabsTrigger>
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
        </TabsList>

        <TabsContent
          value="parameters"
          className="space-y-4 grid gap-4 md:grid-cols-2"
        >
          <SoilDataChart
                data={analyticsData.soilData}
            parameter="pH"
            title="pH Trend Analysis"
            description="Changes in soil pH over time"
          />
          <SoilDataChart
                data={analyticsData.soilData}
            parameter="moisture"
            title="Moisture Trend Analysis"
            description="Changes in soil moisture over time"
          />
          <SoilDataChart
                data={analyticsData.soilData}
            parameter="nitrogen"
            title="Nitrogen Trend Analysis"
            description="Changes in nitrogen levels over time"
          />
          <SoilDataChart
                data={analyticsData.soilData}
            parameter="temperature"
            title="Temperature Trend Analysis"
            description="Changes in soil temperature over time"
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
                {analyticsData.insights.map((insight) => (
              <Card
                key={insight.id}
                className={`border-l-4 ${
                  insight.priority === "high"
                    ? "border-l-red-500"
                    : insight.priority === "medium"
                    ? "border-l-amber-500"
                    : "border-l-green-500"
                }`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{insight.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{insight.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
              <CardDescription>
                Suggested steps to improve soil health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                    {analyticsData.soilTrends
                      .filter((trend) => !trend.optimal)
                      .slice(0, 3)
                      .map((trend, index) => (
                        <li key={trend.id} className="flex items-start">
                  <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-2 mt-0.5">
                            {index + 1}
                  </span>
                  <div>
                            <p className="font-medium">
                              {trend.parameter === "pH"
                                ? "Adjust Soil pH"
                                : trend.parameter === "nitrogen"
                                ? "Apply Nitrogen Fertilizer"
                                : trend.parameter === "phosphorus"
                                ? "Apply Phosphate Fertilizer"
                                : trend.parameter === "potassium"
                                ? "Apply Potash Fertilizer"
                                : trend.parameter === "moisture"
                                ? "Adjust Irrigation Schedule"
                                : "Monitor Soil Temperature"}
                            </p>
                    <p className="text-sm text-muted-foreground">
                              {trend.parameter === "pH" && trend.currentValue < 6.0
                                ? "Apply lime to increase soil pH to the optimal range (6.0-7.5)."
                                : trend.parameter === "pH" && trend.currentValue > 7.5
                                ? "Apply sulfur to decrease soil pH to the optimal range (6.0-7.5)."
                                : trend.parameter === "nitrogen" && trend.currentValue < 30
                                ? "Increase nitrogen fertilization by applying nitrogen-rich fertilizers."
                                : trend.parameter === "phosphorus" && trend.currentValue < 20
                                ? "Apply phosphate fertilizers to increase phosphorus levels."
                                : trend.parameter === "potassium" && trend.currentValue < 150
                                ? "Apply potash fertilizers to increase potassium levels."
                                : trend.parameter === "moisture" && trend.currentValue < 50
                                ? "Increase watering frequency to improve soil moisture levels."
                                : trend.parameter === "moisture" && trend.currentValue > 70
                                ? "Reduce irrigation and improve drainage to prevent waterlogging."
                                : trend.parameter === "temperature" && trend.currentValue > 30
                                ? "Apply mulch to regulate soil temperature and reduce heat stress."
                                : "Monitor and maintain current levels."}
                    </p>
                  </div>
                </li>
                      ))}

                    {/* Add default action if there are no non-optimal parameters */}
                    {analyticsData.soilTrends.filter((t) => !t.optimal).length === 0 && (
                <li className="flex items-start">
                  <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-2 mt-0.5">
                          1
                  </span>
                  <div>
                    <p className="font-medium">
                            Maintain Current Practices
                    </p>
                    <p className="text-sm text-muted-foreground">
                            Continue with your current soil management practices as all parameters are within optimal ranges.
                    </p>
                  </div>
                </li>
                    )}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
  );
}

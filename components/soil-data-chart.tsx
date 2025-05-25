"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate, formatNumber } from "@/lib/utils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SoilDataEntry {
  timestamp: string;
  pH: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  moisture: number;
  temperature: number;
}

interface SoilDataChartProps {
  data: SoilDataEntry[];
  title?: string;
  description?: string;
  parameter:
    | "pH"
    | "nitrogen"
    | "phosphorus"
    | "potassium"
    | "moisture"
    | "temperature";
}

export function SoilDataChart({
  data,
  title = "Soil Parameter",
  description = "Historical values over time",
  parameter = "pH",
}: SoilDataChartProps) {
  // Get parameter-specific settings
  const getChartSettings = () => {
    const settings = {
      pH: {
        label: "pH Level",
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        min: 0,
        max: 14,
        unit: "",
      },
      nitrogen: {
        label: "Nitrogen (N)",
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        min: 0,
        max: 100,
        unit: "ppm",
      },
      phosphorus: {
        label: "Phosphorus (P)",
        borderColor: "rgba(255, 159, 64, 1)",
        backgroundColor: "rgba(255, 159, 64, 0.2)",
        min: 0,
        max: 100,
        unit: "ppm",
      },
      potassium: {
        label: "Potassium (K)",
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        min: 0,
        max: 300,
        unit: "ppm",
      },
      moisture: {
        label: "Moisture",
        borderColor: "rgba(0, 123, 255, 1)",
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        min: 0,
        max: 100,
        unit: "%",
      },
      temperature: {
        label: "Temperature",
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        min: 0,
        max: 50,
        unit: "°C",
      },
    };
    return settings[parameter];
  };

  const settings = getChartSettings();

  // Format data for the chart
  const sortedData = [...data].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const chartData = {
    labels: sortedData.map((entry) => formatDate(entry.timestamp)),
    datasets: [
      {
        label: settings.label,
        data: sortedData.map((entry) => entry[parameter]),
        borderColor: settings.borderColor,
        backgroundColor: settings.backgroundColor,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: settings.min,
        max: settings.max,
        title: {
          display: true,
          text: `${settings.label} ${settings.unit}`,
        },
      },
      x: {
        title: {
          display: true,
          text: "Date",
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  // Get the current value (latest reading)
  const currentValue =
    sortedData.length > 0 ? sortedData[sortedData.length - 1][parameter] : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Current Value
            </p>
            <p className="text-2xl font-bold">
              {formatNumber(currentValue)} {settings.unit}
            </p>
          </div>
          <div className="text-sm text-right">
            <p className="font-medium text-muted-foreground">Last Updated</p>
            <p>
              {sortedData.length > 0
                ? formatDate(sortedData[sortedData.length - 1].timestamp)
                : "N/A"}
            </p>
          </div>
        </div>
        <div className="h-80">
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

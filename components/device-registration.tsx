"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, QrCode, Copy, Check, Wand2 } from "lucide-react";
import QRCode from "qrcode.react";

interface Farm {
  id: string;
  name: string;
}

interface Zone {
  id: string;
  name: string;
}

interface DeviceRegistrationProps {
  farmId: string;
  farmName: string;
  zones?: Zone[];
  serverUrl: string;
}

export function DeviceRegistration({
  farmId,
  farmName,
  zones = [],
  serverUrl,
}: DeviceRegistrationProps) {
  const { toast } = useToast();
  const [deviceName, setDeviceName] = useState(
    `NPK_Sensor_${Math.floor(Math.random() * 1000)}`
  );
  const [deviceId, setDeviceId] = useState(
    `ESP32_NPK_${Math.floor(Math.random() * 10000)}`
  );
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("qrcode");

  // Generate configuration data
  const generateConfigData = () => {
    return {
      ssid: "YOUR_WIFI_SSID",
      password: "YOUR_WIFI_PASSWORD",
      serverUrl:
        serverUrl || "https://your-soilguardian-domain.com/api/devices/connect",
      deviceId: deviceId,
      farmId: farmId,
      zoneId: selectedZone || undefined,
      deviceName: deviceName,
    };
  };

  // Generate Arduino code with the configuration
  const generateArduinoCode = () => {
    const config = generateConfigData();
    return `
// SoilGuardian ESP32 Configuration
// Auto-generated for farm: ${farmName}

// WiFi credentials - Replace with your network details
const char *ssid = "${config.ssid}";
const char *password = "${config.password}";

// SoilGuardian API endpoint
const char *serverUrl = "${config.serverUrl}";

// Device information
const char *deviceId = "${config.deviceId}";  // Unique device ID
const char *farmId = "${config.farmId}";      // Farm ID from SoilGuardian
const char *deviceName = "${config.deviceName}"; // Device name
${
  config.zoneId
    ? `const char *zoneId = "${config.zoneId}";      // Zone ID\n`
    : ""
}
`;
  };

  // Handle copy to clipboard
  const handleCopy = () => {
    const configCode = generateArduinoCode();
    navigator.clipboard.writeText(configCode);
    setCopied(true);
    toast({
      title: "Configuration copied!",
      description: "Paste this into your ESP32 code.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle download configuration
  const handleDownload = () => {
    const configCode = generateArduinoCode();
    const blob = new Blob([configCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soilguardian_config_${farmName
      .replace(/\s+/g, "_")
      .toLowerCase()}.h`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Configuration downloaded",
      description: "Include this file in your ESP32 project.",
    });
  };

  // Generate a random device name and ID
  const generateRandomDevice = () => {
    setDeviceName(`NPK_Sensor_${Math.floor(Math.random() * 1000)}`);
    setDeviceId(`ESP32_NPK_${Math.floor(Math.random() * 10000)}`);

    toast({
      title: "New device details generated",
      description: "A unique device name and ID have been created.",
    });
  };

  // Format JSON config for QR code
  const jsonConfig = JSON.stringify(generateConfigData());

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Device Registration</CardTitle>
        <CardDescription>
          Connect a new NPK sensor to {farmName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="qrcode">QR Code Setup</TabsTrigger>
            <TabsTrigger value="manual">Manual Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="qrcode" className="space-y-4">
            <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-muted/30">
              <QRCode
                value={jsonConfig}
                size={200}
                level="M"
                className="mb-4"
              />
              <p className="text-sm text-center text-muted-foreground">
                Scan this QR code with the SoilGuardian ESP32 setup app
              </p>
            </div>
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={generateRandomDevice}
                className="w-full sm:w-auto"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Generate New Device
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="deviceName">Device Name</Label>
                <Input
                  id="deviceName"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="NPK Sensor 1"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deviceId">Device ID</Label>
                <Input
                  id="deviceId"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="ESP32_NPK_001"
                />
              </div>

              {zones.length > 0 && (
                <div className="grid gap-2">
                  <Label htmlFor="zone">Zone (Optional)</Label>
                  <Select value={selectedZone} onValueChange={setSelectedZone}>
                    <SelectTrigger id="zone">
                      <SelectValue placeholder="Select a zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific zone</SelectItem>
                      {zones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="p-4 bg-muted rounded-md">
                <pre className="text-xs overflow-auto whitespace-pre-wrap">
                  {generateArduinoCode()}
                </pre>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleCopy} className="flex-1">
                  {copied ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy Configuration"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Config
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col text-sm text-muted-foreground">
        <p>
          Note: This will register a new NPK sensor for this farm. Follow the
          ESP32 setup instructions in the HARDWARE_SETUP.md guide.
        </p>
      </CardFooter>
    </Card>
  );
}

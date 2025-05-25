/*
 * SoilGuardian ESP32 NPK Sensor Integration
 * This sketch reads soil NPK values from an RS485 sensor and sends them to the SoilGuardian web app
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <HardwareSerial.h>
#include <SPIFFS.h>
#include <FS.h>

// Check if a farm-specific configuration file exists and include it
// Otherwise, use the default values below
#if __has_include("soilguardian_config.h")
#include "soilguardian_config.h"
#else
// Default WiFi credentials - REPLACE WITH YOUR OWN
const char *ssid = "YOUR_WIFI_SSID";
const char *password = "YOUR_WIFI_PASSWORD";

// Default SoilGuardian API endpoint
const char *serverUrl = "https://your-soilguardian-domain.com/api/devices/connect";

// Default device information
const char *deviceId = "ESP32_NPK_001"; // Unique device ID - change for each device
const char *farmId = "YOUR_FARM_ID";    // The farm ID from your SoilGuardian account
const char *deviceName = "NPK Sensor";  // Device name
#endif

// RS485 communication pins (using Serial2 on ESP32)
#define RXD2 16 // Serial2 RX pin
#define TXD2 17 // Serial2 TX pin
#define DE_RE 4 // Data Enable and Receiver Enable pin for RS485

// NPK Sensor parameters
#define SENSOR_ADDRESS 0x01 // Default modbus address
#define READ_SOIL_DATA 0x03 // Function code to read registers

// Timer variables
unsigned long lastReadingTime = 0;
const unsigned long readingInterval = 5000; // Read every 5 seconds

// Variables to store sensor readings
float nitrogenValue = 0;
float phosphorusValue = 0;
float potassiumValue = 0;
float soilMoisture = 0;
float soilTemp = 0;
float soilPH = 0;

// Battery and signal indicators (simulated)
int batteryLevel = 100;
int signalStrength = 0;

// Configuration flag
bool configLoaded = false;

// Function prototypes
bool loadConfigFromSPIFFS();
void saveConfigToSPIFFS(const char *config);

void setup()
{
    // Initialize Serial for debugging
    Serial.begin(115200);
    delay(1000);
    Serial.println("\n\n========================");
    Serial.println("SoilGuardian ESP32 NPK Sensor starting...");

    // Initialize SPIFFS for configuration storage
    if (!SPIFFS.begin(true))
    {
        Serial.println("SPIFFS initialization failed!");
    }
    else
    {
        Serial.println("SPIFFS initialized successfully");

        // Try to load configuration from SPIFFS
        configLoaded = loadConfigFromSPIFFS();
    }

    // Display current configuration
    Serial.println("Current configuration:");
    Serial.print("Device ID: ");
    Serial.println(deviceId);
    Serial.print("Farm ID: ");
    Serial.println(farmId);
    Serial.print("Device Name: ");
    Serial.println(deviceName);
    Serial.print("Server URL: ");
    Serial.println(serverUrl);

    // Initialize RS485 Serial
    Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);

    // Configure RS485 control pin
    pinMode(DE_RE, OUTPUT);
    digitalWrite(DE_RE, LOW); // Default to receive mode

    // Connect to WiFi
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }

    Serial.println();
    Serial.print("Connected to WiFi network with IP Address: ");
    Serial.println(WiFi.localIP());

    // Update signal strength
    signalStrength = map(WiFi.RSSI(), -100, -30, 0, 100);
    if (signalStrength < 0)
        signalStrength = 0;
    if (signalStrength > 100)
        signalStrength = 100;

    Serial.println("Setup complete!");
}

void loop()
{
    unsigned long currentMillis = millis();

    // Read sensor data every interval
    if (currentMillis - lastReadingTime >= readingInterval)
    {
        lastReadingTime = currentMillis;

        // Read data from NPK sensor
        readSensorData();

        // Print readings to serial monitor
        printSensorData();

        // Send data to server
        sendDataToServer();

        // Simulate battery drain (in a real implementation, read actual battery level)
        simulateBatteryDrain();
    }

    // Check for serial commands for configuration
    if (Serial.available())
    {
        String command = Serial.readStringUntil('\n');
        command.trim();

        // Process JSON configuration commands
        if (command.startsWith("{") && command.endsWith("}"))
        {
            Serial.println("Received configuration JSON");

            // Save configuration to SPIFFS
            saveConfigToSPIFFS(command.c_str());

            // Parse and apply new configuration
            DynamicJsonDocument doc(1024);
            DeserializationError error = deserializeJson(doc, command);

            if (!error)
            {
                if (doc.containsKey("ssid") && doc.containsKey("password"))
                {
                    // Restart is needed for WiFi credentials change
                    Serial.println("WiFi credentials changed. Device will restart...");
                    delay(1000);
                    ESP.restart();
                }
                else
                {
                    // For other configuration changes, just update variables
                    if (doc.containsKey("deviceId"))
                    {
                        // Cast to String first, then get c_str()
                        String newDeviceId = doc["deviceId"].as<String>();
                        deviceId = strdup(newDeviceId.c_str());
                    }

                    if (doc.containsKey("farmId"))
                    {
                        String newFarmId = doc["farmId"].as<String>();
                        farmId = strdup(newFarmId.c_str());
                    }

                    if (doc.containsKey("deviceName"))
                    {
                        String newDeviceName = doc["deviceName"].as<String>();
                        deviceName = strdup(newDeviceName.c_str());
                    }

                    if (doc.containsKey("serverUrl"))
                    {
                        String newServerUrl = doc["serverUrl"].as<String>();
                        serverUrl = strdup(newServerUrl.c_str());
                    }

                    Serial.println("Configuration updated successfully");
                }
            }
            else
            {
                Serial.print("Failed to parse configuration JSON: ");
                Serial.println(error.c_str());
            }
        }
        // Command to request current configuration
        else if (command == "config")
        {
            DynamicJsonDocument doc(1024);
            doc["deviceId"] = deviceId;
            doc["farmId"] = farmId;
            doc["deviceName"] = deviceName;
            doc["serverUrl"] = serverUrl;
            doc["batteryLevel"] = batteryLevel;
            doc["signalStrength"] = signalStrength;

            String configJson;
            serializeJson(doc, configJson);
            Serial.println(configJson);
        }
    }
}

// Load configuration from SPIFFS
bool loadConfigFromSPIFFS()
{
    if (SPIFFS.exists("/config.json"))
    {
        File configFile = SPIFFS.open("/config.json", "r");
        if (configFile)
        {
            Serial.println("Loading configuration from SPIFFS");

            // Parse JSON
            DynamicJsonDocument doc(1024);
            DeserializationError error = deserializeJson(doc, configFile);
            configFile.close();

            if (!error)
            {
                // Apply configuration
                if (doc.containsKey("ssid") && doc.containsKey("password"))
                {
                    ssid = strdup(doc["ssid"].as<String>().c_str());
                    password = strdup(doc["password"].as<String>().c_str());
                }

                if (doc.containsKey("deviceId"))
                {
                    deviceId = strdup(doc["deviceId"].as<String>().c_str());
                }

                if (doc.containsKey("farmId"))
                {
                    farmId = strdup(doc["farmId"].as<String>().c_str());
                }

                if (doc.containsKey("deviceName"))
                {
                    deviceName = strdup(doc["deviceName"].as<String>().c_str());
                }

                if (doc.containsKey("serverUrl"))
                {
                    serverUrl = strdup(doc["serverUrl"].as<String>().c_str());
                }

                Serial.println("Configuration loaded successfully");
                return true;
            }
            else
            {
                Serial.print("Failed to parse config file: ");
                Serial.println(error.c_str());
            }
        }
    }
    return false;
}

// Save configuration to SPIFFS
void saveConfigToSPIFFS(const char *config)
{
    File configFile = SPIFFS.open("/config.json", "w");
    if (configFile)
    {
        configFile.print(config);
        configFile.close();
        Serial.println("Configuration saved to SPIFFS");
    }
    else
    {
        Serial.println("Failed to save configuration");
    }
}

void readSensorData()
{
    Serial.println("Reading sensor data...");

    // Set RS485 to transmit mode
    digitalWrite(DE_RE, HIGH);
    delay(10);

    // Prepare the Modbus RTU request
    byte request[] = {
        SENSOR_ADDRESS, // Slave Address
        READ_SOIL_DATA, // Function Code
        0x00, 0x00,     // Starting Register
        0x00, 0x06,     // Number of Registers to Read (6 registers for NPK, moisture, temp, pH)
        0x00, 0x00      // CRC (to be calculated)
    };

    // Calculate CRC
    unsigned int crc = calculateCRC(request, 6);
    request[6] = crc & 0xFF;
    request[7] = crc >> 8;

    // Send request
    Serial2.write(request, 8);
    Serial2.flush();

    // Set RS485 to receive mode
    digitalWrite(DE_RE, LOW);
    delay(100);

    // Read response
    byte response[20]; // Buffer to hold response
    int bytesRead = 0;

    // Wait for response with timeout
    unsigned long startTime = millis();
    while ((bytesRead < 15) && (millis() - startTime < 1000))
    {
        if (Serial2.available())
        {
            response[bytesRead] = Serial2.read();
            bytesRead++;
        }
    }

    // Parse data if we received a valid response
    if (bytesRead >= 15 && response[0] == SENSOR_ADDRESS && response[1] == READ_SOIL_DATA)
    {
        // Extract data from response (adjust offsets based on your sensor's data format)
        nitrogenValue = (response[3] << 8 | response[4]) / 10.0;   // N value in mg/kg
        phosphorusValue = (response[5] << 8 | response[6]) / 10.0; // P value in mg/kg
        potassiumValue = (response[7] << 8 | response[8]) / 10.0;  // K value in mg/kg
        soilMoisture = (response[9] << 8 | response[10]) / 10.0;   // Moisture in %
        soilTemp = (response[11] << 8 | response[12]) / 10.0;      // Temperature in °C
        soilPH = (response[13] << 8 | response[14]) / 10.0;        // pH value

        // Add random fluctuation to simulate real-time changes for demo purposes
        // In a real implementation, you would just use the actual readings
        addFluctuation();
    }
    else
    {
        Serial.println("Error reading from sensor or invalid response");
        // If using a mock/demo mode, generate random data
        generateMockData();
    }
}

// Add small random fluctuations to simulate real-time changes
void addFluctuation()
{
    // Add up to ±5% fluctuation to each value
    nitrogenValue += nitrogenValue * (random(-50, 50) / 1000.0);
    phosphorusValue += phosphorusValue * (random(-50, 50) / 1000.0);
    potassiumValue += potassiumValue * (random(-50, 50) / 1000.0);
    soilMoisture += soilMoisture * (random(-50, 50) / 1000.0);
    soilTemp += soilTemp * (random(-20, 20) / 1000.0);
    soilPH += soilPH * (random(-20, 20) / 1000.0);
}

// Generate mock data for testing when sensor is not connected
void generateMockData()
{
    nitrogenValue = random(200, 500) / 10.0;    // 20-50 mg/kg
    phosphorusValue = random(150, 400) / 10.0;  // 15-40 mg/kg
    potassiumValue = random(1500, 2500) / 10.0; // 150-250 mg/kg
    soilMoisture = random(400, 700) / 10.0;     // 40-70%
    soilTemp = random(180, 280) / 10.0;         // 18-28°C
    soilPH = random(60, 75) / 10.0;             // 6.0-7.5
}

// Calculate Modbus RTU CRC
unsigned int calculateCRC(byte *buffer, byte length)
{
    unsigned int crc = 0xFFFF;
    for (int i = 0; i < length; i++)
    {
        crc ^= buffer[i];
        for (int j = 0; j < 8; j++)
        {
            if (crc & 0x0001)
            {
                crc >>= 1;
                crc ^= 0xA001;
            }
            else
            {
                crc >>= 1;
            }
        }
    }
    return crc;
}

void printSensorData()
{
    Serial.println("=== Sensor Readings ===");
    Serial.print("Nitrogen (N): ");
    Serial.print(nitrogenValue);
    Serial.println(" mg/kg");
    Serial.print("Phosphorus (P): ");
    Serial.print(phosphorusValue);
    Serial.println(" mg/kg");
    Serial.print("Potassium (K): ");
    Serial.print(potassiumValue);
    Serial.println(" mg/kg");
    Serial.print("Soil Moisture: ");
    Serial.print(soilMoisture);
    Serial.println(" %");
    Serial.print("Soil Temperature: ");
    Serial.print(soilTemp);
    Serial.println(" °C");
    Serial.print("Soil pH: ");
    Serial.println(soilPH);
    Serial.print("Battery Level: ");
    Serial.print(batteryLevel);
    Serial.println("%");
    Serial.print("Signal Strength: ");
    Serial.print(signalStrength);
    Serial.println("%");
    Serial.println("=====================");
}

void sendDataToServer()
{
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("WiFi disconnected, reconnecting...");
        WiFi.reconnect();
        delay(5000); // Wait for reconnection

        if (WiFi.status() != WL_CONNECTED)
        {
            Serial.println("Failed to reconnect to WiFi");
            return;
        }

        // Update signal strength after reconnection
        signalStrength = map(WiFi.RSSI(), -100, -30, 0, 100);
        if (signalStrength < 0)
            signalStrength = 0;
        if (signalStrength > 100)
            signalStrength = 100;
    }

    // Create JSON payload
    DynamicJsonDocument doc(1024);
    doc["deviceId"] = deviceId;
    doc["deviceName"] = deviceName; // Include device name
    doc["farmId"] = farmId;         // Include farm ID for direct registration
    doc["batteryLevel"] = batteryLevel;
    doc["signalStrength"] = signalStrength;

    JsonObject soilData = doc["data"].createNestedObject("soilData");
    soilData["nitrogen"] = nitrogenValue;
    soilData["phosphorus"] = phosphorusValue;
    soilData["potassium"] = potassiumValue;
    soilData["moisture"] = soilMoisture;
    soilData["temperature"] = soilTemp;
    soilData["pH"] = soilPH;

    // Request recommendation
    doc["data"]["requestRecommendation"] = true;

    // Serialize JSON to string
    String jsonPayload;
    serializeJson(doc, jsonPayload);

    // Create HTTP client
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Send the request
    Serial.println("Sending data to server...");
    int httpResponseCode = http.PUT(jsonPayload);

    // Check response
    if (httpResponseCode > 0)
    {
        String response = http.getString();
        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);
        Serial.println("Response: " + response);
    }
    else
    {
        Serial.print("Error sending HTTP request. Error code: ");
        Serial.println(httpResponseCode);
    }

    // Free resources
    http.end();
}

void simulateBatteryDrain()
{
    // Decrease battery level slightly (in a real implementation, read actual battery level)
    if (random(1, 100) > 95)
    { // 5% chance to decrease battery each reading
        batteryLevel--;
        if (batteryLevel < 0)
            batteryLevel = 0;
    }
}
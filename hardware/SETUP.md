# 🛠️ SoilGuardian Hardware Setup Guide

This step-by-step guide will help you set up your SoilGuardian soil sensor to start monitoring your farm's soil health in real-time.

## 📋 What You'll Need

![Hardware Components](https://i.imgur.com/placeholder-components.png)

- ESP32 development board
- RS485 to TTL converter module
- NPK soil sensor with RS485 interface
- Micro USB cable
- Power supply (5V for ESP32, check your sensor's requirements)
- Small screwdriver
- Jumper wires

## 🔌 Hardware Assembly

### Step 1: Connect ESP32 to RS485 Module

| ESP32 Pin | RS485 Module Pin | Purpose             |
| --------- | ---------------- | ------------------- |
| 3.3V      | VCC              | Power               |
| GND       | GND              | Ground              |
| GPIO 16   | RO               | Receive Data        |
| GPIO 17   | DI               | Transmit Data       |
| GPIO 4    | DE/RE            | Data Enable/Receive |

![ESP32 to RS485 Connection](https://i.imgur.com/placeholder-esp32-rs485.png)

### Step 2: Connect RS485 Module to NPK Sensor

| RS485 Module | NPK Sensor | Purpose     |
| ------------ | ---------- | ----------- |
| A+           | A+         | Data Line A |
| B-           | B-         | Data Line B |
| GND          | GND        | Ground      |

Make sure to connect the power supply for your NPK sensor according to its specifications (usually 5-12V DC).

![RS485 to Sensor Connection](https://i.imgur.com/placeholder-rs485-sensor.png)

## 💻 Software Setup

### Easy Method: QR Code Setup (Recommended)

1. **Register your device on the SoilGuardian website:**

   - Log in to your account
   - Go to your farm page
   - Click "Add New Sensor"
   - A QR code will appear containing all necessary configuration

2. **Download the firmware:**

   - Click the "Download Firmware" button below the QR code
   - This gives you a pre-configured Arduino sketch

3. **Upload to ESP32:**
   - Install Arduino IDE from [arduino.cc](https://arduino.cc)
   - Install ESP32 board support (Tools → Board → Boards Manager)
   - Install required libraries:
     - ArduinoJson
     - WiFi
     - HTTPClient
     - SPIFFS
   - Open the downloaded sketch
   - Connect ESP32 to your computer via USB
   - Select the correct board and port
   - Click Upload

### Manual Method: Direct Configuration

If you prefer to configure manually:

1. **Download our base firmware:**

   - [Click here to download](https://soilguardian.com/downloads/esp32_firmware.zip)

2. **Get your farm information:**

   - Farm ID (visible in your farm settings)
   - Device Name (choose something descriptive)
   - API endpoint (provided in documentation)

3. **Configure the firmware:**

   - Open `soilguardian_config.h`
   - Update these values:

   ```cpp
   const char *ssid = "YOUR_WIFI_SSID";           // Your WiFi name
   const char *password = "YOUR_WIFI_PASSWORD";   // Your WiFi password
   const char *serverUrl = "https://your-domain.com/api/devices/connect";
   const char *deviceId = "ESP32_NPK_001";        // Choose a unique ID
   const char *farmId = "YOUR_FARM_ID";           // From your farm page
   const char *deviceName = "Field Sensor 1";     // Choose a name
   ```

4. **Upload to ESP32** following the same steps as above

## ✅ Testing Your Setup

### Step 1: Verify Connection

1. Open the Arduino Serial Monitor (115200 baud)
2. You should see:
   - "SoilGuardian ESP32 NPK Sensor starting..."
   - "Connected to WiFi network with IP Address: xxx.xxx.xxx.xxx"
   - "Reading sensor data..."
   - "Sending data to server..."
   - "Data sent successfully!"

### Step 2: Check the Dashboard

1. Go to your farm page on SoilGuardian
2. Click on the "Devices" tab
3. Your device should appear within 1-2 minutes
4. Click on it to view real-time soil data

## 🔍 Troubleshooting

### WiFi Connection Issues

- **Problem**: ESP32 can't connect to WiFi
- **Solutions**:
  - Double-check SSID and password
  - Ensure ESP32 is within range of your WiFi
  - Try a mobile hotspot as a test

### Sensor Reading Issues

- **Problem**: "Error reading from sensor" message
- **Solutions**:
  - Verify all wiring connections
  - Check sensor power supply
  - Try swapping A/B connections (sometimes they're reversed)
  - Make sure sensor is properly inserted in soil

### Server Connection Issues

- **Problem**: "HTTP error" message
- **Solutions**:
  - Verify serverUrl is correct
  - Check farmId is valid
  - Ensure your internet connection is working

## 📱 Mobile App Configuration

For easier setup, download our companion app:

- [Android App](https://play.google.com/store/apps/details?id=com.soilguardian.companion)
- [iOS App](https://apps.apple.com/app/soilguardian-companion/id1234567890)

The app allows you to:

- Scan QR codes to configure devices
- Set up WiFi credentials easily
- Monitor sensor status
- Update firmware wirelessly


**Remember**: Place your sensor in representative soil for your field, away from unusual conditions (like very wet areas or recently fertilized spots) for the most accurate readings.

Happy farming with SoilGuardian! 🌱

# SoilGuardian Hardware Setup Guide

This guide explains how to set up the hardware components for SoilGuardian's real-time soil monitoring system using ESP32, RS485, and NPK sensors.

## Components Required

- ESP32 development board (NodeMCU ESP32 or similar)
- RS485 to TTL converter module (MAX485 or similar)
- NPK soil sensor with RS485 interface
- Breadboard and jumper wires
- 5V power supply
- Micro USB cable for programming ESP32
- Optional: LiPo battery for portable operation
- Optional: Waterproof case for outdoor deployment

## Setup Methods

There are two ways to configure your SoilGuardian sensor:

### 1. Mobile App Setup (Recommended)

The easiest way to set up your device is using the SoilGuardian Companion App:

1. Download the SoilGuardian Companion App from the App Store or Google Play
2. In the SoilGuardian web app, navigate to your farm
3. Click on "Devices" tab, then "Register New Device"
4. Generate a QR code for your farm
5. Use the Companion App to scan the QR code
6. Follow the app instructions to connect to your ESP32 device
7. The app will automatically configure the device for your farm

This method automatically handles:

- Device registration with your farm
- WiFi configuration
- Server URL setup
- Unique device ID generation

### 2. Manual Setup

If you prefer manual setup, follow these steps:

#### Wiring Diagram

Connect the components as follows:

### ESP32 to RS485 Module

| ESP32 Pin | RS485 Module Pin                    |
| --------- | ----------------------------------- |
| 3.3V/5V   | VCC                                 |
| GND       | GND                                 |
| GPIO 16   | RO (Receiver Out)                   |
| GPIO 17   | DI (Data In)                        |
| GPIO 4    | DE/RE (Data Enable/Receiver Enable) |

### RS485 Module to NPK Sensor

| RS485 Module Pin | NPK Sensor |
| ---------------- | ---------- |
| A                | A+         |
| B                | B-         |
| GND              | GND        |

## Hardware Assembly Steps

1. **Prepare the Breadboard**

   - Mount the ESP32 and RS485 module on the breadboard
   - Connect power and ground rails

2. **Connect the ESP32 to RS485 Module**

   - Connect ESP32 GPIO pins to the RS485 module as shown in the table above
   - Make sure to use the correct voltage levels (3.3V or 5V depending on your modules)

3. **Connect RS485 to NPK Sensor**

   - Connect A and B lines from RS485 module to NPK sensor's corresponding terminals
   - Ensure proper polarity (A to A+, B to B-)
   - Connect GND if required by your sensor

4. **Verify Power Requirements**
   - NPK sensors typically require 5-12V DC power
   - Connect power supply according to your sensor's specifications
   - You may need a separate power supply for the sensor if it requires more than what ESP32 can provide

## Firmware Installation

1. Install the Arduino IDE and ESP32 board support package
2. Install required libraries:

   - WiFi
   - HTTPClient
   - ArduinoJson
   - HardwareSerial (included with ESP32 core)
   - SPIFFS (for configuration storage)
   - BLE (for mobile app connection)

3. Configure the Arduino IDE:

   - Select the correct board (e.g., "ESP32 Dev Module")
   - Select the correct port
   - Set upload speed to 115200 bps

4. **Configuration Options:**

   a. **Auto-Configuration via Web App:**

   - Navigate to your farm in the SoilGuardian web app
   - Click "Devices" tab, then "Register New Device"
   - Click "Download Configuration" to get a pre-configured header file
   - Place this file in your Arduino project folder as `soilguardian_config.h`

   b. **Manual Configuration:**

   - Open the `esp32_npk_sensor.ino` file from the `scripts` directory
   - Edit the configuration variables:
     ```cpp
     const char* ssid = "YOUR_WIFI_SSID";
     const char* password = "YOUR_WIFI_PASSWORD";
     const char* serverUrl = "https://your-soilguardian-domain.com/api/devices/connect";
     const char* deviceId = "ESP32_NPK_001"; // Change this for each device
     const char* farmId = "YOUR_FARM_ID";    // Get this from your SoilGuardian account
     ```

5. Upload the sketch to your ESP32

## NPK Sensor Configuration

Most RS485 NPK sensors use Modbus RTU protocol with specific register mappings. The default configuration in our code assumes:

- Default Modbus address: 0x01
- Read function code: 0x03
- Register mapping:
  - Nitrogen: Registers 0-1
  - Phosphorus: Registers 2-3
  - Potassium: Registers 4-5
  - Moisture: Registers 6-7
  - Temperature: Registers 8-9
  - pH: Registers 10-11

If your sensor uses a different mapping, you'll need to adjust the code in the `readSensorData()` function.

## Remote Configuration

The updated firmware supports remote configuration through:

1. **Serial Console** - Send JSON configuration via the Arduino Serial Monitor:

   ```json
   { "deviceId": "NEW_ID", "farmId": "FARM_ID", "deviceName": "My Sensor" }
   ```

2. **Configuration Storage** - Device settings are saved to SPIFFS and persist through power cycles

3. **BLE Configuration** - Using the SoilGuardian Companion App, you can configure devices wirelessly

## Testing the Setup

1. Power up the ESP32 and sensor
2. Open the Serial Monitor in Arduino IDE (115200 baud)
3. You should see:
   - WiFi connection status
   - Sensor reading attempts
   - Data values (either real or simulated if no sensor is detected)
   - Server communication status
4. Type `config` in the Serial Monitor to see current configuration

## Troubleshooting

### No Sensor Readings

- Check all wiring connections
- Verify sensor power supply
- Ensure correct RS485 polarity (A/B lines)
- Try swapping A/B lines if communication fails
- Check sensor Modbus address (may need to be changed in code)

### ESP32 Connection Issues

- Verify WiFi credentials
- Check server URL
- Ensure farmId is correct
- Check device registration status in SoilGuardian platform

### Data Quality Issues

- Place sensor properly in soil (follow sensor manufacturer guidelines)
- Ensure sensor is calibrated if required
- Clean sensor probes if readings are unstable

### Configuration Issues

- If using the companion app, ensure Bluetooth is enabled
- For QR code setup, make sure the code is clearly visible and well-lit
- If manually configuring, verify the farmId is copied correctly from the web app

## Real-Time Data Visualization

Once your hardware is set up and sending data, you can view real-time NPK values on your SoilGuardian dashboard. The system supports:

- Live updates as new readings arrive
- Trend visualization with time-series charts
- Value fluctuation tracking
- Alert generation for out-of-range values

## Deployment Considerations

For field deployment:

1. Use a waterproof enclosure for the ESP32 and electronics
2. Consider using a solar panel and battery for power
3. Ensure good WiFi coverage or use ESP32 with cellular connectivity
4. Position the sensor at the appropriate soil depth
5. Label each device with its deviceId for easy identification

## Power Optimization

To extend battery life:

1. Increase the reading interval (adjust `readingInterval` in the code)
2. Implement deep sleep between readings
3. Use power-efficient components
4. Consider lowering the WiFi transmit power if signal is strong enough

## Maintenance

Regular maintenance ensures accurate readings:

1. Check battery levels regularly
2. Clean sensor probes as recommended by the manufacturer
3. Verify calibration periodically
4. Check for corrosion or water ingress in the enclosure
5. Update firmware as new versions become available

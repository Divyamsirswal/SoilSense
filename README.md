# SoilGuardian: Smart Farm Monitoring System

SoilGuardian is a full-stack smart farming solution that combines IoT sensors, real-time soil monitoring, and AI-powered crop recommendations to help farmers make data-driven decisions.

![SoilGuardian Dashboard](blank)

## 🌱 Features

- **Farm Management**: Register and manage multiple farms with location tracking
- **Soil Monitoring**: Real-time NPK (Nitrogen, Phosphorus, Potassium) tracking
- **Weather Integration**: Local weather forecasts for your farms
- **AI Recommendations**: Get crop suggestions based on your soil conditions
- **IoT Integration**: Connect ESP32-based soil sensors for automated data collection
- **Data Visualization**: Beautiful charts and analytics for soil health

## 🚀 Getting Started

### Website Access

1. Visit [soon](soon)
2. Create an account or log in
3. Add your farm details
4. Start monitoring your soil health!

### Hardware Setup (ESP32 + NPK Sensor)

Connect a soil sensor to start getting real-time data from your farm. No coding required!

#### What You'll Need

- ESP32 development board
- RS485 to TTL converter module
- NPK soil sensor with RS485 interface
- Micro USB cable for programming

#### Easy Setup Process

1. **Register your sensor on the website**

   - Go to your farm page
   - Click "Add New Sensor"
   - You'll get a QR code with all necessary configuration

2. **Connect the hardware**

   - Wire the ESP32 to RS485 converter:
     - ESP32 GPIO16 → RS485 RO
     - ESP32 GPIO17 → RS485 DI
     - ESP32 GPIO4 → RS485 DE/RE
   - Connect RS485 converter to NPK sensor:
     - RS485 A+ → Sensor A+
     - RS485 B- → Sensor B-

3. **Upload the firmware**

   - Download our pre-configured firmware from the website
   - Use Arduino IDE to upload it to your ESP32
   - No coding needed - configuration is automatic!

4. **Power it up**
   - Connect the ESP32 to power
   - Place the sensor in your soil
   - Watch real-time data appear on your dashboard!

## 📊 Dashboard Guide

The dashboard gives you a complete view of your farm's health:

- **Overview**: Quick status of all your farms
- **Soil Data**: Detailed NPK levels, moisture, pH, and temperature
- **Weather**: Current and forecasted conditions
- **Recommendations**: AI-powered suggestions for crops and fertilizers
- **Devices**: Monitor all your connected sensors

## 🛠️ Technical Details

### System Architecture

SoilGuardian uses a modern tech stack:

- **Frontend**: Next.js 14 with React
- **Backend**: Next.js API routes with PostgreSQL database
- **IoT**: ESP32 firmware with RS485/Modbus for NPK sensors
- **Real-time Updates**: Pusher for live data streaming
- **AI**: Machine learning models for crop recommendations

### Data Flow

1. ESP32 sensors read soil data via RS485/Modbus
2. Data is sent to our API via WiFi
3. Backend processes and stores readings
4. Real-time updates appear on your dashboard
5. AI models generate recommendations based on soil conditions

## 📱 Mobile Support

Access SoilGuardian from any device:

- Responsive design works on phones, tablets, and desktops
- Progressive Web App (PWA) support for mobile installation
- Mobile-friendly sensor setup with QR code scanning

## 🔧 Troubleshooting

### Sensor Not Connecting?

1. Check that your WiFi details are correct
2. Ensure the sensor is properly powered
3. Verify the wiring connections
4. Make sure the sensor is within WiFi range

### No Data Appearing?

1. Check sensor placement in soil
2. Verify the sensor is connected to the ESP32 correctly
3. Look for LED indicators on the ESP32
4. Restart the sensor by cycling power

## 📞 Support

Need help? We're here for you:

- **Email**: support@soilguardian.com
- **Documentation**: [docs.soilguardian.com](https://docs.soilguardian.com)
- **Community Forum**: [community.soilguardian.com](https://community.soilguardian.com)

## 📄 License

SoilGuardian is open source software licensed under the MIT license.

---

Made with ❤️ by the SoilGuardian Team

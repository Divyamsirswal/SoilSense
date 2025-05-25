# SoilGuardian ESP32 Companion App

This mobile app simplifies the configuration of SoilGuardian ESP32 NPK sensor devices by scanning QR codes generated from the web app.

## Features

- **QR Code Scanning**: Easily scan QR codes from the SoilGuardian web app
- **Device Configuration**: Configure ESP32 devices wirelessly over Bluetooth
- **WiFi Setup**: Help configure WiFi credentials for devices
- **Real-time Monitoring**: View real-time soil data directly from sensors
- **Diagnostics**: Troubleshoot connectivity and sensor issues
- **Firmware Updates**: Update device firmware wirelessly (OTA)

## Technical Architecture

The companion app is built using React Native for cross-platform compatibility (iOS and Android) and communicates with ESP32 devices using Bluetooth Low Energy (BLE).

### Technology Stack

- React Native (with Expo)
- React Native BLE Manager
- React Native Camera (for QR scanning)
- Redux for state management
- AsyncStorage for local data persistence

### Communication Flow

1. User scans QR code from SoilGuardian web app
2. App establishes BLE connection with ESP32 device
3. Configuration data is sent to device
4. Device saves configuration to SPIFFS
5. Device connects to WiFi and begins sending data to the cloud

## Getting Started

### Prerequisites

- Node.js 16+
- React Native CLI or Expo CLI
- Android Studio or Xcode (for building native apps)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/soilguardian-companion.git
cd soilguardian-companion

# Install dependencies
npm install

# Start development server
npm start
```

### Building for Production

```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios
```

## Usage

### Connecting a New Device

1. In the SoilGuardian web app, navigate to a farm and select "Register Device"
2. Generate a QR code for the specific farm
3. In the mobile app, tap "Scan QR Code"
4. Point camera at the QR code
5. Follow the on-screen instructions to connect to the device
6. Enter WiFi credentials if prompted
7. Wait for confirmation that the device is connected
8. Verify device appears in the web app

### Troubleshooting

If you encounter issues with device connection:

1. Ensure the ESP32 is in pairing mode (indicated by blinking LED)
2. Check that Bluetooth is enabled on your mobile device
3. Make sure the device is within range (10-15 feet)
4. Verify the ESP32 has the latest firmware installed
5. Try resetting the ESP32 device

## Development

### Project Structure

```
soilguardian-companion/
├── src/
│   ├── components/     # UI components
│   ├── screens/        # App screens
│   ├── services/       # API and BLE services
│   ├── store/          # Redux store
│   └── utils/          # Helper functions
├── assets/             # Images, fonts, etc.
├── App.js              # Main app component
└── package.json        # Dependencies
```

### Adding New Features

1. Create a feature branch: `git checkout -b feature/new-feature`
2. Implement your changes
3. Write tests
4. Submit a pull request

## ESP32 Integration

The companion app is designed to work with the SoilGuardian ESP32 firmware. The firmware must implement:

1. BLE GATT service with the following characteristics:

   - Configuration: Read/Write (for device settings)
   - WiFi: Write (for WiFi credentials)
   - Status: Read/Notify (for device status)
   - SoilData: Read/Notify (for current soil readings)

2. ESP32 BLE service UUID: `1a1b1c1d-2e2f-3a3b-4c4d-5e5f6a6b7c7d`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

/**
 * SoilGuardian Hardware Simulator
 * 
 * This script simulates an ESP32 device sending soil data to the SoilGuardian API.
 * Use it for demos when physical hardware is unavailable.
 */

const axios = require('axios');

// Configuration (change these values as needed)
const config = {
    deviceId: "DEMO_ESP32_001",
    deviceName: "Demo NPK Sensor",
    farmId: "YOUR_FARM_ID", // ← CHANGE THIS to your actual farm ID
    serverUrl: "http://localhost:3000/api/devices/connect", // Update if your server is on a different URL
    interval: 5000, // milliseconds between data transmissions
    initialValues: {
        nitrogen: 35.2,    // mg/kg
        phosphorus: 24.7,   // mg/kg
        potassium: 195.3,   // mg/kg
        moisture: 52.8,     // %
        temperature: 23.4,  // °C
        pH: 6.8            // pH value
    }
};

// Track battery and signal for realistic simulation
let batteryLevel = 100;
let signalStrength = 95;

// Function to generate simulated soil data with realistic fluctuations
function generateSoilData() {
    // Add random fluctuations to make data look realistic
    const addFluctuation = (value) => {
        // Add up to ±3% fluctuation
        return value + (value * (Math.random() * 0.06 - 0.03));
    };

    // Create base data from initial values with fluctuations
    const soilData = {
        nitrogen: addFluctuation(config.initialValues.nitrogen),
        phosphorus: addFluctuation(config.initialValues.phosphorus),
        potassium: addFluctuation(config.initialValues.potassium),
        moisture: addFluctuation(config.initialValues.moisture),
        temperature: addFluctuation(config.initialValues.temperature),
        pH: addFluctuation(config.initialValues.pH)
    };

    // Occasionally simulate small trends to make data more interesting
    if (Math.random() > 0.8) {
        // 20% chance to adjust the base values slightly for future readings
        const randomFactor = 0.01; // 1% change
        config.initialValues.nitrogen += config.initialValues.nitrogen * (Math.random() * randomFactor * 2 - randomFactor);
        config.initialValues.phosphorus += config.initialValues.phosphorus * (Math.random() * randomFactor * 2 - randomFactor);
        config.initialValues.potassium += config.initialValues.potassium * (Math.random() * randomFactor * 2 - randomFactor);
        config.initialValues.moisture += config.initialValues.moisture * (Math.random() * randomFactor * 2 - randomFactor);
        config.initialValues.temperature += config.initialValues.temperature * (Math.random() * randomFactor * 2 - randomFactor);
        config.initialValues.pH += config.initialValues.pH * (Math.random() * randomFactor * 2 - randomFactor);
    }

    return soilData;
}

// Simulate battery drain and signal fluctuation
function updateDeviceStatus() {
    // Small chance of battery decrease
    if (Math.random() > 0.95) {
        batteryLevel -= 1;
        if (batteryLevel < 0) batteryLevel = 0;
    }

    // Random signal strength fluctuation
    signalStrength = 85 + Math.floor(Math.random() * 15);
    return { batteryLevel, signalStrength };
}

// Send data to the server
async function sendDataToServer() {
    const soilData = generateSoilData();
    const { batteryLevel, signalStrength } = updateDeviceStatus();

    // Create payload in the same format as the ESP32 firmware
    const payload = {
        deviceId: config.deviceId,
        deviceName: config.deviceName,
        farmId: config.farmId,
        batteryLevel,
        signalStrength,
        data: {
            soilData,
            requestRecommendation: true
        }
    };

    console.log("\n📡 Sending soil data to server...");
    console.log("📊 Nitrogen: " + soilData.nitrogen.toFixed(1) + " mg/kg");
    console.log("📊 Phosphorus: " + soilData.phosphorus.toFixed(1) + " mg/kg");
    console.log("📊 Potassium: " + soilData.potassium.toFixed(1) + " mg/kg");
    console.log("📊 Moisture: " + soilData.moisture.toFixed(1) + "%");
    console.log("📊 Temperature: " + soilData.temperature.toFixed(1) + "°C");
    console.log("📊 pH: " + soilData.pH.toFixed(1));
    console.log("🔋 Battery: " + batteryLevel + "%");
    console.log("📶 Signal: " + signalStrength + "%");

    try {
        const response = await axios.put(config.serverUrl, payload);
        console.log("✅ Data sent successfully!");
        console.log("💻 Server response:", response.data);
    } catch (error) {
        console.error("❌ Error sending data:", error.message);
        if (error.response) {
            console.error("📝 Server response:", error.response.data);
        }
    }
}

// Start the simulation
console.log("🌱 SoilGuardian Hardware Simulator");
console.log("--------------------------------");
console.log("Device ID: " + config.deviceId);
console.log("Farm ID: " + config.farmId);
console.log("Server URL: " + config.serverUrl);
console.log("Update interval: " + (config.interval / 1000) + " seconds");
console.log("--------------------------------");
console.log("Press Ctrl+C to stop the simulation");
console.log("--------------------------------");

// Initial data send
sendDataToServer();

// Schedule regular updates
const intervalId = setInterval(sendDataToServer, config.interval);

// Handle exit
process.on('SIGINT', () => {
    clearInterval(intervalId);
    console.log("\n👋 Simulation stopped");
    process.exit(0);
}); 
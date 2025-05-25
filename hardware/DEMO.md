# 🎮 SoilGuardian Hardware Demo Guide

This guide will help you run a complete demonstration of the SoilGuardian system with simulated hardware for your hackathon presentation.

## 🚀 Quick Start (5 minutes)

1. **Start your Next.js app:**

   ```bash
   npm run dev
   ```

2. **Navigate to any farm page in your browser:**

   - Go to `http://localhost:3000/farms` and select any farm
   - Note the farm ID in the URL: `http://localhost:3000/farms/YOUR_FARM_ID`

3. **Open the Demo page:**

   - Go to `http://localhost:3000/demo`
   - Enter your farm ID and click "Start Simulation"

4. **Visit the farm page:**
   - Go back to `http://localhost:3000/farms/YOUR_FARM_ID`
   - You should see real-time data being updated

## 🔍 Alternative Method: Terminal Simulator

If you prefer to run the hardware simulation directly from the terminal:

1. **On Windows:**

   ```bash
   cd scripts
   run-simulator.bat YOUR_FARM_ID
   ```

2. **On Mac/Linux:**
   ```bash
   cd scripts
   chmod +x run-simulator.sh
   ./run-simulator.sh YOUR_FARM_ID
   ```

## 🛠️ How It Works

The simulation creates a complete end-to-end flow:

1. **Hardware Simulation:**

   - The simulator mimics an ESP32 device with an NPK sensor
   - Data values fluctuate realistically to simulate changing soil conditions
   - Battery level slowly decreases over time

2. **Data Transmission:**

   - Simulated data is sent to your API endpoint every 5 seconds
   - The exact same API endpoint is used as with real hardware

3. **Real-time Updates:**
   - The web app receives and processes the data
   - Pusher channels broadcast updates to connected clients
   - Charts and visualizations update in real-time

## 🎭 Presentation Tips

For an effective hackathon presentation:

1. **Start the simulation before your presentation**

   - This ensures data is flowing when you begin

2. **Show both the hardware simulator and charts**

   - Demonstrates the complete data flow

3. **Point out the blinking "status LED"**

   - This visually indicates when data is being transmitted

4. **Highlight fluctuating values**

   - Shows the real-time nature of the system

5. **Mention scalability**
   - Explain how multiple sensors could be deployed across a farm

## 🧑‍💻 Code Locations

If you need to modify the simulation:

- **Hardware Simulator:** `scripts/simulate_hardware.js`
- **Visual Simulator:** `components/hardware-simulation.tsx`
- **Demo Page:** `app/(dashboard)/demo/page.tsx`
- **API Endpoint:** `app/api/devices/connect/route.ts`

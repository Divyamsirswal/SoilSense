# SoilGuardian System Flow Diagram

```mermaid
graph TD
    %% Hardware & Data Collection Layer
    ESP32[ESP32 Device] -->|Reads data via RS485| NPK[NPK Soil Sensor]
    ESP32 -->|Processes & packages data| JSON[JSON Data Payload]
    JSON -->|HTTP PUT Request| API[API Endpoint]

    %% Backend Processing Layer
    API -->|Validates & processes| DB[(PostgreSQL Database)]
    API -->|Real-time broadcast| Pusher[Pusher Channel]
    DB -->|Retrieves historical data| ML[ML Processing]
    ML -->|Generates| Rec[Crop Recommendations]

    %% Frontend Layer
    Pusher -->|Real-time updates| RealTime[Real-time Chart]
    Pusher -->|Updates| Simulation[Hardware Simulation UI]
    DB -->|Fetches farm data| Dashboard[Farm Dashboard]
    Rec -->|Displays on| RecommendationsUI[Recommendations UI]

    %% User Interaction Layer
    Dashboard --> User[Farmer/User]
    RealTime --> User
    Simulation --> User
    RecommendationsUI --> User

    %% Data Flow
    classDef hardware fill:#f96,stroke:#333,stroke-width:2px
    classDef data fill:#9cf,stroke:#333,stroke-width:2px
    classDef backend fill:#9f9,stroke:#333,stroke-width:2px
    classDef frontend fill:#c9f,stroke:#333,stroke-width:2px
    classDef user fill:#fc9,stroke:#333,stroke-width:2px

    class ESP32,NPK hardware
    class JSON,Pusher data
    class API,DB,ML,Rec backend
    class RealTime,Simulation,Dashboard,RecommendationsUI frontend
    class User user
```

## Simplified Data Flow:

1. **Data Collection:**
   ESP32 hardware reads soil data from NPK sensors

2. **Data Transmission:**
   ESP32 sends JSON data to Next.js API endpoint

3. **Data Processing:**

   - Data is stored in PostgreSQL via Prisma
   - Real-time updates sent via Pusher channels
   - ML model generates crop recommendations

4. **Data Visualization:**

   - Real-time charts show current soil conditions
   - Hardware simulation displays device status
   - Dashboard presents farm overview and recommendations

5. **User Interaction:**
   Farmers view data, receive recommendations, and manage farms
